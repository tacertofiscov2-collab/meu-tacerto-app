/* FOLHAATUALIZARVELOCIMETRO v3 — 3 jeitos de atualizar, uma frase cada: Enviar extrato (recomendado, borda verde fina), Digitar (o "+", Recebimento ou Total do ano) e Mandar pro Fisco no WhatsApp; abre pelo sininho e pelo botao "Atualizar velocímetro" do Inicio (v2: "Fisco.ia" vira "Fisco" nos textos da tela (v1: notificacao "Atualize seu velocimetro": 2 jeitos faceis (digitar o total do ano no "+" ou mandar valores/extrato pro Fisco.ia no WhatsApp)) */
import { useNavigate } from "react-router-dom";
import { ChevronRight, FileUp, Hash } from "lucide-react";
import FolhaDeBaixo from "./FolhaDeBaixo.jsx";
import IconeWhatsApp from "./IconeWhatsApp.jsx";
import { useAppState } from "@/context/AppStateContext";
import { MENSAGENS_WHATSAPP, dadosParaWhatsApp, abrirWhatsAppFisco } from "@/config/piloto";

/* ===================================================================
   ATUALIZE SEU VELOCIMETRO (v3 — 10/10/2026, tarefa de 08-10)

   Abre pelo botao "Atualizar velocímetro" do Inicio e pela notificacao
   do sininho. Tres jeitos, cada um com UMA frase:
     1) Enviar extrato (RECOMENDADO: so a borda verde fina, sem selo) ->
        /enviar-extrato, dentro do app ("quem esta no app resolve no
        app"). E o unico que separa por mes e guarda os gastos.
     2) Digitar -> o "+" (/lancar?modo=total; la da para trocar para
        Recebimento). A frase avisa o que se perde digitando a mao.
     3) Mandar pro Fisco no WhatsApp -> mensagem pronta
        (MENSAGENS_WHATSAPP.atualizarVelocimetro).
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

  return (
    <FolhaDeBaixo aberto={aberto} onFechar={onFechar} titulo="Atualize seu velocímetro">
      <div className="flex flex-col" style={{ gap: 10, paddingBottom: 8 }}>
        <Opcao
          Icon={FileUp}
          titulo="Enviar extrato"
          frase="Eu separo tudo por mês e guardo seus gastos."
          destaque
          onClick={() => {
            onFechar();
            navigate("/enviar-extrato", { state: { de: "dashboard" } });
          }}
        />
        <Opcao
          Icon={Hash}
          titulo="Digitar"
          frase="Rápido, mas sem histórico nem gastos."
          onClick={() => {
            onFechar();
            navigate("/lancar?modo=total", { state: { de: "dashboard" } });
          }}
        />
        <Opcao
          Icon={IconeWhatsApp}
          titulo="Mandar pro Fisco no WhatsApp"
          frase="Mande os valores ou a foto do extrato."
          onClick={() => {
            abrirWhatsAppFisco(MENSAGENS_WHATSAPP.atualizarVelocimetro(dadosParaWhatsApp(app)));
            onFechar();
          }}
        />
      </div>
    </FolhaDeBaixo>
  );
}
