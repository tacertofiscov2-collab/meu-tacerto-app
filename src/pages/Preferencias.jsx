/* PREFERENCIAS v4 — so o que funciona: "Lembrete do DAS" (dias antes: 7, 5, 3, 2, 1 e no dia, varios; horario; "Não quero lembretes"), gravado no perfil (lembrete_das_dias e lembrete_das_hora); sairam Tema (fica no Perfil), Tamanho da fonte e "Alertas do Fisco" (nao faziam nada) (v3: "Fisco.ia" vira "Fisco" nos textos da tela (so a Apresentacao do Fisco.ia mantem o nome) (v2: setinha de voltar maior (bolinha 46, seta 24; sem bolinha, seta 26) (v1: "Fisco" vira "Fisco.ia" nos textos da tela (05/10/2026)))) */
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, BellOff } from "lucide-react";
import TopoRolavel from "../components/TopoRolavel.jsx";
import { useAppState } from "@/context/AppStateContext";
import {
  TEXTO_VENCIMENTO_DAS, proximoVencimentoDas, formatarDiaMes,
} from "@/lib/vencimentoDas";

/* ===================================================================
   PREFERENCIAS v4 (10/10/2026 — tarefa de 08-10, Etapa 6)

   So o LEMBRETE DO DAS (o resto da tela antiga nao fazia nada; o Tema
   Preto/Branco esta no Perfil).
   - Dias antes do vencimento: 7, 5, 3, 2, 1 e "No dia" (pode marcar
     varios). Padrao: 7, 2 e no dia (o mesmo do banco).
   - Horario do lembrete (padrao 9:00 — pergunta para o Fernando no
     HANDOFF).
   - "Não quero lembretes": nenhum dia marcado (lembrete_das_dias = {}).
   Grava sozinho a cada toque (perfis.lembrete_das_dias e
   perfis.lembrete_das_hora — AppStateContext.salvarLembreteDas).
   O ENVIO automatico ainda NAO existe (plano em
   docs/PLANO-AUTOMACAO-DAS.md); no piloto, o Fernando usa estas
   escolhas para mandar os lembretes.

   As funcoes de tema continuam aqui porque o Perfil usa (aplicarTema e
   temaEfetivo).
   =================================================================== */

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

const DIAS = [
  { valor: 7, rotulo: "7 dias antes" },
  { valor: 5, rotulo: "5 dias antes" },
  { valor: 3, rotulo: "3 dias antes" },
  { valor: 2, rotulo: "2 dias antes" },
  { valor: 1, rotulo: "1 dia antes" },
  { valor: 0, rotulo: "No dia" },
];
const HORA_PADRAO = "09:00";

const ROTULO_SECAO = {
  color: "var(--text-tertiary)",
  fontSize: 12.5,
  fontWeight: 600,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};

export default function Preferencias() {
  const navigate = useNavigate();
  const { lembreteDasDias, lembreteDasHora, salvarLembreteDas } = useAppState();
  const dias = Array.isArray(lembreteDasDias) ? lembreteDasDias : [7, 2, 0];
  const hora = lembreteDasHora || HORA_PADRAO;
  const semLembrete = dias.length === 0;

  const [guardado, setGuardado] = useState(false);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);

  async function salvar(patch) {
    await salvarLembreteDas(patch);
    setGuardado(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setGuardado(false), 1600);
  }

  function alternarDia(valor) {
    const novo = dias.includes(valor) ? dias.filter((d) => d !== valor) : [...dias, valor];
    salvar({ dias: novo.sort((a, b) => b - a) });
  }

  function voltar() {
    if ((window.history.state?.idx ?? 0) > 0) navigate(-1);
    else navigate("/perfil", { replace: true });
  }

  const proximo = proximoVencimentoDas();

  return (
    <div className="tela-rolavel w-full flex flex-col" style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}>
      <div className="conteudo-rolavel hide-scrollbar px-5" style={{ paddingBottom: "calc(40px + env(safe-area-inset-bottom))" }}>
        <TopoRolavel titulo="Preferências" onVoltar={voltar} />

        <p style={{ ...ROTULO_SECAO, marginTop: 10 }}>Lembrete do DAS</p>
        <p style={{ fontSize: 15, lineHeight: 1.45, color: "var(--text-secondary)", marginTop: 8 }}>
          O Fisco te avisa no WhatsApp, antes de vencer.
        </p>
        <p style={{ fontSize: 13.5, lineHeight: 1.45, color: "var(--text-tertiary)", marginTop: 4 }}>
          {TEXTO_VENCIMENTO_DAS} Próximo: {formatarDiaMes(proximo)}.
        </p>

        <div className="grid grid-cols-2" style={{ gap: 8, marginTop: 16, opacity: semLembrete ? 0.45 : 1 }}>
          {DIAS.map((d) => (
            <Escolha key={d.valor} rotulo={d.rotulo} marcada={dias.includes(d.valor)} onClick={() => alternarDia(d.valor)} />
          ))}
        </div>

        <label className="flex items-center justify-between" style={{ marginTop: 18, gap: 12, opacity: semLembrete ? 0.45 : 1 }}>
          <span className="font-medium" style={{ fontSize: 16.5 }}>Horário</span>
          <input
            type="time"
            value={hora}
            disabled={semLembrete}
            onChange={(e) => e.target.value && salvar({ hora: e.target.value })}
            className="rounded-xl bg-transparent"
            style={{ fontSize: 16, padding: "8px 12px", border: "1px solid var(--border)", color: "var(--text)", colorScheme: "inherit" }}
          />
        </label>

        <button
          type="button"
          onClick={() => salvar({ dias: semLembrete ? [7, 2, 0] : [] })}
          aria-pressed={semLembrete}
          className="toque w-full rounded-2xl flex items-center justify-center font-medium"
          style={{
            marginTop: 22,
            gap: 8,
            padding: "13px 0",
            fontSize: 15,
            background: "none",
            border: `1px solid ${semLembrete ? "var(--text-secondary)" : "var(--border)"}`,
            color: semLembrete ? "var(--text)" : "var(--text-secondary)",
          }}
        >
          <BellOff size={17} strokeWidth={2} />
          {semLembrete ? "Quero lembretes de novo" : "Não quero lembretes"}
        </button>

        <p className="text-center" style={{ fontSize: 13, color: "var(--text-tertiary)", marginTop: 12, minHeight: 18 }}>
          {guardado ? "Guardado" : ""}
        </p>
      </div>
    </div>
  );
}

/* Opcao marcada: so mais acesa (borda e texto mais claros) + um ✓, sem verde */
function Escolha({ rotulo, marcada, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={marcada}
      className="toque rounded-2xl flex items-center justify-between font-medium"
      style={{
        minHeight: 50,
        padding: "0 12px 0 14px",
        fontSize: 15,
        background: "none",
        border: `1px solid ${marcada ? "var(--text-secondary)" : "var(--border)"}`,
        color: marcada ? "var(--text)" : "var(--text-tertiary)",
      }}
    >
      {rotulo}
      {marcada && <Check size={16} strokeWidth={2.4} />}
    </button>
  );
}
