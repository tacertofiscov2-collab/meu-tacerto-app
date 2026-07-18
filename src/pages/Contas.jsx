import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Trash2, Plus } from "lucide-react";

import BottomNav from "../components/BottomNav.jsx";
// TODO: integrar com backend/Supabase para contas reais do dispositivo
const CONTAS_MOCK = [
  {
    id: "1",
    nome: "Fernando",
    email: "fernando@email.com",
    perfil: "MEI",
    atual: true,
  },
  {
    id: "2",
    nome: "Maria",
    email: "maria@email.com",
    perfil: "MEI",
    atual: false,
  },
  {
    id: "3",
    nome: "João",
    email: "joao.transportes@email.com",
    perfil: "MEI Caminhoneiro",
    atual: false,
  },
];

const MAX_CONTAS = 5;

export default function Contas() {
  const navigate = useNavigate();
  const [contas, setContas] = useState(CONTAS_MOCK);
  const [confirmarTroca, setConfirmarTroca] = useState(null);
  const [confirmarRemover, setConfirmarRemover] = useState(null);

  const limiteAtingido = contas.length >= MAX_CONTAS;

  const cardStyle = {
    backgroundColor: "var(--surface)",
    border: "1px solid var(--border)",
  };

  function trocarConta(conta) {
    // TODO: realizar troca real de sessão via Supabase
    setContas((prev) =>
      prev.map((c) => ({ ...c, atual: c.id === conta.id }))
    );
    setConfirmarTroca(null);
  }

  function removerConta(conta) {
    // TODO: remover credenciais locais da conta via Supabase
    setContas((prev) => prev.filter((c) => c.id !== conta.id));
    setConfirmarRemover(null);
  }

  return (
    <div
      className="min-h-screen min-h-[100dvh] w-full flex flex-col"
      style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
    >
      <div className="flex-1 overflow-y-auto pb-[110px]">
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
            Trocar de conta
          </h1>
        </header>

        <div className="px-5 space-y-5">
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Gerencie as contas neste aparelho (máximo 5).
          </p>

          {/* Lista de contas */}
          <div className="space-y-3">
            {contas.map((conta) => {
              const inicial = (conta.nome || "?").trim().charAt(0).toUpperCase();
              const isAtual = conta.atual;

              return (
                <div
                  key={conta.id}
                  className="rounded-xl p-4 flex items-center gap-3"
                  style={{
                    ...cardStyle,
                    borderColor: isAtual ? "var(--primary)" : "var(--border)",
                  }}
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: "var(--field)" }}
                  >
                    <span
                      className="text-lg font-bold"
                      style={{ color: "var(--primary)" }}
                    >
                      {inicial}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p
                      className="font-bold truncate"
                      style={{ color: "var(--text)" }}
                    >
                      {conta.nome}
                    </p>
                    <p
                      className="text-xs truncate"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {conta.email}
                    </p>
                    <span
                      className="inline-block mt-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: "rgba(34,197,94,0.12)",
                        color: "var(--primary)",
                      }}
                    >
                      {conta.perfil}
                    </span>
                  </div>

                  {isAtual ? (
                    <CheckCircle2
                      size={22}
                      style={{ color: "var(--primary)" }}
                    />
                  ) : (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setConfirmarTroca(conta)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                        style={{
                          backgroundColor: "var(--field)",
                          color: "var(--text)",
                        }}
                      >
                        Trocar
                      </button>
                      <button
                        onClick={() => setConfirmarRemover(conta)}
                        aria-label="Remover conta"
                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-80"
                        style={{ backgroundColor: "var(--field)" }}
                      >
                        <Trash2
                          size={16}
                          style={{ color: "var(--text-secondary)" }}
                        />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Limite atingido ou adicionar conta */}
          {limiteAtingido ? (
            <div
              className="rounded-xl p-4 text-sm text-center"
              style={{
                backgroundColor: "rgba(245,158,11,0.12)",
                color: "#f59e0b",
                border: "1px solid rgba(245,158,11,0.25)",
              }}
            >
              Limite de 5 contas atingido. Remova uma conta para adicionar
              outra.
            </div>
          ) : (
            <button
              onClick={() => navigate("/login")}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm"
              style={{
                backgroundColor: "var(--field)",
                color: "var(--text)",
                border: "1px solid var(--border)",
              }}
            >
              <Plus size={18} style={{ color: "var(--primary)" }} />
              Adicionar outra conta
            </button>
          )}
        </div>
      </div>

      {/* Modal: confirmar troca */}
      {confirmarTroca && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-5 space-y-4"
            style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <h3 className="text-base font-bold" style={{ color: "var(--text)" }}>
              Trocar de conta?
            </h3>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Você será conectado como{" "}
              <strong style={{ color: "var(--text)" }}>{confirmarTroca.nome}</strong>.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmarTroca(null)}
                className="flex-1 py-3 rounded-xl font-semibold"
                style={{ backgroundColor: "var(--field)", color: "var(--text)" }}
              >
                Cancelar
              </button>
              <button
                onClick={() => trocarConta(confirmarTroca)}
                className="flex-1 py-3 rounded-xl font-semibold"
                style={{ backgroundColor: "var(--primary)", color: "var(--primary-contrast)" }}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: confirmar remoção */}
      {confirmarRemover && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-5 space-y-4"
            style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <h3 className="text-base font-bold" style={{ color: "var(--text)" }}>
              Remover esta conta do aparelho?
            </h3>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              A conta de <strong style={{ color: "var(--text)" }}>{confirmarRemover.nome}</strong>{" "}
              será removida desta lista, mas seus dados continuam seguros.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmarRemover(null)}
                className="flex-1 py-3 rounded-xl font-semibold"
                style={{ backgroundColor: "var(--field)", color: "var(--text)" }}
              >
                Cancelar
              </button>
              <button
                onClick={() => removerConta(confirmarRemover)}
                className="flex-1 py-3 rounded-xl font-semibold"
                style={{ backgroundColor: "#ef4444", color: "#fff" }}
              >
                Remover
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
