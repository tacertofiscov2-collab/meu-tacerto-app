/* APRESENTACAOFISCO v7 — o celular de exemplo mostra o Inicio NOVO igual ao de verdade (pecas e medidas de InicioPartes: so o sininho, card do velocimetro com "Atualizar velocímetro" no canto, chat da Isa com camera/clipe/microfone, barra de baixo de vidro; desenho 390 x 800) e ganha a tela da conversa no WhatsApp (ConversaIsaExemplo); tutorial: 3a tela "Tudo pelo WhatsApp com a Isa" (nota, DAS, entradas e gastos, duvidas), 2a "Seu MEI no Perfil" e a 4a destaca o Atualizar velocímetro; Apresentacao da Isa sem os passos do DAS e da NF do Inicio (agora no Perfil e no WhatsApp) (v6: modo "tutorial" (primeiro acesso, Bloco L): 4 telas (o velocimetro e o limite; integracoes e o que automatizam; tudo tambem pelo WhatsApp; comece pelo extrato, Recomendado), "Pular tutorial" no topo e, no fim, "Enviar extrato" + "Agora não"; o modo de sempre (Apresentacao da Isa) nao mudou (v5: Fisco vira Isa: "Oi, sou a Isa" (assistente com IA do TaCerto), foto da Isa (FotoIsa) no texto e na barra do celular de exemplo, titulo "Apresentação da Isa" (v4: celular MENOR, menos espaco vazio dentro dele (desenho mais justo: 340 x 715, mesma proporcao) e icones MAIORES (barra DAS/Fisco/NF, rodape e sininho); celular e texto do Fisco juntos, centrados na tela (pedido do Fernando) (v3: celular de exemplo com proporcao de celular de verdade (390 x 820) e igual ao Inicio novo: saudacao, velocimetro grande e a barra dos 3 atalhos centrada entre as bolinhas e o rodape (v2: celular de exemplo igual ao Inicio novo (DAS, Fisco com o simbolo do WhatsApp, NF; casinha cinza; velocimetro mais alto); textos do + e do Perfil (v1: tutorial "Apresentação do Fisco.ia": celular de exemplo do Inicio (visual F) com um circulo verde passando por cada funcao e o Fisco.ia explicando, em slides)) */
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft, Gauge, Bell, Home, Plus, User,
} from "lucide-react";
import VelocimetroAnimado from "./VelocimetroAnimado.jsx";
import FotoIsa from "./FotoIsa.jsx";
import SeloRecomendado from "./SeloRecomendado.jsx";
import ConversaIsaExemplo from "./ConversaIsaExemplo.jsx";
import { MEDIDAS_INICIO, VIDRO, BotaoAtualizarCanto, BarraIsaInicio } from "./InicioPartes.jsx";
import { useAppState } from "@/context/AppStateContext";
import { LABEL_TIPO } from "@/lib/fiscal";
import { MOSTRAR_ANEXOS_CHAT, MOSTRAR_COMPROVANTE_FOTO } from "@/config/piloto";

/* ===================================================================
   APRESENTACAO DA ISA (05/10/2026 — pedido do Fernando; ate 10/10 era
   a "Apresentacao do Fisco.ia")

   Abre pela notificacao "Apresentacao da Isa" (sininho do Inicio).
   So aparece se a pessoa quiser ver: nada abre sozinho.

   - Em cima: um CELULAR DE EXEMPLO do Inicio, desenhado no tamanho
     real do app (390 de largura) e encolhido para caber. Como nos
     slides de boas-vindas: sem nome e sem valores ("R$ •••").
     v7: e o Inicio NOVO, com as MESMAS pecas e medidas do Dashboard
     (src/components/InicioPartes.jsx) — antes era um desenho a parte
     que ficou parado no visual F. Um passo pode mostrar outra tela
     (tela: "whatsapp" = a conversa com a Isa, ConversaIsaExemplo).
   - Um CIRCULO VERDE passa de uma funcao para a outra (desliza), e o
     resto do celular fica escurecido.
   - Embaixo: a foto da Isa "falando" o que da para fazer. Todos os
     textos ficam empilhados no mesmo lugar (como nas boas-vindas): a
     altura nao muda de um slide para o outro.
   - "Proximo" (contorno verde); no ultimo, "Começar". Da para arrastar
     para os lados. A setinha fecha.
   - GESTO DE VOLTAR DO IPHONE: ao abrir, poe uma "marca" no historico
     (mesmo endereco, como no Onboarding). O gesto so tira a marca e
     fecha a apresentacao, sem sair do Inicio.
   =================================================================== */

