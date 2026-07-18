import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import BottomNav from "../components/BottomNav.jsx";
import Valor from "../components/Valor.jsx";

import { useUserState } from "@/lib/userState";

// TODO: buscar quantidade de lançamentos do backend
const LANCAMENTOS_MOCK = 12;

export default function ResumoPerfil() {
  const navigate = useNavigate();
  const { faturado } = useUserState();
  const cardStyle = {
    backgroundColor: "var(--surface)",
    border: "1px solid var(--border)",
  };

  return (
    <div
      className="min-h-screen min-h-[100dvh] w-full flex flex-col"
      style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
    >
      <div className="flex-1 overflow-y-auto pb-[130px]">
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
            Resumo de 2026
          </h1>
        </header>

        <div className="px-5">
          <div className="rounded-2xl p-5" style={cardStyle}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  Faturado
                </p>
                <p className="text-lg font-bold mt-1" style={{ color: "var(--text)" }}>
                  {fmtBRL(faturado)}
                </p>
              </div>
              <div>
                <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  Lançamentos
                </p>
                <p className="text-lg font-bold mt-1" style={{ color: "var(--text)" }}>
                  {LANCAMENTOS_MOCK}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <BottomNav ativo="perfil" />
    </div>
  );
}
