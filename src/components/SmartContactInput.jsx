import { formatPhoneBR } from "@/components/EmailPhoneTabs";

/**
 * Unified smart input that auto-detects email vs phone.
 * - If value contains "@" or any letter -> email mode (no mask).
 * - Otherwise -> phone mode with BR mask (00) 00000-0000, prefixed with +55.
 *
 * Controlled: parent holds a single `value` string and receives `onChange(rawValue, mode)`.
 */
export function detectMode(v) {
  if (!v) return "phone";
  if (/[@a-zA-Z]/.test(v)) return "email";
  return "phone";
}

export default function SmartContactInput({
  value,
  onChange,
  placeholder = "Digite seu e-mail ou telefone",
}) {
  const mode = detectMode(value);

  function handleChange(e) {
    const raw = e.target.value;
    const m = detectMode(raw);
    if (m === "phone") {
      const digits = raw.replace(/\D/g, "").slice(0, 11);
      onChange(digits, "phone");
    } else {
      onChange(raw.trim(), "email");
    }
  }

  const display = mode === "phone" ? formatPhoneBR(value || "") : value || "";

  return (
    <div className="flex items-stretch rounded-xl border border-gray-200 focus-within:ring-2 focus-within:ring-green-300 transition overflow-hidden">
      {mode === "phone" && value && (
        <span className="px-3 flex items-center bg-gray-50 text-gray-500 text-sm border-r border-gray-200">
          +55
        </span>
      )}
      <input
        type="text"
        inputMode={mode === "phone" ? "numeric" : "email"}
        autoComplete={mode === "phone" ? "tel" : "email"}
        placeholder={placeholder}
        value={display}
        onChange={handleChange}
        className="flex-1 px-4 py-3 text-sm focus:outline-none"
      />
    </div>
  );
}
