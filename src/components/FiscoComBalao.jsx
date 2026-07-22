import Fisco from "./Fisco.jsx";

/**
 * Fisco + balão de fala em névoa translúcida, com bolhas subindo da cabeça.
 *
 * O balão é posicionado por coordenadas REAIS do SVG (viewBox 380x380),
 * não por porcentagem do container — assim ele acompanha a cabeça em
 * qualquer tamanho.
 *
 * Referências dentro do viewBox:
 *   topo da cabeça  ≈ y 64
 *   lado direito    ≈ x 248
 *   centro          ≈ x 190
 *
 * Props:
 * - size: largura do robô em px
 * - pose: "joinha" | "ok" | "alerta" | "neutro" | "amigavel"
 * - fala: palavra da situação (se ausente, não desenha balão)
 * - corFala: cor da palavra (segue a faixa)
 * - ladoBalao: "direita" (padrão) | "esquerda"
 */
export default function FiscoComBalao({
  size = 120,
  pose = "neutro",
  fala,
  corFala = "var(--primary)",
  ladoBalao = "direita",
  className = "",
  style,
}) {
  const temFala = Boolean(fala);

  // Escala: 1 unidade do viewBox = (size / 380) px
  const u = size / 380;

  // Âncora da cabeça, em unidades do viewBox
  const cabecaX = ladoBalao === "direita" ? 246 : 134;
  const cabecaY = 78;

  // Bolhas: sobem em diagonal da cabeça até o balão
  const bolhas = [
    { dx: 14, dy: -16, r: 5 },
    { dx: 30, dy: -34, r: 7.5 },
  ];

  // Balão fica logo acima da última bolha
  const balaoX = cabecaX + 44 * u;
  const balaoY = cabecaY - 58 * u;

  const fonteBalao = Math.max(11, Math.round(size * 0.125));

  return (
    <div
      className={"relative inline-block " + className}
      style={{ width: size, height: size, ...style }}
    >
      <Fisco size={size} pose={pose} />

      {temFala && (
        <>
          {/* bolhas de ligação, em névoa */}
          {bolhas.map((b, i) => (
            <span
              key={i}
              aria-hidden
              className="fisco-bolha absolute pointer-events-none"
              style={{
                left: (cabecaX + b.dx) * u,
                top: (cabecaY + b.dy) * u,
                width: b.r * 2 * u,
                height: b.r * 2 * u,
              }}
            />
          ))}

          {/* balão */}
          <span
            className="fisco-balao absolute pointer-events-none"
            style={{
              left: balaoX,
              top: balaoY,
              transform:
                ladoBalao === "direita"
                  ? "translate(-6%, -50%)"
                  : "translate(-94%, -50%)",
            }}
          >
            <span
              className="fisco-balao-texto"
              style={{ fontSize: fonteBalao, color: corFala }}
            >
              {fala}
            </span>
          </span>
        </>
      )}
    </div>
  );
}