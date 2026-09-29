/* SAIDAS v2 — "Histórico de saídas" igual ao de entradas: ano inteiro na lista, calendario, total, lancar saida */
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  Search, TrendingDown, ChevronDown, Receipt, Plus, Trash2, Calendar, X, Loader2,
} from "lucide-react";
import { toast } from "sonner";

import SeletorMesAno from "../components/SeletorMesAno.jsx";
import TopoRolavel from "../components/TopoRolavel.jsx";
import BottomNav from "../components/BottomNav.jsx";
import Valor from "../components/Valor.jsx";
import { supabase } from "@/lib/supabase";
import useAnoInicio from "@/hooks/useAnoInicio";
import { listarSaidas, lancarSaida, apagarSaidaManual, nomeParaDescricao } from "@/lib/openfinance";

/* ===================================================================
   SAIDAS v2 — "Histórico de saídas" (28/09/2026)

   IGUAL AO "Histórico de entradas" (HISTORICO v3), no design e nas
   funcoes — pedido do Fernando:
     - topo que rola (titulo sobe, setinha fica transparente)
     - busca, "Período" (escolhe o mes e desce ate ele), total do mes e
       do ano, "Lançar saída"
     - a LISTA do ano inteiro, com o nome do mes pequeno separando
     - anos so desde que a pessoa comecou a usar o app
   SEM textos de explicacao. O segmento e a parte isenta do IR sairam
   daqui: vao para o "Resumo" do ano, junto com os totais.

   As saidas do banco chegam sozinhas (OPENFINANCE v8); as lancadas a
   mao ("Lançar saída") tem a etiqueta "Lançada por você" e podem ser
   apagadas.
   =================================================================== */

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const MEIOS_LANCAMENTO = ["Dinheiro", "Pix", "Cartão", "Boleto", "Outro"];

/* ---------------------------- ajudantes ---------------------------- */

