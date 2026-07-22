import { useNavigate } from "react-router-dom";
import { useRef, useState, useMemo } from "react";
import { Bell, Gauge, ArrowUp, TrendingUp, ChevronRight, Receipt } from "lucide-react";
import BottomNav from "../components/BottomNav.jsx";
import Valor from "../components/Valor.jsx";
import VelocimetroAnimado from "../components/VelocimetroAnimado.jsx";
import Fisco from "../components/Fisco.jsx";
import { useAppState } from "@/context/AppStateContext";
import {
  LABEL_TIPO, faixaDoVelocimetro, FAIXA_INFO, FAIXAS_ORDEM, FAIXA_RANGE_LABEL,
  truncarNome,
} from "@/lib/fiscal";

const MESES_CURTO = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
];

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

/** MUD 9 — bolinhas flutuando por cima, translúcidas, sem ocupar espaço */
function BolinhasIndicadoras({ pagina, irPara, corAtiva, flutuante }) {
  return (
    <div
      className={
        "flex items-center gap-1.5 " +
        (flutuante ? "absolute top-3 right-4 z-10" : "")
      }
      style={flutuante ? { opacity: 0.55 } : undefined}
    >
      {[0, 1].map((i) => (
        <button
          key={i}
          onClick={(e) => { e.stopPropagation(); irPara(i); }}
          aria-label={`Ir para tela ${i + 1}`}
          className="rounded-full transition-colors"
          style={{
            width: 7,
            height: 7,
            backgroundColor: pagina === i ? corAtiva : "var(--text-secondary)",
            opacity: pagina === i ? 1 : 0.5,
          }}
        />
      ))}
    </div>
  );
}

