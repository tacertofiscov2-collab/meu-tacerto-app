/* WELCOME v5 — textos NEUTROS (MEI e MEI Caminhoneiro) + slide 2 "DAS e nota" + slide 3 enxuto + desenho sempre inteiro na moldura */
/* ===================================================================
   TELA DE BOAS-VINDAS (antes do login/cadastro)

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
  Gauge, ArrowLeft, ChevronRight, ChevronDown, Send, Mic, Plus, Smile,
  ArrowDownLeft, ArrowUpRight, CalendarCheck, FileText, Check, CheckCheck, ExternalLink,
} from "lucide-react";
import useTemaEscuroForcado from "@/hooks/useTemaEscuroForcado";
import SimboloPluggy from "@/components/SimboloPluggy";
import {
  MOSTRAR_OPEN_FINANCE, MOSTRAR_SAIDAS, MOSTRAR_HISTORICO_DAS, MOSTRAR_NOTAS_FISCAIS,
  MOSTRAR_CHAT_FISCO, MOSTRAR_CARD_DAS, MOSTRAR_TUTORIAL_NOTA,
} from "@/config/piloto";

const VERDE = "var(--primary)";

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
   ENCAIXE NA MOLDURA (v5)

   A moldura do celular tem 48dvh: no iPhone (com as barras do Safari)
   ela fica bem mais baixa que no PC. Se o desenho for mais alto que a
   moldura, ele ENCOLHE por igual (escala) ate caber inteiro — nada fica
   cortado atras do card de baixo. Se couber, nao muda nada.

   Como mede: solta a altura (height auto) para ler a altura natural do
   desenho, compara com a da moldura e escolhe a escala. Mede de novo
   quando a moldura muda de tamanho e quando as fontes terminam de
   carregar.
   =================================================================== */
