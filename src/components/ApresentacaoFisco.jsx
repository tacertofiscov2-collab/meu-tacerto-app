/* APRESENTACAOFISCO v1 — tutorial "Apresentação do Fisco.ia": celular de exemplo do Inicio (visual F) com um circulo verde passando por cada funcao e o Fisco.ia explicando, em slides */
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft, Gauge, Bell, CalendarClock, MessageCircle, FileText, Home, Plus, User,
} from "lucide-react";
import VelocimetroAnimado from "./VelocimetroAnimado.jsx";
import { DAS_VENCIMENTO_DIA } from "@/lib/fiscal";
import { MOSTRAR_CARD_DAS, MOSTRAR_TUTORIAL_NOTA } from "@/config/piloto";

/* ===================================================================
   APRESENTACAO DO FISCO.IA (05/10/2026 — pedido do Fernando)

   Abre pela notificacao "Apresentacao do Fisco.ia" (sininho do Inicio).
   So aparece se a pessoa quiser ver: nada abre sozinho.

   - Em cima: um CELULAR DE EXEMPLO do Inicio (visual F), desenhado no
     tamanho real do app (390 de largura) e encolhido para caber. Como
     nos slides de boas-vindas: sem nome e sem valores ("R$ •••").
   - Um CIRCULO VERDE passa de uma funcao para a outra (desliza), e o
     resto do celular fica escurecido.
   - Embaixo: a foto do Fisco.ia "falando" o que da para fazer. Todos os
     textos ficam empilhados no mesmo lugar (como nas boas-vindas): a
     altura nao muda de um slide para o outro.
   - "Proximo" (contorno verde); no ultimo, "Começar". Da para arrastar
     para os lados. A setinha fecha.
   - GESTO DE VOLTAR DO IPHONE: ao abrir, poe uma "marca" no historico
     (mesmo endereco, como no Onboarding). O gesto so tira a marca e
     fecha a apresentacao, sem sair do Inicio.
   =================================================================== */

const PASSOS = [
  { alvo: null, titulo: "Oi! Eu sou o Fisco.ia", texto: "Vou te mostrar o TaCerto! rapidinho." },
  {
    alvo: "velocimetro",
    titulo: "Seu limite do ano",
    texto: "Quanto você já faturou e quanto ainda pode. Arraste para o lado e veja a média do mês.",
  },
  { alvo: "mais", titulo: "Recebeu? Lance aqui", texto: "Toque no + e o velocímetro soma na hora." },
  {
    alvo: "das",
    mostrar: MOSTRAR_CARD_DAS,
    titulo: "DAS sem esquecer",
    texto: "Veja quando vence e receba o boleto no WhatsApp.",
  },
  { alvo: "fisco", titulo: "Ficou com dúvida?", texto: "Fale comigo no WhatsApp, a qualquer hora." },
  {
    alvo: "nota",
    mostrar: MOSTRAR_TUTORIAL_NOTA,
    titulo: "Nota fiscal",
    texto: "Eu te ajudo a emitir, por áudio ou por mensagem.",
  },
  { alvo: "perfil", titulo: "Seu Perfil", texto: "Limite restante, histórico de lançamentos e ajuda." },
  {
    alvo: "sino",
    titulo: "Notificações",
    texto: "Lembretes aparecem aqui. E esta apresentação, se quiser ver de novo.",
  },
].filter((p) => p.mostrar !== false);

/* Alvos redondos (icones soltos): o circulo vira circulo de verdade */
const ALVOS_REDONDOS = ["mais", "perfil", "sino"];

/* Tamanho do desenho (o Inicio de verdade) e o maximo na tela */
const LARGURA_DESENHO = 390;
const ALTURA_DESENHO = 744;
const LARGURA_MAX_CELULAR = 260;
/* Folga do circulo em volta da funcao (px do desenho) */
const FOLGA_CIRCULO = 9;

