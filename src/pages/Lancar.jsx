import { useNavigate, useSearchParams } from "react-router-dom";
import { useState, useMemo, useEffect } from "react";
import { ArrowLeft, Calendar as CalendarIcon, TrendingUp } from "lucide-react";
import { useAppState } from "@/context/AppStateContext";
import { getUserState } from "@/lib/userState";
import Valor from "../components/Valor.jsx";
import Calendario from "../components/Calendario.jsx";

const MAX_CENTAVOS = 99999999;
const LIMITE_VISITANTE = 8;

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function formatBRLFromCentavos(centavos) {
  const reais = Math.floor(centavos / 100);
  const cents = centavos % 100;
  const reaisStr = reais.toLocaleString("pt-BR");
  return `${reaisStr},${String(cents).padStart(2, "0")}`;
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function hojeISO() {
  const d = new Date();
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60000);
  return local.toISOString().slice(0, 10);
}

function isoToBR(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return "";
  return `${d}/${m}/${y}`;
}

function brToISO(br) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(br);
  if (!m) return null;
  return `${m[3]}-${m[2]}-${m[1]}`;
}

function mascararData(raw) {
  const digits = String(raw).replace(/\D/g, "").slice(0, 8);
  const p1 = digits.slice(0, 2);
  const p2 = digits.slice(2, 4);
  const p3 = digits.slice(4, 8);
  if (digits.length <= 2) return p1;
  if (digits.length <= 4) return `${p1}/${p2}`;
  return `${p1}/${p2}/${p3}`;
}

function diasNoMes(mes, ano) {
  return new Date(ano, mes, 0).getDate();
}

function validarDataBR(br) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(br);
  if (!m) return false;
  const dia = Number(m[1]);
  const mes = Number(m[2]);
  const ano = Number(m[3]);
  const anoAtual = new Date().getFullYear();
  if (mes < 1 || mes > 12) return false;
  if (ano < 2020 || ano > anoAtual) return false;
  if (dia < 1 || dia > diasNoMes(mes, ano)) return false;
  const iso = `${m[3]}-${m[2]}-${m[1]}`;
  if (iso > hojeISO()) return false;
  return true;
}

