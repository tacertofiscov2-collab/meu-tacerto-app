/**
 * Fisco — mascote robô do TaCerto!
 * Assistente fiscal com IA.
 *
 * Props:
 * - size: largura em px (altura proporcional). Padrão 64.
 * - className / style: repasse opcional.
 */
export default function Fisco({ size = 64, className = "", style }) {
    const altura = (size / 380) * 340;
    return (
      <svg
        width={size}
        height={altura}
        viewBox="0 0 380 340"
        role="img"
        aria-label="Fisco, seu amigo fiscal"
        className={className}
        style={style}
        xmlns="http://www.w3.org/2000/svg"
      >
        <ellipse cx="190" cy="312" rx="72" ry="9" fill="var(--primary)" opacity="0.13" />
  
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
        <path d="M178 116 Q190 124 202 116" stroke="var(--primary)" strokeWidth="3" fill="none" strokeLinecap="round" />
  
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
  
        <rect x="118" y="166" width="26" height="62" rx="13" fill="var(--border)" />
        <circle cx="131" cy="236" r="14" fill="#52525b" />
        <circle cx="131" cy="236" r="8" fill="var(--primary)" opacity="0.35" />
  
        <rect x="236" y="166" width="26" height="62" rx="13" fill="var(--border)" />
        <circle cx="249" cy="236" r="14" fill="#52525b" />
        <circle cx="249" cy="236" r="8" fill="var(--primary)" opacity="0.35" />
  
        <rect x="158" y="252" width="26" height="42" rx="12" fill="var(--border)" />
        <rect x="196" y="252" width="26" height="42" rx="12" fill="var(--border)" />
        <ellipse cx="171" cy="298" rx="19" ry="10" fill="#52525b" />
        <ellipse cx="209" cy="298" rx="19" ry="10" fill="#52525b" />
      </svg>
    );
  }