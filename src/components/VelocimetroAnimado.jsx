import { useEffect, useState, useId } from "react";
import { AlertTriangle } from "lucide-react";
import { FAIXA_INFO } from "@/lib/fiscal";

// Flag de MÓDULO: lembra que a animação de entrada já aconteceu nesta
// sessão. Sobrevive a remontagens do componente (o carrossel do dashboard
// remonta o velocímetro ao deslizar) — por isso não usamos useRef aqui,
// que zeraria a cada remontagem e faria o ponteiro subir do zero de novo.
let jaAnimouNaSessao = false;

/**
 * Velocímetro animado.
 * - Arco e ponteiro TRAVAM em 100%.
 * - Número exibido também trava em 100%.
 * - Acima de 100%: badge redondo ao lado mostrando "+N%" (até 20%).
 * - Acima de 120%: badge vira alerta (ícone), pois passou da margem legal.
 * - Badge é clicável (onClickExcedente).
 *
 * ANIMAÇÃO: sobe do zero APENAS na primeira montagem. Depois disso, se
 * o percentual mudar, o ponteiro apenas desliza suave até o novo valor.
 * NUNCA reinicia do zero por causa de re-render/remontagem (era o que
 * causava o "encolhe e cresce" ao deslizar o carrossel do dashboard).
 */
export default function VelocimetroAnimado({
  percentual,
  maxWidth = 260,
  numeroClasse = "text-5xl font-bold",
  onClickExcedente,
}) {
  const uid = useId().replace(/:/g, "");
  const gradId = `velGrad-${uid}`;

  const pVisual = Math.max(0, Math.min(100, percentual));
  const excesso = percentual > 100 ? percentual - 100 : 0;
  const passouDos20 = excesso > 20;

  // Se a animação de entrada já rolou nesta sessão, começa já no valor
  // final (sem subir do zero). Só anima do zero na primeiríssima vez.
  const [progresso, setProgresso] = useState(jaAnimouNaSessao ? pVisual : 0);
  const [pulse, setPulse] = useState(false);

  // Animação de ENTRADA: só uma vez por sessão, mesmo que o componente
  // remonte depois (deslize do carrossel não re-anima).
  useEffect(() => {
    if (jaAnimouNaSessao) {
      setProgresso(pVisual);
      return;
    }
    jaAnimouNaSessao = true;
    setProgresso(0);
    const t1 = setTimeout(() => setProgresso(pVisual), 60);
    const t2 = setTimeout(() => setPulse(true), 60 + 1200);
    const t3 = setTimeout(() => setPulse(false), 60 + 1200 + 400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mudança REAL de percentual depois da entrada: desliza suave, sem zerar.
  useEffect(() => {
    if (!jaAnimouNaSessao) return;
    setProgresso(pVisual);
  }, [pVisual]);

  const cx = 100;
  const cy = 100;
  const r = 80;
  const arcLength = Math.PI * r;
  const filledLength = (progresso / 100) * arcLength;
  const arcPath = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;

  const needleR = 60;
  const baseHalfWidth = 7;
  const midHalfWidth = 3;
  const midR = needleR * 0.45;

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
  const corAlerta = passouDos20 ? FAIXA_INFO.critico.cor : FAIXA_INFO.estourou.cor;

  return (
    <div className="w-full flex flex-col items-center">
      <svg
        viewBox="0 0 200 120"
        className="block mx-auto w-full"
        style={{ maxWidth }}
        role="img"
        aria-label={`Velocímetro fiscal: ${Math.round(percentual)} por cento do limite`}
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

        <path
          d={arcPath}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={18}
          strokeLinecap="round"
          opacity={0.2}
        />

        <path
          d={arcPath}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={18}
          strokeLinecap="round"
          strokeDasharray={`${filledLength} ${arcLength}`}
          style={{ transition: "stroke-dasharray 1200ms cubic-bezier(0.4, 0, 0.2, 1)" }}
        />

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

      <div className="mt-1 flex items-center justify-center gap-2">
        <span className={numeroClasse} style={{ color: "var(--text)" }}>
          {Math.round(pVisual)}%
        </span>

        {excesso > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClickExcedente?.();
            }}
            aria-label={
              passouDos20
                ? "Você passou da margem de 20%. Toque para entender"
                : `Você passou ${Math.round(excesso)}% do limite. Toque para entender`
            }
            className="rounded-full flex items-center justify-center shrink-0 active:scale-95 transition"
            style={{
              width: 52,
              height: 52,
              backgroundColor: `${corAlerta}33`,
              border: `1.5px solid ${corAlerta}80`,
            }}
          >
            {passouDos20 ? (
              <AlertTriangle size={24} strokeWidth={2.4} style={{ color: corAlerta }} />
            ) : (
              <span
                style={{ color: corAlerta, fontSize: 15, fontWeight: 800, lineHeight: 1 }}
              >
                +{Math.round(excesso)}%
              </span>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
