/* COMOPAGARDAS v4 — "Fisco.ia" vira "Fisco" nos textos da tela (so a Apresentacao do Fisco.ia mantem o nome) (v3: padrao do Perfil (lista simples, sem cartoes nem caixa amarela, letras maiores; acoes como linhas) (v2: Fisco.ia; v1: passo a passo do PGMEI)) */
import { useLocation, useNavigate } from "react-router-dom";
import { CalendarClock, ExternalLink, MessageCircle } from "lucide-react";
import TopoRolavel from "../components/TopoRolavel.jsx";
import { SecaoLista, LinhaLista, numeroDoPasso } from "../components/ListaSimples.jsx";
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
    texto: "Toque em \"Abrir o PGMEI\", lá embaixo. É o site do governo que gera o boleto do DAS.",
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

        {/* v3: lembrete como linha simples (sem a caixa amarela) */}
        <SecaoLista style={{ marginTop: 4 }}>
          <LinhaLista
            Icon={CalendarClock}
            rotulo="Vence todo dia 20"
            detalhe="Atrasou, vem multa e juros. Pagando em dia, você mantém seus direitos no INSS."
          />
        </SecaoLista>

        {/* v3: passos em lista (numero no lugar do icone), sem cartoes */}
        <SecaoLista titulo="Passo a passo">
          {PASSOS.map((p, i) => (
            <LinhaLista key={p.titulo} Icon={numeroDoPasso(i + 1)} rotulo={p.titulo} detalhe={p.texto} />
          ))}
        </SecaoLista>

        {/* v3: acoes como linhas, igual ao Perfil */}
        <SecaoLista titulo="Abrir">
          <LinhaLista
            Icon={ExternalLink}
            rotulo="Abrir o PGMEI"
            detalhe="Site do governo que gera o boleto"
            onClick={() => window.open(LINK_PGMEI, "_blank", "noopener")}
          />
          {/* a mesma mensagem da opcao "Fisco.ia me ajuda agora" */}
          <LinhaLista
            Icon={MessageCircle}
            rotulo="Prefiro que o Fisco me ajude"
            onClick={() => abrirWhatsAppFisco(MENSAGENS_WHATSAPP.dasAjudaAgora(dadosParaWhatsApp(app)))}
          />
        </SecaoLista>
      </div>
    </div>
  );
}
