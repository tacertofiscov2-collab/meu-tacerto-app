import { useNavigate } from "react-router-dom";
import { Bell, ChevronRight, Gauge, AlertTriangle } from "lucide-react";
import BottomNav from "../components/BottomNav.jsx";
import Valor from "../components/Valor.jsx";
import { useUserState } from "@/lib/userState";
import {
  LABEL_TIPO,
  calcularPercentual,
  calcularFaltam,
  faixaDoVelocimetro,
  FAIXA_INFO,
  fmtBRL,
} from "@/lib/fiscal";

function faixaDoPercentual(p) {
  const chave = faixaDoVelocimetro(p);
  const info = FAIXA_INFO[chave];
  return { chave, cor: info.cor, principal: info.principal, apoio: info.apoio };
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
    <div className="w-full flex flex-col items-center">
      <svg
        viewBox="0 0 200 120"
        className="block mx-auto w-full max-w-[220px]"
        role="img"
        aria-label={`Velocímetro fiscal: ${Math.round(p)} por cento`}
      >
        <defs>
          <linearGradient id="velocimetroGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={FAIXA_INFO.tranquilo.cor} />
            <stop offset="50%" stopColor={FAIXA_INFO.fique_de_olho.cor} />
            <stop offset="75%" stopColor={FAIXA_INFO.atencao.cor} />
            <stop offset="90%" stopColor={FAIXA_INFO.perto_do_limite.cor} />
            <stop offset="100%" stopColor={FAIXA_INFO.estourou.cor} />
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

      <div className="mt-2 flex-1 flex flex-col items-center w-full">
        <span className="text-5xl font-bold" style={{ color: "var(--text)" }}>
          {Math.round(percentual)}%
        </span>
        <div className="flex-1 flex flex-col items-center justify-center gap-1.5 px-3 py-3 w-full">
          <span
            className="text-base font-bold text-center flex items-center gap-1.5"
            style={{ color: faixa.cor }}
          >
            {faixa.chave === "critico" && (
              <AlertTriangle size={16} style={{ color: faixa.cor }} />
            )}
            {faixa.principal}
          </span>
          <span
            className="text-sm font-normal text-center leading-snug"
            style={{ color: "var(--text-secondary)" }}
          >
            {faixa.apoio}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { nome, tipo, faturado, limite } = useUserState();

  const faltam = calcularFaltam(faturado, limite);
  const percentual = calcularPercentual(faturado, limite);
  const rotuloPerfil = LABEL_TIPO[tipo];

  const saudacao = saudacaoPorHora();

  return (
    <div
      className="min-h-[100dvh] w-full flex flex-col"
      style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
    >
      <div
        className="flex-1 flex flex-col"
        style={{ paddingBottom: "calc(130px + env(safe-area-inset-bottom))" }}
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
                {nome}
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

        {/* Bloco de cards */}
        <div className="px-5 pt-3 flex-1 flex flex-col gap-3">
          {/* Card Velocímetro */}
          <button
            onClick={() => navigate("/velocimetro")}
            className="relative w-full rounded-3xl px-5 pt-4 pb-5 text-left flex-1 flex flex-col transition-transform active:scale-[0.99]"
            style={{
              background:
                "linear-gradient(160deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 55%, rgba(255,255,255,0) 100%), var(--surface)",
              border: "1px solid rgba(63,63,70,0.6)",
              boxShadow:
                "0 10px 30px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)",
            }}
          >
            {/* Seta de "clicável" no canto superior direito */}
            <ChevronRight
              size={20}
              className="absolute top-4 right-4"
              style={{ color: "var(--text-secondary)" }}
              aria-hidden
            />

            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              {rotuloPerfil}
            </p>

            <div className="flex-1 flex items-center justify-center w-full">
              <Velocimetro percentual={percentual} />
            </div>
          </button>

          {/* Card Faturado / Limite / Faltam */}
          <div
            className="w-full rounded-2xl py-4 px-2"
            style={{
              backgroundColor: "var(--surface)",
              border: "1px solid var(--border)",
            }}
          >
            <div className="grid grid-cols-3">
              {[
                { valor: faturado, label: "Faturado" },
                { valor: limite, label: "Limite" },
                { valor: faltam, label: "Faltam" },
              ].map((c, i) => (
                <div
                  key={c.label}
                  className={
                    "flex flex-col items-center text-center px-1 min-w-0 " +
                    (i > 0 ? "border-l" : "")
                  }
                  style={i > 0 ? { borderColor: "var(--border)" } : undefined}
                >
                  <Valor tamanho="sm">{c.valor}</Valor>
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

      <BottomNav ativo="inicio" />
    </div>
  );
}
