import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Search, TrendingUp, ChevronDown, Receipt, Plus, Pencil, Trash2,
  BarChart3, Calendar,
} from "lucide-react";
import ModalFaturamentoInicial from "../components/ModalFaturamentoInicial.jsx";
import SeletorMesAno from "../components/SeletorMesAno.jsx";

import BottomNav from "../components/BottomNav.jsx";
import Valor from "../components/Valor.jsx";
import { useAppState } from "@/context/AppStateContext";

/* HISTORICO v2 — cards no padrao .card-tacerto (index.css).
   Setinha de voltar e os modais mantidos como estavam. */

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
  const [mesIdx, setMesIdx] = useState(mesAtual);
  const [anoNum, setAnoNum] = useState(anoAtual);
  const [seletorAberto, setSeletorAberto] = useState(false);
  const [excluirId, setExcluirId] = useState(null);
  const [modalFaturamento, setModalFaturamento] = useState(false);
  const [mostrarFaturamento, setMostrarFaturamento] = useState(true);

  useEffect(() => {
    try {
      if (localStorage.getItem(DISMISS_KEY) === "1") setMostrarFaturamento(false);
    } catch {}
  }, []);

  function dispensarFaturamento() {
    try { localStorage.setItem(DISMISS_KEY, "1"); } catch {}
    setMostrarFaturamento(false);
  }

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

  return (
    <div
      className="tela-rolavel w-full flex flex-col"
      style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
    >
      <header className="px-5 pt-6 pb-2 flex items-center gap-3 shrink-0">
        <button
          onClick={() => navigate(-1)}
          aria-label="Voltar"
          className="w-10 h-10 rounded-full flex items-center justify-center hover:opacity-80"
          style={{ background: "linear-gradient(160deg, var(--vidro-brilho-1) 0%, var(--vidro-brilho-2) 24%, transparent 58%), var(--vidro-bg)", backdropFilter: "blur(24px) saturate(160%)", WebkitBackdropFilter: "blur(24px) saturate(160%)", border: "1px solid var(--vidro-borda)", boxShadow: "inset 0 1.5px 0 0 var(--vidro-topo-forte), inset 0 9px 20px -8px var(--vidro-topo-medio), inset 0 -1.5px 0 0 var(--vidro-base), 0 8px 24px var(--vidro-sombra)" }}
        >
          <ArrowLeft size={20} style={{ color: "var(--text)" }} />
        </button>
        <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>
          Histórico
        </h1>
      </header>

      <div
        className="conteudo-rolavel hide-scrollbar px-5"
        style={{ paddingBottom: "calc(100px + env(safe-area-inset-bottom))" }}
      >
        {mostrarFaturamento && (
          <div className="card-tacerto rounded-2xl px-4 py-3.5 mt-2">
            <div className="flex items-start gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: "var(--surface)" }}
              >
                <BarChart3 size={18} style={{ color: "var(--primary)" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-semibold" style={{ color: "var(--text)" }}>
                  Comece com o velocímetro certo
                </p>
                <p className="text-xs leading-relaxed mt-0.5" style={{ color: "var(--text-secondary)" }}>
                  Já faturou este ano antes de instalar o app?
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-2.5">
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

        {/* Busca — fora de qualquer barra, no padrão de bloco */}
        <div
          className="card-tacerto rounded-2xl flex items-center gap-2.5 px-4 mt-3"
          style={{ minHeight: 50 }}
        >
          <Search size={18} style={{ color: "var(--text-tertiary)" }} className="shrink-0" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar lançamento"
            className="flex-1 bg-transparent text-[15px] outline-none placeholder:opacity-60"
            style={{ color: "var(--text)" }}
          />
        </div>

        {/* Período */}
        <button
          onClick={() => setSeletorAberto(true)}
          className="card-tacerto w-full rounded-2xl flex items-center gap-3 px-4 mt-2.5 active:opacity-80"
          style={{ minHeight: 58 }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: "var(--surface)" }}
          >
            <Calendar size={18} style={{ color: "var(--primary)" }} />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-[15px] font-semibold" style={{ color: "var(--text)" }}>
              {`${MESES[mesIdx]} de ${anoNum}`}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
              Período exibido
            </p>
          </div>
          <ChevronDown size={18} style={{ color: "var(--text-tertiary)" }} className="shrink-0" />
        </button>

        {/* Total */}
        <div className="card-tacerto rounded-2xl px-4 py-3.5 mt-2.5">
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
            Total de {MESES[mesIdx]}
          </p>
          <div className="mt-1">
            <Valor tamanho="xl" autoAjustar>{total}</Valor>
          </div>
        </div>

        {/* Novo lançamento */}
        <button
          onClick={() => navigate("/lancar")}
          className="card-tacerto w-full rounded-2xl flex items-center gap-3 px-4 mt-2.5 active:opacity-80"
          style={{ minHeight: 52 }}
        >
          <Plus size={20} strokeWidth={2.2} style={{ color: "var(--primary)" }} className="shrink-0" />
          <span className="text-[15px] font-semibold" style={{ color: "var(--text)" }}>
            Fazer novo lançamento
          </span>
        </button>

        {/* Lista */}
        <p
          className="text-[12px] font-semibold uppercase mt-6 mb-2"
          style={{ color: "var(--text-tertiary)", letterSpacing: "0.06em" }}
        >
          Lançamentos
        </p>

        {filtrados.length === 0 ? (
          <div className="card-tacerto rounded-2xl py-10 flex flex-col items-center gap-3">
            <div
              className="w-13 h-13 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "var(--surface)", width: 52, height: 52 }}
            >
              <Receipt size={24} style={{ color: "var(--text-tertiary)" }} />
            </div>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Nenhum lançamento ainda
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtrados.map((l) => (
              <div
                key={l.id}
                className="card-tacerto rounded-2xl px-4 py-3 flex items-center gap-3"
              >
                <TrendingUp
                  size={19}
                  strokeWidth={2}
                  style={{ color: "var(--primary)" }}
                  className="shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p
                    className="text-[15px] font-semibold leading-tight truncate"
                    style={{ color: "var(--text)" }}
                  >
                    {l.descricao}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                    {labelData(l.data)}
                  </p>
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  <Valor tamanho="md" sinal="+">{l.valor}</Valor>
                  <button
                    onClick={() => navigate(`/lancar?id=${l.id}`)}
                    aria-label="Editar lançamento"
                    className="w-9 h-9 rounded-full flex items-center justify-center active:opacity-70"
                  >
                    <Pencil size={15} style={{ color: "var(--text-tertiary)" }} />
                  </button>
                  <button
                    onClick={() => setExcluirId(l.id)}
                    aria-label="Excluir lançamento"
                    className="w-9 h-9 -ml-1 rounded-full flex items-center justify-center active:opacity-70"
                  >
                    <Trash2 size={15} style={{ color: "var(--text-tertiary)" }} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <SeletorMesAno
        aberto={seletorAberto}
        titulo="Filtrar por mês"
        mes={mesIdx + 1}
        ano={anoNum}
        onFechar={() => setSeletorAberto(false)}
        onSelecionar={(m, a) => {
          setMesIdx(m - 1);
          setAnoNum(a);
          setSeletorAberto(false);
        }}
      />

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
                onClick={() => { removerLancamento(excluirId); setExcluirId(null); }}
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
        onSalvar={() => { setModalFaturamento(false); dispensarFaturamento(); }}
      />

      <BottomNav ativo="historico" />
    </div>
  );
}