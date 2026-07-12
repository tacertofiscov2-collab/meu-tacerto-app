import { Gauge } from "lucide-react";

export function TaCertoLogo({ size = "default", showText = true }) {
  const dims = {
    small: { icon: 24, text: "text-2xl" },
    default: { icon: 32, text: "text-4xl" },
    large: { icon: 64, text: "text-5xl" },
  };
  const d = dims[size];
  return (
    <div className="flex items-center justify-center gap-2">
      <Gauge size={d.icon} className="text-green-600" strokeWidth={2.5} />
      {showText && (
        <span className={`${d.text} font-bold text-gray-800`}>
          Ta<span className="text-green-600">Certo!</span>
        </span>
      )}
    </div>
  );
}

export function BackButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="mb-4 text-green-600 hover:text-green-700 transition-colors"
      aria-label="Voltar"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 12H5M12 19l-7-7 7-7" />
      </svg>
    </button>
  );
}
