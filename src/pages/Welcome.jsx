/* WELCOME v2 — slides novos (gestao do MEI: entradas e gastos) com telas iguais as do app */
/* ===================================================================
   TELA DE BOAS-VINDAS (antes do login/cadastro)

   v2 (03/10/2026): slides refeitos para o posicionamento novo — app
   de GESTAO do MEI, entradas e gastos, sem complexidade (antes era
   "educacao fiscal"). Texto vale igual para MEI e MEI Caminhoneiro.
   5 slides:
     1 Seu limite, sempre à vista      -> Início (velocímetro "MEI · anual")
     2 Entradas e gastos chegam sozinhos -> Histórico de entradas
     3 O Fisco organiza e aprende      -> Novas entradas ("É faturamento?")
     4 Tudo guardado num lugar só      -> Perfil → Meu MEI (os históricos)
     5 O Fisco no seu WhatsApp         -> conversa no WhatsApp (dúvida + nota)
   Pedido do Fernando: tudo aparece como pronto, inclusive o que ainda
   vai entrar (WhatsApp, emissão de nota).

   COMO AS "TELAS" DENTRO DO CELULAR SAO FEITAS: cada uma e desenhada
   no tamanho REAL do app (390 px de largura, mesmas fontes, cards e
   cores) e o <TelaReal> encolhe tudo junto para caber no celular de
   exemplo. Assim fica igual ao app de verdade, e da para usar os
   componentes reais (VelocimetroAnimado, Valor, SimboloPluggy).

   NAO MUDOU: tamanho do celular de exemplo (250 px x 48dvh), a linha
   verde em volta, e o card de baixo (texto, bolinhas, "Criar conta",
   "Já tem conta? Entrar").
   =================================================================== */
import { useNavigate } from "react-router-dom";
import { useState, useRef, useEffect, useLayoutEffect } from "react";
import {
  Gauge, TrendingUp, ArrowLeft, Search, Calendar, ChevronDown, ChevronRight,
  ArrowDownLeft, ArrowUpRight, CalendarCheck, FileText, BarChart3, Send,
  CheckCheck, User, Settings, Plus, Mic, Smile,
} from "lucide-react";
import useTemaEscuroForcado from "@/hooks/useTemaEscuroForcado";
import VelocimetroAnimado from "@/components/VelocimetroAnimado";
import Valor from "@/components/Valor";
import SimboloPluggy from "@/components/SimboloPluggy";

const VERDE = "var(--primary)";

/* Largura de um iPhone: as telas sao desenhadas nesse tamanho e encolhidas. */
const LARGURA_TELA = 390;

/* Vidro dos cards do Início (igual ao Dashboard). */
const VIDRO = {
  background:
    "linear-gradient(160deg, var(--vidro-brilho-1) 0%, var(--vidro-brilho-2) 24%, transparent 58%), var(--vidro-bg)",
  border: "1px solid var(--vidro-borda)",
  boxShadow:
    "inset 0 1px 0 0 var(--vidro-topo-medio), inset 0 6px 14px -8px var(--vidro-topo-fraco), inset 0 -1.5px 0 0 var(--vidro-base), 0 8px 24px var(--vidro-sombra)",
};

/* Encolhe uma tela de 390 px para o tamanho do celular de exemplo.
   A altura acompanha: a tela real "tem" a altura do celular / escala. */
function TelaReal({ children, fundo = "var(--bg)" }) {
  const ref = useRef(null);
  const [caixa, setCaixa] = useState({ escala: 0.63, altura: 640 });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const medir = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (!w || !h) return;
      const escala = w / LARGURA_TELA;
      setCaixa({ escala, altura: h / escala });
    };
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={ref} aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none" style={{ backgroundColor: fundo }}>
      <div
        className="flex flex-col"
        style={{
          width: LARGURA_TELA,
          height: caixa.altura,
          transform: `scale(${caixa.escala})`,
          transformOrigin: "0 0",
          color: "var(--text)",
        }}
      >
        {children}
      </div>
    </div>
  );
}

/* Topo das telas com rolagem (igual ao TopoRolavel): setinha redonda + título. */
function Topo({ titulo }) {
  return (
    <header className="flex items-center shrink-0" style={{ gap: 12, padding: "20px 20px 8px" }}>
      <span
        className="rounded-full flex items-center justify-center shrink-0"
        style={{ width: 40, height: 40, border: "1px solid var(--border)" }}
      >
        <ArrowLeft size={20} strokeWidth={2} style={{ color: "var(--text)" }} />
      </span>
      <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>{titulo}</h1>
    </header>
  );
}

