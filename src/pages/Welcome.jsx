/* WELCOME v22 — celular até 70% da tela, proporcional e bloco centralizado (v21: mini-Início e cinco opções da nota) */
/* ===================================================================
   TELA DE BOAS-VINDAS (antes do login/cadastro)

   v6 (04/10/2026) — pedido do Fernando:
   - BUG DO SLIDE 2: na v5 cada desenho escolhia a propria escala para
     caber na moldura. No iPhone o slide 1 ficava em tamanho cheio e o
     2 (e o 3) um pouco menores: o desenho mudava de tamanho no meio do
     deslize e parecia desenquadrado. E a altura do texto de baixo
     dependia do texto de cada slide (frase de 3 linhas em tela estreita
     empurraria "Criar conta"). Agora: UMA escala para todos
     (useEscalaComum) e o bloco de texto com a altura do texto mais alto
     (todos empilhados, so o atual visivel). Nenhum elemento aparece ou
     some entre um slide e outro.
   - 5 SLIDES, so com o que o piloto entrega: limite (MiniInicio) / DAS
     com aviso e boleto no WhatsApp (MiniDas) / ajuda com a nota pelo
     WhatsApp (MiniNota) / gratis no piloto (MiniPiloto, com o Fisco
     fazendo joinha) / Fisco no WhatsApp (MiniWhatsApp). Nada de banco
     conectado, nota automatica ou chat com IA no app.
   - O ponteiro do velocimetro do slide 1 e o desenho de sempre (ele
     nunca teve animacao nos slides) — nao mudou.

   v5 (04/10/2026) — pedido do Fernando, depois de testar no iPhone:
   - LINGUAGEM NEUTRA: aqui a pessoa ainda nao disse se e MEI ou MEI
     Caminhoneiro, entao nada de "frete" ou "transportadora". O texto
     so muda pelo tipo DEPOIS que a pessoa escolhe (no onboarding).
     O slide 1 voltou ao texto da v3.
   - SLIDE 2 NOVO (MiniDasNota): "DAS e nota sem mistério" — o card
     "Próximo DAS" com "Pagar no gov.br" e o passo a passo da nota, que
     sao do piloto. O antigo "O Fisco organiza pra você" (MiniConferir)
     continua aqui e volta sozinho se o card do DAS ou o tutorial da
     nota forem desligados em src/config/piloto.js.
   - SLIDE 3 (WhatsApp) mais enxuto: so a pergunta das 21h, a resposta
     e a confirmacao. Neutro ("Cliente", "Recebido hoje").
   - ENQUADRAMENTO: no iPhone a moldura (48dvh) e mais baixa que no PC,
     e o desenho do slide 2 ficava com o "Sim/Não" cortado atras do card
     de baixo (o do slide 3 cortava a barra de digitar). Agora cada
     desenho passa pelo MiniEncaixada: se for mais alto que a moldura,
     ele encolhe um pouco ate caber INTEIRO. Vale para qualquer iPhone.

   v4 (04/10/2026, PILOTO): o desenho da v3 NAO mudou, so TEXTOS.
   - O slide do banco (Open Finance) e o dos historicos (saidas, DAS,
     notas) ficam escondidos enquanto essas funcoes estao desligadas no
     piloto; o simbolo do banco some do mini Inicio pelo mesmo motivo.
     Ficam 3 slides: limite / so conta o que e frete / Fisco no WhatsApp.
   - Textos para o caminhoneiro: "com seus fretes", "Só conta o que é
     frete", e o WhatsApp como e no piloto (todo dia as 21h o Fisco
     pergunta quanto a pessoa recebeu; a conversa de exemplo anota um
     frete em vez de emitir nota). A barrinha do mini Inicio diz
     "Fisco no WhatsApp".

   v3 (03/10/2026): pedido do Fernando — os slides voltam a ser
   FICTICIOS como na v1 (sem nomes de pessoas nem valores: "R$ •••",
   "Cliente", "Recebimento"), no mesmo desenho simplificado de antes,
   mas com o visual atual do app (cards com borda fina, vidro, balao
   "?", Fisco). Nao e mais "print" da tela real.
   ⚠️ TITULOS CURTOS (cabem em UMA linha no iPhone): na v2 o titulo
   "Entradas e gastos chegam sozinhos" quebrava em duas linhas, o card
   de baixo crescia e empurrava "Criar conta"/"Entrar" para baixo. O
   card de baixo tem que ficar IGUAL em todos os slides.

   v2 (03/10/2026): slides do posicionamento novo (gestao do MEI:
   entradas e gastos) desenhados no tamanho real do app e encolhidos.

   5 slides: limite (velocimetro) / banco (entradas e gastos chegam
   sozinhos) / Fisco aprende ("É faturamento?") / historicos (entradas,
   saidas, DAS, notas) / Fisco no WhatsApp (duvida + nota). Tudo como
   pronto, a pedido do Fernando. Texto vale igual para MEI e MEI
   Caminhoneiro.

   NAO MUDA: tamanho do celular de exemplo (250 px x 48dvh), a linha
   verde em volta, e o card de baixo (texto, bolinhas, "Criar conta",
   "Já tem conta? Entrar").
   =================================================================== */
import { useNavigate } from "react-router-dom";
import { useState, useRef, useEffect, useLayoutEffect } from "react";
import {
  Gauge, ArrowLeft, ChevronRight, ChevronDown,
  ArrowDownLeft, ArrowUpRight, CalendarCheck, FileText, Check, CheckCheck,
  MessageCircle, Headphones, ListChecks, Globe, CheckCircle2,
} from "lucide-react";
import useTemaEscuroForcado from "@/hooks/useTemaEscuroForcado";
import { supabase } from "@/lib/supabase";
import { estaInstalado } from "@/lib/notificacoesCelular";
import { FOTO_ISA_256 } from "@/components/FotoIsa";
import SimboloPluggy from "@/components/SimboloPluggy";
import { UltimosLancamentos, MEDIDAS_INICIO } from "@/components/InicioPartes";
import {
  MOSTRAR_OPEN_FINANCE, MOSTRAR_SAIDAS, MOSTRAR_HISTORICO_DAS, MOSTRAR_NOTAS_FISCAIS,
  MOSTRAR_CARD_DAS, MOSTRAR_TUTORIAL_NOTA,
} from "@/config/piloto";

