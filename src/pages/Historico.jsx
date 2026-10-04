/* HISTORICO v4 — piloto: cartao "Comece com o velocimetro certo" escondido (MOSTRAR_INACABADOS); o resto igual a v3 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, TrendingUp, ChevronDown, Receipt, Plus, Pencil, Trash2, BarChart3, Calendar,
} from "lucide-react";
import ModalFaturamentoInicial from "../components/ModalFaturamentoInicial.jsx";
import SeletorMesAno from "../components/SeletorMesAno.jsx";
import TopoRolavel from "../components/TopoRolavel.jsx";

import BottomNav from "../components/BottomNav.jsx";
import Valor from "../components/Valor.jsx";
import { useAppState } from "@/context/AppStateContext";
import useAnoInicio from "@/hooks/useAnoInicio";
import { MOSTRAR_INACABADOS } from "@/config/piloto";

/* ===================================================================
   HISTORICO v4 (04/10/2026) — PILOTO
   O cartao "Comece com o velocimetro certo / Adicionar faturamento"
   ficou escondido (chave MOSTRAR_INACABADOS em src/config/piloto.js):
   o botao dele abria uma janela que NAO salvava nada. No piloto o
   faturamento de antes do app e perguntado no Onboarding.
   =================================================================== */

/* ===================================================================
   HISTORICO v3 — "Histórico de entradas" (28/09/2026)

   - TITULO "Histórico de entradas" (antes "Histórico"), no topo que
     rola: o titulo sobe com a rolagem e a setinha fica, transparente
     (TopoRolavel).
   - A LISTA mostra O ANO INTEIRO, do mais recente para o mais antigo,
     com o NOME DO MES pequeno separando. Quem nao quer filtrar, so rola.
   - O CALENDARIO ("Período") escolhe mes e ano: a tela DESCE ate
     aquele mes e o card de total mostra o total dele (e o do ano).
   - ANOS so desde que a pessoa comecou a usar o app (useAnoInicio).
   - O resto como antes: busca, "Comece com o velocímetro certo",
     lançar, editar e excluir.
   =================================================================== */

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
  const anoInicio = useAnoInicio();
  const anoAtual = new Date().getFullYear();
  const mesAtual = new Date().getMonth();

  const [busca, setBusca] = useState("");
  const [mesIdx, setMesIdx] = useState(mesAtual);
  const [anoNum, setAnoNum] = useState(anoAtual);
  const [seletorAberto, setSeletorAberto] = useState(false);
  const [excluirId, setExcluirId] = useState(null);
  const [modalFaturamento, setModalFaturamento] = useState(false);
  const [mostrarFaturamento, setMostrarFaturamento] = useState(true);
  const [pularPara, setPularPara] = useState(null);

  // onde comeca cada mes na lista (para o calendario descer ate ele)
  const mesesRef = useRef({});

  useEffect(() => {
    try {
      if (localStorage.getItem(DISMISS_KEY) === "1") setMostrarFaturamento(false);
    } catch {}
  }, []);

  function dispensarFaturamento() {
    try { localStorage.setItem(DISMISS_KEY, "1"); } catch {}
    setMostrarFaturamento(false);
  }

  const doAno = useMemo(
    () => lancamentos.filter((l) => new Date(l.data).getFullYear() === anoNum),
    [lancamentos, anoNum],
  );

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    const base = q ? doAno.filter((l) => String(l.descricao || "").toLowerCase().includes(q)) : doAno;
    return [...base].sort((a, b) => new Date(b.data) - new Date(a.data));
  }, [busca, doAno]);

  /* O ano em grupos por mes (mais recente primeiro) */
  const grupos = useMemo(() => {
    const mapa = new Map();
    for (const l of filtrados) {
      const m = new Date(l.data).getMonth();
      if (!mapa.has(m)) mapa.set(m, []);
      mapa.get(m).push(l);
    }
    return [...mapa.entries()].sort((a, b) => b[0] - a[0]).map(([mes, itens]) => ({ mes, itens }));
  }, [filtrados]);

  const totalMes = useMemo(
    () =>
      doAno
        .filter((l) => new Date(l.data).getMonth() === mesIdx)
        .reduce((s, l) => s + (Number(l.valor) || 0), 0),
    [doAno, mesIdx],
  );
  const totalAno = useMemo(() => doAno.reduce((s, l) => s + (Number(l.valor) || 0), 0), [doAno]);

  /* Depois de escolher no calendario, desce ate o mes */
  useEffect(() => {
    if (pularPara === null) return;
    const alvo = mesesRef.current[pularPara];
    if (alvo) alvo.scrollIntoView({ behavior: "smooth", block: "start" });
    setPularPara(null);
  }, [pularPara, grupos]);

  return (
    <div
      className="tela-rolavel w-full flex flex-col"
      style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
    >
      <div
        className="conteudo-rolavel hide-scrollbar px-5"
        style={{ paddingBottom: "calc(100px + env(safe-area-inset-bottom))" }}
      >
        <TopoRolavel titulo="Histórico de entradas" onVoltar={() => navigate(-1)} />

        {MOSTRAR_INACABADOS && mostrarFaturamento && (
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

        {/* Busca */}
        <div
          className="card-tacerto rounded-2xl flex items-center gap-2.5 px-4 mt-3"
          style={{ minHeight: 50 }}
        >
          <Search size={18} style={{ color: "var(--text-tertiary)" }} className="shrink-0" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar entrada"
            className="flex-1 bg-transparent text-[16px] outline-none placeholder:opacity-60"
            style={{ color: "var(--text)" }}
          />
        </div>

        {/* Período: escolhe o mes e desce ate ele */}
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
              Ir para o mês
            </p>
          </div>
          <ChevronDown size={18} style={{ color: "var(--text-tertiary)" }} className="shrink-0" />
        </button>

        {/* Total do mes (e do ano) */}
        <div className="card-tacerto rounded-2xl px-4 py-3.5 mt-2.5">
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
            Total de {MESES[mesIdx]}
          </p>
          <div className="mt-1">
            <Valor tamanho="xl" autoAjustar>{totalMes}</Valor>
          </div>
          <div className="flex items-center gap-1.5 mt-1.5" style={{ color: "var(--text-tertiary)" }}>
            <span className="text-xs">No ano de {anoNum}:</span>
            <Valor tamanho="sm">{totalAno}</Valor>
          </div>
        </div>

        {/* Nova entrada */}
        <button
          onClick={() => navigate("/lancar")}
          className="card-tacerto w-full rounded-2xl flex items-center gap-3 px-4 mt-2.5 active:opacity-80"
          style={{ minHeight: 52 }}
        >
          <Plus size={20} strokeWidth={2.2} style={{ color: "var(--primary)" }} className="shrink-0" />
          <span className="text-[15px] font-semibold" style={{ color: "var(--text)" }}>
            Lançar entrada
          </span>
        </button>

        {/* Lista: o ano inteiro, com o mes separando */}
        <p
          className="text-[12px] font-semibold uppercase mt-6"
          style={{ color: "var(--text-tertiary)", letterSpacing: "0.06em" }}
        >
          Entradas de {anoNum}
        </p>

        {grupos.length === 0 ? (
          <div className="card-tacerto rounded-2xl py-10 mt-2 flex flex-col items-center gap-3">
            <div
              className="rounded-full flex items-center justify-center"
              style={{ backgroundColor: "var(--surface)", width: 52, height: 52 }}
            >
              <Receipt size={24} style={{ color: "var(--text-tertiary)" }} />
            </div>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              {busca.trim() ? "Nada encontrado" : `Nenhuma entrada em ${anoNum}`}
            </p>
          </div>
        ) : (
          grupos.map((g) => (
            <div key={g.mes}>
              <p
                ref={(el) => { mesesRef.current[g.mes] = el; }}
                className="text-[13px] font-semibold mt-4 mb-2"
                style={{ color: "var(--text-secondary)", scrollMarginTop: 72 }}
              >
                {MESES[g.mes]}
              </p>
              <div className="space-y-2">
                {g.itens.map((l) => (
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
            </div>
          ))
        )}
      </div>

      <SeletorMesAno
        aberto={seletorAberto}
        titulo="Ir para o mês"
        mes={mesIdx + 1}
        ano={anoNum}
        anoMinimo={anoInicio}
        onFechar={() => setSeletorAberto(false)}
        onSelecionar={(m, a) => {
          setMesIdx(m - 1);
          setAnoNum(a);
          setSeletorAberto(false);
          setPularPara(m - 1);
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
              Excluir esta entrada?
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