/* ---------------------------- 1. INÍCIO ---------------------------- */
function TelaInicio() {
  return (
    <>
      <header className="px-5 pt-4 pb-1 flex items-start justify-between shrink-0">
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2.5">
            <Gauge size={34} style={{ color: VERDE }} strokeWidth={2.2} className="shrink-0" />
            <span className="font-bold text-2xl leading-none" style={{ color: "var(--text)" }}>
              Ta<span style={{ color: VERDE }}>Certo!</span>
            </span>
          </div>
          <div className="flex items-baseline gap-1.5" style={{ marginTop: 6 }}>
            <span className="font-semibold" style={{ color: "var(--text-secondary)", fontSize: 14 }}>Bom dia</span>
            <span className="font-extrabold leading-none" style={{ color: "var(--text)", fontSize: 19 }}>Alex</span>
          </div>
        </div>
        <span className="flex items-center justify-center shrink-0" style={{ width: 44, height: 34 }}>
          <SimboloPluggy altura={26} />
        </span>
      </header>

      <div className="px-5 pt-2 flex-1 flex flex-col min-h-0">
        <div className="relative w-full flex-1 min-h-0 rounded-3xl overflow-hidden flex flex-col px-5 pb-4" style={VIDRO}>
          <div className="flex-1 min-h-0 flex items-center justify-center">
            <VelocimetroAnimado
              percentual={45}
              maxWidth={190}
              numeroClasse="text-4xl font-bold"
              sempreMostrarBalao
              semAnimacao
            />
          </div>
          <p className="text-center shrink-0" style={{ color: "var(--text-tertiary)", fontSize: 14, marginBottom: 2 }}>
            MEI · anual
          </p>
          <div className="flex items-stretch pt-3 shrink-0" style={{ borderTop: "1px solid var(--border)", marginTop: 2 }}>
            <div className="flex-1 flex flex-col items-center">
              <Valor tamanho="md">{36450}</Valor>
              <span className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>Faturado</span>
            </div>
            <div className="shrink-0" style={{ width: 1, backgroundColor: "var(--border)" }} />
            <div className="flex-1 flex flex-col items-center">
              <Valor tamanho="md">{81000}</Valor>
              <span className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>Limite</span>
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-1.5 shrink-0" style={{ paddingTop: 10, paddingBottom: 4 }}>
          <span className="rounded-full" style={{ width: 7, height: 7, backgroundColor: VERDE }} />
          <span className="rounded-full" style={{ width: 7, height: 7, backgroundColor: "var(--border)" }} />
        </div>

        {/* Fisco + "Pergunte ao Fisco..." */}
        <div className="shrink-0 flex items-start gap-2" style={{ marginTop: 4, marginBottom: 12 }}>
          <span
            className="relative shrink-0 rounded-full flex items-center justify-center"
            style={{ width: 96, height: 96, ...VIDRO, border: "1.5px solid rgba(34,197,94,0.45)" }}
          >
            <span className="rounded-full overflow-hidden flex items-center justify-center" style={{ width: "100%", height: "100%" }}>
              <img src="/fisco-perfil.png" alt="" style={{ width: "108%", height: "108%", objectFit: "cover", objectPosition: "50% 18%" }} />
            </span>
            <span
              className="absolute rounded-full"
              style={{ width: 26, height: 26, backgroundColor: VERDE, border: "4px solid var(--bg)", bottom: 2, right: 2 }}
            />
          </span>
          <span
            className="flex-1 flex items-center gap-2 min-w-0 rounded-full"
            style={{ ...VIDRO, height: 48, paddingLeft: 18, paddingRight: 12, marginTop: 24, border: "1px solid rgba(34,197,94,0.35)" }}
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
            <Send size={20} strokeWidth={2} style={{ color: VERDE }} className="shrink-0" />
          </span>
        </div>
      </div>
    </>
  );
}

