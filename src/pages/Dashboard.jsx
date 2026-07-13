import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell, TrendingUp, Plus, Home, Receipt, LayoutGrid, User,
  AlertTriangle, X, BarChart3, ChevronRight, Gauge,
} from "lucide-react";
import ModalFaturamentoInicial from "../components/ModalFaturamentoInicial.jsx";

// TODO: buscar dados reais do Supabase/localStorage
const USUARIO = {
  nome: "Fernando",
  perfil: "MEI", // "MEI" | "MEI_CAMINHONEIRO"
  faturado: 48600,
};
const LIMITES = { MEI: 81000, MEI_CAMINHONEIRO: 251600 };

// TODO: buscar do backend
const ULTIMO_LANCAMENTO = {
  descricao: "1º Frete de Julho",
  data: "10 de Julho",
  valor: 3500,
};

const fmtBRL = (v) =>
  "R$ " + v.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const COR_VERDE = "#22c55e";
const COR_LARANJA = "#f59e0b";
const COR_VERMELHO = "#ef4444";

function faixaDoPercentual(p) {
  if (p < 60) return { cor: COR_VERDE, label: "Tudo certo" };
  if (p < 80) return { cor: COR_LARANJA, label: "Atenção" };
  if (p <= 100) return { cor: COR_VERMELHO, label: "Cuidado" };
  return { cor: "#991b1b", label: "Limite ultrapassado" };
}

function saudacaoPorHora() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "Bom dia,";
  if (h >= 12 && h < 18) return "Boa tarde,";
  return "Boa noite,";
}

