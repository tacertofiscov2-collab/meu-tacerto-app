import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell, Plus, Home, Receipt, LayoutGrid, User,
  ChevronRight, Gauge,
} from "lucide-react";

// TODO: buscar dados reais do Supabase/localStorage
const USUARIO = {
  nome: "Fernando",
  perfil: "MEI", // "MEI" | "MEI_CAMINHONEIRO"
  faturado: 48600,
};
const LIMITES = { MEI: 81000, MEI_CAMINHONEIRO: 251600 };
const ROTULO_PERFIL = {
  MEI: "MEI (outras atividades)",
  MEI_CAMINHONEIRO: "MEI Caminhoneiro",
};

const fmtBRL = (v) =>
  "R$ " + v.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const COR_VERDE = "#22c55e";
const COR_LARANJA = "#f59e0b";
const COR_VERMELHO = "#ef4444";

function faixaDoPercentual(p) {
  if (p < 60) return { cor: COR_VERDE, label: "Tudo certo" };
  if (p < 80) return { cor: COR_LARANJA, label: "Atenção" };
  if (p <= 100) return { cor: COR_VERMELHO, label: "Cuidado" };
  return { cor: "#991b1b", label: "Limite ultrapassado" };
}

function saudacaoPorHora() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "Bom dia,";
  if (h >= 12 && h < 18) return "Boa tarde,";
  return "Boa noite,";
}

/**
 * Velocímetro — NÃO ALTERAR o SVG. Mantido igual.
 */