function reais(v) {
  return (
    "R$ " +
    Number(v || 0).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

function labelData(iso) {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")} de ${MESES[d.getMonth()]}`;
}

/* CNPJ 12.345.•••/••01-90  |  CPF •••.654.321-•• */
function mascararDocumento(doc) {
  const d = String(doc || "").replace(/\D/g, "");
  if (d.length === 14) return `CNPJ ${d.slice(0, 2)}.${d.slice(2, 5)}.•••/••${d.slice(10, 12)}-${d.slice(12)}`;
  if (d.length === 11) return `CPF •••.${d.slice(3, 6)}.${d.slice(6, 9)}-••`;
  return "";
}

const NOMES_MEIO = {
  PIX: "Pix", TED: "TED", DOC: "DOC", BOLETO: "Boleto", DEPOSITO: "Depósito",
  TRANSFER: "Transferência", TRANSFERENCIA: "Transferência",
  CREDIT_CARD: "Cartão", DEBIT_CARD: "Cartão", CARTAO: "Cartão", DINHEIRO: "Dinheiro",
};

function nomeMeio(meio) {
  const chave = String(meio || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toUpperCase().replace(/[^A-Z_]/g, "");
  if (!chave) return "";
  return NOMES_MEIO[chave] || chave.charAt(0) + chave.slice(1).toLowerCase();
}

/* Nome que aparece na lista: quem recebeu; sem isso, a descricao. */
function nomeDaSaida(s) {
  if (s.recebedor_nome) return nomeParaDescricao(s.recebedor_nome);
  if (s.descricao) {
    const limpa = String(s.descricao).replace(/[0-9]{3,}/g, "").replace(/\s+/g, " ").trim();
    return limpa ? nomeParaDescricao(limpa) : "Saída";
  }
  return "Saída";
}

/* "2026-09-28" de hoje, no horario local */
function hojeLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/* ============================== TELA ============================== */

export default function Saidas() {
  const navigate = useNavigate();
  const anoInicio = useAnoInicio();
  const anoAtual = new Date().getFullYear();
  const mesAtual = new Date().getMonth();

  const [userId, setUserId] = useState(null);
  const [saidas, setSaidas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [busca, setBusca] = useState("");
  const [mesIdx, setMesIdx] = useState(mesAtual);
  const [anoNum, setAnoNum] = useState(anoAtual);
  const [seletorAberto, setSeletorAberto] = useState(false);
  const [lancando, setLancando] = useState(false);
  const [paraApagar, setParaApagar] = useState(null);
  const [apagando, setApagando] = useState(false);
  const [pularPara, setPularPara] = useState(null);

  const mesesRef = useRef({});

  /* Carrega as saidas do ano escolhido */
  useEffect(() => {
    let ativo = true;
    (async () => {
      setCarregando(true);
      setErro("");
      try {
        const { data } = await supabase.auth.getUser();
        const user = data?.user;
        if (!user) return;
        if (ativo) setUserId(user.id);
        const lista = await listarSaidas(user.id, anoNum);
        if (!ativo) return;
        // so o ano escolhido (a busca pega "a partir de")
        setSaidas(lista.filter((s) => new Date(s.data).getFullYear() === anoNum));
      } catch {
        if (ativo) setErro("Não foi possível carregar suas saídas agora.");
      } finally {
        if (ativo) setCarregando(false);
      }
    })();
    return () => { ativo = false; };
  }, [anoNum]);

  const filtradas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    const base = q
      ? saidas.filter((s) =>
          `${nomeDaSaida(s)} ${s.descricao || ""} ${s.recebedor_nome || ""}`.toLowerCase().includes(q),
        )
      : saidas;
    return [...base].sort((a, b) => new Date(b.data) - new Date(a.data));
  }, [busca, saidas]);

  const grupos = useMemo(() => {
    const mapa = new Map();
    for (const s of filtradas) {
      const m = new Date(s.data).getMonth();
      if (!mapa.has(m)) mapa.set(m, []);
      mapa.get(m).push(s);
    }
    return [...mapa.entries()].sort((a, b) => b[0] - a[0]).map(([mes, itens]) => ({ mes, itens }));
  }, [filtradas]);

  const totalMes = useMemo(
    () =>
      saidas
        .filter((s) => new Date(s.data).getMonth() === mesIdx)
        .reduce((t, s) => t + (Number(s.valor) || 0), 0),
    [saidas, mesIdx],
  );
  const totalAno = useMemo(() => saidas.reduce((t, s) => t + (Number(s.valor) || 0), 0), [saidas]);

  useEffect(() => {
    if (pularPara === null) return;
    const alvo = mesesRef.current[pularPara];
    if (alvo) alvo.scrollIntoView({ behavior: "smooth", block: "start" });
    setPularPara(null);
  }, [pularPara, grupos]);

  function aoLancar(nova) {
    if (new Date(nova.data).getFullYear() === anoNum) setSaidas((lista) => [nova, ...lista]);
    setLancando(false);
    toast.success("Saída lançada");
  }

  async function confirmarApagar() {
    if (!paraApagar || !userId) return;
    setApagando(true);
    try {
      await apagarSaidaManual(userId, paraApagar.id);
      setSaidas((lista) => lista.filter((s) => s.id !== paraApagar.id));
      setParaApagar(null);
      toast.success("Saída apagada");
    } catch {
      toast.error("Não consegui apagar agora. Tente de novo.");
    } finally {
      setApagando(false);
    }
  }

  return (
    <div
      className="tela-rolavel w-full flex flex-col"
      style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
    >
      <div
        className="conteudo-rolavel hide-scrollbar px-5"
        style={{ paddingBottom: "calc(100px + env(safe-area-inset-bottom))" }}
      >
        <TopoRolavel titulo="Histórico de saídas" onVoltar={() => navigate(-1)} />

        {/* Busca */}
        <div
          className="card-tacerto rounded-2xl flex items-center gap-2.5 px-4 mt-2"
          style={{ minHeight: 50 }}
        >
          <Search size={18} style={{ color: "var(--text-tertiary)" }} className="shrink-0" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar saída"
            className="flex-1 bg-transparent text-[16px] outline-none placeholder:opacity-60"
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

        {/* Lançar saída */}
        <button
          onClick={() => setLancando(true)}
          disabled={!userId}
          className="card-tacerto w-full rounded-2xl flex items-center gap-3 px-4 mt-2.5 active:opacity-80 disabled:opacity-40"
          style={{ minHeight: 52 }}
        >
          <Plus size={20} strokeWidth={2.2} style={{ color: "var(--primary)" }} className="shrink-0" />
          <span className="text-[15px] font-semibold" style={{ color: "var(--text)" }}>
            Lançar saída
          </span>
        </button>

        {/* Lista: o ano inteiro, com o mes separando */}
        <p
          className="text-[12px] font-semibold uppercase mt-6"
          style={{ color: "var(--text-tertiary)", letterSpacing: "0.06em" }}
        >
          Saídas de {anoNum}
        </p>

        {carregando ? (
          <div className="flex justify-center" style={{ padding: "32px 0" }}>
            <Loader2 size={22} className="animate-spin" style={{ color: "var(--primary)" }} />
          </div>
        ) : erro ? (
          <p className="text-center text-[14px]" style={{ color: "var(--text-secondary)", padding: "28px 0" }}>
            {erro}
          </p>
        ) : grupos.length === 0 ? (
          <div className="card-tacerto rounded-2xl py-10 mt-2 flex flex-col items-center gap-3">
            <div
              className="rounded-full flex items-center justify-center"
              style={{ backgroundColor: "var(--surface)", width: 52, height: 52 }}
            >
              <Receipt size={24} style={{ color: "var(--text-tertiary)" }} />
            </div>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              {busca.trim() ? "Nada encontrado" : `Nenhuma saída em ${anoNum}`}
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
                {g.itens.map((s) => (
                  <CardSaida key={s.id} saida={s} onApagar={() => setParaApagar(s)} />
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

      {lancando && userId && (
        <FolhaLancarSaida
          userId={userId}
          anoMin={anoInicio}
          onFechar={() => setLancando(false)}
          onLancou={aoLancar}
        />
      )}

      {paraApagar && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
          onClick={() => !apagando && setParaApagar(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl p-5 space-y-4"
            style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <h3 className="text-base font-bold" style={{ color: "var(--text)" }}>
              Excluir esta saída?
            </h3>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              {nomeDaSaida(paraApagar)} · {reais(paraApagar.valor)}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setParaApagar(null)}
                disabled={apagando}
                className="flex-1 py-3 rounded-xl font-semibold"
                style={{ backgroundColor: "var(--field)", color: "var(--text)" }}
              >
                Cancelar
              </button>
              <button
                onClick={confirmarApagar}
                disabled={apagando}
                className="flex-1 py-3 rounded-xl font-semibold"
                style={{ backgroundColor: "#ef4444", color: "#fff" }}
              >
                {apagando ? "Excluindo..." : "Excluir"}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav ativo="historico" />
    </div>
  );
}

/* ========================== PECAS DA TELA ========================== */

/* Card de uma saida — mesmo desenho do card de entrada */
function CardSaida({ saida: s, onApagar }) {
  const manual = s.origem === "manual";
  const detalhes = [labelData(s.data), nomeMeio(s.meio), mascararDocumento(s.recebedor_documento)]
    .filter(Boolean)
    .join(" · ");
  return (
    <div className="card-tacerto rounded-2xl px-4 py-3 flex items-center gap-3">
      <TrendingDown size={19} strokeWidth={2} style={{ color: "var(--text-secondary)" }} className="shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-semibold leading-tight truncate" style={{ color: "var(--text)" }}>
          {nomeDaSaida(s)}
        </p>
        <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-secondary)" }}>
          {detalhes}
        </p>
        {manual && (
          <p className="text-[11.5px] mt-0.5 truncate" style={{ color: "var(--text-tertiary)" }}>
            Lançada por você{s.descricao ? ` · ${s.descricao}` : ""}
          </p>
        )}
      </div>
      <div className="flex items-center gap-0.5 shrink-0">
        <Valor tamanho="md" sinal="-">{s.valor}</Valor>
        {manual && (
          <button
            onClick={onApagar}
            aria-label="Excluir saída lançada"
            className="w-9 h-9 rounded-full flex items-center justify-center active:opacity-70"
          >
            <Trash2 size={15} style={{ color: "var(--text-tertiary)" }} />
          </button>
        )}
      </div>
    </div>
  );
}

/* Folha "Lançar saída". Acompanha o teclado do iPhone: a area da folha
   e o espaco visivel acima do teclado (visualViewport), o miolo rola e
   o botao fica sempre no rodape. */
function FolhaLancarSaida({ userId, anoMin, onFechar, onLancou }) {
  const [centavos, setCentavos] = useState(0);
  const [data, setData] = useState(hojeLocal());
  const [paraQuem, setParaQuem] = useState("");
  const [oQue, setOQue] = useState("");
  const [meio, setMeio] = useState("Dinheiro");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const areaRef = useRef(null);
  const rolagemRef = useRef(null);

  const valor = centavos / 100;
  const hoje = hojeLocal();
  const dataValida = data && data >= `${anoMin}-01-01` && data <= hoje;
  const podeSalvar = valor > 0 && dataValida && !salvando;

  useEffect(() => {
    const area = areaRef.current;
    const vv = window.visualViewport;
    const htmlEl = document.documentElement;
    const bodyEl = document.body;
    const oh = htmlEl.style.overflow;
    const ob = bodyEl.style.overflow;
    htmlEl.style.overflow = "hidden";
    bodyEl.style.overflow = "hidden";

    const bloquear = (e) => {
      const miolo = rolagemRef.current;
      if (miolo && miolo.contains(e.target)) return;
      e.preventDefault();
    };
    document.addEventListener("touchmove", bloquear, { passive: false });

    const ajustar = () => {
      if (!area || !vv) return;
      area.style.top = `${vv.offsetTop}px`;
      area.style.height = `${vv.height}px`;
    };
    ajustar();
    vv?.addEventListener("resize", ajustar);
    vv?.addEventListener("scroll", ajustar);
    return () => {
      document.removeEventListener("touchmove", bloquear);
      htmlEl.style.overflow = oh;
      bodyEl.style.overflow = ob;
      vv?.removeEventListener("resize", ajustar);
      vv?.removeEventListener("scroll", ajustar);
    };
  }, []);

  function aoFocar(e) {
    const el = e.target;
    setTimeout(() => el?.scrollIntoView({ block: "center", behavior: "smooth" }), 320);
  }

  async function salvar() {
    if (!podeSalvar) return;
    setSalvando(true);
    setErro("");
    try {
      const nova = await lancarSaida(userId, {
        valor,
        data: new Date(`${data}T12:00:00`).toISOString(),
        descricao: oQue.trim(),
        recebedorNome: paraQuem.trim(),
        meio,
      });
      onLancou(nova);
    } catch {
      setErro("Não consegui salvar agora. Tente de novo.");
      setSalvando(false);
    }
  }

  const campo = {
    backgroundColor: "var(--surface)",
    border: "1px solid var(--border)",
    color: "var(--text)",
    fontSize: 16,
  };

  return createPortal(
    <>
      <style>{`
        @keyframes folhaSaidaSobe { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes folhaSaidaFundo { from { opacity: 0; } to { opacity: 1; } }
        @media (prefers-reduced-motion: reduce) { .folha-saida { animation: none !important; } }
      `}</style>

      <div
        className="fixed inset-0"
        style={{ zIndex: 80, background: "rgba(0,0,0,0.55)", animation: "folhaSaidaFundo 220ms ease-out" }}
        onClick={() => !salvando && onFechar()}
      />

      <div
        ref={areaRef}
        className="fixed flex flex-col justify-end"
        style={{ zIndex: 81, left: 0, right: 0, top: 0, height: "100dvh", paddingTop: 24, pointerEvents: "none" }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Lançar saída"
          className="folha-saida w-full mx-auto flex flex-col rounded-t-3xl"
          style={{
            pointerEvents: "auto",
            maxWidth: 480,
            maxHeight: "100%",
            backgroundColor: "var(--bg)",
            border: "1px solid var(--card-borda)",
            borderBottom: "none",
            animation: "folhaSaidaSobe 280ms cubic-bezier(0.22,0.61,0.36,1)",
          }}
        >
          {/* titulo + fechar */}
          <div className="shrink-0 flex items-center justify-between" style={{ padding: "16px 18px 8px" }}>
            <p className="font-bold" style={{ fontSize: 18 }}>
              Lançar saída
            </p>
            <button
              onClick={onFechar}
              disabled={salvando}
              aria-label="Fechar"
              className="rounded-full flex items-center justify-center"
              style={{ width: 32, height: 32, border: "1px solid var(--border)" }}
            >
              <X size={16} style={{ color: "var(--text-secondary)" }} />
            </button>
          </div>

          {/* miolo */}
          <div
            ref={rolagemRef}
            className="flex-1 min-h-0 overflow-y-auto hide-scrollbar"
            style={{ padding: "4px 18px 14px", overscrollBehavior: "contain" }}
          >
            <Rotulo>Valor</Rotulo>
            <input
              value={centavos ? reais(valor) : ""}
              onChange={(e) => {
                setErro("");
                const digitos = e.target.value.replace(/\D/g, "").slice(0, 9);
                setCentavos(Number(digitos || 0));
              }}
              onFocus={aoFocar}
              inputMode="numeric"
              placeholder="R$ 0,00"
              className="w-full rounded-2xl outline-none font-bold"
              style={{ ...campo, fontSize: 22, padding: "12px 14px" }}
            />

            <Rotulo>Data</Rotulo>
            <input
              type="date"
              value={data}
              min={`${anoMin}-01-01`}
              max={hoje}
              onChange={(e) => setData(e.target.value)}
              className="w-full rounded-2xl outline-none"
              style={{ ...campo, padding: "12px 14px", colorScheme: "dark" }}
            />
            {data && !dataValida && (
              <p className="text-[12.5px]" style={{ color: "var(--danger)", marginTop: 6 }}>
                Escolha uma data a partir de {anoMin}, até hoje.
              </p>
            )}

            <Rotulo>Para quem (opcional)</Rotulo>
            <input
              value={paraQuem}
              onChange={(e) => setParaQuem(e.target.value.slice(0, 60))}
              onFocus={aoFocar}
              placeholder="Ex.: Posto Rodovia"
              autoComplete="off"
              className="w-full rounded-2xl outline-none"
              style={{ ...campo, padding: "12px 14px" }}
            />

            <Rotulo>O que foi (opcional)</Rotulo>
            <input
              value={oQue}
              onChange={(e) => setOQue(e.target.value.slice(0, 60))}
              onFocus={aoFocar}
              placeholder="Ex.: diesel, pedágio, peça"
              autoComplete="off"
              className="w-full rounded-2xl outline-none"
              style={{ ...campo, padding: "12px 14px" }}
            />

            <Rotulo>Como pagou</Rotulo>
            <div className="flex flex-wrap" style={{ gap: 8 }}>
              {MEIOS_LANCAMENTO.map((m) => {
                const marcado = m === meio;
                return (
                  <button
                    key={m}
                    onClick={() => setMeio(m)}
                    className="rounded-full transition active:scale-[0.97]"
                    style={{
                      padding: "7px 14px",
                      fontSize: 14,
                      fontWeight: 600,
                      backgroundColor: marcado ? "rgba(34,197,94,0.16)" : "var(--surface)",
                      border: `1px solid ${marcado ? "rgba(34,197,94,0.55)" : "var(--border)"}`,
                      color: marcado ? "var(--primary)" : "var(--text-secondary)",
                    }}
                  >
                    {m}
                  </button>
                );
              })}
            </div>

            {erro && (
              <p className="text-[13px]" style={{ color: "var(--danger)", marginTop: 12 }}>
                {erro}
              </p>
            )}
          </div>

          {/* rodape fixo: o botao nunca some atras do teclado */}
          <div
            className="shrink-0"
            style={{
              padding: "12px 18px",
              paddingBottom: "calc(14px + env(safe-area-inset-bottom))",
              borderTop: "1px solid var(--border)",
            }}
          >
            <button
              onClick={salvar}
              disabled={!podeSalvar}
              className="w-full py-3.5 rounded-2xl font-semibold flex items-center justify-center transition active:scale-[0.99] disabled:opacity-40"
              style={{
                gap: 8,
                backgroundColor: "var(--primary)",
                color: "var(--primary-contrast)",
                fontSize: 16,
                lineHeight: "22px",
              }}
            >
              {salvando && <Loader2 size={18} className="animate-spin" />}
              {salvando ? "Salvando..." : "Salvar saída"}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}

function Rotulo({ children }) {
  return (
    <p className="text-[13px] font-semibold" style={{ color: "var(--text-secondary)", marginTop: 14, marginBottom: 6 }}>
      {children}
    </p>
  );
}