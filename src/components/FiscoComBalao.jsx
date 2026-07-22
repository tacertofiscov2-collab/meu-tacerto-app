import Fisco from "./Fisco.jsx";

/**
 * Fisco + balão de fala em névoa translúcida.
 * O balão é HTML (não SVG) — permite blur real e não distorce o viewBox do robô.
 *
 * Props:
 * - size: largura do robô em px
 * - pose: "joinha" | "ok" | "alerta" | "neutro" | "amigavel"
 * - fala: palavra da situação (se ausente, não desenha balão)
 * - corFala: cor da palavra (segue a faixa)
 * - offsetBalao: { x, y } ajuste fino da posição do balão em px
 */
export default function FiscoComBalao({
  size = 120,
  pose = "neutro",
  fala,
  corFala = "var(--primary)",
  offsetBalao,
  className = "",
  style,
}) {
  const temFala = Boolean(fala);

  // Escala do balão proporcional ao robô
  const fonteBalao = Math.max(11, Math.round(size * 0.135));

  const dx = offsetBalao?.x ?? Math.round(size * 0.42);
  const dy = offsetBalao?.y ?? 0;

  return (
    <div
      className={"relative inline-flex items-end " + className}
      style={style}
    >
      <Fisco size={size} pose={pose} />

      {temFala && (
        <span
          className="fisco-balao absolute pointer-events-none"
          style={{
            left: dx,
            top: dy,
            transform: "translateY(-14%)",
          }}
        >
          <span
            className="fisco-balao-texto"
            style={{ fontSize: fonteBalao, color: corFala }}
          >
            {fala}
          </span>
        </span>
      )}
    </div>
  );
}