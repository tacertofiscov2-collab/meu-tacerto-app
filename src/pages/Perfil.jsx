import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import BottomNav from "../components/BottomNav.jsx";
import {
  ArrowLeft, Settings, Info, Shield, Users, Lock, LogOut, ChevronRight,
  ChevronDown, BarChart3, FileText, UserPlus, Eraser, Trash2, Plus, X,
} from "lucide-react";

import { useUserState } from "@/lib/userState";
import { LABEL_TIPO } from "@/lib/fiscal";
import { useAppState } from "@/context/AppStateContext";

// TODO: buscar email do backend
const EMAIL_MOCK = "fernando@email.com";

function Brand({ className = "" }) {
  return (
    <span className={className}>
      <span style={{ color: "var(--text)" }}>Ta</span>
      <span style={{ color: "var(--primary)" }}>Certo!</span>
    </span>
  );
}

function ListaItem({ Icon, label, onClick, cor, iconCor }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 py-3 hover:opacity-90"
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: "var(--field)" }}
      >
        <Icon size={18} style={{ color: iconCor || cor || "var(--primary)" }} />
      </div>
      <span
        className="flex-1 text-left text-sm font-medium"
        style={{ color: cor || "var(--text)" }}
      >
        {label}
      </span>
      <ChevronRight size={18} style={{ color: "var(--text-secondary)" }} />
    </button>
  );
}

