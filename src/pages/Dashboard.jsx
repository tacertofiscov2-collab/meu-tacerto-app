import { useNavigate } from "react-router-dom";
import { useRef, useState, useEffect } from "react";
import { Bell, Gauge, ArrowUp } from "lucide-react";
import BottomNav from "../components/BottomNav.jsx";
import Valor from "../components/Valor.jsx";
import VelocimetroAnimado from "../components/VelocimetroAnimado.jsx";
import Fisco from "../components/Fisco.jsx";
import { useUserState } from "@/lib/userState";
import {
  LABEL_TIPO,
  calcularPercentual,
  faixaDoVelocimetro,
  FAIXA_INFO,
} from "@/lib/fiscal";

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

function poseDaFaixa(faixa) {
  if (faixa === "tranquilo" || faixa === "fique_de_olho") return "joinha";
  if (faixa === "atencao" || faixa === "perto_do_limite") return "ok";
  return "alerta";
}

function frasePose(pose) {
  if (pose === "joinha") return "Tá tudo certo por aqui!";
  if (pose === "ok") return "Fica de olho, hein?";
  return "Precisamos conversar...";
}

function BolinhasIndicadoras({ pagina, irPara, corAtiva }) {
  return (
    <div className="flex items-center gap-1.5">
      {[0, 1].map((i) => (
        <button
          key={i}
          onClick={(e) => {
            e.stopPropagation();
            irPara(i);
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

function CardVelocimetroCarrossel({ rotuloPerfil, percentual, faturado, limite }) {
  const [pagina, setPagina] = useState(0);
  const [dragPx, setDragPx] = useState(0);
  const [arrastando, setArrastando] = useState(false);

  const containerRef = useRef(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const startTime = useRef(0);
  const ativo = useRef(false);
  const eixo = useRef(null);
  const paginaRef = useRef(0);

  useEffect(() => {
    paginaRef.current = pagina;
  }, [pagina]);

  const chaveFaixa = faixaDoVelocimetro(percentual);
  const corFaixa = FAIXA_INFO[chaveFaixa].cor;

  function largura() {
    return containerRef.current?.clientWidth || 1;
  }

  function inicio(x, y) {
    startX.current = x;
    startY.current = y;
    startTime.current = Date.now();
    ativo.current = true;
    eixo.current = null;
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

    if (eixo.current === "x") setDragPx(dx);
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

    if (passouMeio || flick) {
      setPagina((p) => (p === 0 ? 1 : 0));
    }
  }

  function irPara(i) {
    setDragPx(0);
    setArrastando(false);
    setPagina(i);
  }

  const naTelaB = pagina === 1;
  const bgCard = naTelaB
    ? {
        background: `linear-gradient(160deg, ${hexToRgba(corFaixa, 0.18)} 0%, ${hexToRgba(corFaixa, 0.08)} 55%, ${hexToRgba(corFaixa, 0.04)} 100%), var(--surface)`,
        border: `1px solid ${hexToRgba(corFaixa, 0.35)}`,
      }
    : {
        background:
          "linear-gradient(160deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 55%, rgba(255,255,255,0) 100%), var(--surface)",
        border: "1px solid var(--border)",
      };

  const larg = largura();
  const basePct = pagina === 0 ? 0 : -50;
  const dragPct = larg ? (dragPx / larg) * 50 : 0;
  const translate = basePct + dragPct;

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
        <BolinhasIndicadoras pagina={pagina} irPara={irPara} corAtiva={corFaixa} />
      </div>

      <div className="flex-1 overflow-hidden">
        <div
          className="flex h-full"
          style={{
            width: "200%",
            transform: `translateX(${translate}%)`,
            transition: arrastando ? "none" : "transform 300ms ease-in-out",
          }}
        >
          <div className="w-1/2 h-full flex flex-col px-5 pb-4">
            <div className="flex-1 flex items-center justify-center">
              <VelocimetroAnimado percentual={percentual} maxWidth={220} />
            </div>
            <div
              className="grid grid-cols-2 pt-3 mt-auto"
              style={{ borderTop: "1px solid var(--border)" }}
            >
              {[
                { valor: faturado, label: "Faturado" },
                { valor: limite, label: "Limite" },
              ].map((c, i) => (
                <div
                  key={c.label}
                  className={
                    "flex flex-col items-center text-center min-w-0 " +
                    (i > 0 ? "border-l" : "")
                  }
                  style={{
                    paddingLeft: 12,
                    paddingRight: 12,
                    ...(i > 0 ? { borderColor: "var(--border)" } : {}),
                  }}
                >
                  <Valor tamanho="md" autoAjustar>
                    {c.valor}
                  </Valor>
                  <span
                    className="text-xs mt-1"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {c.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="w-1/2 h-full flex flex-col px-5 pb-4" />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { nome, tipo, faturado, limite } = useUserState();
  const [animarFisco, setAnimarFisco] = useState(false);

  const percentual = calcularPercentual(faturado, limite);
  const rotuloPerfil = LABEL_TIPO[tipo];
  const saudacao = saudacaoPorHora();
  const faixa = faixaDoVelocimetro(percentual);
  const pose = poseDaFaixa(faixa);

  useEffect(() => {
    setAnimarFisco(false);
    const t = setTimeout(() => setAnimarFisco(true), 400);
    return () => clearTimeout(t);
  }, []);

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
        style={{ paddingBottom: "calc(108px + env(safe-area-inset-bottom))" }}
      >
        <header className="px-5 pt-4 pb-1 flex items-start justify-between shrink-0">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2.5">
              <Gauge size={32} style={{ color: "var(--primary)" }} strokeWidth={2.2} />
              <span
                className="font-bold text-2xl leading-none"
                style={{ color: "var(--text)" }}
              >
                Ta<span style={{ color: "var(--primary)" }}>Certo!</span>
              </span>
            </div>
            <div className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
              {saudacao}
              {nome ? " " : "!"}
              {nome && (
                <span
                  className="text-base font-semibold"
                  style={{ color: "var(--text)" }}
                >
                  {nome}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={() => navigate("/alertas")}
            aria-label="Notificações"
            className="relative w-11 h-11 rounded-full flex items-center justify-center hover:opacity-80 shrink-0"
            style={{
              backgroundColor: "var(--surface)",
              border: "1px solid var(--border)",
            }}
          >
            <Bell size={20} style={{ color: "var(--text)" }} />
            <span
              className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full"
              style={{ backgroundColor: "var(--danger)" }}
              aria-hidden
            />
          </button>
        </header>

        <div className="px-5 pt-2 flex-1 flex flex-col gap-2 min-h-0">
          <CardVelocimetroCarrossel
            rotuloPerfil={rotuloPerfil}
            percentual={percentual}
            faturado={faturado}
            limite={limite}
          />

          <button
            onClick={() => navigate("/chat")}
            className="shrink-0 flex items-end gap-2 active:opacity-90 transition"
            style={{ background: "none", border: "none", padding: 0 }}
          >
            <Fisco size={92} pose={pose} animar={animarFisco} />
            <div className="flex-1 flex flex-col items-start gap-1.5 pb-2 min-w-0">
              <span
                className="text-xs px-3 py-1.5 rounded-2xl rounded-bl-sm"
                style={{
                  backgroundColor: "var(--surface)",
                  border: "1px solid var(--border)",
                  color: "var(--text-secondary)",
                }}
              >
                {frasePose(pose)}
              </span>
              <span
                className="w-full rounded-full px-4 py-2.5 flex items-center gap-2 text-left"
                style={{
                  backgroundColor: "var(--surface)",
                  border: "1px solid var(--border)",
                }}
              >
                <span
                  className="flex-1 text-sm truncate"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Pergunte ao Fisco...
                </span>
                <span
                  className="rounded-full flex items-center justify-center shrink-0"
                  style={{
                    width: 30,
                    height: 30,
                    backgroundColor: "var(--primary)",
                  }}
                >
                  <ArrowUp size={16} style={{ color: "var(--primary-contrast)" }} />
                </span>
              </span>
            </div>
          </button>
        </div>
      </div>

      <BottomNav ativo="inicio" />
    </div>
  );
}