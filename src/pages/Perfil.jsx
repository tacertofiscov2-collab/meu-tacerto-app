import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Settings, Info, Shield, Users, Lock, LogOut, ChevronRight,
} from "lucide-react";

// TODO: buscar do backend/Supabase
const USUARIO_MOCK = {
  nome: "Fernando",
  email: "fernando@email.com",
  perfil: "MEI", // "MEI" | "MEI_CAMINHONEIRO"
  faturado2026: 48600,
  lancamentos2026: 12,
  vencimentoDAS: 20,
};
const LIMITES = { MEI: 81000, MEI_CAMINHONEIRO: 251600 };
const LABEL_PERFIL = { MEI: "MEI", MEI_CAMINHONEIRO: "MEI Caminhoneiro" };

const fmtBRL = (v) =>
  "R$ " + v.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

function Brand({ className = "" }) {
  return (
    <span className={className}>
      <span style={{ color: "var(--text)" }}>Ta</span>
      <span style={{ color: "var(--primary)" }}>Certo!</span>
    </span>
  );
}

function ListaItem({ Icon, label, onClick, cor }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 py-3 hover:opacity-90"
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: "var(--field)" }}
      >
        <Icon size={18} style={{ color: cor || "var(--primary)" }} />
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

export default function Perfil() {
  const navigate = useNavigate();
  const [usuario] = useState(USUARIO_MOCK);
  const [confirmarSair, setConfirmarSair] = useState(false);

  const inicial = (usuario.nome || "?").trim().charAt(0).toUpperCase();
  const limite = LIMITES[usuario.perfil] ?? LIMITES.MEI;

  const cardStyle = {
    backgroundColor: "var(--surface)",
    border: "1px solid var(--border)",
  };

  function sair() {
    // TODO: chamar signOut do Supabase
    setConfirmarSair(false);
    navigate("/");
  }

  return (
    <div
      className="min-h-screen min-h-[100dvh] w-full flex flex-col"
      style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
    >
      <div className="flex-1 overflow-y-auto pb-[100px]">
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
          {/* Card usuário — inteiro clicável para editar perfil */}
          <button
            onClick={() => navigate("/editar-perfil")}
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
              <p className="font-bold truncate" style={{ color: "var(--text)" }}>
                {usuario.nome}
              </p>
              <p className="text-xs truncate mt-0.5" style={{ color: "var(--text-secondary)" }}>
                {usuario.email}
              </p>
              <span
                className="inline-block mt-2 text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{
                  backgroundColor: "rgba(34,197,94,0.12)",
                  color: "var(--primary)",
                }}
              >
                {LABEL_PERFIL[usuario.perfil]}
              </span>
            </div>
            <ChevronRight size={18} style={{ color: "var(--text-secondary)" }} />
          </button>

          {/* Resumo 2026 */}
          <div className="rounded-2xl p-5" style={cardStyle}>
            <p className="text-sm mb-3" style={{ color: "var(--text-secondary)" }}>
              Resumo de 2026
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  Faturado
                </p>
                <p className="text-base font-bold mt-1" style={{ color: "var(--text)" }}>
                  {fmtBRL(usuario.faturado2026)}
                </p>
              </div>
              <div>
                <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  Lançamentos
                </p>
                <p className="text-base font-bold mt-1" style={{ color: "var(--text)" }}>
                  {usuario.lancamentos2026}
                </p>
              </div>
            </div>
          </div>

          {/* Informações fiscais */}
          <div className="rounded-2xl p-5 space-y-3" style={cardStyle}>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Informações fiscais
            </p>
            <div className="flex justify-between text-sm">
              <span style={{ color: "var(--text-secondary)" }}>Tipo de perfil</span>
              <span className="font-semibold" style={{ color: "var(--text)" }}>
                {LABEL_PERFIL[usuario.perfil]}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: "var(--text-secondary)" }}>Limite anual</span>
              <span className="font-semibold" style={{ color: "var(--text)" }}>
                {fmtBRL(limite)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: "var(--text-secondary)" }}>Vencimento do DAS</span>
              <span className="font-semibold" style={{ color: "var(--text)" }}>
                Dia {usuario.vencimentoDAS}
              </span>
            </div>
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
            <ListaItem Icon={Users} label="Trocar de conta" onClick={() => navigate("/contas")} />
            <ListaItem Icon={Lock} label="Alterar senha" onClick={() => navigate("/alterar-senha")} />
            <ListaItem
              Icon={LogOut}
              label="Sair da conta"
              cor="#ef4444"
              onClick={() => setConfirmarSair(true)}
            />
          </div>

          <p className="text-center text-xs pt-2" style={{ color: "var(--text-secondary)" }}>
            <Brand /> v0.1
          </p>
        </div>
      </div>


      {/* Confirmar troca de tipo */}
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
              Alterar tipo de MEI?
            </h3>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              O limite anual será recalculado para{" "}
              <strong style={{ color: "var(--text)" }}>
                {fmtBRL(
                  usuario.perfil === "MEI"
                    ? LIMITES.MEI_CAMINHONEIRO
                    : LIMITES.MEI,
                )}
              </strong>
              .
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmarTroca(false)}
                className="flex-1 py-3 rounded-xl font-semibold"
                style={{ backgroundColor: "var(--field)", color: "var(--text)" }}
              >
                Cancelar
              </button>
              <button
                onClick={alternarPerfil}
                className="flex-1 py-3 rounded-xl font-semibold"
                style={{ backgroundColor: "var(--primary)", color: "var(--primary-contrast)" }}
              >
                Confirmar
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
    </div>
  );
}
