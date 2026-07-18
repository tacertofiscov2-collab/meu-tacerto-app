import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, MessageCircle, HelpCircle, FileText, ListChecks, Sparkles,
  Paperclip, Send,
} from "lucide-react";
import BottomNav from "../components/BottomNav.jsx";

const VANTAGENS = [
  { Icon: HelpCircle, texto: "Tire dúvidas sobre MEI, DAS e imposto na hora" },
  { Icon: FileText, texto: "Envie foto ou PDF do extrato e a IA calcula pra você" },
  { Icon: ListChecks, texto: "Passo a passo pra pagar o DAS sem erro" },
  { Icon: Sparkles, texto: "Explicações simples, sem juridiquês" },
];

export default function Chat() {
  const navigate = useNavigate();
  const [mensagens, setMensagens] = useState([]); // { id, autor: 'user'|'ia', texto }
  const [texto, setTexto] = useState("");
  const listaRef = useRef(null);

  useEffect(() => {
    if (listaRef.current) {
      listaRef.current.scrollTop = listaRef.current.scrollHeight;
    }
  }, [mensagens]);

  function enviar(e) {
    e?.preventDefault?.();
    const t = texto.trim();
    if (!t) return;
    // TODO: integrar com IA (fora da Lovable)
    setMensagens((prev) => [
      ...prev,
      { id: Date.now(), autor: "user", texto: t },
    ]);
    setTexto("");
  }

  const vazio = mensagens.length === 0;

  return (
    <div
      className="min-h-screen min-h-[100dvh] w-full flex flex-col"
      style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
    >
      {/* Header */}
      <header className="px-5 pt-6 pb-4 flex items-center gap-3 shrink-0">
        <button
          onClick={() => navigate(-1)}
          aria-label="Voltar"
          className="w-10 h-10 rounded-full flex items-center justify-center hover:opacity-80"
          style={{ backgroundColor: "var(--field)" }}
        >
          <ArrowLeft size={20} style={{ color: "var(--text)" }} />
        </button>
        <h1 className="text-xl font-bold flex-1 text-center pr-10" style={{ color: "var(--text)" }}>
          Chat IA
        </h1>
      </header>

      {/* Área principal */}
      <div
        ref={listaRef}
        className="flex-1 overflow-y-auto px-5"
        style={{ paddingBottom: "calc(180px + env(safe-area-inset-bottom))" }}
      >
        {vazio ? (
          <div className="flex flex-col items-center text-center pt-4">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: "var(--field)", border: "1px solid var(--border)" }}
            >
              <MessageCircle size={40} style={{ color: "var(--primary)" }} />
            </div>
            <h2 className="mt-5 text-2xl font-bold" style={{ color: "var(--text)" }}>
              Sua assistente fiscal
            </h2>
            <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
              Como posso te ajudar hoje?
            </p>

            <ul className="w-full mt-6 space-y-2.5">
              {VANTAGENS.map(({ Icon, texto }, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 rounded-2xl p-3.5 text-left"
                  style={{
                    backgroundColor: "var(--surface)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: "var(--field)" }}
                  >
                    <Icon size={18} style={{ color: "var(--primary)" }} />
                  </div>
                  <span className="text-sm leading-relaxed pt-1" style={{ color: "var(--text)" }}>
                    {texto}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="space-y-3 pt-2">
            {mensagens.map((m) => {
              const isUser = m.autor === "user";
              return (
                <div
                  key={m.id}
                  className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className="max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed"
                    style={
                      isUser
                        ? {
                            backgroundColor: "var(--primary)",
                            color: "var(--primary-contrast)",
                            borderBottomRightRadius: 6,
                          }
                        : {
                            backgroundColor: "var(--surface)",
                            color: "var(--text)",
                            border: "1px solid var(--border)",
                            borderBottomLeftRadius: 6,
                          }
                    }
                  >
                    {m.texto}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Input fixo acima da navbar */}
      <form
        onSubmit={enviar}
        className="fixed left-0 right-0 z-20 px-4"
        style={{ bottom: "calc(90px + env(safe-area-inset-bottom))" }}
      >
        <div
          className="flex items-center gap-2 rounded-full pl-2 pr-1.5 py-1.5"
          style={{
            backgroundColor: "var(--surface)",
            border: "1px solid var(--border)",
          }}
        >
          <button
            type="button"
            aria-label="Anexar"
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 hover:opacity-80"
            // TODO: implementar anexo (foto/PDF)
          >
            <Paperclip size={18} style={{ color: "var(--text-secondary)" }} />
          </button>
          <input
            type="text"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Pergunte alguma coisa..."
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

      <BottomNav />
    </div>
  );
}
