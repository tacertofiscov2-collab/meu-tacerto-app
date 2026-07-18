import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav.jsx";
import {
  ArrowLeft, Settings, Info, Shield, Users, Lock, LogOut, ChevronRight,
  BarChart3, FileText,
} from "lucide-react";

import { useUserState } from "@/lib/userState";
import { LABEL_TIPO } from "@/lib/fiscal";

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

      <BottomNav ativo="perfil" />
    </div>
  );
}
