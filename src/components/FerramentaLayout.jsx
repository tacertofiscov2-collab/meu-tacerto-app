import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import BottomNav from "./BottomNav.jsx";

/**
 * FerramentaLayout — shell padrão das telas de ferramenta do Menu.
 * Header com seta de voltar à esquerda + título, padrão flat, padding canônico.
 */
export default function FerramentaLayout({ titulo, children }) {
  const navigate = useNavigate();
  return (
    <div
      className="min-h-screen min-h-[100dvh] w-full flex flex-col"
      style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
    >
      <div
        className="flex-1 overflow-y-auto"
        style={{ paddingBottom: "calc(104px + env(safe-area-inset-bottom))" }}
      >
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
            {titulo}
          </h1>
        </header>
        <div className="px-5 pt-2">{children}</div>
      </div>
      <BottomNav ativo="menu" />
    </div>
  );
}
