import { useRef, useState, useEffect } from "react";
import {
  Send, X, Mic, Image as ImageIcon, Plus, Camera, FileText, ClipboardList,
  Copy, CornerUpLeft, Pencil, History, MessageSquarePlus, Trash2,
} from "lucide-react";
import { rotuloData } from "@/lib/chatHistorico";

/* ===================================================================
   CHAT DO FISCO — componentes compartilhados

   Estes componentes eram parte do Dashboard.jsx (na janela flutuante).
   Foram movidos pra ca para que a PAGINA /fisco e (no futuro) qualquer
   outra tela usem exatamente o mesmo chat, sem duplicar codigo.

   Diferenca principal em relacao a antiga janela: aqui o chat e o
   CONTEUDO de uma pagina cheia (ChatFiscoPagina), nao um overlay
   flutuante. Por isso o teclado se comporta de forma nativa e nao
   precisamos mais levantar a barra na mao com visualViewport.
   =================================================================== */

/* Vidro translucido usado nos menus e barras do chat. */
/* Altura maxima do campo de digitar (em px). Ele cresce conforme o texto
   ate esse limite - igual WhatsApp - e depois passa a rolar por dentro.
   ~120px da aproximadamente 5 linhas. Aumente/diminua a gosto. */
const MAX_ALTURA_CAMPO = 150;

const VIDRO_SUAVE = {
  background:
    "linear-gradient(160deg, var(--vidro-brilho-1) 0%, var(--vidro-brilho-2) 24%, transparent 58%), var(--vidro-bg)",
  backdropFilter: "blur(12px) saturate(140%)",
  WebkitBackdropFilter: "blur(12px) saturate(140%)",
  border: "1px solid var(--vidro-borda)",
  boxShadow:
    "inset 0 1px 0 0 var(--vidro-topo-medio), inset 0 7px 16px -8px var(--vidro-topo-fraco), inset 0 -1.5px 0 0 var(--vidro-base), 0 8px 24px var(--vidro-sombra)",
};

const VIDRO_CHAT = {
  background:
    "linear-gradient(160deg, var(--vidro-brilho-2) 0%, var(--vidro-brilho-3) 24%, transparent 58%), var(--vidro-bg-leve)",
  backdropFilter: "blur(14px) saturate(140%)",
  WebkitBackdropFilter: "blur(14px) saturate(140%)",
  border: "1px solid var(--vidro-borda)",
  boxShadow:
    "inset 0 1px 0 0 var(--vidro-topo-medio), inset 0 7px 16px -8px var(--vidro-topo-fraco), 0 12px 36px var(--vidro-sombra-forte)",
};

/** Borda pulsando - acende e apaga suavemente, com halo em volta.
    O verde pulsante caracteristico do chat do Fisco.
    Funciona em qualquer navegador (nao depende de @property). */