function labelDataCurta(iso) {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")} de ${MESES[d.getMonth()]}`;
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

  const ultimoLancamento = useMemo(() => {
    if (!lancamentos || lancamentos.length === 0) return null;
    const lista = modoEdicao
      ? lancamentos.filter((l) => l.id !== editId)
      : lancamentos;
    if (lista.length === 0) return null;
    return [...lista].sort((a, b) => new Date(b.data) - new Date(a.data))[0];
  }, [lancamentos, modoEdicao, editId]);

  useEffect(() => {
    if (modoEdicao) return;
    const { visitante } = getUserState();
    if (visitante && lancamentos.length >= LIMITE_VISITANTE) {
      navigate("/lancar/limite-atingido", { replace: true });
    }
  }, [modoEdicao, lancamentos.length, navigate]);

  const [centavos, setCentavos] = useState(0);
  const [descricao, setDescricao] = useState("");
  const [dataBR, setDataBR] = useState(isoToBR(hojeISO()));
  const [salvando, setSalvando] = useState(false);
  const [preenchido, setPreenchido] = useState(false);
  const [calendarioAberto, setCalendarioAberto] = useState(false);

  useEffect(() => {
    if (lancamentoAtual && !preenchido) {
      setCentavos(Math.round((Number(lancamentoAtual.valor) || 0) * 100));
      setDescricao(lancamentoAtual.descricao || "");
      const d = new Date(lancamentoAtual.data);
      const iso = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
      setDataBR(isoToBR(iso));
      setPreenchido(true);
    }
  }, [lancamentoAtual, preenchido]);

  const valorFmt = useMemo(() => formatBRLFromCentavos(centavos), [centavos]);
  const digitando = centavos > 0;

  const dataCompleta = dataBR.length === 10;
  const dataValida = dataCompleta && validarDataBR(dataBR);
  const mostrarErroData = dataCompleta && !dataValida;

  function handleValor(e) {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 8);
    const n = digits ? parseInt(digits, 10) : 0;
    setCentavos(Math.min(n, MAX_CENTAVOS));
  }

  function handleDataChange(e) {
    setDataBR(mascararData(e.target.value));
  }

  async function handleSalvar() {
    if (centavos <= 0 || !dataValida || salvando) return;

    if (!modoEdicao) {
      const { visitante } = getUserState();
      if (visitante && lancamentos.length >= LIMITE_VISITANTE) {
        navigate("/lancar/limite-atingido", { replace: true });
        return;
      }
    }

    setSalvando(true);
    const iso = brToISO(dataBR);
    const payload = {
      descricao,
      valor: centavos / 100,
      data: new Date(iso + "T12:00:00").toISOString(),
    };
    if (modoEdicao) {
      atualizarLancamento(lancamentoAtual.id, payload);
    } else {
      setModoSimulacao(false);
      adicionarLancamento(payload);
    }
    await new Promise((r) => setTimeout(r, 200));
    setSalvando(false);
    navigate("/dashboard");
  }

  const fieldStyle = {
    backgroundColor: "var(--field)",
    border: "1px solid var(--border)",
    color: "var(--text)",
  };

  const dataFieldStyle = {
    backgroundColor: "var(--field)",
    border: `1px solid ${mostrarErroData ? "#ef4444" : "var(--border)"}`,
    color: "var(--text)",
  };

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
            <p className="text-xs mt-2" style={{ color: "var(--text-secondary)" }}>
              Digite o valor recebido
            </p>
          </div>

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
              className="w-full px-4 rounded-xl text-sm focus:outline-none focus:ring-2 placeholder:opacity-70"
              style={{ ...fieldStyle, minHeight: 52 }}
            />
          </div>

          <div>
            <label
              className="block text-xs mb-2"
              style={{ color: "var(--text-secondary)" }}
            >
              Data
            </label>
            <div
              className="flex items-center rounded-xl px-4"
              style={{ ...dataFieldStyle, minHeight: 52 }}
            >
              <input
                type="text"
                inputMode="numeric"
                value={dataBR}
                onChange={handleDataChange}
                placeholder="dd/mm/aaaa"
                maxLength={10}
                className="flex-1 bg-transparent text-sm focus:outline-none placeholder:opacity-70"
                style={{ color: "var(--text)" }}
              />
              <button
                type="button"
                onClick={() => setCalendarioAberto(true)}
                aria-label="Selecionar data"
                className="ml-2 shrink-0 flex items-center justify-center hover:opacity-80"
              >
                <CalendarIcon size={18} style={{ color: "var(--text-secondary)" }} />
              </button>
            </div>
            {mostrarErroData && (
              <p className="mt-2" style={{ color: "#ef4444", fontSize: 12 }}>
                Data inválida
              </p>
            )}
          </div>

          <div className="pt-4">
            <p className="text-xs mb-2" style={{ color: "var(--text-secondary)" }}>
              Último lançamento
            </p>
            {ultimoLancamento ? (
              <div
                className="w-full rounded-xl px-4 py-3 flex items-center gap-3"
                style={{
                  backgroundColor: "var(--surface)",
                  border: "1px solid var(--border)",
                }}
              >
                <TrendingUp
                  size={20}
                  strokeWidth={1.75}
                  style={{ color: "var(--primary)" }}
                  className="shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p
                    className="text-[14px] leading-tight"
                    style={{
                      color: "var(--text)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {ultimoLancamento.descricao}
                  </p>
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {labelDataCurta(ultimoLancamento.data)}
                  </p>
                </div>
                <div className="shrink-0">
                  <Valor tamanho="sm" sinal="+">
                    {ultimoLancamento.valor}
                  </Valor>
                </div>
              </div>
            ) : (
              <div
                className="w-full rounded-xl px-4 py-4 text-center"
                style={{
                  backgroundColor: "var(--surface)",
                  border: "1px dashed var(--border)",
                }}
              >
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  Nenhum lançamento ainda
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Calendario
        aberto={calendarioAberto}
        modo="dia"
        valorISO={brToISO(dataBR) || hojeISO()}
        onFechar={() => setCalendarioAberto(false)}
        onSelecionar={(iso) => {
          setDataBR(isoToBR(iso));
          setCalendarioAberto(false);
        }}
      />

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
            disabled={salvando || centavos <= 0 || !dataValida}
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