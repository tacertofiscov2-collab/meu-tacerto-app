/* EDITARPERFIL v15 — lista simples (igual ao Perfil): nome editavel, WhatsApp abre aviso "fale com a gente", e-mail so se existir, Excluir conta no fim; layout antigo atras de MOSTRAR_LOGIN_EMAIL */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Trash2, ChevronRight, ChevronLeft, CheckCircle2, AlertCircle, Lock, X,
  User, Phone, Mail, Briefcase, CalendarDays,
} from "lucide-react";
import TopoRolavel from "../components/TopoRolavel.jsx";
import { SecaoLista, LinhaLista } from "../components/ListaSimples.jsx";

import Valor from "../components/Valor.jsx";
import Calendario from "../components/Calendario.jsx";
import { useUserState } from "@/lib/userState";
import { useAppState } from "@/context/AppStateContext";
import { supabase } from "@/lib/supabase";
import { LIMITES_ANUAIS, LIMITE_NOME_INPUT } from "@/lib/fiscal";
import { EMAIL_VERIFICACAO_ATIVA } from "@/lib/flags";
import {
  MOSTRAR_AVATAR, MOSTRAR_LOGIN_EMAIL,
  MENSAGENS_WHATSAPP, dadosParaWhatsApp, abrirWhatsAppFisco,
} from "@/config/piloto";

/* ===================================================================
   EDITARPERFIL v15 (05/10/2026) — LISTA SIMPLES + LOGIN PELO WHATSAPP

   Com MOSTRAR_LOGIN_EMAIL = false (src/config/piloto.js) a tela vira
   uma lista no mesmo estilo do Perfil (SecaoLista/LinhaLista):
     DADOS PESSOAIS  Nome (editavel na propria linha), WhatsApp e
                     E-mail (so se a conta tiver e-mail).
     MEU MEI         Tipo de MEI (folha "O que mudou?", como antes) e
                     Data de abertura (so quem abriu este ano).
     No fim, separado: "Excluir conta" em vermelho (veio do Perfil).
   O numero agora e o LOGIN da pessoa, entao nao se troca por aqui:
   tocar no WhatsApp abre o aviso "Seu numero e usado para entrar no
   app. Para trocar, fale com a gente." com o botao do WhatsApp
   (mensagem trocarNumero). O e-mail abre um aviso parecido; o e-mail
   do Auth nao e alterado.
   Numero mostrado: perfis.whatsapp; se vazio, o telefone do login
   (user.phone).
   O layout antigo (e-mail com verificacao, WhatsApp que pede senha)
   continua aqui, atras de MOSTRAR_LOGIN_EMAIL. Nada foi apagado.
   =================================================================== */

/* ===================================================================
   EDITARPERFIL v13 (28/09/2026): o cabecalho passou para DENTRO da area
   que rola (TopoRolavel): o titulo sobe com a rolagem e a setinha fica
   parada e transparente. Nada mais mudou.

   EDITARPERFIL v12 — PERFIL FISCAL COM REGRA (26/09/2026)

   TIPO DE MEI TRAVADO
     O tipo segue o que esta registrado no CNPJ e define o limite do
     velocimetro. Trocar livremente fazia o velocimetro mentir. Agora o
     card mostra um CADEADO e abre a folha "Seu tipo de MEI", com a
     pergunta "O que mudou?":
       - Mudei de atividade no mesmo CNPJ -> explica a regra
         (comum -> caminhoneiro so em janeiro; caminhoneiro -> comum
         vale na hora e o limite cai para R$ 81 mil no ano todo)
       - Fechei meu MEI e abri outro CNPJ -> explica (empresa nova do
         zero; o CNPJ antigo deve a declaracao de extincao)
       - Escolhi errado no cadastro -> a pessoa CORRIGE SOZINHA nos
         primeiros 7 dias depois do cadastro (user.created_at). Depois
         disso, avisa a equipe.
     Nas duas primeiras, quem atualiza o tipo no app e a equipe TaCerto
     (na validacao, o Fernando no Supabase). Base: pesquisa de 26/09
     (HANDOFF, Parte 3-MEI). O botao do contador parceiro entra so no
     FIM de tudo (pedido do Fernando).

   DATA DE ABERTURA SO PARA QUEM ABRIU ESTE ANO
     So importa no 1o ano (limite proporcional). O campo aparece so se
     a abertura e do ano corrente. Escolher um ano anterior no
     calendario APAGA a informacao (mes/ano = null) e o campo some. Em
     janeiro, a abertura deixa de ser "deste ano" e o campo some sozinho.
     Le e grava pelo AppStateContext (useAppState), que e a fonte unica
     e espelha as chaves antigas do localStorage.

   O RESTO VEM DA v11
     FOLGA_TECLADO no fim do conteudo (340px), para o teclado ter para
     onde empurrar o campo de e-mail. Contato minimalista: o botao ao
     lado do e-mail carrega o estado ("Verificar", "Enviado", "45s",
     "Salvar"); texto so aparece quando da erro. E-mail pendente e
     editavel (updateUser manda o link para o endereco novo). WhatsApp
     so trava se ja tiver numero. Selo verde no e-mail so para conta
     que veio do Google.
   =================================================================== */

