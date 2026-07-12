import { useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { Gauge, Image as ImageIcon } from "lucide-react";

// TODO: substituir placeholders por prints reais do app + frases de vantagem
const SLIDES = [
  { titulo: "Título do slide 1", subtitulo: "Aqui vai a frase de vantagem do app." },
  { titulo: "Título do slide 2", subtitulo: "Aqui vai a frase de vantagem do app." },
  { titulo: "Título do slide 3", subtitulo: "Aqui vai a frase de vantagem do app." },
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
      {/* Topo */}
      <div className="pt-6 pb-4 flex justify-center shrink-0">
        <Gauge size={28} strokeWidth={2.5} style={{ color: "var(--primary)" }} />
      </div>

      {/* Carrossel */}
      <div className="flex-1 min-h-0 flex flex-col">
        <div
          ref={scrollerRef}
          className="flex-1 flex overflow-x-auto snap-x snap-mandatory hide-scrollbar"
          style={{ scrollBehavior: "smooth" }}
        >
          {SLIDES.map((s, i) => (
            <div
              key={i}
              className="min-w-full snap-center flex flex-col items-center justify-center px-6"
            >
              <div
                className="w-full rounded-2xl flex flex-col items-center justify-center mb-6"
                style={{ backgroundColor: "var(--surface)", height: 220 }}
              >
                <ImageIcon size={40} style={{ color: "var(--text-tertiary)" }} strokeWidth={1.5} />
                <p className="text-xs mt-2" style={{ color: "var(--text-secondary)" }}>
                  Imagem em breve
                </p>
              </div>
              <h2 className="text-2xl font-bold text-center" style={{ color: "var(--text)" }}>
                {s.titulo}
              </h2>
              <p className="text-sm text-center mt-2" style={{ color: "var(--text-secondary)" }}>
                {s.subtitulo}
              </p>
            </div>
          ))}
        </div>

        {/* Indicador */}
        <div className="flex justify-center gap-2 py-4 shrink-0">
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
      <div className="px-6 pb-6 pt-2 shrink-0 space-y-3">
        <button
          onClick={() => navigate("/login")}
          className="w-full py-3.5 rounded-xl font-medium text-sm transition-opacity hover:opacity-90"
          style={{ backgroundColor: "var(--primary)", color: "var(--primary-contrast)" }}
        >
          Cadastrar
        </button>

        <div className="flex items-center gap-3 py-0.5">
          <div className="flex-1 h-px" style={{ backgroundColor: "var(--border)" }} />
          <span className="text-xs" style={{ color: "var(--text-secondary)" }}>ou</span>
          <div className="flex-1 h-px" style={{ backgroundColor: "var(--border)" }} />
        </div>

        <button
          onClick={() => navigate("/dashboard")}
          className="w-full py-3.5 rounded-xl font-medium text-sm transition-opacity hover:opacity-90"
          style={{ backgroundColor: "var(--field)", color: "var(--text-secondary)" }}
        >
          Cadastrar depois
        </button>

        <p className="text-center text-xs pt-1" style={{ color: "var(--text-secondary)" }}>
          Já tem conta?{" "}
          <button
            onClick={() => navigate("/login")}
            className="font-medium"
            style={{ color: "var(--primary)" }}
          >
            Entrar
          </button>
        </p>
      </div>
    </div>
  );
}
