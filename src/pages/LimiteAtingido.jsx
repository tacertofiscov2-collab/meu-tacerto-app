import { useNavigate } from "react-router-dom";
import { ArrowLeft, Sparkles, CheckCircle2 } from "lucide-react";

const BENEFICIOS = [
  "Seus 8 lançamentos ficam salvos automaticamente",
  "Registre quantos lançamentos precisar",
  "Recupere sua conta em qualquer aparelho",
  "Acompanhe seu velocímetro sempre atualizado",
];

export default function LimiteAtingido() {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen min-h-[100dvh] w-full flex flex-col"
      style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
    >
      <header className="px-4 pt-5 pb-2 flex items-center gap-2 shrink-0">
        <button
          onClick={() => navigate("/dashboard")}
          aria-label="Voltar"
          className="w-10 h-10 rounded-full flex items-center justify-center hover:opacity-80"
          style={{ backgroundColor: "var(--field)" }}
        >
          <ArrowLeft size={20} style={{ color: "var(--text)" }} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-5 pb-8">
        <div className="max-w-md mx-auto flex flex-col items-center text-center pt-6">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mb-5"
            style={{ backgroundColor: "rgba(34,197,94,0.12)" }}
          >
            <Sparkles size={44} style={{ color: "var(--primary)" }} />
          </div>

          <h1
            className="text-2xl font-bold leading-tight px-4"
            style={{ color: "var(--text)" }}
          >
            Você já registrou 8 lançamentos!
          </h1>

          <p
            className="text-sm mt-3 leading-relaxed px-2"
            style={{ color: "var(--text-secondary)" }}
          >
            Pra continuar registrando quantos lançamentos quiser, cadastre uma
            conta gratuita agora. É rápido e seus lançamentos serão mantidos.
          </p>

          <ul className="w-full mt-7 space-y-3 text-left">
            {BENEFICIOS.map((b) => (
              <li key={b} className="flex items-start gap-3">
                <CheckCircle2
                  size={20}
                  className="shrink-0 mt-0.5"
                  style={{ color: "var(--primary)" }}
                />
                <span className="text-sm" style={{ color: "var(--text)" }}>
                  {b}
                </span>
              </li>
            ))}
          </ul>

          <div className="w-full mt-8 space-y-3">
            <button
              onClick={() => navigate("/cadastro")}
              className="w-full py-3.5 rounded-xl font-medium text-sm hover:opacity-90"
              style={{
                backgroundColor: "var(--primary)",
                color: "var(--primary-contrast)",
              }}
            >
              Cadastrar agora
            </button>
            <button
              onClick={() => navigate("/dashboard")}
              className="w-full py-3 text-sm hover:opacity-80"
              style={{ color: "var(--text-secondary)" }}
            >
              Voltar ao início
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
