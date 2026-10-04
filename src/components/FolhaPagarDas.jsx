/* FOLHAPAGARDAS v1 — "Como voce quer pagar seu DAS?": boleto todo mes no WhatsApp, Fisco ajuda agora, fazer sozinho, site do governo */
import { useNavigate } from "react-router-dom";
import { MessageCircle, Headphones, ListChecks, Globe, ChevronRight } from "lucide-react";
import FolhaDeBaixo from "./FolhaDeBaixo.jsx";
import { useAppState } from "@/context/AppStateContext";
import {
  MENSAGENS_WHATSAPP, dadosParaWhatsApp, abrirWhatsAppFisco, LINK_PGMEI, MOSTRAR_TUTORIAL_DAS,
} from "@/config/piloto";

/* ===================================================================
   FOLHA "COMO VOCE QUER PAGAR SEU DAS?" (04/10/2026 — piloto)

   Abre pelo botao "Emitir boleto" do card "Proximo DAS" do Inicio.
   Ordem pedida pelo Fernando (a primeira com destaque leve):
     a) Receber meu boleto todo mes no WhatsApp  -> WhatsApp (selo "Automático")
     b) Fisco me ajuda agora                     -> WhatsApp
     c) Quero fazer sozinho                      -> /como-pagar-das
     d) Abrir o site do governo                  -> PGMEI, em nova aba
   No piloto, a) e b) sao atendidas a mao pelo Fernando. Cada uma manda
   uma mensagem diferente (MENSAGENS_WHATSAPP em src/config/piloto.js),
   para dar para medir o interesse em cada opcao.
   =================================================================== */

function Opcao({ Icon, titulo, explicacao, selo, destaque, onClick, href }) {
  const estilo = {
    gap: 12,
    padding: "12px 14px",
    border: `1px solid ${destaque ? "rgba(34,197,94,0.45)" : "var(--vidro-borda)"}`,
    backgroundColor: destaque ? "rgba(34,197,94,0.08)" : "var(--vidro-superficie)",
    textDecoration: "none",
  };
  const conteudo = (
    <>
      <span
        className="rounded-xl flex items-center justify-center shrink-0"
        style={{ width: 36, height: 36, backgroundColor: "rgba(34,197,94,0.14)" }}
      >
        <Icon size={18} strokeWidth={2.1} style={{ color: "var(--primary)" }} />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block font-semibold leading-snug" style={{ color: "var(--text)", fontSize: 15 }}>
          {titulo}
        </span>
        {selo && (
          <span
            className="inline-block rounded-full font-semibold"
            style={{
              fontSize: 11,
              padding: "2px 8px",
              marginTop: 4,
              color: "var(--primary)",
              backgroundColor: "rgba(34,197,94,0.16)",
            }}
          >
            {selo}
          </span>
        )}
        <span className="block leading-snug" style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 3 }}>
          {explicacao}
        </span>
      </span>
      <ChevronRight size={16} className="shrink-0" style={{ color: "var(--text-tertiary)" }} />
    </>
  );

  const classe = "toque w-full rounded-2xl flex items-center text-left active:scale-[0.99] transition";
  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" onClick={onClick} className={classe} style={estilo}>
        {conteudo}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} className={classe} style={estilo}>
      {conteudo}
    </button>
  );
}

export default function FolhaPagarDas({ aberto, onFechar }) {
  const navigate = useNavigate();
  const app = useAppState();
  const dados = dadosParaWhatsApp(app);

  function noWhatsApp(texto) {
    abrirWhatsAppFisco(texto);
    onFechar();
  }

  return (
    <FolhaDeBaixo aberto={aberto} onFechar={onFechar} titulo="Como você quer pagar seu DAS?">
      <div className="flex flex-col" style={{ gap: 8 }}>
        <Opcao
          Icon={MessageCircle}
          titulo="Receber meu boleto todo mês no WhatsApp"
          selo="Automático"
          explicacao="O Fisco te manda o boleto pronto todo mês, antes do vencimento."
          destaque
          onClick={() => noWhatsApp(MENSAGENS_WHATSAPP.dasAutomatico(dados))}
        />
        <Opcao
          Icon={Headphones}
          titulo="Fisco me ajuda agora"
          explicacao="Te mando o boleto deste mês e tiro suas dúvidas."
          onClick={() => noWhatsApp(MENSAGENS_WHATSAPP.dasAjudaAgora(dados))}
        />
        {MOSTRAR_TUTORIAL_DAS && (
          <Opcao
            Icon={ListChecks}
            titulo="Quero fazer sozinho"
            explicacao="Passo a passo simples."
            onClick={() => {
              onFechar();
              navigate("/como-pagar-das", { state: { de: "dashboard" } });
            }}
          />
        )}
        <Opcao
          Icon={Globe}
          titulo="Abrir o site do governo"
          explicacao="Vai direto pro PGMEI."
          href={LINK_PGMEI}
          onClick={onFechar}
        />
      </div>
    </FolhaDeBaixo>
  );
}