/* v7: sem os passos "DAS sem esquecer" e "Nota fiscal" do Inicio (o
   card do DAS e o "Como emitir nota" sairam de la): o DAS e as notas
   ficam no Perfil e no WhatsApp. Novos: o "Atualizar velocímetro" do
   canto e a conversa no WhatsApp. */
const PASSOS_ISA = [
  { alvo: null, titulo: "Oi, sou a Isa", texto: "A assistente com IA do TaCerto. Vou te mostrar o app rapidinho." },
  {
    alvo: "velocimetro",
    titulo: "Seu limite do ano",
    texto: "Quanto você já faturou e quanto ainda pode. Arraste para o lado e veja a média do mês.",
  },
  {
    alvo: "atualizar",
    titulo: "Atualize quando quiser",
    texto: "Toque aqui para mandar o extrato, digitar o total do ano ou me contar no WhatsApp.",
  },
  {
    alvo: "mais",
    titulo: "Recebeu? Lance aqui",
    texto: "Toque no + para lançar o que recebeu, ou para atualizar o total do ano.",
  },
  {
    alvo: "fisco",
    titulo: "Ficou com dúvida?",
    texto: "Pergunte aqui, tire foto do comprovante ou mande um áudio no WhatsApp.",
  },
  {
    tela: "whatsapp",
    alvo: null,
    titulo: "Tudo pelo WhatsApp",
    texto: "Nota fiscal, boleto do DAS, entradas e gastos, dúvidas: é só me mandar mensagem.",
  },
  { alvo: "perfil", titulo: "Seu Perfil", texto: "Seus dados, o DAS, as notas fiscais, o limite restante e o histórico." },
  {
    alvo: "sino",
    titulo: "Notificações",
    texto: "Lembretes aparecem aqui. E esta apresentação, se quiser ver de novo.",
  },
];

/* v6: TUTORIAL DO PRIMEIRO ACESSO (12/10/2026, tarefa de 10-10, Bloco L)
   No maximo 4 telas, o mesmo celular de exemplo. Abre sozinho na
   primeira vez no Inicio (Dashboard) e da para rever em Perfil > Ajuda. */
/* v7 (12/10/2026, pedido do Fernando): a 3a tela da forca ao WhatsApp
   ("a pessoa pode fazer tudo pelo chat do WhatsApp com a Isa: nota,
   duvidas, entradas e gastos, boleto do DAS") e mostra a conversa; a 2a
   diz que o DAS e as notas ficam no Perfil (sairam do Inicio); a 4a
   destaca o "Atualizar velocímetro" do canto do card. */
const PASSOS_TUTORIAL = [
  {
    alvo: "velocimetro",
    titulo: "Seu limite do ano",
    texto: "O velocímetro mostra quanto você já faturou e quanto ainda cabe no limite do MEI.",
  },
  {
    alvo: "perfil",
    titulo: "Seu MEI no Perfil",
    texto: "CNPJ, DAS e notas fiscais ficam no Perfil. O boleto do DAS chega no seu WhatsApp.",
  },
  {
    tela: "whatsapp",
    alvo: null,
    titulo: "Tudo pelo WhatsApp com a Isa",
    texto: "Nota fiscal, boleto do DAS, entradas e gastos, dúvidas: é só mandar mensagem, áudio ou foto.",
  },
  {
    /* o ultimo passo leva ao extrato (botao "Enviar extrato" embaixo) */
    alvo: "atualizar",
    titulo: "Comece pelo extrato",
    texto: "Toque em Atualizar velocímetro e mande o extrato: eu separo o que é faturamento.",
  },
];

/* Alvos redondos (icones soltos): o circulo vira circulo de verdade */
const ALVOS_REDONDOS = ["mais", "perfil", "sino"];

