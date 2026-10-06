/* FOLHAATUALIZARVELOCIMETRO v2 — "Fisco.ia" vira "Fisco" nos textos da tela (so a Apresentacao do Fisco.ia mantem o nome) (v1: notificacao "Atualize seu velocimetro": 2 jeitos faceis (digitar o total do ano no "+" ou mandar valores/extrato pro Fisco.ia no WhatsApp)) */
import { useNavigate } from "react-router-dom";
import { ChevronRight, Hash } from "lucide-react";
import FolhaDeBaixo from "./FolhaDeBaixo.jsx";
import IconeWhatsApp from "./IconeWhatsApp.jsx";
import { useAppState } from "@/context/AppStateContext";
import { MENSAGENS_WHATSAPP, dadosParaWhatsApp, abrirWhatsAppFisco } from "@/config/piloto";

/* ===================================================================
   ATUALIZE SEU VELOCIMETRO (05/10/2026 — pedido do Fernando)

   Abre pela notificacao do sininho. O foco e mostrar como e FACIL:
   "Leva menos de 1 minuto" e duas opcoes, cada uma com uma frase curta:
     1) Digitar o total do ano  -> "+" ja no modo "Total do ano"
        (/lancar?modo=total): um numero so e o velocimetro fica igual
        a ele (ver Lancar.jsx).                     [destaque: borda verde fina]
     2) Mandar pro Fisco.ia no WhatsApp -> mensagem pronta
        (MENSAGENS_WHATSAPP.atualizarVelocimetro); a pessoa manda os
        valores ou uma foto do extrato e a equipe atualiza.
   =================================================================== */

function Opcao({ Icon, titulo, frase, destaque, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="toque w-full flex items-center text-left rounded-2xl"
      style={{
        gap: 14,
        padding: "15px 14px 15px 16px",
        background: "none",
        border: `1px solid ${destaque ? "rgba(34,197,94,0.45)" : "var(--border)"}`,
      }}
    >
      <Icon size={22} strokeWidth={1.9} className="shrink-0" style={{ color: "var(--primary)" }} />
      <span className="flex-1 min-w-0">
        <span className="block font-semibold leading-snug" style={{ color: "var(--text)", fontSize: 16 }}>
          {titulo}
        </span>
        <span className="block leading-snug" style={{ color: "var(--text-secondary)", fontSize: 14, marginTop: 3 }}>
          {frase}
        </span>
      </span>
      <ChevronRight size={18} className="shrink-0" style={{ color: "var(--text-tertiary)", opacity: 0.7 }} />
    </button>
  );
}

export default function FolhaAtualizarVelocimetro({ aberto, onFechar }) {
  const navigate = useNavigate();
  const app = useAppState();
  const ano = new Date().getFullYear();

  return (
    <FolhaDeBaixo aberto={aberto} onFechar={onFechar} titulo="Atualize seu velocímetro">
      <p className="text-center" style={{ color: "var(--text-secondary)", fontSize: 15, marginTop: -4, marginBottom: 18 }}>
        Leva menos de 1 minuto.
      </p>
      <div className="flex flex-col" style={{ gap: 10, paddingBottom: 8 }}>
        <Opcao
          Icon={Hash}
          titulo="Digitar o total do ano"
          frase={`Só um número: quanto você já faturou em ${ano}.`}
          destaque
          onClick={() => {
            onFechar();
            navigate("/lancar?modo=total", { state: { de: "dashboard" } });
          }}
        />
        <Opcao
          Icon={IconeWhatsApp}
          titulo="Mandar pro Fisco"
          frase="Mande os valores ou a foto do extrato. Ele atualiza pra você."
          onClick={() => {
            abrirWhatsAppFisco(MENSAGENS_WHATSAPP.atualizarVelocimetro(dadosParaWhatsApp(app)));
            onFechar();
          }}
        />
      </div>
    </FolhaDeBaixo>
  );
}
