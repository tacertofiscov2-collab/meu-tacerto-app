/* CONFERIRENTRADAS v14 — no fim sempre passa pelos gastos em duvida (/conferir-saidas), tambem quando veio pelo portao do Inicio (v13: no lugar do Sim/Não, 6 respostas curtas (É frete/serviço, Reembolso de despesa, Vale-pedágio, Empréstimo, Estorno/devolução, Dinheiro meu/família); a sugerida pelo extrato vem com borda verde fina; grava a categoria; o que conta e lancado sem contar duas vezes (lancamento a mao igual e ajuste do total do ano); vindo do extrato, segue para os gastos (v12: "Fisco.ia" vira "Fisco" nos textos da tela (so a Apresentacao do Fisco.ia mantem o nome) (v11: "Fisco" vira "Fisco.ia" nos textos da tela (v10: explicacao enquadrada: icone no topo, passos centralizados, botao no pe da tela))) */
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ChevronDown, ChevronUp, ChevronLeft, Check, Loader2, AlertCircle, ListChecks, X,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import { useAppState } from "@/context/AppStateContext";
import {
  organizarPelasRegras, salvarRegra, classificarGrupo, nomeParaDescricao,
} from "@/lib/openfinance";
import {
  categoriasEntrada, entradaConta, sugerirCategoriaEntrada,
} from "@/lib/categorias";
import { lancarEntradasConfirmadas } from "@/lib/importarExtrato";

/* ===================================================================
   CONFERIRENTRADAS v13 (10/10/2026 — tarefa de 08-10, Etapa 3)

   O QUE MUDOU
   - A pergunta continua "É faturamento?", mas a resposta e uma de 6
     (src/lib/categorias.js — regras do HANDOFF-08-10):
       CONTA:     É frete/serviço · Reembolso de despesa
       NAO CONTA: Vale-pedágio · Empréstimo · Estorno/devolução ·
                  Dinheiro meu/família
     (MEI comum: "É venda/serviço" e sem "Vale-pedágio".) A categoria fica
     gravada na entrada.
   - AGRUPAMENTO: por pagador, como antes, MAS as entradas cuja descricao
     ja diz o que sao (vale-pedagio, estorno, emprestimo, resgate...)
     ficam num grupo proprio do mesmo pagador, com a resposta SUGERIDA
     (borda verde fina). A mesma transportadora paga frete E
     vale-pedagio, e so o frete conta.
   - REGRA DO PAGADOR: o que conta (frete/servico ou reembolso) vira
     regra "faturamento" para o documento — da proxima vez o mesmo
     pagador entra sozinho (sugerido pelo que a pessoa ja disse). O que
     nao conta NAO vira regra (um engano nunca esconde faturamento).
   - NADA CONTADO DUAS VEZES: o que conta e lancado por
     lancarEntradasConfirmadas (src/lib/importarExtrato.js): se a pessoa
     ja tinha lancado a mao o mesmo valor (ate 3 dias), nao lanca de
     novo; e o "Ajuste do total do ano" diminui o que ja estava nele.
   - Vindo do "Enviar extrato" (state.de = "extrato"), no fim segue para
     a conferencia dos GASTOS (/conferir-saidas), que so pergunta o que
     estiver em duvida.
   =================================================================== */

