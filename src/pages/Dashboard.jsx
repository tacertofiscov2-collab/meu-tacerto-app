import { useNavigate } from "react-router-dom";
import { useRef, useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { Bell, Gauge, TrendingUp, ChevronRight, Receipt, Send, X, Mic, Image as ImageIcon, Camera, FileText, Sparkles, MessageCircleQuestion } from "lucide-react";
import BottomNav from "../components/BottomNav.jsx";
import Valor from "../components/Valor.jsx";
import VelocimetroAnimado from "../components/VelocimetroAnimado.jsx";
import { useAppState } from "@/context/AppStateContext";
import {
  LABEL_TIPO, faixaDoVelocimetro, FAIXA_INFO, FAIXAS_ORDEM, FAIXA_RANGE_LABEL,
  truncarNome,
} from "@/lib/fiscal";
/* DASHBOARD v3 — cabecalho no painel de perguntas + limpeza do chat morto.

   1) O painel de perguntas abria com um vazio grande no topo (o espaco
      reservado para o X). Agora esse espaco tem titulo: rotulo na cor da
      faixa, o resumo da situacao atual e o que fazer. Ver PainelPerguntas.

   2) REMOVIDO o ChatFiscoExpandido e seus auxiliares (BolhaMensagem,
      MenuMensagem, FiscoDigitando, PainelHistorico). Era uma copia
      inteira do chat que NUNCA abria: so seria acionada por
      abrirConversa/novaConversa, que por sua vez so eram chamadas de
      dentro dele mesmo. Alem disso o onEnviar era funcao vazia.
      O chat de verdade vive em src/components/ChatFiscoUI.jsx, usado
      pela pagina /fisco. Aqui o dashboard so navega pra la.

/* Marca de onde a navegação partiu: o TelaComVoltarReal usa isso para
   mostrar a tela certa por trás quando o usuário arrasta para voltar. */
const DE_DASHBOARD = { state: { de: "dashboard" } };

/* Altura maxima do campo da caixinha do Fisco (em px). Ele cresce com o
   texto ate esse limite e depois rola por dentro, com a barra de rolagem
   visivel. ~150px da umas 6 linhas. */
const MAX_ALTURA_CAIXA_FISCO = 150;

const MESES_CURTO = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
];

/* ===================================================================
   VIDRO — os valores vêm do index.css e mudam com o tema.

   No tema escuro o fundo é quase preto com brilhos brancos; no tema
   claro, fundo quase branco com brilhos suaves. Ver as variáveis
   --vidro-* em src/index.css.
   =================================================================== */
const VIDRO = {
  background:
    "linear-gradient(160deg, var(--vidro-brilho-1) 0%, var(--vidro-brilho-2) 24%, transparent 58%), var(--vidro-bg)",
  backdropFilter: "blur(24px) saturate(160%)",
  WebkitBackdropFilter: "blur(24px) saturate(160%)",
  border: "1px solid var(--vidro-borda)",
  boxShadow:
    "inset 0 1.5px 0 0 var(--vidro-topo-forte), inset 0 9px 20px -8px var(--vidro-topo-medio), inset 0 -1.5px 0 0 var(--vidro-base), 0 8px 24px var(--vidro-sombra)",
};

/* Reflexo reduzido: um pouco mais forte que o dos cards A/B.
   Usado nas barras do chat e na caixa expandida. */
const VIDRO_SUAVE = {
  background:
    "linear-gradient(160deg, var(--vidro-brilho-1) 0%, var(--vidro-brilho-2) 24%, transparent 58%), var(--vidro-bg)",
  backdropFilter: "blur(24px) saturate(160%)",
  WebkitBackdropFilter: "blur(24px) saturate(160%)",
  border: "1px solid var(--vidro-borda)",
  boxShadow:
    "inset 0 1px 0 0 var(--vidro-topo-medio), inset 0 7px 16px -8px var(--vidro-topo-fraco), inset 0 -1.5px 0 0 var(--vidro-base), 0 8px 24px var(--vidro-sombra)",
};

const VIDRO_CHAT = {
  background:
    "linear-gradient(160deg, var(--vidro-brilho-2) 0%, var(--vidro-brilho-3) 24%, transparent 58%), var(--vidro-bg-leve)",
  backdropFilter: "blur(28px) saturate(160%)",
  WebkitBackdropFilter: "blur(28px) saturate(160%)",
  border: "1px solid var(--vidro-borda)",
  boxShadow:
    "inset 0 1px 0 0 var(--vidro-topo-medio), inset 0 7px 16px -8px var(--vidro-topo-fraco), 0 12px 36px var(--vidro-sombra-forte)",
};


