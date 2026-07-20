import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, HelpCircle, FileText, ListChecks, Wand2, Paperclip, Send,
} from "lucide-react";
import Fisco from "../components/Fisco.jsx";

const VANTAGENS = [
  { Icon: HelpCircle, texto: "Tire dúvidas sobre MEI, DAS e imposto na hora" },
  { Icon: FileText, texto: "Envie foto ou PDF do extrato e o Fisco calcula pra você" },
  { Icon: ListChecks, texto: "Passo a passo pra pagar o DAS sem erro" },
  { Icon: Wand2, texto: "Explicações simples, sem juridiquês" },
];

export default function Chat() {
  const navigate = useNavigate();
  const [mensagens, setMensagens] = useState([]);
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
    setMensagens((prev) => [...prev, { id: Date.now(), autor: "user", texto: t }]);
    setTexto("");
  }

  const vazio = mensagens.length === 0;

  return (
    <div
      className="w-full flex flex-col"
      style={{
        backgroundColor: "var(--bg)",
        color: "var(--text)",
        height: "100dvh",
        overflow: "hidden",
      }}
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
        className="flex-1 overflow-y-auto px-5 hide-scrollbar"
        style={{ paddingBottom: "calc(84px + env(safe-area-inset-bottom))" }}
      >
        {vazio ? (
          <div className="flex flex-col items-center text-center">
            <div
              className="rounded-3xl flex items-center justify-center"
              style={{
                width: 96,
                height: 96,
                backgroundColor: "var(--field)",
                border: "1px solid var(--border)",
              }}
            >
              <Fisco size={78} />
            </div>
            <h2 className="mt-4 text-2xl font-bold" style={{ color: "var(--text)" }}>
              Fisco
            </h2>
            <p className="mt-0.5 text-sm" style={{ color: "var(--text-secondary)" }}>
              Seu amigo fiscal. Como posso te ajudar hoje?
            </p>

            <ul className="w-full mt-5 space-y-2.5">
              {VANTAGENS.map(({ Icon, texto }, i) => (
                <li
                  key={i}
                  className="flex items-center gap-3 rounded-2xl p-3.5 text-left"
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
                  <span
                    className="text-sm leading-snug"
                    style={{ color: "var(--text)" }}
                  >
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

      <form
        onSubmit={enviar}
        className="fixed left-0 right-0 z-20 px-4"
        style={{ bottom: "calc(env(safe-area-inset-bottom) + 20px)" }}
      >
        <div
          className="flex items-center gap-2 rounded-full pl-2 pr-1.5 py-1.5"
          style={{
            backgroundColor: "var(--surface)",
            border: "1px solid var(--border)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.28)",
          }}
        >
          <button
            type="button"
            aria-label="Anexar"
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 hover:opacity-80"
          >
            <Paperclip size={18} style={{ color: "var(--text-secondary)" }} />
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