const VERDE = "var(--primary)";

/* v11: DESTAQUE DISCRETO dos slides — so a borda verde fina, sem fundo
   verde, sem selo e sem mudar o tamanho do card (pedido do Fernando:
   "mais discreto, mais profissional"). Usar em todo destaque novo. */
const DESTAQUE_BORDA = "rgba(34,197,94,0.4)";

/* Borda fina dos cards (igual ao .card-tacerto do app). */
const CARD = { border: "1px solid var(--card-borda)", backgroundColor: "transparent" };

/* Vidro dos cards do Início. */
const VIDRO = {
  background:
    "linear-gradient(160deg, var(--vidro-brilho-1) 0%, var(--vidro-brilho-2) 24%, transparent 58%), var(--vidro-bg)",
  border: "1px solid var(--vidro-borda)",
  boxShadow: "inset 0 1px 0 0 var(--vidro-topo-medio), 0 6px 18px var(--vidro-sombra)",
};

/* ===================================================================
   ENCAIXE NA MOLDURA (v6 — UMA escala para TODOS os slides)

   A moldura do celular tem 48dvh: no iPhone (com as barras do Safari)
   ela fica bem mais baixa que no PC. Se algum desenho for mais alto que
   a moldura, os desenhos ENCOLHEM por igual ate caber inteiros.

   v5 errava aqui (era o BUG do slide 2): cada slide escolhia a SUA
   escala. No iPhone o slide 1 ficava em tamanho cheio e os slides 2 e
   3 um pouco menores, entao o desenho "mudava de tamanho" no meio do
   deslize e parecia desenquadrado. Agora o Welcome mede todos os
   desenhos (useEscalaComum) e usa a MESMA escala em todos: nada muda
   de tamanho entre um slide e outro.

   O desenho e montado mais largo (100% / escala) e depois encolhido,
   entao continua ocupando a largura toda da moldura.

   v11 (05/10/2026) — LETRAS MAIORES: os desenhos podem AMPLIAR ate
   ZOOM_SLIDES (10%), todos por igual, quando a moldura tem altura para
   isso. A moldura agora ocupa o espaco entre o logo e o card de baixo
   (antes era 48dvh fixo e sobrava uma faixa vazia embaixo do card no
   iPhone), com altura maxima MOLDURA_MAX. Em tela baixa continua
   encolhendo como antes.
   =================================================================== */
const ZOOM_SLIDES = 1.1;
const MOLDURA_MAX = 300;
const LARGURA_MOLDURA = 272;

function useEscalaComum(molduraRef, caixasRef, quantos) {
  const [ajuste, setAjuste] = useState({ escala: 1, altura: null, escalaNota: 1, alturaNota: null });

  useLayoutEffect(() => {
    const moldura = molduraRef.current;
    if (!moldura) return undefined;

    const medir = () => {
      const disponivel = moldura.clientHeight;
      // v10: o slide da nota (foraDaEscala) nao entra na conta — ver MiniNota
      const caixas = caixasRef.current
        .slice(0, quantos)
        .filter((c) => c && !c.dataset.foraDaEscala);
      if (!disponivel || !caixas.length) return;
      // Altura natural de cada desenho: com altura solta e na largura de
      // desenho (a moldura dividida pelo zoom)
      let maior = 0;
      for (const caixa of caixas) {
        const antes = { h: caixa.style.height, w: caixa.style.width };
        caixa.style.height = "auto";
        caixa.style.width = `${100 / ZOOM_SLIDES}%`;
        maior = Math.max(maior, caixa.scrollHeight);
        caixa.style.height = antes.h;
        caixa.style.width = antes.w;
      }
      // v11: amplia ate ZOOM_SLIDES; encolhe se nao couber
      const escala = Math.min(ZOOM_SLIDES, disponivel / maior);
      const altura = disponivel / escala;
      // A nota fica fora da escala comum, mas também precisa caber inteira.
      let maiorNota = 0;
      caixasRef.current.slice(0, quantos).filter((c) => c?.dataset.foraDaEscala).forEach((caixa) => {
        const antes = { h: caixa.style.height, w: caixa.style.width };
        caixa.style.height = "auto";
        caixa.style.width = `${100 / escala}%`;
        maiorNota = Math.max(maiorNota, caixa.scrollHeight);
        caixa.style.height = antes.h;
        caixa.style.width = antes.w;
      });
      const escalaNota = maiorNota ? Math.min(escala, disponivel / maiorNota) : escala;
      const alturaNota = disponivel / escalaNota;
      setAjuste((a) =>
        a.altura && Math.abs(a.altura - altura) < 0.5 && Math.abs(a.escala - escala) < 0.002 && Math.abs(a.escalaNota - escalaNota) < 0.002
          ? a
          : { escala, altura, escalaNota, alturaNota },
      );
    };

    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(moldura);
    document.fonts?.ready?.then(medir).catch(() => {});
    return () => ro.disconnect();
  }, [molduraRef, caixasRef, quantos]);

  return ajuste;
}

/* O desenho dentro da moldura, com a escala comum (ver acima). */
function MiniNaMoldura({ ajuste, caixaRef, foraDaEscala = false, children }) {
  // v11: a escala pode ser maior que 1 (zoom das letras)
  const escala = foraDaEscala ? ajuste.escalaNota : ajuste.escala;
  const altura = foraDaEscala ? ajuste.alturaNota : ajuste.altura;
  const encolhe = escala !== 1;
  return (
    <div
      ref={caixaRef}
      data-fora-da-escala={foraDaEscala ? "1" : undefined}
      className="flex flex-col"
      style={{
        height: altura ?? "100%",
        width: encolhe ? `${100 / escala}%` : "100%",
        transform: encolhe ? `scale(${escala})` : undefined,
        transformOrigin: "top left",
      }}
    >
      {children}
    </div>
  );
}

/* Cada mini-tela ocupa a altura toda do celular (nada de espaco vazio:
   o que fica no pe usa marginTop auto). */
function MiniTela({ children, padding = "16px 14px 12px", fundo }) {
  return (
    <div className="flex flex-col h-full" style={{ padding, backgroundColor: fundo }}>
      {children}
    </div>
  );
}

