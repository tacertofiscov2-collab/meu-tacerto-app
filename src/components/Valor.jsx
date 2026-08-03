/**
 * <Valor /> — formatação canônica de valores em R$ do TaCerto!.
 *
 * <Valor>48600</Valor>              → R$ 48.600,00
 * <Valor decimais={2}>48600.5</Valor> → R$ 48.600,50
 * <Valor sinal="+">3500</Valor>     → + R$ 3.500,00  (sinal em verde)
 * <Valor px={13}>3500</Valor>       → tamanho FIXO em px, ignora --font-scale
 *
 * Regras visuais:
 * - Todo o valor renderiza em cor --text (BRANCO uniforme).
 * - Sinal opcional (+/-) em cor --primary (verde), ANTES do "R$".
 * - SEMPRE 2 casas decimais.
 * - SEMPRE em uma linha (white-space: nowrap), tabular-nums.
 *
 * ATENÇÃO: os tamanhos nomeados usam rem, que escala com a preferência
 * de fonte do usuário. Onde o tamanho NÃO pode escalar (Card B do
 * dashboard), use a prop `px`.
 */

import { useLayoutEffect, useRef, useState } from "react";

const TAMANHOS = {
  sm: "0.875rem",
  md: "1rem",
  lg: "1.5rem",
  xl: "2rem",
};

const PESOS = {
  sm: 600,
  md: 600,
  lg: 700,
  xl: 700,
};

function partes(valor, decimais = 2) {
  const n = Number(valor);
  const safe = Number.isFinite(n) ? n : 0;
  const casas = Math.max(0, Math.min(4, decimais ?? 2));
  const fixado = safe.toFixed(casas);
  const [intRaw, decRaw = ""] = fixado.split(".");
  const negativo = intRaw.startsWith("-");
  const intAbs = negativo ? intRaw.slice(1) : intRaw;
  const inteiro = Number(intAbs).toLocaleString("pt-BR");
  const centavos = casas > 0 ? decRaw : "";
  return { inteiro, centavos, negativo };
}

export default function Valor({
  children,
  decimais = 2,
  sinal,
  tamanho = "md",
  px,
  peso: pesoProp,
  cor,
  className = "",
  style,
  autoAjustar = false,
}) {
  const { inteiro, centavos } = partes(children, decimais);

  // px tem prioridade: tamanho absoluto, imune ao --font-scale
  const baseSize = px ? `${px}px` : (TAMANHOS[tamanho] || TAMANHOS.md);
  const peso = pesoProp || PESOS[tamanho] || PESOS.md;
  const corValor = cor || "var(--text)";

  const ref = useRef(null);
  const [fontSize, setFontSize] = useState(baseSize);

  useLayoutEffect(() => {
    if (!autoAjustar) {
      setFontSize(baseSize);
      return;
    }
    const el = ref.current;
    const parent = el?.parentElement;
    if (!el || !parent) return;
    const measure = () => {
      const basePx =
        typeof baseSize === "string" && baseSize.endsWith("rem")
          ? parseFloat(baseSize) * 16
          : parseFloat(baseSize);
      let size = basePx;
      el.style.fontSize = size + "px";
      const available = parent.clientWidth - 4;
      let guard = 40;
      while (el.scrollWidth > available && size > 9 && guard-- > 0) {
        size -= 0.5;
        el.style.fontSize = size + "px";
      }
      setFontSize(size + "px");
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(parent);
    return () => ro.disconnect();
  }, [autoAjustar, baseSize, children, decimais]);

  return (
    <span
      ref={ref}
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "baseline",
        whiteSpace: "nowrap",
        fontSize,
        lineHeight: 1.1,
        fontVariantNumeric: "tabular-nums",
        fontWeight: peso,
        ...style,
      }}
    >
      {sinal && (
        <span style={{ color: "var(--primary)", marginRight: "0.28em" }}>
          {sinal}
        </span>
      )}
      <span style={{ color: corValor }}>
        R$&nbsp;{inteiro},{centavos}
      </span>
    </span>
  );
}




