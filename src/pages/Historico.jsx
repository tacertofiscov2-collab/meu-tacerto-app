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

function labelData(iso) {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")} de ${MESES[d.getMonth()]}`;
}

export default function Historico() {
  const navigate = useNavigate();
  const { lancamentos, removerLancamento } = useAppState();
  const anoAtual = new Date().getFullYear();
  const mesAtual = new Date().getMonth();
  const [busca, setBusca] = useState("");
  const [mes, setMes] = useState(`${MESES[mesAtual]} ${anoAtual}`);
  const [excluirId, setExcluirId] = useState(null);
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

  function confirmarExcluir() {
    if (excluirId) removerLancamento(excluirId);
    setExcluirId(null);
  }



  return (
    <div
      className="min-h-screen min-h-[100dvh] w-full flex flex-col"
      style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
    >
      <div className="flex-1 overflow-y-auto" style={{ paddingBottom: "calc(104px + env(safe-area-inset-bottom))" }}>
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
          {/* Faturamento inicial (flat, com destaque à esquerda) */}
          {mostrarFaturamento && (
            <div className="py-3" style={{ borderLeft: "3px solid var(--primary)", paddingLeft: 12 }}>
              <div className="flex items-start gap-3">
                <BarChart3 size={20} strokeWidth={1.75} style={{ color: "var(--primary)" }} />
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-semibold" style={{ color: "var(--text)" }}>
                    Comece com o velocímetro certo
                  </p>
                  <p className="text-xs leading-relaxed mt-0.5" style={{ color: "var(--text-secondary)" }}>
                    Já faturou este ano antes de instalar o app? Adicione o total em 1 minuto.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-2 pl-8">
                <button
                  onClick={() => setModalFaturamento(true)}
                  className="text-sm font-semibold"
                  style={{ color: "var(--primary)" }}
                >
                  Adicionar faturamento
                </button>
                <button
                  onClick={dispensarFaturamento}
                  className="text-sm"
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
          <div className="pt-1 pb-1">
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Total de {mes.split(" ")[0]}
            </p>
            <div className="mt-1">
              <Valor tamanho="xl">{total}</Valor>
            </div>
          </div>

          {/* Novo lançamento (opção discreta, flat) */}
          <button
            onClick={() => navigate("/lancar")}
            className="w-full flex items-center gap-3 py-3.5 text-[16px] active:opacity-70"
            style={{ color: "var(--text)" }}
          >
            <Plus size={22} strokeWidth={1.75} style={{ color: "var(--primary)" }} />
            Fazer novo lançamento
          </button>

          {/* Lista flat */}
          {filtrados.length === 0 ? (
            <div className="py-12 flex flex-col items-center gap-3">
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
            <ul>
              {filtrados.map((l) => (
                <li
                  key={l.id}
                  className="w-full flex items-center gap-2"
                  style={{ paddingTop: 14, paddingBottom: 14 }}
                >
                  <TrendingUp
                    size={20}
                    strokeWidth={1.75}
                    style={{ color: "var(--primary)" }}
                    className="shrink-0"
                  />
                  <div
                    className="flex-1 min-w-0 flex items-center gap-2"
                    style={{
                      borderBottom: "1px solid var(--border)",
                      // divisor sutil só a partir do texto
                    }}
                  >
                    <div className="flex-1 min-w-0" style={{ paddingBottom: 14, marginBottom: -14 }}>
                      <p
                        className="text-[15px] truncate"
                        style={{ color: "var(--text)", whiteSpace: "nowrap" }}
                      >
                        {l.descricao}
                      </p>
                      <p
                        className="text-xs mt-0.5"
                        style={{ color: "var(--text-secondary)", whiteSpace: "nowrap" }}
                      >
                        {labelData(l.data)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0" style={{ paddingBottom: 14, marginBottom: -14 }}>
                      <Valor tamanho="md" sinal="+">{l.valor}</Valor>
                      <button
                        onClick={() => navigate(`/lancar?id=${l.id}`)}
                        aria-label="Editar lançamento"
                        className="w-10 h-10 -mr-1 rounded-full flex items-center justify-center active:opacity-70"
                      >
                        <Pencil size={16} style={{ color: "var(--text-secondary)" }} />
                      </button>
                      <button
                        onClick={() => setExcluirId(l.id)}
                        aria-label="Excluir lançamento"
                        className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center active:opacity-70"
                      >
                        <Trash2 size={16} style={{ color: "var(--text-secondary)" }} />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Confirmação de exclusão */}
      {excluirId && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-5 space-y-4"
            style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <h3 className="text-base font-bold" style={{ color: "var(--text)" }}>
              Excluir este lançamento?
            </h3>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setExcluirId(null)}
                className="flex-1 py-3 rounded-xl font-semibold"
                style={{ backgroundColor: "var(--field)", color: "var(--text)" }}
              >
                Cancelar
              </button>
              <button
                onClick={confirmarExcluir}
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