/* Tamanho do desenho (o Inicio de verdade) e o maximo na tela */
/* v3: 390 x 820 (proporcao de um iPhone; antes 744 deixava o celular
   "achatado", pedido do Fernando: estava desproporcional)
   v4: 340 x 715 — a MESMA proporcao, mas o desenho mais justo: o
   conteudo ocupa mais o celular e sobra menos espaco vazio dentro dele
   ("espacamento muito grande"). Celular menor na tela (270 -> 225).
   v7: 390 x 800 — a largura do app de verdade, para usar as MESMAS
   medidas do Inicio (InicioPartes) e o exemplo ficar igual a ele. */
const LARGURA_DESENHO = 390;
const ALTURA_DESENHO = 800;
const LARGURA_MAX_CELULAR = 225;
/* v4: espaco entre o celular e o texto da Isa */
const ESPACO_CELULAR_TEXTO = 20;

/* Saudacao do topo, como no Inicio (sem o nome: e um exemplo) */
function saudacaoDoMomento(agora = new Date()) {
  const h = agora.getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}
/* Folga do circulo em volta da funcao (px do desenho) */
const FOLGA_CIRCULO = 9;

/* Foto redonda da Isa (borda verde fina). v5: era a foto do Fisco */
function FotoFisco({ tamanho = 40 }) {
  return <FotoIsa size={tamanho} borda />;
}

/* Cartao de vidro do velocimetro (o mesmo do Inicio) */
const VIDRO_CARD = {
  ...VIDRO,
  boxShadow:
    "inset 0 1px 0 0 var(--vidro-topo-medio), inset 0 6px 14px -8px var(--vidro-topo-fraco), inset 0 -1.5px 0 0 var(--vidro-base), 0 8px 24px var(--vidro-sombra)",
};

/* v7: o Inicio NOVO desenhado no tamanho real (390), sem nome e sem
   valores, com as pecas e medidas do Dashboard (InicioPartes) */
