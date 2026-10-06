/* HISTORICODAS v3 — setinha de voltar maior (bolinha 46, seta 24; sem bolinha, seta 26) (v2: padrao do Historico de notas: 12 janelinhas dos meses; pagas acesas, a pagar apagadas; sem texto) */
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Check, Clock, X, Loader2, FileText, Camera, ExternalLink, Landmark,
} from "lucide-react";
import { toast } from "sonner";

import BottomNav from "../components/BottomNav.jsx";
import { supabase } from "@/lib/supabase";
import { useAppState } from "@/context/AppStateContext";
import useAnoInicio from "@/hooks/useAnoInicio";
import { listarSaidas } from "@/lib/openfinance";
import { listarDasDoAno, guardarDas, apagarDas, acharDasNasSaidas } from "@/lib/das";

/* ===================================================================
   HISTORICO DE DAS v2 — /das (28/09/2026)

   MESMO PADRAO DO HISTORICO DE NOTAS (pedido do Fernando):
     - 12 janelinhas (grade 3 x 4), uma por mes, sem rolagem
     - PAGA (tem registro) = ACESA: verde, com o valor
     - ACHADA NO BANCO = meio acesa, icone do banco (amarelo)
     - A PAGAR = APAGADA
     - meses que ainda nao chegaram e meses antes da abertura do MEI
       ficam bem apagados e nao abrem
     - SEM texto explicando
   ANOS: so desde que a pessoa comecou a usar o app (useAnoInicio). Com
   mais de um ano, aparecem os botoes dos anos no lugar do subtitulo.
   TOCAR NUM MES: sobe o painel (mesmo estilo do das notas) para guardar
   comprovante, valor e data; ver, trocar e apagar.
   Logica e arquivos: src/lib/das.js.
   =================================================================== */

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const MESES_CURTO = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

const PORTAL_SIMPLES = "https://www8.receita.fazenda.gov.br/SimplesNacional/";

