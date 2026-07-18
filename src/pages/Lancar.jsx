import { useNavigate, useSearchParams } from "react-router-dom";
import { useState, useMemo, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { useAppState } from "@/context/AppStateContext";

const MAX_CENTAVOS = 99999999; // R$ 999.999,99

function formatBRLFromCentavos(centavos) {
  const reais = Math.floor(centavos / 100);
  const cents = centavos % 100;
  const reaisStr = reais.toLocaleString("pt-BR");
  return `${reaisStr},${String(cents).padStart(2, "0")}`;
}

function hojeISO() {
  const d = new Date();
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60000);
  return local.toISOString().slice(0, 10);
}

function isoToDateInput(iso) {
  try {
    const d = new Date(iso);
    const off = d.getTimezoneOffset();
    const local = new Date(d.getTime() - off * 60000);
    return local.toISOString().slice(0, 10);
  } catch {
    return hojeISO();
  }
}

export default function Lancar() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const editId = params.get("id");
  const {
    lancamentos,
    adicionarLancamento,
    atualizarLancamento,
    setModoSimulacao,
  } = useAppState();

  const lancamentoAtual = useMemo(
    () => (editId ? lancamentos.find((l) => l.id === editId) : null),
    [editId, lancamentos],
  );
  const modoEdicao = Boolean(lancamentoAtual);

  const [centavos, setCentavos] = useState(0);
  const [descricao, setDescricao] = useState("");
  const [data, setData] = useState(hojeISO());
  const [salvando, setSalvando] = useState(false);
  const [preenchido, setPreenchido] = useState(false);

  useEffect(() => {
    if (lancamentoAtual && !preenchido) {
      setCentavos(Math.round((Number(lancamentoAtual.valor) || 0) * 100));
      setDescricao(lancamentoAtual.descricao || "");
      setData(isoToDateInput(lancamentoAtual.data));
      setPreenchido(true);
    }
  }, [lancamentoAtual, preenchido]);

  const valorFmt = useMemo(() => formatBRLFromCentavos(centavos), [centavos]);
  const hoje = hojeISO();

  function handleValor(e) {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 8);
    const n = digits ? parseInt(digits, 10) : 0;
    setCentavos(Math.min(n, MAX_CENTAVOS));
  }

  async function handleSalvar() {
    if (centavos <= 0) return;
    setSalvando(true);
    const payload = {
      descricao,
      valor: centavos / 100,
      data: new Date(data + "T12:00:00").toISOString(),
    };
    if (modoEdicao) {
      atualizarLancamento(lancamentoAtual.id, payload);
    } else {
      setModoSimulacao(false);
      adicionarLancamento(payload);
    }
    await new Promise((r) => setTimeout(r, 200));
    setSalvando(false);
    navigate("/historico");
  }

  const fieldStyle = {
    backgroundColor: "var(--field)",
    border: "1px solid var(--border)",
    color: "var(--text)",
  };

  const digitando = centavos > 0;

  return (
    <div
      className="min-h-screen min-h-[100dvh] w-full flex flex-col"
      style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
    >
      <header className="px-4 pt-5 pb-2 flex items-center gap-2 shrink-0">
        <button
          onClick={() => navigate(-1)}
          aria-label="Voltar"
          className="w-10 h-10 rounded-full flex items-center justify-center hover:opacity-80"
          style={{ backgroundColor: "var(--field)" }}
        >
          <ArrowLeft size={20} style={{ color: "var(--text)" }} />
        </button>
        <h1 className="text-lg font-bold" style={{ color: "var(--text)" }}>
          {modoEdicao ? "Editar lançamento" : "Novo lançamento"}
        </h1>
      </header>

      <div className="flex-1 overflow-y-auto px-5 pb-32">
        <div className="max-w-md mx-auto mt-4 space-y-5">
          {/* Campo VALOR */}
          <div>
            <label
              className="block text-xs mb-2"
              style={{ color: "var(--text-secondary)" }}
            >
              Valor
            </label>
            <div
              className="flex items-center rounded-xl overflow-hidden"
              style={fieldStyle}
            >
              <span
                className="pl-4 pr-2 text-2xl font-bold"
                style={{ color: "var(--primary)" }}
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
            <p className="text-xs mt-2" style={{ color: "var(--text-secondary)" }}>
              {digitando ? "Valor por extenso em breve" : "Digite o valor recebido"}
            </p>
          </div>

          {/* Campo DESCRIÇÃO */}
          <div>
            <label
              className="block text-xs mb-2"
              style={{ color: "var(--text-secondary)" }}
            >
              Descrição
            </label>
            <input
              type="text"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descrição (opcional)"
              className="w-full px-4 py-4 rounded-xl text-sm focus:outline-none focus:ring-2 placeholder:opacity-70"
              style={fieldStyle}
            />
          </div>

          {/* Campo DATA */}
          <div>
            <label
              className="block text-xs mb-2"
              style={{ color: "var(--text-secondary)" }}
            >
              Data
            </label>
            <input
              type="date"
              value={data}
              max={hoje}
              onChange={(e) => setData(e.target.value)}
              onClick={(e) => e.currentTarget.showPicker?.()}
              className="w-full px-4 py-4 rounded-xl text-sm focus:outline-none focus:ring-2 cursor-pointer"
              style={{ ...fieldStyle, colorScheme: "dark" }}
            />
          </div>
        </div>
      </div>

      {/* Botão Salvar fixado */}
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
            disabled={salvando || centavos <= 0}
            className="w-full py-3.5 rounded-xl font-medium text-sm hover:opacity-90 disabled:opacity-50"
            style={{
              backgroundColor: "var(--primary)",
              color: "var(--primary-contrast)",
            }}
          >
            {salvando ? "Salvando..." : "Salvar lançamento"}
          </button>
        </div>
      </div>
    </div>
  );
}
