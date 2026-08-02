import { Gauge } from "lucide-react";

export function TaCertoLogo({ size = "default", showText = true }) {
  const dims = {
    small: { icon: 22, text: "text-xl" },
    default: { icon: 30, text: "text-3xl" },
    large: { icon: 56, text: "text-5xl" },
  };
  const d = dims[size];
  return (
    <div className="flex items-center justify-center gap-2">
      <Gauge size={d.icon} style={{ color: "var(--primary)" }} strokeWidth={2.5} />
      {showText && (
        <span className={`${d.text} font-bold`} style={{ color: "var(--text)" }}>
          Ta<span style={{ color: "var(--primary)" }}>Certo!</span>
        </span>
      )}
    </div>
  );
}

export function BackButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="mb-4 transition-colors"
      style={{ color: "var(--primary)" }}
      aria-label="Voltar"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 12H5M12 19l-7-7 7-7" />
      </svg>
    </button>
  );
}

