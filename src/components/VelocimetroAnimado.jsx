import { useEffect, useState, useId } from "react";
import { FAIXA_INFO } from "@/lib/fiscal";

/**
 * Velocímetro animado com:
 * - Arco de fundo com gradiente completo em opacidade 0.2
 * - Arco preenchido com gradiente completo em opacidade 1
 * - Animação de entrada 0% → valor real (1200ms) + pulse do ponteiro (400ms)
 * - Trava visual em 100% (arco/ponteiro), mas o número exibido é o real
 */
export default function VelocimetroAnimado({
  percentual,
  maxWidth = 220,
  numeroClasse = "text-5xl font-bold",
}) {
  const uid = useId().replace(/:/g, "");
  const gradId = `velGrad-${uid}`;

  const pVisual = Math.max(0, Math.min(100, percentual));
  const [progresso, setProgresso] = useState(0);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    setProgresso(0);
    setPulse(false);
    const t1 = setTimeout(() => setProgresso(pVisual), 80);
    const t2 = setTimeout(() => setPulse(true), 80 + 1200);
    const t3 = setTimeout(() => setPulse(false), 80 + 1200 + 400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [pVisual]);

  const cx = 100;
  const cy = 100;
  const r = 80;
  const arcLength = Math.PI * r;
  const filledLength = (progresso / 100) * arcLength;
  const arcPath = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;

  // Ponteiro desenhado estaticamente apontando pra esquerda (rad = 180°);
  // depois rotacionado (progresso/100)*180° em torno do centro.
  const needleR = 60;
  const baseHalfWidth = 7;
  const midHalfWidth = 3;
  const midR = needleR * 0.45;

  // rad=π: cos=-1, sin=0; perpX=sin=0, perpY=cos=-1
  const tipX = cx - needleR;
  const tipY = cy;
  const b1x = cx;
  const b1y = cy - baseHalfWidth;
  const b2x = cx;
  const b2y = cy + baseHalfWidth;
  const mx = cx - midR;
  const my = cy;
  const m1x = mx;
  const m1y = my - midHalfWidth;
  const m2x = mx;
  const m2y = my + midHalfWidth;
  const needlePoints = `${b1x},${b1y} ${m1x},${m1y} ${tipX},${tipY} ${m2x},${m2y} ${b2x},${b2y}`;

  const rotDeg = (progresso / 100) * 180;

  return (
    <div className="w-full flex flex-col items-center">
      <svg
        viewBox="0 0 200 120"
        className="block mx-auto w-full"
        style={{ maxWidth }}
        role="img"
        aria-label={`Velocímetro fiscal: ${Math.round(percentual)} por cento`}
      >
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={FAIXA_INFO.tranquilo.cor} />
            <stop offset="50%" stopColor={FAIXA_INFO.fique_de_olho.cor} />
            <stop offset="75%" stopColor={FAIXA_INFO.atencao.cor} />
            <stop offset="90%" stopColor={FAIXA_INFO.perto_do_limite.cor} />
            <stop offset="100%" stopColor={FAIXA_INFO.estourou.cor} />
          </linearGradient>
        </defs>

        {/* Arco de fundo — gradiente completo com opacidade reduzida */}
        <path
          d={arcPath}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={18}
          strokeLinecap="round"
          opacity={0.2}
        />

        {/* Arco preenchido — animado via stroke-dasharray */}
        <path
          d={arcPath}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={18}
          strokeLinecap="round"
          strokeDasharray={`${filledLength} ${arcLength}`}
          style={{
            transition: "stroke-dasharray 1200ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />

        {/* Ponteiro (rotate) + pulse */}
        <g
          style={{
            transformOrigin: "100px 100px",
            transform: `scale(${pulse ? 1.08 : 1})`,
            transition: "transform 400ms ease-out",
          }}
        >
          <g
            style={{
              transformOrigin: "100px 100px",
              transform: `rotate(${rotDeg}deg)`,
              transition: "transform 1200ms cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            <polygon points={needlePoints} fill="var(--text)" />
          </g>
          <circle cx={cx} cy={cy} r={8} fill="var(--text)" />
          <circle cx={cx} cy={cy} r={3.5} fill="var(--bg)" />
        </g>
      </svg>

      <div className="mt-1 flex flex-col items-center">
        <span className={numeroClasse} style={{ color: "var(--text)" }}>
          {Math.round(percentual)}%
        </span>
      </div>
    </div>
  );
}
