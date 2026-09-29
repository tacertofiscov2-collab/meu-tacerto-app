/* HISTORICONOTAS v2 — "Lançar nota" manual; meses com nota acesos; anos so desde o inicio do uso */
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, FileText, ChevronRight, X, Plus, Trash2, Camera, Loader2,
} from "lucide-react";
import { toast } from "sonner";

import BottomNav from "../components/BottomNav.jsx";
import Valor from "../components/Valor.jsx";
import { supabase } from "@/lib/supabase";
import useAnoInicio from "@/hooks/useAnoInicio";
import { listarNotasDoAno, lancarNota, apagarNota } from "@/lib/notas";

/* ===================================================================
   HISTORICO DE NOTAS FISCAIS v2 (28/09/2026)

   Continua o mesmo desenho: 12 janelinhas (grade 3 x 4), sem rolagem;
   tocar num mes sobe o painel com as notas dele; tocar numa nota abre
   os detalhes.

   NOVO:
     - "LANÇAR NOTA": a pessoa registra uma nota emitida fora do app
       (numero, data, valor, cliente, CPF/CNPJ do cliente, descricao e o
       PDF ou a foto da nota). Fica na tabela `notas_fiscais`
       (src/lib/notas.js). No painel do mes da para ver o arquivo e
       apagar a nota lancada a mao.
     - MESES COM NOTA ficam ACESOS (verde, com a quantidade); sem nota,
       apagados; meses que ainda nao chegaram, bem apagados.
     - ANOS so desde que a pessoa comecou a usar o app (useAnoInicio).
   As notas emitidas pelo proprio app (NFS-e) entram aqui no futuro,
   com origem "app".
   =================================================================== */

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const MESES_CURTO = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

const MESES_LONGOS = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

function labelData(iso) {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")} de ${MESES_LONGOS[d.getMonth()]}`;
}