/* Segundos de espera entre um envio e o proximo. */
const ESPERA_REENVIO = 60;

/* Folga no fim do conteudo, para o teclado ter para onde empurrar.
   Maior que a altura de qualquer teclado de iPhone. */
const FOLGA_TECLADO = 340;

/* Dias depois do cadastro em que a pessoa ainda pode corrigir o tipo
   de MEI sozinha ("Escolhi errado no cadastro"). */
const DIAS_PARA_CORRIGIR_TIPO = 7;

// ---------------------------------------------------------------------
// Espaçamentos ajustáveis desta tela.
// A SOMA de ACIMA + ABAIXO do avatar define onde começam os cards:
// mudando um e compensando no outro, só a bola se move.
// ---------------------------------------------------------------------
const ESPACO_ACIMA_AVATAR = 28;
const ESPACO_ABAIXO_AVATAR = 28;
const ESPACO_ENTRE_SECOES = 26;

const LABEL_PERFIL = {
  MEI: "MEI (outras atividades)",
  MEI_CAMINHONEIRO: "MEI Caminhoneiro",
};

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

/* Formata enquanto digita: (11) 98765-4321 */
function formatarTelefone(valor) {
  const d = String(valor).replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/* Checagem simples de formato. Nao tenta validar se o endereco existe —
   quem faz isso e o link de confirmacao. Serve so para evitar o envio
   de algo obviamente quebrado, como um endereco com barra no meio. */
function emailPareceValido(valor) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(valor).trim());
}

/* Descobre se a conta nasceu de um login social do Google.
   O Supabase guarda isso em dois lugares e nem sempre os dois vem
   preenchidos, entao olhamos os dois por seguranca. */
function contaVeioDoGoogle(user) {
  if (!user) return false;
  if (user.app_metadata?.provider === "google") return true;
  const lista = user.app_metadata?.providers || [];
  if (Array.isArray(lista) && lista.includes("google")) return true;
  const identidades = user.identities || [];
  return identidades.some((i) => i?.provider === "google");
}

/**
 * Grava os campos de perfil na tabela `perfis` do Supabase.
 *
 * Recebe os valores JÁ RESOLVIDOS (não lê do estado do React), porque
 * setState é assíncrono: logo após um setTipo/setAbertura o estado ainda
 * tem o valor antigo. Passando explícito, gravamos o que o usuário
 * acabou de escolher.
 *
 * Só grava os campos presentes no patch (undefined é ignorado; null
 * grava vazio — é assim que a data de abertura é apagada).
 * Silencioso para visitante (sem sessão) — igual ao resto do app.
 */
async function sincronizarPerfilNoBanco(patch) {
  try {
    const { data } = await supabase.auth.getUser();
    if (!data?.user) return; // visitante: nada a fazer

    const update = { atualizado_em: new Date().toISOString() };
    if (patch.nome !== undefined) update.nome = patch.nome;
    if (patch.tipo !== undefined) update.tipo_mei = patch.tipo;
    if (patch.mesAbertura !== undefined) update.mes_abertura = patch.mesAbertura;
    if (patch.anoAbertura !== undefined) update.ano_abertura = patch.anoAbertura;
    if (patch.whatsapp !== undefined) update.whatsapp = patch.whatsapp;

    await supabase.from("perfis").update(update).eq("id", data.user.id);
  } catch {
    /* falha de rede/visitante — não quebra a tela */
  }
}

/* Titulo de secao: caixa normal, cinza, discreto. */
function TituloSecao({ children, primeiro }) {
  return (
    <p
      className="text-[14px] mb-3"
      style={{
        color: "var(--text-tertiary)",
        marginTop: primeiro ? 0 : ESPACO_ENTRE_SECOES,
      }}
    >
      {children}
    </p>
  );
}

/* Rotulo do campo: fica FORA do card, logo acima dele. */
function Rotulo({ children }) {
  return (
    <label className="block text-[14px] mb-1.5" style={{ color: "var(--text)" }}>
      {children}
    </label>
  );
}

/* Linha de escolha (Tipo de MEI, Data de abertura): o card mostra o
   valor atual; a seta indica que abre um seletor e o cadeado indica
   que o valor e travado (abre so a explicacao). */
function CampoEscolha({ rotulo, valor, onClick, travado = false }) {
  return (
    <div>
      <Rotulo>{rotulo}</Rotulo>
      <button
        onClick={onClick}
        className="card-tacerto w-full flex items-center gap-3 px-4 py-4 rounded-2xl text-left active:opacity-75 transition"
      >
        <span
          className="flex-1 min-w-0 truncate text-[16px] font-semibold"
          style={{ color: "var(--text)" }}
        >
          {valor}
        </span>
        {travado ? (
          <Lock size={17} style={{ color: "var(--text-tertiary)" }} className="shrink-0" />
        ) : (
          <ChevronRight size={18} style={{ color: "var(--text-tertiary)" }} className="shrink-0" />
        )}
      </button>
    </div>
  );
}

