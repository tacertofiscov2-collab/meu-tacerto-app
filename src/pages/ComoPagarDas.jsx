/* COMOPAGARDAS v2 — "Fisco" vira "Fisco.ia" nos textos da tela (v1: passo a passo para gerar e pagar o boleto do DAS no PGMEI (piloto)) */
import { useLocation, useNavigate } from "react-router-dom";
import { CalendarClock, ExternalLink, MessageCircle } from "lucide-react";
import TopoRolavel from "../components/TopoRolavel.jsx";
import { useAppState } from "@/context/AppStateContext";
import {
  LINK_PGMEI, MENSAGENS_WHATSAPP, dadosParaWhatsApp, abrirWhatsAppFisco,
} from "@/config/piloto";

/* ===================================================================
   CONTEUDO PROVISORIO - CONFERIR PASSOS NO SITE REAL

   COMO PAGAR O DAS (04/10/2026 — piloto)

   Aberta pela opcao "Quero fazer sozinho" do painel do DAS (Inicio) e
   pelo item "Como pagar o DAS" do Perfil. Chave MOSTRAR_TUTORIAL_DAS
   em src/config/piloto.js.

   ⚠️ Os nomes dos botoes do PGMEI ("Emitir Guia de Pagamento (DAS)",
   "Apurar / Gerar DAS") foram escritos de memoria: conferir no site
   real antes do piloto.
   =================================================================== */

const PASSOS = [
  {
    titulo: "Abra o PGMEI",
    texto: "Toque no botão lá embaixo. É o site do governo que gera o boleto do DAS.",
  },
  {
    titulo: "Digite seu CNPJ",
    texto: "Só os números do CNPJ do seu MEI. Depois, toque em \"Continuar\".",
  },
  {
    titulo: "Confirme que não é robô",
    texto: "Marque o quadradinho do captcha. Às vezes ele pede para escolher umas imagens.",
  },
  {
    titulo: "Escolha o ano",
    texto: "Toque em \"Emitir Guia de Pagamento (DAS)\" e escolha o ano.",
  },
  {
    titulo: "Marque o mês",
    texto: "Marque o mês que você vai pagar e toque em \"Apurar / Gerar DAS\".",
  },
  {
    titulo: "Gere o boleto",
    texto: "Baixe o PDF ou copie o código de barras.",
  },
  {
    titulo: "Pague no app do banco",
    texto: "Abra o app do seu banco e pague com o código de barras (ou o Pix, se aparecer).",
  },
];

export default function ComoPagarDas() {
  const navigate = useNavigate();
  const location = useLocation();
  const app = useAppState();

  /* Aberta direto pelo endereco (sem tela antes): volta para o Inicio */
  function voltar() {
    if (location.key !== "default") navigate(-1);
    else navigate("/dashboard", { replace: true });
  }

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
        <TopoRolavel titulo="Como pagar o DAS" onVoltar={voltar} />

        {/* Lembrete */}
        <div
          className="rounded-2xl flex mt-2"
          style={{
            gap: 10,
            padding: "12px 14px",
            backgroundColor: "rgba(245,158,11,0.10)",
            border: "1px solid rgba(245,158,11,0.40)",
          }}
        >
          <CalendarClock size={18} strokeWidth={2.2} className="shrink-0" style={{ color: "#f59e0b", marginTop: 2 }} />
          <div className="text-[14px] leading-relaxed" style={{ color: "var(--text)" }}>
            <p><strong>Vence todo dia 20.</strong></p>
            <p style={{ color: "var(--text-secondary)" }}>
              Atrasou, vem multa e juros. Pagando em dia, você mantém seus direitos no INSS.
            </p>
          </div>
        </div>

        <div className="space-y-2 mt-4">
          {PASSOS.map((p, i) => (
            <div
              key={p.titulo}
              className="rounded-2xl px-4 py-3.5 flex"
              style={{ gap: 12, border: "1px solid var(--border)", backgroundColor: "transparent" }}
            >
              <span
                className="rounded-full flex items-center justify-center shrink-0"
                style={{
                  width: 26,
                  height: 26,
                  backgroundColor: "rgba(34,197,94,0.14)",
                  color: "var(--primary)",
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[14.5px] font-semibold leading-snug" style={{ color: "var(--text)" }}>
                  {p.titulo}
                </p>
                <p className="text-[13.5px] leading-relaxed mt-1" style={{ color: "var(--text-secondary)" }}>
                  {p.texto}
                </p>
              </div>
            </div>
          ))}
        </div>

        <a
          href={LINK_PGMEI}
          target="_blank"
          rel="noopener noreferrer"
          className="toque w-full rounded-2xl font-semibold flex items-center justify-center mt-5 active:scale-[0.98] transition"
          style={{
            gap: 8,
            paddingTop: 14,
            paddingBottom: 14,
            fontSize: 16,
            backgroundColor: "var(--primary)",
            color: "var(--primary-contrast)",
            textDecoration: "none",
          }}
        >
          Abrir o PGMEI
          <ExternalLink size={17} strokeWidth={2.2} />
        </a>

        {/* No fim: a mesma mensagem da opcao "Fisco me ajuda agora" */}
        <button
          type="button"
          onClick={() => abrirWhatsAppFisco(MENSAGENS_WHATSAPP.dasAjudaAgora(dadosParaWhatsApp(app)))}
          className="toque w-full rounded-2xl font-semibold flex items-center justify-center mt-3 active:scale-[0.98] transition"
          style={{
            gap: 8,
            paddingTop: 13,
            paddingBottom: 13,
            fontSize: 15,
            backgroundColor: "rgba(34,197,94,0.16)",
            border: "1px solid rgba(34,197,94,0.45)",
            color: "var(--primary)",
          }}
        >
          <MessageCircle size={17} strokeWidth={2.2} />
          Prefiro que o Fisco.ia me ajude
        </button>
      </div>
    </div>
  );
}
