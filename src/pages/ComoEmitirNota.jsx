/* COMOEMITIRNOTA v3 — "Escolha como emitir sua nota": com o Fisco pelo WhatsApp, fazer sozinho (passo a passo recolhivel) ou Certificado A1 (em breve) */
import { useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  AlertTriangle, ExternalLink, MessageCircle, ListChecks, BadgeCheck, ChevronDown,
} from "lucide-react";
import TopoRolavel from "../components/TopoRolavel.jsx";
import {
  MENSAGENS_WHATSAPP, dadosParaWhatsApp, abrirWhatsAppFisco,
} from "@/config/piloto";
import { useAppState } from "@/context/AppStateContext";

/* ===================================================================
   CONTEUDO PROVISORIO - CONFERIR

   COMOEMITIRNOTA v3 (04/10/2026) — pedido do Fernando:
   - Topo: aviso curto (pelo tipo de MEI, ver CONTEUDO_POR_TIPO).
   - "Escolha como emitir sua nota", com 3 cards:
       a) Emitir com o Fisco pelo WhatsApp — selo "Grátis durante o
          piloto". Abre o WhatsApp com MENSAGENS_WHATSAPP.notaAjuda.
          No piloto, quem ajuda e o Fernando, na mao.
       b) Fazer sozinho — o passo a passo que ja existia (v2), agora
          RECOLHIVEL (abre e fecha no proprio card).
       c) Nota automatica com Certificado Digital A1 — selo "Em breve".
          Explicacao recolhivel + botao "Tenho interesse no certificado"
          (MENSAGENS_WHATSAPP.certificadoA1), para medir o interesse.
   - A linguagem segue o tipo do perfil (a tela e de dentro do app):
     caminhoneiro fala em frete e transportadora; MEI comum, em servico
     e cliente.

   ⚠️ Os nomes dos botoes do site ("Emitir NFS-e", "Download DANFSe")
   foram escritos de memoria: conferir no site real antes do piloto.
   ⚠️ Conferir com o contador o aviso do topo (NFS-e x CT-e) e o texto
   do Certificado A1 (custo, validade, como tira).

   v2: textos pelo tipo de MEI. v1: passo a passo do Emissor Nacional.
   =================================================================== */

const LINK_EMISSOR_NACIONAL = "https://www.nfse.gov.br/EmissorNacional";

/* Passos iguais para os dois tipos (o comeco e o fim). */
const PASSO_ENTRAR = {
  titulo: "Entre no Emissor Nacional",
  texto: "Abra o site pelo botão lá embaixo e entre com a sua conta gov.br.",
};
const PASSO_NOVA = {
  titulo: "Comece uma nota nova",
  texto: "No menu, toque em \"Emitir NFS-e\".",
};
const PASSO_EMITIR = {
  titulo: "Emita",
  texto: "Confira tudo e toque em \"Emitir NFS-e\".",
};

const CONTEUDO_POR_TIPO = {
  MEI_CAMINHONEIRO: {
    /* Texto do aviso pedido pelo Fernando (conferir com o contador) */
    aviso: "Agregado de transportadora geralmente emite NFS-e. Se você pega frete direto, pode precisar de CT-e.",
    explicacaoFisco: "Você me manda o valor e pra quem foi o frete, eu monto tudo e te guio no gov.br.",
    passos: [
      PASSO_ENTRAR,
      PASSO_NOVA,
      {
        titulo: "Quem contratou o frete",
        texto: "Em \"Tomador do serviço\", escolha Brasil e digite o CNPJ da transportadora. O nome dela aparece sozinho.",
      },
      {
        titulo: "O serviço",
        texto: "Informe a cidade onde o serviço foi feito, escolha o código do serviço de transporte e escreva a descrição. Exemplo: \"Frete de [cidade] para [cidade], dia [data]\".",
      },
      { titulo: "O valor", texto: "Digite o valor do frete." },
      PASSO_EMITIR,
      {
        titulo: "Baixe o PDF",
        texto: "Na nota emitida, toque em \"Download DANFSe\": é o PDF da nota. Guarde e mande para a transportadora.",
      },
    ],
    /* A1 tambem serve para os documentos do transporte */
    vantagemExtra: "Serve também para CT-e e MDF-e.",
  },
  MEI: {
    aviso: "Este passo a passo é para quem presta serviço (NFS-e). Se você vende produtos, a nota é outra (NF-e).",
    explicacaoFisco: "Você me manda o valor e pra quem foi o serviço, eu monto tudo e te guio no gov.br.",
    passos: [
      PASSO_ENTRAR,
      PASSO_NOVA,
      {
        titulo: "Quem contratou o serviço",
        texto: "Em \"Tomador do serviço\", escolha Brasil e digite o CNPJ ou o CPF do cliente.",
      },
      {
        titulo: "O serviço",
        texto: "Informe a cidade onde o serviço foi feito, escolha o código do seu serviço e escreva a descrição. Exemplo: \"Serviço de [o que você fez], dia [data]\".",
      },
      { titulo: "O valor", texto: "Digite o valor do serviço." },
      PASSO_EMITIR,
      {
        titulo: "Baixe o PDF",
        texto: "Na nota emitida, toque em \"Download DANFSe\": é o PDF da nota. Guarde e mande para o cliente.",
      },
    ],
    vantagemExtra: null,
  },
};

