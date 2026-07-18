/**
 * <Valor /> — formatação canônica de valores em R$ do TaCerto!.
 *
 * <Valor>48600</Valor>              → R$ 48.600
 * <Valor decimais={2}>48600.5</Valor> → R$ 48.600,50
 * <Valor sinal="+">3500</Valor>     → + R$ 3.500
 *
 * Regras visuais:
 * - "R$" e sinal opcional em cor --primary (verde).
 * - Número em cor --text.
 * - Renderiza SEMPRE em uma linha só (nowrap). Se o container é pequeno,
 *   o próprio font-size do container deve encolher — o componente respeita
 *   isso usando `em`/`fontSize: inherit` e força `white-space: nowrap`.
 * - Prop `tamanho` controla o tamanho base (sm/md/lg/xl).
 */

const TAMANHOS = {
  sm: "0.875rem",
  md: "1rem",
  lg: "1.5rem",
  xl: "2rem",
};

function formatar(valor, decimais) {
  const n = Number(valor);
  if (!Number.isFinite(n)) return "0";
  const temCent = decimais != null ? decimais > 0 : n % 1 !== 0;
  return n.toLocaleString("pt-BR", {
    minimumFractionDigits: temCent ? (decimais ?? 2) : 0,
    maximumFractionDigits: temCent ? (decimais ?? 2) : 0,
  });
}

export default function Valor({
  children,
  decimais,
  sinal,
  tamanho = "md",
  className = "",
  style,
}) {
  const numero = formatar(children, decimais);
  const baseSize = TAMANHOS[tamanho] || TAMANHOS.md;

  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "baseline",
        gap: "0.28em",
        whiteSpace: "nowrap",
        fontSize: baseSize,
        lineHeight: 1.1,
        fontVariantNumeric: "tabular-nums",
        ...style,
      }}
    >
      {sinal && (
        <span style={{ color: "var(--primary)", fontWeight: 600 }}>{sinal}</span>
      )}
      <span style={{ color: "var(--primary)", fontWeight: 600 }}>R$</span>
      <span style={{ color: "var(--text)", fontWeight: 700 }}>{numero}</span>
    </span>
  );
}