export function BordaLuminosa({ raio = 28, cor = "34,197,94", corClara = "74,222,128" }) {
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

function BolhaMensagem({ autor, texto, citando, onSegurar }) {
  const doUsuario = autor === "user";
  const timerRef = useRef(null);
  const [pressionada, setPressionada] = useState(false);

  function iniciarPressao() {
    setPressionada(true);
    timerRef.current = setTimeout(() => {
      setPressionada(false);
      onSegurar?.();
    }, 450);
  }
  function cancelarPressao() {
    setPressionada(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  }

  return (
    <div
      className="flex w-full bolha-entra"
      style={{ justifyContent: doUsuario ? "flex-end" : "flex-start" }}
    >
      <style>{`
        @keyframes bolhaEntra {
          from { opacity: 0; transform: translateY(10px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .bolha-entra { animation: bolhaEntra 320ms cubic-bezier(0.22,0.61,0.36,1); }
        @media (prefers-reduced-motion: reduce) {
          .bolha-entra { animation: none; }
        }
      `}</style>
      <div
        className="relative"
        onTouchStart={iniciarPressao}
        onTouchEnd={cancelarPressao}
        onTouchMove={cancelarPressao}
        onTouchCancel={cancelarPressao}
        onMouseDown={iniciarPressao}
        onMouseUp={cancelarPressao}
        onMouseLeave={cancelarPressao}
        onContextMenu={(e) => { e.preventDefault(); onSegurar?.(); }}
        style={{
          maxWidth: "80%",
          padding: "10px 14px",
          borderRadius: doUsuario ? "18px 18px 5px 18px" : "18px 18px 18px 5px",
          background: doUsuario
            ? "linear-gradient(160deg, rgba(74,222,128,0.30) 0%, rgba(34,197,94,0.22) 55%, rgba(21,128,61,0.18) 100%)"
            : "linear-gradient(160deg, var(--vidro-brilho-2) 0%, var(--vidro-brilho-3) 45%, transparent 100%), var(--vidro-superficie)",
          backdropFilter: "blur(10px) saturate(140%)",
          WebkitBackdropFilter: "blur(10px) saturate(140%)",
          border: doUsuario
            ? "1px solid rgba(74,222,128,0.35)"
            : "1px solid var(--vidro-borda)",
          boxShadow: doUsuario
            ? "inset 0 1px 0 0 var(--vidro-topo-medio), 0 4px 14px var(--vidro-sombra)"
            : "inset 0 1px 0 0 var(--vidro-topo-fraco), 0 4px 14px var(--vidro-sombra)",
          color: "var(--text)",
          fontSize: 14.5,
          lineHeight: 1.4,
          whiteSpace: "pre-wrap",
          overflowWrap: "anywhere",
          wordBreak: "break-word",
          WebkitTouchCallout: "none",
          WebkitUserSelect: "none",
          MozUserSelect: "none",
          msUserSelect: "none",
          userSelect: "none",
          WebkitTapHighlightColor: "transparent",
          cursor: "pointer",
          transform: pressionada ? "scale(0.975)" : "scale(1)",
          filter: pressionada ? "brightness(1.18)" : "none",
          transition: "transform 420ms cubic-bezier(0.25,0.9,0.3,1), filter 420ms ease",
        }}
      >
        {citando && (
          <div
            className="rounded-lg"
            style={{
              padding: "6px 9px",
              marginBottom: 7,
              backgroundColor: "var(--vidro-base)",
              borderLeft: "2.5px solid var(--primary)",
              color: "var(--text)",
              fontSize: 12.5,
              lineHeight: 1.35,
              opacity: 0.9,
              whiteSpace: "pre-wrap",
              overflowWrap: "anywhere",
              wordBreak: "break-word",
            }}
          >
            {citando}
          </div>
        )}
        {texto}
      </div>
    </div>
  );
}

/** Menu que abre ao segurar uma mensagem */
function MenuMensagem({ msg, onFechar, onCopiar, onEditar, onResponder }) {
  if (!msg) return null;
  const doUsuario = msg.autor === "user";

  const itens = [
    { Icon: Copy, label: "Copiar", acao: onCopiar },
    { Icon: CornerUpLeft, label: "Responder", acao: onResponder },
    ...(doUsuario ? [{ Icon: Pencil, label: "Editar", acao: onEditar }] : []),
  ];

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.45)", animation: "menuMsgFade 320ms ease-out" }}
      onClick={onFechar}
    >
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
      <div
        onClick={(e) => e.stopPropagation()}
        className="rounded-2xl overflow-hidden"
        style={{
          ...VIDRO_SUAVE,
          minWidth: 190,
          padding: 6,
          animation: "menuMsgPop 380ms cubic-bezier(0.25,0.9,0.3,1)",
        }}
      >
        {itens.map(({ Icon, label, acao }) => (
          <button
            key={label}
            type="button"
            onClick={() => { acao?.(); onFechar(); }}
            className="toque w-full flex items-center rounded-xl"
            style={{ gap: 11, padding: "11px 13px" }}
          >
            <Icon size={17} style={{ color: "var(--primary)" }} />
            <span style={{ color: "var(--text)", fontSize: 14.5 }}>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function FiscoDigitando() {
  return (
    <div className="flex w-full" style={{ justifyContent: "flex-start" }}>
      <div
        className="rounded-2xl flex items-center"
        style={{
          padding: "10px 14px",
          backgroundColor: "var(--vidro-superficie)",
          gap: 4,
        }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="rounded-full"
            style={{
              width: 6,
              height: 6,
              backgroundColor: "var(--text-tertiary)",
              animation: "piscaFisco 1.1s infinite",
              animationDelay: `${i * 0.16}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

/** Painel com a lista de conversas salvas */
function PainelHistorico({ aberto, onFechar, conversas, idAtual, onAbrir, onNova, onApagar }) {
  if (!aberto) return null;

  return (
    <div
      className="absolute inset-0 z-[20] flex flex-col"
      style={{ background: "rgba(0,0,0,0.35)", animation: "menuMsgFade 260ms ease-out" }}
      onClick={onFechar}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex flex-col h-full"
        style={{
          ...VIDRO_CHAT,
          border: "none",
          borderRadius: 0,
          animation: "painelEntra 300ms cubic-bezier(0.25,0.9,0.3,1)",
        }}
      >
        <style>{`
          @keyframes painelEntra {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>

        <div className="flex items-center gap-3 shrink-0" style={{ padding: "14px 16px" }}>
          <p className="flex-1 font-bold" style={{ color: "var(--text)", fontSize: 15 }}>
            Conversas
          </p>
          <button
            type="button"
            onClick={onNova}
            aria-label="Nova conversa"
            className="toque rounded-full flex items-center justify-center shrink-0"
            style={{ width: 32, height: 32, backgroundColor: "var(--vidro-superficie)" }}
          >
            <MessageSquarePlus size={16} style={{ color: "var(--primary)" }} />
          </button>
          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar historico"
            className="toque rounded-full flex items-center justify-center shrink-0"
            style={{ width: 32, height: 32, backgroundColor: "var(--vidro-superficie)" }}
          >
            <X size={16} style={{ color: "var(--text-secondary)" }} />
          </button>
        </div>

        <div
          className="flex-1 min-h-0 overflow-y-auto"
          style={{ padding: "0 12px 12px", display: "flex", flexDirection: "column", gap: 8 }}
        >
          {conversas.length === 0 && (
            <p
              className="text-center"
              style={{ color: "var(--text-tertiary)", fontSize: 13.5, marginTop: 24 }}
            >
              Nenhuma conversa salva ainda.
            </p>
          )}

          {conversas.map((c) => {
            const ativa = c.id === idAtual;
            return (
              <div
                key={c.id}
                className="rounded-2xl flex items-center"
                style={{
                  gap: 10,
                  padding: "11px 12px",
                  backgroundColor: ativa
                    ? "rgba(34,197,94,0.12)"
                    : "var(--vidro-superficie-fraca)",
                  border: ativa
                    ? "1px solid rgba(34,197,94,0.35)"
                    : "1px solid var(--vidro-borda)",
                }}
              >
                <button
                  type="button"
                  onClick={() => onAbrir(c.id)}
                  className="toque flex-1 min-w-0 text-left"
                  style={{ background: "none", border: "none", padding: 0 }}
                >
                  <p
                    className="truncate"
                    style={{ color: "var(--text)", fontSize: 14, fontWeight: 600 }}
                  >
                    {c.titulo}
                  </p>
                  <p style={{ color: "var(--text-tertiary)", fontSize: 11.5, marginTop: 2 }}>
                    {rotuloData(c.atualizadaEm)} - {c.mensagens.length} mensagens
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => onApagar(c.id)}
                  aria-label="Apagar conversa"
                  className="toque rounded-full flex items-center justify-center shrink-0"
                  style={{ width: 30, height: 30, backgroundColor: "var(--vidro-superficie-fraca)" }}
                >
                  <Trash2 size={14} style={{ color: "var(--text-tertiary)" }} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ===================================================================
   ChatFiscoPagina — o chat em tela cheia de PAGINA.

   Ocupa toda a area disponivel (a pagina /fisco). Como e conteudo de
   pagina no fluxo normal (nao overlay flutuante), o teclado do celular
   empurra/reduz a area naturalmente e a barra de digitar fica sempre
   visivel — sem calculo de visualViewport.

   Props:
     mensagens, digitando       — estado da conversa (vem da pagina)
     onEnviar(texto, citando)   — manda mensagem
     onEditarMensagem(id, txt)  — edita mensagem
     onFechar                   — volta pro dashboard (X)
     conversas, idAtual, on*    — historico
   =================================================================== */
export default function ChatFiscoUI({
  mensagens, digitando, onEnviar, onEditarMensagem, onFechar,
  conversas, idAtual, onAbrirConversa, onNovaConversa, onApagarConversa,
}) {
  const [rascunho, setRascunho] = useState("");
  const [menuAnexo, setMenuAnexo] = useState(false);
  const [historicoAberto, setHistoricoAberto] = useState(false);
  const [msgMenu, setMsgMenu] = useState(null);
  const [respondendo, setRespondendo] = useState(null);
  const [editando, setEditando] = useState(null);
  const fimRef = useRef(null);
  const inputChatRef = useRef(null);
  const areaMensagensRef = useRef(null);
  const raizRef = useRef(null);

  // Ajusta a ALTURA da pagina conforme o teclado, direto no DOM (sem
  // re-render do React, que adicionava atraso). Quando o teclado abre, a
  // pagina encolhe pra 100dvh menos a altura do teclado. A barra fica no
  // fim do espaco reduzido e a area de mensagens (flex-1) se ajusta
  // sozinha - o scroll passa a funcionar e a ultima mensagem nunca fica
  // escondida atras da barra. Encolher a altura tambem evita o teclado
  // "por cima" que acontecia com a barra flutuando.
  useEffect(() => {
    const vv = window.visualViewport;
    const raiz = raizRef.current;
    if (!vv || !raiz) return;

    const aplicar = (teclado, animar) => {
      raiz.style.transition = animar
        ? "height 260ms cubic-bezier(0.22,0.61,0.36,1)"
        : "none";
      if (teclado > 0) {
        // Ancora a pagina NA VIEWPORT VISIVEL: fixed + top acompanhando o
        // offsetTop. So mudar a altura nao bastava - o container ficava
        // presto no topo do documento e o rodape (a barra) caia fora da
        // vista, escondido atras do teclado.
        raiz.style.position = "fixed";
        raiz.style.top = `${vv.offsetTop}px`;
        raiz.style.left = "0";
        raiz.style.right = "0";
        raiz.style.height = `${vv.height}px`;
      } else {
        raiz.style.position = "";
        raiz.style.top = "";
        raiz.style.left = "";
        raiz.style.right = "";
        raiz.style.height = "100dvh";
      }
    };

    const seguir = () => {
      const teclado = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      // Anima a altura de forma suave (nao "seca"). O scroll pro fim NAO
      // fica aqui: se ficasse, disparava a cada micro-evento da viewport
      // e a tela "desfixava e reenquadrava". O scroll acontece so quando
      // chega mensagem nova (outro efeito, mais abaixo).
      aplicar(teclado > 60 ? teclado : 0, true);
    };

    // AO CHEGAR NA PAGINA: vindo do dashboard, o teclado da caixinha
    // ainda pode estar aberto/descendo. Ligar o seguidor por TEMPO nao
    // resolvia (se o teclado ainda estivesse aberto, a pagina encolhia e
    // depois voltava - o "salto"). Entao a pagina so passa a seguir o
    // teclado QUANDO O USUARIO TOCA NO CAMPO DAQUI. Ate la, ela fica
    // enquadrada em tela cheia e ignora qualquer movimento do teclado.
    aplicar(0, false);

    let seguindo = false;

    const ligarSeguidor = () => {
      if (seguindo) return;
      seguindo = true;
      vv.addEventListener("resize", seguir);
      vv.addEventListener("scroll", seguir);
      seguir();
    };

    const desligarSeguidor = () => {
      if (!seguindo) return;
      seguindo = false;
      vv.removeEventListener("resize", seguir);
      vv.removeEventListener("scroll", seguir);
    };

    // O usuario tocou num campo desta pagina: a partir daqui, seguimos.
    const aoFocar = (e) => {
      const t = e.target;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) {
        ligarSeguidor();
      }
    };

    // Perdeu o foco: devolve a tela cheia e para de seguir.
    const aoSair = () => {
      setTimeout(() => {
        const a = document.activeElement;
        const digitando = a && (a.tagName === "INPUT" || a.tagName === "TEXTAREA");
        if (!digitando) {
          aplicar(0, true);
          desligarSeguidor();
        }
      }, 60);
    };

    document.addEventListener("focusin", aoFocar);
    document.addEventListener("focusout", aoSair);

    return () => {
      desligarSeguidor();
      document.removeEventListener("focusin", aoFocar);
      document.removeEventListener("focusout", aoSair);
    };
  }, []);

  useEffect(() => {
    // Rola pro fim de forma DIRETA (mexe scrollTop na marra), nao suave.
    // Com "smooth", varias mensagens seguidas disparavam varios scrolls
    // animados ao mesmo tempo, que brigavam e faziam a tela pular pra
    // cima e pra baixo. Direto, vai pro fim de uma vez, sem briga.
    // O requestAnimationFrame garante que rola depois do DOM atualizar.
    const area = areaMensagensRef.current;
    if (!area) return;
    const id = requestAnimationFrame(() => {
      area.scrollTop = area.scrollHeight;
    });
    return () => cancelAnimationFrame(id);
  }, [mensagens, digitando]);

  function submeter(e) {
    e.preventDefault();
    const texto = rascunho.trim();
    if (!texto) return;
    if (editando) {
      onEditarMensagem?.(editando.id, texto);
      setEditando(null);
    } else {
      onEnviar(texto, respondendo);
    }
    setRespondendo(null);
    setRascunho("");
    // Volta o campo pro tamanho de uma linha (ele cresceu enquanto
    // digitava) e devolve o foco pra manter o teclado aberto, igual
    // WhatsApp. O foco e devolvido duas vezes (agora e no proximo tick)
    // porque no celular o toque no botao tira o foco do campo e o
    // re-render do React pode acontecer no meio.
    const campo = inputChatRef.current;
    if (campo) {
      campo.style.height = "auto";
      campo.focus();
      setTimeout(() => campo.focus(), 0);
    }
  }

  function copiarTexto(t) {
    try {
      navigator.clipboard?.writeText(t);
    } catch {}
  }

  return (
    <div
      ref={raizRef}
      className="w-full flex flex-col relative"
      style={{
        // Fundo que simula o REFLEXO do dashboard por tras do vidro:
        // um halo verde no alto (o velocimetro), brilhos suaves e um
        // escuro translucido por cima. Desenhar o dashboard de verdade
        // aqui e aplicar blur seria pesado demais no celular; isto da o
        // mesmo efeito visual sem custo.
        background: `
          radial-gradient(120% 55% at 50% 8%, rgba(34,197,94,0.16) 0%, rgba(34,197,94,0.05) 38%, transparent 68%),
          radial-gradient(80% 40% at 12% 24%, rgba(255,255,255,0.06) 0%, transparent 60%),
          radial-gradient(70% 35% at 88% 70%, rgba(255,255,255,0.04) 0%, transparent 60%),
          linear-gradient(160deg, rgba(24,24,27,0.92) 0%, rgba(12,12,14,0.96) 55%, rgba(8,8,10,0.98) 100%)
        `,
        color: "var(--text)",
        overflow: "hidden",
        // Impede o arrasto horizontal de "vazar" e acionar o gesto de
        // voltar do navegador (a pagina so fecha pelo X).
        overscrollBehaviorX: "none",
        touchAction: "pan-y",
        // A altura e ajustada direto no DOM pelo efeito "seguir": quando
        // o teclado abre, a pagina encolhe pra 100dvh menos o teclado, e
        // a barra (no rodape) fica naturalmente acima dele. Assim o scroll
        // funciona e a ultima mensagem nunca fica escondida.
        height: "100dvh",
      }}
    >
      <style>{`
        @keyframes piscaFisco {
          0%, 60%, 100% { opacity: 0.25; transform: translateY(0); }
          30% { opacity: 1; transform: translateY(-2px); }
        }
      `}</style>

      <div
        className="flex items-center gap-3 shrink-0"
        style={{
          padding: "14px 16px",
          paddingTop: "calc(env(safe-area-inset-top, 0px) + 14px)",
        }}
      >
        <span
          className="relative rounded-full overflow-hidden shrink-0 flex items-center justify-center"
          style={{ width: 54, height: 54, border: "1.5px solid rgba(34,197,94,0.45)" }}
        >
          <img
            src="/fisco-perfil.png"
            alt="Fisco"
            style={{ width: "108%", height: "108%", objectFit: "cover", objectPosition: "50% 18%" }}
          />
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-bold" style={{ color: "var(--text)", fontSize: 18 }}>Fisco</p>
          <p style={{ color: "var(--primary)", fontSize: 13 }}>&#9679; Online</p>
        </div>
        <button
          onClick={() => setHistoricoAberto(true)}
          aria-label="Historico de conversas"
          className="toque rounded-full flex items-center justify-center shrink-0"
          style={{ width: 44, height: 44, backgroundColor: "var(--vidro-superficie)" }}
        >
          <History size={23} style={{ color: "var(--text-secondary)" }} />
        </button>
        <button
          onClick={onFechar}
          aria-label="Fechar chat"
          className="toque rounded-full flex items-center justify-center shrink-0"
          style={{ width: 44, height: 44, backgroundColor: "var(--vidro-superficie)" }}
        >
          <X size={23} style={{ color: "var(--text-secondary)" }} />
        </button>
      </div>

      <PainelHistorico
        aberto={historicoAberto}
        onFechar={() => setHistoricoAberto(false)}
        conversas={conversas}
        idAtual={idAtual}
        onAbrir={(id) => { onAbrirConversa(id); setHistoricoAberto(false); }}
        onNova={() => { onNovaConversa(); setHistoricoAberto(false); }}
        onApagar={onApagarConversa}
      />

      <div
        ref={areaMensagensRef}
        className="flex-1 min-h-0 overflow-y-auto"
        style={{
          padding: 16,
          // A barra de digitar flutua por cima; este respiro garante que a
          // ultima mensagem role acima dela em vez de ficar escondida.
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 88px)",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {mensagens.map((m) => (
          <BolhaMensagem
            key={m.id}
            autor={m.autor}
            texto={m.texto}
            citando={m.citando}
            onSegurar={() => setMsgMenu(m)}
          />
        ))}
        {digitando && <FiscoDigitando />}
        <div ref={fimRef} />
      </div>

      <div
        className="relative"
        style={{
          // Flutua sobre as mensagens: sai do fluxo e fica ancorado no
          // fundo do container. Assim nao existe mais a faixa preta atras
          // da barra - as mensagens passam por tras dela.
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          padding: 12,
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)",
          background: "transparent",
        }}
      >
        {/* Contexto: respondendo ou editando */}
        {(respondendo || editando) && (
          <div
            className="flex items-center rounded-xl"
            style={{
              gap: 10,
              padding: "8px 10px",
              marginBottom: 8,
              backgroundColor: "var(--vidro-superficie-fraca)",
              borderLeft: "3px solid var(--primary)",
            }}
          >
            <div className="flex-1 min-w-0">
              <p style={{ color: "var(--primary)", fontSize: 11.5, fontWeight: 700 }}>
                {editando ? "Editando" : "Respondendo"}
              </p>
              <p
                className="truncate"
                style={{ color: "var(--text-secondary)", fontSize: 13 }}
              >
                {(editando || respondendo).texto}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setRespondendo(null);
                setEditando(null);
                setRascunho("");
              }}
              aria-label="Cancelar"
              className="toque rounded-full flex items-center justify-center shrink-0"
              style={{ width: 26, height: 26, backgroundColor: "var(--vidro-superficie)" }}
            >
              <X size={13} style={{ color: "var(--text-secondary)" }} />
            </button>
          </div>
        )}

        {/* Menu de anexos, abre acima do "+" */}
        {menuAnexo && (
          <>
            <div
              className="fixed inset-0"
              style={{ zIndex: 5 }}
              onClick={() => setMenuAnexo(false)}
            />
            <div
              className="absolute rounded-2xl overflow-hidden"
              style={{
                ...VIDRO_SUAVE,
                zIndex: 10,
                left: 12,
                bottom: 70,
                minWidth: 178,
                padding: 6,
              }}
            >
              {[
                { Icon: Camera, label: "Foto" },
                { Icon: ImageIcon, label: "Galeria" },
                { Icon: FileText, label: "Documento" },
                { Icon: ClipboardList, label: "Extrato" },
              ].map(({ Icon, label }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setMenuAnexo(false)}
                  className="toque w-full flex items-center rounded-xl"
                  style={{ gap: 11, padding: "10px 12px" }}
                >
                  <Icon size={17} style={{ color: "var(--primary)" }} />
                  <span style={{ color: "var(--text)", fontSize: 14.5 }}>{label}</span>
                </button>
              ))}
            </div>
          </>
        )}

        <form onSubmit={submeter} className="flex items-center gap-2">
          {/* "+" FORA da barra, a esquerda */}
          <button
            type="button"
            onClick={() => setMenuAnexo((v) => !v)}
            aria-label="Anexar"
            className="toque rounded-full flex items-center justify-center shrink-0"
            style={{
              width: 44,
              height: 44,
              // Mesmo tratamento da barra: quase 100% transparente.
              background: "rgba(255,255,255,0.04)",
              backdropFilter: "blur(10px) saturate(140%)",
              WebkitBackdropFilter: "blur(10px) saturate(140%)",
              border: "1px solid rgba(255,255,255,0.14)",
              transform: menuAnexo ? "rotate(45deg)" : "none",
              transition: "transform 300ms cubic-bezier(0.25,0.9,0.3,1)",
            }}
          >
            <Plus size={21} strokeWidth={2.4} style={{ color: "var(--text)" }} />
          </button>

          {/* Barra que CRESCE conforme o texto, ate um limite (igual WhatsApp) */}
          <div
            className="flex-1 min-w-0 flex items-end rounded-3xl"
            onClick={() => inputChatRef.current?.focus()}
            style={{
              minHeight: 52,
              paddingLeft: 18,
              paddingRight: 6,
              paddingTop: 6,
              paddingBottom: 6,
              gap: 8,
              cursor: "text",
              // Quase 100% transparente: so um veu de vidro e uma borda
              // sutil pra delimitar o campo, deixando o fundo aparecer.
              background: "rgba(255,255,255,0.04)",
              backdropFilter: "blur(10px) saturate(140%)",
              WebkitBackdropFilter: "blur(10px) saturate(140%)",
              border: "1px solid rgba(255,255,255,0.14)",
            }}
          >
            <textarea
              ref={inputChatRef}
              value={rascunho}
              rows={1}
              onChange={(e) => {
                setRascunho(e.target.value);
                // Cresce conforme o texto ate MAX_ALTURA_CAMPO; passando
                // disso, para de crescer e o proprio campo rola.
                const el = e.target;
                el.style.height = "auto";
                el.style.height = `${Math.min(el.scrollHeight, MAX_ALTURA_CAMPO)}px`;
              }}
              className="flex-1 min-w-0 resize-none"
              style={{
                background: "none",
                border: "none",
                outline: "none",
                color: "var(--text)",
                caretColor: "var(--primary)",
                fontSize: 15,
                lineHeight: 1.35,
                fontFamily: "inherit",
                maxHeight: MAX_ALTURA_CAMPO,
                overflowY: "auto",
                paddingTop: 9,
                paddingBottom: 9,
              }}
            />

            {rascunho.trim() ? (
              <button
                type="submit"
                aria-label="Enviar"
                // Impede o botao de roubar o foco do campo: sem isso, o
                // teclado piscava/fechava ao enviar. (So onMouseDown: em
                // eventos de toque o navegador ignora o preventDefault e
                // ainda avisa no console.)
                onMouseDown={(e) => e.preventDefault()}
                onClick={submeter}
                className="toque rounded-full flex items-center justify-center shrink-0"
                style={{ width: 40, height: 40 }}
              >
                <Send size={20} strokeWidth={2.1} style={{ color: "var(--text)" }} />
              </button>
            ) : (
              <button
                type="button"
                aria-label="Gravar audio"
                className="toque rounded-full flex items-center justify-center shrink-0"
                style={{ width: 40, height: 40 }}
              >
                <Mic size={20} strokeWidth={2.1} style={{ color: "var(--text)" }} />
              </button>
            )}
          </div>
        </form>
      </div>

      <MenuMensagem
        msg={msgMenu}
        onFechar={() => setMsgMenu(null)}
        onCopiar={() => copiarTexto(msgMenu?.texto || "")}
        onResponder={() => {
          setRespondendo(msgMenu);
          setEditando(null);
          setTimeout(() => inputChatRef.current?.focus(), 50);
        }}
        onEditar={() => {
          setEditando(msgMenu);
          setRespondendo(null);
          setRascunho(msgMenu?.texto || "");
          setTimeout(() => inputChatRef.current?.focus(), 50);
        }}
      />
    </div>
  );
}