/* Cabeçalho da mini-tela: setinha redonda + título ao lado (como no app). */
function MiniHeader({ titulo }) {
  return (
    <div className="flex items-center gap-2.5 shrink-0" style={{ marginBottom: 16 }}>
      <span
        className="rounded-full flex items-center justify-center shrink-0"
        style={{ width: 26, height: 26, border: "1px solid var(--border)" }}
      >
        <ArrowLeft size={14} strokeWidth={2.2} style={{ color: "var(--text)" }} />
      </span>
      <span className="font-bold" style={{ color: "var(--text)", fontSize: 14 }}>{titulo}</span>
    </div>
  );
}

/* Velocímetro pequeno — arco colorido com glow, risquinhos, ponteiro
   em losango e cubo central. Só a %, sem valores em reais. */
function MiniVelocimetro({ pct = 58 }) {
  const cx = 100, cy = 100, r = 80;
  const arcLength = Math.PI * r;
  const filled = (pct / 100) * arcLength;
  const arcPath = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;
  const gid = "mv-grad", gl = "mv-glow";

  const N = 9;
  const ticks = [];
  for (let i = 0; i <= N; i++) {
    const t = Math.PI - (i / N) * Math.PI;
    const rIn = 60;
    const rOut = i % 2 === 0 ? 71 : 66;
    ticks.push({
      x1: cx + rIn * Math.cos(t),
      y1: cy - rIn * Math.sin(t),
      x2: cx + rOut * Math.cos(t),
      y2: cy - rOut * Math.sin(t),
      on: (i / N) * 100 <= pct + 1,
    });
  }

  const needleR = 58, baseHalf = 6, midHalf = 2.6, midR = needleR * 0.45;
  const tipX = cx - needleR, tipY = cy;
  const mx = cx - midR;
  const needlePoints = `${cx},${cy - baseHalf} ${mx},${cy - midHalf} ${tipX},${tipY} ${mx},${cy + midHalf} ${cx},${cy + baseHalf}`;
  const rot = (pct / 100) * 180;

  return (
    <svg viewBox="0 0 200 120" width="140" height="84" aria-hidden className="block mx-auto">
      <defs>
        <linearGradient id={gid} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#16d65a" />
          <stop offset="45%" stopColor="#a3e635" />
          <stop offset="70%" stopColor="#facc15" />
          <stop offset="88%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#ef4444" />
        </linearGradient>
        <filter id={gl} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2.2" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <path d={arcPath} fill="none" stroke={`url(#${gid})`} strokeWidth={14} strokeLinecap="round" opacity={0.18} />
      <path
        d={arcPath} fill="none" stroke={`url(#${gid})`} strokeWidth={14} strokeLinecap="round"
        strokeDasharray={`${filled} ${arcLength}`} filter={`url(#${gl})`}
      />
      {ticks.map((tk, i) => (
        <line
          key={i} x1={tk.x1} y1={tk.y1} x2={tk.x2} y2={tk.y2}
          stroke={tk.on ? "var(--text)" : "var(--text-tertiary)"}
          strokeWidth={i % 2 === 0 ? 2 : 1.3} strokeLinecap="round" opacity={tk.on ? 0.9 : 0.4}
        />
      ))}
      <g style={{ transformOrigin: "100px 100px", transform: `rotate(${rot}deg)` }}>
        <polygon points={needlePoints} fill="var(--text)" />
      </g>
      <circle cx={cx} cy={cy} r={7} fill="var(--text)" />
      <circle cx={cx} cy={cy} r={3} fill="var(--surface)" />
    </svg>
  );
}

/* Foto redonda da assistente (v15: a Isa; antes o robo Fisco) com a bolinha verde. */
function FotoFisco({ tamanho = 46, borda = "var(--bg)" }) {
  return (
    <span className="relative shrink-0" style={{ width: tamanho, height: tamanho }}>
      <span
        className="rounded-full overflow-hidden block"
        style={{ width: tamanho, height: tamanho, ...VIDRO, border: "1.5px solid rgba(34,197,94,0.45)" }}
      >
        <img src={FOTO_ISA_256} alt="" decoding="async" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </span>
      <span
        className="absolute rounded-full"
        style={{ width: tamanho * 0.27, height: tamanho * 0.27, backgroundColor: VERDE, border: `2.5px solid ${borda}`, bottom: 0, right: 0 }}
      />
    </span>
  );
}

/* Linha de movimentação: entrada (↙ verde, "+") ou saída (↗, "-"). */
function LinhaMov({ entrada, quando }) {
  const Icone = entrada ? ArrowDownLeft : ArrowUpRight;
  return (
    <div className="rounded-xl flex items-center gap-2" style={{ ...CARD, padding: "7px 10px" }}>
      <Icone size={14} strokeWidth={2.2} style={{ color: entrada ? VERDE : "var(--text-secondary)" }} className="shrink-0" />
      <span className="flex-1 min-w-0">
        <span className="block font-semibold" style={{ color: "var(--text)", fontSize: 11.5 }}>{entrada ? "Recebimento" : "Pagamento"}</span>
        <span className="block" style={{ color: "var(--text-secondary)", fontSize: 9.5 }}>{quando} · Pix</span>
      </span>
      <span className="font-bold shrink-0" style={{ color: entrada ? VERDE : "var(--text)", fontSize: 11.5 }}>
        {entrada ? "+" : "-"} R$ •••
      </span>
    </div>
  );
}

