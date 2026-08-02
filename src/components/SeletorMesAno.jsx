import { useState, useEffect } from "react";
import { Gauge, X } from "lucide-react";

const MESES_CURTO = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

/**
 * SeletorMesAno — grid de pills para escolher mês (e opcionalmente ano).
 *
 * Props:
 * - aberto, onFechar
 * - mes, ano
 * - comAno: mostra faixa de anos (padrão true)
 * - maxHoje: bloqueia meses futuros do ano corrente (padrão true)
 * - titulo
 * - onSelecionar(mes, ano)
 */
export default function SeletorMesAno({
  aberto,
  onFechar,
  mes,
  ano,
  comAno = true,
  maxHoje = true,
  titulo = "Escolha o período",
  onSelecionar,
}) {
  const hoje = new Date();
  const anoAtual = hoje.getFullYear();
  const mesAtual = hoje.getMonth() + 1;

  const [mesSel, setMesSel] = useState(mes || null);
  const [anoSel, setAnoSel] = useState(ano || anoAtual);

  useEffect(() => {
    if (aberto) {
      setMesSel(mes || null);
      setAnoSel(ano || anoAtual);
    }
  }, [aberto, mes, ano, anoAtual]);

  if (!aberto) return null;

  const anos = [];
  for (let a = anoAtual; a >= anoAtual - 25; a--) anos.push(a);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.72)" }}
      onClick={onFechar}
    >
      <div
        className="w-full max-w-sm overflow-hidden"
        style={{
          backgroundColor: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 24,
          boxShadow: "0 20px 50px rgba(0,0,0,0.45)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-4 pb-1">
          <div className="flex items-center gap-2">
            <Gauge size={20} style={{ color: "var(--primary)" }} strokeWidth={2.2} />
            <span className="font-bold text-sm" style={{ color: "var(--text)" }}>
              {titulo}
            </span>
          </div>
          <button
            onClick={onFechar}
            aria-label="Fechar"
            className="w-8 h-8 rounded-full flex items-center justify-center active:opacity-70"
            style={{ backgroundColor: "var(--field)" }}
          >
            <X size={15} style={{ color: "var(--text-secondary)" }} />
          </button>
        </div>

        <div className="px-5 pt-2">
          <p className="text-xs mb-2" style={{ color: "var(--text-secondary)" }}>
            Mês
          </p>
          <div className="grid grid-cols-4 gap-2">
            {MESES_CURTO.map((m, i) => {
              const num = i + 1;
              const ativo = mesSel === num;
              const bloqueado = maxHoje && anoSel === anoAtual && num > mesAtual;
              return (
                <button
                  key={m}
                  disabled={bloqueado}
                  onClick={() => setMesSel(num)}
                  className="py-2.5 rounded-xl text-[13px] transition active:scale-95 disabled:opacity-25"
                  style={{
                    backgroundColor: ativo ? "var(--primary)" : "var(--field)",
                    color: ativo ? "var(--primary-contrast)" : "var(--text)",
                    fontWeight: ativo ? 700 : 400,
                  }}
                >
                  {m}
                </button>
              );
            })}
          </div>
        </div>

        {comAno && (
          <div className="px-5 pt-4">
            <p className="text-xs mb-2" style={{ color: "var(--text-secondary)" }}>
              Ano
            </p>
            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
              {anos.map((a) => {
                const ativo = anoSel === a;
                return (
                  <button
                    key={a}
                    onClick={() => {
                      setAnoSel(a);
                      if (maxHoje && a === anoAtual && mesSel && mesSel > mesAtual) {
                        setMesSel(mesAtual);
                      }
                    }}
                    className="px-4 py-2.5 rounded-xl text-[13px] shrink-0 transition active:scale-95"
                    style={{
                      backgroundColor: ativo ? "var(--primary)" : "var(--field)",
                      color: ativo ? "var(--primary-contrast)" : "var(--text)",
                      fontWeight: ativo ? 700 : 400,
                    }}
                  >
                    {a}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="px-4 pt-4 pb-4 flex gap-2">
          <button
            onClick={onFechar}
            className="flex-1 py-3 rounded-xl font-semibold text-sm"
            style={{ backgroundColor: "var(--field)", color: "var(--text)" }}
          >
            Cancelar
          </button>
          <button
            onClick={() => mesSel && onSelecionar?.(mesSel, anoSel)}
            disabled={!mesSel}
            className="flex-1 py-3 rounded-xl font-semibold text-sm disabled:opacity-40"
            style={{
              backgroundColor: "var(--primary)",
              color: "var(--primary-contrast)",
            }}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