function MiniEncaixada({ children }) {
  const caixaRef = useRef(null);
  const [ajuste, setAjuste] = useState({ escala: 1, altura: null });

  useLayoutEffect(() => {
    const caixa = caixaRef.current;
    const moldura = caixa?.parentElement;
    if (!caixa || !moldura) return undefined;

    const medir = () => {
      const disponivel = moldura.clientHeight;
      if (!disponivel) return;
      const alturaAntes = caixa.style.height;
      caixa.style.height = "auto";
      const natural = caixa.scrollHeight;
      caixa.style.height = alturaAntes;
      const escala = natural > disponivel ? disponivel / natural : 1;
      const altura = Math.max(disponivel, natural);
      setAjuste((a) =>
        a.altura === altura && Math.abs(a.escala - escala) < 0.002 ? a : { escala, altura },
      );
    };

    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(moldura);
    document.fonts?.ready?.then(medir).catch(() => {});
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={caixaRef}
      className="flex flex-col"
      style={{
        height: ajuste.altura ?? "100%",
        transform: ajuste.escala < 1 ? `scale(${ajuste.escala})` : undefined,
        transformOrigin: "top center",
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

/* Foto redonda do Fisco com a bolinha verde. */
function FotoFisco({ tamanho = 46, borda = "var(--bg)" }) {
  return (
    <span className="relative shrink-0" style={{ width: tamanho, height: tamanho }}>
      <span
        className="rounded-full overflow-hidden block"
        style={{ width: tamanho, height: tamanho, ...VIDRO, border: "1.5px solid rgba(34,197,94,0.45)" }}
      >
        <img src="/fisco-perfil.png" alt="" style={{ width: "108%", height: "108%", objectFit: "cover", objectPosition: "50% 18%" }} />
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

      {/* Fisco + barra do chat, no pé */}
      <div className="flex items-center gap-2 shrink-0" style={{ marginTop: "auto", paddingTop: 12 }}>
        <FotoFisco tamanho={44} />
        <span
          className="flex-1 min-w-0 rounded-full flex items-center gap-2"
          style={{ ...VIDRO, border: "1px solid rgba(34,197,94,0.35)", height: 30, padding: "0 10px" }}
        >
          <span
            className="flex-1 truncate"
            style={{ color: "var(--text-tertiary)", fontSize: 10.5, fontStyle: "italic", fontFamily: '"Comic Neue", "Chalkboard SE", "Comic Sans MS", cursive' }}
          >
            {/* Piloto: o Fisco atende pelo WhatsApp, nao no app */}
            {MOSTRAR_CHAT_FISCO ? "Pergunte ao Fisco..." : "Fisco no WhatsApp"}
          </span>
          <Send size={12} strokeWidth={2.2} style={{ color: VERDE }} className="shrink-0" />
        </span>
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

/* ------------------------ 2. DAS E NOTA (v5) ------------------------
   O que o piloto entrega de verdade: o card "Próximo DAS" do Início
   (com "Pagar no gov.br") e o passo a passo "Como emitir sua nota".
   Texto neutro: serve para MEI e MEI Caminhoneiro. */
function MiniDasNota() {
  const passos = ["Entre no Emissor Nacional", "Preencha o cliente e o valor", "Baixe o PDF da nota"];
  return (
    <MiniTela>
      <div className="flex items-center gap-1.5 shrink-0" style={{ marginBottom: 12 }}>
        <Gauge size={18} strokeWidth={2.3} style={{ color: VERDE }} />
        <span className="font-bold" style={{ color: "var(--text)", fontSize: 14 }}>
          Ta<span style={{ color: VERDE }}>Certo!</span>
        </span>
      </div>

      {/* card "Próximo DAS", igual ao do Início */}
      <div className="rounded-2xl flex items-center gap-2 shrink-0" style={{ ...CARD, padding: "10px 10px 10px 12px" }}>
        <span className="flex-1 min-w-0">
          <span className="block whitespace-nowrap" style={{ color: "var(--text-secondary)", fontSize: 10 }}>Próximo DAS · 20/••</span>
          <span className="block font-bold" style={{ color: "var(--text)", fontSize: 13, marginTop: 1 }}>R$ •••</span>
        </span>
        <span
          className="rounded-lg font-semibold flex items-center gap-1 shrink-0"
          style={{
            fontSize: 10,
            padding: "5px 7px",
            color: VERDE,
            backgroundColor: "rgba(34,197,94,0.16)",
            border: "1px solid rgba(34,197,94,0.45)",
          }}
        >
          Pagar no gov.br
          <ExternalLink size={10} strokeWidth={2.4} />
        </span>
      </div>

      {/* passo a passo da nota */}
      <p className="font-semibold shrink-0" style={{ color: "var(--text-secondary)", fontSize: 10.5, marginTop: 14, marginBottom: 7 }}>
        Como emitir sua nota
      </p>
      <div className="flex flex-col shrink-0" style={{ gap: 6 }}>
        {passos.map((p, i) => (
          <div key={p} className="rounded-xl flex items-center gap-2" style={{ ...CARD, padding: "7px 10px" }}>
            <span
              className="rounded-full flex items-center justify-center shrink-0 font-bold"
              style={{ width: 18, height: 18, fontSize: 9.5, color: VERDE, backgroundColor: "rgba(34,197,94,0.14)" }}
            >
              {i + 1}
            </span>
            <span className="font-semibold" style={{ color: "var(--text)", fontSize: 11 }}>{p}</span>
          </div>
        ))}
      </div>

      {/* no pe, como na tela do tutorial (sem espaco vazio na moldura) */}
      <div className="shrink-0" style={{ marginTop: "auto", paddingTop: 12 }}>
        <span
          className="rounded-xl font-semibold flex items-center justify-center gap-1.5"
          style={{ padding: "9px 0", fontSize: 11.5, backgroundColor: VERDE, color: "var(--primary-contrast)" }}
        >
          Abrir o Emissor Nacional
          <ExternalLink size={12} strokeWidth={2.4} />
        </span>
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

/* ---------------------------- 5. WHATSAPP ---------------------------- */
const WA = { fundo: "#0b141a", topo: "#202c33", recebida: "#202c33", enviada: "#005c4b", hora: "rgba(233,237,239,0.6)", texto: "#e9edef", acao: "#00a884" };

/* v5: `hora` — a conversa do exemplo e a pergunta das 21h */
function Balao({ enviada = false, hora = "21:00", children }) {
  return (
    <div className={`flex ${enviada ? "justify-end" : "justify-start"}`}>
      <div
        className="rounded-lg"
        style={{ maxWidth: "84%", backgroundColor: enviada ? WA.enviada : WA.recebida, color: WA.texto, fontSize: 10.5, lineHeight: 1.35, padding: "5px 7px 4px" }}
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
      <div className="flex items-center gap-2 shrink-0" style={{ backgroundColor: WA.topo, padding: "12px 12px 9px" }}>
        <ArrowLeft size={14} style={{ color: WA.texto }} />
        <FotoFisco tamanho={28} borda={WA.topo} />
        <span className="flex flex-col">
          <span className="font-semibold" style={{ color: WA.texto, fontSize: 12 }}>Fisco · TaCerto!</span>
          <span style={{ color: WA.hora, fontSize: 9 }}>online</span>
        </span>
      </div>

      {/* v5: so a pergunta das 21h, a resposta e a confirmacao — mais
          enxuto (cabe na moldura) e neutro (MEI e MEI Caminhoneiro) */}
      <div className="flex flex-col" style={{ gap: 6, padding: "10px 9px" }}>
        <Balao>Boa noite! Quanto você recebeu hoje?</Balao>
        <Balao enviada hora="21:02">Recebi R$ ••• de um cliente</Balao>
        <div className="flex flex-col" style={{ maxWidth: "84%", gap: 2 }}>
          <div className="rounded-lg" style={{ backgroundColor: WA.recebida, color: WA.texto, fontSize: 10.5, lineHeight: 1.35, padding: "5px 7px 4px" }}>
            Confere antes de eu anotar:
            <div style={{ marginTop: 4, paddingLeft: 6, borderLeft: `2px solid ${WA.acao}` }}>
              <div style={{ color: WA.hora, fontSize: 9 }}>Recebido hoje</div>
              <div className="font-semibold">Cliente · R$ •••</div>
            </div>
          </div>
          <div className="rounded-lg text-center font-semibold" style={{ backgroundColor: WA.recebida, color: WA.acao, fontSize: 10.5, padding: "6px 0" }}>Está certo</div>
          <div className="rounded-lg text-center font-semibold" style={{ backgroundColor: WA.recebida, color: WA.acao, fontSize: 10.5, padding: "6px 0" }}>Corrigir</div>
        </div>
      </div>

      {/* barra de digitar, no pé */}
      <div className="flex items-center gap-1.5 shrink-0" style={{ marginTop: "auto", padding: "6px 8px 10px" }}>
        <span className="flex-1 rounded-full flex items-center gap-2" style={{ backgroundColor: WA.topo, height: 30, padding: "0 10px" }}>
          <Smile size={14} style={{ color: WA.hora }} />
          <span className="flex-1" style={{ color: WA.hora, fontSize: 10.5 }}>Mensagem</span>
          <Plus size={14} style={{ color: WA.hora }} />
        </span>
        <span className="rounded-full flex items-center justify-center shrink-0" style={{ width: 30, height: 30, backgroundColor: WA.acao }}>
          <Mic size={14} style={{ color: WA.fundo }} />
        </span>
      </div>
    </MiniTela>
  );
}

/* Títulos CURTOS: cabem em uma linha no iPhone (ver cabeçalho, v3).
   v4 (piloto): `mostrar` esconde o slide quando a funcao dele esta
   desligada em src/config/piloto.js — banco (Open Finance) e
   historicos (saidas, DAS e notas). Nada foi apagado. */
const SLIDES = [
  { Mini: MiniInicio, titulo: "Seu limite em tempo real", subtitulo: "Veja na hora quanto do limite do seu MEI você já usou no ano." },
  { Mini: MiniBanco, mostrar: MOSTRAR_OPEN_FINANCE, titulo: "Tudo chega sozinho", subtitulo: "Conecte o banco do seu MEI e as entradas e os gastos aparecem no app." },
  /* v5: o slide 2 do piloto e o do DAS e da nota. O "O Fisco organiza"
     volta sozinho se o card do DAS ou o tutorial da nota forem
     desligados (src/config/piloto.js). */
  {
    Mini: MiniDasNota,
    mostrar: MOSTRAR_CARD_DAS && MOSTRAR_TUTORIAL_NOTA,
    titulo: "DAS e nota sem mistério",
    subtitulo: "Veja quando vence o DAS e aprenda a emitir sua nota, passo a passo.",
  },
  {
    Mini: MiniConferir,
    mostrar: !(MOSTRAR_CARD_DAS && MOSTRAR_TUTORIAL_NOTA),
    titulo: "O Fisco organiza pra você",
    subtitulo: "Você diz uma vez se é faturamento. Da próxima, ele já sabe.",
  },
  {
    Mini: MiniHistoricos,
    mostrar: MOSTRAR_SAIDAS && MOSTRAR_HISTORICO_DAS && MOSTRAR_NOTAS_FISCAIS,
    titulo: "Tudo guardado",
    subtitulo: "Entradas, saídas, DAS e notas fiscais, organizados mês a mês.",
  },
  { Mini: MiniWhatsApp, titulo: "O Fisco no WhatsApp", subtitulo: "Todo dia, às 21h, ele pergunta quanto você recebeu. E tira suas dúvidas." },
].filter((s) => s.mostrar !== false);

export default function Welcome() {
  useTemaEscuroForcado();
  const navigate = useNavigate();
  const scrollerRef = useRef(null);
  const [active, setActive] = useState(0);

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
    <div className="tela-fixa w-full flex flex-col" style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}>
      <div className="flex items-center justify-center gap-1.5 pt-6 pb-3 shrink-0">
        <Gauge size={22} strokeWidth={2.5} style={{ color: VERDE }} />
        <span className="text-xl font-bold" style={{ color: "var(--text)" }}>
          Ta<span style={{ color: VERDE }}>Certo!</span>
        </span>
      </div>

      <div ref={scrollerRef} className="min-h-0 flex overflow-x-auto overflow-y-hidden snap-x snap-mandatory hide-scrollbar" style={{ touchAction: "pan-x" }}>
        {SLIDES.map(({ Mini }, i) => (
          <div key={i} className="min-w-full snap-center flex flex-col min-h-0">
            <div className="flex justify-center px-6 pt-2">
              <div className="w-full flex flex-col min-h-0" style={{ maxWidth: 250 }}>
                <div
                  className="relative w-full flex flex-col"
                  style={{
                    height: "48dvh",
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
                  {/* v5: o desenho encolhe se nao couber na moldura */}
                  <MiniEncaixada>
                    <Mini />
                  </MiniEncaixada>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Card inferior único: preto translúcido, sem reflexo, com apenas
          uma linha verde discreta em volta. Contém o texto do slide
          ativo + dots + botões. */}
      <div className="shrink-0" style={{ padding: "0 10px", paddingBottom: "calc(10px + env(safe-area-inset-bottom))" }}>
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
          <div className="text-center px-2" style={{ minHeight: 60 }}>
            <h2 className="font-bold leading-tight" style={{ color: "var(--text)", fontSize: 18 }}>{SLIDES[active].titulo}</h2>
            <p className="leading-snug" style={{ color: "var(--text-secondary)", fontSize: 12.5, marginTop: 6 }}>{SLIDES[active].subtitulo}</p>
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