/* v15: linha da lista com um campo dentro (o Nome). E um <label>: tocar
   em qualquer ponto da linha abre o teclado no campo. `Icon` tambem
   serve para a SecaoLista recuar a risca igual as outras linhas. */
function LinhaCampo({ Icon, rotulo, children }) {
  return (
    <label className="w-full flex items-center" style={{ gap: 14, padding: "13px 0", minHeight: 50 }}>
      <Icon size={18} strokeWidth={1.9} className="shrink-0" style={{ color: "var(--text-tertiary)" }} />
      <span className="shrink-0 font-medium" style={{ color: "var(--text)", fontSize: 15 }}>
        {rotulo}
      </span>
      {children}
    </label>
  );
}

/* v15: aviso simples (troca de WhatsApp / e-mail): texto + botao do
   WhatsApp + "Agora nao". */
function AvisoFaleConosco({ texto, onWhatsApp, onFechar, cardStyle }) {
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
      onClick={onFechar}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-5"
        style={cardStyle}
        onClick={(e) => e.stopPropagation()}
      >
        <p style={{ color: "var(--text)", fontSize: 15, lineHeight: 1.5 }}>{texto}</p>
        <button
          onClick={onWhatsApp}
          className="w-full py-3 rounded-xl font-semibold transition active:scale-[0.99]"
          style={{ marginTop: 18, backgroundColor: "var(--primary)", color: "var(--primary-contrast)", fontSize: 15 }}
        >
          Falar no WhatsApp
        </button>
        <button
          onClick={onFechar}
          className="w-full py-3 rounded-xl font-semibold"
          style={{ marginTop: 8, color: "var(--text-secondary)", fontSize: 15 }}
        >
          Agora não
        </button>
      </div>
    </div>
  );
}

/* ===================================================================
   FOLHA "SEU TIPO DE MEI" (v12)

   Passos: "inicio" (O que mudou?) -> "atividade" | "novoCnpj" |
   "errado" -> "confirmar" (so quando pode corrigir sozinho).
   =================================================================== */
