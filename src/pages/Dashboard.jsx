import { useNavigate } from "react-router-dom";
import { useRef, useState, useMemo, useEffect } from "react";
import { Bell, Gauge, TrendingUp, ChevronRight, Receipt, Send, X, Mic, Image as ImageIcon, Plus, Camera, FileText, ClipboardList, Copy, CornerUpLeft, Pencil } from "lucide-react";
import BottomNav from "../components/BottomNav.jsx";
import Valor from "../components/Valor.jsx";
import VelocimetroAnimado from "../components/VelocimetroAnimado.jsx";
import { useAppState } from "@/context/AppStateContext";
import {
  LABEL_TIPO, faixaDoVelocimetro, FAIXA_INFO, FAIXAS_ORDEM, FAIXA_RANGE_LABEL,
  truncarNome,
} from "@/lib/fiscal";

const MESES_CURTO = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
];

const VIDRO = {
  background:
    "linear-gradient(160deg, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0.05) 24%, rgba(255,255,255,0) 58%), rgba(8,8,10,0.88)",
  backdropFilter: "blur(24px) saturate(160%)",
  WebkitBackdropFilter: "blur(24px) saturate(160%)",
  border: "1px solid rgba(255,255,255,0.12)",
  boxShadow:
    "inset 0 1.5px 0 0 rgba(255,255,255,0.40), inset 0 9px 20px -8px rgba(255,255,255,0.28), inset 0 -1.5px 0 0 rgba(0,0,0,0.30), 0 8px 24px rgba(0,0,0,0.38)",
};

/* Reflexo reduzido: um pouco mais forte que o dos cards A/B.
   Usado nas barras do chat e na caixa expandida. */
const VIDRO_SUAVE = {
  background:
    "linear-gradient(160deg, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0.05) 24%, rgba(255,255,255,0) 58%), rgba(8,8,10,0.88)",
  backdropFilter: "blur(24px) saturate(160%)",
  WebkitBackdropFilter: "blur(24px) saturate(160%)",
  border: "1px solid rgba(255,255,255,0.12)",
  boxShadow:
    "inset 0 1px 0 0 rgba(255,255,255,0.26), inset 0 7px 16px -8px rgba(255,255,255,0.17), inset 0 -1.5px 0 0 rgba(0,0,0,0.30), 0 8px 24px rgba(0,0,0,0.38)",
};

const VIDRO_CHAT = {
  background:
    "linear-gradient(160deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 24%, rgba(255,255,255,0) 58%), rgba(8,8,10,0.55)",
  backdropFilter: "blur(28px) saturate(160%)",
  WebkitBackdropFilter: "blur(28px) saturate(160%)",
  border: "1px solid rgba(255,255,255,0.14)",
  boxShadow:
    "inset 0 1px 0 0 rgba(255,255,255,0.22), inset 0 7px 16px -8px rgba(255,255,255,0.14), 0 12px 36px rgba(0,0,0,0.5)",
};

function saudacaoPorHora() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "Bom dia,";
  if (h >= 12 && h < 18) return "Boa tarde,";
  return "Boa noite,";
}

