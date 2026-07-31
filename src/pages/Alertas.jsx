import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bell, BarChart3, AlertCircle, AlertTriangle } from "lucide-react";
import ModalFaturamentoInicial from "../components/ModalFaturamentoInicial.jsx";

import BottomNav from "../components/BottomNav.jsx";
import { useUserState } from "@/lib/userState";
import {
  calcularPercentual,
  faixaDoVelocimetro,
  FAIXA_INFO,
} from "@/lib/fiscal";

const TITULOS_ALERTA = {
  atencao: "Você passou de 75% do limite",
  perto_do_limite: "Você está perto do teto",
  estourou: "Você ultrapassou o limite anual",
  critico: "Desenquadramento retroativo",
};

const ICONE_ALERTA = {
  atencao: AlertTriangle,
  perto_do_limite: AlertTriangle,
  estourou: AlertCircle,
  critico: AlertCircle,
};

export default function Alertas() {
  const navigate = useNavigate();
  const { faturado, limite } = useUserState();
  const [modalFaturamento, setModalFaturamento] = useState(false);

  const percentual = calcularPercentual(faturado, limite);
  const chaveFaixa = faixaDoVelocimetro(percentual);
  const alertaFaixa = TITULOS_ALERTA[chaveFaixa]
    ? {
        chave: chaveFaixa,
        titulo: TITULOS_ALERTA[chaveFaixa],
        mensagem: FAIXA_INFO[chaveFaixa].mensagem,
        cor: FAIXA_INFO[chaveFaixa].cor,
        Icon: ICONE_ALERTA[chaveFaixa],
      }
    : null;

  const cardStyle = {
    backgroundColor: "var(--surface)",
    border: "1px solid var(--border)",
  };

  return (
    <div
      className="min-h-screen min-h-[100dvh] w-full"
      style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
    >
      <header className="px-5 pt-6 pb-4 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          aria-label="Voltar"
          className="w-10 h-10 rounded-full flex items-center justify-center hover:opacity-80"
          style={{ background: "linear-gradient(160deg, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0.05) 24%, rgba(255,255,255,0) 58%), rgba(14,14,16,0.82)", backdropFilter: "blur(24px) saturate(160%)", WebkitBackdropFilter: "blur(24px) saturate(160%)", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "inset 0 1.5px 0 0 rgba(255,255,255,0.40), inset 0 9px 20px -8px rgba(255,255,255,0.28), inset 0 -1.5px 0 0 rgba(0,0,0,0.30), 0 8px 24px rgba(0,0,0,0.38)" }}
        >
          <ArrowLeft size={20} style={{ color: "var(--text)" }} />
        </button>
        <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>
          Notificações
        </h1>
      </header>

      <div className="px-5 pb-[130px] space-y-3">
        {/* Card permanente: faturamento inicial */}
        <div
          className="rounded-2xl p-4"
          style={{ ...cardStyle, borderLeft: "4px solid var(--primary)" }}
        >
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(160deg, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0.05) 24%, rgba(255,255,255,0) 58%), rgba(14,14,16,0.82)", backdropFilter: "blur(24px) saturate(160%)", WebkitBackdropFilter: "blur(24px) saturate(160%)", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "inset 0 1.5px 0 0 rgba(255,255,255,0.40), inset 0 9px 20px -8px rgba(255,255,255,0.28), inset 0 -1.5px 0 0 rgba(0,0,0,0.30), 0 8px 24px rgba(0,0,0,0.38)" }}
            >
              <BarChart3 size={18} style={{ color: "var(--primary)" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                Comece com o velocímetro certo
              </p>
              <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
                Já faturou este ano antes de instalar o app? Adicione o total para
                calibrar o velocímetro.
              </p>
              <button
                onClick={() => navigate("/adicionar-faturamento")}
                className="mt-3 py-2 px-4 rounded-xl text-xs font-semibold"
                style={{
                  backgroundColor: "var(--primary)",
                  color: "var(--primary-contrast)",
                }}
              >
                Adicionar faturamento
              </button>
            </div>
          </div>
        </div>

        {alertaFaixa && (
          <div
            className="rounded-2xl p-4"
            style={{ ...cardStyle, borderLeft: `4px solid ${alertaFaixa.cor}` }}
          >
            <div className="flex items-start gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style={{ background: "linear-gradient(160deg, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0.05) 24%, rgba(255,255,255,0) 58%), rgba(14,14,16,0.82)", backdropFilter: "blur(24px) saturate(160%)", WebkitBackdropFilter: "blur(24px) saturate(160%)", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "inset 0 1.5px 0 0 rgba(255,255,255,0.40), inset 0 9px 20px -8px rgba(255,255,255,0.28), inset 0 -1.5px 0 0 rgba(0,0,0,0.30), 0 8px 24px rgba(0,0,0,0.38)" }}
              >
                <alertaFaixa.Icon size={18} style={{ color: alertaFaixa.cor }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                  {alertaFaixa.titulo}
                </p>
                <p className="text-sm mt-1 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {alertaFaixa.mensagem}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <ModalFaturamentoInicial
        aberto={modalFaturamento}
        onClose={() => setModalFaturamento(false)}
        onSalvar={() => {
          // TODO: persistir faturamento inicial no Supabase
          setModalFaturamento(false);
        }}
      />

      <BottomNav />
    </div>
  );
}