/* ------------------------------ 1. LIMITE ------------------------------ */
function MiniInicio() {
  // A peça real é reduzida por inteiro, sem alterar suas medidas compartilhadas.
  const m = MEDIDAS_INICIO.ultimos;
  // A barra antiga ocupava 44 px + 12 px: preserva a altura natural de 314 px.
  const alturaUltimos = 56;
  const escalaUltimos = alturaUltimos / (m.titulo + m.linha + m.margemCima + m.margemBaixo);
  return (
    <MiniTela>
      <div className="flex items-center justify-between shrink-0" style={{ marginBottom: 12 }}>
        <span className="flex items-center gap-1.5">
          <Gauge size={18} strokeWidth={2.3} style={{ color: VERDE }} />
          <span className="font-bold" style={{ color: "var(--text)", fontSize: 14 }}>
            Ta<span style={{ color: VERDE }}>Certo!</span>
          </span>
        </span>
        {/* Piloto: sem Open Finance, o Inicio nao tem o simbolo do banco */}
        {MOSTRAR_OPEN_FINANCE && <SimboloPluggy altura={14} />}
      </div>

      <div className="rounded-2xl shrink-0" style={{ ...VIDRO, padding: "12px 12px 10px" }}>
        <MiniVelocimetro pct={58} />
        <div className="flex items-center justify-center gap-2" style={{ marginTop: -2 }}>
          <span className="font-bold" style={{ color: "var(--text)", fontSize: 24, lineHeight: 1 }}>58%</span>
          <span
            className="rounded-full flex items-center justify-center font-bold"
            style={{ width: 20, height: 20, fontSize: 11, color: VERDE, backgroundColor: "rgba(34,197,94,0.14)", border: "1px solid rgba(34,197,94,0.5)" }}
          >
            ?
          </span>
        </div>
        <p className="text-center" style={{ color: "var(--text-tertiary)", fontSize: 9.5, marginTop: 8 }}>MEI · anual</p>
        <div className="flex items-center" style={{ borderTop: "1px solid var(--border)", marginTop: 6, paddingTop: 7 }}>
          <div className="flex-1 flex flex-col items-center">
            <span className="font-bold" style={{ color: "var(--text)", fontSize: 11.5 }}>R$ •••</span>
            <span style={{ color: "var(--text-secondary)", fontSize: 9 }}>Faturado</span>
          </div>
          <div style={{ width: 1, alignSelf: "stretch", backgroundColor: "var(--border)" }} />
          <div className="flex-1 flex flex-col items-center">
            <span className="font-bold" style={{ color: "var(--text)", fontSize: 11.5 }}>R$ •••</span>
            <span style={{ color: "var(--text-secondary)", fontSize: 9 }}>Limite</span>
          </div>
        </div>
      </div>

      {/* Mesma peça do Início, só ilustrativa; a moldura mantém sua altura. */}
      <div className="welcome-ultimos-mini relative shrink-0 overflow-hidden" style={{ marginTop: "auto", height: alturaUltimos }}>
        <style>{`
          .welcome-ultimos-mini [data-alvo="ultimos"] { height: ${m.titulo + m.linha}px !important; }
          .welcome-ultimos-mini [data-alvo="ultimos"] > span:nth-of-type(n + 2) { display: none; }
        `}</style>
        <div
          className="absolute top-0 left-0 flex flex-col"
          style={{ width: `${100 / escalaUltimos}%`, transform: `scale(${escalaUltimos})`, transformOrigin: "top left" }}
        >
          <UltimosLancamentos exemplo />
        </div>
      </div>
    </MiniTela>
  );
}

/* ------------------------------ 2. BANCO ------------------------------ */
function MiniBanco() {
  const linhas = [
    { entrada: true, quando: "Hoje" },
    { entrada: false, quando: "Hoje" },
    { entrada: true, quando: "Ontem" },
    { entrada: false, quando: "Ontem" },
    { entrada: true, quando: "Ontem" },
    { entrada: false, quando: "Seg" },
  ];
  return (
    <MiniTela>
      <MiniHeader titulo="Conexão bancária" />
      <div className="rounded-2xl flex items-center gap-2.5 shrink-0" style={{ ...VIDRO, padding: "9px 11px", marginBottom: 10 }}>
        <SimboloPluggy altura={16} />
        <span className="flex-1 min-w-0">
          <span className="block font-semibold" style={{ color: "var(--text)", fontSize: 11.5 }}>Banco conectado</span>
          <span className="block" style={{ color: "var(--text-secondary)", fontSize: 9.5 }}>Atualizado agora</span>
        </span>
        <span className="rounded-full flex items-center justify-center shrink-0" style={{ width: 18, height: 18, backgroundColor: "rgba(34,197,94,0.16)" }}>
          <Check size={11} strokeWidth={3} style={{ color: VERDE }} />
        </span>
      </div>
      <div className="flex flex-col overflow-hidden" style={{ gap: 6 }}>
        {linhas.map((l, i) => <LinhaMov key={i} {...l} />)}
      </div>
    </MiniTela>
  );
}

/* ---------------------------- 3. CONFERIR ---------------------------- */
function MiniConferir() {
  return (
    <MiniTela>
      <p className="font-bold text-center shrink-0" style={{ color: "var(--text)", fontSize: 16, marginTop: 4 }}>Novas entradas</p>
      <p className="text-center shrink-0" style={{ color: "var(--text-secondary)", fontSize: 9.5, marginTop: 8, marginBottom: 5 }}>1 de 3</p>
      <div className="rounded-full overflow-hidden shrink-0" style={{ height: 3, backgroundColor: "var(--border)" }}>
        <div style={{ height: "100%", width: "33%", backgroundColor: VERDE }} />
      </div>

      <div className="rounded-2xl shrink-0" style={{ ...CARD, marginTop: 12, padding: "10px 11px" }}>
        <p className="font-semibold uppercase" style={{ color: "var(--text-tertiary)", fontSize: 8, letterSpacing: "0.08em" }}>Pagador</p>
        <div className="flex items-center gap-2" style={{ marginTop: 6 }}>
          <span
            className="rounded-full flex items-center justify-center shrink-0 font-bold"
            style={{ width: 26, height: 26, fontSize: 11, backgroundColor: "rgba(34,197,94,0.14)", color: VERDE }}
          >
            C
          </span>
          <span className="flex-1 min-w-0">
            <span className="block font-bold" style={{ color: "var(--text)", fontSize: 12 }}>Cliente</span>
            <span className="block" style={{ color: "var(--text-tertiary)", fontSize: 9 }}>••.•••.•••/••••-••</span>
          </span>
        </div>
        <div style={{ borderTop: "1px dashed var(--border)", margin: "9px 0 7px" }} />
        {[["Entradas", "3"], ["Meio", "Pix"]].map(([r, v]) => (
          <div key={r} className="flex justify-between" style={{ fontSize: 9.5, padding: "2px 0" }}>
            <span style={{ color: "var(--text-tertiary)" }}>{r}</span>
            <span className="font-semibold" style={{ color: "var(--text)" }}>{v}</span>
          </div>
        ))}
        <div className="flex items-baseline justify-between" style={{ borderTop: "1px dashed var(--border)", marginTop: 6, paddingTop: 6 }}>
          <span style={{ color: "var(--text-secondary)", fontSize: 9.5 }}>Total recebido</span>
          <span className="font-bold" style={{ color: VERDE, fontSize: 14 }}>R$ •••</span>
        </div>
      </div>

      <div className="shrink-0" style={{ marginTop: "auto", paddingTop: 12 }}>
        <p className="font-bold text-center" style={{ color: "var(--text)", fontSize: 13.5 }}>É faturamento?</p>
        <div className="flex" style={{ gap: 7, marginTop: 9 }}>
          <span className="flex-1 rounded-xl font-bold text-center" style={{ padding: "8px 0", fontSize: 12, backgroundColor: VERDE, color: "var(--primary-contrast)" }}>Sim</span>
          <span className="flex-1 rounded-xl font-bold text-center" style={{ padding: "8px 0", fontSize: 12, border: "1.5px solid var(--border)", color: "var(--text)" }}>Não</span>
        </div>
      </div>
    </MiniTela>
  );
}