function FolhaTipoMei({ tipo, podeCorrigir, onFechar, onCorrigir, cardStyle }) {
  const [passo, setPasso] = useState("inicio");

  const outroTipo = tipo === "MEI_CAMINHONEIRO" ? "MEI" : "MEI_CAMINHONEIRO";
  const nomeOutro = outroTipo === "MEI" ? "MEI comum" : "MEI Caminhoneiro";

  const texto = { color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.55 };
  const avisoEquipe = (
    <p style={{ ...texto, marginTop: 12, color: "var(--text-tertiary)", fontSize: 13 }}>
      Quando a troca valer no seu CNPJ, a equipe TaCerto atualiza seu tipo aqui
      no app.
    </p>
  );

  const botaoPrincipal = (rotulo, aoTocar) => (
    <button
      onClick={aoTocar}
      className="w-full py-3 rounded-xl font-semibold transition active:scale-[0.99]"
      style={{
        marginTop: 16,
        backgroundColor: "var(--primary)",
        color: "var(--primary-contrast)",
        fontSize: 15,
      }}
    >
      {rotulo}
    </button>
  );

  const voltar = (
    <button
      onClick={() => setPasso("inicio")}
      className="flex items-center gap-1 active:opacity-70 transition"
      style={{ color: "var(--text-secondary)", fontSize: 13.5, marginBottom: 10 }}
    >
      <ChevronLeft size={16} />
      Voltar
    </button>
  );

  const opcao = (rotulo, destino) => (
    <button
      key={destino}
      onClick={() => setPasso(destino)}
      className="w-full rounded-xl px-4 py-3.5 flex items-center gap-3 text-left active:opacity-75 transition"
      style={{ backgroundColor: "var(--field)" }}
    >
      <span className="flex-1 text-[14.5px] font-semibold" style={{ color: "var(--text)" }}>
        {rotulo}
      </span>
      <ChevronRight size={17} style={{ color: "var(--text-tertiary)" }} className="shrink-0" />
    </button>
  );

  let conteudo;

  if (passo === "inicio") {
    conteudo = (
      <>
        <div className="rounded-xl px-4 py-3" style={{ backgroundColor: "var(--field)" }}>
          <p className="text-[15.5px] font-bold" style={{ color: "var(--text)" }}>
            {LABEL_PERFIL[tipo] || "MEI"}
          </p>
          <p
            className="text-[13px] mt-0.5 flex items-center gap-1"
            style={{ color: "var(--text-secondary)" }}
          >
            Limite de <Valor tamanho="sm">{LIMITES_ANUAIS[tipo] || LIMITES_ANUAIS.MEI}</Valor> no ano
          </p>
        </div>

        <p style={{ ...texto, marginTop: 12 }}>
          O tipo segue o que está registrado no seu CNPJ e define o seu limite. Por
          isso ele não muda por aqui.
        </p>

        <p
          className="text-[14px] font-semibold"
          style={{ color: "var(--text)", marginTop: 16, marginBottom: 8 }}
        >
          O que mudou?
        </p>
        <div className="space-y-2">
          {opcao("Mudei de atividade no mesmo CNPJ", "atividade")}
          {opcao("Fechei meu MEI e abri outro CNPJ", "novoCnpj")}
          {opcao("Escolhi errado no cadastro", "errado")}
        </div>
      </>
    );
  } else if (passo === "atividade") {
    conteudo = (
      <>
        {voltar}
        <p className="text-[15.5px] font-bold" style={{ color: "var(--text)" }}>
          Mudei de atividade no mesmo CNPJ
        </p>
        <p style={{ ...texto, marginTop: 8 }}>
          {tipo === "MEI_CAMINHONEIRO"
            ? "Se você passou a fazer outra atividade além do transporte de cargas, seu CNPJ vira MEI comum e o limite cai para R$ 81.000, já neste ano."
            : "A troca para MEI Caminhoneiro é feita no Portal do Empreendedor, e só em janeiro. Feita em janeiro, vale para o ano todo. Fora de janeiro, só passa a valer no ano seguinte."}
        </p>
        {avisoEquipe}
        {botaoPrincipal("Entendi", onFechar)}
      </>
    );
  } else if (passo === "novoCnpj") {
    conteudo = (
      <>
        {voltar}
        <p className="text-[15.5px] font-bold" style={{ color: "var(--text)" }}>
          Fechei meu MEI e abri outro CNPJ
        </p>
        <p style={{ ...texto, marginTop: 8 }}>
          O MEI fechado não volta, e o novo começa do zero, com limite proporcional
          aos meses que faltam no ano. O CNPJ antigo ainda precisa entregar a
          declaração de extinção.
        </p>
        {avisoEquipe}
        {botaoPrincipal("Entendi", onFechar)}
      </>
    );
  } else if (passo === "errado") {
    conteudo = (
      <>
        {voltar}
        <p className="text-[15.5px] font-bold" style={{ color: "var(--text)" }}>
          Escolhi errado no cadastro
        </p>
        {podeCorrigir ? (
          <>
            <p style={{ ...texto, marginTop: 8 }}>
              Nos primeiros {DIAS_PARA_CORRIGIR_TIPO} dias depois do cadastro, você
              mesmo pode corrigir.
            </p>
            {botaoPrincipal(`Trocar para ${nomeOutro}`, () => setPasso("confirmar"))}
          </>
        ) : (
          <>
            <p style={{ ...texto, marginTop: 8 }}>
              O prazo para corrigir sozinho passou ({DIAS_PARA_CORRIGIR_TIPO} dias
              depois do cadastro). Avise a equipe TaCerto e a gente corrige para você.
            </p>
            {botaoPrincipal("Entendi", onFechar)}
          </>
        )}
      </>
    );
  } else {
    // "confirmar"
    conteudo = (
      <>
        <p className="text-[15.5px] font-bold" style={{ color: "var(--text)" }}>
          Trocar para {nomeOutro}?
        </p>
        <p className="text-sm flex items-center gap-1 flex-wrap" style={{ ...texto, marginTop: 8 }}>
          O limite passa a ser <Valor tamanho="sm">{LIMITES_ANUAIS[outroTipo]}</Valor>.
        </p>
        <div className="flex gap-2" style={{ marginTop: 16 }}>
          <button
            onClick={() => setPasso("errado")}
            className="flex-1 py-3 rounded-xl font-semibold"
            style={{ backgroundColor: "var(--field)", color: "var(--text)" }}
          >
            Cancelar
          </button>
          <button
            onClick={() => onCorrigir(outroTipo)}
            className="flex-1 py-3 rounded-xl font-semibold"
            style={{ backgroundColor: "var(--primary)", color: "var(--primary-contrast)" }}
          >
            Confirmar
          </button>
        </div>
      </>
    );
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
      onClick={onFechar}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-5 relative"
        style={{ ...cardStyle, maxHeight: "calc(100dvh - 32px)", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
          <h3 className="text-base font-bold" style={{ color: "var(--text)" }}>
            Seu tipo de MEI
          </h3>
          <button
            onClick={onFechar}
            aria-label="Fechar"
            className="rounded-full flex items-center justify-center shrink-0 active:scale-95 transition"
            style={{ width: 30, height: 30, backgroundColor: "var(--field)" }}
          >
            <X size={15} style={{ color: "var(--text-secondary)" }} />
          </button>
        </div>
        {conteudo}
      </div>
    </div>
  );
}

export default function EditarPerfil() {
  const navigate = useNavigate();

  const {
    nome: nomeSalvo, email, visitante, tipo,
    setNome: salvarNome, setTipo,
  } = useUserState();

  /* Data de abertura: fonte unica no AppStateContext (ver topo). */
  const app = useAppState();
  const { mesAnoAbertura, setMesAnoAbertura } = app;
  /* v15: aviso aberto: null | "whatsapp" | "email" */
  const [aviso, setAviso] = useState(null);
  const mesAbertura = mesAnoAbertura?.mes || null;
  const anoAbertura = mesAnoAbertura?.ano || null;
  const anoAtual = new Date().getFullYear();
  const abriuEsteAno = !!mesAbertura && Number(anoAbertura) === anoAtual;

  const [nome, setNome] = useState(nomeSalvo || "");
  /* WhatsApp: canal de atendimento do TaCerto. Vive na coluna `whatsapp`
     da tabela `perfis` — a mesma que o Cadastro grava. Guardamos com o
     +55 no banco e mostramos só os dígitos locais na tela. */
  const [whats, setWhats] = useState("");
  const [whatsSalvo, setWhatsSalvo] = useState("");
  const [folhaTipoAberta, setFolhaTipoAberta] = useState(false);
  const [calendarioAberto, setCalendarioAberto] = useState(false);
  const [salvo, setSalvo] = useState(false);
  /* true so quando a conta veio do Google (ver bloco no topo).
     null = ainda carregando, para nao piscar o icone errado. */
  const [emailConfirmado, setEmailConfirmado] = useState(null);
  /* Data do cadastro (user.created_at) — define se ainda da para
     corrigir o tipo de MEI sozinho. */
  const [criadoEm, setCriadoEm] = useState(null);

  /* E-mail editavel enquanto pendente. Comeca com o valor salvo. */
  const [emailCampo, setEmailCampo] = useState(email || "");
  /* Mensagem de ERRO, e so de erro — o caminho normal nao escreve nada
     na tela, o proprio botao mostra o estado. */
  const [erroContato, setErroContato] = useState("");
  const [enviandoEmail, setEnviandoEmail] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [espera, setEspera] = useState(0);

  /* WhatsApp so fica travado quando JA existe numero salvo.
     Sem numero, o campo continua aberto para cadastrar o primeiro. */
  const whatsTravado = !visitante && whatsSalvo !== "";

  const mudouNome = nome.trim() !== (nomeSalvo || "").trim() && nome.trim() !== "";
  const mudouWhats =
    !whatsTravado && whats.replace(/\D/g, "") !== whatsSalvo.replace(/\D/g, "");
  const temMudanca = mudouNome || mudouWhats;

  /* O e-mail no campo mudou em relacao ao da conta? Muda o texto do
     botao para "Salvar", avisando que vai trocar de endereco. */
  const emailMudou =
    emailCampo.trim().toLowerCase() !== String(email || "").trim().toLowerCase();

  /* Pendente = mostra campo editavel + botao de acao ao lado. */
  const emailPendente = !visitante && !!email && emailConfirmado === false;

  /* Ainda da para corrigir o tipo sozinho? Visitante (sem conta) sempre
     pode; conta logada, so nos primeiros DIAS_PARA_CORRIGIR_TIPO dias. */
  const podeCorrigirTipo =
    visitante ||
    (!!criadoEm &&
      Date.now() - new Date(criadoEm).getTime() <= DIAS_PARA_CORRIGIR_TIPO * 86400000);

  useEffect(() => { setNome(nomeSalvo || ""); }, [nomeSalvo]);
  useEffect(() => { setEmailCampo(email || ""); }, [email]);

  /* Contagem regressiva do botao. */
  useEffect(() => {
    if (espera <= 0) return undefined;
    const t = setTimeout(() => setEspera((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [espera]);

  /* "Enviado" fica visivel 2s e entao cede lugar a contagem. */
  useEffect(() => {
    if (!enviado) return undefined;
    const t = setTimeout(() => setEnviado(false), 2000);
    return () => clearTimeout(t);
  }, [enviado]);

  // Busca o WhatsApp salvo, a origem da conta (Google ou e-mail) e a
  // data do cadastro.
  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const user = userData?.user;
        if (!user) return; // visitante
        // Verde so para quem entrou pelo Google; o resto fica pendente.
        if (ativo) {
          setEmailConfirmado(contaVeioDoGoogle(user));
          setCriadoEm(user.created_at || null);
        }

        const { data } = await supabase
          .from("perfis")
          .select("whatsapp")
          .eq("id", user.id)
          .single();
        if (!ativo) return;
        /* v15: sem numero no perfil, usa o telefone do login (conta que
           entrou pelo WhatsApp: user.phone vem como "5537999998888") */
        const numero = data?.whatsapp || user.phone || "";
        if (numero) {
          const local = formatarTelefone(String(numero).replace(/^\+?55/, ""));
          setWhats(local);
          setWhatsSalvo(local);
        }
      } catch {
        /* coluna ausente ou falha de rede — campo fica vazio */
      }
    })();
    return () => { ativo = false; };
  }, []);

  /* Dispara a verificacao do e-mail.
     - endereco IGUAL ao da conta  -> resend(), reenvia o link
     - endereco DIFERENTE          -> updateUser(), que manda o link
       para o endereco novo e so troca quando o link for aberto */
  async function verificarEmail() {
    if (enviandoEmail || espera > 0) return;

    setErroContato("");

    const novo = emailCampo.trim().toLowerCase();

    if (!emailPareceValido(novo)) {
      setErroContato("Digite um e-mail válido.");
      return;
    }

    if (!EMAIL_VERIFICACAO_ATIVA) {
      setErroContato("A verificação por e-mail ainda não está disponível.");
      return;
    }

    setEnviandoEmail(true);
    try {
      const { error } = emailMudou
        ? await supabase.auth.updateUser({ email: novo })
        : await supabase.auth.resend({ type: "signup", email: novo });

      if (error) {
        setErroContato("Não foi possível enviar agora. Tente de novo mais tarde.");
      } else {
        setEnviado(true);
        setEspera(ESPERA_REENVIO);
      }
    } catch {
      setErroContato("Não foi possível enviar agora. Tente de novo mais tarde.");
    } finally {
      setEnviandoEmail(false);
    }
  }

  /* O card travado do WhatsApp leva para a tela de troca, que pede a
     senha antes de qualquer coisa. */
  function alterarWhatsapp() {
    navigate("/alterar-whatsapp");
  }

  const inicial = (nome || "?").trim().charAt(0).toUpperCase();

  const cardStyle = {
    backgroundColor: "var(--surface)",
    border: "1px solid var(--border)",
  };

  const subAbertura =
    mesAbertura && anoAbertura
      ? `${MESES[Number(mesAbertura) - 1]} de ${anoAbertura}`
      : "Não informado";

  function salvarAlteracoes() {
    const nomeLimpo = nome.trim();
    const digitos = whats.replace(/\D/g, "");
    salvarNome(nomeLimpo);
    /* v15: na lista nova o WhatsApp nao e editavel (e o login), entao so
       o nome vai para o banco — sem risco de apagar o numero. */
    sincronizarPerfilNoBanco(
      MOSTRAR_LOGIN_EMAIL
        ? { nome: nomeLimpo, whatsapp: digitos ? `+55${digitos}` : null }
        : { nome: nomeLimpo }
    );
    setWhatsSalvo(whats);
    setSalvo(true);
    setTimeout(() => setSalvo(false), 1800);
  }

  /* "Escolhi errado no cadastro" dentro do prazo: troca e grava. */
  function corrigirTipo(novo) {
    setTipo(novo);
    sincronizarPerfilNoBanco({ tipo: novo });
    setFolhaTipoAberta(false);
  }

  /* Calendario da abertura: ano corrente grava; ano anterior APAGA
     (a informacao so importa no 1o ano) e o campo some. */
  function escolherAbertura(m, a) {
    if (Number(a) === anoAtual) {
      setMesAnoAbertura(m, a);
      sincronizarPerfilNoBanco({ mesAbertura: m, anoAbertura: a });
    } else {
      setMesAnoAbertura(null, null);
      sincronizarPerfilNoBanco({ mesAbertura: null, anoAbertura: null });
    }
    setCalendarioAberto(false);
  }

  /* O botao carrega o estado — por isso nao ha legenda na tela. */
  let textoBotaoEmail = "Verificar";
  if (enviandoEmail) textoBotaoEmail = "...";
  else if (enviado) textoBotaoEmail = "Enviado";
  else if (espera > 0) textoBotaoEmail = `${espera}s`;
  else if (emailMudou) textoBotaoEmail = "Salvar";

  const botaoEmailInativo = enviandoEmail || espera > 0 || enviado;

  return (
    <div
      className="tela-rolavel w-full flex flex-col"
      style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
    >
      {/* A folga no fim e o que permite ao teclado empurrar o conteudo
          sem cobrir o campo. Ver FOLGA_TECLADO no topo do arquivo. */}
      <div
        className="conteudo-rolavel hide-scrollbar px-5"
        style={{
          paddingBottom: `calc(${FOLGA_TECLADO}px + env(safe-area-inset-bottom))`,
        }}
      >
        <TopoRolavel titulo="Editar perfil" onVoltar={() => navigate(-1)} />

        {/* Avatar: só a inicial. A opção de foto foi retirada no piloto
            (será reativada quando o app for empacotado como nativo).
            v14: a bola toda fica escondida (MOSTRAR_AVATAR); no lugar,
            so um respiro antes de "Informações pessoais". */}
        {!MOSTRAR_AVATAR && <div aria-hidden style={{ height: 12 }} />}
        {MOSTRAR_AVATAR && (
        <div
          className="flex flex-col items-center"
          style={{ paddingTop: ESPACO_ACIMA_AVATAR, paddingBottom: ESPACO_ABAIXO_AVATAR }}
        >
          <div
            className="rounded-full overflow-hidden shrink-0 flex items-center justify-center"
            style={{
              width: 80,
              height: 80,
              minWidth: 80,
              minHeight: 80,
              boxSizing: "border-box",
              flexShrink: 0,
              background: "linear-gradient(160deg, var(--vidro-brilho-1) 0%, var(--vidro-brilho-2) 24%, transparent 58%), var(--vidro-bg)",
              backdropFilter: "blur(6px) saturate(160%)",
              WebkitBackdropFilter: "blur(6px) saturate(160%)",
              border: "1px solid var(--vidro-borda)",
              boxShadow: "inset 0 1.5px 0 0 var(--vidro-topo-forte), inset 0 9px 20px -8px var(--vidro-topo-medio), inset 0 -1.5px 0 0 var(--vidro-base), 0 8px 24px var(--vidro-sombra)",
            }}
            aria-label="Avatar"
          >
            <span className="font-bold" style={{ color: "var(--primary)", fontSize: 34 }}>
              {inicial || "?"}
            </span>
          </div>
        </div>
        )}

        {/* v15: com o login so pelo WhatsApp, a lista nova. O layout
            antigo (abaixo, depois do ":") volta com MOSTRAR_LOGIN_EMAIL. */}
        {!MOSTRAR_LOGIN_EMAIL ? (
          <>
            <SecaoLista titulo="Dados pessoais" style={{ marginTop: 8 }}>
              <LinhaCampo Icon={User} rotulo="Nome">
                <input
                  value={nome}
                  maxLength={LIMITE_NOME_INPUT}
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Seu nome"
                  className="flex-1 min-w-0 bg-transparent text-right outline-none"
                  style={{ color: "var(--text-secondary)", fontSize: 16, border: "none", boxShadow: "none" }}
                />
              </LinhaCampo>
              <LinhaLista
                Icon={Phone}
                rotulo="WhatsApp"
                valor={whatsSalvo ? `+55 ${whatsSalvo}` : "Não informado"}
                onClick={() => setAviso("whatsapp")}
              />
              {!visitante && email && (
                <LinhaLista Icon={Mail} rotulo="E-mail" valor={email} onClick={() => setAviso("email")} />
              )}
            </SecaoLista>

            {(mudouNome || salvo) && (
              <div className="pt-4">
                <button
                  onClick={salvarAlteracoes}
                  disabled={salvo}
                  className="w-full py-3.5 rounded-2xl font-semibold text-sm transition active:scale-[0.99]"
                  style={{
                    backgroundColor: salvo ? "var(--field)" : "var(--primary)",
                    color: salvo ? "var(--primary)" : "var(--primary-contrast)",
                  }}
                >
                  {salvo ? "Alterações salvas" : "Salvar alterações"}
                </button>
              </div>
            )}

            <SecaoLista titulo="Meu MEI">
              <LinhaLista
                Icon={Briefcase}
                rotulo="Tipo de MEI"
                valor={LABEL_PERFIL[tipo] || "Não informado"}
                onClick={() => setFolhaTipoAberta(true)}
              />
              {abriuEsteAno && (
                <LinhaLista
                  Icon={CalendarDays}
                  rotulo="Data de abertura"
                  valor={subAbertura}
                  onClick={() => setCalendarioAberto(true)}
                />
              )}
            </SecaoLista>

            {/* Excluir conta: no fim, separado, so texto vermelho */}
            {!visitante && (
              <div style={{ marginTop: 44 }}>
                <button
                  onClick={() => navigate("/excluir-conta")}
                  className="active:opacity-70 transition font-medium"
                  style={{ color: "var(--danger)", fontSize: 15 }}
                >
                  Excluir conta
                </button>
              </div>
            )}
          </>
        ) : (
        <>
        {/* ================= INFORMACOES PESSOAIS ================= */}
        <TituloSecao primeiro>Informações pessoais</TituloSecao>

        <div>
          <Rotulo>Nome</Rotulo>
          <div className="card-tacerto rounded-2xl px-4 py-4">
            <input
              value={nome}
              maxLength={LIMITE_NOME_INPUT}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Seu nome"
              className="w-full bg-transparent text-[16px] font-semibold outline-none"
              style={{ color: "var(--text)", border: "none", boxShadow: "none" }}
            />
          </div>
        </div>

        {/* ================= INFORMACOES DE CONTATO ================= */}
        <TituloSecao>Informações de contato</TituloSecao>

        <div className="space-y-4">
          <div>
            <Rotulo>E-mail</Rotulo>

            {emailPendente ? (
              /* PENDENTE: campo editavel + icone dentro + acao ao lado. */
              <div className="flex items-stretch gap-2">
                <div className="card-tacerto flex-1 min-w-0 rounded-2xl px-4 py-4 flex items-center gap-3">
                  <input
                    type="email"
                    inputMode="email"
                    value={emailCampo}
                    onChange={(e) => {
                      setEmailCampo(e.target.value);
                      setErroContato("");
                    }}
                    placeholder="seu@email.com"
                    autoComplete="email"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    className="flex-1 min-w-0 bg-transparent text-[16px] font-semibold outline-none placeholder:font-normal placeholder:opacity-50"
                    style={{ color: "var(--text)", border: "none", boxShadow: "none" }}
                  />
                  <AlertCircle size={20} style={{ color: "#f59e0b" }} className="shrink-0" />
                </div>

                <button
                  onClick={verificarEmail}
                  disabled={botaoEmailInativo}
                  className="shrink-0 px-4 rounded-2xl text-[14px] font-medium active:opacity-70 transition"
                  style={{
                    backgroundColor: "var(--field)",
                    color: botaoEmailInativo ? "var(--text-tertiary)" : "var(--text)",
                    minWidth: 92,
                  }}
                >
                  {textoBotaoEmail}
                </button>
              </div>
            ) : (
              /* VERIFICADO (ou visitante): texto simples e o check. */
              <div className="card-tacerto rounded-2xl px-4 py-4 flex items-center gap-3">
                <p
                  className="flex-1 min-w-0 truncate text-[16px] font-semibold"
                  style={{ color: visitante || !email ? "var(--text-tertiary)" : "var(--text)" }}
                  title={visitante ? "" : email || ""}
                >
                  {visitante ? "Sem e-mail cadastrado" : email || "—"}
                </p>
                {!visitante && email && emailConfirmado === true && (
                  <CheckCircle2 size={20} style={{ color: "var(--primary)" }} className="shrink-0" />
                )}
              </div>
            )}
          </div>

          <div>
            <Rotulo>WhatsApp</Rotulo>

            {whatsTravado ? (
              /* TRAVADO: so o numero e o check. O card inteiro leva para
                 a tela de troca, que pede a senha antes. */
              <button
                onClick={alterarWhatsapp}
                className="card-tacerto w-full rounded-2xl px-4 py-4 flex items-center gap-3 text-left active:opacity-75 transition"
              >
                <span
                  className="text-[16px] font-semibold shrink-0"
                  style={{ color: "var(--text-secondary)" }}
                >
                  +55
                </span>
                <span
                  className="flex-1 min-w-0 truncate text-[16px] font-semibold"
                  style={{ color: "var(--text)" }}
                >
                  {whatsSalvo}
                </span>
                <CheckCircle2 size={20} style={{ color: "var(--primary)" }} className="shrink-0" />
              </button>
            ) : (
              /* SEM NUMERO: campo aberto, para cadastrar o primeiro. */
              <div className="card-tacerto rounded-2xl px-4 py-4">
                <div className="flex items-center gap-2">
                  <span
                    className="text-[16px] font-semibold shrink-0"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    +55
                  </span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={whats}
                    onChange={(e) => setWhats(formatarTelefone(e.target.value))}
                    placeholder="(00) 00000-0000"
                    autoComplete="off"
                    className="flex-1 min-w-0 bg-transparent text-[16px] font-semibold outline-none placeholder:font-normal placeholder:opacity-50"
                    style={{ color: "var(--text)", border: "none", boxShadow: "none" }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Unica linha de texto da secao, e so quando algo da errado. */}
          {erroContato && (
            <p className="text-[13px]" style={{ color: "var(--danger)" }}>
              {erroContato}
            </p>
          )}
        </div>

        {(temMudanca || salvo) && (
          <div className="pt-4">
            <button
              onClick={salvarAlteracoes}
              disabled={salvo}
              className="w-full py-3.5 rounded-2xl font-semibold text-sm transition active:scale-[0.99]"
              style={{
                backgroundColor: salvo ? "var(--field)" : "var(--primary)",
                color: salvo ? "var(--primary)" : "var(--primary-contrast)",
              }}
            >
              {salvo ? "Alterações salvas" : "Salvar alterações"}
            </button>
          </div>
        )}

        {/* ================= PERFIL FISCAL ================= */}
        <TituloSecao>Perfil fiscal</TituloSecao>

        <div className="space-y-4">
          <CampoEscolha
            rotulo="Tipo de MEI"
            valor={LABEL_PERFIL[tipo] || "Não informado"}
            onClick={() => setFolhaTipoAberta(true)}
            travado
          />
          {/* So para quem abriu este ano (ver topo do arquivo). */}
          {abriuEsteAno && (
            <CampoEscolha
              rotulo="Data de abertura"
              valor={subAbertura}
              onClick={() => setCalendarioAberto(true)}
            />
          )}
        </div>

        {/* Excluir conta: sem card, so o icone e o texto. */}
        <div className="pt-8">
          <button
            onClick={() => navigate("/excluir-conta")}
            className="flex items-center gap-2.5 active:opacity-70 transition"
          >
            <Trash2 size={20} strokeWidth={2} style={{ color: "var(--danger)" }} />
            <span className="text-[16px] font-medium" style={{ color: "var(--danger)" }}>
              Excluir conta
            </span>
          </button>
        </div>
        </>
        )}
      </div>

      <Calendario
        aberto={calendarioAberto}
        modo="mesAno"
        mes={mesAbertura}
        ano={anoAbertura}
        onFechar={() => setCalendarioAberto(false)}
        onSelecionarMesAno={escolherAbertura}
      />

      {folhaTipoAberta && (
        <FolhaTipoMei
          tipo={tipo}
          podeCorrigir={podeCorrigirTipo}
          onFechar={() => setFolhaTipoAberta(false)}
          onCorrigir={corrigirTipo}
          cardStyle={cardStyle}
        />
      )}

      {aviso && (
        <AvisoFaleConosco
          texto={
            aviso === "whatsapp"
              ? "Seu número é usado para entrar no app. Para trocar, fale com a gente."
              : "Para trocar o e-mail, fale com a gente."
          }
          onWhatsApp={() => {
            const dados = dadosParaWhatsApp({ ...app, nome: nome.trim() || nomeSalvo });
            abrirWhatsAppFisco(
              aviso === "whatsapp"
                ? MENSAGENS_WHATSAPP.trocarNumero(dados)
                : MENSAGENS_WHATSAPP.falarComFisco(dados)
            );
            setAviso(null);
          }}
          onFechar={() => setAviso(null)}
          cardStyle={cardStyle}
        />
      )}
    </div>
  );
}