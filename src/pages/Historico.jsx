import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Search, TrendingUp, ChevronDown, Receipt, Plus, Pencil, Trash2,
  BarChart3,
} from "lucide-react";
import ModalFaturamentoInicial from "../components/ModalFaturamentoInicial.jsx";

import BottomNav from "../components/BottomNav.jsx";
import Valor from "../components/Valor.jsx";
import { useAppState } from "@/context/AppStateContext";
const DISMISS_KEY = "tacerto:hist_faturamento_dismissed";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const fmtBRL = (v) =>
  "R$ " + v.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

function labelData(iso) {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")} de ${MESES[d.getMonth()]}`;
}
function isoDateOnly(iso) {
  return new Date(iso).toISOString().slice(0, 10);
}

export default function Historico() {
  const navigate = useNavigate();
  const { lancamentos, atualizarLancamento, removerLancamento } = useAppState();
  const anoAtual = new Date().getFullYear();
  const mesAtual = new Date().getMonth();
  const [busca, setBusca] = useState("");
  const [mes, setMes] = useState(`${MESES[mesAtual]} ${anoAtual}`);
  const [editando, setEditando] = useState(null);
  const [confirmarExcluir, setConfirmarExcluir] = useState(false);
  const [modalFaturamento, setModalFaturamento] = useState(false);
  const [mostrarFaturamento, setMostrarFaturamento] = useState(true);

  useEffect(() => {
    try {
      if (localStorage.getItem(DISMISS_KEY) === "1") setMostrarFaturamento(false);
    } catch {}
  }, []);

  function dispensarFaturamento() {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {}
    setMostrarFaturamento(false);
  }

  const [mesNome, anoStr] = mes.split(" ");
  const mesIdx = MESES.indexOf(mesNome);
  const anoNum = Number(anoStr);

  const doMes = useMemo(
    () =>
      lancamentos.filter((l) => {
        const d = new Date(l.data);
        return d.getMonth() === mesIdx && d.getFullYear() === anoNum;
      }),
    [lancamentos, mesIdx, anoNum],
  );

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    const base = q ? doMes.filter((l) => l.descricao.toLowerCase().includes(q)) : doMes;
    return [...base].sort((a, b) => new Date(b.data) - new Date(a.data));
  }, [busca, doMes]);

  const total = useMemo(
    () => filtrados.reduce((s, l) => s + (Number(l.valor) || 0), 0),
    [filtrados],
  );

  const cardStyle = {
    backgroundColor: "var(--surface)",
    border: "1px solid var(--border)",
  };
  const fieldStyle = {
    backgroundColor: "var(--field)",
    border: "1px solid var(--border)",
    color: "var(--text)",
  };

  function salvarEdicao(e) {
    e.preventDefault();
    atualizarLancamento(editando.id, {
      descricao: editando.descricao,
      valor: Number(editando.valor) || 0,
      data: new Date(editando._dataInput + "T12:00:00").toISOString(),
    });
    setEditando(null);
  }

  function excluir() {
    removerLancamento(editando.id);
    setConfirmarExcluir(false);
    setEditando(null);
  }


  return (
    <div
      className="min-h-screen min-h-[100dvh] w-full flex flex-col"
      style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
    >
      <div className="flex-1 overflow-y-auto" style={{ paddingBottom: "calc(130px + env(safe-area-inset-bottom))" }}>
        {/* Header */}
        <header className="px-5 pt-6 pb-4 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            aria-label="Voltar"
            className="w-10 h-10 rounded-full flex items-center justify-center hover:opacity-80"
            style={{ backgroundColor: "var(--field)" }}
          >
            <ArrowLeft size={20} style={{ color: "var(--text)" }} />
          </button>
          <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>
            Histórico
          </h1>
        </header>

        <div className="px-5 space-y-4">
          {/* Card faturamento inicial (dispensável) */}
          {mostrarFaturamento && (
            <div
              className="rounded-2xl py-3 px-4"
              style={{ ...cardStyle, borderLeft: "4px solid var(--primary)" }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: "var(--field)" }}
                >
                  <BarChart3 size={16} style={{ color: "var(--primary)" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold" style={{ color: "var(--text)" }}>
                    Comece com o velocímetro certo
                  </p>
                  <p className="text-xs leading-relaxed mt-0.5" style={{ color: "var(--text-secondary)" }}>
                    Já faturou este ano antes de instalar o app? Adicione o total em
                    1 minuto.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={() => setModalFaturamento(true)}
                  className="flex-1 py-2 rounded-xl text-sm font-semibold"
                  style={{
                    backgroundColor: "var(--primary)",
                    color: "var(--primary-contrast)",
                  }}
                >
                  Adicionar faturamento
                </button>
                <button
                  onClick={dispensarFaturamento}
                  className="px-3 py-2 text-sm font-medium"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Agora não
                </button>
              </div>
            </div>
          )}

          {/* Busca */}
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: "var(--text-secondary)" }}
            />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar lançamento..."
              className="w-full pl-10 pr-3 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]"
              style={fieldStyle}
            />
          </div>

          {/* Novo lançamento (opção discreta) */}
          <button
            onClick={() => navigate("/lancar")}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm active:scale-[0.99] transition"
            style={{
              backgroundColor: "var(--surface)",
              border: "1px solid var(--border)",
              color: "var(--text)",
            }}
          >
            <Plus size={18} style={{ color: "var(--primary)" }} />
            Fazer novo lançamento
          </button>

          {/* Filtro de mês */}
          <div className="relative">
            <select
              value={mes}
              onChange={(e) => setMes(e.target.value)}
              className="w-full appearance-none pl-4 pr-10 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]"
              style={fieldStyle}
            >
              {MESES.map((m) => (
                <option key={m} value={`${m} ${anoAtual}`}>{`${m} ${anoAtual}`}</option>
              ))}
            </select>
            <ChevronDown
              size={18}
              className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: "var(--text-secondary)" }}
            />
          </div>

          {/* Total do período */}
          <div className="rounded-2xl p-5" style={cardStyle}>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Total de {mes.split(" ")[0]}
            </p>
            <div className="mt-1">
              <Valor tamanho="xl">{total}</Valor>
            </div>
          </div>

          {/* Lista */}
          {filtrados.length === 0 ? (
            <div
              className="rounded-2xl py-12 flex flex-col items-center gap-3"
              style={cardStyle}
            >
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "var(--field)" }}
              >
                <Receipt size={26} style={{ color: "var(--text-secondary)" }} />
              </div>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Nenhum lançamento ainda
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {filtrados.map((l) => (
                <li key={l.id}>
                  <button
                    onClick={() => setEditando({ ...l, _dataInput: isoDateOnly(l.data) })}
                    className="w-full rounded-xl p-4 flex items-center gap-3 text-left transition-transform active:scale-[0.99]"
                    style={cardStyle}
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: "var(--field)" }}
                    >
                      <TrendingUp size={18} style={{ color: "var(--primary)" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: "var(--text)" }}>
                        {l.descricao}
                      </p>
                      <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                        {labelData(l.data)}
                      </p>
                    </div>
                    <span className="shrink-0">
                      <Valor tamanho="sm" sinal="+">{l.valor}</Valor>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>


      {/* Modal edição */}
      {editando && (
        <div
          className="fixed inset-0 z-30 flex items-end sm:items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
          onClick={() => setEditando(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl p-5 space-y-4"
            style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>
                Editar lançamento
              </h2>
              <button
                onClick={() => setEditando(null)}
                aria-label="Fechar"
                className="w-9 h-9 rounded-full flex items-center justify-center hover:opacity-80"
                style={{ backgroundColor: "var(--field)" }}
              >
                <X size={18} style={{ color: "var(--text)" }} />
              </button>
            </div>

            <form onSubmit={salvarEdicao} className="space-y-3">
              <div>
                <label className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  Valor
                </label>
                <input
                  type="number"
                  min="0"
                  value={editando.valor}
                  onChange={(e) =>
                    setEditando({ ...editando, valor: Number(e.target.value) || 0 })
                  }
                  className="w-full mt-1 px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  style={fieldStyle}
                />
              </div>
              <div>
                <label className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  Descrição
                </label>
                <input
                  type="text"
                  value={editando.descricao}
                  onChange={(e) =>
                    setEditando({ ...editando, descricao: e.target.value })
                  }
                  className="w-full mt-1 px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  style={fieldStyle}
                />
              </div>
              <div>
                <label className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  Data
                </label>
                <input
                  type="date"
                  value={editando._dataInput}
                  onChange={(e) =>
                    setEditando({ ...editando, _dataInput: e.target.value })
                  }
                  className="w-full mt-1 px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  style={fieldStyle}
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl font-semibold"
                style={{
                  backgroundColor: "var(--primary)",
                  color: "var(--primary-contrast)",
                }}
              >
                Salvar
              </button>
              <button
                type="button"
                onClick={() => setConfirmarExcluir(true)}
                className="w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
                style={{
                  backgroundColor: "transparent",
                  color: "#ef4444",
                  border: "1px solid rgba(239,68,68,0.35)",
                }}
              >
                <Trash2 size={16} />
                Excluir
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Confirmação de exclusão */}
      {confirmarExcluir && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-5 space-y-4"
            style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <h3 className="text-base font-bold" style={{ color: "var(--text)" }}>
              Excluir lançamento?
            </h3>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Essa ação não pode ser desfeita.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmarExcluir(false)}
                className="flex-1 py-3 rounded-xl font-semibold"
                style={{ backgroundColor: "var(--field)", color: "var(--text)" }}
              >
                Cancelar
              </button>
              <button
                onClick={excluir}
                className="flex-1 py-3 rounded-xl font-semibold"
                style={{ backgroundColor: "#ef4444", color: "#fff" }}
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}



      <ModalFaturamentoInicial
        aberto={modalFaturamento}
        onClose={() => setModalFaturamento(false)}
        onSalvar={() => {
          // TODO: persistir faturamento inicial no Supabase
          setModalFaturamento(false);
          dispensarFaturamento();
        }}
      />

      <BottomNav ativo="historico" />
    </div>
  );
}
