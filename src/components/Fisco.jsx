/**
 * Fisco — mascote robô do TaCerto!
 *
 * O balão de fala vive DENTRO do SVG: névoa translúcida (feGaussianBlur),
 * sem contorno, bolhas subindo da cabeça em diagonal, palavra colorida
 * em fonte informal. Assim ele nunca escapa do container nem empurra layout.
 *
 * Props:
 * - size: largura em px. Padrão 64.
 * - pose: "joinha" | "ok" | "alerta" | "neutro" | "amigavel".
 * - fala: palavra da situação. Sem ela, não desenha balão.
 * - corFala: cor da palavra (segue a faixa).
 * - apenasCabeca: renderiza só a cabeça (avatar do chat).
 */
export default function Fisco({
    size = 64,
    pose = "neutro",
    fala,
    corFala = "var(--primary)",
    apenasCabeca = false,
    className = "",
    style,
  }) {
    const uid = `fisco-${pose}-${apenasCabeca ? "h" : "f"}-${fala ? "b" : "n"}`;
  
    const defs = (
      <>
        <linearGradient id={`${uid}-metal`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#71717a" />
          <stop offset="45%" stopColor="#52525b" />
          <stop offset="100%" stopColor="#3f3f46" />
        </linearGradient>
        <linearGradient id={`${uid}-metalClaro`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#a1a1aa" />
          <stop offset="50%" stopColor="#71717a" />
          <stop offset="100%" stopColor="#52525b" />
        </linearGradient>
        <linearGradient id={`${uid}-visor`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#18181b" />
          <stop offset="100%" stopColor="#09090b" />
        </linearGradient>
        <radialGradient id={`${uid}-brilho`} cx="35%" cy="30%" r="60%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <filter id={`${uid}-nevoa`} x="-40%" y="-60%" width="180%" height="220%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
        <filter id={`${uid}-nevoaBolha`} x="-70%" y="-70%" width="240%" height="240%">
          <feGaussianBlur stdDeviation="2.6" />
        </filter>
      </>
    );
  
    const olhoY = pose === "alerta" ? 104 : 103;
    const boca =
      pose === "alerta"
        ? "M176 124 Q190 113 204 124"
        : pose === "ok"
          ? "M180 118 L200 118"
          : "M177 116 Q190 126 203 116";
  
    /* ================= MODO AVATAR (só cabeça) ================= */
    if (apenasCabeca) {
      return (
        <svg
          width={size}
          height={size}
          viewBox="112 26 156 156"
          role="img"
          aria-label="Fisco"
          className={className}
          style={style}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>{defs}</defs>
          <line x1="190" y1="66" x2="190" y2="46" stroke="#52525b" strokeWidth="5" strokeLinecap="round" />
          <circle cx="190" cy="40" r="10" fill="var(--primary)" />
          <circle cx="186.5" cy="36.5" r="3.5" fill="#bbf7d0" />
          <rect x="120" y="96" width="14" height="30" rx="7" fill={`url(#${uid}-metal)`} />
          <rect x="246" y="96" width="14" height="30" rx="7" fill={`url(#${uid}-metal)`} />
          <circle cx="127" cy="111" r="3.5" fill="var(--primary)" opacity="0.6" />
          <circle cx="253" cy="111" r="3.5" fill="var(--primary)" opacity="0.6" />
          <rect x="132" y="64" width="116" height="90" rx="30" fill={`url(#${uid}-metalClaro)`} />
          <rect x="137" y="69" width="106" height="80" rx="26" fill={`url(#${uid}-metal)`} />
          <rect x="137" y="69" width="106" height="80" rx="26" fill={`url(#${uid}-brilho)`} />
          <rect x="149" y="84" width="82" height="50" rx="20" fill={`url(#${uid}-visor)`} />
          <rect x="153" y="88" width="74" height="20" rx="10" fill="#ffffff" opacity="0.05" />
          <circle cx="171" cy={olhoY} r="9.5" fill="var(--primary)" />
          <circle cx="167.5" cy={olhoY - 3} r="3.2" fill="#dcfce7" />
          <circle cx="209" cy={olhoY} r="9.5" fill="var(--primary)" />
          <circle cx="205.5" cy={olhoY - 3} r="3.2" fill="#dcfce7" />
          <path d={boca} stroke="var(--primary)" strokeWidth="3.2" fill="none" strokeLinecap="round" />
          <rect x="178" y="152" width="24" height="16" rx="6" fill="#3f3f46" />
        </svg>
      );
    }
  
    /* ================= MODO COMPLETO ================= */
    const temFala = Boolean(fala);
  
    // Com balão o viewBox cresce à direita e no topo, mas o robô fica
    // sempre nas MESMAS coordenadas — nada se desloca.
    const vbX = temFala ? 0 : 0;
    const vbY = temFala ? -70 : 0;
    const vbW = temFala ? 520 : 380;
    const vbH = temFala ? 450 : 380;
  
    const alturaProp = (size / vbW) * vbH;
  
    // Balão: elipse de névoa + texto, à direita e acima da cabeça
    const textoLen = String(fala || "").length;
    const rxBalao = Math.min(112, Math.max(52, textoLen * 8.2 + 24));
    const cxBalao = 300 + rxBalao * 0.55;
    const cyBalao = -18;
  
    return (
      <svg
        width={size}
        height={alturaProp}
        viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`}
        role="img"
        aria-label={fala ? `Fisco diz: ${fala}` : "Fisco, seu amigo fiscal"}
        className={className}
        style={{ display: "block", ...style }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>{defs}</defs>
  
        {/* ===== BALÃO EM NÉVOA ===== */}
        {temFala && (
          <g>
            {/* bolhas subindo da cabeça em diagonal */}
            <circle
              cx="258" cy="52" r="6"
              fill="var(--balao-nevoa-cor)"
              opacity="0.5"
              filter={`url(#${uid}-nevoaBolha)`}
            />
            <circle
              cx="276" cy="26" r="9"
              fill="var(--balao-nevoa-cor)"
              opacity="0.55"
              filter={`url(#${uid}-nevoaBolha)`}
            />
  
            {/* corpo da névoa */}
            <ellipse
              cx={cxBalao}
              cy={cyBalao}
              rx={rxBalao}
              ry="34"
              fill="var(--balao-nevoa-cor)"
              opacity="0.42"
              filter={`url(#${uid}-nevoa)`}
            />
  
            <text
              x={cxBalao}
              y={cyBalao + 10}
              textAnchor="middle"
              fill={corFala}
              style={{
                fontSize: 30,
                fontWeight: 700,
                fontStyle: "italic",
                fontFamily: '"Comic Neue", "Chalkboard SE", "Comic Sans MS", cursive',
              }}
            >
              {fala}
            </text>
          </g>
        )}
  
        {/* sombra no chão */}
        <ellipse cx="190" cy="348" rx="74" ry="10" fill="var(--primary)" opacity="0.12" />
  
        {/* antena */}
        <line x1="190" y1="66" x2="190" y2="46" stroke="#52525b" strokeWidth="5" strokeLinecap="round" />
        <circle cx="190" cy="40" r="10" fill="var(--primary)" />
        <circle cx="186.5" cy="36.5" r="3.5" fill="#bbf7d0" />
  
        {/* orelhas */}
        <rect x="120" y="96" width="14" height="30" rx="7" fill={`url(#${uid}-metal)`} />
        <rect x="246" y="96" width="14" height="30" rx="7" fill={`url(#${uid}-metal)`} />
        <circle cx="127" cy="111" r="3.5" fill="var(--primary)" opacity="0.6" />
        <circle cx="253" cy="111" r="3.5" fill="var(--primary)" opacity="0.6" />
  
        {/* cabeça */}
        <rect x="132" y="64" width="116" height="90" rx="30" fill={`url(#${uid}-metalClaro)`} />
        <rect x="137" y="69" width="106" height="80" rx="26" fill={`url(#${uid}-metal)`} />
        <rect x="137" y="69" width="106" height="80" rx="26" fill={`url(#${uid}-brilho)`} />
  
        {/* visor */}
        <rect x="149" y="84" width="82" height="50" rx="20" fill={`url(#${uid}-visor)`} />
        <rect x="153" y="88" width="74" height="20" rx="10" fill="#ffffff" opacity="0.05" />
  
        {/* olhos */}
        <circle cx="171" cy={olhoY} r="9.5" fill="var(--primary)" />
        <circle cx="167.5" cy={olhoY - 3} r="3.2" fill="#dcfce7" />
        <circle cx="209" cy={olhoY} r="9.5" fill="var(--primary)" />
        <circle cx="205.5" cy={olhoY - 3} r="3.2" fill="#dcfce7" />
  
        {/* boca */}
        <path d={boca} stroke="var(--primary)" strokeWidth="3.2" fill="none" strokeLinecap="round" />
  
        {/* pescoço */}
        <rect x="178" y="152" width="24" height="16" rx="6" fill="#3f3f46" />
  
        {/* tronco */}
        <rect x="140" y="166" width="100" height="104" rx="30" fill={`url(#${uid}-metalClaro)`} />
        <rect x="145" y="171" width="90" height="94" rx="26" fill={`url(#${uid}-metal)`} />
        <rect x="145" y="171" width="90" height="94" rx="26" fill={`url(#${uid}-brilho)`} />
  
        {/* velocímetro no peito */}
        <circle cx="190" cy="208" r="29" fill="#18181b" />
        <circle cx="190" cy="208" r="24" fill="#27272a" />
        <path
          d="M170 215 A20 20 0 0 1 210 215"
          stroke="var(--primary)"
          strokeWidth="5"
          fill="none"
          strokeLinecap="round"
        />
        <line x1="190" y1="208" x2="201" y2="199" stroke="#ffffff" strokeWidth="3.2" strokeLinecap="round" />
        <circle cx="190" cy="208" r="4" fill="#ffffff" />
  
        {/* detalhe do tronco */}
        <rect x="174" y="245" width="32" height="7" rx="3.5" fill="var(--primary)" opacity="0.5" />
  
        {/* ===== BRAÇOS POR POSE ===== */}
  
        {pose === "joinha" && (
          <>
            <rect x="118" y="176" width="26" height="40" rx="13" fill={`url(#${uid}-metal)`} transform="rotate(-32 131 196)" />
            <circle cx="112" cy="156" r="17" fill={`url(#${uid}-metalClaro)`} />
            <rect x="107" y="130" width="11" height="24" rx="5.5" fill={`url(#${uid}-metalClaro)`} />
            <circle cx="112" cy="158" r="7" fill="var(--primary)" opacity="0.35" />
            <rect x="236" y="176" width="26" height="64" rx="13" fill={`url(#${uid}-metal)`} />
            <circle cx="249" cy="248" r="16" fill={`url(#${uid}-metalClaro)`} />
            <circle cx="249" cy="248" r="7" fill="var(--primary)" opacity="0.3" />
          </>
        )}
  
        {pose === "ok" && (
          <>
            <rect x="118" y="176" width="26" height="42" rx="13" fill={`url(#${uid}-metal)`} transform="rotate(-24 131 197)" />
            <circle cx="115" cy="158" r="17" fill={`url(#${uid}-metalClaro)`} />
            <circle cx="113" cy="155" r="8.5" fill="none" stroke="var(--primary)" strokeWidth="3.4" />
            <rect x="121" y="138" width="7" height="15" rx="3.5" fill={`url(#${uid}-metalClaro)`} transform="rotate(16 124 145)" />
            <rect x="129" y="141" width="7" height="13" rx="3.5" fill={`url(#${uid}-metalClaro)`} transform="rotate(24 132 147)" />
            <rect x="236" y="176" width="26" height="64" rx="13" fill={`url(#${uid}-metal)`} />
            <circle cx="249" cy="248" r="16" fill={`url(#${uid}-metalClaro)`} />
            <circle cx="249" cy="248" r="7" fill="var(--primary)" opacity="0.3" />
          </>
        )}
  
        {pose === "alerta" && (
          <>
            <rect x="122" y="138" width="26" height="52" rx="13" fill={`url(#${uid}-metal)`} transform="rotate(34 135 164)" />
            <circle cx="150" cy="116" r="17" fill={`url(#${uid}-metalClaro)`} />
            <circle cx="150" cy="116" r="7" fill="#ef4444" opacity="0.35" />
            <rect x="232" y="138" width="26" height="52" rx="13" fill={`url(#${uid}-metal)`} transform="rotate(-34 245 164)" />
            <circle cx="230" cy="116" r="17" fill={`url(#${uid}-metalClaro)`} />
            <circle cx="230" cy="116" r="7" fill="#ef4444" opacity="0.35" />
            <path d="M244 88 Q248 96 244 99 Q240 96 244 88 Z" fill="#60a5fa" opacity="0.75" />
          </>
        )}
  
        {/* pose amigável: aceno com a mão aberta */}
        {pose === "amigavel" && (
          <>
            <rect x="120" y="168" width="26" height="48" rx="13" fill={`url(#${uid}-metal)`} transform="rotate(-40 133 192)" />
            <circle cx="106" cy="146" r="18" fill={`url(#${uid}-metalClaro)`} />
            <rect x="96" y="120" width="8" height="20" rx="4" fill={`url(#${uid}-metalClaro)`} transform="rotate(-14 100 130)" />
            <rect x="105" y="116" width="8" height="24" rx="4" fill={`url(#${uid}-metalClaro)`} />
            <rect x="114" y="120" width="8" height="20" rx="4" fill={`url(#${uid}-metalClaro)`} transform="rotate(14 118 130)" />
            <circle cx="106" cy="148" r="7" fill="var(--primary)" opacity="0.35" />
            <rect x="236" y="176" width="26" height="64" rx="13" fill={`url(#${uid}-metal)`} />
            <circle cx="249" cy="248" r="16" fill={`url(#${uid}-metalClaro)`} />
            <circle cx="249" cy="248" r="7" fill="var(--primary)" opacity="0.3" />
          </>
        )}
  
        {pose === "neutro" && (
          <>
            <rect x="118" y="176" width="26" height="64" rx="13" fill={`url(#${uid}-metal)`} />
            <circle cx="131" cy="248" r="16" fill={`url(#${uid}-metalClaro)`} />
            <circle cx="131" cy="248" r="7" fill="var(--primary)" opacity="0.3" />
            <rect x="236" y="176" width="26" height="64" rx="13" fill={`url(#${uid}-metal)`} />
            <circle cx="249" cy="248" r="16" fill={`url(#${uid}-metalClaro)`} />
            <circle cx="249" cy="248" r="7" fill="var(--primary)" opacity="0.3" />
          </>
        )}
  
        {/* pernas */}
        <rect x="156" y="270" width="28" height="46" rx="13" fill={`url(#${uid}-metal)`} />
        <rect x="196" y="270" width="28" height="46" rx="13" fill={`url(#${uid}-metal)`} />
        <ellipse cx="170" cy="322" rx="21" ry="11" fill={`url(#${uid}-metalClaro)`} />
        <ellipse cx="210" cy="322" rx="21" ry="11" fill={`url(#${uid}-metalClaro)`} />
      </svg>
    );
  }