import { useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { Gauge } from "lucide-react";
import slide1 from "@/assets/welcome-slide-1.jpg";
import slide2 from "@/assets/welcome-slide-2.jpg";
import slide3 from "@/assets/welcome-slide-3.jpg";

const SLIDES = [
  {
    img: slide1,
    alt: "Ilustração de um velocímetro com uma pessoa ajustando o ponteiro",
    titulo: "Saiba sempre quanto você ainda pode faturar",
    subtitulo:
      "Acompanhe em tempo real seu limite de MEI, sem sustos no fim do ano.",
  },
  {
    img: slide2,
    alt: "Ilustração de uma pessoa relaxada em uma poltrona com o celular",
    titulo: "Feito para quem trabalha, não para quem entende de imposto",
    subtitulo:
      "Sem termos complicados. Você só precisa saber se está tranquilo ou se precisa se cuidar.",
  },
  {
    img: slide3,
    alt: "Ilustração de um painel mostrando 99% do limite anual utilizado",
    titulo: "Evite o desenquadramento por falta de informação",
    subtitulo:
      "Milhares de MEIs perdem o regime todo ano sem saber que ultrapassaram o limite. Com o TaCerto!, isso não acontece com você.",
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

  const handwritten = {
    fontFamily: "'Caveat', 'Bradley Hand', cursive",
  };

  return (
    <div
      className="min-h-screen min-h-[100dvh] w-full flex flex-col"
      style={{ backgroundColor: "#000", color: "#fff" }}
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
              {/* Logo topo — igual em todos os slides */}
              <div className="flex items-center justify-center gap-1.5 shrink-0">
                <Gauge size={22} className="text-green-500" strokeWidth={2.5} />
                <span className="text-xl font-bold text-white">
                  Ta<span className="text-green-500">Certo!</span>
                </span>
              </div>

              {/* Ilustração */}
              <div className="flex-1 min-h-0 w-full flex items-center justify-center my-1">
                <img
                  src={s.img}
                  alt={s.alt}
                  width={1024}
                  height={1024}
                  loading={i === 0 ? "eager" : "lazy"}
                  className="max-h-[44vh] max-w-full object-contain"
                  style={{ mixBlendMode: "screen" }}
                />
              </div>

              {/* Título manuscrito */}
              <h2
                className="text-2xl leading-tight text-center text-white px-2"
                style={handwritten}
              >
                {s.titulo}
              </h2>

              {/* Linha decorativa curva */}
              <svg
                width="80"
                height="10"
                viewBox="0 0 90 12"
                className="mt-0.5 mb-1 shrink-0"
                aria-hidden="true"
              >
                <path
                  d="M2 8 Q 25 -2, 45 6 T 88 4"
                  stroke="#39FF14"
                  strokeWidth="2"
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>

              {/* Subtítulo manuscrito mais fino */}
              <p
                className="text-lg text-center text-white/80 leading-snug px-2 pb-0.5"
                style={{ ...handwritten, fontWeight: 500 }}
              >
                {s.subtitulo}
              </p>
            </div>
          ))}
        </div>

        {/* Indicador */}
        <div className="flex justify-center gap-2 py-3 shrink-0">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Ir para slide ${i + 1}`}
              className="h-2 rounded-full transition-all"
              style={{
                width: i === active ? 24 : 8,
                backgroundColor: i === active ? "#22c55e" : "#3f3f46",
              }}
            />
          ))}
        </div>
      </div>

      {/* Rodapé fixo de ações */}
      <div className="px-6 pb-6 pt-2 shrink-0 space-y-3">
        <button
          onClick={() => navigate("/cadastro")}
          className="w-full py-3.5 rounded-xl font-medium text-sm transition-opacity hover:opacity-90"
          style={{ backgroundColor: "#22c55e", color: "#0a0a0a" }}
        >
          Cadastrar
        </button>

        <div className="flex items-center gap-3 py-0.5">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-xs text-white/60">ou</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        <button
          onClick={() => navigate("/onboarding")}
          className="w-full py-3.5 rounded-xl font-medium text-sm transition-opacity hover:opacity-90"
          style={{ backgroundColor: "#27272a", color: "#a1a1aa" }}
        >
          Cadastrar depois
        </button>

        <p className="text-center text-xs pt-1 text-white/60">
          Já tem conta?{" "}
          <button
            onClick={() => navigate("/login")}
            className="font-medium text-green-500"
          >
            Entrar
          </button>
        </p>
      </div>
    </div>
  );
}
