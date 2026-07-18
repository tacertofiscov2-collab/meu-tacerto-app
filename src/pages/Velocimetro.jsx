import { useNavigate } from "react-router-dom";
import { ArrowLeft, TrendingUp } from "lucide-react";

import BottomNav from "../components/BottomNav.jsx";
import { useUserState } from "@/lib/userState";
import {
  calcularPercentual,
  calcularFaltam,
  faixaDoVelocimetro,
  FAIXA_INFO,
  fmtBRL,
} from "@/lib/fiscal";

const COR_VERDE = "#22c55e";
const COR_LARANJA = "#f59e0b";
const COR_VERMELHO = "#ef4444";

function faixaDoPercentual(p) {
  const chave = faixaDoVelocimetro(p);
  const info = FAIXA_INFO[chave];
  return { cor: info.cor, label: info.label, chave, mensagem: info.mensagem };
}

function textoAviso(p, faturado, limite) {
  const faixa = faixaDoPercentual(p);
  const pct = Math.round(p);
  if (p > 100) {
    const excesso = faturado - limite;
    return `Com base nos lançamentos registrados, você ultrapassou o limite anual em ${fmtBRL(excesso)}. ${faixa.mensagem}`;
  }
  return `Com base nos lançamentos registrados, você utilizou ${pct}% do seu limite anual. ${faixa.mensagem}`;
}

/**
 * Velocímetro grande: arco de fundo cinza + arco preenchido com degradê
 * verde → amarelo → vermelho, ponteiro em forma de seta grossa e glow.
 */
function VelocimetroGrande({ percentual }) {
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
        className="w-full max-w-[300px]"
        role="img"
        aria-label={`Velocímetro fiscal: ${Math.round(p)} por cento`}
      >
        <defs>
          <linearGradient id="velocimetroGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={COR_VERDE} />
            <stop offset="60%" stopColor={COR_LARANJA} />
            <stop offset="100%" stopColor={COR_VERMELHO} />
          </linearGradient>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
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
          filter="url(#glow)"
        />

        <polygon points={needlePoints} fill="var(--text)" />
        <circle cx={cx} cy={cy} r={8} fill="var(--text)" />
        <circle cx={cx} cy={cy} r={3.5} fill="var(--bg)" />
      </svg>

      <div className="mt-2 flex flex-col items-center">
        <span className="text-5xl font-bold" style={{ color: "var(--text)" }}>
          {Math.round(percentual)}%
        </span>
        <span
          className="text-base font-semibold mt-1"
          style={{ color: faixa.cor }}
        >
          {faixa.label}
        </span>
      </div>
    </div>
  );
}

export default function Velocimetro() {
  const navigate = useNavigate();

  const limite = LIMITES[USUARIO.perfil] ?? LIMITES.MEI;
  const faturado = USUARIO.faturado;
  const faltam = Math.max(0, limite - faturado);
  const percentual = 60; // TODO: calcular a partir de faturado real

  const faixa = faixaDoPercentual(percentual);

  const cardBase = "w-full rounded-2xl";
  const cardStyle = {
    backgroundColor: "var(--surface)",
    border: "1px solid var(--border)",
  };

  // TODO: cálculo real de projeção
  const projecaoAnual = 83200;
  const ultrapassa = projecaoAnual > limite;

  return (
    <div
      className="min-h-screen min-h-[100dvh] w-full flex flex-col"
      style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
    >
      {/* Header */}
      <header className="px-5 pt-6 pb-4 flex items-center gap-3 sticky top-0 z-10" style={{ backgroundColor: "var(--bg)" }}>
        <button
          onClick={() => navigate(-1)}
          aria-label="Voltar"
          className="w-10 h-10 rounded-full flex items-center justify-center hover:opacity-80"
          style={{ backgroundColor: "var(--field)" }}
        >
          <ArrowLeft size={20} style={{ color: "var(--text)" }} />
        </button>
        <h1 className="text-lg font-bold" style={{ color: "var(--text)" }}>
          Velocímetro Fiscal
        </h1>
      </header>

      {/* Conteúdo */}
      <div className="flex-1 overflow-y-auto px-5 pb-[110px] space-y-5">
        {/* Velocímetro grande */}
        <div className={cardBase + " px-5 pt-6 pb-6"} style={cardStyle}>
          <VelocimetroGrande percentual={percentual} />
        </div>

        {/* Grid de 3 métricas */}
        <div className={cardBase + " p-4"} style={cardStyle}>
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
                <span className="font-bold text-base" style={{ color: "var(--text)" }}>
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

        {/* Aviso contextual */}
        <div
          className={cardBase + " p-4"}
          style={{
            ...cardStyle,
            borderLeft: `4px solid ${faixa.cor}`,
          }}
        >
          <p className="text-sm leading-relaxed" style={{ color: "var(--text)" }}>
            {textoAviso(percentual, faturado, limite)}
          </p>
        </div>

        {/* Projeção */}
        <div className={cardBase + " p-4"} style={cardStyle}>
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: "var(--field)" }}
            >
              <TrendingUp size={20} style={{ color: "var(--primary)" }} />
            </div>
            <div className="flex-1">
              <p
                className="text-sm font-semibold mb-1"
                style={{ color: "var(--text)" }}
              >
                Projeção para dezembro
              </p>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                No ritmo atual, você deve fechar o ano em {fmtBRL(projecaoAnual)}
                {ultrapassa
                  ? " — atenção, isso ultrapassaria o limite anual."
                  : " — dentro do limite anual."}
              </p>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
