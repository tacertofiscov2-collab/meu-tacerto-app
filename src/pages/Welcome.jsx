import { useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import {
  Gauge, TrendingUp, ChevronRight, ArrowLeft, Pencil, FileUp, Plus,
  ClipboardList, Search, Calendar, ChevronDown, Sparkles, Send, Mic,
} from "lucide-react";
import useTemaEscuroForcado from "@/hooks/useTemaEscuroForcado";

const VERDE = "var(--primary)";

/* Cabeçalho da mini-tela: botão de voltar redondo + título ao lado.
   Título menor (proporcional à mini-tela) e bem afastado dos cards. */
function MiniHeader({ titulo }) {
  return (
    <div className="flex items-center gap-2.5" style={{ marginBottom: 24 }}>
      <span
        className="rounded-full flex items-center justify-center shrink-0"
        style={{ width: 28, height: 28, backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
      >
        <ArrowLeft size={15} strokeWidth={2.4} style={{ color: "var(--text)" }} />
      </span>
      <span className="font-bold" style={{ color: "var(--text)", fontSize: 14 }}>
        {titulo}
      </span>
    </div>
  );
}

/* Velocímetro pequeno — arco colorido saturado com glow, risquinhos
   (ticks) na borda interna, ponteiro em LOSANGO e cubo central.
   Mostra só a %, sem valores em reais. */
function MiniVelocimetro({ pct = 58 }) {
  const cx = 100, cy = 100, r = 80;
  const arcLength = Math.PI * r;
  const filled = (pct / 100) * arcLength;
  const arcPath = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;
  const gid = "mv-grad", gl = "mv-glow";

  const N = 9;
  const ticks = [];
  for (let i = 0; i <= N; i++) {
    const t = Math.PI - (i / N) * Math.PI;
    const rIn = 60;
    const rOut = i % 2 === 0 ? 71 : 66;
    ticks.push({
      x1: cx + rIn * Math.cos(t),
      y1: cy - rIn * Math.sin(t),
      x2: cx + rOut * Math.cos(t),
      y2: cy - rOut * Math.sin(t),
      on: (i / N) * 100 <= pct + 1,
    });
  }

  const needleR = 58, baseHalf = 6, midHalf = 2.6, midR = needleR * 0.45;
  const tipX = cx - needleR, tipY = cy;
  const b1x = cx, b1y = cy - baseHalf;
  const b2x = cx, b2y = cy + baseHalf;
  const mx = cx - midR;
  const m1y = cy - midHalf, m2y = cy + midHalf;
  const needlePoints = `${b1x},${b1y} ${mx},${m1y} ${tipX},${tipY} ${mx},${m2y} ${b2x},${b2y}`;
  const rot = (pct / 100) * 180;

  return (
    <svg viewBox="0 0 200 120" width="132" height="80" aria-hidden className="block mx-auto">
      <defs>
        <linearGradient id={gid} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#16d65a" />
          <stop offset="45%" stopColor="#a3e635" />
          <stop offset="70%" stopColor="#facc15" />
          <stop offset="88%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#ef4444" />
        </linearGradient>
        <filter id={gl} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2.2" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* trilho apagado */}
      <path d={arcPath} fill="none" stroke={`url(#${gid})`} strokeWidth={14} strokeLinecap="round" opacity={0.18} />
      {/* preenchido vivo + glow */}
      <path
        d={arcPath}
        fill="none"
        stroke={`url(#${gid})`}
        strokeWidth={14}
        strokeLinecap="round"
        strokeDasharray={`${filled} ${arcLength}`}
        filter={`url(#${gl})`}
      />
      {/* ticks */}
      {ticks.map((tk, i) => (
        <line
          key={i}
          x1={tk.x1} y1={tk.y1} x2={tk.x2} y2={tk.y2}
          stroke={tk.on ? "var(--text)" : "var(--text-tertiary)"}
          strokeWidth={i % 2 === 0 ? 2 : 1.3}
          strokeLinecap="round"
          opacity={tk.on ? 0.9 : 0.4}
        />
      ))}
      {/* ponteiro losango */}
      <g style={{ transformOrigin: "100px 100px", transform: `rotate(${rot}deg)` }}>
        <polygon points={needlePoints} fill="var(--text)" />
      </g>
      <circle cx={cx} cy={cy} r={7} fill="var(--text)" />
      <circle cx={cx} cy={cy} r={3} fill="var(--surface)" />
    </svg>
  );
}

function LinhaMini({ Icon, titulo, sub, cor }) {
  return (
    <div className="rounded-xl flex items-center gap-2" style={{ backgroundColor: "var(--field)", padding: "7px 10px" }}>
      <span className="rounded-lg flex items-center justify-center shrink-0" style={{ width: 23, height: 23, backgroundColor: "var(--surface)" }}>
        <Icon size={12} style={{ color: cor || VERDE }} />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block font-semibold truncate" style={{ color: "var(--text)", fontSize: 11.5 }}>{titulo}</span>
        {sub && <span className="block truncate" style={{ color: "var(--text-secondary)", fontSize: 9.5 }}>{sub}</span>}
      </span>
      <ChevronRight size={12} style={{ color: "var(--text-tertiary)" }} className="shrink-0" />
    </div>
  );
}

function MiniDashboard() {
  return (
    <div style={{ padding: "18px 14px 12px" }}>
      <MiniHeader titulo="Início" />
      <div
        className="rounded-2xl"
        style={{
          background: "linear-gradient(160deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 60%, transparent 100%), var(--surface)",
          border: "1px solid var(--border)",
          padding: "10px 13px 13px",
        }}
      >
        <span style={{ color: "var(--text-secondary)", fontSize: 10.5 }}>Meu MEI</span>
        <div className="flex flex-col items-center" style={{ marginTop: 0 }}>
          <MiniVelocimetro pct={58} />
          <span className="font-bold" style={{ color: "var(--text)", fontSize: 24, lineHeight: 1, marginTop: -4 }}>58%</span>
        </div>
        <div className="flex items-center" style={{ borderTop: "1px solid var(--border)", marginTop: 9, paddingTop: 8 }}>
          <div className="flex-1 flex flex-col items-center">
            <span className="font-bold" style={{ color: "var(--text)", fontSize: 12 }}>58%</span>
            <span style={{ color: "var(--text-secondary)", fontSize: 9.5 }}>Do limite usado</span>
          </div>
          <div style={{ width: 1, alignSelf: "stretch", backgroundColor: "var(--border)" }} />
          <div className="flex-1 flex flex-col items-center">
            <span className="font-bold" style={{ color: VERDE, fontSize: 12 }}>Tranquilo</span>
            <span style={{ color: "var(--text-secondary)", fontSize: 9.5 }}>Situação</span>
          </div>
        </div>
      </div>
      <div className="flex justify-center" style={{ marginTop: -20, position: "relative", zIndex: 2 }}>
        <span className="rounded-full flex items-center justify-center" style={{ width: 40, height: 40, backgroundColor: VERDE, boxShadow: "0 6px 16px rgba(34,197,94,0.45)" }}>
          <Plus size={22} strokeWidth={2.6} style={{ color: "var(--primary-contrast)" }} />
        </span>
      </div>
    </div>
  );
}

function MiniAdicionar() {
  return (
    <div style={{ padding: "18px 14px 8px" }}>
      <MiniHeader titulo="Adicionar faturamento" />
      <div className="flex flex-col" style={{ gap: 7 }}>
        <LinhaMini Icon={Pencil} titulo="Digitar o total" sub="Já sabe quanto faturou? Digite." />
        <LinhaMini Icon={FileUp} titulo="Enviar extrato bancário" sub="PDF, foto ou OFX/CSV." />
        <LinhaMini Icon={Plus} titulo="Somar valores" sub="Entrada por entrada." />
        <LinhaMini Icon={ClipboardList} titulo="Colar texto do extrato" sub="Cole e a IA identifica." />
      </div>
    </div>
  );
}

function MiniHistorico() {
  const linhas = [
    { d: "Recebimento", data: "18 de Junho" },
    { d: "Recebimento", data: "09 de Junho" },
  ];
  return (
    <div style={{ padding: "18px 14px 7px" }}>
      <MiniHeader titulo="Histórico" />
      <div className="rounded-xl flex items-center gap-2" style={{ backgroundColor: "var(--field)", padding: "7px 10px", marginBottom: 16 }}>
        <Search size={13} style={{ color: "var(--text-tertiary)" }} />
        <span style={{ color: "var(--text-tertiary)", fontSize: 11.5 }}>Buscar lançamento</span>
      </div>
      <div className="rounded-xl flex items-center gap-2" style={{ backgroundColor: "var(--field)", padding: "7px 10px", marginBottom: 10 }}>
        <span className="rounded-lg flex items-center justify-center shrink-0" style={{ width: 23, height: 23, backgroundColor: "var(--surface)" }}>
          <Calendar size={12} style={{ color: VERDE }} />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block font-semibold" style={{ color: "var(--text)", fontSize: 11.5 }}>Este mês</span>
          <span className="block" style={{ color: "var(--text-secondary)", fontSize: 9.5 }}>Período exibido</span>
        </span>
        <ChevronDown size={12} style={{ color: "var(--text-tertiary)" }} />
      </div>
      <div className="flex flex-col" style={{ gap: 6 }}>
        {linhas.map((l, i) => (
          <div key={i} className="rounded-xl flex items-center gap-2" style={{ backgroundColor: "var(--field)", padding: "7px 10px" }}>
            <TrendingUp size={14} style={{ color: VERDE }} className="shrink-0" />
            <span className="flex-1 min-w-0">
              <span className="block font-semibold truncate" style={{ color: "var(--text)", fontSize: 11.5 }}>{l.d}</span>
              <span className="block" style={{ color: "var(--text-secondary)", fontSize: 9.5 }}>{l.data}</span>
            </span>
            <span className="font-bold shrink-0" style={{ color: VERDE, fontSize: 11.5 }}>+ R$ •••</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniResumo() {
  const MESES = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
  const barras = [40, 62, 35, 78, 55, 70, 48, 0, 0, 0, 0, 0];
  const maxAtivo = 6;
  return (
    <div style={{ padding: "18px 14px 8px" }}>
      <MiniHeader titulo="Resumo do ano" />
      <div className="grid grid-cols-2" style={{ gap: 8, marginBottom: 8 }}>
        {[
          { r: "Faturado", v: "Em dia" },
          { r: "Situação", v: "Verde", cor: VERDE },
          { r: "Ritmo", v: "Estável" },
          { r: "Lançamentos", v: "12" },
        ].map((c, i) => (
          <div key={i} className="rounded-xl" style={{ backgroundColor: "var(--field)", padding: "7px 10px" }}>
            <span className="block" style={{ color: "var(--text-secondary)", fontSize: 9.5 }}>{c.r}</span>
            <span className="block font-bold" style={{ color: c.cor || "var(--text)", fontSize: 13 }}>{c.v}</span>
          </div>
        ))}
      </div>
      <div className="rounded-xl" style={{ backgroundColor: "var(--field)", padding: "9px 11px" }}>
        <span className="block" style={{ color: "var(--text-secondary)", fontSize: 9.5, marginBottom: 7 }}>Por mês</span>
        <div className="flex items-end justify-between" style={{ height: 52, gap: 3 }}>
          {barras.map((h, i) => (
            <div key={i} className="flex-1 flex flex-col items-center justify-end" style={{ gap: 3 }}>
              <div
                className="w-full rounded-t"
                style={{ height: h ? `${(h / 78) * 42}px` : 3, backgroundColor: i >= maxAtivo ? "var(--border)" : VERDE, opacity: i >= maxAtivo ? 0.35 : 1 }}
              />
              <span style={{ color: "var(--text-tertiary)", fontSize: 7 }}>{MESES[i]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MiniFisco() {
  const perguntas = [
    "Quanto é o DAS e quando vence?",
    "Qual é o meu limite de faturamento?",
    "Preciso emitir nota em todo serviço?",
  ];
  return (
    <div style={{ padding: "18px 14px 7px" }}>
      <MiniHeader titulo="Chat IA" />

      {/* Card do Fisco: avatar REDONDO com bolinha verde (estilo Facebook),
          nome em cima e a barra do chat embaixo — tudo dentro do card verde,
          com a barra alinhada à base da foto. */}
      <div
        className="rounded-2xl flex items-center gap-3"
        style={{
          background: "linear-gradient(150deg, rgba(34,197,94,0.16) 0%, rgba(34,197,94,0.04) 55%, transparent 100%), var(--surface)",
          border: "1px solid rgba(34,197,94,0.4)",
          padding: "10px 12px",
          marginBottom: 11,
          boxShadow: "0 4px 20px rgba(34,197,94,0.14)",
        }}
      >
        <span className="relative shrink-0" style={{ width: 52, height: 52 }}>
          <span
            className="rounded-full overflow-hidden block"
            style={{ width: 52, height: 52, backgroundColor: "var(--surface-raised)", border: "1.5px solid rgba(34,197,94,0.5)", boxShadow: "0 0 16px rgba(34,197,94,0.3)" }}
          >
            <img src="/fisco-joinha.png" alt="Fisco" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 12%" }} />
          </span>
          {/* bolinha de status verde no canto inferior */}
          <span
            className="absolute rounded-full"
            style={{ width: 13, height: 13, backgroundColor: VERDE, border: "2.5px solid var(--surface)", bottom: 1, right: 2 }}
          />
        </span>

        <span className="flex-1 min-w-0 flex flex-col justify-between" style={{ height: 52 }}>
          <span className="font-bold" style={{ color: "var(--text)", fontSize: 14.5 }}>Fisco</span>
          <span
            className="rounded-full flex items-center gap-2"
            style={{ backgroundColor: "rgba(255,255,255,0.06)", border: "1px solid var(--border)", padding: "5px 11px" }}
          >
            <span className="flex-1 min-w-0 font-medium truncate" style={{ color: "var(--text-secondary)", fontSize: 11.5 }}>Pergunte ao Fisco...</span>
            <Mic size={15} strokeWidth={2} style={{ color: "var(--text-secondary)" }} className="shrink-0" />
            <Send size={15} strokeWidth={2.2} style={{ color: "var(--text)" }} className="shrink-0" />
          </span>
        </span>
      </div>

      <div className="flex flex-col" style={{ gap: 6 }}>
        {perguntas.map((p, i) => (
          <div key={i} className="rounded-xl flex items-center gap-2" style={{ backgroundColor: "var(--field)", padding: "7px 10px" }}>
            <span className="rounded-lg flex items-center justify-center shrink-0" style={{ width: 22, height: 22, backgroundColor: "var(--surface)" }}>
              <Sparkles size={12} style={{ color: VERDE }} />
            </span>
            <span className="flex-1 min-w-0 font-medium truncate" style={{ color: "var(--text)", fontSize: 11.5 }}>{p}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const SLIDES = [
  { Mini: MiniDashboard, titulo: "Seu limite em tempo real", subtitulo: "Veja quanto do seu faturamento já usou e lance novas entradas em segundos." },
  { Mini: MiniAdicionar, titulo: "Registre o que já veio", subtitulo: "Já faturou antes de baixar? Some tudo em segundos, do seu jeito." },
  { Mini: MiniHistorico, titulo: "Tudo organizado", subtitulo: "Cada recebimento fica guardado e organizado, mês a mês, sem esforço." },
  { Mini: MiniResumo, titulo: "Enxergue o ano todo", subtitulo: "Sua média mensal e a projeção de fechamento, tudo numa tela só." },
  { Mini: MiniFisco, titulo: "O Fisco te acompanha", subtitulo: "Ele tira suas dúvidas e te avisa antes de qualquer coisa virar problema." },
];

export default function Welcome() {
  useTemaEscuroForcado();
  const navigate = useNavigate();
  const scrollerRef = useRef(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const onScroll = () => setActive(Math.round(el.scrollLeft / el.clientWidth));
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const goTo = (i) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };

  return (
    <div className="tela-fixa w-full flex flex-col" style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}>
      <div className="flex items-center justify-center gap-1.5 pt-6 pb-3 shrink-0">
        <Gauge size={22} strokeWidth={2.5} style={{ color: VERDE }} />
        <span className="text-xl font-bold" style={{ color: "var(--text)" }}>
          Ta<span style={{ color: VERDE }}>Certo!</span>
        </span>
      </div>

      <div ref={scrollerRef} className="flex-1 min-h-0 flex overflow-x-auto overflow-y-hidden snap-x snap-mandatory hide-scrollbar" style={{ touchAction: "pan-x" }}>
        {SLIDES.map(({ Mini }, i) => (
          <div key={i} className="min-w-full snap-center flex flex-col min-h-0">
            <div className="flex-1 min-h-0 flex justify-center px-6 pt-2">
              <div className="w-full flex flex-col min-h-0" style={{ maxWidth: 250 }}>
                <div
                  className="relative w-full flex flex-col flex-1 min-h-0"
                  style={{
                    borderTopLeftRadius: 34,
                    borderTopRightRadius: 34,
                    borderLeft: "1.5px solid rgba(34,197,94,0.55)",
                    borderRight: "1.5px solid rgba(34,197,94,0.55)",
                    borderTop: "1.5px solid rgba(34,197,94,0.55)",
                    borderBottom: "none",
                    background: "linear-gradient(180deg, #101014 0%, #0a0a0c 45%, #050506 100%)",
                    overflow: "hidden",
                  }}
                >
                  <Mini />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Card inferior único: preto translúcido, sem reflexo, com apenas
          uma linha verde discreta em volta. Contém o texto do slide
          ativo + dots + botões. */}
      <div className="shrink-0" style={{ padding: "0 10px", paddingBottom: "calc(10px + env(safe-area-inset-bottom))" }}>
        <div
          style={{
            background: "var(--vidro-bg)",
            backdropFilter: "blur(6px) saturate(160%)",
            WebkitBackdropFilter: "blur(6px) saturate(160%)",
            border: "1px solid rgba(34,197,94,0.35)",
            borderRadius: 26,
            padding: "16px 18px 18px",
          }}
        >
          <div className="text-center px-2" style={{ minHeight: 60 }}>
            <h2 className="font-bold leading-tight" style={{ color: "var(--text)", fontSize: 18 }}>{SLIDES[active].titulo}</h2>
            <p className="leading-snug" style={{ color: "var(--text-secondary)", fontSize: 12.5, marginTop: 6 }}>{SLIDES[active].subtitulo}</p>
          </div>

          <div className="flex justify-center gap-2 py-3">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`Ir para slide ${i + 1}`}
                className="h-2 rounded-full transition-all"
                style={{ width: i === active ? 24 : 8, backgroundColor: i === active ? VERDE : "var(--border)" }}
              />
            ))}
          </div>

          <button onClick={() => navigate("/cadastro")} className="w-full py-2.5 rounded-xl font-semibold transition-opacity hover:opacity-90" style={{ backgroundColor: VERDE, color: "var(--primary-contrast)", fontSize: 13 }}>
            Criar conta
          </button>
          <button
            onClick={() => {
              try { localStorage.setItem("tacerto_visitante", "true"); } catch {}
              navigate("/onboarding");
            }}
            className="w-full py-2.5 rounded-xl font-semibold transition-opacity hover:opacity-90"
            style={{ backgroundColor: "var(--field)", color: "var(--text-secondary)", border: "1px solid var(--border)", marginTop: 9, fontSize: 13 }}
          >
            Entrar sem conta
          </button>
          <p className="text-center text-sm mt-3.5" style={{ color: "var(--text-secondary)" }}>
            Já tem conta?{" "}
            <button onClick={() => navigate("/login")} className="font-semibold" style={{ color: VERDE }}>Entrar</button>
          </p>
        </div>
      </div>
    </div>
  );
}



