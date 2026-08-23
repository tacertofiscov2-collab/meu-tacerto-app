import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const KEY = "tacerto_textos_extratos_pendentes";

function lerArr() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export default function AdicionarFaturamentoColar() {
  const navigate = useNavigate();
  const [texto, setTexto] = useState("");
  const [processado, setProcessado] = useState(false);

  function processar() {
    if (!texto.trim()) return;
    try {
      const atual = lerArr();
      atual.push(texto);
      localStorage.setItem(KEY, JSON.stringify(atual));
    } catch {}
    setProcessado(true);
  }

  return (
    <div
      className="min-h-screen min-h-[100dvh] w-full flex flex-col"
      style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
    >
      <header className="px-5 pt-6 pb-4 flex items-center gap-3 shrink-0">
        <button
          onClick={() => navigate(-1)}
          aria-label="Voltar"
          className="w-10 h-10 rounded-full flex items-center justify-center hover:opacity-80"
          style={{ border: "1px solid var(--border)", backgroundColor: "transparent" }}
        >
          <ArrowLeft size={20} style={{ color: "var(--text)" }} />
        </button>
        <h1
          className="text-lg font-bold flex-1 text-center pr-10"
          style={{ color: "var(--text)" }}
        >
          Colar texto do extrato
        </h1>
      </header>

      <div className="flex-1 overflow-y-auto px-5 pb-32">
        <p
          className="text-sm leading-relaxed mt-2"
          style={{ color: "var(--text-secondary)" }}
        >
          Cole abaixo o texto do seu extrato bancário. Nossa IA identifica as
          entradas automaticamente.
        </p>

        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Cole aqui o texto do seu extrato..."
          className="mt-4 w-full rounded-xl px-4 py-3 text-sm outline-none placeholder:opacity-60"
          style={{
            backgroundColor: "var(--field)",
            border: "1px solid var(--border)",
            color: "var(--text)",
            minHeight: 300,
            resize: "vertical",
          }}
        />
        <p
          className="text-[11px] mt-2 text-right"
          style={{ color: "var(--text-secondary)" }}
        >
          {texto.length} caractere{texto.length === 1 ? "" : "s"}
        </p>
      </div>

      <div
        className="fixed bottom-0 left-0 right-0 px-5 pt-3 pb-5 z-10"
        style={{
          backgroundColor: "var(--bg)",
          borderTop: "1px solid var(--border)",
          paddingBottom: "calc(env(safe-area-inset-bottom) + 1.25rem)",
        }}
      >
        <div className="max-w-md mx-auto">
          <button
            onClick={processar}
            disabled={!texto.trim()}
            className="w-full py-3.5 rounded-xl font-semibold text-sm disabled:opacity-40"
            style={{
              backgroundColor: "var(--primary)",
              color: "var(--primary-contrast)",
            }}
          >
            Processar texto
          </button>
        </div>
      </div>

      {processado && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-5 space-y-4"
            style={{
              backgroundColor: "var(--surface)",
              border: "1px solid var(--border)",
            }}
          >
            <h3 className="text-base font-bold" style={{ color: "var(--text)" }}>
              IA em breve
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              Nossa IA está sendo integrada. Em breve você poderá processar
              extratos automaticamente. Seu texto ficou salvo e será processado
              quando a IA estiver disponível.
            </p>
            <button
              onClick={() => {
                setProcessado(false);
                navigate("/adicionar-faturamento");
              }}
              className="w-full py-3 rounded-xl font-semibold text-sm"
              style={{
                backgroundColor: "var(--primary)",
                color: "var(--primary-contrast)",
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}