/* Selo pequeno (verde = disponivel; cinza = em breve) */
function Selo({ children, apagado = false }) {
  return (
    <span
      className="inline-block rounded-full font-semibold"
      style={{
        fontSize: 11.5,
        padding: "2px 9px",
        color: apagado ? "var(--text-secondary)" : "var(--primary)",
        backgroundColor: apagado ? "var(--vidro-superficie)" : "rgba(34,197,94,0.16)",
        border: apagado ? "1px solid var(--border)" : "none",
      }}
    >
      {children}
    </span>
  );
}

/* Bloco de texto da explicacao do A1 */
function BlocoA1({ titulo, itens }) {
  return (
    <div style={{ marginTop: 14 }}>
      <p className="text-[14px] font-semibold" style={{ color: "var(--text)" }}>{titulo}</p>
      <ul className="mt-1.5 space-y-1">
        {itens.map((t) => (
          <li key={t} className="flex text-[13.5px] leading-relaxed" style={{ gap: 8, color: "var(--text-secondary)" }}>
            <span aria-hidden style={{ color: "var(--primary)" }}>•</span>
            <span>{t}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ComoEmitirNota() {
  const navigate = useNavigate();
  const location = useLocation();
  const app = useAppState();
  const caminhoneiro = app.tipoMEI === "MEI_CAMINHONEIRO";
  const conteudo = CONTEUDO_POR_TIPO[app.tipoMEI] || CONTEUDO_POR_TIPO.MEI;
  const dados = dadosParaWhatsApp(app);

  const [sozinhoAberto, setSozinhoAberto] = useState(false);
  const [a1Aberto, setA1Aberto] = useState(false);
  const sozinhoRef = useRef(null);
  const a1Ref = useRef(null);

  /* Aberta direto pelo endereco (sem tela antes): volta para o Inicio */
  function voltar() {
    if (location.key !== "default") navigate(-1);
    else navigate("/dashboard", { replace: true });
  }

  /* Abre/fecha um card recolhivel e, ao abrir, rola ate ele */
  function alternar(aberto, setAberto, ref) {
    const abrir = !aberto;
    setAberto(abrir);
    if (abrir) setTimeout(() => ref.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 60);
  }

  const cardBase = {
    border: "1px solid var(--border)",
    backgroundColor: "var(--vidro-superficie)",
  };

  return (
    <div
      className="tela-rolavel w-full flex flex-col"
      style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
    >
      {/* Filho DIRETO de .tela-rolavel (padrao de rolagem do app) */}
      <div
        className="conteudo-rolavel hide-scrollbar w-full max-w-md mx-auto px-5"
        style={{ paddingBottom: "calc(40px + env(safe-area-inset-bottom))" }}
      >
        <TopoRolavel titulo="Como emitir sua nota" onVoltar={voltar} />

        {/* Aviso curto do topo (pelo tipo de MEI) */}
        <div
          className="rounded-2xl flex mt-2"
          style={{
            gap: 10,
            padding: "12px 14px",
            backgroundColor: "rgba(245,158,11,0.10)",
            border: "1px solid rgba(245,158,11,0.40)",
          }}
        >
          <AlertTriangle size={18} strokeWidth={2.2} className="shrink-0" style={{ color: "#f59e0b", marginTop: 2 }} />
          <p className="text-[14px] leading-relaxed" style={{ color: "var(--text)" }}>
            {conteudo.aviso}
          </p>
        </div>

        <h2 className="text-[17px] font-bold" style={{ color: "var(--text)", marginTop: 22, marginBottom: 10 }}>
          Escolha como emitir sua nota
        </h2>

        <div className="space-y-2.5">
          {/* a) Com o Fisco pelo WhatsApp (destaque leve) */}
          <div
            className="rounded-2xl"
            style={{
              padding: "14px 14px 12px",
              border: "1px solid rgba(34,197,94,0.45)",
              backgroundColor: "rgba(34,197,94,0.08)",
            }}
          >
            <div className="flex items-start" style={{ gap: 12 }}>
              <span
                className="rounded-xl flex items-center justify-center shrink-0"
                style={{ width: 36, height: 36, backgroundColor: "rgba(34,197,94,0.14)" }}
              >
                <MessageCircle size={18} strokeWidth={2.1} style={{ color: "var(--primary)" }} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[15.5px] font-semibold leading-snug" style={{ color: "var(--text)" }}>
                  Emitir com o Fisco pelo WhatsApp
                </p>
                <div style={{ marginTop: 5 }}>
                  <Selo>Grátis durante o piloto</Selo>
                </div>
                <p className="text-[13.5px] leading-relaxed" style={{ color: "var(--text-secondary)", marginTop: 6 }}>
                  {conteudo.explicacaoFisco}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => abrirWhatsAppFisco(MENSAGENS_WHATSAPP.notaAjuda(dados, caminhoneiro))}
              className="toque w-full rounded-2xl font-semibold flex items-center justify-center active:scale-[0.98] transition"
              style={{
                gap: 8,
                marginTop: 12,
                paddingTop: 12,
                paddingBottom: 12,
                fontSize: 15,
                backgroundColor: "var(--primary)",
                color: "var(--primary-contrast)",
              }}
            >
              <MessageCircle size={17} strokeWidth={2.2} />
              Chamar o Fisco no WhatsApp
            </button>
          </div>

          {/* b) Fazer sozinho (recolhivel) */}
          <div ref={sozinhoRef} className="rounded-2xl" style={cardBase}>
            <button
              type="button"
              onClick={() => alternar(sozinhoAberto, setSozinhoAberto, sozinhoRef)}
              aria-expanded={sozinhoAberto}
              className="toque w-full flex items-center text-left"
              style={{ gap: 12, padding: "14px" }}
            >
              <span
                className="rounded-xl flex items-center justify-center shrink-0"
                style={{ width: 36, height: 36, backgroundColor: "rgba(34,197,94,0.14)" }}
              >
                <ListChecks size={18} strokeWidth={2.1} style={{ color: "var(--primary)" }} />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-[15.5px] font-semibold" style={{ color: "var(--text)" }}>Fazer sozinho</span>
                <span className="block text-[13px]" style={{ color: "var(--text-secondary)", marginTop: 2 }}>
                  Passo a passo no Emissor Nacional
                </span>
              </span>
              <ChevronDown
                size={18}
                className="shrink-0"
                style={{
                  color: "var(--text-tertiary)",
                  transform: sozinhoAberto ? "rotate(180deg)" : "none",
                  transition: "transform 200ms ease",
                }}
              />
            </button>

            {sozinhoAberto && (
              <div style={{ padding: "0 14px 14px" }}>
                <div className="space-y-2">
                  {conteudo.passos.map((p, i) => (
                    <div
                      key={p.titulo}
                      className="rounded-2xl px-3.5 py-3 flex"
                      style={{ gap: 12, border: "1px solid var(--border)", backgroundColor: "var(--bg)" }}
                    >
                      <span
                        className="rounded-full flex items-center justify-center shrink-0"
                        style={{
                          width: 24,
                          height: 24,
                          backgroundColor: "rgba(34,197,94,0.14)",
                          color: "var(--primary)",
                          fontSize: 12.5,
                          fontWeight: 700,
                        }}
                      >
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-semibold leading-snug" style={{ color: "var(--text)" }}>
                          {p.titulo}
                        </p>
                        <p className="text-[13px] leading-relaxed mt-1" style={{ color: "var(--text-secondary)" }}>
                          {p.texto}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <a
                  href={LINK_EMISSOR_NACIONAL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="toque w-full rounded-2xl font-semibold flex items-center justify-center mt-3 active:scale-[0.98] transition"
                  style={{
                    gap: 8,
                    paddingTop: 12,
                    paddingBottom: 12,
                    fontSize: 15,
                    backgroundColor: "rgba(34,197,94,0.16)",
                    border: "1px solid rgba(34,197,94,0.45)",
                    color: "var(--primary)",
                    textDecoration: "none",
                  }}
                >
                  Abrir o Emissor Nacional
                  <ExternalLink size={16} strokeWidth={2.2} />
                </a>
              </div>
            )}
          </div>

          {/* c) Certificado Digital A1 — em breve (recolhivel) */}
          <div ref={a1Ref} className="rounded-2xl" style={cardBase}>
            <button
              type="button"
              onClick={() => alternar(a1Aberto, setA1Aberto, a1Ref)}
              aria-expanded={a1Aberto}
              className="toque w-full flex items-center text-left"
              style={{ gap: 12, padding: "14px" }}
            >
              <span
                className="rounded-xl flex items-center justify-center shrink-0"
                style={{ width: 36, height: 36, backgroundColor: "var(--vidro-superficie)", border: "1px solid var(--border)" }}
              >
                <BadgeCheck size={18} strokeWidth={2.1} style={{ color: "var(--text-secondary)" }} />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-[15.5px] font-semibold leading-snug" style={{ color: "var(--text)" }}>
                  Nota automática com Certificado Digital A1
                </span>
                <span className="block" style={{ marginTop: 5 }}>
                  <Selo apagado>Em breve</Selo>
                </span>
              </span>
              <ChevronDown
                size={18}
                className="shrink-0"
                style={{
                  color: "var(--text-tertiary)",
                  transform: a1Aberto ? "rotate(180deg)" : "none",
                  transition: "transform 200ms ease",
                }}
              />
            </button>

            {a1Aberto && (
              <div style={{ padding: "0 14px 14px" }}>
                <BlocoA1
                  titulo="O que é"
                  itens={["A assinatura digital do seu CNPJ. É como uma CNH da sua empresa na internet."]}
                />
                <BlocoA1
                  titulo="Vantagens"
                  itens={[
                    "O Fisco emite a nota por você, e você só confirma.",
                    "Não precisa entrar no gov.br toda vez.",
                    ...(conteudo.vantagemExtra ? [conteudo.vantagemExtra] : []),
                    "Nada é emitido sem a sua confirmação.",
                  ]}
                />
                <BlocoA1
                  titulo="Como tira"
                  itens={[
                    "Por videochamada no celular, com a CNH ou o RG na mão.",
                    "Vale por 1 ano.",
                    "Tem custo (valor a confirmar).",
                    "O TaCerto! te ajuda a agendar.",
                  ]}
                />
                <BlocoA1
                  titulo="Segurança"
                  itens={[
                    "O certificado fica numa plataforma de emissão de notas com segurança de banco.",
                    "Nunca pedimos a sua senha do gov.br.",
                  ]}
                />
                <button
                  type="button"
                  onClick={() => abrirWhatsAppFisco(MENSAGENS_WHATSAPP.certificadoA1(dados))}
                  className="toque w-full rounded-2xl font-semibold flex items-center justify-center mt-4 active:scale-[0.98] transition"
                  style={{
                    gap: 8,
                    paddingTop: 12,
                    paddingBottom: 12,
                    fontSize: 15,
                    backgroundColor: "rgba(34,197,94,0.16)",
                    border: "1px solid rgba(34,197,94,0.45)",
                    color: "var(--primary)",
                  }}
                >
                  <MessageCircle size={17} strokeWidth={2.2} />
                  Tenho interesse no certificado
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