/** Tela B — Situação · Últimos lançamentos · Ritmo · Faixas */
function TelaDetalhes({
  faixaAtiva, corFaixa, mediaMensal, projecao, ultimos, onSituacao, onLancamentos,
}) {
  const info = FAIXA_INFO[faixaAtiva];
  const temLancamento = ultimos.length > 0;

  return (
    <div className="card-b-fonte-fixa w-1/2 h-full flex flex-col px-3.5 pt-3.5 pb-3.5 gap-2 overflow-hidden">
      {/* 1 — Sua situação (clicável) — MUD 8 */}
      <button
        onClick={onSituacao}
        className="relative rounded-2xl pl-4 pr-3 py-3 text-left shrink-0 active:scale-[0.985] active:opacity-90 transition overflow-hidden"
        style={{
          backgroundColor: "var(--surface-raised)",
          boxShadow: `inset 3px 0 0 0 ${corFaixa}, 0 1px 0 0 ${hexToRgba(corFaixa, 0.12)}`,
        }}
      >
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(100deg, ${hexToRgba(corFaixa, 0.14)} 0%, ${hexToRgba(corFaixa, 0.03)} 60%, transparent 100%)`,
          }}
        />
        <div className="relative flex items-center gap-2.5">
          <div className="flex-1 min-w-0">
            <p
              className="text-[9px] font-bold uppercase mb-0.5"
              style={{ color: corFaixa, letterSpacing: "0.09em" }}
            >
              Sua situação
            </p>
            <p
              className="text-[13.5px] leading-snug font-semibold"
              style={{ color: "var(--text)" }}
            >
              {info.resumo}
            </p>
          </div>
          <span
            className="rounded-full flex items-center justify-center shrink-0"
            style={{
              width: 26,
              height: 26,
              backgroundColor: hexToRgba(corFaixa, 0.16),
            }}
          >
            <ChevronRight size={15} strokeWidth={2.6} style={{ color: corFaixa }} />
          </span>
        </div>
      </button>

      {/* 2 — Últimos lançamentos */}
      {temLancamento ? (
        <button
          onClick={onLancamentos}
          className="rounded-2xl px-4 py-2.5 text-left shrink-0 active:opacity-80 transition"
          style={{ backgroundColor: "var(--surface-raised)" }}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <Receipt size={12} style={{ color: "var(--text-tertiary)" }} />
            <p
              className="text-[9px] font-bold uppercase flex-1"
              style={{ color: "var(--text-secondary)", letterSpacing: "0.09em" }}
            >
              Últimos lançamentos
            </p>
            <ChevronRight size={14} style={{ color: "var(--text-tertiary)" }} className="shrink-0" />
          </div>
          <div className="space-y-0.5">
            {ultimos.map((l) => {
              const d = new Date(l.data);
              return (
                <div key={l.id} className="flex items-baseline justify-between gap-2">
                  <span
                    className="text-[11.5px] truncate"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {`${String(d.getDate()).padStart(2, "0")} ${MESES_CURTO[d.getMonth()]}`}
                  </span>
                  <Valor tamanho="sm" sinal="+">{l.valor}</Valor>
                </div>
              );
            })}
          </div>
        </button>
      ) : (
        <div
          className="rounded-2xl px-4 py-3 shrink-0 flex items-center gap-2.5"
          style={{ backgroundColor: "var(--surface-raised)" }}
        >
          <Receipt size={14} style={{ color: "var(--text-tertiary)" }} className="shrink-0" />
          <p className="text-[12.5px]" style={{ color: "var(--text-secondary)" }}>
            Nenhum lançamento ainda
          </p>
        </div>
      )}

      {/* 3 — Seu ritmo */}
      <div
        className="rounded-2xl px-4 py-2.5 shrink-0"
        style={{ backgroundColor: "var(--surface-raised)" }}
      >
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp size={12} style={{ color: "var(--text-tertiary)" }} />
          <p
            className="text-[9px] font-bold uppercase"
            style={{ color: "var(--text-secondary)", letterSpacing: "0.09em" }}
          >
            Seu ritmo
          </p>
        </div>
        <div className="flex items-baseline justify-between gap-2 mb-0.5">
          <span className="text-[11.5px]" style={{ color: "var(--text-secondary)" }}>
            Média por mês
          </span>
          <Valor tamanho="sm" autoAjustar>{mediaMensal}</Valor>
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[11.5px]" style={{ color: "var(--text-secondary)" }}>
            Fecha o ano em
          </span>
          <Valor tamanho="sm" autoAjustar cor={corFaixa}>{projecao}</Valor>
        </div>
      </div>

      {/* 4 — Faixas de risco (fixa, não clicável) */}
      <div
        className="rounded-2xl px-4 pt-2.5 pb-3 shrink-0 mt-auto"
        style={{ backgroundColor: "var(--surface-raised)" }}
      >
        <p
          className="text-[9px] font-bold uppercase mb-1.5"
          style={{ color: "var(--text-secondary)", letterSpacing: "0.09em" }}
        >
          Faixas de risco
        </p>
        <div className="flex rounded-full overflow-hidden mb-1.5" style={{ height: 5 }}>
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
              className="text-[7.5px] leading-none"
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

  const containerRef = useRef(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const startTime = useRef(0);
  const ativo = useRef(false);
  const eixo = useRef(null);
  const moveu = useRef(false);

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

  // Evita disparar clique dos cards logo após um arrasto
  function seNaoArrastou(fn) {
    return () => { if (!moveu.current) fn(); };
  }

  const naTelaB = pagina === 1;

  // MUD 9 — card externo NEUTRO nas duas telas; a cor vive no "Sua situação"
  const bgCard = {
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
      className="relative w-full flex-1 min-h-0 rounded-3xl overflow-hidden flex flex-col"
      style={{
        ...bgCard,
        boxShadow: "var(--sombra-card)",
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
      {/* Tela A: header normal. Tela B: bolinhas flutuando por cima. */}
      {naTelaB ? (
        <BolinhasIndicadoras
          pagina={pagina}
          irPara={irPara}
          corAtiva={corFaixa}
          flutuante
        />
      ) : (
        <div className="flex items-center justify-between px-5 pt-3.5 pb-1 shrink-0">
          <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {rotuloPerfil}
          </span>
          <BolinhasIndicadoras pagina={pagina} irPara={irPara} corAtiva={corFaixa} />
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-hidden">
        <div
          className="flex h-full"
          style={{
            width: "200%",
            transform: `translateX(${translate}%)`,
            transition: arrastando ? "none" : "transform 300ms ease-in-out",
          }}
        >
          {/* Tela A */}
          <div className="w-1/2 h-full flex flex-col px-5 pb-4 min-h-0">
            <div className="flex-1 min-h-0 flex items-center justify-center">
              <VelocimetroAnimado
                percentual={percentual}
                maxWidth={205}
                onClickExcedente={seNaoArrastou(onExcedente)}
              />
            </div>
            <div
              className="grid grid-cols-2 pt-3 shrink-0"
              style={{ borderTop: "1px solid var(--border)" }}
            >
              {[
                { valor: faturado, label: "Faturado" },
                { valor: limite, label: "Limite" },
              ].map((c, i) => (
                <button
                  key={c.label}
                  onClick={seNaoArrastou(onResumo)}
                  className={
                    "flex flex-col items-center text-center min-w-0 active:opacity-70 transition " +
                    (i > 0 ? "border-l" : "")
                  }
                  style={{
                    paddingLeft: 12,
                    paddingRight: 12,
                    ...(i > 0 ? { borderColor: "var(--border)" } : {}),
                  }}
                >
                  <Valor tamanho="md" autoAjustar>{c.valor}</Valor>
                  <span
                    className="text-xs mt-1"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {c.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Tela B */}
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
  const faixa = faixaDoVelocimetro(percentualAtual);
  const pose = poseDaFaixa(faixa);
  const info = FAIXA_INFO[faixa];
  const corFaixa = info.cor;

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
        style={{ paddingBottom: "calc(104px + env(safe-area-inset-bottom))" }}
      >
        <header className="px-5 pt-4 pb-1 flex items-start justify-between shrink-0">
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2.5">
              <Gauge size={30} style={{ color: "var(--primary)" }} strokeWidth={2.2} />
              <span
                className="font-bold text-2xl leading-none"
                style={{ color: "var(--text)" }}
              >
                Ta<span style={{ color: "var(--primary)" }}>Certo!</span>
              </span>
            </div>
            <div className="text-sm mt-1 truncate" style={{ color: "var(--text-secondary)" }}>
              {saudacao}
              {nome ? " " : "!"}
              {nome && (
                <span
                  className="text-base font-semibold"
                  style={{ color: "var(--text)" }}
                >
                  {truncarNome(nome)}
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

        <div className="px-5 pt-2 flex-1 flex flex-col min-h-0">
          <CardVelocimetroCarrossel
            rotuloPerfil={rotuloPerfil}
            percentual={percentualAtual}
            faturado={faturamentoAtual}
            limite={limiteAtual}
            mediaMensal={mediaMensal}
            projecao={projecaoFimDoAno}
            ultimos={ultimos}
            onSituacao={() => navigate("/chat?contexto=situacao")}
            onLancamentos={() => navigate("/historico")}
            onResumo={() => navigate("/perfil/resumo")}
            onExcedente={() => navigate("/regra-vinte")}
          />

          {/* MUD 7 + 16 — Fisco mais baixo, barra mais fina e melhor enquadrada */}
          <button
            onClick={() => navigate("/chat")}
            className="shrink-0 flex items-end gap-0.5 active:opacity-90 transition mt-1"
            style={{ background: "none", border: "none", padding: 0 }}
          >
            <Fisco
              size={124}
              pose={pose}
              fala={info.palavra}
              corFala={corFaixa}
              className="shrink-0"
              style={{ marginBottom: -8, marginLeft: -14 }}
            />

            <span
              className="flex-1 rounded-full pl-4 pr-1 flex items-center gap-2 text-left min-w-0"
              style={{
                height: 44,
                marginBottom: 6,
                backgroundColor: "var(--surface)",
                border: "1px solid var(--border)",
              }}
            >
              <span
                className="flex-1 text-[13.5px] truncate"
                style={{ color: "var(--text-secondary)" }}
              >
                Pergunte ao Fisco...
              </span>
              <span
                className="rounded-full flex items-center justify-center shrink-0"
                style={{
                  width: 34,
                  height: 34,
                  backgroundColor: "var(--primary)",
                  boxShadow: "0 2px 8px rgba(34,197,94,0.32)",
                }}
              >
                <ArrowUp size={17} strokeWidth={2.6} style={{ color: "var(--primary-contrast)" }} />
              </span>
            </span>
          </button>
        </div>
      </div>

      <BottomNav ativo="inicio" />
    </div>
  );
}