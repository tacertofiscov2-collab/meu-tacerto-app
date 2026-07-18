import { useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { Gauge, Image as ImageIcon } from "lucide-react";

// TODO: substituir por ilustrações reais + frases de vantagem.
const SLIDES = [
  {
    titulo: "Título do slide 1",
    subtitulo: "Subtítulo do slide 1 (placeholder).",
  },
  {
    titulo: "Título do slide 2",
    subtitulo: "Subtítulo do slide 2 (placeholder).",
  },
  {
    titulo: "Título do slide 3",
    subtitulo: "Subtítulo do slide 3 (placeholder).",
  },
];

export default function Welcome() {
  const navigate = useNavigate();
  const scrollerRef = useRef(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const onScroll = () => {
      const idx = Math.round(el.scrollLeft / el.clientWidth);
      setActive(idx);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const goTo = (i) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };

  return (
    <div
      className="min-h-screen min-h-[100dvh] w-full flex flex-col"
      style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
    >
      {/* Carrossel */}
      <div className="flex-1 min-h-0 flex flex-col pt-5">
        <div
          ref={scrollerRef}
          className="flex-1 flex overflow-x-auto snap-x snap-mandatory hide-scrollbar"
          style={{ scrollBehavior: "smooth" }}
        >
          {SLIDES.map((s, i) => (
            <div
              key={i}
              className="min-w-full snap-center flex flex-col items-center px-6"
            >
              {/* Logo topo */}
              <div className="flex items-center justify-center gap-1.5 shrink-0">
                <Gauge size={22} strokeWidth={2.5} style={{ color: "var(--primary)" }} />
                <span className="text-xl font-bold" style={{ color: "var(--text)" }}>
                  Ta<span style={{ color: "var(--primary)" }}>Certo!</span>
                </span>
              </div>

              {/* Placeholder de ilustração — integrado ao fundo, sem moldura */}
              <div className="w-full flex flex-col items-center justify-center gap-2 my-4" style={{ maxHeight: "28vh" }}>
                <ImageIcon size={64} strokeWidth={1.5} style={{ color: "var(--text-secondary)" }} />
                <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  Imagem em breve
                </span>
              </div>

              {/* Título placeholder */}
              <h2
                className="text-xl font-semibold leading-tight text-center px-2"
                style={{ color: "var(--text)" }}
              >
                {s.titulo}
              </h2>

              {/* Subtítulo placeholder */}
              <p
                className="text-sm text-center leading-snug px-2 mt-2"
                style={{ color: "var(--text-secondary)" }}
              >
                {s.subtitulo}
              </p>
            </div>
          ))}
        </div>

        {/* Indicador — mais espaço acima */}
        <div className="flex justify-center gap-2 pt-10 pb-2 shrink-0">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Ir para slide ${i + 1}`}
              className="h-2 rounded-full transition-all"
              style={{
                width: i === active ? 24 : 8,
                backgroundColor: i === active ? "var(--primary)" : "var(--border)",
              }}
            />
          ))}
        </div>
      </div>

      {/* Rodapé fixo de ações */}
      <div
        className="px-5 pb-4 pt-6 shrink-0"
        style={{ paddingBottom: "calc(16px + env(safe-area-inset-bottom))" }}
      >
        <button
          onClick={() => navigate("/cadastro")}
          className="w-full py-3 rounded-xl font-semibold text-sm transition-opacity hover:opacity-90"
          style={{
            backgroundColor: "var(--primary)",
            color: "var(--primary-contrast)",
          }}
        >
          Cadastrar
        </button>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px" style={{ backgroundColor: "var(--border)" }} />
          <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>ou</span>
          <div className="flex-1 h-px" style={{ backgroundColor: "var(--border)" }} />
        </div>

        <button
          onClick={() => navigate("/onboarding")}
          className="w-full py-3 rounded-xl font-semibold text-sm transition-opacity hover:opacity-90"
          style={{
            backgroundColor: "var(--field)",
            color: "var(--text-secondary)",
            border: "1px solid var(--border)",
          }}
        >
          Cadastrar depois
        </button>

        <p className="text-center text-sm mt-6" style={{ color: "var(--text-secondary)" }}>
          Já tem conta?{" "}
          <button
            onClick={() => navigate("/login")}
            className="font-semibold"
            style={{ color: "var(--primary)" }}
          >
            Entrar
          </button>
        </p>
      </div>
    </div>
  );
}
