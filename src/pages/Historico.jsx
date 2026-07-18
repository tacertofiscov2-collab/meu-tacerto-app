import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Search, TrendingUp, ChevronDown, Receipt, X, Trash2, Plus,
  BarChart3,
} from "lucide-react";
import ModalFaturamentoInicial from "../components/ModalFaturamentoInicial.jsx";

import BottomNav from "../components/BottomNav.jsx";
const DISMISS_KEY = "tacerto:hist_faturamento_dismissed";

// TODO: buscar do backend
const LANCAMENTOS_MOCK = [
  { id: 1, descricao: "1º Frete de Julho", data: "10 de Julho", dataISO: "2026-07-10", valor: 3500 },
  { id: 2, descricao: "Frete São Paulo → Rio", data: "08 de Julho", dataISO: "2026-07-08", valor: 2800 },
  { id: 3, descricao: "Serviço avulso", data: "05 de Julho", dataISO: "2026-07-05", valor: 1200 },
  { id: 4, descricao: "Frete Curitiba → Joinville", data: "03 de Julho", dataISO: "2026-07-03", valor: 2400 },
  { id: 5, descricao: "Entrega expressa", data: "02 de Julho", dataISO: "2026-07-02", valor: 900 },
  { id: 6, descricao: "Frete BH → Vitória", data: "01 de Julho", dataISO: "2026-07-01", valor: 1600 },
];

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const fmtBRL = (v) =>
  "R$ " + v.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

export default function Historico() {
  const navigate = useNavigate();
  const [lancamentos, setLancamentos] = useState(LANCAMENTOS_MOCK);
  const [busca, setBusca] = useState("");
  const [mes, setMes] = useState("Julho 2026"); // TODO: filtrar por mês real
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
    // TODO: persistir preferência no backend/Supabase
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {}
    setMostrarFaturamento(false);
  }

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return lancamentos;
    return lancamentos.filter((l) => l.descricao.toLowerCase().includes(q));
  }, [busca, lancamentos]);

  const total = useMemo(
    () => filtrados.reduce((s, l) => s + l.valor, 0),
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
    // TODO: persistir no backend
    setLancamentos((prev) =>
      prev.map((l) => (l.id === editando.id ? { ...editando } : l)),
    );
    setEditando(null);
  }

  function excluir() {
    // TODO: excluir no backend
    setLancamentos((prev) => prev.filter((l) => l.id !== editando.id));
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

          {/* Filtro de mês */}
          <div className="relative">
            <select
              value={mes}
              onChange={(e) => setMes(e.target.value)}
              className="w-full appearance-none pl-4 pr-10 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]"
              style={fieldStyle}
            >
              {MESES.map((m) => (
                <option key={m} value={`${m} 2026`}>{`${m} 2026`}</option>
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
            <p
              className="text-3xl font-bold mt-1"
              style={{ color: "var(--primary)" }}
            >
              {fmtBRL(total)}
            </p>
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
                    onClick={() => setEditando({ ...l })}
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
                        {l.data}
                      </p>
                    </div>
                    <span
                      className="font-bold text-sm shrink-0"
                      style={{ color: "var(--primary)" }}
                    >
                      + {fmtBRL(l.valor)}
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
                  value={editando.dataISO}
                  onChange={(e) =>
                    setEditando({ ...editando, dataISO: e.target.value })
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

      {/* Botão fixo — novo lançamento */}
      <div
        className="fixed left-0 right-0 z-20 px-5"
        style={{ bottom: "calc(90px + env(safe-area-inset-bottom))" }}
      >
        <button
          onClick={() => navigate("/lancar")}
          className="w-full py-3.5 rounded-xl font-semibold active:scale-[0.99] transition"
          style={{
            backgroundColor: "var(--primary)",
            color: "var(--primary-contrast)",
            boxShadow: "0 10px 28px rgba(34,197,94,0.35)",
          }}
        >
          Fazer novo lançamento
        </button>
      </div>


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