/* Perguntas sugeridas por situação. Tocar numa delas abre o chat do
   Fisco já com a pergunta enviada. */
const PERGUNTAS_POR_FAIXA = {
  tranquilo: [
    "Quanto ainda posso faturar este ano?",
    "Quando vence o DAS e quanto é?",
    "Preciso emitir nota em todo serviço?",
    "O que acontece se eu atrasar o DAS?",
    "Como funciona a declaração anual (DASN)?",
    "Posso ter funcionário sendo MEI?",
    "Tenho direito a aposentadoria?",
    "E se eu ficar doente, recebo alguma coisa?",
    "Posso ter mais de um MEI?",
    "Preciso de conta bancária separada?",
  ],
  fique_de_olho: [
    "Quanto ainda posso faturar este ano?",
    "Estou no ritmo certo para o ano?",
    "Quando vence o DAS e quanto é?",
    "O que acontece se eu passar do limite?",
    "Preciso emitir nota em todo serviço?",
    "Como funciona a declaração anual (DASN)?",
    "Posso ter funcionário sendo MEI?",
    "Tenho direito a aposentadoria?",
    "O que acontece se eu atrasar o DAS?",
    "Preciso de conta bancária separada?",
  ],
  atencao: [
    "O que acontece se eu passar do limite?",
    "Quanto ainda posso faturar sem estourar?",
    "Posso adiantar recebimentos para o ano que vem?",
    "O que é a regra dos 20%?",
    "Como faço para virar ME?",
    "Vou pagar mais imposto se mudar de categoria?",
    "Estou no ritmo certo para o ano?",
    "Perco meus direitos se sair do MEI?",
    "Quando vence o DAS e quanto é?",
    "Devo parar de faturar até dezembro?",
  ],
  perto_do_limite: [
    "Quanto ainda posso faturar sem estourar?",
    "O que acontece se eu passar do limite?",
    "O que é a regra dos 20%?",
    "Posso adiantar recebimentos para o ano que vem?",
    "Como faço para virar ME?",
    "Vou pagar mais imposto se mudar de categoria?",
    "Devo parar de faturar até dezembro?",
    "Perco meus direitos se sair do MEI?",
    "Preciso avisar a Receita de alguma coisa?",
    "Quanto tempo tenho para regularizar?",
  ],
  estourou: [
    "Passei do limite. E agora, o que fazer?",
    "O que é a regra dos 20%?",
    "Vou ter que virar ME? Como funciona?",
    "Quanto vou pagar de imposto sobre o excesso?",
    "Perco meus direitos de MEI?",
    "Preciso avisar a Receita de alguma coisa?",
    "Quanto tempo tenho para regularizar?",
    "Posso voltar a ser MEI no ano que vem?",
    "Vou pagar multa?",
    "Preciso de um contador agora?",
  ],
  critico: [
    "Passei muito do limite. O que fazer agora?",
    "O que acontece quando passo de 20% do limite?",
    "Sou desenquadrado automaticamente?",
    "Vou ter que virar ME? Como funciona?",
    "Quanto vou pagar de imposto sobre o excesso?",
    "Vou pagar multa?",
    "Perco meus direitos de MEI?",
    "Preciso de um contador agora?",
    "Posso voltar a ser MEI no ano que vem?",
    "Quanto tempo tenho para regularizar?",
  ],
};

