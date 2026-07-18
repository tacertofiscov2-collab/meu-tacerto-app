import { useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import { ArrowLeft } from "lucide-react";
import { useAppState } from "@/context/AppStateContext";

// TODO: adaptar termo ao perfil (MEI_CAMINHONEIRO => "frete")
// TODO: salvar no Supabase/localStorage

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

export default function Lancar() {
  const navigate = useNavigate();
  const { adicionarLancamento, setModoSimulacao } = useAppState();
  const [centavos, setCentavos] = useState(0);
  const [descricao, setDescricao] = useState("");
  const [data, setData] = useState(hojeISO());
  const [salvando, setSalvando] = useState(false);

  const valorFmt = useMemo(() => formatBRLFromCentavos(centavos), [centavos]);

  function handleValor(e) {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 8);
    const n = digits ? parseInt(digits, 10) : 0;
    setCentavos(Math.min(n, MAX_CENTAVOS));
  }

  async function handleSalvar() {
    if (centavos <= 0) return;
    setSalvando(true);
    // TODO: salvar no Supabase/localStorage
    await new Promise((r) => setTimeout(r, 400));
    setSalvando(false);
    navigate("/dashboard");
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
          Novo lançamento
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
                style={{ color: "var(--text-secondary)" }}
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
                style={{ color: digitando ? "var(--primary)" : "var(--text)" }}
              />
            </div>
            {/* TODO: valor por extenso */}
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
            <p className="text-xs mt-2" style={{ color: "var(--text-secondary)" }}>
              Se vazio, geramos automaticamente (ex: 1º Frete de Julho)
            </p>
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
              onChange={(e) => setData(e.target.value)}
              className="w-full px-4 py-4 rounded-xl text-sm focus:outline-none focus:ring-2"
              style={fieldStyle}
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