function reais(v) {
  return (
    "R$ " +
    Number(v || 0).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

function dataCurta(iso) {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function hojeLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function isoParaDiaLocal(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/* "2026-09" -> vence 20/10/2026 */
function vencimento(competencia) {
  const [a, m] = competencia.split("-").map(Number);
  return new Date(a, m, 20); // mes seguinte (m ja e 1..12)
}

function ehImagem(r) {
  return String(r?.arquivo_tipo || "").startsWith("image/");
}

/* Como cada janelinha aparece */
const VISUAL = {
  paga: { opacidade: 1, fundo: "rgba(34,197,94,0.12)", borda: "rgba(34,197,94,0.55)", cor: "var(--primary)", Icone: Check },
  achada: { opacidade: 0.85, fundo: "rgba(245,158,11,0.08)", borda: "rgba(245,158,11,0.45)", cor: "#f59e0b", Icone: Landmark },
  a_pagar: { opacidade: 0.45, fundo: null, borda: null, cor: "var(--text-tertiary)", Icone: Clock },
  futuro: { opacidade: 0.22, fundo: null, borda: null, cor: "var(--text-tertiary)", Icone: Clock },
  fora: { opacidade: 0.12, fundo: null, borda: null, cor: "var(--text-tertiary)", Icone: Clock },
};

/* ============================== TELA ============================== */

export default function HistoricoDas() {
  const navigate = useNavigate();
  const { mesAnoAbertura } = useAppState();
  const anoInicio = useAnoInicio();
  const hoje = new Date();
  const anoAtual = hoje.getFullYear();
  const mesAtual = hoje.getMonth() + 1;

  const [ano, setAno] = useState(anoAtual);
  const [userId, setUserId] = useState(null);
  const [registros, setRegistros] = useState({});
  const [achadas, setAchadas] = useState({});
  const [carregando, setCarregando] = useState(true);
  const [aberto, setAberto] = useState(null); // competencia "AAAA-MM"
  const [vendo, setVendo] = useState(null);

  useEffect(() => {
    let ativo = true;
    (async () => {
      setCarregando(true);
      try {
        const { data } = await supabase.auth.getUser();
        const user = data?.user;
        if (!user) return;
        if (ativo) setUserId(user.id);
        const [mapa, saidas] = await Promise.all([
          listarDasDoAno(user.id, ano),
          listarSaidas(user.id, ano).catch(() => []),
        ]);
        if (!ativo) return;
        setRegistros(mapa);
        setAchadas(acharDasNasSaidas(saidas));
      } catch {
        if (ativo) toast.error("Não foi possível carregar agora.");
      } finally {
        if (ativo) setCarregando(false);
      }
    })();
    return () => { ativo = false; };
  }, [ano]);

  const anos = useMemo(() => {
    const lista = [];
    for (let a = anoAtual; a >= Math.min(anoInicio, anoAtual); a--) lista.push(a);
    return lista;
  }, [anoInicio, anoAtual]);

  function estadoDoMes(m) {
    const comp = `${ano}-${String(m).padStart(2, "0")}`;
    const abriuNesteAno = mesAnoAbertura && Number(mesAnoAbertura.ano) === ano;
    if (abriuNesteAno && m < Number(mesAnoAbertura.mes)) return "fora";
    if (ano > anoAtual || (ano === anoAtual && m > mesAtual)) return "futuro";
    if (registros[comp]) return "paga";
    if (achadas[comp]) return "achada";
    return "a_pagar";
  }

  function aoGuardar(comp, registro) {
    setRegistros((r) => ({ ...r, [comp]: registro }));
    setAberto(null);
    toast.success("DAS guardada");
  }

  function aoApagar(comp) {
    setRegistros((r) => {
      const novo = { ...r };
      delete novo[comp];
      return novo;
    });
    setAberto(null);
    toast.success("Registro apagado");
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
          className="w-[46px] h-[46px] rounded-full flex items-center justify-center hover:opacity-80"
          style={{ border: "1px solid var(--border)", backgroundColor: "transparent" }}
        >
          <ArrowLeft size={24} style={{ color: "var(--text)" }} />
        </button>
        <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>
          Histórico de DAS
        </h1>
      </header>

      {/* Subtitulo: o ano (ou os botoes dos anos) + atalho do portal */}
      <div className="px-5 pt-1 pb-3 shrink-0 flex items-center justify-between" style={{ gap: 10 }}>
        {anos.length > 1 ? (
          <div className="flex gap-2 overflow-x-auto hide-scrollbar">
            {anos.map((a) => (
              <button
                key={a}
                onClick={() => setAno(a)}
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
        <a
          href={PORTAL_SIMPLES}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center shrink-0 active:opacity-70"
          style={{ gap: 5, color: "var(--primary)", fontSize: 13, fontWeight: 600 }}
        >
          Portal do Simples
          <ExternalLink size={13} />
        </a>
      </div>

      {/* GRADE 3x4 — igual a do Historico de notas */}
      <div
        className="flex-1 px-5 grid grid-cols-3 grid-rows-4 gap-2.5"
        style={{ paddingBottom: "calc(100px + env(safe-area-inset-bottom))" }}
      >
        {MESES_CURTO.map((curto, i) => {
          const m = i + 1;
          const comp = `${ano}-${String(m).padStart(2, "0")}`;
          const estado = carregando ? "a_pagar" : estadoDoMes(m);
          const v = VISUAL[estado];
          const Icone = v.Icone;
          const bloqueado = estado === "futuro" || estado === "fora";
          return (
            <button
              key={curto}
              onClick={() => !bloqueado && userId && setAberto(comp)}
              disabled={bloqueado}
              className="card-tacerto rounded-2xl flex flex-col items-center justify-center gap-1 active:opacity-80"
              style={{
                opacity: v.opacidade,
                ...(v.fundo ? { backgroundColor: v.fundo } : {}),
                ...(v.borda ? { borderColor: v.borda } : {}),
                transition: "opacity 200ms ease",
              }}
            >
              <Icone size={21} strokeWidth={2.3} style={{ color: v.cor }} />
              <span className="text-[15px] font-semibold" style={{ color: "var(--text)" }}>
                {curto}
              </span>
              {estado === "paga" && registros[comp]?.valor ? (
                <span className="text-[11.5px] font-semibold" style={{ color: "var(--primary)" }}>
                  {reais(registros[comp].valor)}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* ------------------------------ UM MES ------------------------------ */}
      {aberto && userId && (
        <FolhaMes
          userId={userId}
          competencia={aberto}
          registro={registros[aberto]}
          achada={achadas[aberto]}
          onFechar={() => setAberto(null)}
          onGuardou={(r) => aoGuardar(aberto, r)}
          onApagou={() => aoApagar(aberto)}
          onVer={(r) => (ehImagem(r) ? setVendo(r) : window.open(r.url, "_blank", "noopener"))}
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
              alt="Comprovante da DAS"
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

/* ========================== PECAS DA TELA ========================== */

/* Folha de um mes: guardar/trocar comprovante, valor e data; apagar.
   Acompanha o teclado do iPhone (mesma tecnica das outras folhas). */
function FolhaMes({ userId, competencia, registro, achada, onFechar, onGuardou, onApagou, onVer }) {
  const [a, m] = competencia.split("-").map(Number);
  const v = vencimento(competencia);

  const [arquivo, setArquivo] = useState(null);
  const [previa, setPrevia] = useState(null);
  const valorInicial = registro?.valor ?? achada?.valor ?? 0;
  const [centavos, setCentavos] = useState(Math.round(Number(valorInicial || 0) * 100));
  const dataInicial = registro?.pago_em
    ? isoParaDiaLocal(registro.pago_em)
    : achada?.data
    ? isoParaDiaLocal(achada.data)
    : hojeLocal();
  const [data, setData] = useState(dataInicial);
  const [salvando, setSalvando] = useState(false);
  const [confirmandoApagar, setConfirmandoApagar] = useState(false);
  const [erro, setErro] = useState("");

  const inputArquivoRef = useRef(null);
  const areaRef = useRef(null);
  const rolagemRef = useRef(null);

  const hoje = hojeLocal();
  const dataValida = data && data <= hoje;
  const podeSalvar = dataValida && !salvando;

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
      const temArquivo = !!arquivo || !!registro?.arquivo_path;
      const r = await guardarDas(userId, {
        competencia,
        arquivo,
        valor: centavos ? centavos / 100 : null,
        pagoEm: new Date(`${data}T12:00:00`).toISOString(),
        origem: !temArquivo && achada && !registro ? "banco" : registro?.origem || "manual",
        anterior: registro,
      });
      onGuardou(r);
    } catch (e) {
      setErro(
        e?.message && e.message.includes("10 MB")
          ? e.message
          : "Não consegui guardar agora. Confira a internet e tente de novo.",
      );
      setSalvando(false);
    }
  }

  async function apagar() {
    setSalvando(true);
    try {
      await apagarDas(userId, registro);
      onApagou();
    } catch {
      setErro("Não consegui apagar agora. Tente de novo.");
      setSalvando(false);
      setConfirmandoApagar(false);
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
        @keyframes folhaDasSobe { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes folhaDasFundo { from { opacity: 0; } to { opacity: 1; } }
        @media (prefers-reduced-motion: reduce) { .folha-das { animation: none !important; } }
      `}</style>

      <div
        className="fixed inset-0"
        style={{ zIndex: 80, background: "rgba(0,0,0,0.55)", animation: "folhaDasFundo 220ms ease-out" }}
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
          aria-label={`DAS de ${MESES[m - 1]}`}
          className="folha-das w-full mx-auto flex flex-col"
          style={{
            pointerEvents: "auto",
            maxWidth: 480,
            maxHeight: "100%",
            backgroundColor: "var(--surface)",
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            animation: "folhaDasSobe 280ms cubic-bezier(0.22,0.61,0.36,1)",
          }}
        >
          <div className="shrink-0 flex items-start justify-between" style={{ padding: "16px 18px 8px", gap: 12 }}>
            <div>
              <p className="text-base font-bold" style={{ color: "var(--text)" }}>
                {MESES[m - 1]} de {a}
              </p>
              <p className="text-[13px]" style={{ color: "var(--text-tertiary)", marginTop: 2 }}>
                Vence {String(v.getDate()).padStart(2, "0")}/{String(v.getMonth() + 1).padStart(2, "0")}/{v.getFullYear()}
              </p>
            </div>
            <button
              onClick={onFechar}
              disabled={salvando}
              aria-label="Fechar"
              className="rounded-full flex items-center justify-center shrink-0"
              style={{ width: 32, height: 32, border: "1px solid var(--border)" }}
            >
              <X size={16} style={{ color: "var(--text-secondary)" }} />
            </button>
          </div>

          <div
            ref={rolagemRef}
            className="flex-1 min-h-0 overflow-y-auto hide-scrollbar"
            style={{ padding: "4px 18px 14px", overscrollBehavior: "contain" }}
          >
            {/* pagamento achado nas saidas do banco */}
            {achada && !registro && (
              <div
                className="rounded-2xl"
                style={{
                  marginTop: 6,
                  padding: "12px 14px",
                  backgroundColor: "rgba(245,158,11,0.1)",
                  border: "1px solid rgba(245,158,11,0.4)",
                }}
              >
                <p className="text-[13.5px] leading-snug" style={{ color: "var(--text)" }}>
                  Achamos no banco: <strong>{reais(achada.valor)}</strong> em {dataCurta(achada.data)}
                </p>
              </div>
            )}

            {/* comprovante */}
            <Rotulo>Comprovante</Rotulo>
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

            {!arquivo && registro?.arquivo_path ? (
              <div className="flex items-center" style={{ gap: 10 }}>
                <button
                  onClick={() => registro.url && onVer(registro)}
                  className="flex-1 rounded-2xl flex items-center active:opacity-80 transition"
                  style={{ gap: 12, padding: 10, backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
                >
                  <span
                    className="rounded-xl overflow-hidden shrink-0 flex items-center justify-center"
                    style={{ width: 48, height: 48, backgroundColor: "var(--field)" }}
                  >
                    {ehImagem(registro) && registro.url ? (
                      <img src={registro.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <FileText size={22} style={{ color: "var(--text-secondary)" }} />
                    )}
                  </span>
                  <span className="font-semibold" style={{ fontSize: 14 }}>
                    Ver comprovante
                  </span>
                </button>
                <button
                  onClick={() => inputArquivoRef.current?.click()}
                  disabled={salvando}
                  className="shrink-0 rounded-2xl font-semibold active:opacity-80 transition"
                  style={{ padding: "12px 14px", fontSize: 14, border: "1px solid var(--border)", color: "var(--text-secondary)" }}
                >
                  Trocar
                </button>
              </div>
            ) : (
              <button
                onClick={() => inputArquivoRef.current?.click()}
                disabled={salvando}
                className="w-full rounded-2xl flex flex-col items-center justify-center text-center overflow-hidden transition active:opacity-80"
                style={{
                  minHeight: 120,
                  padding: previa ? 0 : 14,
                  border: "1.5px dashed var(--border)",
                  backgroundColor: "var(--surface)",
                }}
              >
                {previa ? (
                  <img src={previa} alt="" style={{ width: "100%", maxHeight: 200, objectFit: "contain" }} />
                ) : arquivo ? (
                  <>
                    <FileText size={28} style={{ color: "var(--text-secondary)" }} />
                    <span className="font-semibold truncate" style={{ fontSize: 14, marginTop: 6, maxWidth: "100%" }}>
                      {arquivo.name}
                    </span>
                  </>
                ) : (
                  <>
                    <Camera size={28} style={{ color: "var(--primary)" }} />
                    <span className="font-semibold" style={{ fontSize: 15, marginTop: 6 }}>
                      Tirar foto ou escolher arquivo
                    </span>
                    <span className="text-[12.5px]" style={{ color: "var(--text-tertiary)", marginTop: 2 }}>
                      Foto ou PDF
                    </span>
                  </>
                )}
              </button>
            )}

            <Rotulo>Valor pago</Rotulo>
            <input
              value={centavos ? reais(centavos / 100) : ""}
              onChange={(e) => {
                const digitos = e.target.value.replace(/\D/g, "").slice(0, 9);
                setCentavos(Number(digitos || 0));
              }}
              onFocus={aoFocar}
              inputMode="numeric"
              placeholder="R$ 0,00"
              className="w-full rounded-2xl outline-none font-semibold"
              style={{ ...campo, padding: "12px 14px" }}
            />

            <Rotulo>Data do pagamento</Rotulo>
            <input
              type="date"
              value={data}
              max={hoje}
              onChange={(e) => setData(e.target.value)}
              className="w-full rounded-2xl outline-none"
              style={{ ...campo, padding: "12px 14px", colorScheme: "dark" }}
            />
            {data && !dataValida && (
              <p className="text-[12.5px]" style={{ color: "var(--danger)", marginTop: 6 }}>
                A data não pode ser depois de hoje.
              </p>
            )}

            {registro && (
              <div style={{ marginTop: 18 }}>
                {confirmandoApagar ? (
                  <div className="flex items-center" style={{ gap: 10 }}>
                    <span className="flex-1 text-[13.5px]" style={{ color: "var(--text-secondary)" }}>
                      Apagar o registro deste mês?
                    </span>
                    <button
                      onClick={() => setConfirmandoApagar(false)}
                      disabled={salvando}
                      className="rounded-xl font-semibold"
                      style={{ padding: "8px 12px", fontSize: 13.5, backgroundColor: "var(--field)", color: "var(--text)" }}
                    >
                      Não
                    </button>
                    <button
                      onClick={apagar}
                      disabled={salvando}
                      className="rounded-xl font-semibold"
                      style={{ padding: "8px 12px", fontSize: 13.5, border: "1px solid var(--card-borda)", color: "var(--danger)" }}
                    >
                      Apagar
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmandoApagar(true)}
                    disabled={salvando}
                    className="active:opacity-70 transition"
                    style={{ fontSize: 14, color: "var(--danger)" }}
                  >
                    Apagar registro deste mês
                  </button>
                )}
              </div>
            )}

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
              {salvando ? "Guardando..." : "Guardar"}
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