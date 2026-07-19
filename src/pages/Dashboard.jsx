import { useNavigate } from "react-router-dom";
import { useRef, useState } from "react";
import { Bell, Gauge, Sparkles, ChevronRight } from "lucide-react";
import BottomNav from "../components/BottomNav.jsx";
import Valor from "../components/Valor.jsx";
import VelocimetroAnimado from "../components/VelocimetroAnimado.jsx";
import { useUserState } from "@/lib/userState";
import {
  LABEL_TIPO,
  calcularPercentual,
  calcularFaltamOuExcedeu,
  faixaDoVelocimetro,
  FAIXA_INFO,
} from "@/lib/fiscal";

function saudacaoPorHora() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "Bom dia,";
  if (h >= 12 && h < 18) return "Boa tarde,";
  return "Boa noite,";
}

// Aplica opacidade a uma cor hex #rrggbb → rgba(r,g,b,alpha)
function hexToRgba(hex, alpha) {
  const h = String(hex).replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function BolinhasIndicadoras({ pagina, setPagina, corAtiva }) {
  return (
    <div className="flex items-center gap-1.5">
      {[0, 1].map((i) => (
        <button
          key={i}
          onClick={(e) => {
            e.stopPropagation();
            setPagina(i);
          }}
          aria-label={`Ir para tela ${i + 1}`}
          className="rounded-full transition-colors"
          style={{
            width: 8,
            height: 8,
            backgroundColor: pagina === i ? corAtiva : "var(--text-secondary)",
            opacity: pagina === i ? 1 : 0.6,
          }}
        />
      ))}
    </div>
  );
}

function CardVelocimetroCarrossel({
  rotuloPerfil,
  percentual,
  faturado,
  limite,
  restante,
}) {
  const [pagina, setPagina] = useState(0);
  const containerRef = useRef(null);
  const startX = useRef(null);
  const startY = useRef(null);
  const startTime = useRef(0);
  const dragging = useRef(false);
  const eixo = useRef(null); // 'x' ou 'y' após primeiro delta
  const [dragOffset, setDragOffset] = useState(0);

  const chaveFaixa = faixaDoVelocimetro(percentual);
  const info = FAIXA_INFO[chaveFaixa];
  const corFaixa = info.cor;

  // Largura do container pra converter delta em % de translate
  const larguraCont = () =>
    containerRef.current ? containerRef.current.clientWidth : 1;

  const onStart = (x, y) => {
    startX.current = x;
    startY.current = y;
    startTime.current = Date.now();
    dragging.current = true;
    eixo.current = null;
    setDragOffset(0);
  };
  const onMove = (x, y) => {
    if (!dragging.current || startX.current == null) return;
    const dx = x - startX.current;
    const dy = y - startY.current;
    // Detecta eixo após ~8px de movimento; se for vertical, cancela drag horizontal
    if (eixo.current == null) {
      if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
        eixo.current = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
        if (eixo.current === "y") dragging.current = false;
      }
    }
    if (eixo.current === "x") {
      // Bloqueia arrasto além dos limites: bounce parcial se já está no extremo
      let d = dx;
      if (pagina === 0 && d > 0) d = d * 0.25;
      if (pagina === 1 && d < 0) d = d * 0.25;
      setDragOffset(d);
    }
  };
  const onEnd = (x) => {
    if (!dragging.current || startX.current == null) {
      // Reset visual mesmo se drag foi cancelado (eixo=y)
      setDragOffset(0);
      dragging.current = false;
      startX.current = null;
      startY.current = null;
      eixo.current = null;
      return;
    }
    const dx = x - startX.current;
    const dt = Date.now() - startTime.current;
    const velocidade = Math.abs(dx) / Math.max(1, dt); // px/ms
    const threshold = larguraCont() * 0.5; // passou do meio
    const isFlick = velocidade > 0.5 && Math.abs(dx) > 30; // gesto rápido

    let novaPagina = pagina;
    if (dx < 0 && (Math.abs(dx) > threshold || isFlick) && pagina === 0) {
      novaPagina = 1;
    } else if (dx > 0 && (Math.abs(dx) > threshold || isFlick) && pagina === 1) {
      novaPagina = 0;
    }
    setPagina(novaPagina);
    setDragOffset(0);
    dragging.current = false;
    startX.current = null;
    startY.current = null;
    eixo.current = null;
  };

  // Estilo do card: fundo neutro na tela A, tematizado na tela B
  const naTelaB = pagina === 1;
  const bgCard = naTelaB
    ? {
        // Fundo suave tematizado + halo do topo
        background: `linear-gradient(160deg, ${hexToRgba(corFaixa, 0.18)} 0%, ${hexToRgba(corFaixa, 0.08)} 55%, ${hexToRgba(corFaixa, 0.04)} 100%), var(--surface)`,
        border: `1px solid ${hexToRgba(corFaixa, 0.35)}`,
      }
    : {
        background:
          "linear-gradient(160deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 55%, rgba(255,255,255,0) 100%), var(--surface)",
        border: "1px solid rgba(63,63,70,0.6)",
      };

  // Translate: se está arrastando, mistura pagina base + offset em %
  const larg = larguraCont();
  const offsetPct = larg ? (dragOffset / larg) * 50 : 0; // 50 porque wrapper é 200%
  const translateX = pagina === 0 ? offsetPct : -50 + offsetPct;
  const usarTransicao = !dragging.current;

  return (
    <div
      ref={containerRef}
      data-carrossel-velocimetro
      className="relative w-full flex-1 rounded-3xl overflow-hidden flex flex-col"
      style={{
        ...bgCard,
        boxShadow:
          "0 10px 30px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)",
        transition: "background 300ms ease, border-color 300ms ease",
      }}
      onTouchStart={(e) => onStart(e.touches[0].clientX, e.touches[0].clientY)}
      onTouchMove={(e) => onMove(e.touches[0].clientX, e.touches[0].clientY)}
      onTouchEnd={(e) => onEnd(e.changedTouches[0].clientX)}
      onMouseDown={(e) => onStart(e.clientX, e.clientY)}
      onMouseMove={(e) => {
        if (dragging.current) onMove(e.clientX, e.clientY);
      }}
      onMouseUp={(e) => onEnd(e.clientX)}
      onMouseLeave={(e) => {
        if (dragging.current) onEnd(e.clientX);
      }}
    >
      {/* Topo comum — só na tela A mostra "MEI/MEI Caminhoneiro"; na tela B fica só as bolinhas */}
      <div className="flex items-center justify-between px-5 pt-4 shrink-0">
        <span
          className="text-sm"
          style={{
            color: "var(--text-secondary)",
            visibility: naTelaB ? "hidden" : "visible",
          }}
        >
          {rotuloPerfil}
        </span>
        <BolinhasIndicadoras
          pagina={pagina}
          setPagina={setPagina}
          corAtiva={corFaixa}
        />
      </div>

      {/* Carrossel */}
      <div className="flex-1 overflow-hidden">
        <div
          className="flex h-full"
          style={{
            width: "200%",
            transform: `translateX(${translateX}%)`,
            transition: usarTransicao
              ? "transform 300ms ease-in-out"
              : "none",
          }}
        >
          {/* Tela A */}
          <div className="w-1/2 h-full flex flex-col px-5 pb-4">
            <div className="flex-1 flex items-center justify-center">
              <VelocimetroAnimado percentual={percentual} maxWidth={220} />
            </div>
            <div
              className="grid grid-cols-3 pt-3 mt-auto"
              style={{ borderTop: "1px solid var(--border)" }}
            >
              {[
                { valor: faturado, label: "Faturado", cor: undefined },
                { valor: limite, label: "Limite", cor: undefined },
                {
                  valor: restante.valor,
                  label: restante.tipo === "excedeu" ? "Excedeu" : "Faltam",
                  cor: restante.tipo === "excedeu" ? "#ef4444" : undefined,
                },
              ].map((c, i) => (
                <div
                  key={c.label}
                  className={
                    "flex flex-col items-center text-center min-w-0 " +
                    (i > 0 ? "border-l" : "")
                  }
                  style={{
                    paddingLeft: 8,
                    paddingRight: 8,
                    ...(i > 0 ? { borderColor: "var(--border)" } : {}),
                  }}
                >
                  <Valor tamanho="sm" cor={c.cor} autoAjustar>
                    {c.valor}
                  </Valor>
                  <span
                    className="text-xs mt-1"
                    style={{ color: c.cor || "var(--text-secondary)" }}
                  >
                    {c.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Tela B — sem "MEI...", título com cor da faixa, texto ocupa o card */}
          <div className="w-1/2 h-full flex flex-col px-5 pb-4 pt-1">
            <h3
              className="text-center font-bold"
              style={{ color: corFaixa, fontSize: 20 }}
            >
              Sua situação hoje
            </h3>
            <div className="flex-1 flex items-center justify-center">
              <p
                className="text-center text-[15px] leading-relaxed px-1"
                style={{ color: "var(--text)" }}
              >
                {info.textoDetalhado(percentual)}
              </p>
            </div>
            <p
              className="text-center text-xs px-2 pb-1"
              style={{ color: "var(--text-secondary)" }}
            >
              Se ainda houver alguma dúvida sobre sua situação atual, consulte no Assistente IA.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function CardChatIA({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="relative w-full flex-1 rounded-3xl px-5 text-left flex items-center gap-4 transition-transform active:scale-[0.99]"
      style={{
        backgroundColor: "var(--surface)",
        border: "1px solid var(--border)",
        minHeight: 96,
      }}
    >
      <ChevronRight
        size={20}
        className="absolute top-1/2 right-4 -translate-y-1/2"
        style={{ color: "var(--text-secondary)" }}
        aria-hidden
      />
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: "var(--field)" }}
      >
        <Sparkles size={30} style={{ color: "var(--primary)" }} strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0 pr-6 flex items-center">
        <p
          className="font-semibold"
          style={{ color: "var(--text)", fontSize: 18 }}
        >
          Assistente Fiscal IA
        </p>
      </div>
    </button>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { nome, tipo, faturado, limite } = useUserState();

  const restante = calcularFaltamOuExcedeu(faturado, limite);
  const percentual = calcularPercentual(faturado, limite);
  const rotuloPerfil = LABEL_TIPO[tipo];
  const saudacao = saudacaoPorHora();

  return (
    <div
      className="w-full flex flex-col"
      style={{
        backgroundColor: "var(--bg)",
        color: "var(--text)",
        height: "100dvh",
        overflow: "hidden",
      }}
    >
      <div
        className="flex-1 flex flex-col min-h-0"
        style={{ paddingBottom: "calc(96px + env(safe-area-inset-bottom))" }}
      >
        <header className="px-5 pt-4 pb-2 flex items-start justify-between shrink-0">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2.5">
              <Gauge size={34} style={{ color: "var(--primary)" }} strokeWidth={2.2} />
              <span className="font-bold text-2xl leading-none" style={{ color: "var(--text)" }}>
                Ta<span style={{ color: "var(--primary)" }}>Certo!</span>
              </span>
            </div>
            <div className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
              {saudacao}{nome ? " " : "!"}
              {nome && (
                <span className="text-base font-semibold" style={{ color: "var(--text)" }}>
                  {nome}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={() => navigate("/alertas")}
            aria-label="Notificações"
            className="relative w-11 h-11 rounded-full flex items-center justify-center hover:opacity-80 shrink-0"
            style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <Bell size={20} style={{ color: "var(--text)" }} />
            <span
              className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full"
              style={{ backgroundColor: "var(--danger)" }}
              aria-hidden
            />
          </button>
        </header>

        {/* 2 cards com altura livre, sem rolagem */}
        <div className="px-5 pt-3 flex-1 flex flex-col gap-3 min-h-0">
          <CardVelocimetroCarrossel
            rotuloPerfil={rotuloPerfil}
            percentual={percentual}
            faturado={faturado}
            limite={limite}
            restante={restante}
          />
          <CardChatIA onClick={() => navigate("/chat")} />
        </div>
      </div>

      <BottomNav ativo="inicio" />
    </div>
  );
}