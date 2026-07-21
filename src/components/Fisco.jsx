/**
 * Fisco — mascote robô do TaCerto!
 *
 * Props:
 * - size: largura em px. Padrão 64.
 * - pose: "joinha" | "ok" | "alerta" | "neutro". Padrão "neutro".
 * - animar: boolean — anima na entrada. Padrão false.
 */
export default function Fisco({
    size = 64,
    pose = "neutro",
    animar = false,
    className = "",
    style,
  }) {
    const altura = (size / 380) * 360;
  
    const boca =
      pose === "alerta"
        ? "M178 122 Q190 114 202 122"
        : "M178 116 Q190 124 202 116";
  
    const animBraco = animar
      ? { animation: "fiscoBraco 900ms ease-out 200ms 1" }
      : undefined;
    const animCorpo = animar
      ? { animation: "fiscoCorpo 1000ms ease-out 1" }
      : undefined;
  
    return (
      <svg
        width={size}
        height={altura}
        viewBox="0 0 380 360"
        role="img"
        aria-label="Fisco, seu amigo fiscal"
        className={className}
        style={style}
        xmlns="http://www.w3.org/2000/svg"
      >
        <style>{`
          @keyframes fiscoBraco {
            0% { transform: rotate(0deg); }
            35% { transform: rotate(-14deg); }
            70% { transform: rotate(6deg); }
            100% { transform: rotate(0deg); }
          }
          @keyframes fiscoCorpo {
            0% { transform: translateY(0); }
            40% { transform: translateY(-6px); }
            100% { transform: translateY(0); }
          }
        `}</style>
  
        <g style={animCorpo}>
          <ellipse cx="190" cy="330" rx="72" ry="9" fill="var(--primary)" opacity="0.13" />
  
          <line x1="190" y1="62" x2="190" y2="44" stroke="var(--border)" strokeWidth="4" strokeLinecap="round" />
          <circle cx="190" cy="38" r="9" fill="var(--primary)" />
          <circle cx="187" cy="35" r="3" fill="#86efac" />
  
          <rect x="136" y="60" width="108" height="86" rx="26" fill="var(--border)" />
          <rect x="140" y="64" width="100" height="78" rx="23" fill="#52525b" />
  
          <rect x="151" y="82" width="78" height="44" rx="18" fill="var(--bg)" />
          <circle cx="172" cy="103" r="8.5" fill="var(--primary)" />
          <circle cx="169" cy="100" r="3" fill="#bbf7d0" />
          <circle cx="208" cy="103" r="8.5" fill="var(--primary)" />
          <circle cx="205" cy="100" r="3" fill="#bbf7d0" />
          <path d={boca} stroke="var(--primary)" strokeWidth="3" fill="none" strokeLinecap="round" />
  
          <rect x="124" y="92" width="12" height="26" rx="6" fill="var(--border)" />
          <rect x="244" y="92" width="12" height="26" rx="6" fill="var(--border)" />
  
          <rect x="180" y="144" width="20" height="14" rx="5" fill="var(--border)" />
  
          <rect x="146" y="156" width="88" height="96" rx="26" fill="var(--border)" />
          <rect x="150" y="160" width="80" height="88" rx="23" fill="#52525b" />
  
          <circle cx="190" cy="196" r="26" fill="var(--bg)" />
          <circle cx="190" cy="196" r="21" fill="var(--field)" />
          <path d="M172 202 A21 21 0 0 1 208 202" stroke="var(--primary)" strokeWidth="4.5" fill="none" strokeLinecap="round" />
          <line x1="190" y1="196" x2="200" y2="188" stroke="var(--text)" strokeWidth="3" strokeLinecap="round" />
          <circle cx="190" cy="196" r="3.5" fill="var(--text)" />
  
          <rect x="176" y="228" width="28" height="6" rx="3" fill="var(--primary)" opacity="0.55" />
  
          {pose === "joinha" && (
            <>
              <g style={animBraco} transform="rotate(0 138 172)">
                <rect x="126" y="166" width="24" height="34" rx="12" fill="var(--border)" transform="rotate(-28 138 183)" />
                <circle cx="116" cy="152" r="15" fill="#52525b" />
                <rect x="112" y="130" width="9" height="20" rx="4.5" fill="#52525b" />
                <circle cx="116" cy="152" r="7" fill="var(--primary)" opacity="0.3" />
              </g>
              <rect x="236" y="166" width="24" height="60" rx="12" fill="var(--border)" />
              <circle cx="248" cy="234" r="14" fill="#52525b" />
              <circle cx="248" cy="234" r="7" fill="var(--primary)" opacity="0.3" />
            </>
          )}
  
          {pose === "ok" && (
            <>
              <g style={animBraco} transform="rotate(0 138 172)">
                <rect x="126" y="166" width="24" height="36" rx="12" fill="var(--border)" transform="rotate(-20 138 184)" />
                <circle cx="118" cy="152" r="15" fill="#52525b" />
                <circle cx="118" cy="150" r="7.5" fill="none" stroke="var(--primary)" strokeWidth="3" />
                <rect x="123" y="138" width="7" height="13" rx="3.5" fill="#52525b" transform="rotate(20 126 144)" />
              </g>
              <rect x="236" y="166" width="24" height="60" rx="12" fill="var(--border)" />
              <circle cx="248" cy="234" r="14" fill="#52525b" />
              <circle cx="248" cy="234" r="7" fill="var(--primary)" opacity="0.3" />
            </>
          )}
  
          {pose === "alerta" && (
            <>
              <g style={animBraco} transform="rotate(0 140 170)">
                <rect x="124" y="130" width="24" height="46" rx="12" fill="var(--border)" transform="rotate(28 136 153)" />
                <circle cx="152" cy="112" r="15" fill="#52525b" />
                <circle cx="152" cy="112" r="7" fill="#ef4444" opacity="0.3" />
              </g>
              <g style={animBraco} transform="rotate(0 240 170)">
                <rect x="232" y="130" width="24" height="46" rx="12" fill="var(--border)" transform="rotate(-28 244 153)" />
                <circle cx="228" cy="112" r="15" fill="#52525b" />
                <circle cx="228" cy="112" r="7" fill="#ef4444" opacity="0.3" />
              </g>
            </>
          )}
  
          {pose === "neutro" && (
            <>
              <rect x="120" y="166" width="24" height="60" rx="12" fill="var(--border)" />
              <circle cx="132" cy="234" r="14" fill="#52525b" />
              <circle cx="132" cy="234" r="7" fill="var(--primary)" opacity="0.3" />
              <rect x="236" y="166" width="24" height="60" rx="12" fill="var(--border)" />
              <circle cx="248" cy="234" r="14" fill="#52525b" />
              <circle cx="248" cy="234" r="7" fill="var(--primary)" opacity="0.3" />
            </>
          )}
  
          <rect x="158" y="252" width="26" height="42" rx="12" fill="var(--border)" />
          <rect x="196" y="252" width="26" height="42" rx="12" fill="var(--border)" />
          <ellipse cx="171" cy="298" rx="19" ry="10" fill="#52525b" />
          <ellipse cx="209" cy="298" rx="19" ry="10" fill="#52525b" />
        </g>
      </svg>
    );
  }