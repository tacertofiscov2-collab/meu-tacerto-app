import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Sun, Moon, Wand2, Type, Bell, CalendarClock, Check,
} from "lucide-react";

import BottomNav from "../components/BottomNav.jsx";

/* PREFERENCIAS v2 — cards no padrao .card-tacerto (index.css).
   Setinha de voltar mantida com vidro. Botoes de selecao internos
   (tamanho de fonte, dias do lembrete) nao foram alterados: o fundo
   deles e o que mostra qual esta escolhido. */

const KEY_TEMA = "tacerto_tema";
const KEY_FONTE = "tacerto_fonte";
const KEY_PUSH = "tacerto_push";
const KEY_LEMBRETE = "tacerto_lembrete_das";

/* O tema oficial do TaCerto! é o ESCURO. O claro e o automático só
   entram se o usuário escolher — por isso o padrão em todo lugar é
   "escuro", nunca "auto". */
const TEMA_PADRAO = "escuro";

export function temaEfetivo(escolha) {
  if (escolha === "claro") return "claro";
  if (escolha === "escuro") return "escuro";
  const h = new Date().getHours();
  return h >= 6 && h < 18 ? "claro" : "escuro";
}

export function aplicarTema(escolha) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const modo = temaEfetivo(escolha);
  root.classList.remove("theme-light");
  if (modo === "claro") root.classList.add("theme-light");
}

export function aplicarFonte(valor) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.remove("font-small", "font-medium", "font-large");
  if (valor === "small") root.classList.add("font-small");
  else if (valor === "large") root.classList.add("font-large");
  else root.classList.add("font-medium");
}

function CardOpcao({ Icon, label, sub, ativo, onClick }) {
  return (
    <button
      onClick={onClick}
      className="card-tacerto flex-1 rounded-2xl px-3 py-3 flex flex-col items-center gap-1.5 transition"
      style={{
        borderColor: ativo ? "var(--primary)" : undefined,
        opacity: ativo ? 1 : 0.55,
      }}
    >
      <Icon
        size={22}
        strokeWidth={ativo ? 2.3 : 1.9}
        style={{ color: ativo ? "var(--primary)" : "var(--text-secondary)" }}
      />
      <span
        className="text-[13px] leading-none"
        style={{ color: "var(--text)", fontWeight: ativo ? 700 : 500 }}
      >
        {label}
      </span>
      {sub && (
        <span
          className="text-[10px] leading-tight text-center"
          style={{ color: "var(--text-secondary)" }}
        >
          {sub}
        </span>
      )}
    </button>
  );
}

function Switch({ ativo, onChange, label }) {
  return (
    <button
      onClick={() => onChange(!ativo)}
      role="switch"
      aria-checked={ativo}
      aria-label={label}
      className="relative w-12 h-7 rounded-full transition-colors shrink-0"
      style={{ backgroundColor: ativo ? "var(--primary)" : "var(--field)" }}
    >
      <span
        className="absolute top-1 left-1 w-5 h-5 rounded-full transition-transform"
        style={{
          backgroundColor: "#fff",
          transform: ativo ? "translateX(20px)" : "translateX(0)",
        }}
      />
    </button>
  );
}

const OPCOES_LEMBRETE = [
  { valor: "5", label: "5 dias antes" },
  { valor: "3", label: "3 dias antes" },
  { valor: "1", label: "1 dia antes" },
  { valor: "0", label: "No dia" },
];

