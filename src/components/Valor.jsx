/**
 * <Valor /> — formatação canônica de valores em R$ do TaCerto! (padrão Nubank).
 *
 * <Valor>48600</Valor>              → R$ 48.600,00
 * <Valor decimais={2}>48600.5</Valor> → R$ 48.600,50
 * <Valor sinal="+">3500</Valor>     → + R$ 3.500,00  (sinal em verde)
 *
 * Regras visuais:
 * - "R$" em cor --text (BRANCO).
 * - Parte inteira em cor --text (branco).
 * - Vírgula e centavos em cor --text-secondary (cinza sutil).
 * - Sinal opcional (+/-) em cor --primary (verde), ANTES do "R$".
 * - SEMPRE 2 casas decimais.
 * - SEMPRE em uma linha (white-space: nowrap), tabular-nums.
 */

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
  const centavos = casas > 0 ? "," + decRaw : "";
  return { inteiro, centavos, negativo };
}

export default function Valor({
  children,
  decimais = 2,
  sinal,
  tamanho = "md",
  className = "",
  style,
}) {
  const { inteiro, centavos } = partes(children, decimais);
  const baseSize = TAMANHOS[tamanho] || TAMANHOS.md;
  const peso = PESOS[tamanho] || PESOS.md;

  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "baseline",
        whiteSpace: "nowrap",
        fontSize: baseSize,
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
      <span style={{ color: "var(--text)" }}>R$&nbsp;</span>
      <span style={{ color: "var(--text)" }}>{inteiro}</span>
      {centavos && (
        <span style={{ color: "var(--text-secondary)" }}>{centavos}</span>
      )}
    </span>
  );
}