/* ---------------------- 2. HISTÓRICO DE ENTRADAS ---------------------- */
function TelaEntradas() {
  const entradas = [
    { nome: "Rota Sul Transportes", detalhe: "02 de Outubro · Pix", valor: 2400 },
    { nome: "Mariana Costa", detalhe: "01 de Outubro · Pix", valor: 350 },
    { nome: "Horizonte Comércio Ltda", detalhe: "01 de Outubro · TED", valor: 1180 },
    { nome: "Pedro Almeida", detalhe: "30 de Setembro · Pix", valor: 600 },
  ];
  return (
    <>
      <Topo titulo="Histórico de entradas" />
      <div className="px-5 flex flex-col" style={{ paddingTop: 8 }}>
        <div className="card-tacerto rounded-2xl px-4 flex items-center gap-3" style={{ height: 50 }}>
          <Search size={18} style={{ color: "var(--text-tertiary)" }} />
          <span className="text-[15px]" style={{ color: "var(--text-tertiary)" }}>Buscar entrada</span>
        </div>
        <div className="card-tacerto rounded-2xl px-4 flex items-center gap-3 mt-2.5" style={{ minHeight: 58 }}>
          <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "var(--surface)" }}>
            <Calendar size={18} style={{ color: VERDE }} />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-[15px] font-semibold" style={{ color: "var(--text)" }}>Outubro de 2026</span>
            <span className="block text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>Ir para o mês</span>
          </span>
          <ChevronDown size={18} style={{ color: "var(--text-tertiary)" }} className="shrink-0" />
        </div>
        <div className="card-tacerto rounded-2xl px-4 py-3.5 mt-2.5">
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>Total de Outubro</p>
          <div className="mt-1"><Valor tamanho="xl">{3930}</Valor></div>
          <div className="flex items-center gap-1.5 mt-1.5" style={{ color: "var(--text-tertiary)" }}>
            <span className="text-xs">No ano de 2026:</span>
            <Valor tamanho="sm">{36450}</Valor>
          </div>
        </div>
        <p className="text-[13px] font-semibold mt-4 mb-2" style={{ color: "var(--text-secondary)" }}>Outubro</p>
        <div className="space-y-2">
          {entradas.map((e) => (
            <div key={e.nome} className="card-tacerto rounded-2xl px-4 py-3 flex items-center gap-3">
              <TrendingUp size={19} strokeWidth={2} style={{ color: VERDE }} className="shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-semibold leading-tight truncate" style={{ color: "var(--text)" }}>{e.nome}</p>
                <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-secondary)" }}>{e.detalhe}</p>
              </div>
              <span className="shrink-0"><Valor tamanho="md" sinal="+">{e.valor}</Valor></span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

/* ------------------------- 3. NOVAS ENTRADAS ------------------------- */
function Picote() {
  const recorte = {
    position: "absolute", top: 0, width: 18, height: 18, borderRadius: "50%",
    backgroundColor: "var(--bg)", border: "1px solid var(--card-borda)",
  };
  return (
    <div className="relative" style={{ height: 18 }}>
      <span style={{ ...recorte, left: -10 }} />
      <div style={{ position: "absolute", left: 16, right: 16, top: 8, borderTop: "1.5px dashed var(--border)" }} />
      <span style={{ ...recorte, right: -10 }} />
    </div>
  );
}

function LinhaDetalhe({ rotulo, valor }) {
  return (
    <div className="flex items-baseline justify-between" style={{ gap: 12, paddingTop: 4, paddingBottom: 4 }}>
      <span className="text-[13px]" style={{ color: "var(--text-tertiary)" }}>{rotulo}</span>
      <span className="text-[13.5px] font-semibold" style={{ color: "var(--text)" }}>{valor}</span>
    </div>
  );
}

function TelaConferir() {
  return (
    <>
      <header className="px-5 pt-7 pb-3 shrink-0">
        <h1 className="font-bold text-center" style={{ color: "var(--text)", fontSize: 27 }}>Novas entradas</h1>
      </header>
      <div className="px-5">
        <p className="text-[13px] font-semibold text-center" style={{ color: "var(--text-secondary)", marginBottom: 8 }}>1 de 3</p>
        <div className="rounded-full overflow-hidden" style={{ height: 5, backgroundColor: "var(--border)" }}>
          <div style={{ height: "100%", width: "33%", backgroundColor: VERDE }} />
        </div>

        <div className="card-tacerto rounded-2xl overflow-hidden" style={{ marginTop: 16 }}>
          <div style={{ padding: "14px 16px 12px" }}>
            <p className="font-semibold uppercase" style={{ color: "var(--text-tertiary)", fontSize: 11, letterSpacing: "0.08em" }}>Pagador</p>
            <div className="flex items-center" style={{ gap: 12, marginTop: 8 }}>
              <span
                className="rounded-full flex items-center justify-center shrink-0 font-bold"
                style={{ width: 42, height: 42, fontSize: 17, backgroundColor: "rgba(34,197,94,0.14)", color: VERDE }}
              >
                H
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-bold truncate" style={{ fontSize: 16.5, color: "var(--text)" }}>Horizonte Comércio Ltda</p>
                <p className="text-[12.5px]" style={{ color: "var(--text-tertiary)", marginTop: 1, letterSpacing: "0.02em" }}>12.345.•••/••01-90</p>
              </div>
            </div>
          </div>
          <Picote />
          <div style={{ padding: "10px 16px 14px" }}>
            <LinhaDetalhe rotulo="Entradas" valor="3" />
            <LinhaDetalhe rotulo="Período" valor="02 a 28 de set." />
            <LinhaDetalhe rotulo="Meio" valor="Pix" />
            <div className="flex items-baseline justify-between" style={{ marginTop: 10, paddingTop: 10, borderTop: "1px dashed var(--border)", gap: 10 }}>
              <span className="text-[13px]" style={{ color: "var(--text-secondary)" }}>Total recebido</span>
              <span className="font-bold" style={{ fontSize: 22, color: VERDE }}>R$ 4.200,00</span>
            </div>
            <span className="flex items-center gap-1" style={{ marginTop: 10, color: "var(--text-secondary)", fontSize: 13 }}>
              <ChevronDown size={15} />
              Ver as entradas
            </span>
          </div>
        </div>

        <p className="font-bold text-center" style={{ fontSize: 20, marginTop: 26 }}>É faturamento?</p>
        <div className="flex" style={{ gap: 10, marginTop: 14 }}>
          <span
            className="flex-1 rounded-2xl font-bold text-center"
            style={{ paddingTop: 15, paddingBottom: 15, fontSize: 17, backgroundColor: VERDE, border: `1.5px solid ${VERDE}`, color: "var(--primary-contrast)" }}
          >
            Sim
          </span>
          <span
            className="flex-1 rounded-2xl font-bold text-center"
            style={{ paddingTop: 15, paddingBottom: 15, fontSize: 17, border: "1.5px solid var(--border)", color: "var(--text)" }}
          >
            Não
          </span>
        </div>
      </div>
    </>
  );
}

/* --------------------------- 4. MEU MEI --------------------------- */
function SecaoPerfil({ titulo, itens }) {
  return (
    <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16, paddingBottom: 8 }}>
      <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--text-tertiary)" }}>{titulo}</p>
      {itens.map(({ Icon, label }) => (
        <div key={label} className="w-full flex items-center gap-3 py-3">
          <Icon size={21} strokeWidth={2} style={{ color: VERDE }} className="shrink-0" />
          <span className="flex-1 text-[15px] font-semibold" style={{ color: "var(--text)" }}>{label}</span>
          <ChevronRight size={17} style={{ color: "var(--text-tertiary)" }} className="shrink-0" />
        </div>
      ))}
    </div>
  );
}