function dataPorExtenso() {
  const raw = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

/**
 * Velocímetro: arco de fundo cinza + arco preenchido com degradê
 * verde → amarelo → vermelho, e ponteiro em forma de seta grossa.
 */
function Velocimetro({ percentual }) {
  const p = Math.max(0, Math.min(100, percentual));

  const cx = 100;
  const cy = 100;
  const r = 80;

  const arcLength = Math.PI * r;
  const filledLength = (p / 100) * arcLength;

  const arcPath = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;

  const angleDeg = 180 - (p / 100) * 180;
  const rad = (angleDeg * Math.PI) / 180;
  const needleR = 60;

  const tipX = cx + needleR * Math.cos(rad);
  const tipY = cy - needleR * Math.sin(rad);

  const baseHalfWidth = 7;
  const perpX = Math.sin(rad);
  const perpY = Math.cos(rad);
  const b1x = cx + baseHalfWidth * perpX;
  const b1y = cy + baseHalfWidth * perpY;
  const b2x = cx - baseHalfWidth * perpX;
  const b2y = cy - baseHalfWidth * perpY;

  const midR = needleR * 0.45;
  const midHalfWidth = 3;
  const mx = cx + midR * Math.cos(rad);
  const my = cy - midR * Math.sin(rad);
  const m1x = mx + midHalfWidth * perpX;
  const m1y = my + midHalfWidth * perpY;
  const m2x = mx - midHalfWidth * perpX;
  const m2y = my - midHalfWidth * perpY;

  const needlePoints = `${b1x},${b1y} ${m1x},${m1y} ${tipX},${tipY} ${m2x},${m2y} ${b2x},${b2y}`;

  const faixa = faixaDoPercentual(percentual);

  return (
    <div className="flex flex-col items-center">
      <svg
        viewBox="0 0 200 120"
        className="w-full max-w-[200px]"
        role="img"
        aria-label={`Velocímetro fiscal: ${Math.round(p)} por cento`}
      >
        <defs>
          <linearGradient id="velocimetroGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={COR_VERDE} />
            <stop offset="60%" stopColor={COR_LARANJA} />
            <stop offset="100%" stopColor={COR_VERMELHO} />
          </linearGradient>
        </defs>

        <path
          d={arcPath}
          fill="none"
          stroke="var(--field)"
          strokeWidth={18}
          strokeLinecap="round"
        />

        <path
          d={arcPath}
          fill="none"
          stroke="url(#velocimetroGrad)"
          strokeWidth={18}
          strokeLinecap="round"
          strokeDasharray={`${filledLength} ${arcLength}`}
        />

        <polygon points={needlePoints} fill="var(--text)" />
        <circle cx={cx} cy={cy} r={8} fill="var(--text)" />
        <circle cx={cx} cy={cy} r={3.5} fill="var(--bg)" />
      </svg>

      <div className="mt-1 flex flex-col items-center">
        <span className="text-4xl font-bold" style={{ color: "var(--text)" }}>
          {Math.round(percentual)}%
        </span>
        <span className="text-sm font-semibold mt-0.5" style={{ color: faixa.cor }}>
          {faixa.label}
        </span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();

  // TODO: detectar visitante real (sem conta criada)
  const isVisitante = true;
  // TODO: detectar se já lançou faturamento inicial do ano
  const jaLancouFaturamento = false;

  const [banner, setBanner] = useState(true);
  const [mostrarOnboarding, setMostrarOnboarding] = useState(true);
  const [modalFaturamento, setModalFaturamento] = useState(false);
  const [faturamentoExtra, setFaturamentoExtra] = useState(0);

  const limite = LIMITES[USUARIO.perfil] ?? LIMITES.MEI;
  const faturado = USUARIO.faturado + faturamentoExtra;
  const faltam = Math.max(0, limite - faturado);
  const percentual = (faturado / limite) * 100;

  const inicial = (USUARIO.nome || "?").trim().charAt(0).toUpperCase();
  const saudacao = saudacaoPorHora();
  const dataHoje = dataPorExtenso();

  const cardBase =
    "w-full rounded-2xl transition-transform active:scale-[0.99]";
  const cardStyle = {
    backgroundColor: "var(--surface)",
    border: "1px solid var(--border)",
  };

  return (
    <div
      className="min-h-screen min-h-[100dvh] w-full flex flex-col"
      style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
    >
      {/* Conteúdo com padding inferior para não ficar sob a navbar */}
      <div
        className="flex-1 overflow-y-auto"
        style={{ paddingBottom: "calc(160px + env(safe-area-inset-bottom))" }}
      >
        {/* 1. Header */}
        <header className="px-5 pt-6 pb-3 flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2.5">
              <Gauge size={34} style={{ color: "var(--primary)" }} strokeWidth={2.2} />
              <span className="font-bold text-2xl leading-none" style={{ color: "var(--text)" }}>
                Ta<span style={{ color: "var(--primary)" }}>Certo!</span>
              </span>
            </div>
            <div className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
              {saudacao}{" "}
              <span className="text-base font-semibold" style={{ color: "var(--text)" }}>
                {USUARIO.nome}
              </span>
            </div>
          </div>

          <button
            onClick={() => navigate("/alertas")}
            aria-label="Notificações"
            className="relative w-11 h-11 rounded-full flex items-center justify-center hover:opacity-80 shrink-0"
            style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <Bell size={20} style={{ color: "var(--text)" }} />
            <span
              className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full"
              style={{ backgroundColor: "var(--danger)" }}
              aria-hidden
            />
          </button>
        </header>


        <div className="px-5 space-y-3">
          {/* Banner de visitante */}
          {isVisitante && banner && (
            <div
              className="rounded-xl p-2 flex items-start gap-2"
              style={{
                backgroundColor: "rgba(245,158,11,0.12)",
                border: "1px solid rgba(245,158,11,0.35)",
              }}
            >
              <AlertTriangle
                size={16}
                className="mt-0.5 shrink-0"
                style={{ color: "#f59e0b" }}
              />
              <p className="flex-1 text-sm leading-snug" style={{ color: "var(--text)" }}>
                Você ainda não tem conta.{" "}
                <button
                  onClick={() => navigate("/cadastro")}
                  className="font-semibold underline-offset-2 hover:underline"
                  style={{ color: "var(--primary)" }}
                >
                  Criar conta
                </button>{" "}
                para manter seus lançamentos salvos.
              </p>
              <button
                onClick={() => setBanner(false)}
                aria-label="Fechar aviso"
                className="w-6 h-6 rounded-full flex items-center justify-center hover:opacity-80 shrink-0"
                style={{ backgroundColor: "rgba(0,0,0,0.15)" }}
              >
                <X size={12} style={{ color: "var(--text)" }} />
              </button>
            </div>
          )}

          {/* Card Velocímetro */}
          <div className={cardBase + " px-5 pt-2 pb-4"} style={cardStyle}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Velocímetro Fiscal
              </p>
              <button
                onClick={() => navigate("/velocimetro")}
                className="text-sm font-semibold flex items-center gap-0.5 hover:opacity-80"
                style={{ color: "var(--primary)" }}
              >
                Ver detalhes
                <ChevronRight size={14} />
              </button>
            </div>
            <Velocimetro percentual={percentual} />
            <p
              className="text-sm text-center mt-4"
              style={{ color: "var(--text-secondary)" }}
            >
              Você já usou {Math.round(percentual)}% do seu limite anual.
            </p>
          </div>

          {/* Card Faturado / Limite / Faltam */}
          <div className={cardBase + " p-4"} style={cardStyle}>
            <div className="grid grid-cols-3">
              {[
                { valor: fmtBRL(faturado), label: "Faturado" },
                { valor: fmtBRL(limite), label: "Limite" },
                { valor: fmtBRL(faltam), label: "Faltam" },
              ].map((c, i) => (
                <div
                  key={c.label}
                  className={
                    "flex flex-col items-center text-center px-2 " +
                    (i > 0 ? "border-l" : "")
                  }
                  style={i > 0 ? { borderColor: "var(--border)" } : undefined}
                >
                  <span className="font-bold text-sm" style={{ color: "var(--text)" }}>
                    {c.valor}
                  </span>
                  <span
                    className="text-xs mt-1"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {c.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Card onboarding do faturamento OU Último lançamento */}
          {!jaLancouFaturamento && mostrarOnboarding ? (
            <div
              className={cardBase + " p-4"}
              style={{ ...cardStyle, borderLeft: "4px solid var(--primary)" }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: "var(--field)" }}
                >
                  <BarChart3 size={18} style={{ color: "var(--primary)" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold" style={{ color: "var(--text)" }}>
                    Comece com o velocímetro certo
                  </p>
                  <p className="text-sm mt-1 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    Já faturou este ano antes de instalar o app? Adicione o total em
                    1 minuto para o velocímetro refletir sua realidade desde agora.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4">
                <button
                  // TODO: abrir modal de faturamento inicial
                  onClick={() => setModalFaturamento(true)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                  style={{
                    backgroundColor: "var(--primary)",
                    color: "var(--primary-contrast)",
                  }}
                >
                  Adicionar faturamento
                </button>
                <button
                  onClick={() => setMostrarOnboarding(false)}
                  className="px-3 py-2.5 text-sm font-medium"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Agora não
                </button>
              </div>
            </div>
          ) : jaLancouFaturamento ? (
            <button
              onClick={() => navigate("/historico")}
              className={cardBase + " p-4 text-left"}
              style={cardStyle}
            >
              <p className="text-xs mb-2" style={{ color: "var(--text-secondary)" }}>
                Último lançamento
              </p>
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: "var(--field)" }}
                >
                  <TrendingUp size={18} style={{ color: "var(--primary)" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "var(--text)" }}>
                    {ULTIMO_LANCAMENTO.descricao}
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    {ULTIMO_LANCAMENTO.data}
                  </p>
                </div>
                <span
                  className="font-bold text-sm shrink-0"
                  style={{ color: "var(--primary)" }}
                >
                  + {fmtBRL(ULTIMO_LANCAMENTO.valor)}
                </span>
              </div>
            </button>
          ) : null}

        </div>
      </div>

      {/* Navegação flutuante — bolhas soltas, sem barra */}
      <nav
        aria-label="Navegação principal"
        className="fixed left-0 right-0 z-30 pointer-events-none"
        style={{ bottom: "calc(12px + env(safe-area-inset-bottom))" }}
      >
        <div className="relative max-w-xl mx-auto px-5">
          {/* Botão + central flutuante, elevado acima das bolhas */}
          <button
            onClick={() => navigate("/lancar")}
            aria-label="Adicionar lançamento"
            className="pointer-events-auto absolute left-1/2 -translate-x-1/2 bottom-[12px] w-[64px] h-[64px] rounded-full flex items-center justify-center active:scale-95 transition"
            style={{
              backgroundColor: "var(--primary)",
              color: "var(--primary-contrast, #0f0f11)",
              boxShadow: "0 10px 28px rgba(34,197,94,0.5), 0 0 0 1px rgba(34,197,94,0.35)",
            }}
          >
            <Plus size={30} strokeWidth={2.6} />
          </button>

          <div className="flex items-end justify-between h-full">
            <div className="flex items-end gap-5">
              <NavBubble
                active={true}
                label="Início"
                icon={Home}
                onClick={() => navigate("/dashboard")}
              />
              <NavBubble
                label="Histórico"
                icon={Receipt}
                onClick={() => navigate("/historico")}
              />
            </div>
            <div className="flex items-end gap-5">
              <NavBubble
                label="Menu"
                icon={LayoutGrid}
                onClick={() => navigate("/menu")}
              />
              <NavBubble
                label="Perfil"
                icon={User}
                onClick={() => navigate("/perfil")}
              />
            </div>
          </div>
        </div>
      </nav>

      <ModalFaturamentoInicial
        aberto={modalFaturamento}
        onClose={() => setModalFaturamento(false)}
        onSalvar={(valor) => {
          // TODO: persistir faturamento inicial no Supabase
          setFaturamentoExtra((f) => f + valor);
          setMostrarOnboarding(false);
        }}
      />
    </div>
  );
}

function NavBubble({ icon: Icon, label, active = false, onClick }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="pointer-events-auto flex flex-col items-center justify-end gap-1 active:scale-95 transition"
    >
      <span
        className="w-12 h-12 rounded-full flex items-center justify-center"
        style={{
          backgroundColor: "rgba(24,24,27,0.6)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: "1px solid rgba(63,63,70,0.55)",
          boxShadow: "0 6px 18px rgba(0,0,0,0.35)",
        }}
      >
        <Icon
          size={22}
          strokeWidth={active ? 2.5 : 2}
          style={{ color: active ? "var(--primary)" : "var(--text-secondary)" }}
        />
      </span>
      <span
        className="text-[10px] font-medium leading-none"
        style={{ color: active ? "var(--primary)" : "var(--text-secondary)" }}
      >
        {label}
      </span>
    </button>
  );
}