/* ===================================================================
   CONFERIRENTRADAS — /conferir-entradas

   v10 (27/09/2026): explicacao enquadrada na tela inteira:
     - icone de "conferir" (lista com checks) logo abaixo do titulo
     - os 3 passos centralizados (o bloco inteiro no meio da tela)
     - "Por exemplo:" FORA do quadro, logo acima dele
     - o "Sim" do quadro em branco (antes verde)
     - o meio fica centralizado na altura e o botao "Entendi, vamos
       lá" desce para perto da barra de baixo

   v9 (27/09/2026): o quadro do Sim/Não ganhou o titulo "Por exemplo:".

   v8 (27/09/2026): explicacao em PASSO A PASSO (variacao "B", escolhida
     pelo Fernando entre tres mostradas no chat):
       1 Veja quem te pagou        — Nome, valor e datas
       2 Responda: é faturamento?  — Sim ou Não
       3 O Fisco aprende           — Da próxima vez, entra sozinho
     e, embaixo, um quadro pequeno com o que e Sim e o que e Não.

   v7 (27/09/2026): a explicacao estava "baguncada" (texto centralizado
     quebrando em lugares ruins, paragrafos corridos). Redesenho:
       - no topo, centralizado: uma linha de contexto e a PERGUNTA em
         destaque ("É faturamento?"), do jeito que ela vai aparecer
       - dois cards alinhados a esquerda, cada um com a "pilula" do
         botao (Sim verde / Não contorno), a regra em uma linha e os
         exemplos em ETIQUETAS ("Por exemplo: serviço · frete · vendas")
       - as duas dicas em linhas com icone, em vez de um paragrafo
     Tudo continua cabendo na tela do iPhone com o botao.

   v6 (27/09/2026): textos do Sim/Não da explicacao no formato
     "..., por exemplo: ...", como o Fernando pediu.

   v5 (27/09/2026): a explicacao da primeira vez nao cabia no iPhone
     (o botao "Entendi, vamos lá" ficava atras da barra do Safari).
     Icone menor, textos e espacos mais enxutos, dica mais curta.

   v4 (27/09/2026)
     - "Novas entradas" grande e centralizado (e o "1 de 7" tambem).
     - EXPLICACAO SO NA PRIMEIRA VEZ: antes da primeira pergunta, uma
       tela explica o que a pessoa vai responder e o jeito certo
       (Sim = pagamento de cliente pelo trabalho; Não = transferencia
       entre contas proprias, presente, emprestimo, reembolso).
       "Primeira vez" = a pessoa NUNCA teve entrada conferida (nenhuma
       entrada fora de "pendente"). Vem do banco de dados, entao vale
       em qualquer aparelho, sem coluna nova. Depois da primeira
       conferencia, a explicacao nao aparece mais.

   v3 (27/09/2026) — CARA DE COMPROVANTE
     O card do pagador virou um "comprovante": pagador com documento
     MASCARADO como os bancos fazem (CNPJ 12.345.•••/••01-90,
     CPF •••.654.321-••), picote no meio, e as linhas Entradas /
     Periodo / Meio / Total recebido. So aparece o que o banco mandou;
     o que faltar some sem deixar campo vazio.

   v2 (27/09/2026) — BASICO E MINIMALISTA (pedido do Fernando)
     - UMA pergunta por pagador: "É faturamento?"  [Sim] [Não]
     - sem tela de abertura e sem explicacao: abre direto na 1a pergunta
     - a pessoa NAO sai antes de terminar (sem seta de voltar, sem
       "deixar para depois"). O Dashboard manda para ca sempre que ha
       entrada nova esperando (o "portao" — ver DASHBOARD v15). So
       depois de confirmar tudo ela usa o app normalmente.
     - Sim -> todas as entradas do pagador viram faturamento e o Fisco
       aprende (da proxima vez, as entradas dele ja chegam organizadas)
     - Não -> ficam de fora e NAO vira regra: a mesma pessoa pode virar
       cliente depois, entao da proxima vez pergunta de novo. (Assim um
       "Não" por engano nunca esconde faturamento para sempre.)
     - WhatsApp: quando as confirmacoes tambem acontecerem por la, esta
       tela ja respeita — ela so pergunta o que ainda esta pendente no
       banco. (A integracao em si fica para depois.)

   AGRUPAMENTO (desde a v1)
     - com documento do pagador: pelo CPF/CNPJ (o mesmo pagador aparece
       como "TRANSPORTES ALMEIDA LTDA" e "TRANSP ALMEIDA")
     - sem documento (deposito, algumas TEDs): pela descricao do
       extrato, sem numeros ("TED RECEBIDA 001 AG 1234" -> "TED RECEBIDA")
     - ordem: POR DATA — o pagador da entrada mais antiga primeiro

   AS RESPOSTAS SO SAO GRAVADAS NO FIM
     Por isso o "Anterior" deixa trocar a resposta sem desfazer nada no
     banco. A gravacao usa classificarGrupo, que nunca duplica
     lancamento.

   Abre por: portao do Dashboard, faixa "X entradas esperando voce"
   (Lancar) e "Conferir agora" (tela de volta do banco).
   =================================================================== */

/* ---------------------------- ajudantes ---------------------------- */

