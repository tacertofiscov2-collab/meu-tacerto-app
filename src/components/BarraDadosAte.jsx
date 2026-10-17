/* BARRADADOSATE v1 — barra do topo de todas as contas do "Calcular": "Calculado com seus dados até 12/10 (há 3 dias)." + "Enviar extrato" com o selo Recomendado; sem dados, o "Enviar extrato" vira o primeiro passo */
import { useNavigate } from "react-router-dom";
import { FileUp } from "lucide-react";
import SeloRecomendado from "./SeloRecomendado.jsx";
import { useAppState } from "@/context/AppStateContext";
import { MOSTRAR_ENVIAR_EXTRATO } from "@/config/piloto";

/* ===================================================================
   BARRA "CALCULADO COM SEUS DADOS ATE..." (12/10/2026 — tarefa de
   10-10, Bloco F)

   Toda conta do Calcular usa o que o app sabe ate a ultima atualizacao
   do velocimetro (AppState.ultimaAtualizacaoVelocimetro). A barra diz
   ate quando e oferece o "Enviar extrato" (selo Recomendado) para
   atualizar.
   SEM DADOS (nenhum recebimento no ano): o botao vira o primeiro passo
   ("Para calcular, comece pelo extrato.").
   =================================================================== */

/* "12/10" e "há 3 dias" / "há 2 meses" / "hoje" / "ontem" */
function quando(iso, hoje = new Date()) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const p = (n) => String(n).padStart(2, "0");
  const diaMes = `${p(d.getDate())}/${p(d.getMonth() + 1)}`;
  const um = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const dois = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()).getTime();
  const dias = Math.max(0, Math.round((dois - um) / 86400000));
  let ha;
  if (dias === 0) ha = "hoje";
  else if (dias === 1) ha = "ontem";
  else if (dias < 31) ha = `há ${dias} dias`;
  else {
    const meses = Math.max(1, Math.floor(dias / 30));
    ha = meses === 1 ? "há 1 mês" : `há ${meses} meses`;
  }
  return { diaMes, ha };
}

function BotaoExtrato({ destaque, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${destaque ? "botao-confirmar " : ""}toque relative rounded-2xl font-semibold flex items-center justify-center w-full`}
      style={{
        gap: 8,
        padding: destaque ? "14px 0" : "11px 0",
        fontSize: destaque ? 16 : 15,
        marginTop: 12,
        background: "none",
        border: destaque ? undefined : "1px solid var(--border)",
        color: destaque ? undefined : "var(--text)",
      }}
    >
      <SeloRecomendado />
      <FileUp size={18} strokeWidth={2} />
      Enviar extrato
    </button>
  );
}

export default function BarraDadosAte({ style }) {
  const navigate = useNavigate();
  const { ultimaAtualizacaoVelocimetro, faturamentoAtual } = useAppState();
  const q = ultimaAtualizacaoVelocimetro ? quando(ultimaAtualizacaoVelocimetro) : null;
  const semDados = !q || !(Number(faturamentoAtual) > 0);
  const enviar = () => navigate("/enviar-extrato", { state: { de: "calcular" } });

  return (
    <section className="rounded-2xl" style={{ padding: "13px 14px 14px", border: "1px solid var(--border)", ...style }}>
      <p style={{ fontSize: 14, lineHeight: 1.45, color: "var(--text-secondary)" }}>
        {semDados
          ? "Para calcular, comece pelo extrato do banco: o app soma seus recebimentos do ano."
          : `Calculado com seus dados até ${q.diaMes} (${q.ha}).`}
      </p>
      {MOSTRAR_ENVIAR_EXTRATO && <BotaoExtrato destaque={semDados} onClick={enviar} />}
    </section>
  );
}