function dataDoDas(hoje = new Date()) {
  const mes = hoje.getDate() <= DAS_VENCIMENTO_DIA ? hoje.getMonth() : hoje.getMonth() + 1;
  const d = new Date(hoje.getFullYear(), mes, DAS_VENCIMENTO_DIA);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/* Foto redonda do Fisco.ia (borda verde fina) */
function FotoFisco({ tamanho = 40 }) {
  return (
    <span
      className="rounded-full overflow-hidden shrink-0 flex items-center justify-center"
      style={{ width: tamanho, height: tamanho, border: "1.5px solid rgba(34,197,94,0.45)" }}
    >
      <img
        src="/fisco-perfil.png"
        alt=""
        style={{ width: "108%", height: "108%", objectFit: "cover", objectPosition: "50% 18%" }}
      />
    </span>
  );
}

/* O Inicio (visual F) desenhado no tamanho real, sem nome e sem valores */
function InicioDeExemplo() {
  const segmentos = [
    MOSTRAR_CARD_DAS && { id: "das", Icon: CalendarClock, rotulo: `DAS ${dataDoDas()}` },
    { id: "fisco", Icon: MessageCircle, rotulo: "Fisco.ia" },
    MOSTRAR_TUTORIAL_NOTA && { id: "nota", Icon: FileText, rotulo: "Emitir nota" },
  ].filter(Boolean);

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}>
      {/* topo: logo + sininho */}
      <div className="flex items-center justify-between shrink-0" style={{ padding: "22px 20px 0" }}>
        <div className="flex items-center gap-2.5">
          <Gauge size={34} strokeWidth={2.2} style={{ color: "var(--primary)" }} />
          <span className="font-bold leading-none" style={{ fontSize: 24 }}>
            Ta<span style={{ color: "var(--primary)" }}>Certo!</span>
          </span>
        </div>
        <span data-alvo="sino" className="relative flex items-center justify-center" style={{ width: 34, height: 34 }}>
          <Bell size={22} strokeWidth={1.9} style={{ color: "var(--text-secondary)" }} />
        </span>
      </div>

      {/* velocimetro do ano */}
      <div className="flex-1 min-h-0 flex flex-col justify-center" style={{ padding: "0 20px" }}>
        <div data-alvo="velocimetro" className="flex flex-col" style={{ padding: "0 20px" }}>
          <VelocimetroAnimado percentual={58} maxWidth={205} numeroClasse="text-4xl font-bold" />
          <p className="text-center" style={{ color: "var(--text-tertiary)", fontSize: 14, marginTop: 34 }}>
            MEI · anual
          </p>
          <div className="flex items-stretch" style={{ borderTop: "1px solid var(--border)", marginTop: 4, paddingTop: 12 }}>
            {["Faturado", "Limite"].map((rotulo, i) => (
              <div
                key={rotulo}
                className="flex-1 flex flex-col items-center"
                style={{ borderLeft: i ? "1px solid var(--border)" : "none" }}
              >
                <span className="font-semibold" style={{ fontSize: 17 }}>R$ •••</span>
                <span style={{ color: "var(--text-secondary)", fontSize: 12, marginTop: 4 }}>{rotulo}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-2" style={{ marginTop: 12 }}>
            <span className="rounded-full" style={{ width: 11, height: 11, backgroundColor: "var(--primary)" }} />
            <span className="rounded-full" style={{ width: 9, height: 9, backgroundColor: "var(--primary)", opacity: 0.22 }} />
          </div>
        </div>
      </div>

      {/* barra unica (visual F) */}
      <div
        className="shrink-0 flex items-stretch"
        style={{ margin: "14px 20px 0", border: "1px solid var(--border)", borderRadius: 18 }}
      >
        {segmentos.map(({ id, Icon, rotulo }, i) => (
          <div
            key={id}
            data-alvo={id}
            className="flex-1 flex flex-col items-center justify-center"
            style={{ padding: "12px 4px 11px", gap: 6, borderLeft: i ? "1px solid var(--border)" : "none" }}
          >
            <Icon size={21} strokeWidth={1.9} style={{ color: "var(--primary)" }} />
            <span className="font-medium" style={{ fontSize: 13.5 }}>{rotulo}</span>
          </div>
        ))}
      </div>

      {/* barra de baixo (Inicio, +, Perfil) */}
      <div className="shrink-0 flex items-end" style={{ padding: "22px 13px 24px" }}>
        <div className="flex-1 flex flex-col items-center gap-1">
          <Home size={26} strokeWidth={2.5} style={{ color: "var(--primary)" }} />
          <span className="font-medium leading-none" style={{ fontSize: 11, color: "var(--primary)" }}>Início</span>
        </div>
        <div className="flex-1 flex items-center justify-center" style={{ height: 41 }}>
          <span data-alvo="mais" className="flex items-center justify-center" style={{ width: 44, height: 44 }}>
            <Plus size={56} strokeWidth={1.9} style={{ color: "var(--primary)", flexShrink: 0 }} />
          </span>
        </div>
        {/* o alvo e so o icone + rotulo (nao a coluna inteira): circulo justo */}
        <div className="flex-1 flex justify-center">
          <div data-alvo="perfil" className="flex flex-col items-center gap-1">
            <User size={26} strokeWidth={2} style={{ color: "var(--text-secondary)" }} />
            <span className="font-medium leading-none" style={{ fontSize: 11, color: "var(--text-secondary)" }}>Perfil</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* O celular de exemplo, encolhido para caber, com o circulo verde */
function CelularDeExemplo({ alvo }) {
  const caixaRef = useRef(null);
  const desenhoRef = useRef(null);
  const [escala, setEscala] = useState(0.5);
  const [circulo, setCirculo] = useState(null);

  /* Escala: cabe na largura e na altura que sobram (ate o maximo) */
  useLayoutEffect(() => {
    const caixa = caixaRef.current;
    if (!caixa) return undefined;
    const medir = () => {
      const e = Math.min(
        caixa.clientWidth / LARGURA_DESENHO,
        caixa.clientHeight / ALTURA_DESENHO,
        LARGURA_MAX_CELULAR / LARGURA_DESENHO,
      );
      if (e > 0) setEscala(e);
    };
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(caixa);
    return () => ro.disconnect();
  }, []);

  /* Posicao do circulo (em px do desenho), medida na funcao da vez */
  useLayoutEffect(() => {
    const desenho = desenhoRef.current;
    if (!desenho) return;
    const el = alvo ? desenho.querySelector(`[data-alvo="${alvo}"]`) : null;
    if (!el) {
      setCirculo((c) => (c ? { ...c, visivel: false } : null));
      return;
    }
    const base = desenho.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    let x = (r.left - base.left) / escala - FOLGA_CIRCULO;
    let y = (r.top - base.top) / escala - FOLGA_CIRCULO;
    let w = r.width / escala + FOLGA_CIRCULO * 2;
    let h = r.height / escala + FOLGA_CIRCULO * 2;
    const redondo = ALVOS_REDONDOS.includes(alvo);
    if (redondo) {
      const lado = Math.max(w, h);
      x -= (lado - w) / 2;
      y -= (lado - h) / 2;
      w = lado;
      h = lado;
    }
    setCirculo({ x, y, w, h, redondo, visivel: true });
  }, [alvo, escala]);

  return (
    <div ref={caixaRef} className="flex-1 min-h-0 w-full flex items-center justify-center">
      <div
        aria-hidden
        className="relative overflow-hidden"
        style={{
          width: LARGURA_DESENHO * escala,
          height: ALTURA_DESENHO * escala,
          borderRadius: 30,
          border: "1.5px solid rgba(34,197,94,0.55)",
          backgroundColor: "var(--bg)",
          pointerEvents: "none",
        }}
      >
        <div
          ref={desenhoRef}
          className="relative"
          style={{
            width: LARGURA_DESENHO,
            height: ALTURA_DESENHO,
            transform: `scale(${escala})`,
            transformOrigin: "top left",
          }}
        >
          <InicioDeExemplo />
          {circulo && (
            <div
              className="absolute"
              style={{
                left: circulo.x,
                top: circulo.y,
                width: circulo.w,
                height: circulo.h,
                borderRadius: circulo.redondo ? "50%" : 24,
                border: "3px solid var(--primary)",
                boxShadow: "0 0 0 2000px rgba(0,0,0,0.5), 0 0 18px rgba(34,197,94,0.45)",
                opacity: circulo.visivel ? 1 : 0,
                transition:
                  "left 420ms ease, top 420ms ease, width 420ms ease, height 420ms ease, border-radius 420ms ease, opacity 260ms ease",
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default function ApresentacaoFisco({ aberto, onFechar }) {
  const [atual, setAtual] = useState(0);
  const toqueX = useRef(null);
  const fecharRef = useRef(onFechar);
  fecharRef.current = onFechar;

  /* Sempre comeca do primeiro slide */
  useEffect(() => {
    if (aberto) setAtual(0);
  }, [aberto]);

  /* Gesto de voltar do iPhone: marca no historico (ver comentario no topo) */
  useEffect(() => {
    if (!aberto) return undefined;
    window.history.pushState({ ...(window.history.state || {}), marcaApresentacao: true }, "");
    const aoVoltar = () => fecharRef.current?.();
    window.addEventListener("popstate", aoVoltar);
    return () => {
      window.removeEventListener("popstate", aoVoltar);
      // fechou pelo botao: tira a marca que ficou
      if (window.history.state?.marcaApresentacao) window.history.back();
    };
  }, [aberto]);

  if (!aberto) return null;

  const ultimo = atual === PASSOS.length - 1;
  const proximo = () => (ultimo ? onFechar() : setAtual((i) => i + 1));
  const anterior = () => setAtual((i) => Math.max(0, i - 1));

  function inicioToque(e) {
    toqueX.current = e.touches[0].clientX;
  }
  function fimToque(e) {
    if (toqueX.current == null) return;
    const dx = e.changedTouches[0].clientX - toqueX.current;
    toqueX.current = null;
    if (dx < -50 && !ultimo) setAtual((i) => i + 1);
    else if (dx > 50) anterior();
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Apresentação do Fisco.ia"
      className="fixed inset-0 flex flex-col"
      style={{
        zIndex: 90,
        backgroundColor: "var(--bg)",
        color: "var(--text)",
        overscrollBehavior: "contain",
        animation: "apresentacaoEntra 220ms ease-out",
      }}
    >
      <style>{`
        @keyframes apresentacaoEntra {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>

      {/* Cabecalho: setinha a esquerda (fecha) e o titulo ao lado */}
      <div
        className="shrink-0 flex items-center"
        style={{ gap: 12, padding: "calc(env(safe-area-inset-top, 0px) + 20px) 20px 6px" }}
      >
        <button
          type="button"
          onClick={onFechar}
          aria-label="Fechar"
          className="rounded-full flex items-center justify-center active:scale-95 shrink-0"
          style={{ width: 40, height: 40, border: "1px solid var(--border)", background: "none" }}
        >
          <ArrowLeft size={20} strokeWidth={2.2} style={{ color: "var(--text)" }} />
        </button>
        <span className="font-bold truncate" style={{ fontSize: 20 }}>Apresentação do Fisco.ia</span>
      </div>

      {/* Celular + texto: da para arrastar para os lados */}
      <div
        className="flex-1 min-h-0 flex flex-col"
        style={{ touchAction: "pan-y" }}
        onTouchStart={inicioToque}
        onTouchEnd={fimToque}
      >
        <div className="flex-1 min-h-0 flex flex-col" style={{ padding: "12px 24px 0" }}>
          <CelularDeExemplo alvo={PASSOS[atual].alvo} />
        </div>

        {/* Todos os textos no mesmo lugar: a altura nao muda */}
        <div className="shrink-0 grid" style={{ padding: "20px 24px 0" }}>
          {PASSOS.map((p, i) => (
            <div
              key={p.titulo}
              aria-hidden={i !== atual}
              className="flex items-start"
              style={{
                gridArea: "1 / 1",
                gap: 12,
                opacity: i === atual ? 1 : 0,
                visibility: i === atual ? "visible" : "hidden",
                transition: "opacity 220ms ease",
              }}
            >
              <FotoFisco tamanho={40} />
              <div className="min-w-0">
                <p className="font-bold leading-tight" style={{ fontSize: 19 }}>{p.titulo}</p>
                <p className="leading-snug" style={{ fontSize: 15, color: "var(--text-secondary)", marginTop: 4 }}>
                  {p.texto}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bolinhas + botao */}
      <div className="shrink-0" style={{ padding: "16px 24px calc(16px + env(safe-area-inset-bottom, 0px))" }}>
        <div className="flex justify-center" style={{ gap: 7, marginBottom: 14 }}>
          {PASSOS.map((p, i) => (
            <button
              key={p.titulo}
              type="button"
              onClick={() => setAtual(i)}
              aria-label={`Ir para o passo ${i + 1}`}
              className="rounded-full transition-all"
              style={{
                width: i === atual ? 20 : 7,
                height: 7,
                backgroundColor: i === atual ? "var(--primary)" : "var(--border)",
              }}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={proximo}
          className="toque botao-confirmar w-full rounded-2xl font-semibold"
          style={{ padding: "13px 0", fontSize: 16 }}
        >
          {ultimo ? "Começar" : "Próximo"}
        </button>
      </div>
    </div>,
    document.body,
  );
}
