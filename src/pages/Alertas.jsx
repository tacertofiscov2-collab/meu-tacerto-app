import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, CheckCircle2, Calendar, TrendingUp, FileText, BellOff, ChevronDown,
  BarChart3,
} from "lucide-react";
import ModalFaturamentoInicial from "../components/ModalFaturamentoInicial.jsx";

// TODO: buscar do backend
const ALERTAS_MOCK = [
  {
    id: 1,
    tipo: "faixa",
    Icon: CheckCircle2,
    cor: "#22c55e",
    titulo: "Tudo certo!",
    descricao: "Você usou 60% do limite anual.",
    data: "Hoje, 09:12",
    ordem: 4,
  },
  {
    id: 2,
    tipo: "das",
    Icon: Calendar,
    cor: "#f59e0b",
    titulo: "Seu DAS vence em 8 dias",
    descricao: "Vencimento no dia 20. Não deixe para a última hora.",
    data: "Ontem, 18:00",
    ordem: 3,
    guia: [
      "Acesse gov.br/mei e faça login.",
      "Escolha 'Pagamento de contribuição mensal (DAS)'.",
      "Emita a guia do mês corrente.",
      "Pague por PIX, internet banking ou lotérica até dia 20.",
    ],
  },
  {
    id: 3,
    tipo: "projecao",
    Icon: TrendingUp,
    cor: "#3b82f6",
    titulo: "Projeção do ano",
    descricao: "No ritmo atual, você fecha o ano dentro do limite.",
    data: "2 dias atrás",
    ordem: 2,
  },
  {
    id: 4,
    tipo: "dasn",
    Icon: FileText,
    cor: "#a855f7",
    titulo: "Lembrete: DASN 2026",
    descricao: "A Declaração Anual (DASN) vence em 31 de maio.",
    data: "Semana passada",
    ordem: 1,
  },
];

export default function Alertas() {
  const navigate = useNavigate();
  // TODO: substituir por fetch real
  const alertas = [...ALERTAS_MOCK].sort((a, b) => b.ordem - a.ordem);
  const [expandido, setExpandido] = useState(null);
  const [modalFaturamento, setModalFaturamento] = useState(false);

  const cardStyle = {
    backgroundColor: "var(--surface)",
    border: "1px solid var(--border)",
  };

  return (
    <div
      className="min-h-screen min-h-[100dvh] w-full"
      style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
    >
      <header className="px-5 pt-6 pb-4 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          aria-label="Voltar"
          className="w-10 h-10 rounded-full flex items-center justify-center hover:opacity-80"
          style={{ backgroundColor: "var(--field)" }}
        >
          <ArrowLeft size={20} style={{ color: "var(--text)" }} />
        </button>
        <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>
          Notificações
        </h1>
      </header>

      <div className="px-5 pb-10 space-y-3">
        {/* Card permanente: faturamento inicial */}
        <div
          className="rounded-2xl p-4"
          style={{ ...cardStyle, borderLeft: "4px solid var(--primary)" }}
        >
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: "rgba(34,197,94,0.15)" }}
            >
              <BarChart3 size={18} style={{ color: "var(--primary)" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                Comece com o velocímetro certo
              </p>
              <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
                Já faturou este ano antes de instalar o app? Adicione o total para
                calibrar o velocímetro.
              </p>
              <button
                onClick={() => setModalFaturamento(true)}
                className="mt-3 py-2 px-4 rounded-xl text-xs font-semibold"
                style={{
                  backgroundColor: "var(--primary)",
                  color: "var(--primary-contrast)",
                }}
              >
                Adicionar faturamento
              </button>
            </div>
          </div>
        </div>

        {alertas.length === 0 ? (
          <div
            className="rounded-2xl py-14 flex flex-col items-center gap-3"
            style={cardStyle}
          >
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "var(--field)" }}
            >
              <BellOff size={26} style={{ color: "var(--text-secondary)" }} />
            </div>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Nenhuma notificação
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {alertas.map((a) => {
              const aberto = expandido === a.id;
              return (
                <li key={a.id} className="rounded-2xl overflow-hidden" style={cardStyle}>
                  <div className="p-4 flex items-start gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${a.cor}22` }}
                    >
                      <a.Icon size={18} style={{ color: a.cor }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                        {a.titulo}
                      </p>
                      <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
                        {a.descricao}
                      </p>
                      <p className="text-xs mt-1.5" style={{ color: "var(--text-secondary)" }}>
                        {a.data}
                      </p>

                      {a.guia && (
                        <button
                          onClick={() => setExpandido(aberto ? null : a.id)}
                          aria-expanded={aberto}
                          className="mt-3 flex items-center gap-1 text-xs font-semibold"
                          style={{ color: "var(--primary)" }}
                        >
                          Como pagar
                          <ChevronDown
                            size={14}
                            style={{
                              transform: aberto ? "rotate(180deg)" : "none",
                              transition: "transform 0.2s",
                            }}
                          />
                        </button>
                      )}
                    </div>
                  </div>

                  {a.guia && aberto && (
                    <div
                      className="px-4 pb-4 pt-1"
                      style={{ borderTop: "1px solid var(--border)" }}
                    >
                      <ol className="space-y-2 pt-3">
                        {a.guia.map((p, i) => (
                          <li key={i} className="flex gap-3">
                            <span
                              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                              style={{
                                backgroundColor: "var(--field)",
                                color: "var(--primary)",
                              }}
                            >
                              {i + 1}
                            </span>
                            <span
                              className="text-sm leading-relaxed"
                              style={{ color: "var(--text-secondary)" }}
                            >
                              {p}
                            </span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
