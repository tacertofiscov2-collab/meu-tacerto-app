import { useMemo, useState } from "react";
import { X } from "lucide-react";
import Valor from "./Valor.jsx";

/**
 * Modal de faturamento inicial com 2 abas:
 *  - "Digitar total": campo único com máscara BRL
 *  - "Somar valores": textarea, extrai valores positivos e soma
 *
 * onSalvar(valorEmCentavos, totalBRL) — TODO: persistir Supabase
 */
export default function ModalFaturamentoInicial({ aberto, onClose, onSalvar }) {
  const [aba, setAba] = useState("digitar"); // "digitar" | "somar"
  const [valorDigitado, setValorDigitado] = useState(""); // string dígitos = centavos
  const [textoColado, setTextoColado] = useState("");

  if (!aberto) return null;

  // --- máscara BRL a partir de centavos ---
  function formatBRLFromCents(cents) {
    const n = Number(cents || 0) / 100;
    return n.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  function handleDigitar(e) {
    const somenteDigitos = e.target.value.replace(/\D/g, "").slice(0, 12);
    setValorDigitado(somenteDigitos);
  }

  // --- soma automática de valores colados ---
  const { valores, total } = useMemo(() => {
    if (aba !== "somar") return { valores: [], total: 0 };
    const linhas = textoColado.split(/[\n,;]+/);
    const nums = [];
    for (const linha of linhas) {
      const raw = linha.trim();
      if (!raw) continue;
      // ignora saídas explícitas (com sinal negativo, ou palavras como "tarifa"/"pgto")
      if (/^-/.test(raw)) continue;
      if (/tarifa|pagamento|pgto|débito|debito|saída|saida|estorno/i.test(raw)) continue;
      // extrai apenas o primeiro número da linha
      const match = raw.match(/-?\d{1,3}(\.\d{3})*(,\d{1,2})?|-?\d+([.,]\d{1,2})?/);
      if (!match) continue;
      let s = match[0];
      if (s.startsWith("-")) continue;
      // pt-BR: milhar com "." e decimal com ","
      if (s.includes(",")) {
        s = s.replace(/\./g, "").replace(",", ".");
      }
      const n = parseFloat(s);
      if (!isNaN(n) && n > 0) nums.push(n);
    }
    const soma = nums.reduce((a, b) => a + b, 0);
    return { valores: nums, total: soma };
  }, [aba, textoColado]);

  const valorFinal =
    aba === "digitar" ? Number(valorDigitado || 0) / 100 : total;

  const totalFmt = valorFinal.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  function handleSalvar() {
    if (valorFinal <= 0) return;
    // TODO: salvar no Supabase (faturamento_inicial)
    onSalvar?.(valorFinal);
    onClose?.();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-t-3xl sm:rounded-2xl overflow-hidden max-h-[92vh] flex flex-col"
        style={{
          backgroundColor: "var(--surface)",
          border: "1px solid var(--border)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
          <h2 className="text-base font-bold" style={{ color: "var(--text)" }}>
            Adicionar faturamento
          </h2>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="w-8 h-8 rounded-full flex items-center justify-center hover:opacity-80"
            style={{ backgroundColor: "var(--field)" }}
          >
            <X size={16} style={{ color: "var(--text)" }} />
          </button>
        </div>

        {/* Segmented */}
        <div className="px-5 shrink-0">
          <div
            className="flex p-1 rounded-xl"
            style={{ backgroundColor: "var(--field)" }}
          >
            {[
              { id: "digitar", label: "Digitar total" },
              { id: "somar", label: "Somar valores" },
            ].map((t) => {
              const ativo = aba === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setAba(t.id)}
                  className="flex-1 py-2 rounded-lg text-sm font-semibold transition"
                  style={{
                    backgroundColor: ativo ? "var(--primary)" : "transparent",
                    color: ativo ? "var(--primary-contrast)" : "var(--text-secondary)",
                  }}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {aba === "digitar" ? (
            <>
              <p className="text-sm mb-3" style={{ color: "var(--text-secondary)" }}>
                Some tudo que você recebeu de janeiro até agora e digite o total abaixo.
              </p>

              <div
                className="flex items-center gap-2 rounded-xl px-4 py-4"
                style={{
                  backgroundColor: "var(--field)",
                  border: "1px solid var(--border)",
                }}
              >
                <span
                  className="text-2xl font-bold"
                  style={{ color: "var(--text-secondary)" }}
                >
                  R$
                </span>
                <input
                  inputMode="numeric"
                  value={valorDigitado ? formatBRLFromCents(valorDigitado) : ""}
                  onChange={handleDigitar}
                  placeholder="0,00"
                  className="flex-1 bg-transparent outline-none text-2xl font-bold text-right placeholder:opacity-40"
                  style={{ color: "var(--text)" }}
                />
              </div>

              <div
                className="mt-4 rounded-xl p-3 text-xs leading-relaxed"
                style={{
                  backgroundColor: "var(--field)",
                  color: "var(--text-secondary)",
                }}
              >
                <p className="font-semibold mb-1" style={{ color: "var(--text)" }}>
                  Não sabe somar?
                </p>
                Você pode olhar em: extrato da conta, app da maquininha, notas
                fiscais, caderno de anotações.
              </div>
            </>
          ) : (
            <>
              <p className="text-sm mb-3" style={{ color: "var(--text-secondary)" }}>
                Cole aqui os valores que você recebeu (do extrato, da maquininha).
                O app soma tudo pra você.
              </p>

              <textarea
                rows={7}
                value={textoColado}
                onChange={(e) => setTextoColado(e.target.value)}
                placeholder={"Cole os valores aqui, por exemplo:\n1.250,00\n3.400,00\n890,50"}
                className="w-full rounded-xl px-4 py-3 text-sm outline-none placeholder:opacity-50 font-mono"
                style={{
                  backgroundColor: "var(--field)",
                  border: "1px solid var(--border)",
                  color: "var(--text)",
                }}
              />

              <div
                className="mt-3 rounded-xl px-4 py-3 flex items-center justify-between"
                style={{ backgroundColor: "var(--field)" }}
              >
                <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  {valores.length} {valores.length === 1 ? "valor encontrado" : "valores encontrados"}
                </span>
                <span className="text-lg font-bold">
                  <Valor tamanho="md">{valorFinal}</Valor>
                </span>
              </div>

              <p className="text-xs mt-3 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                Pode colar sem medo — calculamos automaticamente e ignoramos as
                saídas (tarifas, pagamentos).
              </p>
            </>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-5 pt-3 pb-5 shrink-0 space-y-3"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <button
            onClick={handleSalvar}
            disabled={valorFinal <= 0}
            className="w-full py-3.5 rounded-xl font-semibold text-sm disabled:opacity-40"
            style={{
              backgroundColor: "var(--primary)",
              color: "var(--primary-contrast)",
            }}
          >
            Salvar <Valor tamanho="sm" style={{ color: "var(--primary-contrast)" }}>{valorFinal}</Valor> e atualizar
          </button>
          <p className="text-[11px] leading-relaxed text-center" style={{ color: "var(--text-secondary)" }}>
            Os valores informados são de sua responsabilidade. O TaCerto! não
            verifica a veracidade dos dados. Você poderá editar isso depois no
            Histórico.
          </p>
        </div>
      </div>
    </div>
  );
}

