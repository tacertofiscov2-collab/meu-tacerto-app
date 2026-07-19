import { useNavigate } from "react-router-dom";
import { useRef, useState } from "react";
import { Bell, Gauge, MessageCircle, ChevronRight } from "lucide-react";
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

function BolinhasIndicadoras({ pagina, setPagina }) {
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
            backgroundColor:
              pagina === i ? "var(--primary)" : "var(--text-secondary)",
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
  onCTAChat,
}) {
  const [pagina, setPagina] = useState(0);
  const startX = useRef(null);
  const dragging = useRef(false);

  const chaveFaixa = faixaDoVelocimetro(percentual);
  const info = FAIXA_INFO[chaveFaixa];

  const onStart = (x) => {
    startX.current = x;
    dragging.current = true;
  };
  const onEnd = (x) => {
    if (!dragging.current || startX.current == null) return;
    const delta = x - startX.current;
    dragging.current = false;
    if (Math.abs(delta) > 50) {
      if (delta < 0 && pagina === 0) setPagina(1);
      else if (delta > 0 && pagina === 1) setPagina(0);
    }
    startX.current = null;
  };

  return (
    <div
      className="relative w-full flex-1 rounded-3xl overflow-hidden flex flex-col"
      style={{
        background:
          "linear-gradient(160deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 55%, rgba(255,255,255,0) 100%), var(--surface)",
        border: "1px solid rgba(63,63,70,0.6)",
        boxShadow:
          "0 10px 30px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)",
      }}
      onTouchStart={(e) => onStart(e.touches[0].clientX)}
      onTouchEnd={(e) => onEnd(e.changedTouches[0].clientX)}
      onMouseDown={(e) => onStart(e.clientX)}
      onMouseUp={(e) => onEnd(e.clientX)}
      onMouseLeave={(e) => dragging.current && onEnd(e.clientX)}
    >
      {/* Topo comum */}
      <div className="flex items-center justify-between px-5 pt-4 shrink-0">
        <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
          {rotuloPerfil}
        </span>
        <BolinhasIndicadoras pagina={pagina} setPagina={setPagina} />
      </div>

      {/* Carrossel */}
      <div className="flex-1 overflow-hidden">
        <div
          className="flex h-full"
          style={{
            width: "200%",
            transform: `translateX(${pagina === 0 ? "0%" : "-50%"})`,
            transition: "transform 300ms ease-in-out",
          }}
        >
          {/* Tela A */}
          <div className="w-1/2 h-full flex flex-col px-5 pb-4">
            <div className="flex-1 flex items-center justify-center">
              <VelocimetroAnimado percentual={percentual} maxWidth={220} />
            </div>
            <div
              className="grid grid-cols-3 pt-3 mt-2"
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

          {/* Tela B */}
          <div className="w-1/2 h-full flex flex-col px-5 pb-4 pt-2">
            <h3
              className="text-center font-semibold"
              style={{ color: "var(--text)", fontSize: 19 }}
            >
              Sua situação hoje
            </h3>
            <div className="flex-1 flex items-center justify-center">
              <p
                className="text-center text-sm leading-relaxed px-2"
                style={{ color: "var(--text)" }}
              >
                {info.textoDetalhado(percentual)}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCTAChat();
              }}
              className="text-center text-sm mt-2 hover:opacity-80"
              style={{ color: "var(--text-secondary)" }}
            >
              Ainda com dúvidas? Pergunte ao Assistente Fiscal IA →
            </button>
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
      className="relative w-full flex-1 rounded-3xl px-5 py-5 text-left flex items-center gap-4 transition-transform active:scale-[0.99]"
      style={{
        backgroundColor: "var(--surface)",
        border: "1px solid var(--border)",
      }}
    >
      <ChevronRight
        size={20}
        className="absolute top-4 right-4"
        style={{ color: "var(--text-secondary)" }}
        aria-hidden
      />
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: "var(--field)" }}
      >
        <MessageCircle size={32} style={{ color: "var(--primary)" }} strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0 pr-6">
        <p
          className="font-semibold"
          style={{ color: "var(--text)", fontSize: 18 }}
        >
          Assistente Fiscal IA
        </p>
        <p
          className="text-[13px] leading-snug mt-1"
          style={{ color: "var(--text-secondary)" }}
        >
          Tire dúvidas, envie extratos e receba orientação personalizada
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
      className="min-h-[100dvh] w-full flex flex-col"
      style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
    >
      <div
        className="flex-1 flex flex-col"
        style={{ paddingBottom: "calc(104px + env(safe-area-inset-bottom))" }}
      >
        <header className="px-5 pt-4 pb-2 flex items-start justify-between">
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

        {/* 2 cards grandes com mesma altura */}
        <div className="px-5 pt-3 flex-1 flex flex-col gap-3">
          <CardVelocimetroCarrossel
            rotuloPerfil={rotuloPerfil}
            percentual={percentual}
            faturado={faturado}
            limite={limite}
            restante={restante}
            onCTAChat={() => navigate("/chat")}
          />
          <CardChatIA onClick={() => navigate("/chat")} />
        </div>
      </div>

      <BottomNav ativo="inicio" />
    </div>
  );
}