function Velocimetro({ percentual }) {
  const p = Math.max(0, Math.min(100, percentual));

  const cx = 100;
  const cy = 100;
  const r = 80;

  const arcLength = Math.PI * r;
  const filledLength = (p / 100) * arcLength;

  const arcPath = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;

  const angleDeg = 180 - (p / 100) * 180;
  const rad = (angleDeg * Math.PI) / 180;
  const needleR = 60;

  const tipX = cx + needleR * Math.cos(rad);
  const tipY = cy - needleR * Math.sin(rad);

  const baseHalfWidth = 7;
  const perpX = Math.sin(rad);
  const perpY = Math.cos(rad);
  const b1x = cx + baseHalfWidth * perpX;
  const b1y = cy + baseHalfWidth * perpY;
  const b2x = cx - baseHalfWidth * perpX;
  const b2y = cy - baseHalfWidth * perpY;

  const midR = needleR * 0.45;
  const midHalfWidth = 3;
  const mx = cx + midR * Math.cos(rad);
  const my = cy - midR * Math.sin(rad);
  const m1x = mx + midHalfWidth * perpX;
  const m1y = my + midHalfWidth * perpY;
  const m2x = mx - midHalfWidth * perpX;
  const m2y = my - midHalfWidth * perpY;

  const needlePoints = `${b1x},${b1y} ${m1x},${m1y} ${tipX},${tipY} ${m2x},${m2y} ${b2x},${b2y}`;

  const faixa = faixaDoPercentual(percentual);

  return (
    <div className="flex flex-col items-center">
      <svg
        viewBox="0 0 200 120"
        className="w-full max-w-[220px]"
        role="img"
        aria-label={`Velocímetro fiscal: ${Math.round(p)} por cento`}
      >
        <defs>
          <linearGradient id="velocimetroGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={COR_VERDE} />
            <stop offset="60%" stopColor={COR_LARANJA} />
            <stop offset="100%" stopColor={COR_VERMELHO} />
          </linearGradient>
        </defs>

        <path
          d={arcPath}
          fill="none"
          stroke="var(--field)"
          strokeWidth={18}
          strokeLinecap="round"
        />

        <path
          d={arcPath}
          fill="none"
          stroke="url(#velocimetroGrad)"
          strokeWidth={18}
          strokeLinecap="round"
          strokeDasharray={`${filledLength} ${arcLength}`}
        />

        <polygon points={needlePoints} fill="var(--text)" />
        <circle cx={cx} cy={cy} r={8} fill="var(--text)" />
        <circle cx={cx} cy={cy} r={3.5} fill="var(--bg)" />
      </svg>

      <div className="mt-2 flex flex-col items-center">
        <span className="text-5xl font-bold" style={{ color: "var(--text)" }}>
          {Math.round(percentual)}%
        </span>
        <span className="text-sm font-semibold mt-1" style={{ color: faixa.cor }}>
          {faixa.label}
        </span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();

  const limite = LIMITES[USUARIO.perfil] ?? LIMITES.MEI;
  const faturado = USUARIO.faturado;
  const faltam = Math.max(0, limite - faturado);
  const percentual = (faturado / limite) * 100;
  const rotuloPerfil = ROTULO_PERFIL[USUARIO.perfil] ?? "MEI";

  const saudacao = saudacaoPorHora();

  return (
    <div
      className="min-h-[100dvh] w-full flex flex-col"
      style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
    >
      <div
        className="flex-1 flex flex-col"
        style={{ paddingBottom: "calc(120px + env(safe-area-inset-bottom))" }}
      >
        {/* Header */}
        <header className="px-5 pt-4 pb-2 flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2.5">
              <Gauge size={34} style={{ color: "var(--primary)" }} strokeWidth={2.2} />
              <span className="font-bold text-2xl leading-none" style={{ color: "var(--text)" }}>
                Ta<span style={{ color: "var(--primary)" }}>Certo!</span>
              </span>
            </div>
            <div className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
              {saudacao}{" "}
              <span className="text-base font-semibold" style={{ color: "var(--text)" }}>
                {USUARIO.nome}
              </span>
            </div>
          </div>

          <button
            onClick={() => navigate("/alertas")}
            aria-label="Notificações"
            className="relative w-11 h-11 rounded-full flex items-center justify-center hover:opacity-80 shrink-0"
            style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <Bell size={20} style={{ color: "var(--text)" }} />
            <span
              className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full"
              style={{ backgroundColor: "var(--danger)" }}
              aria-hidden
            />
          </button>
        </header>

        {/* Bloco de cards ocupando o resto da tela */}
        <div className="px-5 pt-4 flex-1 flex flex-col gap-4">
          {/* Card Velocímetro (efeito espelhado exclusivo) */}
          <button
            onClick={() => navigate("/velocimetro")}
            className="relative w-full rounded-3xl px-5 pt-4 pb-5 text-left flex-1 flex flex-col transition-transform active:scale-[0.99]"
            style={{
              background:
                "linear-gradient(160deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 55%, rgba(255,255,255,0) 100%), var(--surface)",
              boxShadow:
                "0 10px 30px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)",
            }}
          >
            {/* Borda gradiente sutil */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-3xl"
              style={{
                padding: 1,
                background:
                  "linear-gradient(to bottom, rgba(255,255,255,0.12), rgba(255,255,255,0))",
                WebkitMask:
                  "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                WebkitMaskComposite: "xor",
                maskComposite: "exclude",
              }}
            />

            <div className="relative flex items-start justify-between">
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                {rotuloPerfil}
              </p>
              <ChevronRight size={20} style={{ color: "var(--text-secondary)" }} />
            </div>

            <div className="relative flex-1 flex items-center justify-center">
              <Velocimetro percentual={percentual} />
            </div>
          </button>

          {/* Card Faturado / Limite / Faltam */}
          <div
            className="w-full rounded-2xl py-4 px-4"
            style={{
              backgroundColor: "var(--surface)",
              border: "1px solid var(--border)",
            }}
          >
            <div className="grid grid-cols-3">
              {[
                { valor: fmtBRL(faturado), label: "Faturado" },
                { valor: fmtBRL(limite), label: "Limite" },
                { valor: fmtBRL(faltam), label: "Faltam" },
              ].map((c, i) => (
                <div
                  key={c.label}
                  className={
                    "flex flex-col items-center text-center px-2 " +
                    (i > 0 ? "border-l" : "")
                  }
                  style={i > 0 ? { borderColor: "var(--border)" } : undefined}
                >
                  <span className="font-bold text-sm" style={{ color: "var(--text)" }}>
                    {c.valor}
                  </span>
                  <span
                    className="text-xs mt-1"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {c.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Navbar: bolhas soltas, 5 itens iguais, só no dashboard */}
      <nav
        aria-label="Navegação principal"
        className="fixed left-0 right-0 bottom-0 z-30 pointer-events-none"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="max-w-xl mx-auto px-4 pb-3 flex items-end justify-between">
          <NavBubble active label="Início" icon={Home} onClick={() => navigate("/dashboard")} />
          <NavBubble label="Histórico" icon={Receipt} onClick={() => navigate("/historico")} />
          <NavBubble label="Lançar" icon={Plus} accent onClick={() => navigate("/lancar")} />
          <NavBubble label="Menu" icon={LayoutGrid} onClick={() => navigate("/menu")} />
          <NavBubble label="Perfil" icon={User} onClick={() => navigate("/perfil")} />
        </div>
      </nav>
    </div>
  );
}

function NavBubble({ icon: Icon, label, active = false, accent = false, onClick }) {
  const color = accent
    ? "var(--primary)"
    : active
    ? "var(--primary)"
    : "var(--text-secondary)";
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="pointer-events-auto flex flex-col items-center justify-end gap-1 active:scale-95 transition"
    >
      <span
        className="w-12 h-12 rounded-full flex items-center justify-center"
        style={{
          backgroundColor: "rgba(24,24,27,0.6)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: "1px solid rgba(63,63,70,0.55)",
          boxShadow: "0 6px 18px rgba(0,0,0,0.35)",
        }}
      >
        <Icon
          size={22}
          strokeWidth={active || accent ? 2.5 : 2}
          style={{ color }}
        />
      </span>
      <span
        className="text-[10px] font-medium leading-none"
        style={{ color }}
      >
        {label}
      </span>
    </button>
  );
}
