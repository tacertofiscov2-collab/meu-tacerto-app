import { useNavigate } from "react-router-dom";
import { ArrowLeft, Construction } from "lucide-react";

export default function EmConstrucao({ titulo = "Em construção" }) {
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
          className="w-10 h-10 flex items-center justify-center rounded-lg hover:opacity-80"
          style={{ color: "var(--text)" }}
        >
          <ArrowLeft size={22} strokeWidth={2} />
        </button>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <Construction size={52} strokeWidth={2} style={{ color: "var(--primary)" }} />
        <h1 className="text-2xl font-bold mt-4" style={{ color: "var(--text)" }}>
          {titulo}
        </h1>
        <p className="text-sm mt-2" style={{ color: "var(--text-secondary)" }}>
          Esta tela está em construção.
        </p>
      </div>
    </div>
  );
}


