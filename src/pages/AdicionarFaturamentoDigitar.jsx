import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAppState } from "@/context/AppStateContext";
import Valor from "../components/Valor.jsx";

const MAX_CENTAVOS = 9999999999; // até R$ 99.999.999,99
const DESC_FATURAMENTO_INICIAL = "Faturamento inicial do ano";

function formatBRLFromCentavos(centavos) {
  const reais = Math.floor(centavos / 100);
  const cents = centavos % 100;
  return `${reais.toLocaleString("pt-BR")},${String(cents).padStart(2, "0")}`;
}

export default function AdicionarFaturamentoDigitar() {
  const navigate = useNavigate();
  const {
    lancamentos,
    adicionarLancamento,
    atualizarLancamento,
    setModoSimulacao,
  } = useAppState();

  const [centavos, setCentavos] = useState(0);
  const [confirmarSubst, setConfirmarSubst] = useState(false);

  const existente = useMemo(
    () => lancamentos.find((l) => l.descricao === DESC_FATURAMENTO_INICIAL),
    [lancamentos],
  );

  const valorFmt = useMemo(() => formatBRLFromCentavos(centavos), [centavos]);
  const digitando = centavos > 0;

  function handleValor(e) {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 12);
    const n = digits ? parseInt(digits, 10) : 0;
    setCentavos(Math.min(n, MAX_CENTAVOS));
  }

  function persistir() {
    setModoSimulacao(false);
    const valor = centavos / 100;
    const data = new Date().toISOString();
    if (existente) {
      atualizarLancamento(existente.id, { valor, data });
    } else {
      adicionarLancamento({
        descricao: DESC_FATURAMENTO_INICIAL,
        valor,
        data,
      });
    }
    navigate("/dashboard");
  }

  function handleSalvar() {
    if (centavos <= 0) return;
    if (existente) {
      setConfirmarSubst(true);
      return;
    }
    persistir();
  }

  const fieldStyle = {
    backgroundColor: "var(--field)",
    border: "1px solid var(--border)",
    color: "var(--text)",
  };

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
          Digitar total
        </h1>
      </header>

      <div className="flex-1 overflow-y-auto px-5 pb-32">
        <div className="max-w-md mx-auto mt-4 space-y-4">
          <label className="block text-sm" style={{ color: "var(--text)" }}>
            Valor total faturado este ano
          </label>
          <div
            className="flex items-center rounded-xl overflow-hidden"
            style={fieldStyle}
          >
            <span
              className="pl-4 pr-2 text-2xl font-bold"
              style={{ color: "var(--text)" }}
            >
              R$
            </span>
            <input
              type="text"
              inputMode="numeric"
              value={digitando ? valorFmt : ""}
              onChange={handleValor}
              placeholder="0,00"
              className="flex-1 bg-transparent py-4 pr-4 text-3xl font-bold focus:outline-none placeholder:opacity-40"
              style={{ color: "var(--text)" }}
            />
          </div>
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
            Este valor será somado ao seu faturamento atual e refletido no
            velocímetro.
          </p>
        </div>
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
            onClick={handleSalvar}
            disabled={centavos <= 0}
            className="w-full py-3.5 rounded-xl font-semibold text-sm disabled:opacity-40"
            style={{
              backgroundColor: "var(--primary)",
              color: "var(--primary-contrast)",
            }}
          >
            Salvar
          </button>
        </div>
      </div>

      {confirmarSubst && existente && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
          onClick={() => setConfirmarSubst(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl p-5 space-y-4"
            style={{
              backgroundColor: "var(--surface)",
              border: "1px solid var(--border)",
            }}
          >
            <h3 className="text-base font-bold" style={{ color: "var(--text)" }}>
              Substituir faturamento inicial?
            </h3>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Você já registrou faturamento inicial de{" "}
              <Valor tamanho="sm">{existente.valor}</Valor>. Deseja substituir?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmarSubst(false)}
                className="flex-1 py-3 rounded-xl font-semibold text-sm"
                style={{ backgroundColor: "var(--field)", color: "var(--text)" }}
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setConfirmarSubst(false);
                  persistir();
                }}
                className="flex-1 py-3 rounded-xl font-semibold text-sm"
                style={{
                  backgroundColor: "var(--primary)",
                  color: "var(--primary-contrast)",
                }}
              >
                Substituir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}






