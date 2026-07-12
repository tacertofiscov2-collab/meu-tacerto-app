import { ArrowLeft, Gauge } from "lucide-react";

export function AuthHeader() {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-2">
        <Gauge size={32} className="text-green-600" strokeWidth={2.5} />
        <span className="text-4xl font-bold text-gray-800">
          Ta<span className="text-green-600">Certo!</span>
        </span>
      </div>
      <p className="text-xs text-gray-500 mt-1">Educação fiscal para seu MEI</p>
    </div>
  );
}

export function BackArrow({ onClick }) {
  if (!onClick) return null;
  return (
    <button
      onClick={onClick}
      aria-label="Voltar"
      className="fixed top-4 left-4 z-20 p-2 text-green-600 hover:text-green-700 transition-colors"
    >
      <ArrowLeft size={24} strokeWidth={2} />
    </button>
  );
}

/**
 * Standardized auth/onboarding layout.
 * - Fixed viewport, no scroll.
 * - Back arrow fixed at top-left of the viewport.
 * - Logo + subtitle header pinned above the card in the same position on every screen.
 * - White card with identical width / padding / radius / shadow.
 */
export function AuthLayout({ onBack, children, topSlot }) {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-green-50 to-white flex flex-col items-center px-4 pt-14 pb-6">
      <BackArrow onClick={onBack} />
      <AuthHeader />
      {topSlot && <div className="w-full max-w-md mt-4">{topSlot}</div>}
      <div className="w-full max-w-md mt-6 flex items-start justify-center">
        <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
