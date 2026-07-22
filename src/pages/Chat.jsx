import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Paperclip, Send, Sparkles } from "lucide-react";
import Fisco from "../components/Fisco.jsx";
import { useAppState } from "@/context/AppStateContext";
import { faixaDoVelocimetro, FAIXA_INFO } from "@/lib/fiscal";
import {
  perguntasDaFaixa, perguntasGerais, contextoFaq, textoPergunta,
} from "@/lib/faqFisco";

function poseDaFaixa(faixa) {
  if (faixa === "tranquilo" || faixa === "fique_de_olho") return "joinha";
  if (faixa === "atencao" || faixa === "perto_do_limite") return "ok";
  return "alerta";
}

export default function Chat() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const contexto = params.get("contexto");

  const { tipoMEI, faturamentoAtual, limiteAtual, percentualAtual } = useAppState();

  const faixa = faixaDoVelocimetro(percentualAtual);
  const pose = poseDaFaixa(faixa);
  const corFaixa = FAIXA_INFO[faixa].cor;

  const modoContextual = contexto === "situacao" || contexto === "limite";
  const ctx = contextoFaq({ tipoMEI, limite: limiteAtual, faturado: faturamentoAtual });
  const perguntas = modoContextual ? perguntasDaFaixa(faixa) : perguntasGerais();

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
    setTimeout(() => {
      setDigitando(false);
      setMensagens((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          autor: "fisco",
          texto:
            "Essa eu ainda não sei responder sozinho — em breve vou conseguir buscar a resposta certa pra você.\n\nPor enquanto, toque em uma das perguntas prontas ou fale com um contador se for algo urgente.",
        },
      ]);
    }, 3000);
  }

  const vazio = mensagens.length === 0 && !digitando;

  const titulo = modoContextual ? "Sobre a sua situação" : "Fisco";
  const subtitulo = modoContextual
    ? FAIXA_INFO[faixa].resumo
    : "Seu amigo fiscal. Como posso te ajudar hoje?";

  return (
    <div
      className="tela-fixa w-full flex flex-col"
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

      <div ref={listaRef} className="flex-1 min-h-0 overflow-y-auto hide-scrollbar px-5">
        {vazio ? (
          <>
            <div className="flex flex-col items-center text-center">
              <Fisco
                size={modoContextual ? 128 : 150}
                pose={pose}
                fala={FAIXA_INFO[faixa].palavra}
                corFala={corFaixa}
              />
              <h2 className="text-xl font-bold mt-1" style={{ color: "var(--text)" }}>
                {titulo}
              </h2>
              <p
                className="mt-0.5 text-[13px] px-4"
                style={{ color: "var(--text-secondary)" }}
              >
                {subtitulo}
              </p>
            </div>

            <p
              className="text-[11px] font-semibold uppercase mt-4 mb-2"
              style={{ color: "var(--text-tertiary)", letterSpacing: "0.06em" }}
            >
              {modoContextual ? "Perguntas comuns nessa situação" : "Perguntas frequentes"}
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
        ) : (
          <div className="space-y-3 pt-2 pb-4">
            {mensagens.map((m) => {
              const isUser = m.autor === "user";
              return (
                <div key={m.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                  <div
                    className="max-w-[85%] rounded-2xl px-4 py-2.5 text-[14px] leading-relaxed"
                    style={
                      isUser
                        ? {
                            backgroundColor: "var(--primary)",
                            color: "var(--primary-contrast)",
                            borderBottomRightRadius: 6,
                            fontWeight: 500,
                          }
                        : {
                            backgroundColor: "var(--field)",
                            color: "var(--text)",
                            borderBottomLeftRadius: 6,
                            whiteSpace: "pre-line",
                          }
                    }
                  >
                    {m.texto}
                  </div>
                </div>
              );
            })}

            {digitando && (
              <div className="flex justify-start">
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

            {!digitando && mensagens.length > 0 && (
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

      <form
        onSubmit={enviar}
        className="shrink-0 px-4"
        style={{
          paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)",
          paddingTop: 10,
        }}
      >
        <div
          className="flex items-center gap-2 rounded-full pl-2 pr-1.5 py-1.5"
          style={{
            backgroundColor: "var(--surface)",
            border: "1px solid var(--border)",
            boxShadow: "var(--sombra-card)",
          }}
        >
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