function perguntasDaSituacao(faixa) {
  return PERGUNTAS_POR_FAIXA[faixa] || PERGUNTAS_POR_FAIXA.tranquilo;
}

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
      style={{
        padding: 12,
        gap: 6,
        flex: "0 0 50%",
        width: "50%",
        // Cada card mantem a altura natural e o espaco que sobra e
        // distribuido entre eles - assim nao fica buraco no fim, com ou
        // sem lancamentos.
        justifyContent: "space-between",
      }}
    >
      <button
        onClick={onSituacao}
        className="toque toque-escala relative rounded-2xl text-left shrink-0 overflow-hidden"
        style={{
          paddingLeft: 14,
          paddingRight: 10,
          paddingTop: 10,
          paddingBottom: 10,
          backgroundColor: "var(--vidro-bg-leve)",
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
          <div className="flex-1 min-w-0">
            <p
              className="cb-rotulo font-bold uppercase"
              style={{ color: corFaixa, letterSpacing: "0.09em", marginBottom: 3 }}
            >
              Como estou
            </p>
            <p
              className="cb-titulo leading-snug font-semibold"
              style={{ color: "var(--text)" }}
            >
              {info.resumo}
            </p>

            {/* Deixa explícito que o card abre as dúvidas */}
            <span
              className="inline-flex items-center rounded-full"
              style={{
                gap: 5,
                marginTop: 7,
                padding: "4px 9px",
                backgroundColor: hexToRgba(corFaixa, 0.16),
                border: `1px solid ${hexToRgba(corFaixa, 0.3)}`,
              }}
            >
              <MessageCircleQuestion size={11} strokeWidth={2.4} style={{ color: corFaixa }} />
              <span
                className="cb-rotulo font-bold uppercase"
                style={{ color: corFaixa, letterSpacing: "0.06em" }}
              >
                Tirar dúvidas
              </span>
            </span>
          </div>
          <span
            className="rounded-full flex items-center justify-center shrink-0"
            style={{
              width: 26,
              height: 26,
              backgroundColor: hexToRgba(corFaixa, 0.2),
              border: `1px solid ${hexToRgba(corFaixa, 0.35)}`,
            }}
          >
            <ChevronRight size={15} strokeWidth={2.8} style={{ color: corFaixa }} />
          </span>
        </div>
      </button>

      {temLancamento ? (
        <button
          onClick={onLancamentos}
          className="toque toque-escala rounded-2xl text-left shrink-0"
          style={{
            paddingLeft: 14,
            paddingRight: 14,
            paddingTop: 8,
            paddingBottom: 8,
            backgroundColor: "var(--vidro-superficie)",
          }}
        >
          <div className="flex items-center" style={{ gap: 8, marginBottom: 4 }}>
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
        /* Estado vazio: em vez de uma linha solta num card grande, um
           bloco centrado com icone em destaque e a dica do proximo passo.
           A borda tracejada e a convencao visual de "ainda nao tem nada
           aqui" - deixa claro que nao e um card quebrado. */
        <div
          className="rounded-2xl shrink-0 flex flex-col items-center justify-center text-center overflow-hidden"
          style={{
            minHeight: 92,
            padding: 10,
            gap: 5,
            backgroundColor: "var(--vidro-superficie-fraca)",
            border: "1px dashed var(--vidro-borda)",
          }}
        >
          <span
            className="rounded-full flex items-center justify-center shrink-0"
            style={{
              width: 28,
              height: 28,
              backgroundColor: hexToRgba(corFaixa, 0.14),
              border: `1px solid ${hexToRgba(corFaixa, 0.28)}`,
            }}
          >
            <Receipt size={14} strokeWidth={2.1} style={{ color: corFaixa }} />
          </span>

          <p
            className="cb-titulo font-semibold leading-tight shrink-0"
            style={{ color: "var(--text)" }}
          >
            Nenhum lançamento ainda
          </p>

          <p
            className="cb-linha leading-tight shrink-0"
            style={{ color: "var(--text-tertiary)" }}
          >
            Toque no <span style={{ color: corFaixa, fontWeight: 700 }}>+</span> para começar
          </p>
        </div>
      )}

      <div
        className="rounded-2xl shrink-0"
        style={{
          paddingLeft: 14,
          paddingRight: 14,
          paddingTop: 8,
          paddingBottom: 8,
          backgroundColor: "var(--vidro-superficie)",
        }}
      >
        <div className="flex items-center" style={{ gap: 8, marginBottom: 4 }}>
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
          paddingLeft: 14,
          paddingRight: 14,
          paddingTop: 8,
          paddingBottom: 8,
          backgroundColor: "var(--vidro-superficie)",
        }}
      >
        <p
          className="cb-rotulo font-bold uppercase"
          style={{ color: "var(--text-secondary)", letterSpacing: "0.09em", marginBottom: 4 }}
        >
          Faixas de risco
        </p>
        <div
          className="flex rounded-full overflow-hidden"
          style={{ height: 5, marginBottom: 4 }}
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
      "inset 0 1px 0 0 var(--vidro-topo-medio), inset 0 6px 14px -8px var(--vidro-topo-fraco), inset 0 -1.5px 0 0 var(--vidro-base), 0 8px 24px var(--vidro-sombra)",
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
      {/* Alerta visual: passou dos 100% do limite */}
      {percentual > 100 && (
        <BordaLuminosa raio={24} cor="239,68,68" corClara="248,113,113" />
      )}

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