function TelaMeuMei() {
  const itens = [
    { Icon: ArrowDownLeft, label: "Histórico de entradas" },
    { Icon: ArrowUpRight, label: "Histórico de saídas" },
    { Icon: CalendarCheck, label: "Histórico de DAS" },
    { Icon: FileText, label: "Histórico de notas fiscais" },
    { Icon: TrendingUp, label: "Adicionar movimentações" },
    { Icon: BarChart3, label: "Resumo de 2026" },
  ];
  const geral = [
    { Icon: User, label: "Editar perfil" },
    { Icon: Settings, label: "Preferências" },
  ];
  return (
    <>
      <Topo titulo="Perfil" />
      <div className="px-5">
        <div className="flex flex-col items-center" style={{ paddingTop: 10, paddingBottom: 20 }}>
          <span
            className="rounded-full flex items-center justify-center font-bold"
            style={{ width: 80, height: 80, fontSize: 32, color: VERDE, ...VIDRO }}
          >
            A
          </span>
          <span className="font-bold" style={{ fontSize: 20, marginTop: 12 }}>Alex</span>
        </div>
        {/* "Meu MEI" vem primeiro aqui (no app vem depois do "Geral"):
            sao os historicos que o slide quer mostrar. */}
        <SecaoPerfil titulo="Meu MEI" itens={itens} />
        <SecaoPerfil titulo="Geral" itens={geral} />
      </div>
    </>
  );
}

/* --------------------------- 5. WHATSAPP --------------------------- */
const WA = { fundo: "#0b141a", topo: "#202c33", recebida: "#202c33", enviada: "#005c4b", hora: "rgba(233,237,239,0.6)", texto: "#e9edef", acao: "#00a884" };

function Balao({ enviada = false, hora, children }) {
  return (
    <div className={`flex ${enviada ? "justify-end" : "justify-start"}`}>
      <div
        className="rounded-xl"
        style={{
          maxWidth: "82%",
          backgroundColor: enviada ? WA.enviada : WA.recebida,
          color: WA.texto,
          fontSize: 15.5,
          lineHeight: 1.35,
          padding: "7px 10px 6px",
        }}
      >
        {children}
        <span className="flex items-center justify-end gap-1" style={{ color: WA.hora, fontSize: 11, marginTop: 2 }}>
          {hora}
          {enviada && <CheckCheck size={15} style={{ color: "#53bdeb" }} />}
        </span>
      </div>
    </div>
  );
}

