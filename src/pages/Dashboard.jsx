import { useNavigate } from "react-router-dom";
import { useRef, useState, useMemo, useEffect } from "react";
import { Bell, Gauge, TrendingUp, ChevronRight, Receipt, Send } from "lucide-react";
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

function SetaEnviar({ tamanho = 16 }) {
  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      style={{ display: "block" }}
    >
      <path
        d="M12 20V5"
        stroke="var(--primary-contrast)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M5.5 11.5L12 4.5L18.5 11.5"
        stroke="var(--primary-contrast)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
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

export default function Dashboard() {
  const navigate = useNavigate();
  const {
    nome, tipoMEI, lancamentos, faturamentoAtual, limiteAtual, percentualAtual,
    mediaMensal, projecaoFimDoAno,
  } = useAppState();

  const rotuloPerfil = LABEL_TIPO[tipoMEI];
  const saudacao = saudacaoPorHora();

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

          <button
            onClick={() => navigate("/chat")}
            className="shrink-0 w-full flex items-start gap-2"
            style={{ background: "none", border: "none", padding: 0, marginTop: 4, marginBottom: 12 }}
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
                ...VIDRO,
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

      <BottomNav ativo="inicio" />
    </div>
  );
}
