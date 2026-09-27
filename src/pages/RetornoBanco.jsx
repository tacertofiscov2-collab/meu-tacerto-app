/* RETORNOBANCO v3 — sem o botao "Depois": com entrada esperando, so "Conferir agora" */
import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Gauge, Check, AlertCircle } from "lucide-react";

import { supabase } from "@/lib/supabase";
import SimboloPluggy from "@/components/SimboloPluggy";
import {
  statusConexao, listarConexoes, salvarConexao, sincronizar,
  descartarConexaoNova, contarPendentesDaConexao,
} from "@/lib/openfinance";

/* ===================================================================
   RETORNOBANCO — /conectar-banco/retorno (caminho B)

   Depois que a pessoa autoriza no banco e confirma na pagina da
   Pluggy, ela volta para ca. A Pluggy acrescenta ?itemId=... no
   endereco. A tela retoma TUDO sozinha a partir desse itemId — nao
   depende de nada guardado na tela anterior (a ida ao banco foi na
   mesma aba, entao a tela anterior nao existe mais).

   ⚠️ O banco so devolve para endereco https (a Vercel). No PC ou no
   iPhone pelo 192.168.x.x, esta tela so e testada abrindo o endereco
   na mao com um itemId de verdade.

   O QUE ACONTECE AQUI
     1. ESPERA: pergunta o status a cada 3 s ate a Pluggy terminar de
        buscar os dados (UPDATED). Leva uns 40 s. As mensagens mudam
        com o tempo para a pessoa saber que esta andando.
     2. BANCO REPETIDO: se ja existe conexao guardada com o MESMO NOME
        de banco, a nova e apagada NA PLUGGY (vaga paga + entradas em
        dobro) e so a antiga e atualizada. A Pluggy cria conexao nova a
        cada consentimento, mesmo para o mesmo banco.
        Limite conhecido: compara pelo nome.
     3. GUARDA a conexao (salvarConexao) e BUSCA as entradas desde 1º
        de janeiro (sincronizar). Se a pessoa recarregar a pagina, a
        conexao com o mesmo itemId ja guardada e reaproveitada.
     4. RESULTADO: "Achei X entradas desde janeiro" -> Conferir agora
        (/conferir-entradas). v3: o "Depois" saiu — com o portao das
        entradas (DASHBOARD v15), a pessoa confere antes de usar o app
        de qualquer jeito.

   ERROS, em linguagem simples: autorizacao negada no banco, link
   expirado, banco recusou, demora fora do normal, falha nossa ao
   guardar (esse tem "Tentar de novo" que retoma daqui mesmo).

   POR QUE O PROCESSO FICA FORA DO COMPONENTE (mapa `processos`)
   Em modo de desenvolvimento o React monta a tela duas vezes. Sem o
   mapa, a conexao seria processada em dobro. Com ele, as duas
   montagens esperam o MESMO processo.

   PENDENCIAS
     - Se apagar a conexao repetida falhar, ela fica viva na Pluggy
       ocupando vaga (so avisa no console). Resolver com uma faxina no
       servidor quando o webhook existir.
     - (resolvido na v2) "Conferir agora" abre a conferencia agrupada
       por pagador, em /conferir-entradas.
   =================================================================== */

const INTERVALO_STATUS_MS = 3000;
const TEMPO_MAX_ESPERA_MS = 3 * 60 * 1000;
const MAX_FALHAS_SEGUIDAS = 5;

/* Mensagens da espera. Cada uma aparece a partir do tempo indicado. */
const MENSAGENS_ESPERA = [
  { aPartirDe: 0, texto: "Conectando ao banco..." },
  { aPartirDe: 12000, texto: "Buscando suas movimentações..." },
  { aPartirDe: 30000, texto: "Quase pronto..." },
];

/* itemId -> Promise com o resultado (ver comentario no topo) */
const processos = new Map();

/* ---------------------------- ajudantes ---------------------------- */

