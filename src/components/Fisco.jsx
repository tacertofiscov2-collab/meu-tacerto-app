/**
 * Fisco — mascote robô do TaCerto!
 *
 * O balão fica ACIMA da cabeça. O filtro de blur usa uma área bem
 * folgada (filterUnits em userSpaceOnUse com caixa explícita), senão
 * o navegador corta o desfoque nas bordas.
 *
 * Props:
 * - size: LARGURA em px. Padrão 64.
 * - pose: "joinha" | "ok" | "alerta" | "neutro" | "amigavel".
 * - fala: palavra da situação. Sem ela, não desenha balão.
 * - corBalao: cor do SOMBREADO do balão (a palavra é sempre branca).
 * - apenasCabeca: renderiza só a cabeça (avatar do chat).
 */
export default function Fisco({
    size = 64,
    pose = "neutro",
    fala,
    corBalao = "#22c55e",
    apenasCabeca = false,
    className = "",
    style,
  }) {
    const uid = `fisco-${pose}-${apenasCabeca ? "h" : "f"}-${fala ? "b" : "n"}`;
  
    const temFala = Boolean(fala);
  
    // Balão acima da cabeça
    const textoLen = String(fala || "").length;
    const rxBalao = Math.max(86, textoLen * 10.5 + 38);
    const cxBalao = 200;
    const cyBalao = -62;
    const ryBalao = 42;
  
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
  
        {/* Filtro com caixa EXPLÍCITA em coordenadas do desenho.
            Sem isso o Safari corta o blur nas bordas. */}
        <filter
          id={`${uid}-glow`}
          filterUnits="userSpaceOnUse"
          x={cxBalao - rxBalao - 80}
          y={cyBalao - ryBalao - 80}
          width={rxBalao * 2 + 160}
          height={ryBalao * 2 + 160}
        >
          <feGaussianBlur stdDeviation="13" />
        </filter>
  
        <filter
          id={`${uid}-glowBolha`}
          filterUnits="userSpaceOnUse"
          x="150"
          y="-40"
          width="140"
          height="140"
        >
          <feGaussianBlur stdDeviation="3.5" />
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
  
    /* Com balão o viewBox cresce para cima E nas laterais, pra caber
       o desfoque inteiro sem corte. A largura visual do robô continua
       proporcional porque `size` referencia a largura TOTAL. */
    const margemLateral = temFala ? Math.max(0, rxBalao - 150) : 0;
    const vbX = temFala ? -margemLateral : 0;
    const vbY = temFala ? -130 : 0;
    const vbW = temFala ? 380 + margemLateral * 2 : 380;
    const vbH = temFala ? 510 : 380;
  
    const alturaProp = (size / vbW) * vbH;
  
    return (
      <svg
        width={size}
        height={alturaProp}
        viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`}
        role="img"
        aria-label={fala ? `Fisco diz: ${fala}` : "Fisco, seu amigo fiscal"}
        className={className}
        style={{ display: "block", overflow: "visible", ...style }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>{defs}</defs>
  
        {/* ===== BALÃO: sombreado colorido + palavra BRANCA ===== */}
        {temFala && (
          <g>
            {/* bolhas subindo da cabeça até o balão */}
            <circle
              cx="212" cy="34" r="7"
              fill={corBalao} opacity="0.5"
              filter={`url(#${uid}-glowBolha)`}
            />
            <circle
              cx="224" cy="8" r="10"
              fill={corBalao} opacity="0.55"
              filter={`url(#${uid}-glowBolha)`}
            />
  
            {/* sombreado do balão */}
            <ellipse
              cx={cxBalao} cy={cyBalao}
              rx={rxBalao} ry={ryBalao}
              fill={corBalao} opacity="0.55"
              filter={`url(#${uid}-glow)`}
            />
            <ellipse
              cx={cxBalao} cy={cyBalao}
              rx={rxBalao * 0.84} ry={ryBalao * 0.8}
              fill={corBalao} opacity="0.32"
              filter={`url(#${uid}-glow)`}
            />
  
            <text
              x={cxBalao}
              y={cyBalao + 13}
              textAnchor="middle"
              fill="#ffffff"
              style={{
                fontSize: 36,
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
  
        {/* Faixa VERDE — mão aberta acenando (4 dedos, sem ambiguidade) */}
        {pose === "joinha" && (
          <>
            <rect x="120" y="170" width="26" height="46" rx="13" fill={`url(#${uid}-metal)`} transform="rotate(-38 133 193)" />
            <circle cx="108" cy="148" r="18" fill={`url(#${uid}-metalClaro)`} />
            <rect x="93" y="124" width="8" height="20" rx="4" fill={`url(#${uid}-metalClaro)`} transform="rotate(-20 97 134)" />
            <rect x="102" y="118" width="8" height="24" rx="4" fill={`url(#${uid}-metalClaro)`} transform="rotate(-7 106 130)" />
            <rect x="111" y="118" width="8" height="24" rx="4" fill={`url(#${uid}-metalClaro)`} transform="rotate(7 115 130)" />
            <rect x="120" y="124" width="8" height="20" rx="4" fill={`url(#${uid}-metalClaro)`} transform="rotate(20 124 134)" />
            <circle cx="108" cy="150" r="7" fill="var(--primary)" opacity="0.35" />
            <rect x="236" y="176" width="26" height="64" rx="13" fill={`url(#${uid}-metal)`} />
            <circle cx="249" cy="248" r="16" fill={`url(#${uid}-metalClaro)`} />
            <circle cx="249" cy="248" r="7" fill="var(--primary)" opacity="0.3" />
          </>
        )}
  
        {/* Faixa AMARELA — sem gesto, braços neutros */}
        {pose === "ok" && (
          <>
            <rect x="118" y="176" width="26" height="64" rx="13" fill={`url(#${uid}-metal)`} />
            <circle cx="131" cy="248" r="16" fill={`url(#${uid}-metalClaro)`} />
            <circle cx="131" cy="248" r="7" fill="var(--primary)" opacity="0.3" />
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
