import { useNavigate } from "react-router-dom";
import { Gauge, CheckCircle2, Info } from "lucide-react";
import { ArrowLeft } from "lucide-react";
import Brand from "@/components/Brand";

import BottomNav from "../components/BottomNav.jsx";
export default function Sobre() {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen min-h-[100dvh] w-full flex flex-col"
      style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
    >
      <div className="px-4 pt-5 shrink-0">
        <button
          onClick={() => navigate(-1)}
          aria-label="Voltar"
          className="w-10 h-10 rounded-full flex items-center justify-center hover:opacity-80"
          style={{ background: "linear-gradient(160deg, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0.05) 24%, rgba(255,255,255,0) 58%), rgba(14,14,16,0.82)", backdropFilter: "blur(24px) saturate(160%)", WebkitBackdropFilter: "blur(24px) saturate(160%)", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "inset 0 1.5px 0 0 rgba(255,255,255,0.40), inset 0 9px 20px -8px rgba(255,255,255,0.28), inset 0 -1.5px 0 0 rgba(0,0,0,0.30), 0 8px 24px rgba(0,0,0,0.38)" }}
        >
          <ArrowLeft size={20} style={{ color: "var(--text)" }} />
        </button>
      </div>

      <div
        className="flex-1 px-6"
        style={{ paddingBottom: "calc(104px + env(safe-area-inset-bottom))" }}
      >
        <div className="max-w-md mx-auto">
          <div className="flex justify-center mb-4">
            <Gauge size={52} strokeWidth={2.5} style={{ color: "var(--primary)" }} />
          </div>
          <h1 className="text-2xl font-bold text-center" style={{ color: "var(--text)" }}>
            Sobre o <Brand />
          </h1>

          <p className="text-sm leading-relaxed mt-5" style={{ color: "var(--text-secondary)" }}>
            O <Brand /> é seu assistente de educação fiscal para MEI e MEI Caminhoneiro.
            Ajudamos você a acompanhar seu faturamento, entender seu limite anual e evitar
            surpresas com o Leão.
          </p>

          <p className="text-sm leading-relaxed mt-3" style={{ color: "var(--text-secondary)" }}>
            Contamos com inteligência artificial que se mantém atualizada perante as reformas
            e mudanças na legislação fiscal, para te dar as informações mais precisas possíveis.
          </p>

          <div
            className="mt-5 rounded-xl p-3 flex gap-2"
            style={{
              backgroundColor: "rgba(34, 197, 94, 0.08)",
              border: "1px solid rgba(34, 197, 94, 0.25)",
              borderLeft: "3px solid var(--primary)",
            }}
          >
            <Info size={18} strokeWidth={2} style={{ color: "var(--primary)" }} className="shrink-0 mt-0.5" />
            <p className="text-xs leading-relaxed" style={{ color: "var(--text)" }}>
              <span className="font-semibold">Importante:</span> o <Brand /> não substitui um
              contador. Somos uma ferramenta de apoio e educação. Decisões fiscais importantes
              devem sempre ser confirmadas com um profissional habilitado.
            </p>
          </div>

          <ul className="space-y-2 mt-5">
            {[
              "Acompanhe seu limite em tempo real",
              "Alertas antes de ultrapassar o teto",
              "Calculadoras e calendário fiscal",
            ].map((t) => (
              <li key={t} className="flex items-center gap-2 text-sm" style={{ color: "var(--text)" }}>
                <CheckCircle2 size={16} strokeWidth={2} style={{ color: "var(--primary)" }} className="shrink-0" />
                {t}
              </li>
            ))}
          </ul>

          <p className="text-center text-xs mt-8" style={{ color: "var(--text-secondary)" }}>
            <Brand /> v0.1
          </p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}