export default function Preferencias() {
  const navigate = useNavigate();

  const [tema, setTema] = useState(() => {
    if (typeof window === "undefined") return TEMA_PADRAO;
    return localStorage.getItem(KEY_TEMA) || TEMA_PADRAO;
  });
  const [fonte, setFonte] = useState(() => {
    if (typeof window === "undefined") return "medium";
    return localStorage.getItem(KEY_FONTE) || "medium";
  });
  const [push, setPush] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem(KEY_PUSH) !== "0";
  });
  const [lembrete, setLembrete] = useState(() => {
    if (typeof window === "undefined") return "3";
    return localStorage.getItem(KEY_LEMBRETE) || "3";
  });

  useEffect(() => {
    aplicarTema(tema);
    try {
      localStorage.setItem(KEY_TEMA, tema);
    } catch {}
  }, [tema]);

  useEffect(() => {
    if (tema !== "auto") return;
    const id = setInterval(() => aplicarTema("auto"), 60000);
    return () => clearInterval(id);
  }, [tema]);

  useEffect(() => {
    aplicarFonte(fonte);
    try {
      localStorage.setItem(KEY_FONTE, fonte);
    } catch {}
  }, [fonte]);

  useEffect(() => {
    try {
      localStorage.setItem(KEY_PUSH, push ? "1" : "0");
    } catch {}
  }, [push]);

  useEffect(() => {
    try {
      localStorage.setItem(KEY_LEMBRETE, lembrete);
    } catch {}
  }, [lembrete]);

  const subAuto =
    tema === "auto"
      ? temaEfetivo("auto") === "claro"
        ? "Claro agora"
        : "Escuro agora"
      : "6h às 18h claro";

  return (
    <div
      className="w-full flex flex-col"
      style={{
        backgroundColor: "var(--bg)",
        color: "var(--text)",
        height: "100dvh",
        maxHeight: "100dvh",
        overflow: "hidden",
      }}
    >
      <header className="px-5 pt-6 pb-2 flex items-center gap-3 shrink-0">
        <button
          onClick={() => navigate(-1)}
          aria-label="Voltar"
          className="w-10 h-10 rounded-full flex items-center justify-center hover:opacity-80"
          style={{ background: "linear-gradient(160deg, var(--vidro-brilho-1) 0%, var(--vidro-brilho-2) 24%, transparent 58%), var(--vidro-bg)", backdropFilter: "blur(24px) saturate(160%)", WebkitBackdropFilter: "blur(24px) saturate(160%)", border: "1px solid var(--vidro-borda)", boxShadow: "inset 0 1.5px 0 0 var(--vidro-topo-forte), inset 0 9px 20px -8px var(--vidro-topo-medio), inset 0 -1.5px 0 0 var(--vidro-base), 0 8px 24px var(--vidro-sombra)" }}
        >
          <ArrowLeft size={20} style={{ color: "var(--text)" }} />
        </button>
        <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>
          Preferências
        </h1>
      </header>

      <div
        className="px-5 flex-1 min-h-0 flex flex-col gap-4"
        style={{ paddingBottom: "calc(12px + env(safe-area-inset-bottom))" }}
      >
        <section>
          <p
            className="text-[13px] mb-2"
            style={{ color: "var(--text-secondary)" }}
          >
            Tema do app
          </p>
          {/* Escuro primeiro: é o tema oficial e o padrão do app. */}
          <div className="flex gap-2">
            <CardOpcao
              Icon={Moon}
              label="Escuro"
              sub="Padrão"
              ativo={tema === "escuro"}
              onClick={() => setTema("escuro")}
            />
            <CardOpcao
              Icon={Sun}
              label="Claro"
              ativo={tema === "claro"}
              onClick={() => setTema("claro")}
            />
            <CardOpcao
              Icon={Wand2}
              label="Automático"
              sub={subAuto}
              ativo={tema === "auto"}
              onClick={() => setTema("auto")}
            />
          </div>
        </section>

        <section>
          <p
            className="text-[13px] mb-2"
            style={{ color: "var(--text-secondary)" }}
          >
            Tamanho da fonte
          </p>
          <div className="card-tacerto rounded-2xl px-4 py-3">
            <div className="flex items-end justify-between gap-2">
              {[
                { v: "small", label: "Pequena", tam: 13 },
                { v: "medium", label: "Médio", tam: 16 },
                { v: "large", label: "Grande", tam: 20 },
              ].map((op) => {
                const ativo = fonte === op.v;
                return (
                  <button
                    key={op.v}
                    onClick={() => setFonte(op.v)}
                    className="flex-1 flex flex-col items-center gap-2 py-2 rounded-xl transition"
                    style={{
                      backgroundColor: ativo
                        ? "var(--surface-selected)"
                        : "transparent",
                      opacity: ativo ? 1 : 0.5,
                    }}
                  >
                    <Type
                      size={op.tam}
                      strokeWidth={ativo ? 2.3 : 1.9}
                      style={{
                        color: ativo ? "var(--primary)" : "var(--text-secondary)",
                      }}
                    />
                    <span
                      className="text-[12px] leading-none"
                      style={{
                        color: "var(--text)",
                        fontWeight: ativo ? 700 : 500,
                      }}
                    >
                      {op.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section>
          <p
            className="text-[13px] mb-2"
            style={{ color: "var(--text-secondary)" }}
          >
            Notificações
          </p>

          <div className="card-tacerto rounded-2xl px-4 py-3 flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: "var(--surface)" }}
            >
              <Bell size={19} style={{ color: "var(--primary)" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[15px]" style={{ color: "var(--text)" }}>
                Alertas do Fisco
              </p>
              <p
                className="text-xs mt-0.5"
                style={{ color: "var(--text-secondary)" }}
              >
                Avisos sobre seu MEI
              </p>
            </div>
            <Switch ativo={push} onChange={setPush} label="Notificações push" />
          </div>

          <div
            className="card-tacerto rounded-2xl px-4 pt-3 pb-3 mt-2"
            style={{
              opacity: push ? 1 : 0.45,
              pointerEvents: push ? "auto" : "none",
            }}
          >
            <div className="flex items-center gap-3 mb-2.5">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: "var(--surface)" }}
              >
                <CalendarClock size={19} style={{ color: "var(--primary)" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px]" style={{ color: "var(--text)" }}>
                  Lembrete do DAS
                </p>
                <p
                  className="text-xs mt-0.5"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Vence todo dia 20
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {OPCOES_LEMBRETE.map((op) => {
                const ativo = lembrete === op.valor;
                return (
                  <button
                    key={op.valor}
                    onClick={() => setLembrete(op.valor)}
                    className="py-2 rounded-xl text-[13px] flex items-center justify-center gap-1.5 transition"
                    style={{
                      backgroundColor: ativo
                        ? "var(--surface-selected)"
                        : "var(--surface)",
                      color: "var(--text)",
                      fontWeight: ativo ? 700 : 500,
                      opacity: ativo ? 1 : 0.6,
                    }}
                  >
                    {ativo && <Check size={14} style={{ color: "var(--primary)" }} />}
                    {op.label}
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      <BottomNav />
    </div>
  );
}