function reais(v) {
  return (
    "R$ " +
    Number(v || 0).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

function diaMes(iso) {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/* Documento mascarado, como nos comprovantes dos bancos:
   CNPJ 12.345.•••/••01-90  |  CPF •••.654.321-•• */
function mascararDocumento(doc) {
  const d = String(doc || "").replace(/\D/g, "");
  if (d.length === 14) return `CNPJ ${d.slice(0, 2)}.${d.slice(2, 5)}.•••/••${d.slice(10, 12)}-${d.slice(12)}`;
  if (d.length === 11) return `CPF •••.${d.slice(3, 6)}.${d.slice(6, 9)}-••`;
  return "";
}

/* "PIX" -> "Pix", "DEPOSITO" -> "Depósito"... */
const NOMES_MEIO = {
  PIX: "Pix",
  TED: "TED",
  DOC: "DOC",
  BOLETO: "Boleto",
  DEPOSITO: "Depósito",
  TRANSFER: "Transferência",
  TRANSFERENCIA: "Transferência",
  CREDIT_CARD: "Cartão",
  DEBIT_CARD: "Cartão",
  CARTAO: "Cartão",
};

function nomeMeio(meio) {
  const chave = String(meio || "").toUpperCase().replace(/[^A-Z_]/g, "");
  if (!chave) return "";
  return NOMES_MEIO[chave] || chave.charAt(0) + chave.slice(1).toLowerCase();
}

function meiosDoGrupo(g) {
  return [...new Set(g.entradas.map((e) => nomeMeio(e.meio)).filter(Boolean))].join(" · ");
}

/* "05/03 a 02/09" ou "em 17/06" */
function periodoCurto(g) {
  const a = diaMes(g.primeira.toISOString());
  const b = diaMes(g.ultima.toISOString());
  return a === b ? `em ${a}` : `${a} a ${b}`;
}

/* Descricao do extrato sem numeros nem ruido, para agrupar quem nao
   tem documento: "TED RECEBIDA 001 AG 1234" -> "TED RECEBIDA". */
function chaveDescricao(desc) {
  return String(desc || "")
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[0-9]/g, " ")
    .replace(/[^A-Z ]/g, " ")
    .replace(/\b(AG|CC|CONTA|DOC|NR|N)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function montarGrupos(entradas, tipoMEI) {
  const mapa = new Map();

  for (const e of entradas) {
    const doc = String(e.pagador_documento || "").replace(/\D/g, "");
    /* v13: o que o extrato ja diz que NAO e faturamento fica num grupo
       proprio do mesmo pagador, com a resposta sugerida */
    const sugestao = e.categoria || sugerirCategoriaEntrada(e.descricao, tipoMEI) || null;
    const base = doc ? `doc:${doc}` : `desc:${chaveDescricao(e.descricao) || "SEM DESCRICAO"}`;
    const chave = sugestao ? `${base}|${sugestao}` : base;
    if (!mapa.has(chave)) {
      mapa.set(chave, {
        chave,
        documento: doc,
        tipoDoc: doc.length === 14 ? "CNPJ" : doc.length === 11 ? "CPF" : null,
        sugestao,
        entradas: [],
      });
    }
    mapa.get(chave).entradas.push(e);
  }

  const grupos = [...mapa.values()].map((g) => {
    const total = g.entradas.reduce((s, e) => s + (Number(e.valor) || 0), 0);
    // o nome mais completo: "TRANSPORTES ALMEIDA LTDA" ganha de "TRANSP ALMEIDA"
    const nomes = g.entradas
      .map((e) => String(e.pagador_nome || "").trim())
      .filter(Boolean)
      .sort((a, b) => b.length - a.length);
    const nome = nomes[0]
      ? nomeParaDescricao(nomes[0])
      : nomeParaDescricao(chaveDescricao(g.entradas[0].descricao) || "Recebimento");
    const datas = g.entradas.map((e) => new Date(e.data)).sort((a, b) => a - b);
    const entradasOrdenadas = [...g.entradas].sort((a, b) => new Date(a.data) - new Date(b.data));
    return {
      ...g,
      entradas: entradasOrdenadas,
      total,
      nome,
      primeira: datas[0],
      ultima: datas[datas.length - 1],
    };
  });

  // Por data: quem pagou primeiro no ano vem primeiro
  grupos.sort((a, b) => a.primeira - b.primeira);
  return grupos;
}

/* ============================== TELA ============================== */

export default function ConferirEntradas() {
  const navigate = useNavigate();
  const location = useLocation();
  const app = useAppState();
  const { tipoMEI } = app;
  /* v13: estado ATUAL do app para lancar sem contar duas vezes */
  const appRef = useRef(app);
  appRef.current = app;

  // Para onde vai no fim: a faixa de Lancar volta para Lancar; o resto
  // passa pelos GASTOS em duvida (v14: tambem quando quem trouxe para ca
  // foi o portao do Inicio, depois do "Depois" do extrato). Sem gasto em
  // duvida, a /conferir-saidas volta sozinha para o Inicio.
  const de = location.state?.de;
  const destinoFinal = de === "lancar" ? "/lancar" : "/conferir-saidas";
  const irParaODestino = () => navigate(destinoFinal, { replace: true });

  // carregando | explicacao | pergunta | salvando | fim | erro
  const [fase, setFase] = useState("carregando");
  const [userId, setUserId] = useState(null);
  const [grupos, setGrupos] = useState([]);
  const [indice, setIndice] = useState(0);
  const [respostas, setRespostas] = useState({}); // chave -> id da categoria
  const [listaAberta, setListaAberta] = useState(false);
  const [faturado, setFaturado] = useState(0);
  const [jaLancadas, setJaLancadas] = useState(0);
  const [erro, setErro] = useState({ texto: "", tipo: "" }); // tipo: carregar | salvar

  // O que ja foi gravado entre uma tentativa e outra (nao repete)
  const salvosRef = useRef({});
  const faturadoRef = useRef(0);
  const casadosRef = useRef(0);
  const absorvidoRef = useRef(0);
  const [jaNoTotal, setJaNoTotal] = useState(0);
  const opcoes = categoriasEntrada(tipoMEI);

  /* Organiza o que o Fisco ja sabe e agrupa o resto. Sem nada para
     conferir, segue direto (nao mostra tela nenhuma). */
  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        const user = data?.user;
        if (!user) {
          navigate("/dashboard", { replace: true });
          return;
        }
        if (ativo) setUserId(user.id);

        const { pendentes } = await organizarPelasRegras(user.id, {
          tipoMEI: appRef.current.tipoMEI,
          aoConfirmar: (efetivas) => lancarEntradasConfirmadas(user.id, efetivas, () => appRef.current),
        });
        if (!ativo) return;

        const g = montarGrupos(pendentes, appRef.current.tipoMEI);
        if (!g.length) {
          irParaODestino();
          return;
        }
        // Primeira conferencia da vida? (nenhuma entrada ja conferida)
        let primeiraVez = false;
        try {
          const { count } = await supabase
            .from("entradas")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id)
            .neq("status", "pendente");
          primeiraVez = (count || 0) === 0;
        } catch {
          primeiraVez = false; // na duvida, nao atrapalha
        }
        if (!ativo) return;

        setGrupos(g);
        setFase(primeiraVez ? "explicacao" : "pergunta");
      } catch {
        if (ativo) {
          setErro({ texto: "Não foi possível carregar as entradas agora.", tipo: "carregar" });
          setFase("erro");
        }
      }
    })();
    return () => { ativo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Grava as respostas ainda nao gravadas. Lanca erro se falhar — o
     que ja foi gravado fica marcado e nao repete. */
  /* v13: as que contam sao juntadas e lancadas DE UMA VEZ no fim
     (lancarEntradasConfirmadas), mesmo se um grupo do meio falhar — o
     "finally" garante que nada confirmado fica sem lancamento. */
  async function gravar(resps) {
    const confirmadas = [];
    try {
      for (const g of grupos) {
        const categoria = resps[g.chave];
        if (!categoria || salvosRef.current[g.chave]) continue;

        const conta = entradaConta(categoria);
        const res = await classificarGrupo(userId, g.entradas, conta ? "faturamento" : "ignorada", {
          categoria,
          aoConfirmar: (efetivas) => { confirmadas.push(...efetivas); },
        });
        salvosRef.current[g.chave] = true;

        if (conta) {
          faturadoRef.current += res?.total || 0;
          // O que conta vira regra (o Fisco aprende); o que nao conta, nao.
          if (g.documento) {
            try {
              await salvarRegra(userId, g.documento, g.nome, "faturamento");
            } catch {
              /* sem a regra, da proxima vez pergunta de novo — nao e grave */
            }
          }
        }
      }
    } finally {
      if (confirmadas.length) {
        const r = await lancarEntradasConfirmadas(userId, confirmadas, () => appRef.current);
        casadosRef.current += r.casados || 0;
        absorvidoRef.current += r.absorvido || 0;
      }
    }
  }

  async function finalizar(resps) {
    setFase("salvando");
    try {
      await gravar(resps);
      setFaturado(faturadoRef.current);
      setJaLancadas(casadosRef.current);
      setJaNoTotal(absorvidoRef.current);
      setFase("fim");
    } catch {
      setErro({
        texto: "Não consegui guardar suas respostas agora. Elas continuam aqui.",
        tipo: "salvar",
      });
      setFase("erro");
    }
  }

  function responder(valor) {
    const g = grupos[indice];
    const novas = { ...respostas, [g.chave]: valor };
    setRespostas(novas);
    setListaAberta(false);
    if (indice < grupos.length - 1) {
      setIndice(indice + 1);
    } else {
      finalizar(novas);
    }
  }

  function anterior() {
    if (indice === 0) return;
    setIndice(indice - 1);
    setListaAberta(false);
  }

  const centralizado = fase !== "pergunta";
  // A explicacao ocupa a altura toda: icone em cima, botao no pe da tela
  const telaCheia = fase === "explicacao";
  const g = grupos[indice];

  return (
    <div
      className="tela-rolavel w-full flex flex-col"
      style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
    >
      <style>{`
        @keyframes conferirEntra {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .conferir-entra { animation: conferirEntra 260ms cubic-bezier(0.22,0.61,0.36,1); }
        @media (prefers-reduced-motion: reduce) {
          .conferir-entra { animation: none; }
        }
      `}</style>

      {/* Sem seta de voltar de proposito: a pessoa confere antes de seguir */}
      <header className="px-5 pt-7 pb-3 shrink-0">
        <h1 className="font-bold text-center" style={{ color: "var(--text)", fontSize: 27 }}>
          Novas entradas
        </h1>
      </header>

      <div
        className="conteudo-rolavel hide-scrollbar px-5"
        style={{
          paddingBottom: "calc(24px + env(safe-area-inset-bottom))",
          display: "flex",
          flexDirection: "column",
          flex: "1 1 auto",
          minHeight: 0,
        }}
      >
        <div
          className="max-w-sm w-full mx-auto"
          style={
            telaCheia
              ? { flex: "1 0 auto", display: "flex", flexDirection: "column", paddingTop: 4 }
              : {
                  // Telas de aviso ficam no meio da altura; a pergunta, no topo
                  marginTop: centralizado ? "auto" : 0,
                  marginBottom: centralizado ? "auto" : 0,
                  paddingTop: centralizado ? 12 : 6,
                  flexShrink: 0,
                }
          }
        >
          {/* ------------------------- CARREGANDO ------------------------- */}
          {fase === "carregando" && (
            <div className="flex flex-col items-center text-center" style={{ gap: 12 }}>
              <Loader2 size={24} className="animate-spin" style={{ color: "var(--primary)" }} />
            </div>
          )}

          {/* -------------------------- EXPLICACAO --------------------------
              So na primeira conferencia (ver topo do arquivo). */}
          {fase === "explicacao" && (
            <div className="conferir-entra" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              {/* icone logo abaixo do titulo */}
              <div className="flex justify-center">
                <Circulo tamanho={64}>
                  <ListChecks size={30} strokeWidth={2.2} style={{ color: "var(--primary)" }} />
                </Circulo>
              </div>

              {/* o meio, centralizado na altura que sobra */}
              <div style={{ marginTop: "auto", marginBottom: "auto", paddingTop: 28, paddingBottom: 28 }}>
                {/* os tres passos, o bloco inteiro no meio da tela */}
                <div className="flex justify-center">
                  <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    <Passo numero={1} titulo="Veja quem te pagou" detalhe="Nome, valor e datas" />
                    <Passo numero={2} titulo="Responda: é faturamento?" detalhe="Um toque na resposta certa" />
                    <Passo numero={3} titulo="O Fisco aprende" detalhe="Da próxima vez, entra sozinho" />
                  </div>
                </div>

                {/* "Por exemplo:" fora do quadro, logo acima */}
                <p className="font-semibold" style={{ fontSize: 14.5, color: "var(--text)", marginTop: 30, marginBottom: 8 }}>
                  Por exemplo:
                </p>
                <div
                  className="rounded-2xl"
                  style={{
                    padding: "14px 16px",
                    /* v13: sem fundo cinza (padrao "menos cor") */
                    backgroundColor: "transparent",
                    border: "1px solid var(--border)",
                  }}
                >
                  {/* v13: reembolso de despesa CONTA (Cosit 72/2020); antes
                      estava do lado errado */}
                  <p style={{ fontSize: 14, lineHeight: 1.5, color: "var(--text-secondary)" }}>
                    <strong style={{ color: "var(--text)" }}>Conta</strong> = {tipoMEI === "MEI_CAMINHONEIRO" ? "frete, adiantamento e saldo de frete" : "venda ou serviço"}, reembolso de despesa
                  </p>
                  <p style={{ fontSize: 14, lineHeight: 1.5, color: "var(--text-secondary)", marginTop: 8 }}>
                    <strong style={{ color: "var(--text)" }}>Não conta</strong> = {tipoMEI === "MEI_CAMINHONEIRO" ? "vale-pedágio, " : ""}empréstimo, estorno, dinheiro seu ou da família
                  </p>
                </div>
              </div>

              {/* o botao no pe da tela, perto da barra */}
              <BotaoLargo rotulo="Entendi, vamos lá" aoTocar={() => setFase("pergunta")} margemTopo={0} />
            </div>
          )}

          {/* --------------------------- PERGUNTA --------------------------- */}
          {fase === "pergunta" && g && (
            <div key={g.chave} className="conferir-entra">
              {/* progresso */}
              <p
                className="text-[13px] font-semibold text-center"
                style={{ color: "var(--text-secondary)", marginBottom: 8 }}
              >
                {indice + 1} de {grupos.length}
              </p>
              <div
                className="rounded-full overflow-hidden"
                style={{ height: 5, backgroundColor: "var(--border)" }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${((indice + 1) / grupos.length) * 100}%`,
                    backgroundColor: "var(--primary)",
                    transition: "width 300ms ease",
                  }}
                />
              </div>

              {/* o pagador, com cara de comprovante (v3) */}
              <div className="card-tacerto rounded-2xl overflow-hidden" style={{ marginTop: 16 }}>
                {/* quem pagou */}
                <div style={{ padding: "14px 16px 12px" }}>
                  <p
                    className="font-semibold uppercase"
                    style={{ color: "var(--text-tertiary)", fontSize: 11, letterSpacing: "0.08em" }}
                  >
                    Pagador
                  </p>
                  <div className="flex items-center" style={{ gap: 12, marginTop: 8 }}>
                    <span
                      className="rounded-full flex items-center justify-center shrink-0 font-bold"
                      style={{
                        width: 42,
                        height: 42,
                        fontSize: 17,
                        backgroundColor: "rgba(34,197,94,0.14)",
                        color: "var(--primary)",
                      }}
                    >
                      {g.nome.trim().charAt(0).toUpperCase() || "?"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold truncate" style={{ fontSize: 16.5, color: "var(--text)" }}>
                        {g.nome}
                      </p>
                      <p
                        className="text-[12.5px]"
                        style={{ color: "var(--text-tertiary)", marginTop: 1, letterSpacing: "0.02em" }}
                      >
                        {mascararDocumento(g.documento) || "Documento não informado pelo banco"}
                      </p>
                    </div>
                  </div>
                </div>

                <Picote />

                {/* detalhes */}
                <div style={{ padding: "10px 16px 14px" }}>
                  <LinhaDetalhe rotulo="Entradas" valor={String(g.entradas.length)} />
                  <LinhaDetalhe rotulo="Período" valor={periodoCurto(g)} />
                  {meiosDoGrupo(g) && <LinhaDetalhe rotulo="Meio" valor={meiosDoGrupo(g)} />}

                  <div
                    className="flex items-baseline justify-between"
                    style={{ marginTop: 10, paddingTop: 10, borderTop: "1px dashed var(--border)", gap: 10 }}
                  >
                    <span className="text-[13px]" style={{ color: "var(--text-secondary)" }}>
                      Total recebido
                    </span>
                    <span className="font-bold" style={{ fontSize: 22, color: "var(--primary)" }}>
                      {reais(g.total)}
                    </span>
                  </div>

                  <button
                    onClick={() => setListaAberta((v) => !v)}
                    className="flex items-center gap-1 active:opacity-70 transition"
                    style={{ marginTop: 10, color: "var(--text-secondary)", fontSize: 13 }}
                  >
                    {listaAberta ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    {listaAberta ? "Esconder as entradas" : "Ver as entradas"}
                  </button>

                  {listaAberta && (
                    <div style={{ marginTop: 6 }}>
                      {g.entradas.map((e) => (
                        <div
                          key={e.id}
                          style={{ paddingTop: 9, paddingBottom: 9, borderTop: "1px solid var(--border)" }}
                        >
                          <div className="flex items-baseline justify-between" style={{ gap: 10 }}>
                            <span className="text-[13px] font-semibold" style={{ color: "var(--text)" }}>
                              {diaMes(e.data)}
                              {nomeMeio(e.meio) && (
                                <span style={{ color: "var(--text-tertiary)", fontWeight: 500 }}>
                                  {" "}· {nomeMeio(e.meio)}
                                </span>
                              )}
                            </span>
                            <span className="text-[13px] font-semibold shrink-0" style={{ color: "var(--text)" }}>
                              {reais(e.valor)}
                            </span>
                          </div>
                          {e.descricao && (
                            <p className="text-[12px] truncate" style={{ color: "var(--text-tertiary)", marginTop: 2 }}>
                              {e.descricao}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* a pergunta */}
              <p className="font-bold text-center" style={{ fontSize: 20, marginTop: 22 }}>
                É faturamento?
              </p>
              {/* v13: 6 respostas curtas (as que contam primeiro) */}
              <div className="grid grid-cols-2" style={{ gap: 8, marginTop: 12 }}>
                {opcoes.map((o) => (
                  <BotaoCategoria
                    key={o.id}
                    rotulo={o.rotulo}
                    conta={o.conta}
                    sugerida={g.sugestao === o.id}
                    marcada={respostas[g.chave] === o.id}
                    aoTocar={() => responder(o.id)}
                  />
                ))}
              </div>

              {indice > 0 && (
                <div className="flex justify-center" style={{ marginTop: 18 }}>
                  <button
                    onClick={anterior}
                    className="flex items-center gap-1 active:opacity-70 transition"
                    style={{ color: "var(--text-secondary)", fontSize: 14 }}
                  >
                    <ChevronLeft size={17} />
                    Anterior
                  </button>
                </div>
              )}
            </div>
          )}

          {/* --------------------------- SALVANDO --------------------------- */}
          {fase === "salvando" && (
            <div className="flex flex-col items-center text-center" style={{ gap: 12 }}>
              <Loader2 size={24} className="animate-spin" style={{ color: "var(--primary)" }} />
            </div>
          )}

          {/* ----------------------------- FIM ----------------------------- */}
          {fase === "fim" && (
            <div className="conferir-entra flex flex-col items-center text-center">
              <Circulo>
                <Check size={38} strokeWidth={2.6} style={{ color: "var(--primary)" }} />
              </Circulo>
              <h2 className="font-bold" style={{ fontSize: 22, marginTop: 20 }}>
                Pronto!
              </h2>
              <p className="text-[15px] leading-relaxed" style={{ color: "var(--text-secondary)", marginTop: 8 }}>
                {faturado > 0 ? (
                  <>
                    <strong style={{ color: "var(--primary)" }}>{reais(faturado)}</strong> entraram no
                    seu faturamento.
                  </>
                ) : (
                  "Nada entrou no seu faturamento."
                )}
              </p>
              {jaLancadas > 0 && (
                <p className="text-[14px] leading-relaxed" style={{ color: "var(--text-tertiary)", marginTop: 6 }}>
                  {jaLancadas === 1
                    ? "1 já estava lançada à mão: não contei de novo."
                    : `${jaLancadas} já estavam lançadas à mão: não contei de novo.`}
                </p>
              )}
              {jaNoTotal > 0 && (
                <p className="text-[14px] leading-relaxed" style={{ color: "var(--text-tertiary)", marginTop: 6 }}>
                  {reais(jaNoTotal)} já estavam no total do ano que você digitou.
                </p>
              )}
              <BotaoLargo rotulo="Continuar" aoTocar={irParaODestino} />
            </div>
          )}

          {/* ----------------------------- ERRO ----------------------------- */}
          {fase === "erro" && (
            <div className="conferir-entra flex flex-col items-center text-center">
              <Circulo erro>
                <AlertCircle size={34} strokeWidth={2.2} style={{ color: "var(--danger)" }} />
              </Circulo>
              <p className="text-[14.5px] leading-relaxed" style={{ color: "var(--text-secondary)", marginTop: 18 }}>
                {erro.texto}
              </p>
              <BotaoLargo
                rotulo="Tentar de novo"
                aoTocar={() => (erro.tipo === "salvar" ? finalizar(respostas) : window.location.reload())}
              />
              {/* Saida de emergencia so no erro de carregar, para ninguem
                  ficar preso na tela sem internet */}
              {erro.tipo === "carregar" && (
                <button
                  onClick={() => navigate("/dashboard", { replace: true })}
                  className="active:opacity-70 transition"
                  style={{ marginTop: 14, color: "var(--text-secondary)", fontSize: 14 }}
                >
                  Voltar ao início
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ========================== PECAS DA TELA ========================== */

/* v13: uma resposta. Conta = ✓ verde; nao conta = ✕ cinza.
   sugerida (o extrato ja diz o que e) = borda verde fina (destaque
   discreto, sem fundo); marcada (ao voltar com "Anterior") = mais acesa. */
function BotaoCategoria({ rotulo, conta, sugerida, marcada, aoTocar }) {
  const borda = sugerida ? "rgba(34,197,94,0.55)" : marcada ? "var(--text-secondary)" : "var(--border)";
  return (
    <button
      type="button"
      onClick={aoTocar}
      className="toque rounded-2xl flex items-center text-left transition active:scale-[0.98]"
      style={{
        gap: 8,
        minHeight: 50,
        padding: "9px 10px 9px 13px",
        background: "none",
        border: `1px solid ${borda}`,
      }}
    >
      <span className="flex-1 min-w-0 font-semibold leading-snug" style={{ fontSize: 14.5, color: "var(--text)" }}>
        {rotulo}
      </span>
      {conta ? (
        <Check size={16} strokeWidth={2.6} className="shrink-0" style={{ color: "var(--primary)" }} />
      ) : (
        <X size={15} strokeWidth={2.4} className="shrink-0" style={{ color: "var(--text-tertiary)" }} />
      )}
    </button>
  );
}

/* Picote de comprovante: linha tracejada com dois "recortes" nas
   laterais, na cor do fundo da tela. */
function Picote() {
  const recorte = {
    position: "absolute",
    top: 0,
    width: 18,
    height: 18,
    borderRadius: "50%",
    backgroundColor: "var(--bg)",
    border: "1px solid var(--card-borda)",
  };
  return (
    <div aria-hidden className="relative" style={{ height: 18 }}>
      <span style={{ ...recorte, left: -10 }} />
      <div
        style={{
          position: "absolute",
          left: 16,
          right: 16,
          top: 8,
          borderTop: "1.5px dashed var(--border)",
        }}
      />
      <span style={{ ...recorte, right: -10 }} />
    </div>
  );
}

/* Um passo da explicacao da primeira vez: numero no circulo verde,
   titulo e detalhe. */
function Passo({ numero, titulo, detalhe }) {
  return (
    <div className="flex items-start" style={{ gap: 14 }}>
      <span
        className="rounded-full flex items-center justify-center shrink-0 font-bold"
        style={{
          width: 32,
          height: 32,
          fontSize: 15,
          border: "2px solid var(--primary)",
          color: "var(--primary)",
        }}
      >
        {numero}
      </span>
      <div style={{ paddingTop: 2 }}>
        <p className="font-semibold" style={{ fontSize: 16.5, color: "var(--text)" }}>
          {titulo}
        </p>
        <p style={{ fontSize: 13.5, color: "var(--text-tertiary)", marginTop: 2 }}>{detalhe}</p>
      </div>
    </div>
  );
}

/* Uma linha "rotulo ........ valor" do comprovante */
function LinhaDetalhe({ rotulo, valor }) {
  return (
    <div className="flex items-baseline justify-between" style={{ gap: 12, paddingTop: 4, paddingBottom: 4 }}>
      <span className="text-[13px]" style={{ color: "var(--text-tertiary)" }}>
        {rotulo}
      </span>
      <span className="text-[13.5px] font-semibold text-right" style={{ color: "var(--text)" }}>
        {valor}
      </span>
    </div>
  );
}

function Circulo({ children, erro = false, tamanho = 76 }) {
  return (
    <span
      className="flex items-center justify-center rounded-full shrink-0"
      style={{
        width: tamanho,
        height: tamanho,
        backgroundColor: erro ? "rgba(239,68,68,0.12)" : "rgba(34,197,94,0.14)",
      }}
    >
      {children}
    </span>
  );
}

function BotaoLargo({ rotulo, aoTocar, margemTopo = 26 }) {
  return (
    <button
      onClick={aoTocar}
      className="botao-confirmar w-full py-3.5 rounded-2xl font-semibold transition active:scale-[0.99]"
      style={{
        marginTop: margemTopo,
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