/** Painel só com as perguntas sugeridas conforme a situação.
    Fecha no "×" ou clicando fora.

    O topo tem um cabeçalho ligado à SITUAÇÃO ATUAL: o rótulo na cor da
    faixa, o mesmo resumo que aparece no card "Como estou" (que é o botão
    que abre este painel) e uma linha dizendo o que fazer. Antes esse
    espaço era só um vazio reservado para o "×". */
function PainelPerguntas({ aberto, onFechar, faixa, corFaixa, onPerguntar }) {
  const listaRef = useRef(null);

  /* TRAVA A ROLAGEM DO DASHBOARD enquanto o painel esta aberto. Sem
     isso, arrastar o dedo fora do painel rolava a tela atras. Mesma
     tecnica da caixinha do Fisco: overflow travado no html/body +
     bloqueio do arrasto — liberado so DENTRO da lista de perguntas,
     que precisa rolar. */
  useEffect(() => {
    if (!aberto) return;

    const htmlEl = document.documentElement;
    const bodyEl = document.body;
    const overflowHtmlAntes = htmlEl.style.overflow;
    const overflowBodyAntes = bodyEl.style.overflow;
    htmlEl.style.overflow = "hidden";
    bodyEl.style.overflow = "hidden";

    const bloquearArrasto = (e) => {
      const lista = listaRef.current;
      if (lista && lista.contains(e.target)) return; // deixa a lista rolar
      e.preventDefault();
    };
    document.addEventListener("touchmove", bloquearArrasto, { passive: false });

    return () => {
      document.removeEventListener("touchmove", bloquearArrasto);
      htmlEl.style.overflow = overflowHtmlAntes;
      bodyEl.style.overflow = overflowBodyAntes;
    };
  }, [aberto]);

  if (!aberto) return null;
  const perguntas = perguntasDaSituacao(faixa);

  return (
    <div
      className="fixed inset-0 z-[75] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.5)", animation: "menuMsgFade 260ms ease-out" }}
      onClick={onFechar}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex flex-col rounded-3xl overflow-hidden"
        style={{
          ...VIDRO_CHAT,
          width: "calc(100% - 32px)",
          maxWidth: 420,
          maxHeight: "72vh",
          animation: "menuMsgPop 340ms cubic-bezier(0.25,0.9,0.3,1)",
        }}
      >
        {/* As animacoes ficavam no MenuMensagem do chat que existia aqui.
            Com ele removido, elas moram neste painel — que e quem usa. */}
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

        <button
          type="button"
          onClick={onFechar}
          aria-label="Fechar"
          className="rounded-full flex items-center justify-center active:scale-95 transition"
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            zIndex: 20,
            width: 30,
            height: 30,
            backgroundColor: "var(--vidro-bg-leve)",
            border: "1px solid var(--vidro-borda)",
          }}
        >
          <X size={15} style={{ color: "var(--text-secondary)" }} />
        </button>

        {/* Cabeçalho: só o título, centralizado. O padding igual nos dois
            lados (52) é o que mantém o texto no centro real do painel,
            já que o "×" flutua por cima do canto direito. */}
        <div
          className="shrink-0 text-center"
          style={{ padding: "16px 52px 12px" }}
        >
          <p
            className="font-bold uppercase"
            style={{
              /* Branco sempre: nao acompanha a cor da faixa. */
              color: "var(--text)",
              fontSize: 13,
              letterSpacing: "0.09em",
            }}
          >
            Tirar dúvidas
          </p>
        </div>

        <div
          ref={listaRef}
          className="flex-1 min-h-0 overflow-y-auto hide-scrollbar"
          style={{ padding: "0 12px 12px", display: "flex", flexDirection: "column", gap: 8 }}
        >
          {perguntas.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onPerguntar(p)}
              className="toque toque-escala w-full rounded-2xl flex items-center text-left shrink-0"
              style={{
                gap: 11,
                padding: "13px 14px",
                backgroundColor: "var(--vidro-superficie)",
                border: "1px solid var(--vidro-borda)",
              }}
            >
              <span
                className="rounded-xl flex items-center justify-center shrink-0"
                style={{ width: 30, height: 30, backgroundColor: hexToRgba(corFaixa, 0.16) }}
              >
                <Sparkles size={15} style={{ color: corFaixa }} />
              </span>
              <span
                className="flex-1 leading-snug"
                style={{ color: "var(--text)", fontSize: 14 }}
              >
                {p}
              </span>
              <ChevronRight size={15} style={{ color: "var(--text-tertiary)" }} className="shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Borda pulsando — acende e apaga suavemente, com halo em volta.
    Usada em verde no chat do Fisco e em vermelho no card do
    velocímetro quando o usuário passa dos 100% do limite.
    Funciona em qualquer navegador (não depende de @property). */
