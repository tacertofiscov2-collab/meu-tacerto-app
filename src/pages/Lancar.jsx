import { useNavigate, useSearchParams } from "react-router-dom";
import { useState, useMemo, useEffect } from "react";
import { ArrowLeft, Calendar as CalendarIcon, TrendingUp } from "lucide-react";
import { useAppState } from "@/context/AppStateContext";
import Valor from "../components/Valor.jsx";
import Calendario from "../components/Calendario.jsx";
import { dataMinimaLancamento, LIMITE_VALOR_LANCAMENTO } from "@/lib/fiscal";

// Teto em centavos, derivado da constante única em fiscal.js
const MAX_CENTAVOS = Math.round(LIMITE_VALOR_LANCAMENTO * 100);
const MAX_DIGITOS = String(MAX_CENTAVOS).length;
const LIMITE_DESCRICAO = 60;
const LIMITE_VISITANTE = 8;

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function formatBRLFromCentavos(centavos) {
  const reais = Math.floor(centavos / 100);
  const cents = centavos % 100;
  return `${reais.toLocaleString("pt-BR")},${String(cents).padStart(2, "0")}`;
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
    mesAnoAbertura,
    visitante,
  } = useAppState();

  const dataMin = dataMinimaLancamento(
    mesAnoAbertura?.mes,
    mesAnoAbertura?.ano,
  );

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
    if (visitante && lancamentos.length >= LIMITE_VISITANTE) {
      navigate("/lancar/limite-atingido", { replace: true });
    }
  }, [modoEdicao, lancamentos.length, visitante, navigate]);

  const [centavos, setCentavos] = useState(0);
  const [descricao, setDescricao] = useState("");
  const [dataBR, setDataBR] = useState(isoToBR(hojeISO()));
  const [salvando, setSalvando] = useState(false);
  const [preenchido, setPreenchido] = useState(false);
  const [calendarioAberto, setCalendarioAberto] = useState(false);
  const [atingiuTeto, setAtingiuTeto] = useState(false);

  useEffect(() => {
    if (lancamentoAtual && !preenchido) {
      setCentavos(Math.round((Number(lancamentoAtual.valor) || 0) * 100));
      setDescricao((lancamentoAtual.descricao || "").slice(0, LIMITE_DESCRICAO));
      const d = new Date(lancamentoAtual.data);
      setDataBR(isoToBR(`${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`));
      setPreenchido(true);
    }
  }, [lancamentoAtual, preenchido]);

  function validarDataBR(br) {
    const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(br);
    if (!m) return false;
    const dia = Number(m[1]);
    const mes = Number(m[2]);
    const ano = Number(m[3]);
    if (mes < 1 || mes > 12) return false;
    if (dia < 1 || dia > diasNoMes(mes, ano)) return false;
    const iso = `${m[3]}-${m[2]}-${m[1]}`;
    if (iso > hojeISO()) return false;
    if (iso < dataMin) return false;
    return true;
  }

  const valorFmt = useMemo(() => formatBRLFromCentavos(centavos), [centavos]);
  const digitando = centavos > 0;

  const dataCompleta = dataBR.length === 10;
  const dataValida = dataCompleta && validarDataBR(dataBR);
  const mostrarErroData = dataCompleta && !dataValida;

  const msgErroData = (() => {
    if (!mostrarErroData) return "";
    const iso = brToISO(dataBR);
    if (iso && iso > hojeISO()) return "Não dá pra lançar uma data futura";
    if (iso && iso < dataMin) {
      const [y, m] = dataMin.split("-");
      return `Seu MEI abriu em ${MESES[Number(m) - 1]} de ${y} — escolha uma data a partir daí`;
    }
    return "Data inválida";
  })();

  function handleValor(e) {
    const digits = e.target.value.replace(/\D/g, "").slice(0, MAX_DIGITOS);
    const n = digits ? parseInt(digits, 10) : 0;
    const limitado = Math.min(n, MAX_CENTAVOS);
    setAtingiuTeto(n > MAX_CENTAVOS);
    setCentavos(limitado);
  }

  async function handleSalvar() {
    if (centavos <= 0 || !dataValida || salvando) return;

    if (!modoEdicao && visitante && lancamentos.length >= LIMITE_VISITANTE) {
      navigate("/lancar/limite-atingido", { replace: true });
      return;
    }

    setSalvando(true);
    const iso = brToISO(dataBR);
    const payload = {
      descricao: descricao.trim().slice(0, LIMITE_DESCRICAO),
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
      className="tela-fixa w-full flex flex-col"
      style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
    >
      <header className="px-4 pt-5 pb-2 flex items-center gap-2 shrink-0">
        <button
          onClick={() => navigate(-1)}
          aria-label="Voltar"
          className="toque toque-escala w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: "linear-gradient(160deg, var(--vidro-brilho-1) 0%, var(--vidro-brilho-2) 24%, transparent 58%), var(--vidro-bg)", backdropFilter: "blur(24px) saturate(160%)", WebkitBackdropFilter: "blur(24px) saturate(160%)", border: "1px solid var(--vidro-borda)", boxShadow: "inset 0 1.5px 0 0 var(--vidro-topo-forte), inset 0 9px 20px -8px var(--vidro-topo-medio), inset 0 -1.5px 0 0 var(--vidro-base), 0 8px 24px var(--vidro-sombra)" }}
        >
          <ArrowLeft size={20} style={{ color: "var(--text)" }} />
        </button>
        <h1 className="text-lg font-bold" style={{ color: "var(--text)" }}>
          {modoEdicao ? "Editar lançamento" : "Novo lançamento"}
        </h1>
      </header>

      {/* Conteúdo: rola só se precisar, mas cabe tudo em tela normal */}
      <div
        className="flex-1 min-h-0 overflow-y-auto hide-scrollbar px-5"
        style={{ paddingBottom: 4 }}
      >
        <div
          className="max-w-md mx-auto"
          style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 8 }}
        >
          <div>
            <label
              className="block"
              style={{ color: "var(--text-secondary)", fontSize: 12, marginBottom: 6 }}
            >
              Valor
            </label>
            <div className="flex items-center rounded-xl overflow-hidden" style={fieldStyle}>
              <span
                className="font-bold"
                style={{
                  color: "var(--text)",
                  paddingLeft: 16,
                  paddingRight: 8,
                  fontSize: 22,
                }}
              >
                R$
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={digitando ? valorFmt : ""}
                onChange={handleValor}
                placeholder="0,00"
                className="flex-1 bg-transparent font-bold focus:outline-none placeholder:opacity-40"
                style={{
                  color: "var(--text)",
                  fontSize: 27,
                  paddingTop: 12,
                  paddingBottom: 12,
                  paddingRight: 16,
                }}
              />
            </div>
            <p
              style={{
                color: atingiuTeto ? "#ef4444" : "var(--text-secondary)",
                fontSize: 11.5,
                marginTop: 6,
              }}
            >
              {atingiuTeto
                ? `Valor máximo por lançamento: R$ ${formatBRLFromCentavos(MAX_CENTAVOS)}`
                : "Digite o valor recebido"}
            </p>
          </div>

          <div>
            <label
              className="block"
              style={{ color: "var(--text-secondary)", fontSize: 12, marginBottom: 6 }}
            >
              Descrição
            </label>
            <input
              type="text"
              value={descricao}
              maxLength={LIMITE_DESCRICAO}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descrição (opcional)"
              className="campo-tacerto w-full rounded-xl placeholder:opacity-70"
              style={{
                ...fieldStyle,
                minHeight: 46,
                paddingLeft: 16,
                paddingRight: 16,
                fontSize: 14,
              }}
            />
          </div>

          <div>
            <label
              className="block"
              style={{ color: "var(--text-secondary)", fontSize: 12, marginBottom: 6 }}
            >
              Data
            </label>
            <div
              className="flex items-center rounded-xl"
              style={{
                ...dataFieldStyle,
                minHeight: 46,
                paddingLeft: 16,
                paddingRight: 16,
              }}
            >
              <input
                type="text"
                inputMode="numeric"
                value={dataBR}
                onChange={(e) => setDataBR(mascararData(e.target.value))}
                placeholder="dd/mm/aaaa"
                maxLength={10}
                className="flex-1 bg-transparent focus:outline-none placeholder:opacity-70"
                style={{ color: "var(--text)", fontSize: 14 }}
              />
              <button
                type="button"
                onClick={() => setCalendarioAberto(true)}
                aria-label="Selecionar data"
                className="toque ml-2 shrink-0 flex items-center justify-center"
              >
                <CalendarIcon size={18} style={{ color: "var(--text-secondary)" }} />
              </button>
            </div>
            {mostrarErroData && (
              <p style={{ color: "#ef4444", fontSize: 11.5, marginTop: 6 }}>
                {msgErroData}
              </p>
            )}
          </div>

          <div style={{ marginTop: 4 }}>
            <p
              style={{ color: "var(--text-secondary)", fontSize: 12, marginBottom: 6 }}
            >
              Último lançamento
            </p>
            {ultimoLancamento ? (
              <div
                className="w-full rounded-xl flex items-center"
                style={{
                  gap: 12,
                  paddingLeft: 16,
                  paddingRight: 16,
                  paddingTop: 11,
                  paddingBottom: 11,
                  backgroundColor: "var(--surface)",
                  border: "1px solid var(--border)",
                }}
              >
                <TrendingUp
                  size={19}
                  strokeWidth={1.75}
                  style={{ color: "var(--primary)" }}
                  className="shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p
                    className="leading-tight truncate"
                    style={{ color: "var(--text)", fontSize: 13.5 }}
                  >
                    {ultimoLancamento.descricao}
                  </p>
                  <p
                    style={{ color: "var(--text-secondary)", fontSize: 11.5, marginTop: 2 }}
                  >
                    {labelDataCurta(ultimoLancamento.data)}
                  </p>
                </div>
                <div className="shrink-0">
                  <Valor px={13.5} peso={700} sinal="+">{ultimoLancamento.valor}</Valor>
                </div>
              </div>
            ) : (
              <div
                className="w-full rounded-xl text-center"
                style={{
                  paddingTop: 14,
                  paddingBottom: 14,
                  backgroundColor: "var(--surface)",
                  border: "1px dashed var(--border)",
                }}
              >
                <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>
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
        minISO={dataMin}
        onFechar={() => setCalendarioAberto(false)}
        onSelecionar={(iso) => {
          setDataBR(isoToBR(iso));
          setCalendarioAberto(false);
        }}
      />

      {/* Botão fixo no fluxo — nunca fica atrás da barra do navegador */}
      <div
        className="shrink-0 px-5"
        style={{
          paddingTop: 12,
          backgroundColor: "var(--bg)",
          borderTop: "1px solid var(--border)",
          paddingBottom: "calc(env(safe-area-inset-bottom) + 14px)",
        }}
      >
        <div className="max-w-md mx-auto">
          <button
            onClick={handleSalvar}
            disabled={salvando || centavos <= 0 || !dataValida}
            className="toque toque-escala w-full rounded-xl font-semibold disabled:opacity-50"
            style={{
              paddingTop: 13,
              paddingBottom: 13,
              fontSize: 14.5,
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