function lerContas() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("tacerto_contas");
    const arr = raw ? JSON.parse(raw) : null;
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export default function Perfil() {
  const navigate = useNavigate();
  const { nome, tipo } = useUserState();
  const { removerTodosLancamentos } = useAppState();
  const [confirmarSair, setConfirmarSair] = useState(false);
  const [confirmarLimpar, setConfirmarLimpar] = useState(false);
  const [seletorAberto, setSeletorAberto] = useState(false);
  const [contas, setContas] = useState(lerContas);
  const [contaAtiva, setContaAtiva] = useState(() => {
    if (typeof window === "undefined") return 0;
    return Number(localStorage.getItem("tacerto_conta_ativa") || 0);
  });

  useEffect(() => {
    const handler = () => setContas(lerContas());
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  // Deduzir se o usuário está logado (nome persistido) — para diferenciar "visitante".
  const nomePersistido = typeof window !== "undefined" && !!localStorage.getItem("tacerto_nome");
  const totalContas = contas.length > 0 ? contas.length : (nomePersistido ? 1 : 0);
  const ehVisitante = totalContas === 0;
  const temMultiplas = totalContas >= 2;

  const inicial = (nome || "?").trim().charAt(0).toUpperCase();

  const cardStyle = {
    backgroundColor: "var(--surface)",
    border: "1px solid var(--border)",
  };

  function sair() {
    setConfirmarSair(false);
    navigate("/");
  }

  function limparLancamentos() {
    removerTodosLancamentos();
    setConfirmarLimpar(false);
    toast.success("Todos os lançamentos foram excluídos.");
  }

  function trocarConta(idx) {
    setContaAtiva(idx);
    try {
      localStorage.setItem("tacerto_conta_ativa", String(idx));
    } catch {}
    setSeletorAberto(false);
  }

  // Item dinâmico "trocar/adicionar/cadastrar"
  let contaItem;
  if (ehVisitante) {
    contaItem = { Icon: UserPlus, label: "Cadastrar", onClick: () => navigate("/cadastro") };
  } else if (totalContas === 1) {
    contaItem = { Icon: UserPlus, label: "Adicionar nova conta", onClick: () => navigate("/cadastro") };
  } else {
    contaItem = { Icon: Users, label: "Trocar de conta", onClick: () => navigate("/contas") };
  }

  return (
    <div
      className="min-h-screen min-h-[100dvh] w-full flex flex-col"
      style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
    >
      <div className="flex-1 overflow-y-auto pb-[130px]">
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
            Perfil
          </h1>
        </header>

        <div className="px-5 space-y-4">
          {/* Card usuário — clicável para editar OU abrir seletor se houver múltiplas contas */}
          <button
            onClick={() =>
              temMultiplas ? setSeletorAberto(true) : navigate("/editar-perfil")
            }
            className="w-full rounded-2xl p-5 flex items-center gap-4 text-left transition-transform active:scale-[0.99]"
            style={cardStyle}
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: "var(--field)" }}
            >
              <span className="text-2xl font-bold" style={{ color: "var(--primary)" }}>
                {inicial}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <p className="font-bold truncate" style={{ color: "var(--text)" }}>
                  {nome}
                </p>
                {temMultiplas && (
                  <ChevronDown size={16} style={{ color: "var(--text-secondary)" }} />
                )}
              </div>
              <p className="text-xs truncate mt-0.5" style={{ color: "var(--text-secondary)" }}>
                {EMAIL_MOCK}
              </p>
              <span
                className="inline-block mt-2 text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{
                  backgroundColor: "rgba(34,197,94,0.12)",
                  color: "var(--primary)",
                }}
              >
                {LABEL_TIPO[tipo]}
              </span>
            </div>
            {!temMultiplas && (
              <ChevronRight size={18} style={{ color: "var(--text-secondary)" }} />
            )}
          </button>

          {/* Resumo & Informações fiscais como itens clicáveis */}
          <div className="rounded-2xl px-5 py-2" style={cardStyle}>
            <ListaItem
              Icon={BarChart3}
              label="Resumo de 2026"
              onClick={() => navigate("/perfil/resumo")}
            />
            <ListaItem
              Icon={FileText}
              label="Informações fiscais"
              onClick={() => navigate("/perfil/informacoes-fiscais")}
            />
          </div>


          {/* Geral */}
          <div className="rounded-2xl px-5 py-2" style={cardStyle}>
            <p className="text-xs pt-3 pb-1" style={{ color: "var(--text-secondary)" }}>
              Geral
            </p>
            <ListaItem Icon={Settings} label="Preferências" onClick={() => navigate("/preferencias")} />
            <ListaItem Icon={Info} label="Sobre o TaCerto!" onClick={() => navigate("/sobre")} />
            <ListaItem Icon={Shield} label="Termos e Privacidade" onClick={() => navigate("/termos")} />
          </div>

          {/* Conta e segurança */}
          <div className="rounded-2xl px-5 py-2" style={cardStyle}>
            <p className="text-xs pt-3 pb-1" style={{ color: "var(--text-secondary)" }}>
              Conta e segurança
            </p>
            <ListaItem Icon={contaItem.Icon} label={contaItem.label} onClick={contaItem.onClick} />
            <ListaItem Icon={Lock} label="Alterar senha" onClick={() => navigate("/alterar-senha")} />
            <ListaItem
              Icon={LogOut}
              label="Sair da conta"
              cor="#ef4444"
              onClick={() => setConfirmarSair(true)}
            />
            <ListaItem
              Icon={Eraser}
              label="Excluir todos os lançamentos"
              iconCor="#f97316"
              onClick={() => setConfirmarLimpar(true)}
            />
            <ListaItem
              Icon={Trash2}
              label="Excluir conta"
              cor="#ef4444"
              onClick={() => navigate("/excluir-conta")}
            />
          </div>

          <p className="text-center text-xs pt-2" style={{ color: "var(--text-secondary)" }}>
            <Brand /> v0.1
          </p>
        </div>
      </div>

      {/* Seletor de contas (padrão Instagram) */}
      {seletorAberto && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
          onClick={() => setSeletorAberto(false)}
        >
          <div
            className="w-full max-w-md rounded-t-2xl sm:rounded-2xl p-4 space-y-2"
            style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-1 pb-2">
              <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                Trocar de conta
              </p>
              <button
                onClick={() => setSeletorAberto(false)}
                aria-label="Fechar"
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "var(--field)" }}
              >
                <X size={16} style={{ color: "var(--text)" }} />
              </button>
            </div>
            <div className="space-y-1">
              {contas.map((c, idx) => {
                const ini = (c.nome || "?").trim().charAt(0).toUpperCase();
                const ativa = idx === contaAtiva;
                return (
                  <button
                    key={idx}
                    onClick={() => trocarConta(idx)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:opacity-90"
                    style={{ backgroundColor: ativa ? "var(--field)" : "transparent" }}
                  >
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: "var(--field)" }}
                    >
                      <span className="text-lg font-bold" style={{ color: "var(--primary)" }}>
                        {ini}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-semibold truncate" style={{ color: "var(--text)" }}>
                        {c.nome || "Conta"}
                      </p>
                      <p className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>
                        {c.email || ""}
                      </p>
                    </div>
                    {ativa && (
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: "rgba(34,197,94,0.15)",
                          color: "var(--primary)",
                        }}
                      >
                        ATIVA
                      </span>
                    )}
                  </button>
                );
              })}
              <button
                onClick={() => {
                  setSeletorAberto(false);
                  navigate("/cadastro");
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:opacity-90"
              >
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: "var(--field)" }}
                >
                  <Plus size={20} style={{ color: "var(--primary)" }} />
                </div>
                <span className="text-sm font-semibold" style={{ color: "var(--primary)" }}>
                  Adicionar nova conta
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmar sair */}
      {confirmarSair && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-5 space-y-4"
            style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <h3 className="text-base font-bold" style={{ color: "var(--text)" }}>
              Sair da conta?
            </h3>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Você precisará fazer login novamente para acessar o app.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmarSair(false)}
                className="flex-1 py-3 rounded-xl font-semibold"
                style={{ backgroundColor: "var(--field)", color: "var(--text)" }}
              >
                Cancelar
              </button>
              <button
                onClick={sair}
                className="flex-1 py-3 rounded-xl font-semibold"
                style={{ backgroundColor: "#ef4444", color: "#fff" }}
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmar limpar todos os lançamentos */}
      {confirmarLimpar && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-5 space-y-4"
            style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <h3 className="text-base font-bold" style={{ color: "var(--text)" }}>
              Excluir todos os lançamentos?
            </h3>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Esta ação não pode ser desfeita. Sua conta será mantida.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmarLimpar(false)}
                className="flex-1 py-3 rounded-xl font-semibold"
                style={{ backgroundColor: "var(--field)", color: "var(--text)" }}
              >
                Cancelar
              </button>
              <button
                onClick={limparLancamentos}
                className="flex-1 py-3 rounded-xl font-semibold"
                style={{ backgroundColor: "#f97316", color: "#fff" }}
              >
                Excluir tudo
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav ativo="perfil" />
    </div>
  );
}