function hexToRgba(hex, alpha) {
  const h = String(hex).replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function BolinhasIndicadoras({ pagina, irPara }) {
  return (
    <div className="flex items-center justify-center gap-2 shrink-0" style={{ marginTop: 10 }}>
      {[0, 1].map((i) => {
        const ativa = pagina === i;
        return (
          <button
            key={i}
            onClick={(e) => { e.stopPropagation(); irPara(i); }}
            aria-label={`Ir para tela ${i + 1}`}
            className="rounded-full transition-all"
            style={{
              width: ativa ? 11 : 9,
              height: ativa ? 11 : 9,
              backgroundColor: "var(--primary)",
              opacity: ativa ? 1 : 0.22,
              boxShadow: ativa ? "0 0 9px rgba(34, 197, 94, 0.65)" : "none",
            }}
          />
        );
      })}
    </div>
  );
}

function TelaDetalhes({
  faixaAtiva, corFaixa, mediaMensal, projecao, ultimos, onSituacao, onLancamentos,
}) {
  const info = FAIXA_INFO[faixaAtiva];
  const temLancamento = ultimos.length > 0;

  return (
    <div
      className="card-b-fixo h-full flex flex-col overflow-hidden"
      style={{ padding: 14, gap: 8, flex: "0 0 50%", width: "50%" }}
    >
      <button
        onClick={onSituacao}
        className="toque toque-escala relative rounded-2xl text-left shrink-0 overflow-hidden"
        style={{
          paddingLeft: 16,
          paddingRight: 12,
          paddingTop: 12,
          paddingBottom: 12,
          backgroundColor: "rgba(10,10,12,0.55)",
          boxShadow: `inset 3px 0 0 0 ${corFaixa}`,
        }}
      >
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(100deg, ${hexToRgba(corFaixa, 0.22)} 0%, ${hexToRgba(corFaixa, 0.06)} 60%, transparent 100%)`,
          }}
        />
        <div className="relative flex items-center" style={{ gap: 10 }}>
          <div className="flex-1 min-w-0" style={{ paddingRight: 30 }}>
            <p
              className="cb-rotulo font-bold uppercase"
              style={{ color: corFaixa, letterSpacing: "0.09em", marginBottom: 4 }}
            >
              Como estou
            </p>
            <p
              className="cb-titulo leading-snug font-semibold"
              style={{ color: "var(--text)" }}
            >
              {info.resumo}
            </p>
          </div>
          <span
            className="rounded-full flex items-center justify-center shrink-0"
            style={{
              width: 24,
              height: 24,
              backgroundColor: hexToRgba(corFaixa, 0.16),
            }}
          >
            <ChevronRight size={14} strokeWidth={2.6} style={{ color: corFaixa }} />
          </span>
        </div>
      </button>

      {temLancamento ? (
        <button
          onClick={onLancamentos}
          className="toque toque-escala rounded-2xl text-left shrink-0"
          style={{
            paddingLeft: 16,
            paddingRight: 16,
            paddingTop: 10,
            paddingBottom: 10,
            backgroundColor: "rgba(255, 255, 255, 0.07)",
          }}
        >
          <div className="flex items-center" style={{ gap: 8, marginBottom: 6 }}>
            <Receipt size={12} style={{ color: "var(--text-tertiary)" }} />
            <p
              className="cb-rotulo font-bold uppercase flex-1"
              style={{ color: "var(--text-secondary)", letterSpacing: "0.09em" }}
            >
              Últimos lançamentos
            </p>
            <ChevronRight size={13} style={{ color: "var(--text-tertiary)" }} className="shrink-0" />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {ultimos.map((l) => {
              const d = new Date(l.data);
              return (
                <div key={l.id} className="flex items-baseline justify-between" style={{ gap: 8 }}>
                  <span
                    className="cb-linha truncate"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {`${String(d.getDate()).padStart(2, "0")} ${MESES_CURTO[d.getMonth()]}`}
                  </span>
                  <Valor px={12.5} peso={700} sinal="+">{l.valor}</Valor>
                </div>
              );
            })}
          </div>
        </button>
      ) : (
        <div
          className="rounded-2xl shrink-0 flex items-center"
          style={{
            padding: 14,
            gap: 10,
            backgroundColor: "rgba(255, 255, 255, 0.07)",
          }}
        >
          <Receipt size={13} style={{ color: "var(--text-tertiary)" }} className="shrink-0" />
          <p className="cb-linha" style={{ color: "var(--text-secondary)" }}>
            Nenhum lançamento ainda
          </p>
        </div>
      )}

      <div
        className="rounded-2xl shrink-0"
        style={{
          paddingLeft: 16,
          paddingRight: 16,
          paddingTop: 10,
          paddingBottom: 10,
          backgroundColor: "rgba(255, 255, 255, 0.07)",
        }}
      >
        <div className="flex items-center" style={{ gap: 8, marginBottom: 6 }}>
          <TrendingUp size={12} style={{ color: "var(--text-tertiary)" }} />
          <p
            className="cb-rotulo font-bold uppercase"
            style={{ color: "var(--text-secondary)", letterSpacing: "0.09em" }}
          >
            Meu ritmo
          </p>
        </div>
        <div className="flex items-baseline justify-between" style={{ gap: 8, marginBottom: 4 }}>
          <span className="cb-linha" style={{ color: "var(--text-secondary)" }}>
            Média por mês
          </span>
          <Valor px={12.5} peso={700} autoAjustar>{mediaMensal}</Valor>
        </div>
        <div className="flex items-baseline justify-between" style={{ gap: 8 }}>
          <span className="cb-linha" style={{ color: "var(--text-secondary)" }}>
            Fecha o ano em
          </span>
          <Valor px={12.5} peso={700} autoAjustar cor={corFaixa}>{projecao}</Valor>
        </div>
      </div>

      <div
        className="rounded-2xl shrink-0"
        style={{
          paddingLeft: 16,
          paddingRight: 16,
          paddingTop: 10,
          paddingBottom: 10,
          backgroundColor: "rgba(255, 255, 255, 0.07)",
        }}
      >
        <p
          className="cb-rotulo font-bold uppercase"
          style={{ color: "var(--text-secondary)", letterSpacing: "0.09em", marginBottom: 6 }}
        >
          Faixas de risco
        </p>
        <div
          className="flex rounded-full overflow-hidden"
          style={{ height: 5, marginBottom: 6 }}
        >
          {FAIXAS_ORDEM.map((f) => (
            <div
              key={f}
              style={{
                flex: 1,
                backgroundColor: FAIXA_INFO[f].cor,
                opacity: f === faixaAtiva ? 1 : 0.3,
              }}
            />
          ))}
        </div>
        <div className="flex justify-between">
          {FAIXAS_ORDEM.map((f) => (
            <span
              key={f}
              className="cb-mini leading-none"
              style={{
                color: f === faixaAtiva ? FAIXA_INFO[f].cor : "var(--text-tertiary)",
                fontWeight: f === faixaAtiva ? 800 : 500,
              }}
            >
              {FAIXA_RANGE_LABEL[f]}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function CardVelocimetroCarrossel({
  rotuloPerfil, percentual, faturado, limite, mediaMensal, projecao,
  ultimos, onSituacao, onLancamentos, onResumo, onExcedente,
}) {
  const [pagina, setPagina] = useState(0);
  const [dragPx, setDragPx] = useState(0);
  const [arrastando, setArrastando] = useState(false);
  const [larguraCard, setLarguraCard] = useState(0);

  const containerRef = useRef(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const startTime = useRef(0);
  const ativo = useRef(false);
  const eixo = useRef(null);
  const moveu = useRef(false);

  const chaveFaixa = faixaDoVelocimetro(percentual);
  const corFaixa = FAIXA_INFO[chaveFaixa].cor;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const medir = () => setLarguraCard(el.clientWidth);
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  function largura() {
    return larguraCard || containerRef.current?.clientWidth || 1;
  }

  function inicio(x, y) {
    startX.current = x;
    startY.current = y;
    startTime.current = Date.now();
    ativo.current = true;
    eixo.current = null;
    moveu.current = false;
    setArrastando(true);
    setDragPx(0);
  }

  function mover(x, y) {
    if (!ativo.current) return;
    const dx = x - startX.current;
    const dy = y - startY.current;

    if (eixo.current === null) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      eixo.current = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      if (eixo.current === "y") {
        ativo.current = false;
        setArrastando(false);
        setDragPx(0);
        return;
      }
    }

    if (eixo.current === "x") {
      moveu.current = true;
      setDragPx(dx);
    }
  }

  function fim(x) {
    if (!ativo.current) {
      setArrastando(false);
      setDragPx(0);
      eixo.current = null;
      return;
    }
    const dx = x - startX.current;
    const dt = Date.now() - startTime.current;
    const velocidade = Math.abs(dx) / Math.max(1, dt);
    const passouMeio = Math.abs(dx) > largura() * 0.3;
    const flick = velocidade > 0.4 && Math.abs(dx) > 30;

    ativo.current = false;
    eixo.current = null;
    setArrastando(false);
    setDragPx(0);

    if (passouMeio || flick) setPagina((p) => (p === 0 ? 1 : 0));
  }

  function irPara(i) {
    setDragPx(0);
    setArrastando(false);
    setPagina(i);
  }

  function seNaoArrastou(fn) {
    return () => { if (!moveu.current) fn(); };
  }

  const bgCard = {
    ...VIDRO,
    boxShadow:
      "inset 0 1px 0 0 rgba(255,255,255,0.22), inset 0 6px 14px -8px rgba(255,255,255,0.14), inset 0 -1.5px 0 0 rgba(0,0,0,0.30), 0 8px 24px rgba(0,0,0,0.38)",
  };

  const larg = larguraCard || 1;
  const base = pagina === 0 ? 0 : -50;
  const dragPct = (dragPx / larg) * 50;
  const translatePct = base + dragPct;

  return (
    <div className="flex flex-col flex-1 min-h-0">
    <div
      ref={containerRef}
      data-carrossel-velocimetro
      className="relative w-full flex-1 min-h-0 rounded-3xl overflow-hidden flex flex-col"
      style={{
        ...bgCard,
        touchAction: "pan-y",
      }}
      onTouchStart={(e) => inicio(e.touches[0].clientX, e.touches[0].clientY)}
      onTouchMove={(e) => mover(e.touches[0].clientX, e.touches[0].clientY)}
      onTouchEnd={(e) => fim(e.changedTouches[0].clientX)}
      onTouchCancel={() => fim(startX.current)}
      onMouseDown={(e) => inicio(e.clientX, e.clientY)}
      onMouseMove={(e) => ativo.current && mover(e.clientX, e.clientY)}
      onMouseUp={(e) => fim(e.clientX)}
      onMouseLeave={(e) => ativo.current && fim(e.clientX)}
    >
      <div className="flex-1 min-h-0 overflow-hidden">
        <div
          className="flex h-full"
          style={{
            width: "200%",
            transform: `translateX(${translatePct}%)`,
            transition: arrastando ? "none" : "transform 300ms ease-in-out",
          }}
        >
          <div
            className="h-full flex flex-col px-5 pb-1 min-h-0"
            style={{ flex: "0 0 50%", width: "50%" }}
          >
            <div className="flex-1 min-h-0 flex items-center justify-center">
              <VelocimetroAnimado
                percentual={percentual}
                maxWidth={205}
                numeroClasse="text-4xl font-bold"
                onClickExcedente={seNaoArrastou(onExcedente)}
              />
            </div>

            {rotuloPerfil && (
              <p
                className="text-center shrink-0"
                style={{ color: "var(--text-tertiary)", fontSize: 11.5, marginBottom: 2 }}
              >
                {rotuloPerfil}
              </p>
            )}

            <div
              className="flex items-stretch pt-3 shrink-0"
              style={{ borderTop: "1px solid var(--border)", marginTop: 2 }}
            >
              <button
                onClick={seNaoArrastou(onResumo)}
                className="toque rounded-xl flex-1 flex flex-col items-center text-center min-w-0"
                style={{ paddingLeft: 12, paddingRight: 12 }}
              >
                <Valor tamanho="md" autoAjustar>{faturado}</Valor>
                <span
                  className="text-xs mt-1"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Faturado
                </span>
              </button>

              <div
                aria-hidden
                className="shrink-0"
                style={{ width: 1, backgroundColor: "var(--border)" }}
              />

              <button
                onClick={seNaoArrastou(onResumo)}
                className="toque rounded-xl flex-1 flex flex-col items-center text-center min-w-0"
                style={{ paddingLeft: 12, paddingRight: 12 }}
              >
                <Valor tamanho="md" autoAjustar>{limite}</Valor>
                <span
                  className="text-xs mt-1"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Limite
                </span>
              </button>
            </div>
          </div>

          <TelaDetalhes
            faixaAtiva={chaveFaixa}
            corFaixa={corFaixa}
            mediaMensal={mediaMensal}
            projecao={projecao}
            ultimos={ultimos}
            onSituacao={seNaoArrastou(onSituacao)}
            onLancamentos={seNaoArrastou(onLancamentos)}
          />
        </div>
      </div>
    </div>

      <BolinhasIndicadoras pagina={pagina} irPara={irPara} />
    </div>
  );
}

function BolhaMensagem({ autor, texto, citando, onSegurar }) {
  const doUsuario = autor === "user";
  const timerRef = useRef(null);
  const [pressionada, setPressionada] = useState(false);

  function iniciarPressao() {
    setPressionada(true);
    timerRef.current = setTimeout(() => {
      setPressionada(false);
      onSegurar?.();
    }, 450);
  }
  function cancelarPressao() {
    setPressionada(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  }

  return (
    <div
      className="flex w-full"
      style={{ justifyContent: doUsuario ? "flex-end" : "flex-start" }}
    >
      <div
        className="relative"
        onTouchStart={iniciarPressao}
        onTouchEnd={cancelarPressao}
        onTouchMove={cancelarPressao}
        onTouchCancel={cancelarPressao}
        onMouseDown={iniciarPressao}
        onMouseUp={cancelarPressao}
        onMouseLeave={cancelarPressao}
        onContextMenu={(e) => { e.preventDefault(); onSegurar?.(); }}
        style={{
          maxWidth: "80%",
          padding: "10px 14px",
          borderRadius: doUsuario ? "18px 18px 5px 18px" : "18px 18px 18px 5px",
          background: doUsuario
            ? "linear-gradient(160deg, rgba(74,222,128,0.30) 0%, rgba(34,197,94,0.22) 55%, rgba(21,128,61,0.18) 100%)"
            : "linear-gradient(160deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 45%, rgba(255,255,255,0.02) 100%)",
          backdropFilter: "blur(18px) saturate(150%)",
          WebkitBackdropFilter: "blur(18px) saturate(150%)",
          border: doUsuario
            ? "1px solid rgba(74,222,128,0.35)"
            : "1px solid rgba(255,255,255,0.10)",
          boxShadow: doUsuario
            ? "inset 0 1px 0 0 rgba(255,255,255,0.22), 0 4px 14px rgba(0,0,0,0.28)"
            : "inset 0 1px 0 0 rgba(255,255,255,0.14), 0 4px 14px rgba(0,0,0,0.28)",
          color: "var(--text)",
          fontSize: 14.5,
          lineHeight: 1.4,
          whiteSpace: "pre-wrap",
          overflowWrap: "anywhere",
          wordBreak: "break-word",
          WebkitTouchCallout: "none",
          WebkitUserSelect: "none",
          MozUserSelect: "none",
          msUserSelect: "none",
          userSelect: "none",
          WebkitTapHighlightColor: "transparent",
          cursor: "pointer",
          transform: pressionada ? "scale(0.975)" : "scale(1)",
          filter: pressionada ? "brightness(1.18)" : "none",
          transition: "transform 420ms cubic-bezier(0.25,0.9,0.3,1), filter 420ms ease",
        }}
      >
        {citando && (
          <div
            className="rounded-lg"
            style={{
              padding: "6px 9px",
              marginBottom: 7,
              backgroundColor: "rgba(0,0,0,0.28)",
              borderLeft: "2.5px solid var(--primary)",
              color: "var(--text)",
              fontSize: 12.5,
              lineHeight: 1.35,
              opacity: 0.9,
              whiteSpace: "pre-wrap",
              overflowWrap: "anywhere",
              wordBreak: "break-word",
            }}
          >
            {citando}
          </div>
        )}
        {texto}
      </div>
    </div>
  );
}

/** Menu que abre ao segurar uma mensagem */
function MenuMensagem({ msg, onFechar, onCopiar, onEditar, onResponder }) {
  if (!msg) return null;
  const doUsuario = msg.autor === "user";

  const itens = [
    { Icon: Copy, label: "Copiar", acao: onCopiar },
    { Icon: CornerUpLeft, label: "Responder", acao: onResponder },
    ...(doUsuario ? [{ Icon: Pencil, label: "Editar", acao: onEditar }] : []),
  ];

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.45)", animation: "menuMsgFade 320ms ease-out" }}
      onClick={onFechar}
    >
      <style>{`
        @keyframes menuMsgFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes menuMsgPop {
          from { opacity: 0; transform: scale(0.94) translateY(6px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
      <div
        onClick={(e) => e.stopPropagation()}
        className="rounded-2xl overflow-hidden"
        style={{
          ...VIDRO_SUAVE,
          minWidth: 190,
          padding: 6,
          animation: "menuMsgPop 380ms cubic-bezier(0.25,0.9,0.3,1)",
        }}
      >
        {itens.map(({ Icon, label, acao }) => (
          <button
            key={label}
            type="button"
            onClick={() => { acao?.(); onFechar(); }}
            className="toque w-full flex items-center rounded-xl"
            style={{ gap: 11, padding: "11px 13px" }}
          >
            <Icon size={17} style={{ color: "var(--primary)" }} />
            <span style={{ color: "var(--text)", fontSize: 14.5 }}>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function FiscoDigitando() {
  return (
    <div className="flex w-full" style={{ justifyContent: "flex-start" }}>
      <div
        className="rounded-2xl flex items-center"
        style={{
          padding: "10px 14px",
          backgroundColor: "rgba(255,255,255,0.08)",
          gap: 4,
        }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="rounded-full"
            style={{
              width: 6,
              height: 6,
              backgroundColor: "var(--text-tertiary)",
              animation: "piscaFisco 1.1s infinite",
              animationDelay: `${i * 0.16}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function ChatFiscoExpandido({ aberto, onFechar, mensagens, digitando, onEnviar, onEditarMensagem }) {
  const [rascunho, setRascunho] = useState("");
  const [menuAnexo, setMenuAnexo] = useState(false);
  const [msgMenu, setMsgMenu] = useState(null);
  const [respondendo, setRespondendo] = useState(null);
  const [editando, setEditando] = useState(null);
  const fimRef = useRef(null);
  const inputChatRef = useRef(null);

  useEffect(() => {
    if (aberto) fimRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens, digitando, aberto]);

  if (!aberto) return null;

  function submeter(e) {
    e.preventDefault();
    const texto = rascunho.trim();
    if (!texto) return;
    if (editando) {
      onEditarMensagem?.(editando.id, texto);
      setEditando(null);
    } else {
      onEnviar(texto, respondendo);
    }
    setRespondendo(null);
    setRascunho("");
  }

  function copiarTexto(t) {
    try {
      navigator.clipboard?.writeText(t);
    } catch {}
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-stretch justify-center"
      style={{ background: "rgba(0,0,0,0.55)" }}
      onClick={onFechar}
    >
      <style>{`
        @keyframes piscaFisco {
          0%, 60%, 100% { opacity: 0.25; transform: translateY(0); }
          30% { opacity: 1; transform: translateY(-2px); }
        }
      `}</style>
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex flex-col"
        style={{
          ...VIDRO_CHAT,
          position: "absolute",
          top: 84,
          left: 12,
          right: 12,
          bottom: "calc(100px + env(safe-area-inset-bottom))",
          borderRadius: 28,
          overflow: "hidden",
        }}
      >
        <div
          className="flex items-center gap-3 shrink-0"
          style={{ padding: "14px 16px" }}
        >
          <span
            className="relative rounded-full overflow-hidden shrink-0 flex items-center justify-center"
            style={{ width: 40, height: 40, border: "1.5px solid rgba(34,197,94,0.45)" }}
          >
            <img
              src="/fisco-perfil.png"
              alt="Fisco"
              style={{ width: "108%", height: "108%", objectFit: "cover", objectPosition: "50% 18%" }}
            />
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-bold" style={{ color: "var(--text)", fontSize: 15 }}>Fisco</p>
            <p style={{ color: "var(--primary)", fontSize: 11.5 }}>● Online</p>
          </div>
          <button
            onClick={onFechar}
            aria-label="Fechar chat"
            className="toque rounded-full flex items-center justify-center shrink-0"
            style={{ width: 32, height: 32, backgroundColor: "rgba(255,255,255,0.08)" }}
          >
            <X size={16} style={{ color: "var(--text-secondary)" }} />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
          {mensagens.length === 0 && !digitando && (
            <p className="text-center" style={{ color: "var(--text-tertiary)", fontSize: 13.5, marginTop: 24 }}>
              Pergunte qualquer coisa sobre seu MEI.
            </p>
          )}
          {mensagens.map((m) => (
            <BolhaMensagem
              key={m.id}
              autor={m.autor}
              texto={m.texto}
              citando={m.citando}
              onSegurar={() => setMsgMenu(m)}
            />
          ))}
          {digitando && <FiscoDigitando />}
          <div ref={fimRef} />
        </div>

        <div className="shrink-0 relative" style={{ padding: 12 }}>
          {/* Contexto: respondendo ou editando */}
          {(respondendo || editando) && (
            <div
              className="flex items-center rounded-xl"
              style={{
                gap: 10,
                padding: "8px 10px",
                marginBottom: 8,
                backgroundColor: "rgba(255,255,255,0.06)",
                borderLeft: "3px solid var(--primary)",
              }}
            >
              <div className="flex-1 min-w-0">
                <p style={{ color: "var(--primary)", fontSize: 11.5, fontWeight: 700 }}>
                  {editando ? "Editando" : "Respondendo"}
                </p>
                <p
                  className="truncate"
                  style={{ color: "var(--text-secondary)", fontSize: 13 }}
                >
                  {(editando || respondendo).texto}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setRespondendo(null);
                  setEditando(null);
                  setRascunho("");
                }}
                aria-label="Cancelar"
                className="toque rounded-full flex items-center justify-center shrink-0"
                style={{ width: 26, height: 26, backgroundColor: "rgba(255,255,255,0.08)" }}
              >
                <X size={13} style={{ color: "var(--text-secondary)" }} />
              </button>
            </div>
          )}

          {/* Menu de anexos, abre acima do "+" */}
          {menuAnexo && (
            <>
              <div
                className="fixed inset-0"
                style={{ zIndex: 5 }}
                onClick={() => setMenuAnexo(false)}
              />
              <div
                className="absolute rounded-2xl overflow-hidden"
                style={{
                  ...VIDRO_SUAVE,
                  zIndex: 10,
                  left: 12,
                  bottom: 70,
                  minWidth: 178,
                  padding: 6,
                }}
              >
                {[
                  { Icon: Camera, label: "Foto" },
                  { Icon: ImageIcon, label: "Galeria" },
                  { Icon: FileText, label: "Documento" },
                  { Icon: ClipboardList, label: "Extrato" },
                ].map(({ Icon, label }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setMenuAnexo(false)}
                    className="toque w-full flex items-center rounded-xl"
                    style={{ gap: 11, padding: "10px 12px" }}
                  >
                    <Icon size={17} style={{ color: "var(--primary)" }} />
                    <span style={{ color: "var(--text)", fontSize: 14.5 }}>{label}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          <form onSubmit={submeter} className="flex items-center gap-2">
            {/* "+" FORA da barra, à esquerda */}
            <button
              type="button"
              onClick={() => setMenuAnexo((v) => !v)}
              aria-label="Anexar"
              className="toque rounded-full flex items-center justify-center shrink-0"
              style={{
                width: 44,
                height: 44,
                background:
                  "linear-gradient(160deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 50%, rgba(255,255,255,0.02) 100%)",
                backdropFilter: "blur(18px) saturate(150%)",
                WebkitBackdropFilter: "blur(18px) saturate(150%)",
                border: "1px solid rgba(255,255,255,0.12)",
                boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.16)",
                transform: menuAnexo ? "rotate(45deg)" : "none",
                transition: "transform 300ms cubic-bezier(0.25,0.9,0.3,1)",
              }}
            >
              <Plus size={21} strokeWidth={2.4} style={{ color: "var(--text)" }} />
            </button>

            {/* Barra maior, sem texto placeholder, com mic/avião DENTRO à direita */}
            <div
              className="flex-1 min-w-0 flex items-center rounded-full"
              onClick={() => inputChatRef.current?.focus()}
              style={{
                height: 52,
                paddingLeft: 18,
                paddingRight: 6,
                gap: 8,
                cursor: "text",
                background:
                  "linear-gradient(160deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 50%, rgba(255,255,255,0.02) 100%)",
                backdropFilter: "blur(18px) saturate(150%)",
                WebkitBackdropFilter: "blur(18px) saturate(150%)",
                border: "1px solid rgba(255,255,255,0.12)",
                boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.16)",
              }}
            >
              <input
                ref={inputChatRef}
                value={rascunho}
                onChange={(e) => setRascunho(e.target.value)}
                className="flex-1 min-w-0"
                style={{
                  background: "none",
                  border: "none",
                  outline: "none",
                  color: "var(--text)",
                  caretColor: "var(--primary)",
                  fontSize: 15,
                }}
              />

              {rascunho.trim() ? (
                <button
                  type="submit"
                  aria-label="Enviar"
                  className="toque rounded-full flex items-center justify-center shrink-0"
                  style={{ width: 40, height: 40 }}
                >
                  <Send size={20} strokeWidth={2.1} style={{ color: "var(--text)" }} />
                </button>
              ) : (
                <button
                  type="button"
                  aria-label="Gravar áudio"
                  className="toque rounded-full flex items-center justify-center shrink-0"
                  style={{ width: 40, height: 40 }}
                >
                  <Mic size={20} strokeWidth={2.1} style={{ color: "var(--text)" }} />
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      <MenuMensagem
        msg={msgMenu}
        onFechar={() => setMsgMenu(null)}
        onCopiar={() => copiarTexto(msgMenu?.texto || "")}
        onResponder={() => {
          setRespondendo(msgMenu);
          setEditando(null);
          setTimeout(() => inputChatRef.current?.focus(), 50);
        }}
        onEditar={() => {
          setEditando(msgMenu);
          setRespondendo(null);
          setRascunho(msgMenu?.texto || "");
          setTimeout(() => inputChatRef.current?.focus(), 50);
        }}
      />
    </div>
  );
}

function CaixaFiscoExpandida({ onFechar, onEnviarPrimeira }) {
  const [rascunho, setRascunho] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function submeter(e) {
    e.preventDefault();
    const texto = rascunho.trim();
    if (!texto) return;
    onEnviarPrimeira(texto);
    setRascunho("");
  }

  return (
    <form
      onSubmit={submeter}
      onClick={() => inputRef.current?.focus()}
      className="rounded-3xl flex flex-col"
      style={{
        ...VIDRO_SUAVE,
        background:
          "linear-gradient(160deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 24%, rgba(255,255,255,0) 58%), rgba(8,8,10,0.22)",
        padding: 14,
        gap: 10,
        cursor: "text",
      }}
    >
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={onFechar}
          aria-label="Fechar"
          className="toque rounded-full flex items-center justify-center shrink-0"
          style={{ width: 26, height: 26, backgroundColor: "rgba(255,255,255,0.08)" }}
        >
          <X size={14} style={{ color: "var(--text-secondary)" }} />
        </button>
      </div>

      <textarea
        ref={inputRef}
        value={rascunho}
        onChange={(e) => setRascunho(e.target.value)}
        rows={2}
        className="w-full resize-none"
        style={{
          background: "none",
          border: "none",
          outline: "none",
          color: "var(--text)",
          caretColor: "var(--primary)",
          fontSize: 15,
          fontFamily: "inherit",
        }}
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center" style={{ gap: 6 }}>
          <button
            type="button"
            onClick={(e) => e.stopPropagation()}
            aria-label="Tirar foto"
            className="toque rounded-full flex items-center justify-center"
            style={{
              width: 36,
              height: 36,
              backgroundColor: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.10)",
            }}
          >
            <Camera size={17} style={{ color: "var(--text)" }} />
          </button>
          <button
            type="button"
            onClick={(e) => e.stopPropagation()}
            aria-label="Galeria"
            className="toque rounded-full flex items-center justify-center"
            style={{
              width: 36,
              height: 36,
              backgroundColor: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.10)",
            }}
          >
            <ImageIcon size={17} style={{ color: "var(--text)" }} />
          </button>
          <button
            type="button"
            onClick={(e) => e.stopPropagation()}
            aria-label="Documento"
            className="toque rounded-full flex items-center justify-center"
            style={{
              width: 36,
              height: 36,
              backgroundColor: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.10)",
            }}
          >
            <FileText size={17} style={{ color: "var(--text)" }} />
          </button>
        </div>

        {rascunho.trim() ? (
          <button
            type="submit"
            aria-label="Enviar"
            className="toque rounded-full flex items-center justify-center shrink-0"
            style={{ width: 38, height: 38 }}
          >
            <Send size={21} strokeWidth={2.1} style={{ color: "var(--primary)" }} />
          </button>
        ) : (
          <button
            type="button"
            onClick={(e) => e.stopPropagation()}
            aria-label="Gravar áudio"
            className="toque rounded-full flex items-center justify-center shrink-0"
            style={{ width: 38, height: 38 }}
          >
            <Mic size={21} strokeWidth={2.1} style={{ color: "var(--primary)" }} />
          </button>
        )}
      </div>
    </form>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const {
    nome, tipoMEI, lancamentos, faturamentoAtual, limiteAtual, percentualAtual,
    mediaMensal, projecaoFimDoAno,
  } = useAppState();

  const rotuloPerfil = LABEL_TIPO[tipoMEI];
  const saudacao = saudacaoPorHora();

  const [caixaExpandida, setCaixaExpandida] = useState(false);
  const [chatAberto, setChatAberto] = useState(false);
  const [mensagens, setMensagens] = useState([]);
  const [digitando, setDigitando] = useState(false);

  function responderComoFisco() {
    setDigitando(true);
    setTimeout(() => {
      setDigitando(false);
      setMensagens((m) => [
        ...m,
        {
          id: Date.now() + 1,
          autor: "fisco",
          texto: "Ainda estou aprendendo a responder de verdade, mas em breve vou te ajudar com isso!",
        },
      ]);
    }, 1400);
  }

  function enviarPrimeiraMensagem(texto) {
    const minhaMsg = { id: Date.now(), autor: "user", texto };
    setMensagens([minhaMsg]);
    setCaixaExpandida(false);
    setChatAberto(true);
    responderComoFisco();
  }

  function enviarMensagem(texto, respondendo) {
    const minhaMsg = {
      id: Date.now(),
      autor: "user",
      texto,
      ...(respondendo ? { citando: respondendo.texto } : {}),
    };
    setMensagens((m) => [...m, minhaMsg]);
    responderComoFisco();
  }

  function editarMensagem(id, novoTexto) {
    setMensagens((m) =>
      m.map((msg) => (msg.id === id ? { ...msg, texto: novoTexto } : msg)),
    );
  }

  const ultimos = useMemo(
    () =>
      [...lancamentos]
        .sort((a, b) => new Date(b.data) - new Date(a.data))
        .slice(0, 2),
    [lancamentos],
  );

  return (
    <div
      className="tela-fixa w-full flex flex-col"
      style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
    >
      <div
        className="flex-1 flex flex-col min-h-0"
        style={{ paddingBottom: "calc(76px + env(safe-area-inset-bottom))" }}
      >
        <header className="px-5 pt-4 pb-1 flex items-start justify-between shrink-0">
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2.5">
              <Gauge size={34} style={{ color: "var(--primary)" }} strokeWidth={2.2} className="shrink-0" />
              <span
                className="font-bold text-2xl leading-none"
                style={{ color: "var(--text)" }}
              >
                Ta<span style={{ color: "var(--primary)" }}>Certo!</span>
              </span>
            </div>
            <div className="flex items-baseline gap-1.5 min-w-0" style={{ marginTop: 6 }}>
              <span
                className="font-semibold shrink-0"
                style={{ color: "var(--text-secondary)", fontSize: 14, letterSpacing: "0.01em" }}
              >
                {saudacao.replace(/,\s*$/, "")}
              </span>
              <span
                className="font-extrabold leading-none truncate"
                style={{ color: "var(--text)", fontSize: 19 }}
              >
                {nome ? truncarNome(nome) : "Bem-vindo"}
              </span>
            </div>
          </div>

          <button
            onClick={() => navigate("/alertas")}
            aria-label="Notificações"
            className="toque relative w-11 h-11 rounded-full flex items-center justify-center shrink-0"
            style={{ ...VIDRO }}
          >
            <Bell size={20} style={{ color: "var(--text)" }} />
            <span
              className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full"
              style={{ backgroundColor: "var(--danger)" }}
              aria-hidden
            />
          </button>
        </header>

        <div className="px-5 pt-2 flex-1 flex flex-col min-h-0 relative">
          <CardVelocimetroCarrossel
            rotuloPerfil={rotuloPerfil}
            percentual={percentualAtual}
            faturado={faturamentoAtual}
            limite={limiteAtual}
            mediaMensal={mediaMensal}
            projecao={projecaoFimDoAno}
            ultimos={ultimos}
            onSituacao={() => setChatAberto(true)}
            onLancamentos={() => navigate("/historico")}
            onResumo={() => navigate("/perfil/resumo")}
            onExcedente={() => navigate("/regra-vinte")}
          />

          {caixaExpandida && (
            <div
              className="absolute z-40"
              style={{ left: 20, right: 20, bottom: 12 }}
            >
              <CaixaFiscoExpandida
                onFechar={() => setCaixaExpandida(false)}
                onEnviarPrimeira={enviarPrimeiraMensagem}
              />
            </div>
          )}

          <button
            onClick={() => setCaixaExpandida(true)}
            className="shrink-0 w-full flex items-start gap-2"
            style={{
              background: "none",
              border: "none",
              padding: 0,
              marginTop: 4,
              marginBottom: 12,
              visibility: caixaExpandida ? "hidden" : "visible",
            }}
          >
              <span
                className="relative shrink-0 rounded-full flex items-center justify-center"
                style={{
                  width: 96,
                  height: 96,
                  ...VIDRO,
                  border: "1.5px solid rgba(34,197,94,0.45)",
                }}
              >
                <span className="rounded-full overflow-hidden flex items-center justify-center" style={{ width: "100%", height: "100%" }}>
                  <img
                    src="/fisco-perfil.png"
                    alt="Fisco"
                    style={{
                      width: "108%",
                      height: "108%",
                      objectFit: "cover",
                      objectPosition: "50% 18%",
                    }}
                  />
                </span>
                <span
                  className="absolute rounded-full"
                  style={{
                    width: 26,
                    height: 26,
                    backgroundColor: "var(--primary)",
                    border: "4px solid var(--bg)",
                    bottom: 2,
                    right: 2,
                  }}
                />
              </span>

              <span
                className="toque flex-1 flex items-center gap-2 text-left min-w-0 rounded-full"
                style={{
                  ...VIDRO_SUAVE,
                  height: 48,
                  paddingLeft: 18,
                  paddingRight: 12,
                  marginTop: 24,
                }}
              >
                <span
                  className="flex-1 truncate"
                  style={{
                    color: "var(--text-tertiary)",
                    fontSize: 15,
                    fontStyle: "italic",
                    fontFamily: '"Comic Neue", "Chalkboard SE", "Comic Sans MS", cursive',
                  }}
                >
                  Pergunte ao Fisco...
                </span>

                <Send
                  size={22}
                  strokeWidth={2.2}
                  className="shrink-0"
                  style={{ color: "var(--primary)" }}
                />
              </span>
            </button>
        </div>
      </div>

      <ChatFiscoExpandido
        aberto={chatAberto}
        onFechar={() => setChatAberto(false)}
        mensagens={mensagens}
        digitando={digitando}
        onEnviar={enviarMensagem}
        onEditarMensagem={editarMensagem}
      />

      <BottomNav ativo="inicio" />
    </div>
  );
}