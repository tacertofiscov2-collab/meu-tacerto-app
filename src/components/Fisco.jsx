/**
 * Fisco — mascote robô do TaCerto!
 *
 * Props:
 * - size: largura em px. Padrão 64.
 * - pose: "joinha" | "ok" | "alerta" | "neutro".
 * - fala: texto do balão. Se ausente, não desenha balão.
 * - corFala: cor do texto e da borda do balão.
 */
export default function Fisco({
    size = 64,
    pose = "neutro",
    fala,
    corFala = "var(--primary)",
    className = "",
    style,
  }) {
    const uid = `fisco-${pose}`;
    // Com balão o viewBox cresce no topo pra caber a fala sem cortar o robô.
    const temFala = Boolean(fala);
    const viewBox = temFala ? "0 0 380 470" : "0 0 380 380";
    const alturaProp = temFala ? (size / 380) * 470 : size;
    const dy = temFala ? 90 : 0; // desloca o robô pra baixo quando há balão
  
    const olhoY = (pose === "alerta" ? 104 : 103) + dy;
    const boca =
      pose === "alerta"
        ? `M176 ${124 + dy} Q190 ${113 + dy} 204 ${124 + dy}`
        : pose === "ok"
          ? `M180 ${118 + dy} L200 ${118 + dy}`
          : `M177 ${116 + dy} Q190 ${126 + dy} 203 ${116 + dy}`;
  
    // Largura do balão proporcional ao tamanho do texto
    const larguraBalao = Math.min(300, Math.max(120, (fala?.length || 0) * 15 + 46));
    const xBalao = 190 - larguraBalao / 2;
  
    return (
      <svg
        width={size}
        height={alturaProp}
        viewBox={viewBox}
        role="img"
        aria-label={fala ? `Fisco diz: ${fala}` : "Fisco, seu amigo fiscal"}
        className={className}
        style={style}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
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
        </defs>
  
        {/* ===== BALÃO DE FALA ===== */}
        {temFala && (
          <g>
            <rect
              x={xBalao}
              y="8"
              width={larguraBalao}
              height="58"
              rx="26"
              fill="var(--surface)"
              stroke={corFala}
              strokeWidth="2.5"
            />
            {/* rabicho apontando pra cabeça */}
            <path
              d="M172 64 L186 84 L196 64 Z"
              fill="var(--surface)"
              stroke={corFala}
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            <path d="M174 64 L194 64" stroke="var(--surface)" strokeWidth="4" />
            <text
              x="190"
              y="45"
              textAnchor="middle"
              fill={corFala}
              style={{ fontSize: 26, fontWeight: 700, fontFamily: "inherit" }}
            >
              {fala}
            </text>
          </g>
        )}
  
        {/* sombra no chão */}
        <ellipse cx="190" cy={348 + dy} rx="74" ry="10" fill="var(--primary)" opacity="0.12" />
  
        {/* antena */}
        <line x1="190" y1={66 + dy} x2="190" y2={46 + dy} stroke="#52525b" strokeWidth="5" strokeLinecap="round" />
        <circle cx="190" cy={40 + dy} r="10" fill="var(--primary)" />
        <circle cx="186.5" cy={36.5 + dy} r="3.5" fill="#bbf7d0" />
  
        {/* orelhas */}
        <rect x="120" y={96 + dy} width="14" height="30" rx="7" fill={`url(#${uid}-metal)`} />
        <rect x="246" y={96 + dy} width="14" height="30" rx="7" fill={`url(#${uid}-metal)`} />
        <circle cx="127" cy={111 + dy} r="3.5" fill="var(--primary)" opacity="0.6" />
        <circle cx="253" cy={111 + dy} r="3.5" fill="var(--primary)" opacity="0.6" />
  
        {/* cabeça */}
        <rect x="132" y={64 + dy} width="116" height="90" rx="30" fill={`url(#${uid}-metalClaro)`} />
        <rect x="137" y={69 + dy} width="106" height="80" rx="26" fill={`url(#${uid}-metal)`} />
        <rect x="137" y={69 + dy} width="106" height="80" rx="26" fill={`url(#${uid}-brilho)`} />
  
        {/* visor */}
        <rect x="149" y={84 + dy} width="82" height="50" rx="20" fill={`url(#${uid}-visor)`} />
        <rect x="153" y={88 + dy} width="74" height="20" rx="10" fill="#ffffff" opacity="0.05" />
  
        {/* olhos */}
        <circle cx="171" cy={olhoY} r="9.5" fill="var(--primary)" />
        <circle cx="167.5" cy={olhoY - 3} r="3.2" fill="#dcfce7" />
        <circle cx="209" cy={olhoY} r="9.5" fill="var(--primary)" />
        <circle cx="205.5" cy={olhoY - 3} r="3.2" fill="#dcfce7" />
  
        {/* boca */}
        <path d={boca} stroke="var(--primary)" strokeWidth="3.2" fill="none" strokeLinecap="round" />
  
        {/* pescoço */}
        <rect x="178" y={152 + dy} width="24" height="16" rx="6" fill="#3f3f46" />
  
        {/* tronco */}
        <rect x="140" y={166 + dy} width="100" height="104" rx="30" fill={`url(#${uid}-metalClaro)`} />
        <rect x="145" y={171 + dy} width="90" height="94" rx="26" fill={`url(#${uid}-metal)`} />
        <rect x="145" y={171 + dy} width="90" height="94" rx="26" fill={`url(#${uid}-brilho)`} />
  
        {/* velocímetro no peito */}
        <circle cx="190" cy={208 + dy} r="29" fill="#18181b" />
        <circle cx="190" cy={208 + dy} r="24" fill="#27272a" />
        <path
          d={`M170 ${215 + dy} A20 20 0 0 1 210 ${215 + dy}`}
          stroke="var(--primary)"
          strokeWidth="5"
          fill="none"
          strokeLinecap="round"
        />
        <line x1="190" y1={208 + dy} x2="201" y2={199 + dy} stroke="#ffffff" strokeWidth="3.2" strokeLinecap="round" />
        <circle cx="190" cy={208 + dy} r="4" fill="#ffffff" />
  
        {/* detalhe do tronco */}
        <rect x="174" y={245 + dy} width="32" height="7" rx="3.5" fill="var(--primary)" opacity="0.5" />
  
        {/* ===== BRAÇOS POR POSE ===== */}
  
        {pose === "joinha" && (
          <>
            <rect x="118" y={176 + dy} width="26" height="40" rx="13" fill={`url(#${uid}-metal)`} transform={`rotate(-32 131 ${196 + dy})`} />
            <circle cx="112" cy={156 + dy} r="17" fill={`url(#${uid}-metalClaro)`} />
            <rect x="107" y={130 + dy} width="11" height="24" rx="5.5" fill={`url(#${uid}-metalClaro)`} />
            <circle cx="112" cy={158 + dy} r="7" fill="var(--primary)" opacity="0.35" />
            <rect x="236" y={176 + dy} width="26" height="64" rx="13" fill={`url(#${uid}-metal)`} />
            <circle cx="249" cy={248 + dy} r="16" fill={`url(#${uid}-metalClaro)`} />
            <circle cx="249" cy={248 + dy} r="7" fill="var(--primary)" opacity="0.3" />
          </>
        )}
  
        {pose === "ok" && (
          <>
            <rect x="118" y={176 + dy} width="26" height="42" rx="13" fill={`url(#${uid}-metal)`} transform={`rotate(-24 131 ${197 + dy})`} />
            <circle cx="115" cy={158 + dy} r="17" fill={`url(#${uid}-metalClaro)`} />
            <circle cx="113" cy={155 + dy} r="8.5" fill="none" stroke="var(--primary)" strokeWidth="3.4" />
            <rect x="121" y={138 + dy} width="7" height="15" rx="3.5" fill={`url(#${uid}-metalClaro)`} transform={`rotate(16 124 ${145 + dy})`} />
            <rect x="129" y={141 + dy} width="7" height="13" rx="3.5" fill={`url(#${uid}-metalClaro)`} transform={`rotate(24 132 ${147 + dy})`} />
            <rect x="236" y={176 + dy} width="26" height="64" rx="13" fill={`url(#${uid}-metal)`} />
            <circle cx="249" cy={248 + dy} r="16" fill={`url(#${uid}-metalClaro)`} />
            <circle cx="249" cy={248 + dy} r="7" fill="var(--primary)" opacity="0.3" />
          </>
        )}
  
        {pose === "alerta" && (
          <>
            <rect x="122" y={138 + dy} width="26" height="52" rx="13" fill={`url(#${uid}-metal)`} transform={`rotate(34 135 ${164 + dy})`} />
            <circle cx="150" cy={116 + dy} r="17" fill={`url(#${uid}-metalClaro)`} />
            <circle cx="150" cy={116 + dy} r="7" fill="#ef4444" opacity="0.35" />
            <rect x="232" y={138 + dy} width="26" height="52" rx="13" fill={`url(#${uid}-metal)`} transform={`rotate(-34 245 ${164 + dy})`} />
            <circle cx="230" cy={116 + dy} r="17" fill={`url(#${uid}-metalClaro)`} />
            <circle cx="230" cy={116 + dy} r="7" fill="#ef4444" opacity="0.35" />
            <path d={`M244 ${88 + dy} Q248 ${96 + dy} 244 ${99 + dy} Q240 ${96 + dy} 244 ${88 + dy} Z`} fill="#60a5fa" opacity="0.75" />
          </>
        )}
  
        {pose === "neutro" && (
          <>
            <rect x="118" y={176 + dy} width="26" height="64" rx="13" fill={`url(#${uid}-metal)`} />
            <circle cx="131" cy={248 + dy} r="16" fill={`url(#${uid}-metalClaro)`} />
            <circle cx="131" cy={248 + dy} r="7" fill="var(--primary)" opacity="0.3" />
            <rect x="236" y={176 + dy} width="26" height="64" rx="13" fill={`url(#${uid}-metal)`} />
            <circle cx="249" cy={248 + dy} r="16" fill={`url(#${uid}-metalClaro)`} />
            <circle cx="249" cy={248 + dy} r="7" fill="var(--primary)" opacity="0.3" />
          </>
        )}
  
        {/* pernas */}
        <rect x="156" y={270 + dy} width="28" height="46" rx="13" fill={`url(#${uid}-metal)`} />
        <rect x="196" y={270 + dy} width="28" height="46" rx="13" fill={`url(#${uid}-metal)`} />
        <ellipse cx="170" cy={322 + dy} rx="21" ry="11" fill={`url(#${uid}-metalClaro)`} />
        <ellipse cx="210" cy={322 + dy} rx="21" ry="11" fill={`url(#${uid}-metalClaro)`} />
      </svg>
    );
  }