function reais(v) {
  return (
    "R$ " +
    Number(v || 0).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

function hojeLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/* CPF 123.456.789-00 | CNPJ 12.345.678/0001-90 enquanto digita */
function formatarDocumento(valor) {
  const d = String(valor).replace(/\D/g, "").slice(0, 14);
  if (d.length <= 11) {
    return d
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }
  return d
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

function ehImagem(n) {
  return String(n?.arquivo_tipo || "").startsWith("image/");
}

/* ============================== TELA ============================== */

export default function HistoricoNotas() {
  const navigate = useNavigate();
  const anoInicio = useAnoInicio();
  const hoje = new Date();
  const anoAtual = hoje.getFullYear();
  const mesAtualIdx = hoje.getMonth();

  const [ano, setAno] = useState(anoAtual);
  const [userId, setUserId] = useState(null);
  const [notas, setNotas] = useState([]);

  // Mes aberto no painel (null = grade, nenhum aberto).
  const [mesAberto, setMesAberto] = useState(null);
  // Nota expandida dentro do painel (id ou null).
  const [notaExpandida, setNotaExpandida] = useState(null);
  // Folha de lancar nota: null ou { dataInicial }
  const [lancando, setLancando] = useState(null);
  const [paraApagar, setParaApagar] = useState(null);
  const [apagando, setApagando] = useState(false);
  const [vendo, setVendo] = useState(null);

  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        const user = data?.user;
        if (!user) return;
        if (ativo) setUserId(user.id);
        const lista = await listarNotasDoAno(user.id, ano);
        if (ativo) setNotas(lista);
      } catch {
        if (ativo) toast.error("Não foi possível carregar as notas agora.");
      }
    })();
    return () => { ativo = false; };
  }, [ano]);

  const anos = useMemo(() => {
    const lista = [];
    for (let a = anoAtual; a >= Math.min(anoInicio, anoAtual); a--) lista.push(a);
    return lista;
  }, [anoInicio, anoAtual]);

  /* Quantas notas em cada mes (0 = Janeiro) */
  const porMes = useMemo(() => {
    const cont = Array(12).fill(0);
    for (const n of notas) cont[new Date(n.data).getMonth()] += 1;
    return cont;
  }, [notas]);

  const notasDoMes = useMemo(
    () => (mesAberto === null ? [] : notas.filter((n) => new Date(n.data).getMonth() === mesAberto)),
    [mesAberto, notas],
  );

  const totalDoMes = useMemo(
    () => notasDoMes.reduce((s, n) => s + (Number(n.valor) || 0), 0),
    [notasDoMes],
  );

  function abrirMes(i) {
    setNotaExpandida(null);
    setMesAberto(i);
  }

  function fecharPainel() {
    setMesAberto(null);
    setNotaExpandida(null);
    setParaApagar(null);
  }

  /* Data sugerida ao lancar: hoje, ou o dia 1 do mes aberto */
  function abrirLancar(mesIdx = null) {
    if (mesIdx === null || (ano === anoAtual && mesIdx === mesAtualIdx)) {
      setLancando({ dataInicial: hojeLocal() });
    } else {
      setLancando({ dataInicial: `${ano}-${String(mesIdx + 1).padStart(2, "0")}-01` });
    }
  }

  function aoLancar(nova) {
    if (new Date(nova.data).getFullYear() === ano) {
      setNotas((l) => [nova, ...l].sort((a, b) => new Date(b.data) - new Date(a.data)));
    }
    setLancando(null);
    toast.success("Nota lançada");
  }

  async function confirmarApagar() {
    if (!paraApagar || !userId) return;
    setApagando(true);
    try {
      await apagarNota(userId, paraApagar);
      setNotas((l) => l.filter((n) => n.id !== paraApagar.id));
      setParaApagar(null);
      setNotaExpandida(null);
      toast.success("Nota apagada");
    } catch {
      toast.error("Não consegui apagar agora. Tente de novo.");
    } finally {
      setApagando(false);
    }
  }

  function verArquivo(n) {
    if (!n.url) return;
    if (ehImagem(n)) setVendo(n);
    else window.open(n.url, "_blank", "noopener");
  }

  return (
    <div
      className="tela-fixa w-full flex flex-col"
      style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
    >
      <header className="px-5 pt-6 pb-2 flex items-center gap-3 shrink-0">
        <button
          onClick={() => navigate(-1)}
          aria-label="Voltar"
          className="w-10 h-10 rounded-full flex items-center justify-center hover:opacity-80"
          style={{ border: "1px solid var(--border)", backgroundColor: "transparent" }}
        >
          <ArrowLeft size={20} style={{ color: "var(--text)" }} />
        </button>
        <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>
          Histórico de notas
        </h1>
      </header>

      {/* Subtitulo: o ano (ou os botoes dos anos) */}
      <div className="px-5 pt-1 pb-3 shrink-0">
        {anos.length > 1 ? (
          <div className="flex gap-2 overflow-x-auto hide-scrollbar">
            {anos.map((a) => (
              <button
                key={a}
                onClick={() => { setAno(a); setNotas([]); }}
                className="px-3 py-1.5 rounded-lg text-[13px] shrink-0"
                style={{
                  backgroundColor: a === ano ? "var(--primary)" : "var(--field)",
                  color: a === ano ? "var(--primary-contrast)" : "var(--text)",
                  fontWeight: a === ano ? 700 : 400,
                }}
              >
                {a}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {ano}
          </p>
        )}
      </div>

      {/* Lançar nota */}
      <div className="px-5 pb-2.5 shrink-0">
        <button
          onClick={() => abrirLancar()}
          disabled={!userId}
          className="card-tacerto w-full rounded-2xl flex items-center gap-3 px-4 active:opacity-80 disabled:opacity-40"
          style={{ minHeight: 50 }}
        >
          <Plus size={20} strokeWidth={2.2} style={{ color: "var(--primary)" }} className="shrink-0" />
          <span className="text-[15px] font-semibold" style={{ color: "var(--text)" }}>
            Lançar nota
          </span>
        </button>
      </div>

      {/* GRADE 3x4 — ocupa o espaco que sobra, sem rolagem */}
      <div
        className="flex-1 px-5 grid grid-cols-3 grid-rows-4 gap-2.5"
        style={{ paddingBottom: "calc(100px + env(safe-area-inset-bottom))" }}
      >
        {MESES.map((mes, i) => {
          const futuro = ano > anoAtual || (ano === anoAtual && i > mesAtualIdx);
          const qtd = porMes[i];
          const acesa = qtd > 0;
          return (
            <button
              key={mes}
              onClick={() => !futuro && abrirMes(i)}
              disabled={futuro}
              className="card-tacerto rounded-2xl flex flex-col items-center justify-center gap-1 active:opacity-80"
              style={{
                opacity: futuro ? 0.22 : acesa ? 1 : 0.45,
                ...(acesa ? { backgroundColor: "rgba(34,197,94,0.12)", borderColor: "rgba(34,197,94,0.55)" } : {}),
                transition: "opacity 200ms ease",
              }}
            >
              <FileText size={21} strokeWidth={2} style={{ color: acesa ? "var(--primary)" : "var(--text-tertiary)" }} />
              <span className="text-[15px] font-semibold" style={{ color: "var(--text)" }}>
                {MESES_CURTO[i]}
              </span>
              {acesa && (
                <span className="text-[11.5px] font-semibold" style={{ color: "var(--primary)" }}>
                  {qtd === 1 ? "1 nota" : `${qtd} notas`}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* PAINEL DO MES — sobe de baixo quando um mes e tocado */}
      {mesAberto !== null && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
          onClick={fecharPainel}
        >
          <div
            className="w-full max-w-md p-4 flex flex-col"
            style={{
              backgroundColor: "var(--surface)",
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              paddingBottom: "calc(env(safe-area-inset-bottom) + 24px)",
              maxHeight: "80dvh",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabecalho do painel */}
            <div className="flex items-center justify-between px-1 pb-3 shrink-0">
              <div>
                <p className="text-base font-bold" style={{ color: "var(--text)" }}>
                  {MESES[mesAberto]} de {ano}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                  {notasDoMes.length === 0
                    ? "Nenhuma nota"
                    : `${notasDoMes.length} ${notasDoMes.length === 1 ? "nota" : "notas"} • total `}
                  {notasDoMes.length > 0 && (
                    <span style={{ color: "var(--text)", fontWeight: 600 }}>
                      <Valor tamanho="sm">{totalDoMes}</Valor>
                    </span>
                  )}
                </p>
              </div>
              <button
                onClick={fecharPainel}
                aria-label="Fechar"
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                style={{ border: "1px solid var(--border)", backgroundColor: "transparent" }}
              >
                <X size={16} style={{ color: "var(--text)" }} />
              </button>
            </div>

            {/* Lista de notas do mes (rola so aqui dentro, se precisar) */}
            <div className="space-y-2 overflow-y-auto hide-scrollbar min-h-0">
              {notasDoMes.length === 0 ? (
                <div className="card-tacerto rounded-2xl py-8 flex flex-col items-center gap-3">
                  <div
                    className="rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "var(--surface)", width: 52, height: 52 }}
                  >
                    <FileText size={24} style={{ color: "var(--text-tertiary)" }} />
                  </div>
                  <p className="text-sm text-center" style={{ color: "var(--text-secondary)" }}>
                    Nenhuma nota fiscal neste mês
                  </p>
                  <button
                    onClick={() => abrirLancar(mesAberto)}
                    className="flex items-center gap-1.5 text-sm font-semibold active:opacity-70"
                    style={{ color: "var(--primary)" }}
                  >
                    <Plus size={16} strokeWidth={2.4} />
                    Lançar nota
                  </button>
                </div>
              ) : (
                notasDoMes.map((n) => {
                  const aberta = notaExpandida === n.id;
                  return (
                    <div key={n.id} className="card-tacerto rounded-2xl px-4 py-3">
                      {/* Linha principal: data + valor (o que sempre aparece) */}
                      <button
                        onClick={() => setNotaExpandida(aberta ? null : n.id)}
                        className="w-full flex items-center gap-3 text-left active:opacity-80"
                      >
                        <FileText
                          size={19}
                          strokeWidth={2}
                          style={{ color: "var(--primary)" }}
                          className="shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-[15px] font-semibold leading-tight" style={{ color: "var(--text)" }}>
                            {labelData(n.data)}
                          </p>
                          {n.tomador_nome && (
                            <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-secondary)" }}>
                              {n.tomador_nome}
                            </p>
                          )}
                        </div>
                        <Valor tamanho="md" sinal="+">{n.valor}</Valor>
                        <ChevronRight
                          size={17}
                          style={{
                            color: "var(--text-tertiary)",
                            transform: aberta ? "rotate(90deg)" : "none",
                            transition: "transform 0.15s",
                          }}
                          className="shrink-0"
                        />
                      </button>

                      {/* Detalhes: aparecem ao tocar na nota */}
                      {aberta && (
                        <div
                          className="mt-3 pt-3 space-y-2"
                          style={{ borderTop: "1px solid var(--border)" }}
                        >
                          {n.numero && <LinhaDetalhe rotulo="Número da nota" valor={n.numero} />}
                          {n.tomador_nome && <LinhaDetalhe rotulo="Cliente" valor={n.tomador_nome} />}
                          {n.tomador_documento && (
                            <LinhaDetalhe rotulo="CPF/CNPJ" valor={formatarDocumento(n.tomador_documento)} />
                          )}
                          {n.descricao && <LinhaDetalhe rotulo="Descrição" valor={n.descricao} />}
                          <LinhaDetalhe rotulo="Data" valor={labelData(n.data)} />

                          <div className="flex items-center gap-4 pt-1">
                            {n.url && (
                              <button
                                onClick={() => verArquivo(n)}
                                className="text-sm font-semibold active:opacity-70"
                                style={{ color: "var(--primary)" }}
                              >
                                Ver nota
                              </button>
                            )}
                            {n.origem === "manual" &&
                              (paraApagar?.id === n.id ? (
                                <span className="flex items-center gap-3">
                                  <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                                    Apagar?
                                  </span>
                                  <button
                                    onClick={() => setParaApagar(null)}
                                    disabled={apagando}
                                    className="text-sm font-semibold"
                                    style={{ color: "var(--text)" }}
                                  >
                                    Não
                                  </button>
                                  <button
                                    onClick={confirmarApagar}
                                    disabled={apagando}
                                    className="text-sm font-semibold"
                                    style={{ color: "var(--danger)" }}
                                  >
                                    {apagando ? "Apagando..." : "Sim"}
                                  </button>
                                </span>
                              ) : (
                                <button
                                  onClick={() => setParaApagar(n)}
                                  className="flex items-center gap-1 text-sm active:opacity-70"
                                  style={{ color: "var(--text-tertiary)" }}
                                >
                                  <Trash2 size={14} />
                                  Apagar
                                </button>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {lancando && userId && (
        <FolhaLancarNota
          userId={userId}
          anoMin={anoInicio}
          dataInicial={lancando.dataInicial}
          onFechar={() => setLancando(null)}
          onLancou={aoLancar}
        />
      )}

      {/* --------------------------- VER A FOTO --------------------------- */}
      {vendo && (
        <div
          className="fixed inset-0 z-[90] flex flex-col"
          style={{ backgroundColor: "rgba(0,0,0,0.92)" }}
          onClick={() => setVendo(null)}
        >
          <div className="shrink-0 flex justify-end" style={{ padding: 16 }}>
            <button
              onClick={() => setVendo(null)}
              aria-label="Fechar"
              className="rounded-full flex items-center justify-center"
              style={{ width: 34, height: 34, backgroundColor: "rgba(255,255,255,0.12)" }}
            >
              <X size={18} style={{ color: "#fff" }} />
            </button>
          </div>
          <div className="flex-1 min-h-0 flex items-center justify-center" style={{ padding: 12 }}>
            <img
              src={vendo.url}
              alt="Nota fiscal"
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", borderRadius: 8 }}
            />
          </div>
        </div>
      )}

      <BottomNav ativo="perfil" />
    </div>
  );
}

/* Uma linha de detalhe (rotulo a esquerda, valor a direita). */
function LinhaDetalhe({ rotulo, valor }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-xs shrink-0" style={{ color: "var(--text-secondary)" }}>
        {rotulo}
      </span>
      <span className="text-sm font-medium text-right" style={{ color: "var(--text)" }}>
        {valor}
      </span>
    </div>
  );
}

/* Folha "Lançar nota". Acompanha o teclado do iPhone (mesma tecnica das
   outras folhas): o miolo rola e o botao fica sempre no rodape. */
function FolhaLancarNota({ userId, anoMin, dataInicial, onFechar, onLancou }) {
  const [centavos, setCentavos] = useState(0);
  const [data, setData] = useState(dataInicial || hojeLocal());
  const [numero, setNumero] = useState("");
  const [cliente, setCliente] = useState("");
  const [documento, setDocumento] = useState("");
  const [descricao, setDescricao] = useState("");
  const [arquivo, setArquivo] = useState(null);
  const [previa, setPrevia] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const inputArquivoRef = useRef(null);
  const areaRef = useRef(null);
  const rolagemRef = useRef(null);

  const hoje = hojeLocal();
  const dataValida = data && data >= `${anoMin}-01-01` && data <= hoje;
  const podeSalvar = centavos > 0 && dataValida && !salvando;

  useEffect(() => {
    if (!arquivo || !arquivo.type?.startsWith("image/")) {
      setPrevia(null);
      return undefined;
    }
    const endereco = URL.createObjectURL(arquivo);
    setPrevia(endereco);
    return () => URL.revokeObjectURL(endereco);
  }, [arquivo]);

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
      const nova = await lancarNota(userId, {
        numero: numero.trim(),
        data: new Date(`${data}T12:00:00`).toISOString(),
        valor: centavos / 100,
        tomadorNome: cliente.trim(),
        tomadorDocumento: documento,
        descricao: descricao.trim(),
        arquivo,
      });
      onLancou(nova);
    } catch (e) {
      setErro(
        e?.message && e.message.includes("10 MB")
          ? e.message
          : "Não consegui salvar agora. Confira a internet e tente de novo.",
      );
      setSalvando(false);
    }
  }

  const campo = {
    backgroundColor: "var(--field)",
    border: "1px solid var(--border)",
    color: "var(--text)",
    fontSize: 16,
  };

  return createPortal(
    <>
      <style>{`
        @keyframes folhaNotaSobe { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes folhaNotaFundo { from { opacity: 0; } to { opacity: 1; } }
        @media (prefers-reduced-motion: reduce) { .folha-nota { animation: none !important; } }
      `}</style>

      <div
        className="fixed inset-0"
        style={{ zIndex: 80, background: "rgba(0,0,0,0.55)", animation: "folhaNotaFundo 220ms ease-out" }}
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
          aria-label="Lançar nota"
          className="folha-nota w-full mx-auto flex flex-col"
          style={{
            pointerEvents: "auto",
            maxWidth: 480,
            maxHeight: "100%",
            backgroundColor: "var(--surface)",
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            animation: "folhaNotaSobe 280ms cubic-bezier(0.22,0.61,0.36,1)",
          }}
        >
          <div className="shrink-0 flex items-center justify-between" style={{ padding: "16px 18px 8px" }}>
            <p className="text-base font-bold" style={{ color: "var(--text)" }}>
              Lançar nota
            </p>
            <button
              onClick={onFechar}
              disabled={salvando}
              aria-label="Fechar"
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ border: "1px solid var(--border)" }}
            >
              <X size={16} style={{ color: "var(--text)" }} />
            </button>
          </div>

          <div
            ref={rolagemRef}
            className="flex-1 min-h-0 overflow-y-auto hide-scrollbar"
            style={{ padding: "4px 18px 14px", overscrollBehavior: "contain" }}
          >
            <Rotulo>Valor</Rotulo>
            <input
              value={centavos ? reais(centavos / 100) : ""}
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

            <Rotulo>Número da nota</Rotulo>
            <input
              value={numero}
              onChange={(e) => setNumero(e.target.value.slice(0, 20))}
              onFocus={aoFocar}
              inputMode="numeric"
              placeholder="Opcional"
              autoComplete="off"
              className="w-full rounded-2xl outline-none"
              style={{ ...campo, padding: "12px 14px" }}
            />

            <Rotulo>Cliente</Rotulo>
            <input
              value={cliente}
              onChange={(e) => setCliente(e.target.value.slice(0, 80))}
              onFocus={aoFocar}
              placeholder="Opcional"
              autoComplete="off"
              className="w-full rounded-2xl outline-none"
              style={{ ...campo, padding: "12px 14px" }}
            />

            <Rotulo>CPF ou CNPJ do cliente</Rotulo>
            <input
              value={documento}
              onChange={(e) => setDocumento(formatarDocumento(e.target.value))}
              onFocus={aoFocar}
              inputMode="numeric"
              placeholder="Opcional"
              autoComplete="off"
              className="w-full rounded-2xl outline-none"
              style={{ ...campo, padding: "12px 14px" }}
            />

            <Rotulo>Descrição</Rotulo>
            <input
              value={descricao}
              onChange={(e) => setDescricao(e.target.value.slice(0, 120))}
              onFocus={aoFocar}
              placeholder="Opcional"
              autoComplete="off"
              className="w-full rounded-2xl outline-none"
              style={{ ...campo, padding: "12px 14px" }}
            />

            <Rotulo>Arquivo da nota</Rotulo>
            <input
              ref={inputArquivoRef}
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => {
                setErro("");
                setArquivo(e.target.files?.[0] || null);
              }}
              style={{ display: "none" }}
            />
            <button
              onClick={() => inputArquivoRef.current?.click()}
              disabled={salvando}
              className="w-full rounded-2xl flex flex-col items-center justify-center text-center overflow-hidden transition active:opacity-80"
              style={{
                minHeight: 96,
                padding: previa ? 0 : 12,
                border: "1.5px dashed var(--border)",
                backgroundColor: "var(--field)",
              }}
            >
              {previa ? (
                <img src={previa} alt="" style={{ width: "100%", maxHeight: 180, objectFit: "contain" }} />
              ) : arquivo ? (
                <>
                  <FileText size={26} style={{ color: "var(--text-secondary)" }} />
                  <span className="font-semibold truncate" style={{ fontSize: 14, marginTop: 6, maxWidth: "100%" }}>
                    {arquivo.name}
                  </span>
                </>
              ) : (
                <>
                  <Camera size={26} style={{ color: "var(--primary)" }} />
                  <span className="font-semibold" style={{ fontSize: 14.5, marginTop: 6 }}>
                    PDF ou foto (opcional)
                  </span>
                </>
              )}
            </button>

            {erro && (
              <p className="text-[13px]" style={{ color: "var(--danger)", marginTop: 12 }}>
                {erro}
              </p>
            )}
          </div>

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
              {salvando ? "Salvando..." : "Salvar nota"}
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