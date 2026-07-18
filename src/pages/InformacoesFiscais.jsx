import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import BottomNav from "../components/BottomNav.jsx";
import { useUserState } from "@/lib/userState";
import { LABEL_TIPO, fmtBRL, DAS_VENCIMENTO_LABEL } from "@/lib/fiscal";

export default function InformacoesFiscais() {
  const navigate = useNavigate();
  const { tipo, limite } = useUserState();

  const cardStyle = {
    backgroundColor: "var(--surface)",
    border: "1px solid var(--border)",
  };

  return (
    <div
      className="min-h-screen min-h-[100dvh] w-full flex flex-col"
      style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
    >
      <div className="flex-1 overflow-y-auto pb-[110px]">
        <header className="px-5 pt-6 pb-4 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            aria-label="Voltar"
            className="w-10 h-10 rounded-full flex items-center justify-center hover:opacity-80"
            style={{ backgroundColor: "var(--field)" }}
          >
            <ArrowLeft size={20} style={{ color: "var(--text)" }} />
          </button>
          <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>
            Informações fiscais
          </h1>
        </header>

        <div className="px-5">
          <div className="rounded-2xl p-5 space-y-3" style={cardStyle}>
            <div className="flex justify-between text-sm">
              <span style={{ color: "var(--text-secondary)" }}>Tipo de perfil</span>
              <span className="font-semibold" style={{ color: "var(--text)" }}>
                {LABEL_TIPO[tipo]}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: "var(--text-secondary)" }}>Limite anual</span>
              <span className="font-semibold" style={{ color: "var(--text)" }}>
                {fmtBRL(limite)}
              </span>
            </div>
            <div className="flex justify-between text-sm gap-3">
              <span style={{ color: "var(--text-secondary)" }}>Vencimento do DAS</span>
              <span className="font-semibold text-right" style={{ color: "var(--text)" }}>
                {DAS_VENCIMENTO_LABEL}
              </span>
            </div>
          </div>
        </div>
      </div>

      <BottomNav ativo="perfil" />
    </div>
  );
}