function TelaWhatsApp() {
  return (
    <>
      <header className="flex items-center gap-3 shrink-0" style={{ backgroundColor: WA.topo, padding: "16px 16px 12px" }}>
        <ArrowLeft size={22} style={{ color: WA.texto }} />
        <span className="rounded-full overflow-hidden shrink-0" style={{ width: 42, height: 42, backgroundColor: "#111" }}>
          <img src="/fisco-perfil.png" alt="" style={{ width: "108%", height: "108%", objectFit: "cover", objectPosition: "50% 18%" }} />
        </span>
        <span className="flex flex-col">
          <span className="font-semibold" style={{ color: WA.texto, fontSize: 17 }}>Fisco · TaCerto!</span>
          <span style={{ color: WA.hora, fontSize: 13 }}>online</span>
        </span>
      </header>
      <div className="flex flex-col" style={{ gap: 8, padding: "16px 14px" }}>
        <Balao enviada hora="09:12">Quanto já usei do meu limite?</Balao>
        <Balao hora="09:12">Você já usou <b>45%</b> do limite do ano. Tá tranquilo 👍</Balao>
        <Balao enviada hora="09:14">Emite uma nota de R$ 1.200 para a Horizonte Comércio</Balao>
        <div className="flex flex-col" style={{ maxWidth: "82%", gap: 2 }}>
          <div className="rounded-xl" style={{ backgroundColor: WA.recebida, color: WA.texto, fontSize: 15.5, lineHeight: 1.35, padding: "8px 10px 6px" }}>
            Confere antes de eu emitir:
            <div style={{ marginTop: 6, paddingLeft: 9, borderLeft: `3px solid ${WA.acao}` }}>
              <div style={{ color: WA.hora, fontSize: 13 }}>Nota fiscal de serviço</div>
              <div className="font-semibold">Horizonte Comércio Ltda</div>
              <div className="font-semibold">R$ 1.200,00</div>
            </div>
            <span className="flex justify-end" style={{ color: WA.hora, fontSize: 11, marginTop: 2 }}>09:14</span>
          </div>
          <div className="rounded-xl text-center font-semibold" style={{ backgroundColor: WA.recebida, color: WA.acao, fontSize: 15, padding: "9px 0" }}>Emitir nota</div>
          <div className="rounded-xl text-center font-semibold" style={{ backgroundColor: WA.recebida, color: WA.acao, fontSize: 15, padding: "9px 0" }}>Corrigir</div>
        </div>
      </div>

      {/* barra de digitar, presa no pe da tela (nada de espaco vazio) */}
      <div className="mt-auto shrink-0 flex items-center gap-2" style={{ padding: "8px 10px 14px" }}>
        <span className="flex-1 rounded-full flex items-center gap-3" style={{ backgroundColor: WA.topo, height: 48, padding: "0 14px" }}>
          <Smile size={22} style={{ color: WA.hora }} />
          <span className="flex-1" style={{ color: WA.hora, fontSize: 16 }}>Mensagem</span>
          <Plus size={22} style={{ color: WA.hora }} />
        </span>
        <span className="rounded-full flex items-center justify-center shrink-0" style={{ width: 48, height: 48, backgroundColor: WA.acao }}>
          <Mic size={22} style={{ color: "#0b141a" }} />
        </span>
      </div>
    </>
  );
}

const SLIDES = [
  { Tela: TelaInicio, titulo: "Seu limite, sempre à vista", subtitulo: "Veja na hora quanto do limite do seu MEI você já usou no ano." },
  { Tela: TelaEntradas, titulo: "Entradas e gastos chegam sozinhos", subtitulo: "Conecte o banco do seu MEI e tudo o que entra e sai aparece no app." },
  { Tela: TelaConferir, titulo: "O Fisco organiza e aprende", subtitulo: "Você diz uma vez se é faturamento. Da próxima, ele já sabe." },
  { Tela: TelaMeuMei, titulo: "Tudo guardado num lugar só", subtitulo: "Entradas, saídas, DAS e notas fiscais, mês a mês." },
  { Tela: TelaWhatsApp, titulo: "O Fisco no seu WhatsApp", subtitulo: "Tire dúvidas e emita nota fiscal numa conversa.", fundo: WA.fundo },
];

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
        {SLIDES.map(({ Tela, fundo }, i) => (
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
                  <TelaReal fundo={fundo}>
                    <Tela />
                  </TelaReal>
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