/* --------------------------- 2. DAS (v6) ---------------------------
   O Inicio com o card "Próximo DAS" e, subindo de baixo, o painel
   "Como você quer pagar seu DAS?" — igual ao do app. A primeira opcao
   (boleto todo mes no WhatsApp) com o destaque leve. Neutro. */
function MiniDas() {
  /* v11: sem o selo "Automático" (que deixava o card mais alto): a
     palavra foi para a frase. Destaque so na borda verde fina. */
  const opcoes = [
    { Icon: MessageCircle, t: "Boleto automático no WhatsApp" },
    { Icon: Headphones, t: "A Isa me ajuda agora" },
    { Icon: ListChecks, t: "Quero fazer sozinho" },
    { Icon: Globe, t: "Abrir o site do governo" },
  ];
  return (
    <MiniTela padding="16px 0 0">
      <div className="flex items-center gap-1.5 shrink-0" style={{ margin: "0 14px 10px" }}>
        <Gauge size={18} strokeWidth={2.3} style={{ color: VERDE }} />
        <span className="font-bold" style={{ color: "var(--text)", fontSize: 14 }}>
          Ta<span style={{ color: VERDE }}>Certo!</span>
        </span>
      </div>

      {/* card "Próximo DAS", igual ao do Inicio */}
      <div className="rounded-2xl flex items-center gap-2 shrink-0" style={{ ...CARD, margin: "0 14px", padding: "9px 9px 9px 11px", opacity: 0.55 }}>
        <span className="flex-1 min-w-0">
          <span className="block whitespace-nowrap" style={{ color: "var(--text-secondary)", fontSize: 10 }}>Próximo DAS: 20/••</span>
          <span className="block font-bold" style={{ color: "var(--text)", fontSize: 12.5, marginTop: 1 }}>R$ •••</span>
        </span>
        <span
          className="rounded-lg font-semibold shrink-0"
          style={{ fontSize: 10, padding: "5px 8px", color: VERDE, border: `1px solid ${DESTAQUE_BORDA}` }}
        >
          Emitir boleto
        </span>
      </div>

      {/* painel que sobe de baixo, no pe. v11: ele CRESCE para ocupar a
          sobra (flexGrow) e as opcoes se espalham por igual — sem vao preto
          entre o card do DAS e o painel. Em tela baixa fica como antes. */}
      <div
        className="rounded-t-2xl flex flex-col"
        style={{ ...VIDRO, marginTop: 14, flexGrow: 1, borderBottom: "none", padding: "8px 11px 12px" }}
      >
        <div className="mx-auto rounded-full" style={{ width: 28, height: 3, backgroundColor: "var(--border)", marginBottom: 8 }} />
        <p className="font-bold text-center" style={{ color: "var(--text)", fontSize: 11.5, marginBottom: 8 }}>
          Como você quer pagar seu DAS?
        </p>
        <div className="flex flex-col" style={{ gap: 5, flexGrow: 1, justifyContent: "space-evenly" }}>
          {opcoes.map(({ Icon, t }, i) => (
            <div
              key={t}
              className="rounded-xl flex items-center gap-2"
              style={{
                padding: "6px 8px",
                border: `1px solid ${i === 0 ? DESTAQUE_BORDA : "var(--card-borda)"}`,
              }}
            >
              <Icon size={13} strokeWidth={2.2} style={{ color: VERDE }} className="shrink-0" />
              <span className="flex-1 min-w-0 truncate font-semibold" style={{ color: "var(--text)", fontSize: 10.5, lineHeight: 1.25 }}>{t}</span>
            </div>
          ))}
        </div>
      </div>
    </MiniTela>
  );
}

/* MiniNota: cinco opcoes e o card do pe, com gap fixo de 6 px.
   foraDaEscala permanece: usa a escala comum sem altera-la.
   Espaco extra fica ao redor do grupo, sem afastar as opcoes. */
