import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bell, BarChart3 } from "lucide-react";
import ModalFaturamentoInicial from "../components/ModalFaturamentoInicial.jsx";

// TODO: gerar alertas dinamicamente conforme eventos reais
// (faixa do velocímetro, proximidade do DAS dia 20, projeção anual, DASN em maio).
const ALERTAS_MOCK = [];

export default function Alertas() {
  const navigate = useNavigate();
  const alertas = [...ALERTAS_MOCK].sort((a, b) => b.ordem - a.ordem);
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
              style={{ backgroundColor: "var(--field)" }}
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
            className="rounded-2xl py-16 px-6 flex flex-col items-center gap-3 text-center"
            style={cardStyle}
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "var(--field)" }}
            >
              <Bell size={30} style={{ color: "var(--text-secondary)" }} />
            </div>
            <p className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
              Nenhuma notificação por enquanto
            </p>
            <p className="text-xs max-w-xs" style={{ color: "var(--text-secondary)" }}>
              Seus alertas aparecerão aqui conforme você usar o app.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {alertas.map((a) => (
              <li key={a.id} className="rounded-2xl overflow-hidden" style={cardStyle}>
                <div className="p-4 flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: "var(--field)" }}
                  >
                    <a.Icon size={18} style={{ color: "var(--primary)" }} />
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
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ModalFaturamentoInicial
        aberto={modalFaturamento}
        onClose={() => setModalFaturamento(false)}
        onSalvar={() => {
          // TODO: persistir faturamento inicial no Supabase
          setModalFaturamento(false);
        }}
      />
    </div>
  );
}