function BordaLuminosa({ raio = 28, cor = "34,197,94", corClara = "74,222,128" }) {
  const id = `pulsa-${cor.replace(/[^0-9]/g, "")}`;
  return (
    <>
      <style>{`
        @keyframes ${id} {
          0%, 100% {
            border-color: rgba(${cor},0.30);
            box-shadow:
              0 0 0 0 rgba(${cor},0),
              inset 0 0 12px -6px rgba(${cor},0.35);
          }
          50% {
            border-color: rgba(${corClara},0.85);
            box-shadow:
              0 0 18px 1px rgba(${cor},0.35),
              inset 0 0 18px -4px rgba(${corClara},0.55);
          }
        }
        .${id} {
          animation: ${id} 2.4s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .${id} { animation: none; }
        }
      `}</style>
      <div
        aria-hidden
        className={`${id} pointer-events-none absolute`}
        style={{
          inset: 0,
          borderRadius: raio,
          border: `1.6px solid rgba(${cor},0.30)`,
          zIndex: 3,
        }}
      />
    </>
  );
}

/** Luz verde correndo em volta da borda. Usada na barra fechada do
    Fisco no dashboard, para chamar atenção. Fica girando o tempo todo,
    mas o elemento é pequeno — o custo de repintura é baixo. */
function BordaCorrendo({ raio = 999, espessura = 1.6 }) {
  return (
    <>
      <style>{`
        @property --anguloLuz {
          syntax: '<angle>';
          initial-value: 0deg;
          inherits: false;
        }
        @keyframes girarLuz {
          to { --anguloLuz: 360deg; }
        }
        .borda-correndo {
          animation: girarLuz 3.2s linear infinite;
        }
        /* Safari antigo não suporta @property: a luz não gira, então
           some — a borda normal do elemento continua ali. */
        @supports not (background: conic-gradient(from 0deg, red, blue)) {
          .borda-correndo { display: none; }
        }
        @media (prefers-reduced-motion: reduce) {
          .borda-correndo { animation: none; opacity: 0.5; }
        }
      `}</style>
      <span
        aria-hidden
        className="borda-correndo pointer-events-none absolute"
        style={{
          inset: 0,
          borderRadius: raio,
          padding: espessura,
          background:
            "conic-gradient(from var(--anguloLuz), transparent 0%, transparent 62%, rgba(34,197,94,0.35) 74%, #4ade80 86%, rgba(134,239,172,0.9) 92%, transparent 100%)",
          WebkitMask:
            "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          WebkitMaskComposite: "xor",
          mask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          maskComposite: "exclude",
          zIndex: 2,
        }}
      />
    </>
  );
}