function InicioDeExemplo() {
  const { tipoMEI } = useAppState();
  const rotuloPerfil = LABEL_TIPO[tipoMEI];
  const V = MEDIDAS_INICIO.velocimetro;
  const C = MEDIDAS_INICIO.card;
  /* exemplo de "ja atualizou": o texto pequeno embaixo do botao */
  const atualizadoEm = new Date().toISOString();

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}>
      {/* topo: logo, saudacao e sininho (igual ao Inicio, sem o nome) */}
      <div className="flex items-start justify-between shrink-0" style={{ padding: "16px 20px 4px" }}>
        <div className="flex flex-col">
          <div className="flex items-center gap-2.5">
            <Gauge size={34} strokeWidth={2.2} style={{ color: "var(--primary)" }} />
            <span className="font-bold text-2xl leading-none">
              Ta<span style={{ color: "var(--primary)" }}>Certo!</span>
            </span>
          </div>
          <span className="font-semibold" style={{ color: "var(--text-secondary)", fontSize: 14, marginTop: 6, lineHeight: "22px" }}>
            {saudacaoDoMomento()}
          </span>
        </div>
        <span data-alvo="sino" className="relative flex items-center justify-center" style={{ width: 38, height: 34, marginRight: -8 }}>
          <Bell size={22} strokeWidth={1.9} style={{ color: "var(--text-secondary)" }} />
        </span>
      </div>

      <div className="flex-1 min-h-0 flex flex-col" style={{ padding: "8px 20px 0" }}>
        {/* card do velocimetro (altura maxima e centrado, como no Inicio) */}
        <div className="flex flex-col flex-1 min-h-0" style={{ maxHeight: C.alturaMax + 21, marginTop: "auto", marginBottom: "auto" }}>
          <div data-alvo="velocimetro" className="relative flex-1 min-h-0 rounded-3xl overflow-hidden flex flex-col" style={VIDRO_CARD}>
            <BotaoAtualizarCanto exemplo quando={atualizadoEm} faltaInformar={false} />
            <div className="flex-1 min-h-0 flex flex-col px-5" style={{ paddingTop: C.topo, paddingBottom: C.base }}>
              <div className="flex-1 min-h-0 flex items-center justify-center">
                <VelocimetroAnimado
                  percentual={58}
                  maxWidth={V.larguraMax}
                  numeroClasse={V.numeroClasse}
                  sempreMostrarBalao
                  tamanhoBalao={V.balao}
                />
              </div>
              <p className="text-center shrink-0" style={{ color: "var(--text-tertiary)", fontSize: 14, marginTop: 6, marginBottom: 2 }}>
                {rotuloPerfil ? `${rotuloPerfil} · anual` : "MEI · anual"}
              </p>
              <div className="flex items-stretch pt-3 shrink-0" style={{ borderTop: "1px solid var(--border)", marginTop: 2 }}>
                {["Faturado", "Limite"].map((rotulo, i) => (
                  <div
                    key={rotulo}
                    className="flex-1 flex flex-col items-center"
                    style={{ borderLeft: i ? "1px solid var(--border)" : "none" }}
                  >
                    <span style={{ fontSize: V.valorPx, fontWeight: 600, lineHeight: 1.1 }}>R$ •••</span>
                    <span className="mt-1" style={{ color: "var(--text-secondary)", fontSize: V.rotuloValorPx }}>{rotulo}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 shrink-0" style={{ marginTop: 10 }}>
            <span className="rounded-full" style={{ width: 11, height: 11, backgroundColor: "var(--primary)", boxShadow: "0 0 9px rgba(34, 197, 94, 0.65)" }} />
            <span className="rounded-full" style={{ width: 9, height: 9, backgroundColor: "var(--primary)", opacity: 0.22 }} />
          </div>
        </div>

        {/* chat da Isa no pe (a mesma barra do Inicio) */}
        <BarraIsaInicio exemplo anexos={MOSTRAR_ANEXOS_CHAT && MOSTRAR_COMPROVANTE_FOTO} />
      </div>

      {/* barra de baixo (a de vidro do Inicio: casinha verde e o + no circulo) */}
      <div
        className="shrink-0 flex items-end justify-around"
        style={{
          padding: "10px 13px 18px",
          background:
            "linear-gradient(160deg, var(--vidro-brilho-1) 0%, var(--vidro-brilho-2) 24%, transparent 58%), var(--vidro-bg)",
          borderTop: "1px solid var(--vidro-borda)",
          boxShadow: "inset 0 1px 0 0 var(--vidro-topo-medio), inset 0 7px 16px -8px var(--vidro-topo-fraco)",
        }}
      >
        <div className="flex flex-col items-center gap-1">
          <Home size={26} strokeWidth={2.5} style={{ color: "var(--primary)" }} />
          <span className="font-medium leading-none" style={{ fontSize: 11, color: "var(--primary)" }}>Início</span>
        </div>
        <span
          data-alvo="mais"
          className="flex items-center justify-center"
          style={{ width: 48, height: 48, borderRadius: "50%", backgroundColor: "var(--primary)" }}
        >
          <Plus size={26} strokeWidth={2.8} style={{ color: "var(--primary-contrast)" }} />
        </span>
        <div data-alvo="perfil" className="flex flex-col items-center gap-1">
          <User size={26} strokeWidth={2} style={{ color: "var(--text-secondary)" }} />
          <span className="font-medium leading-none" style={{ fontSize: 11, color: "var(--text-secondary)" }}>Perfil</span>
        </div>
      </div>
    </div>
  );
}

/* O celular de exemplo, encolhido para caber, com o circulo verde.
   v4: a escala vem de fora (ApresentacaoFisco mede o espaco que sobra
   para o celular e o texto juntos) */
function CelularDeExemplo({ alvo, escala, tela = "inicio" }) {
  const desenhoRef = useRef(null);
  const [circulo, setCirculo] = useState(null);

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
  }, [alvo, escala, tela]);

  return (
    <div className="shrink-0 w-full flex justify-center">
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
          {/* v7: as duas telas uma por cima da outra; troca suave */}
          <div className="absolute inset-0" style={{ opacity: tela === "whatsapp" ? 0 : 1, transition: "opacity 260ms ease" }}>
            <InicioDeExemplo />
          </div>
          <div className="absolute inset-0" style={{ opacity: tela === "whatsapp" ? 1 : 0, transition: "opacity 260ms ease" }}>
            <ConversaIsaExemplo />
          </div>
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

export default function ApresentacaoFisco({ aberto, onFechar, modo = "isa", onEnviarExtrato }) {
  /* v6: "tutorial" = as 4 telas do primeiro acesso; "isa" = a Apresentacao de sempre */
  const tutorial = modo === "tutorial";
  const PASSOS = tutorial ? PASSOS_TUTORIAL : PASSOS_ISA;
  const [atual, setAtual] = useState(0);
  const toqueX = useRef(null);
  const fecharRef = useRef(onFechar);
  fecharRef.current = onFechar;
  const areaRef = useRef(null);
  const textoRef = useRef(null);
  const [escala, setEscala] = useState(0.5);

  /* v4: escala do celular. Celular + texto da Isa ficam JUNTOS e
     centrados no espaco entre o cabecalho e as bolinhas; o celular
     usa a altura que sobra depois do texto (ate o maximo) */
  useLayoutEffect(() => {
    if (!aberto) return undefined;
    const area = areaRef.current;
    const texto = textoRef.current;
    if (!area || !texto) return undefined;
    const medir = () => {
      const cs = getComputedStyle(area);
      const largura = area.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      const altura =
        area.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom)
        - texto.offsetHeight - ESPACO_CELULAR_TEXTO;
      const e = Math.min(
        largura / LARGURA_DESENHO,
        altura / ALTURA_DESENHO,
        LARGURA_MAX_CELULAR / LARGURA_DESENHO,
      );
      if (e > 0) setEscala(e);
    };
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(area);
    ro.observe(texto);
    return () => ro.disconnect();
  }, [aberto]);

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
      aria-label={tutorial ? "Como funciona o TaCerto" : "Apresentação da Isa"}
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
          style={{ width: 46, height: 46, border: "1px solid var(--border)", background: "none" }}
        >
          <ArrowLeft size={24} strokeWidth={2} style={{ color: "var(--text)" }} />
        </button>
        <span className="font-bold truncate flex-1 min-w-0" style={{ fontSize: 20 }}>
          {tutorial ? "Como funciona" : "Apresentação da Isa"}
        </span>
        {/* v6: no tutorial, "Pular tutorial" sempre a mao */}
        {tutorial && (
          <button
            type="button"
            onClick={onFechar}
            className="toque shrink-0 font-medium"
            style={{ fontSize: 14.5, color: "var(--text-secondary)", background: "none", padding: "8px 2px" }}
          >
            Pular tutorial
          </button>
        )}
      </div>

      {/* Celular + texto: da para arrastar para os lados.
          v4: os dois juntos, centrados na altura que sobra */}
      <div
        ref={areaRef}
        className="flex-1 min-h-0 flex flex-col justify-center"
        style={{ touchAction: "pan-y", padding: "12px 24px 0" }}
        onTouchStart={inicioToque}
        onTouchEnd={fimToque}
      >
        <CelularDeExemplo alvo={PASSOS[atual].alvo} escala={escala} tela={PASSOS[atual].tela} />

        {/* Todos os textos no mesmo lugar: a altura nao muda */}
        <div ref={textoRef} className="shrink-0 grid" style={{ marginTop: ESPACO_CELULAR_TEXTO }}>
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
        {tutorial && ultimo ? (
          /* v6: o ultimo passo do tutorial ja leva ao extrato */
          <>
            <button
              type="button"
              onClick={() => (onEnviarExtrato ? onEnviarExtrato() : onFechar())}
              className="toque botao-confirmar relative w-full rounded-2xl font-semibold"
              style={{ padding: "13px 0", fontSize: 16 }}
            >
              <SeloRecomendado />
              Enviar extrato
            </button>
            <button
              type="button"
              onClick={onFechar}
              className="toque w-full font-medium"
              style={{ marginTop: 6, padding: "9px 0", fontSize: 15, color: "var(--text-secondary)", background: "none" }}
            >
              Agora não
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={proximo}
              className="toque botao-confirmar w-full rounded-2xl font-semibold"
              style={{ padding: "13px 0", fontSize: 16 }}
            >
              {ultimo ? "Começar" : "Próximo"}
            </button>
            {/* v7: no tutorial, o lugar do "Agora não" fica reservado em
                todos os passos: assim o celular nao encolhe no ultimo */}
            {tutorial && (
              <span aria-hidden className="block w-full font-medium" style={{ marginTop: 6, padding: "9px 0", fontSize: 15, visibility: "hidden" }}>
                Agora não
              </span>
            )}
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