function MiniNota() {
  const opcoes = [
    { Icon: ListChecks, t: "Passo a passo", d: "Emita pelo gov.br sem se perder" },
    { Icon: MessageCircle, t: "Tire dúvidas com a Isa", d: "Ela responde aqui no app" },
    { Icon: FileText, t: "Guarde suas notas", d: "Foto ou PDF, tudo num lugar" },
    { Icon: CheckCircle2, t: "Selo com nota", d: "Saiba o que já tem nota" },
    { Icon: CalendarCheck, t: "Histórico de notas", d: "Veja quanto já emitiu no ano" },
  ];
  return (
    <MiniTela>
      <MiniHeader titulo="Emitir nota fiscal" />

      <p className="font-semibold shrink-0" style={{ color: "var(--text-secondary)", fontSize: 10.5, marginBottom: 7 }}>
        Do jeito que você quiser
      </p>

      {/* A sobra fica ao redor do grupo, nunca entre as opções. */}
      <div style={{ marginBlock: "auto" }}>
        <div className="flex flex-col" style={{ gap: 6 }}>
          {opcoes.map(({ Icon, t, d }, i) => (
            <div
              key={t}
              className="rounded-xl flex items-center gap-2.5 shrink-0"
              style={{ padding: "4px 9px", border: `1px solid ${i === 0 ? DESTAQUE_BORDA : "var(--card-borda)"}` }}
            >
              <Icon size={14} strokeWidth={2.2} style={{ color: VERDE }} className="shrink-0" />
              <span className="flex-1 min-w-0">
                <span className="block font-bold truncate" style={{ color: "var(--text)", fontSize: 11, lineHeight: 1.25 }}>{t}</span>
                <span className="block truncate" style={{ color: "var(--text-secondary)", fontSize: 9.5, lineHeight: 1.3 }}>{d}</span>
              </span>
            </div>
          ))}
        </div>

        {/* no pe: o resultado */}
        <div className="rounded-xl flex items-center gap-2.5 shrink-0" style={{ ...CARD, marginTop: 6, padding: "5px 9px" }}>
          <CheckCircle2 size={16} strokeWidth={2.2} style={{ color: VERDE }} className="shrink-0" />
          <span className="flex-1 min-w-0">
            <span className="block font-bold" style={{ color: "var(--text)", fontSize: 11, lineHeight: 1.25 }}>Notas organizadas</span>
            <span className="block truncate" style={{ color: "var(--text-secondary)", fontSize: 9.5, lineHeight: 1.3 }}>Guarde o PDF na aba Notas</span>
          </span>
        </div>
      </div>
    </MiniTela>
  );
}

/* -------------------------- 4. PILOTO (v6) --------------------------
   O resumo do que o piloto da, de graca. v15: a foto da Isa (antes o
   Fisco fazendo joinha). */
function MiniPiloto() {
  /* v12: cada item e uma FACILIDADE (pedido do Fernando), frase curta
     para caber em uma linha */
  const itens = [
    "Limite anual acompanhado 24h",
    "Boleto do DAS no WhatsApp",
    "Emissão de nota fiscal",
    "Isa, assistente virtual 24h",
  ];
  return (
    <MiniTela>
      <div className="flex flex-col items-center shrink-0" style={{ marginTop: "auto" }}>
        <span className="rounded-full overflow-hidden block" style={{ width: 74, height: 74, ...VIDRO, border: "1.5px solid rgba(34,197,94,0.45)" }}>
          <img src={FOTO_ISA_256} alt="" decoding="async" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </span>
        <span
          className="rounded-full font-bold"
          style={{ fontSize: 11, padding: "4px 12px", marginTop: 10, color: VERDE, border: `1px solid ${DESTAQUE_BORDA}` }}
        >
          Grátis
        </span>
      </div>
      <div className="flex flex-col shrink-0" style={{ gap: 6, marginTop: 14, marginBottom: "auto" }}>
        {itens.map((t) => (
          <div key={t} className="rounded-xl flex items-center gap-2" style={{ ...CARD, padding: "7px 10px" }}>
            <span className="rounded-full flex items-center justify-center shrink-0" style={{ width: 16, height: 16, backgroundColor: "rgba(34,197,94,0.16)" }}>
              <Check size={10} strokeWidth={3} style={{ color: VERDE }} />
            </span>
            <span className="font-semibold" style={{ color: "var(--text)", fontSize: 11 }}>{t}</span>
          </div>
        ))}
      </div>
    </MiniTela>
  );
}

