import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Paperclip, Send, Sparkles } from "lucide-react";
import Fisco from "../components/Fisco.jsx";
import FiscoComBalao from "../components/FiscoComBalao.jsx";
import { useAppState } from "@/context/AppStateContext";
import { faixaDoVelocimetro, FAIXA_INFO, LIMITE_PERGUNTA_CHAT } from "@/lib/fiscal";
import {
  perguntasDaFaixa, contextoFaq, textoPergunta, buscarRespostaPorTexto,
} from "@/lib/faqFisco";

function poseDaFaixa(faixa) {
  if (faixa === "tranquilo" || faixa === "fique_de_olho") return "joinha";
  if (faixa === "atencao" || faixa === "perto_do_limite") return "ok";
  return "alerta";
}

function AvatarFisco() {
  return (
    <span
      className="rounded-full flex items-center justify-center shrink-0 overflow-hidden"
      style={{
        width: 34,
        height: 34,
        marginBottom: 2,
        backgroundColor: "var(--surface)",
        border: "1px solid var(--border)",
      }}
    >
      <Fisco size={30} pose="amigavel" apenasCabeca />
    </span>
  );
}

export default function Chat() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const contexto = params.get("contexto");

  const { tipoMEI, faturamentoAtual, limiteAtual, percentualAtual } = useAppState();

  const faixa = faixaDoVelocimetro(percentualAtual);
  const corFaixa = FAIXA_INFO[faixa].cor;

  const modoContextual = contexto === "situacao" || contexto === "limite";
  const pose = modoContextual ? poseDaFaixa(faixa) : "amigavel";

  const ctx = contextoFaq({ tipoMEI, limite: limiteAtual, faturado: faturamentoAtual });

  // Cards de pergunta pronta: SÓ no chat contextual.
  const perguntas = modoContextual ? perguntasDaFaixa(faixa) : [];

  const [mensagens, setMensagens] = useState([]);
  const [texto, setTexto] = useState("");
  const [digitando, setDigitando] = useState(false);
  const listaRef = useRef(null);

  useEffect(() => {
    if (listaRef.current) {
      listaRef.current.scrollTop = listaRef.current.scrollHeight;
    }
  }, [mensagens, digitando]);

  function responder(item) {
    const pergunta = textoPergunta(item, ctx);
    setMensagens((prev) => [
      ...prev,
      { id: Date.now(), autor: "user", texto: pergunta },
    ]);
    setDigitando(true);
    setTimeout(() => {
      setDigitando(false);
      setMensagens((prev) => [
        ...prev,
        { id: Date.now() + 1, autor: "fisco", texto: item.resposta(ctx) },
      ]);
    }, 3000);
  }

  function enviar(e) {
    e?.preventDefault?.();
    const t = texto.trim();
    if (!t) return;
    setMensagens((prev) => [...prev, { id: Date.now(), autor: "user", texto: t }]);
    setTexto("");
    setDigitando(true);

    const achou = buscarRespostaPorTexto(t);

    setTimeout(() => {
      setDigitando(false);
      setMensagens((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          autor: "fisco",
          texto: achou
            ? achou.resposta(ctx)
            : "Me conta um pouco mais sobre o que você quer saber — pode ser sobre o DAS, seu limite de faturamento, nota fiscal, a declaração anual ou seus direitos como MEI.",
        },
      ]);
    }, 3000);
  }

  const vazio = mensagens.length === 0 && !digitando;

  const titulo = modoContextual ? "Sobre a sua situação" : "Fisco";

  return (
    <div
      className="tela-fixa w-full flex flex-col relative"
      style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
    >
      <header className="px-5 pt-5 pb-1 flex items-center gap-3 shrink-0">
        <button
          onClick={() => navigate(-1)}
          aria-label="Voltar"
          className="w-10 h-10 rounded-full flex items-center justify-center hover:opacity-80"
          style={{ backgroundColor: "var(--field)" }}
        >
          <ArrowLeft size={20} style={{ color: "var(--text)" }} />
        </button>
      </header>

      <div
        ref={listaRef}
        className="flex-1 min-h-0 overflow-y-auto hide-scrollbar px-5"
        style={{ paddingBottom: "calc(96px + env(safe-area-inset-bottom))" }}
      >
        {vazio ? (
          <>
            {modoContextual ? (
              <div className="flex flex-col items-center text-center">
                <FiscoComBalao
                  size={118}
                  pose={pose}
                  fala={FAIXA_INFO[faixa].palavra}
                  corFala={corFaixa}
                  offsetBalao={{ x: 52, y: 2 }}
                />
                <h2 className="text-lg font-bold mt-1" style={{ color: "var(--text)" }}>
                  {titulo}
                </h2>
                <p
                  className="mt-0.5 text-[13px] px-4"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {FAIXA_INFO[faixa].resumo}
                </p>
              </div>
            ) : (
              /* Header do chat geral */
              <div
                className="rounded-3xl px-5 pt-3 pb-4 flex items-center gap-3 overflow-hidden relative"
                style={{
                  background:
                    "linear-gradient(150deg, rgba(34,197,94,0.12) 0%, rgba(34,197,94,0.03) 55%, transparent 100%), var(--surface)",
                  border: "1px solid var(--border)",
                }}
              >
                <Fisco size={112} pose="amigavel" className="shrink-0" style={{ marginLeft: -10 }} />
                <div className="flex-1 min-w-0">
                  <div
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 mb-1.5"
                    style={{ backgroundColor: "rgba(34,197,94,0.14)" }}
                  >
                    <span
                      className="rounded-full"
                      style={{ width: 6, height: 6, backgroundColor: "var(--primary)" }}
                    />
                    <span
                      className="text-[10px] font-bold uppercase"
                      style={{ color: "var(--primary)", letterSpacing: "0.08em" }}
                    >
                      Online
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold leading-none" style={{ color: "var(--text)" }}>
                    Fisco
                  </h2>
                  <p
                    className="mt-1.5 text-[13px] leading-snug"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Seu amigo fiscal. Pode perguntar o que quiser.
                  </p>
                </div>
              </div>
            )}

            {/* Cards de pergunta pronta: só no contextual */}
            {modoContextual && (
              <>
                <p
                  className="text-[11px] font-semibold uppercase mt-4 mb-2"
                  style={{ color: "var(--text-tertiary)", letterSpacing: "0.06em" }}
                >
                  Perguntas comuns nessa situação
                </p>

                <div className="space-y-2 pb-4">
                  {perguntas.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => responder(p)}
                      className="w-full rounded-2xl px-4 py-3 flex items-center gap-3 text-left active:opacity-75"
                      style={{ backgroundColor: "var(--field)" }}
                    >
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: "var(--surface)" }}
                      >
                        <Sparkles size={16} style={{ color: "var(--primary)" }} />
                      </div>
                      <span
                        className="flex-1 text-[14px] leading-snug font-medium"
                        style={{ color: "var(--text)" }}
                      >
                        {textoPergunta(p, ctx)}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="space-y-3 pt-2 pb-4">
            {mensagens.map((m) => {
              const isUser = m.autor === "user";
              if (isUser) {
                return (
                  <div key={m.id} className="flex justify-end">
                    <div
                      className="max-w-[85%] rounded-2xl px-4 py-2.5 text-[14px] leading-relaxed"
                      style={{
                        backgroundColor: "var(--primary)",
                        color: "var(--primary-contrast)",
                        borderBottomRightRadius: 6,
                        fontWeight: 500,
                      }}
                    >
                      {m.texto}
                    </div>
                  </div>
                );
              }
              return (
                <div key={m.id} className="flex justify-start items-end gap-1.5">
                  <AvatarFisco />
                  <div
                    className="max-w-[80%] rounded-2xl px-4 py-2.5 text-[14px] leading-relaxed"
                    style={{
                      backgroundColor: "var(--field)",
                      color: "var(--text)",
                      borderBottomLeftRadius: 6,
                      whiteSpace: "pre-line",
                    }}
                  >
                    {m.texto}
                  </div>
                </div>
              );
            })}

            {digitando && (
              <div className="flex justify-start items-end gap-1.5">
                <AvatarFisco />
                <div
                  className="rounded-2xl px-4 py-3 flex items-center gap-1.5"
                  style={{ backgroundColor: "var(--field)", borderBottomLeftRadius: 6 }}
                >
                  <span className="text-[13px]" style={{ color: "var(--text-secondary)" }}>
                    Fisco está digitando
                  </span>
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="rounded-full"
                      style={{
                        width: 5,
                        height: 5,
                        backgroundColor: "var(--primary)",
                        animation: `fiscoPonto 1.2s ease-in-out ${i * 0.18}s infinite`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Sugestões: só no contextual */}
            {modoContextual && !digitando && mensagens.length > 0 && (
              <div className="pt-2 space-y-2">
                <p
                  className="text-[11px] font-semibold uppercase"
                  style={{ color: "var(--text-tertiary)", letterSpacing: "0.06em" }}
                >
                  Perguntar outra coisa
                </p>
                {perguntas
                  .filter((p) => !mensagens.some((m) => m.texto === textoPergunta(p, ctx)))
                  .slice(0, 3)
                  .map((p) => (
                    <button
                      key={p.id}
                      onClick={() => responder(p)}
                      className="w-full rounded-2xl px-4 py-2.5 flex items-center gap-2.5 text-left active:opacity-75"
                      style={{ backgroundColor: "var(--field)" }}
                    >
                      <Sparkles size={15} style={{ color: "var(--primary)" }} className="shrink-0" />
                      <span
                        className="flex-1 text-[13px] leading-snug"
                        style={{ color: "var(--text)" }}
                      >
                        {textoPergunta(p, ctx)}
                      </span>
                    </button>
                  ))}
              </div>
            )}
          </div>
        )}

        <style>{`
          @keyframes fiscoPonto {
            0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
            30% { opacity: 1; transform: translateY(-3px); }
          }
        `}</style>
      </div>

      {/* Barra flutuante translúcida, sem rodapé */}
      <form
        onSubmit={enviar}
        className="absolute left-0 right-0 bottom-0 px-4 pointer-events-none"
        style={{
          paddingBottom: "calc(env(safe-area-inset-bottom) + 14px)",
          paddingTop: 6,
        }}
      >
        <div className="barra-flutuante pointer-events-auto flex items-center gap-2 rounded-full pl-2 pr-1.5 py-1.5">
          <button
            type="button"
            aria-label="Anexar"
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 hover:opacity-80"
          >
            <Paperclip size={18} style={{ color: "var(--text-tertiary)" }} />
          </button>
          <input
            type="text"
            value={texto}
            maxLength={LIMITE_PERGUNTA_CHAT}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Pergunte ao Fisco..."
            className="flex-1 bg-transparent outline-none text-sm py-2"
            style={{ color: "var(--text)" }}
          />
          <button
            type="submit"
            aria-label="Enviar"
            disabled={!texto.trim()}
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 active:scale-95 transition disabled:opacity-50"
            style={{
              backgroundColor: "var(--primary)",
              color: "var(--primary-contrast)",
            }}
          >
            <Send size={18} />
          </button>
        </div>
      </form>
    </div>
  );
}