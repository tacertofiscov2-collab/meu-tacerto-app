import { useState } from "react";
import { Mail, Smartphone } from "lucide-react";

export function formatPhoneBR(v) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/**
 * Tabs "E-mail" / "Celular" + matching input.
 * Controlled: parent stores `value` (email or raw phone digits) and `mode`.
 */
export default function EmailPhoneTabs({
  mode,
  onModeChange,
  email,
  onEmailChange,
  phone,
  onPhoneChange,
  emailPlaceholder = "seu@email.com",
}) {
  const [internalMode, setInternalMode] = useState("email");
  const m = mode ?? internalMode;
  const setM = onModeChange ?? setInternalMode;

  return (
    <div>
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-3">
        <button
          type="button"
          onClick={() => setM("email")}
          className={`flex-1 py-2 rounded-lg text-xs font-medium inline-flex items-center justify-center gap-1.5 transition ${
            m === "email" ? "bg-white text-green-700 shadow-sm" : "text-gray-500"
          }`}
        >
          <Mail size={14} strokeWidth={2} /> E-mail
        </button>
        <button
          type="button"
          onClick={() => setM("phone")}
          className={`flex-1 py-2 rounded-lg text-xs font-medium inline-flex items-center justify-center gap-1.5 transition ${
            m === "phone" ? "bg-white text-green-700 shadow-sm" : "text-gray-500"
          }`}
        >
          <Smartphone size={14} strokeWidth={2} /> Celular
        </button>
      </div>

      {m === "email" ? (
        <input
          type="email"
          placeholder={emailPlaceholder}
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 transition"
        />
      ) : (
        <div className="flex items-stretch rounded-xl border border-gray-200 focus-within:ring-2 focus-within:ring-green-300 transition overflow-hidden">
          <span className="px-3 flex items-center bg-gray-50 text-gray-500 text-sm border-r border-gray-200">
            +55
          </span>
          <input
            type="tel"
            inputMode="numeric"
            placeholder="(00) 00000-0000"
            value={formatPhoneBR(phone || "")}
            onChange={(e) => onPhoneChange(e.target.value.replace(/\D/g, "").slice(0, 11))}
            className="flex-1 px-3 py-3 text-sm focus:outline-none"
          />
        </div>
      )}
    </div>
  );
}
