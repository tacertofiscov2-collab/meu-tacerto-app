import { useNavigate } from "react-router-dom";
import {
  Bell, User, TrendingUp, Plus, Home, Receipt, LayoutGrid,
} from "lucide-react";

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
  data: "12/07/2026",
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

/**
 * Velocímetro semicircular (arco 180°, abrindo para cima).
 * Especificação matemática:
 * - viewBox="0 0 200 120", centro (100,100), raio 80, stroke-width 18
 * - Verde 0-60%, Laranja 60-80%, Vermelho 80-100%
 * - Ponteiro recalculado automaticamente pelo percentual.
 */
function Velocimetro({ percentual }) {
  const p = Math.max(0, Math.min(100, percentual));

  // Pontos fixos dos segmentos coloridos (arco contínuo)
  const P0 = { x: 20, y: 100 };
  const P60 = { x: 124.7, y: 23.9 };
  const P80 = { x: 164.7, y: 52.98 };
  const P100 = { x: 180, y: 100 };

  // Ponteiro: raio 62, recalculado pelo percentual atual
  const angleDeg = 180 - (p / 100) * 180;
  const rad = (angleDeg * Math.PI) / 180;
  const needleR = 62;
  const nx = 100 + needleR * Math.cos(rad);
  const ny = 100 - needleR * Math.sin(rad);

  const faixa = faixaDoPercentual(percentual);

  return (
    <div className="flex flex-col items-center">
      <svg
        viewBox="0 0 200 120"
        className="w-full max-w-[260px]"
        role="img"
        aria-label={`Velocímetro fiscal: ${Math.round(p)} por cento`}
      >
        {/* trilha de fundo */}
        <path
          d={`M ${P0.x} ${P0.y} A 80 80 0 0 1 ${P100.x} ${P100.y}`}
          fill="none"
          stroke="var(--field)"
          strokeWidth={18}
          strokeLinecap="round"
        />
        {/* verde 0-60 */}
        <path
          d={`M ${P0.x} ${P0.y} A 80 80 0 0 1 ${P60.x} ${P60.y}`}
          fill="none"
          stroke={COR_VERDE}
          strokeWidth={18}
          strokeLinecap="round"
        />
        {/* laranja 60-80 */}
        <path
          d={`M ${P60.x} ${P60.y} A 80 80 0 0 1 ${P80.x} ${P80.y}`}
          fill="none"
          stroke={COR_LARANJA}
          strokeWidth={18}
          strokeLinecap="round"
        />
        {/* vermelho 80-100 */}
        <path
          d={`M ${P80.x} ${P80.y} A 80 80 0 0 1 ${P100.x} ${P100.y}`}
          fill="none"
          stroke={COR_VERMELHO}
          strokeWidth={18}
          strokeLinecap="round"
        />

        {/* ponteiro */}
        <line
          x1={100}
          y1={100}
          x2={nx}
          y2={ny}
          stroke="var(--text)"
          strokeWidth={3}
          strokeLinecap="round"
        />
        {/* pivô: círculo branco com centro escuro */}
        <circle cx={100} cy={100} r={7} fill="var(--text)" />
        <circle cx={100} cy={100} r={3.5} fill="var(--bg)" />
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

  const limite = LIMITES[USUARIO.perfil] ?? LIMITES.MEI;
  const faturado = USUARIO.faturado;
  const faltam = Math.max(0, limite - faturado);
  const percentual = (faturado / limite) * 100;

  const inicial = (USUARIO.nome || "?").trim().charAt(0).toUpperCase();

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
      {/* Conteúdo com padding inferior para não ficar sob a navbar/FAB */}
      <div className="flex-1 pb-28">
        {/* 1. Header */}
        <header className="px-5 pt-6 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "var(--field)" }}
              aria-hidden
            >
              {inicial ? (
                <span
                  className="text-base font-bold"
                  style={{ color: "var(--primary)" }}
                >
                  {inicial}
                </span>
              ) : (
                <User size={20} style={{ color: "var(--primary)" }} />
              )}
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Olá,
              </span>
              <span className="font-bold" style={{ color: "var(--text)" }}>
                {USUARIO.nome}
              </span>
            </div>
          </div>

          <button
            onClick={() => navigate("/alertas")}
            aria-label="Notificações"
            className="relative w-11 h-11 rounded-full flex items-center justify-center hover:opacity-80"
            style={{ backgroundColor: "var(--field)" }}
          >
            <Bell size={20} style={{ color: "var(--text)" }} />
            <span
              className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full"
              style={{ backgroundColor: "var(--danger)" }}
              aria-hidden
            />
          </button>
        </header>

        <div className="px-5 space-y-4">
          {/* 2. Card Velocímetro */}
          <button
            onClick={() => navigate("/velocimetro")}
            className={cardBase + " text-left px-5 pt-5 pb-6"}
            style={cardStyle}
          >
            <p
              className="text-sm text-center mb-2"
              style={{ color: "var(--text-secondary)" }}
            >
              Velocímetro Fiscal
            </p>
            <Velocimetro percentual={percentual} />
            <p
              className="text-sm text-center mt-4"
              style={{ color: "var(--text-secondary)" }}
            >
              Você já usou {Math.round(percentual)}% do seu limite anual.
            </p>
          </button>

          {/* 3. Card Resumo */}
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

          {/* 4. Card Último lançamento */}
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
        </div>
      </div>

      {/* 5. FAB */}
      <button
        onClick={() => navigate("/lancar")}
        aria-label="Adicionar lançamento"
        className="fixed right-5 bottom-24 w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:opacity-90 active:scale-95 transition"
        style={{
          backgroundColor: "var(--primary)",
          color: "var(--primary-contrast)",
          boxShadow: "0 8px 24px rgba(34,197,94,0.35)",
        }}
      >
        <Plus size={26} strokeWidth={2.5} />
      </button>

      {/* 6. NavBar inferior */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-10"
        style={{
          backgroundColor: "var(--surface)",
          borderTop: "1px solid var(--border)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <div className="max-w-xl mx-auto grid grid-cols-4">
          {[
            { Icon: Home, label: "Início", route: "/dashboard", ativo: true },
            { Icon: Receipt, label: "Histórico", route: "/historico" },
            { Icon: LayoutGrid, label: "Menu", route: "/menu" },
            { Icon: User, label: "Perfil", route: "/perfil" },
          ].map(({ Icon, label, route, ativo }) => (
            <button
              key={label}
              onClick={() => navigate(route)}
              className="flex flex-col items-center justify-center gap-1 py-3 hover:opacity-90"
              style={{
                color: ativo ? "var(--primary)" : "var(--text-secondary)",
              }}
            >
              <Icon size={22} strokeWidth={ativo ? 2.5 : 2} />
              <span className="text-[11px] font-medium">{label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