/* --------------------------- 4. HISTÓRICOS --------------------------- */
function MiniHistoricos() {
  const itens = [
    { Icon: ArrowDownLeft, t: "Entradas" },
    { Icon: ArrowUpRight, t: "Saídas" },
    { Icon: CalendarCheck, t: "DAS" },
    { Icon: FileText, t: "Notas fiscais" },
  ];
  const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const pagos = 9;
  return (
    <MiniTela>
      <MiniHeader titulo="Meu MEI" />
      <div className="grid grid-cols-2 shrink-0" style={{ gap: 6 }}>
        {itens.map(({ Icon, t }) => (
          <div key={t} className="rounded-xl flex items-center gap-1.5" style={{ ...CARD, padding: "8px 9px" }}>
            <Icon size={13} strokeWidth={2.2} style={{ color: VERDE }} className="shrink-0" />
            <span className="flex-1 min-w-0 font-semibold truncate" style={{ color: "var(--text)", fontSize: 10.5 }}>{t}</span>
            <ChevronRight size={11} style={{ color: "var(--text-tertiary)" }} className="shrink-0" />
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between shrink-0" style={{ marginTop: 14, marginBottom: 7 }}>
        <span className="font-semibold" style={{ color: "var(--text-secondary)", fontSize: 10 }}>DAS</span>
        <span className="flex items-center gap-0.5" style={{ color: "var(--text-tertiary)", fontSize: 9.5 }}>
          Este ano <ChevronDown size={10} />
        </span>
      </div>
      <div className="grid grid-cols-4 flex-1 min-h-0" style={{ gap: 5, gridAutoRows: "1fr" }}>
        {MESES.map((m, i) => {
          const paga = i < pagos;
          return (
            <div
              key={m}
              className="rounded-lg flex flex-col items-center justify-center"
              style={{
                border: `1px solid ${paga ? "rgba(34,197,94,0.55)" : "var(--card-borda)"}`,
                backgroundColor: paga ? "rgba(34,197,94,0.12)" : "transparent",
                opacity: paga ? 1 : 0.45,
                gap: 2,
              }}
            >
              {paga && <Check size={11} strokeWidth={2.6} style={{ color: VERDE }} />}
              <span className="font-semibold" style={{ color: "var(--text)", fontSize: 9.5 }}>{m}</span>
            </div>
          );
        })}
      </div>
    </MiniTela>
  );
}

/* ---------------------------- 5. WHATSAPP ----------------------------
   v13 (05/10/2026): o WhatsApp do exemplo passou para o tema CLARO, o
   original do app (o escuro se misturava com o fundo preto das
   boas-vindas). Cores do WhatsApp claro: fundo bege, balao recebido
   branco, enviado verde-claro, sombra fina embaixo de cada balao. */
const WA = {
  fundo: "#efeae2", topo: "#f0f2f5", recebida: "#ffffff", enviada: "#d9fdd3",
  hora: "#667781", texto: "#111b21", acao: "#00a884", linha: "#e9edef",
  sombra: "0 1px 0.5px rgba(11,20,26,0.13)",
};

/* v5: `hora` — a conversa do exemplo e a pergunta das 21h */
function Balao({ enviada = false, hora = "21:00", children }) {
  return (
    <div className={`flex ${enviada ? "justify-end" : "justify-start"}`}>
      <div
        className="rounded-lg"
        style={{ maxWidth: "84%", backgroundColor: enviada ? WA.enviada : WA.recebida, color: WA.texto, fontSize: 10.5, lineHeight: 1.35, padding: "5px 7px 4px", boxShadow: WA.sombra }}
      >
        {children}
        <span className="flex items-center justify-end gap-0.5" style={{ color: WA.hora, fontSize: 7.5, marginTop: 1 }}>
          {hora} {enviada && <CheckCheck size={10} style={{ color: "#53bdeb" }} />}
        </span>
      </div>
    </div>
  );
}

function MiniWhatsApp() {
  return (
    <MiniTela padding="0" fundo={WA.fundo}>
      <div className="flex items-center gap-2 shrink-0" style={{ backgroundColor: WA.topo, padding: "12px 12px 9px", borderBottom: `1px solid ${WA.linha}` }}>
        <ArrowLeft size={14} style={{ color: WA.texto }} />
        <FotoFisco tamanho={28} borda={WA.topo} />
        <span className="flex flex-col">
          <span className="font-semibold" style={{ color: WA.texto, fontSize: 12 }}>Isa · TaCerto!</span>
          <span style={{ color: WA.hora, fontSize: 9 }}>assistente virtual</span>
        </span>
      </div>

      <div className="flex flex-col" style={{ gap: 8, padding: "12px 9px" }}>
        <Balao hora="09:00">Seu DAS vence em breve. Confira o vencimento no app.</Balao>
        <Balao hora="09:01">Seu boleto do DAS está aqui.<br />Boleto do DAS.pdf</Balao>
        <Balao hora="09:02">O check-up do seu CNPJ chegou. Veja os detalhes no app.</Balao>
      </div>
      <p style={{ color: WA.hora, fontSize: 10.5, padding: "12px", marginTop: "auto" }}>
        Dúvidas? Abra a aba Isa no app.
      </p>
    </MiniTela>
  );
}

/* Títulos CURTOS: cabem em uma linha no iPhone (ver cabeçalho, v3).
   v4 (piloto): `mostrar` esconde o slide quando a funcao dele esta
   desligada em src/config/piloto.js — banco (Open Finance) e
   historicos (saidas, DAS e notas). Nada foi apagado. */
/* v6 (piloto): 5 slides, so com o que o piloto entrega AGORA —
   limite / DAS (aviso e boleto no WhatsApp) / ajuda com a nota /
   gratis no piloto / Fisco no WhatsApp. NAO prometem: banco conectado
   (Open Finance), nota emitida sozinha, chat com IA dentro do app.
   Textos neutros (MEI e MEI Caminhoneiro), frases curtas. */
const SLIDES = [
  /* v12: titulos e frases com destaque em FACILIDADE e tempo ganho
     (pedido do Fernando). Titulos curtos: uma linha no iPhone. */
  { Mini: MiniInicio, titulo: "Limite sob controle 24h", subtitulo: "Veja na hora quanto já faturou e quanto ainda pode faturar no ano." },
  { Mini: MiniBanco, mostrar: MOSTRAR_OPEN_FINANCE, titulo: "Tudo chega sozinho", subtitulo: "Conecte o banco do seu MEI e as entradas e os gastos aparecem no app." },
  { Mini: MiniDas, mostrar: MOSTRAR_CARD_DAS, titulo: "DAS no automático", subtitulo: "Todo mês a Isa te lembra e manda o boleto do DAS no WhatsApp." },
  { Mini: MiniNota, foraDaEscala: true, mostrar: MOSTRAR_TUTORIAL_NOTA, titulo: "Nota fiscal do seu jeito", subtitulo: "Veja o passo a passo do gov.br ou tire suas dúvidas com a Isa aqui no app." },
  /* Conferencia "É faturamento?": fora dos slides do piloto (a
     "propaganda" foi reprovada em 04/10). Troque para true para voltar. */
  { Mini: MiniConferir, mostrar: false, titulo: "A Isa organiza pra você", subtitulo: "Você diz uma vez se é faturamento. Da próxima, ela já sabe." },
  {
    Mini: MiniHistoricos,
    mostrar: MOSTRAR_SAIDAS && MOSTRAR_HISTORICO_DAS && MOSTRAR_NOTAS_FISCAIS,
    titulo: "Tudo guardado",
    subtitulo: "Entradas, saídas, DAS e notas fiscais, organizados mês a mês.",
  },
  { Mini: MiniPiloto, titulo: "Tudo isso, grátis", subtitulo: "Menos burocracia e mais tempo para trabalhar, sem pagar nada." },
  { Mini: MiniWhatsApp, titulo: "A Isa te avisa", subtitulo: "As dúvidas você tira com a Isa aqui no app. No WhatsApp ela só te avisa do que importa." },
].filter((s) => s.mostrar !== false);

export default function Welcome() {
  useTemaEscuroForcado();
  const navigate = useNavigate();
  const scrollerRef = useRef(null);
  const [active, setActive] = useState(0);
  const telaRef = useRef(null);
  const logoRef = useRef(null);
  const rodapeRef = useRef(null);
  const [escalaMoldura, setEscalaMoldura] = useState(1);
  /* v6: uma escala so para todos os desenhos (ver useEscalaComum) */
  const molduraRef = useRef(null);
  const caixasRef = useRef([]);
  const ajuste = useEscalaComum(molduraRef, caixasRef, SLIDES.length);

  // Reduz a moldura inteira: a largura do desenho e suas quebras não mudam.
  // Logo, celular e card usam só a altura necessária; a sobra fica nas pontas.
  useLayoutEffect(() => {
    const tela = telaRef.current;
    const logo = logoRef.current;
    const rodape = rodapeRef.current;
    if (!tela || !logo || !rodape) return undefined;
    const medir = () => {
      const alturaLivre = Math.max(0, tela.clientHeight - logo.offsetHeight - rodape.offsetHeight - 8);
      const escala = Math.min(1, 260 / LARGURA_MOLDURA, tela.clientWidth * 0.7 / LARGURA_MOLDURA, alturaLivre / MOLDURA_MAX);
      setEscalaMoldura((atual) => Math.abs(atual - escala) < 0.001 ? atual : escala);
    };
    medir();
    const ro = new ResizeObserver(medir);
    [tela, logo, rodape].forEach((el) => ro.observe(el));
    document.fonts?.ready?.then(medir).catch(() => {});
    return () => ro.disconnect();
  }, []);

  /* v17: o app instalado na Tela de Inicio sempre abre em "/" (manifesto).
     Quem ja entrou nele vai direto para o Inicio, sem ver os slides de
     novo. No Safari normal fica como sempre foi. */
  useEffect(() => {
    if (!estaInstalado()) return undefined;
    let ativo = true;
    Promise.resolve()
      .then(() => supabase.auth.getSession())
      .then(({ data }) => { if (ativo && data?.session) navigate("/dashboard", { replace: true }); })
      .catch(() => { /* sem sessao: mostra os slides */ });
    return () => { ativo = false; };
  }, [navigate]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const onScroll = () => setActive(Math.round(el.scrollLeft / el.clientWidth));
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const goTo = (i) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };

  return (
    <div ref={telaRef} className="tela-fixa w-full flex flex-col justify-center" style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}>
      <div ref={logoRef} className="flex items-center justify-center gap-1.5 pt-1 pb-3 shrink-0">
        <Gauge size={22} strokeWidth={2.5} style={{ color: VERDE }} />
        <span className="text-xl font-bold" style={{ color: "var(--text)" }}>
          Ta<span style={{ color: VERDE }}>Certo!</span>
        </span>
      </div>

      {/* A escala externa afina o celular inteiro sem abrir espaço até o card. */}
      <div ref={scrollerRef} className="shrink-0 min-h-0 flex overflow-x-auto overflow-y-hidden snap-x snap-mandatory hide-scrollbar" style={{ touchAction: "pan-x", height: MOLDURA_MAX * escalaMoldura + 8 }}>
        {SLIDES.map(({ Mini, foraDaEscala }, i) => (
          <div key={i} className="min-w-full snap-center flex flex-col min-h-0">
            <div className="flex-1 min-h-0 flex justify-center px-6 pt-2">
              <div className="relative shrink-0" style={{ width: LARGURA_MOLDURA * escalaMoldura, height: MOLDURA_MAX * escalaMoldura }}>
                <div
                  ref={i === 0 ? molduraRef : undefined}
                  data-moldura-slide=""
                  className="absolute top-0 left-0 flex flex-col"
                  style={{
                    width: LARGURA_MOLDURA,
                    height: MOLDURA_MAX,
                    transform: `scale(${escalaMoldura})`,
                    transformOrigin: "top left",
                    borderTopLeftRadius: 34,
                    borderTopRightRadius: 34,
                    borderLeft: "1.5px solid rgba(34,197,94,0.55)",
                    borderRight: "1.5px solid rgba(34,197,94,0.55)",
                    borderTop: "1.5px solid rgba(34,197,94,0.55)",
                    borderBottom: "none",
                    background: "linear-gradient(180deg, #101014 0%, #0a0a0c 45%, #050506 100%)",
                    overflow: "hidden",
                  }}
                >
                  {/* v6: todos os desenhos com a MESMA escala */}
                  <MiniNaMoldura ajuste={ajuste} foraDaEscala={foraDaEscala} caixaRef={(el) => { caixasRef.current[i] = el; }}>
                    <Mini />
                  </MiniNaMoldura>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Card inferior único: preto translúcido, sem reflexo, com apenas
          uma linha verde discreta em volta. Contém o texto do slide
          ativo + dots + botões. */}
      <div ref={rodapeRef} className="shrink-0" style={{ padding: "0 10px", paddingBottom: "calc(10px + env(safe-area-inset-bottom))" }}>
        <div
          style={{
            background: "var(--vidro-bg)",
            backdropFilter: "blur(6px) saturate(160%)",
            WebkitBackdropFilter: "blur(6px) saturate(160%)",
            border: "1px solid rgba(34,197,94,0.35)",
            borderRadius: 26,
            padding: "16px 18px 18px",
          }}
        >
          {/* v6: TODOS os textos ficam empilhados no mesmo lugar (grade de
              uma celula) e so o do slide atual aparece. Assim a altura do
              bloco e sempre a do texto mais alto: nada cresce nem encolhe
              ao trocar de slide, e "Criar conta" nunca pula. */}
          <div className="grid text-center px-2" style={{ minHeight: 60 }}>
            {SLIDES.map((s, i) => (
              <div
                key={s.titulo}
                aria-hidden={i !== active}
                style={{ gridArea: "1 / 1", visibility: i === active ? "visible" : "hidden" }}
              >
                <h2 className="font-bold leading-tight" style={{ color: "var(--text)", fontSize: 19 }}>{s.titulo}</h2>
                <p className="leading-snug" style={{ color: "var(--text-secondary)", fontSize: 13.5, marginTop: 6 }}>{s.subtitulo}</p>
              </div>
            ))}
          </div>

          <div className="flex justify-center gap-2 py-3">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`Ir para slide ${i + 1}`}
                className="h-2 rounded-full transition-all"
                style={{ width: i === active ? 24 : 8, backgroundColor: i === active ? VERDE : "var(--border)" }}
              />
            ))}
          </div>

          <button onClick={() => navigate("/cadastro")} className="w-full py-2.5 rounded-xl font-semibold transition-opacity hover:opacity-90" style={{ backgroundColor: VERDE, color: "var(--primary-contrast)", fontSize: 13 }}>
            Criar conta
          </button>
          <p className="text-center text-sm mt-3.5" style={{ color: "var(--text-secondary)" }}>
            Já tem conta?{" "}
            <button onClick={() => navigate("/login")} className="font-semibold" style={{ color: VERDE }}>Entrar</button>
          </p>
        </div>
      </div>
    </div>
  );
}