function esperar(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function normalizar(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/* Traduz o status da Pluggy num motivo de erro (ou null se nao e erro). */
function motivoDoErro(s) {
  const status = String(s?.status || "").toUpperCase();
  const execucao = String(s?.execucao || "").toUpperCase();

  if (/NOT_GRANTED|DENIED|REJECTED|REVOKED/.test(execucao)) return "negado";
  if (/EXPIRED/.test(execucao)) return "expirou";

  // Ainda esperando a pessoa no banco, mas o prazo do link ja passou
  if (status === "WAITING_USER_INPUT" && s?.expiraEm) {
    const expira = new Date(s.expiraEm).getTime();
    if (Number.isFinite(expira) && Date.now() > expira) return "expirou";
  }

  if (status === "LOGIN_ERROR") return "recusado";
  if (status === "OUTDATED" || s?.erro) return "falhou";
  return null;
}

/* O processo inteiro. Devolve sempre um objeto { tipo, ... } — nunca
   lanca erro para fora. */
async function processarRetorno(itemId) {
  try {
    const { data } = await supabase.auth.getUser();
    const user = data?.user;
    if (!user) return { tipo: "sem_login" };

    // 1. Espera a Pluggy terminar
    const inicio = Date.now();
    let falhas = 0;
    let s = null;
    for (;;) {
      if (Date.now() - inicio > TEMPO_MAX_ESPERA_MS) return { tipo: "demorou" };
      try {
        s = await statusConexao(itemId);
        falhas = 0;
      } catch {
        falhas += 1;
        if (falhas >= MAX_FALHAS_SEGUIDAS) return { tipo: "erro", motivo: "falhou" };
        await esperar(INTERVALO_STATUS_MS);
        continue;
      }
      if (String(s?.status || "").toUpperCase() === "UPDATED") break;
      const motivo = motivoDoErro(s);
      if (motivo) return { tipo: "erro", motivo };
      await esperar(INTERVALO_STATUS_MS);
    }

    const banco = s?.banco || "Seu banco";

    // 2. Ja guardada (recarregou a pagina) ou banco repetido?
    const conexoes = await listarConexoes(user.id);
    const mesmoItem = conexoes.find((c) => c.pluggy_item_id === itemId);
    const repetida = mesmoItem
      ? null
      : conexoes.find((c) => normalizar(c.instituicao) === normalizar(banco));

    let conexao;
    if (mesmoItem) {
      conexao = mesmoItem;
    } else if (repetida) {
      try {
        await descartarConexaoNova(itemId);
      } catch {
        try {
          await esperar(1500);
          await descartarConexaoNova(itemId);
        } catch (e) {
          console.warn("Conexão repetida não foi apagada na Pluggy:", itemId, e?.message);
        }
      }
      conexao = repetida;
    } else {
      // 3. Guarda a conexao nova
      conexao = await salvarConexao(user.id, { itemId, instituicao: banco });
    }

    // 3. Busca as entradas desde 1º de janeiro
    let sincronizou = true;
    try {
      await sincronizar(user.id, conexao.id);
    } catch {
      sincronizou = false;
    }

    let pendentes = null;
    try {
      pendentes = await contarPendentesDaConexao(user.id, conexao.id);
    } catch {
      pendentes = null;
    }

    return {
      tipo: repetida ? "repetido" : "conectado",
      banco,
      pendentes: sincronizou ? pendentes : null,
    };
  } catch {
    // o banco autorizou, mas algo nosso falhou (guardar, ler conexoes)
    return { tipo: "erro", motivo: "falhou_app" };
  }
}

function obterProcesso(itemId, recomecar) {
  if (recomecar) processos.delete(itemId);
  if (!processos.has(itemId)) processos.set(itemId, processarRetorno(itemId));
  return processos.get(itemId);
}

/* Textos dos erros. `acao` diz o que o botao principal faz. */
const ERROS = {
  negado: {
    titulo: "Autorização não concluída",
    texto: "Parece que a autorização foi cancelada no banco. Nada foi conectado. Você pode tentar de novo quando quiser.",
    acao: "escolher",
  },
  expirou: {
    titulo: "O pedido de autorização expirou",
    texto: "A autorização no banco precisa ser feita em poucos minutos. É só começar de novo.",
    acao: "escolher",
  },
  recusado: {
    titulo: "O banco não aceitou a conexão",
    texto: "Confira se o CPF ou CNPJ digitado é o mesmo da conta e tente de novo.",
    acao: "escolher",
  },
  falhou: {
    titulo: "Não deu para conectar agora",
    texto: "O banco não respondeu como esperado. Tente de novo em alguns minutos.",
    acao: "escolher",
  },
  falhou_app: {
    titulo: "Quase lá",
    texto: "O banco autorizou, mas não consegui terminar de guardar a conexão. Toque em Tentar de novo.",
    acao: "repetir",
  },
};

/* ============================== TELA ============================== */

export default function RetornoBanco() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const itemId = params.get("itemId") || params.get("item_id") || "";

  const [resultado, setResultado] = useState(null);
  const [tentativa, setTentativa] = useState(0);
  const [inicioEspera, setInicioEspera] = useState(() => Date.now());
  const [agora, setAgora] = useState(() => Date.now());
  const tentativaIniciada = useRef(-1);

  /* Roda (ou reaproveita) o processo desta conexao. */
  useEffect(() => {
    if (!itemId) {
      setResultado({ tipo: "sem_item" });
      return undefined;
    }
    let vivo = true;
    const recomecar = tentativaIniciada.current !== tentativa && tentativa > 0;
    tentativaIniciada.current = tentativa;
    setResultado(null);
    setInicioEspera(Date.now());
    obterProcesso(itemId, recomecar).then((r) => {
      if (vivo) setResultado(r);
    });
    return () => { vivo = false; };
  }, [itemId, tentativa]);

  /* Relogio das mensagens da espera. */
  useEffect(() => {
    if (resultado) return undefined;
    const id = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(id);
  }, [resultado]);

  const decorrido = agora - inicioEspera;
  const mensagem = [...MENSAGENS_ESPERA].reverse().find((m) => decorrido >= m.aPartirDe)?.texto
    || MENSAGENS_ESPERA[0].texto;

  const irPara = (caminho) => navigate(caminho, { replace: true });
  const repetir = () => setTentativa((t) => t + 1);

  return (
    <div
      className="tela-rolavel w-full flex flex-col"
      style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
    >
      <style>{`
        @keyframes retornoGira { to { transform: rotate(360deg); } }
        @keyframes retornoMsg {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes retornoAparece {
          from { opacity: 0; transform: scale(0.96); }
          to   { opacity: 1; transform: scale(1); }
        }
        .retorno-anel { animation: retornoGira 1.1s linear infinite; }
        .retorno-msg { animation: retornoMsg 400ms ease-out; }
        .retorno-resultado { animation: retornoAparece 320ms cubic-bezier(0.22,0.61,0.36,1); }
        @media (prefers-reduced-motion: reduce) {
          .retorno-anel, .retorno-msg, .retorno-resultado { animation: none; }
        }
      `}</style>

      <div
        className="conteudo-rolavel hide-scrollbar px-5"
        style={{
          paddingTop: 24,
          paddingBottom: "calc(24px + env(safe-area-inset-bottom))",
          display: "flex",
          flexDirection: "column",
          flex: "1 1 auto",
          minHeight: 0,
        }}
      >
        <div
          className="max-w-sm w-full mx-auto"
          style={{ marginTop: "auto", marginBottom: "auto", flexShrink: 0 }}
        >
          {!resultado ? (
            <Espera mensagem={mensagem} />
          ) : resultado.tipo === "conectado" || resultado.tipo === "repetido" ? (
            <Sucesso resultado={resultado} irPara={irPara} />
          ) : resultado.tipo === "demorou" ? (
            <Aviso
              titulo="Está demorando mais que o normal"
              texto="O banco ainda não terminou de enviar os dados. Você pode esperar mais um pouco."
              principal={{ rotulo: "Continuar esperando", aoTocar: repetir }}
              secundario={{ rotulo: "Voltar ao início", aoTocar: () => irPara("/dashboard") }}
            />
          ) : resultado.tipo === "sem_login" ? (
            <Aviso
              titulo="Entre na sua conta"
              texto="Para terminar de conectar o banco, entre na sua conta do TaCerto neste aparelho."
              principal={{ rotulo: "Entrar", aoTocar: () => irPara("/login") }}
            />
          ) : resultado.tipo === "sem_item" ? (
            <Aviso
              titulo="Não encontrei a conexão"
              texto="Volte e comece de novo pela tela Escolha seu banco."
              principal={{ rotulo: "Escolher banco", aoTocar: () => irPara("/conectar-banco/escolher") }}
              secundario={{ rotulo: "Voltar ao início", aoTocar: () => irPara("/dashboard") }}
            />
          ) : (
            (() => {
              const e = ERROS[resultado.motivo] || ERROS.falhou;
              return (
                <Aviso
                  titulo={e.titulo}
                  texto={e.texto}
                  principal={{
                    rotulo: "Tentar de novo",
                    aoTocar: e.acao === "repetir" ? repetir : () => irPara("/conectar-banco/escolher"),
                  }}
                  secundario={{ rotulo: "Voltar", aoTocar: () => irPara("/conectar-banco") }}
                />
              );
            })()
          )}
        </div>
      </div>
    </div>
  );
}

/* ========================== PECAS DA TELA ========================== */

function Espera({ mensagem }) {
  return (
    <div className="flex flex-col items-center text-center">
      <span className="relative flex items-center justify-center" style={{ width: 96, height: 96 }}>
        <span
          aria-hidden
          className="retorno-anel absolute inset-0 rounded-full"
          style={{ border: "3px solid var(--border)", borderTopColor: "var(--primary)" }}
        />
        <span
          className="flex items-center justify-center rounded-full"
          style={{ width: 76, height: 76, backgroundColor: "var(--surface)" }}
        >
          <Gauge size={38} strokeWidth={2.2} style={{ color: "var(--primary)" }} />
        </span>
      </span>

      <p
        key={mensagem}
        className="retorno-msg font-semibold"
        style={{ fontSize: 18, marginTop: 24, color: "var(--text)" }}
        aria-live="polite"
      >
        {mensagem}
      </p>
      <p className="text-[13.5px]" style={{ color: "var(--text-secondary)", marginTop: 8 }}>
        Pode levar até 1 minuto. Não feche esta tela.
      </p>

      <div className="flex items-center justify-center gap-2" style={{ marginTop: 36 }}>
        <SimboloPluggy altura={11} />
        <p className="text-[11.5px]" style={{ color: "var(--text-tertiary)" }}>
          Conexão feita pela Pluggy, regulada pelo Banco Central.
        </p>
      </div>
    </div>
  );
}

function Sucesso({ resultado, irPara }) {
  const { tipo, banco, pendentes } = resultado;
  const repetido = tipo === "repetido";

  let texto;
  if (pendentes === null || pendentes === undefined) {
    texto = "A conexão está guardada. As entradas vão aparecer em instantes para você conferir.";
  } else if (pendentes > 0) {
    texto = `Achei ${pendentes} ${pendentes === 1 ? "entrada" : "entradas"} desde janeiro esperando você conferir. Nada entra no seu faturamento sem você confirmar.`;
  } else {
    texto = "Ainda não achei entradas desde janeiro nesta conta. Quando cair alguma, ela aparece aqui para você conferir.";
  }
  if (repetido) {
    texto = `Não criei uma conexão nova, só atualizei a que você já tinha. ${texto}`;
  }

  const temParaConferir = typeof pendentes === "number" && pendentes > 0;

  return (
    <div className="retorno-resultado flex flex-col items-center text-center">
      <span
        className="flex items-center justify-center rounded-full"
        style={{ width: 76, height: 76, backgroundColor: "rgba(34,197,94,0.14)" }}
      >
        <Check size={38} strokeWidth={2.6} style={{ color: "var(--primary)" }} />
      </span>

      <h1 className="font-bold" style={{ fontSize: 22, marginTop: 20, color: "var(--text)" }}>
        {repetido ? "Esse banco já estava conectado" : "Banco conectado!"}
      </h1>

      <span
        className="inline-flex items-center rounded-full text-[13px] font-semibold"
        style={{
          marginTop: 10,
          padding: "5px 12px",
          border: "1px solid var(--border)",
          color: "var(--text-secondary)",
        }}
      >
        {banco}
      </span>

      <p
        className="text-[14.5px] leading-relaxed"
        style={{ color: "var(--text-secondary)", marginTop: 14 }}
      >
        {texto}
      </p>

      <div className="w-full" style={{ marginTop: 28 }}>
        {temParaConferir ? (
          <>
            <BotaoPrincipal rotulo="Conferir agora" aoTocar={() => irPara("/conferir-entradas")} />
          </>
        ) : (
          <BotaoPrincipal rotulo="Voltar ao início" aoTocar={() => irPara("/dashboard")} />
        )}
      </div>
    </div>
  );
}

function Aviso({ titulo, texto, principal, secundario }) {
  return (
    <div className="retorno-resultado flex flex-col items-center text-center">
      <span
        className="flex items-center justify-center rounded-full"
        style={{ width: 76, height: 76, backgroundColor: "rgba(239,68,68,0.12)" }}
      >
        <AlertCircle size={36} strokeWidth={2.2} style={{ color: "var(--danger)" }} />
      </span>

      <h1 className="font-bold" style={{ fontSize: 21, marginTop: 20, color: "var(--text)" }}>
        {titulo}
      </h1>
      <p
        className="text-[14.5px] leading-relaxed"
        style={{ color: "var(--text-secondary)", marginTop: 10 }}
      >
        {texto}
      </p>

      <div className="w-full" style={{ marginTop: 28 }}>
        {principal && <BotaoPrincipal rotulo={principal.rotulo} aoTocar={principal.aoTocar} />}
        {secundario && <BotaoSecundario rotulo={secundario.rotulo} aoTocar={secundario.aoTocar} />}
      </div>
    </div>
  );
}

function BotaoPrincipal({ rotulo, aoTocar }) {
  return (
    <button
      onClick={aoTocar}
      className="w-full py-3.5 rounded-2xl font-semibold transition active:scale-[0.99]"
      style={{
        backgroundColor: "var(--primary)",
        color: "var(--primary-contrast)",
        fontSize: 16,
        lineHeight: "22px",
      }}
    >
      {rotulo}
    </button>
  );
}

function BotaoSecundario({ rotulo, aoTocar }) {
  return (
    <button
      onClick={aoTocar}
      className="w-full py-3.5 rounded-2xl font-semibold transition active:scale-[0.99]"
      style={{
        marginTop: 10,
        border: "1px solid var(--border)",
        backgroundColor: "transparent",
        color: "var(--text)",
        fontSize: 15,
        lineHeight: "22px",
      }}
    >
      {rotulo}
    </button>
  );
}