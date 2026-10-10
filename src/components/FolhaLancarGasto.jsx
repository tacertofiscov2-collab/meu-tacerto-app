/* FOLHALANCARGASTO v1 — folha "Lançar gasto" do Meu lucro (dinheiro vivo): valor, data, categoria e "o que foi"; entra ja como gasto do negocio (resposta 9 do Fernando) */
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, Loader2 } from "lucide-react";
import { categoriasSaida } from "@/lib/categorias";
import { lancarGastoAMao } from "@/lib/lucro";

/* ===================================================================
   LANCAR GASTO (10/10/2026 — resposta 9 do Fernando: "gasto à mão,
   para dinheiro vivo")

   Abre pelo "Meu lucro" > "Lançar gasto". Campos: Valor, Data,
   Categoria (as do tipo de MEI; sem escolher = "Outros") e "O que foi"
   (opcional). Grava em `saidas` como origem "manual" e JA do negocio
   (src/lib/lucro.js, lancarGastoAMao): quem lanca a mao no Meu lucro
   esta dizendo que e gasto do trabalho.

   Teclado do iPhone: a mesma tecnica da FolhaLancarSaida
   (src/pages/Saidas.jsx): a area da folha e o espaco visivel acima do
   teclado (visualViewport), o miolo rola e o botao fica no rodape.
   Campos com fonte >= 16px (abaixo disso o Safari da zoom).
   Categoria escolhida: so a borda verde fina (sem fundo).
   =================================================================== */

function reais(v) {
  return "R$ " + Number(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/* "2026-10-10" de hoje, no horario local */
function hojeLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/* dataMin = "AAAA-MM-DD" (1o dia que o Meu lucro mostra) */
export default function FolhaLancarGasto({ userId, tipoMEI, dataMin, onFechar, onLancou }) {
  const [centavos, setCentavos] = useState(0);
  const [data, setData] = useState(hojeLocal());
  const [categoria, setCategoria] = useState(null);
  const [oQue, setOQue] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const areaRef = useRef(null);
  const rolagemRef = useRef(null);
  const opcoes = categoriasSaida(tipoMEI);

  const valor = centavos / 100;
  const hoje = hojeLocal();
  const dataValida = data && data >= dataMin && data <= hoje;
  const podeSalvar = valor > 0 && dataValida && !salvando && !!userId;

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
      const novo = await lancarGastoAMao(userId, { valor, data, descricao: oQue.trim(), categoria });
      onLancou(novo);
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
        @keyframes folhaGastoSobe { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes folhaGastoFundo { from { opacity: 0; } to { opacity: 1; } }
        @media (prefers-reduced-motion: reduce) { .folha-gasto { animation: none !important; } }
      `}</style>

      <div
        className="fixed inset-0"
        style={{ zIndex: 80, background: "rgba(0,0,0,0.55)", animation: "folhaGastoFundo 220ms ease-out" }}
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
          aria-label="Lançar gasto"
          className="folha-gasto w-full mx-auto flex flex-col rounded-t-3xl"
          style={{
            pointerEvents: "auto",
            maxWidth: 480,
            maxHeight: "100%",
            backgroundColor: "var(--bg)",
            border: "1px solid var(--card-borda)",
            borderBottom: "none",
            animation: "folhaGastoSobe 280ms cubic-bezier(0.22,0.61,0.36,1)",
          }}
        >
          {/* titulo + fechar */}
          <div className="shrink-0 flex items-center justify-between" style={{ padding: "16px 18px 8px" }}>
            <p className="font-bold" style={{ fontSize: 18 }}>Lançar gasto</p>
            <button
              type="button"
              onClick={onFechar}
              disabled={salvando}
              aria-label="Fechar"
              className="rounded-full flex items-center justify-center"
              style={{ width: 32, height: 32, border: "1px solid var(--border)", background: "none" }}
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
              aria-label="Valor"
              className="w-full rounded-2xl outline-none font-bold"
              style={{ ...campo, fontSize: 22, padding: "12px 14px" }}
            />

            <Rotulo>Data</Rotulo>
            <input
              type="date"
              value={data}
              min={dataMin}
              max={hoje}
              onChange={(e) => setData(e.target.value)}
              aria-label="Data"
              className="w-full rounded-2xl outline-none"
              style={{ ...campo, padding: "12px 14px", colorScheme: "dark" }}
            />
            {data && !dataValida && (
              <p className="text-[12.5px]" style={{ color: "var(--danger)", marginTop: 6 }}>
                Escolha uma data deste ano, até hoje.
              </p>
            )}

            <Rotulo>Categoria</Rotulo>
            <div className="flex flex-wrap" style={{ gap: 8 }}>
              {opcoes.map((o) => {
                const marcada = o.id === categoria;
                return (
                  <button
                    key={o.id}
                    type="button"
                    aria-pressed={marcada}
                    onClick={() => setCategoria(marcada ? null : o.id)}
                    className="rounded-full transition active:scale-[0.97]"
                    style={{
                      padding: "7px 14px",
                      fontSize: 14,
                      fontWeight: 600,
                      background: "none",
                      border: `1px solid ${marcada ? "rgba(34,197,94,0.55)" : "var(--border)"}`,
                      color: marcada ? "var(--text)" : "var(--text-secondary)",
                    }}
                  >
                    {o.rotulo}
                  </button>
                );
              })}
            </div>

            <Rotulo>O que foi (opcional)</Rotulo>
            <input
              value={oQue}
              onChange={(e) => setOQue(e.target.value.slice(0, 60))}
              onFocus={aoFocar}
              placeholder={tipoMEI === "MEI_CAMINHONEIRO" ? "Ex.: chapa, borracharia, lavagem" : "Ex.: material, ferramenta, entrega"}
              autoComplete="off"
              aria-label="O que foi"
              className="w-full rounded-2xl outline-none"
              style={{ ...campo, padding: "12px 14px" }}
            />

            {erro && (
              <p className="text-[13px]" style={{ color: "var(--danger)", marginTop: 12 }}>{erro}</p>
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
              type="button"
              onClick={salvar}
              disabled={!podeSalvar}
              className="botao-confirmar w-full py-3.5 rounded-2xl font-semibold flex items-center justify-center transition active:scale-[0.99] disabled:opacity-40"
              style={{ gap: 8, fontSize: 16, lineHeight: "22px" }}
            >
              {salvando && <Loader2 size={18} className="animate-spin" />}
              {salvando ? "Salvando..." : "Salvar gasto"}
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