function CaixaFiscoExpandida({ onEnviarPrimeira }) {
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
    // Volta o campo pro tamanho inicial (ele cresceu enquanto digitava).
    if (inputRef.current) inputRef.current.style.height = "auto";
  }

  return (
    <form
      onSubmit={submeter}
      onClick={() => inputRef.current?.focus()}
      className="rounded-3xl flex flex-col relative"
      style={{
        ...VIDRO_SUAVE,
        background:
          "linear-gradient(160deg, var(--vidro-brilho-2) 0%, var(--vidro-brilho-3) 24%, transparent 58%), var(--vidro-bg-transparente)",
        padding: 14,
        gap: 10,
        cursor: "text",
        // Avisa o navegador pra preparar a camada do vidro antes da
        // animacao de entrada. Sem isso, o Safari pintava o backdrop-filter
        // um frame depois e a caixinha aparecia so com a borda.
        willChange: "backdrop-filter",
      }}
    >
      <BordaLuminosa raio={24} />

      <textarea
        ref={inputRef}
        value={rascunho}
        rows={2}
        onChange={(e) => {
          setRascunho(e.target.value);
          // Cresce com o texto ate MAX_ALTURA_CAIXA_FISCO; passando disso,
          // para de crescer e rola por dentro (barra de rolagem visivel).
          const el = e.target;
          el.style.height = "auto";
          el.style.height = `${Math.min(el.scrollHeight, MAX_ALTURA_CAIXA_FISCO)}px`;
        }}
        className="w-full resize-none"
        style={{
          background: "none",
          border: "none",
          outline: "none",
          color: "var(--text)",
          caretColor: "var(--primary)",
          fontSize: 15,
          lineHeight: 1.4,
          fontFamily: "inherit",
          maxHeight: MAX_ALTURA_CAIXA_FISCO,
          overflowY: "auto",
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
              backgroundColor: "var(--vidro-superficie)",
              border: "1px solid var(--vidro-borda)",
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
              backgroundColor: "var(--vidro-superficie)",
              border: "1px solid var(--vidro-borda)",
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
              backgroundColor: "var(--vidro-superficie)",
              border: "1px solid var(--vidro-borda)",
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

/* Caixa expandida do Fisco.

   Em vez de "crescer" a partir da barra do dashboard, ela e criada como
   um elemento novo que aparece suavemente ancorado ao teclado.

   Como funciona o posicionamento (a parte que antes falhava): montamos um
   container que ocupa EXATAMENTE a area visivel (o espaco que sobra acima
   do teclado) e colocamos a caixa no fim dele. Assim ela fica acima do
   teclado por construcao - sem calcular posicao, entao nao tem como errar
   e ficar escondida. Vive num portal, fora da arvore do dashboard. */
function CaixaFiscoFlutuante({ onFechar, onEnviarPrimeira }) {
  const areaRef = useRef(null);
  // Enquanto "fechando", roda a animacao de saida; so depois disso o
  // componente e removido de verdade (senao sumia do nada).
  const [fechando, setFechando] = useState(false);

  function fecharSuave() {
    if (fechando) return;
    setFechando(true);
    setTimeout(onFechar, 200);
  }

  useEffect(() => {
    const vv = window.visualViewport;
    const area = areaRef.current;
    if (!vv || !area) return;

    // TRAVA A ROLAGEM DO DASHBOARD enquanto a caixinha esta aberta. Com o
    // teclado aberto o iOS libera o scroll da pagina (pra "revelar" o que
    // esta atras do teclado) e dava pra rolar o dashboard inteiro por
    // tras. Aqui: overflow travado + bloqueio do arrasto fora do campo.
    const htmlEl = document.documentElement;
    const bodyEl = document.body;
    const overflowHtmlAntes = htmlEl.style.overflow;
    const overflowBodyAntes = bodyEl.style.overflow;
    htmlEl.style.overflow = "hidden";
    bodyEl.style.overflow = "hidden";

    const bloquearArrasto = (e) => {
      // Deixa rolar so dentro do proprio campo de texto (quando o texto
      // passa do tamanho da caixa).
      const alvo = e.target;
      if (alvo && alvo.tagName === "TEXTAREA") return;
      e.preventDefault();
    };
    document.addEventListener("touchmove", bloquearArrasto, { passive: false });

    // Faz o container acompanhar a area visivel. Como a caixa esta
    // alinhada ao fim dele, ela acompanha o teclado naturalmente.
    const ajustar = () => {
      const teclado = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      area.style.top = `${vv.offsetTop}px`;
      area.style.height = `${vv.height}px`;
      // Com teclado aberto, cola perto dele; sem teclado, um respiro maior.
      area.style.paddingBottom = teclado > 60 ? "10px" : "26px";
    };

    // Perdeu o foco = teclado descendo: a caixa fecha junto e o dashboard
    // volta ao normal. A checagem evita fechar quando o foco so pulou pra
    // outro campo por um instante.
    const aoSair = () => {
      setTimeout(() => {
        const a = document.activeElement;
        const digitando = a && (a.tagName === "INPUT" || a.tagName === "TEXTAREA");
        if (!digitando) fecharSuave();
      }, 80);
    };

    ajustar();
    vv.addEventListener("resize", ajustar);
    vv.addEventListener("scroll", ajustar);
    document.addEventListener("focusout", aoSair);
    return () => {
      vv.removeEventListener("resize", ajustar);
      vv.removeEventListener("scroll", ajustar);
      document.removeEventListener("focusout", aoSair);
      // Devolve a rolagem do dashboard ao fechar a caixinha.
      document.removeEventListener("touchmove", bloquearArrasto);
      htmlEl.style.overflow = overflowHtmlAntes;
      bodyEl.style.overflow = overflowBodyAntes;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return createPortal(
    <>
      <style>{`
        @keyframes caixaFiscoEntra {
          from { opacity: 0.35; transform: translateY(12px) scale(0.99); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes caixaFiscoSai {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to   { opacity: 0; transform: translateY(14px) scale(0.985); }
        }
        @media (prefers-reduced-motion: reduce) {
          .caixa-fisco-anima { animation: none !important; }
        }
      `}</style>

      {/* Fundo: fecha ao tocar fora */}
      <div
        className="fixed inset-0"
        style={{
          zIndex: 60,
          opacity: fechando ? 0 : 1,
          transition: "opacity 200ms ease-out",
        }}
        onClick={fecharSuave}
      />

      {/* Container = area visivel (acima do teclado). A caixa fica no fim
          dele, entao nunca cai atras do teclado. */}
      <div
        ref={areaRef}
        className="fixed flex flex-col justify-end"
        style={{
          zIndex: 61,
          left: 0,
          right: 0,
          top: 0,
          height: "100dvh",
          paddingLeft: 20,
          paddingRight: 20,
          paddingBottom: 26,
          pointerEvents: "none",
        }}
      >
        <div
          className="caixa-fisco-anima"
          style={{
            pointerEvents: "auto",
            animation: fechando
              ? "caixaFiscoSai 200ms cubic-bezier(0.4,0,1,1) forwards"
              : "caixaFiscoEntra 240ms cubic-bezier(0.22,0.61,0.36,1)",
          }}
        >
          <CaixaFiscoExpandida onEnviarPrimeira={onEnviarPrimeira} />
        </div>
      </div>
    </>,
    document.body,
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

  // Painel de perguntas sugeridas (abre pelo card "Como estou")
  const [perguntasAberto, setPerguntasAberto] = useState(false);

  /* O historico de conversas nao vive mais aqui: quem cuida dele e a
     pagina /fisco (ver ChatFiscoPagina + lib/chatHistorico). */

  // Abre a pagina do chat do Fisco (/fisco) levando a primeira mensagem.
  // A pagina cria a conversa, mostra a mensagem e dispara a resposta.
  function enviarPrimeiraMensagem(texto) {
    setCaixaExpandida(false);
    navigate("/fisco", { state: { primeiraMensagem: texto } });
  }

  function perguntarAoFisco(texto) {
    setPerguntasAberto(false);
    navigate("/fisco", { state: { primeiraMensagem: texto } });
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
            onClick={() => navigate("/alertas", DE_DASHBOARD)}
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
            onSituacao={() => setPerguntasAberto(true)}
            onLancamentos={() => navigate("/historico", DE_DASHBOARD)}
            onResumo={() => navigate("/perfil/resumo", DE_DASHBOARD)}
            onExcedente={() => navigate("/regra-vinte", DE_DASHBOARD)}
          />

          {caixaExpandida && (
            <CaixaFiscoFlutuante
              onFechar={() => setCaixaExpandida(false)}
              onEnviarPrimeira={enviarPrimeiraMensagem}
            />
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
                className="toque relative flex-1 flex items-center gap-2 text-left min-w-0 rounded-full"
                style={{
                  ...VIDRO_SUAVE,
                  height: 48,
                  paddingLeft: 18,
                  paddingRight: 12,
                  marginTop: 24,
                  // So a barrinha some quando a caixa expandida esta aberta.
                  // A foto do Fisco fica fixa, inclusive durante o fecho.
                  visibility: caixaExpandida ? "hidden" : "visible",
                }}
              >
                <BordaCorrendo />

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

      <PainelPerguntas
        aberto={perguntasAberto}
        onFechar={() => setPerguntasAberto(false)}
        faixa={faixaDoVelocimetro(percentualAtual)}
        corFaixa={FAIXA_INFO[faixaDoVelocimetro(percentualAtual)].cor}
        onPerguntar={perguntarAoFisco}
      />

      {/* O rodape some enquanto a caixinha do Fisco esta aberta: ele
          ficava por cima dela e "roubava" o espaco acima do teclado. */}
      {!caixaExpandida && <BottomNav ativo="inicio" />}
    </div>
  );
}