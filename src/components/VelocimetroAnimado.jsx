/* VELOCIMETROANIMADO v4 — prop semBalao: esconde o balao (card B depois de ler a explicacao da media) (v3: modo "so interrogacao" (card B) + letra do "+N%" que cabe no balao) */
import { useEffect, useState, useId } from "react";
import { AlertTriangle } from "lucide-react";
import { FAIXA_INFO, faixaDoVelocimetro } from "@/lib/fiscal";

// Flag de MÓDULO: lembra que a animação de entrada já aconteceu nesta
// sessão. Sobrevive a remontagens do componente (o carrossel do dashboard
// remonta o velocímetro ao deslizar) — por isso não usamos useRef aqui,
// que zeraria a cada remontagem e faria o ponteiro subir do zero de novo.
let jaAnimouNaSessao = false;

/**
 * Velocímetro animado.
 * - Arco e ponteiro TRAVAM em 100%.
 * - Número exibido também trava em 100%.
 * - Acima de 100%: balão redondo ao lado mostrando "+N%" (até 20%).
 * - Acima de 120%: balão vira alerta (ícone), pois passou da margem legal.
 *
 * BALÃO SEMPRE VISÍVEL (v2 — decidido 26/09/2026)
 * Com `sempreMostrarBalao`, o balão existe em QUALQUER situação:
 *   - dentro do limite: mostra "?" na cor da faixa (verde, amarelo...)
 *   - passou do limite: "+N%" em vermelho (ou o alerta, acima de 120%)
 * Tocar chama `onClickBalao` — no Dashboard abre o "Tirar dúvidas" com
 * as perguntas da situação da pessoa.
 * Sem `sempreMostrarBalao`, funciona como antes (balão só acima de 100%,
 * chamando `onClickExcedente`), para as outras telas que usam o
 * velocímetro não mudarem.
 *
 * `alertaDos20 = false` desliga o alerta dos 120%.
 *
 * SÓ INTERROGAÇÃO (v3 — card B, velocímetro da MÉDIA): com
 * `apenasInterrogacao`, o balão é SEMPRE "?", em qualquer situação —
 * nunca "+N%" nem alerta. A única coisa que muda é a COR do "?", que
 * segue a situação (verde, amarelo, laranja, vermelho). O card B não
 * alarma: quem alarma é só o card A (o limite do ano, que é o da lei).
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
  sempreMostrarBalao = false,
  onClickBalao,
  alertaDos20 = true,
  apenasInterrogacao = false,
  descricao,
  /* v4: true = nunca mostra o balao */
  semBalao = false,
}) {
  const uid = useId().replace(/:/g, "");
  const gradId = `velGrad-${uid}`;

  const pVisual = Math.max(0, Math.min(100, percentual));
  const excesso = percentual > 100 ? percentual - 100 : 0;
  const passouDos20 = alertaDos20 && excesso > 20;

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

  // Balão: aparece acima de 100% (sempre) ou em qualquer situação quando
  // `sempreMostrarBalao`. Dentro do limite, usa a cor da faixa atual.
  const faixa = faixaDoVelocimetro(percentual);
  const corFaixa = (FAIXA_INFO[faixa] || FAIXA_INFO.tranquilo).cor;
  const mostrarBalao = !semBalao && (excesso > 0 || sempreMostrarBalao);
  // No modo "so interrogacao" o balao nunca vira "+N%" nem alerta:
  // mostra "?" na cor da situacao (acima de 100% a faixa ja e vermelha).
  const mostrarInterrogacao = apenasInterrogacao || excesso <= 0;
  const corBalao = mostrarInterrogacao ? corFaixa : corAlerta;
  const aoTocarBalao = sempreMostrarBalao ? onClickBalao : onClickExcedente;
  const excessoTexto = Math.min(999, Math.round(excesso));

  let rotuloBalao;
  if (mostrarInterrogacao) rotuloBalao = "Tirar dúvidas sobre a sua situação";
  else if (passouDos20) rotuloBalao = "Você passou da margem de 20%. Toque para entender";
  else rotuloBalao = `Você passou ${excessoTexto}% do limite. Toque para entender`;

  return (
    <div className="w-full flex flex-col items-center">
      <svg
        viewBox="0 0 200 120"
        className="block mx-auto w-full"
        style={{ maxWidth }}
        role="img"
        aria-label={
          descricao
            ? `${descricao}: ${Math.round(percentual)} por cento`
            : `Velocímetro fiscal: ${Math.round(percentual)} por cento do limite`
        }
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

        {mostrarBalao && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              aoTocarBalao?.();
            }}
            aria-label={rotuloBalao}
            className="rounded-full flex items-center justify-center shrink-0 active:scale-95 transition"
            style={{
              width: 52,
              height: 52,
              backgroundColor: `${corBalao}33`,
              border: `1.5px solid ${corBalao}80`,
            }}
          >
            {mostrarInterrogacao ? (
              <span
                style={{ color: corBalao, fontSize: 24, fontWeight: 800, lineHeight: 1 }}
              >
                ?
              </span>
            ) : passouDos20 ? (
              <AlertTriangle size={24} strokeWidth={2.4} style={{ color: corBalao }} />
            ) : (
              <span
                style={{
                  color: corBalao,
                  // 1 digito: 15 | 2 digitos: 14 | 3 digitos: 12,5
                  fontSize: excessoTexto >= 100 ? 12.5 : excessoTexto >= 10 ? 14 : 15,
                  fontWeight: 800,
                  lineHeight: 1,
                }}
              >
                +{excessoTexto}%
              </span>
            )}
          </button>
        )}
      </div>
    </div>
  );
}