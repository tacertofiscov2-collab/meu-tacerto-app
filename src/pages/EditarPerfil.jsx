import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, Briefcase, ChevronRight, Check } from "lucide-react";

import BottomNav from "../components/BottomNav.jsx";
const LIMITES = {
  MEI: 81000,
  MEI_CAMINHONEIRO: 251600,
};
const LABEL_PERFIL = {
  MEI: "MEI (outras atividades)",
  MEI_CAMINHONEIRO: "MEI Caminhoneiro",
};

function fmtBRL(v) {
  return v.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export default function EditarPerfil() {
  const navigate = useNavigate();

  // TODO: carregar do backend
  const [nome, setNome] = useState("Fernando");
  const [perfil, setPerfil] = useState("MEI");
  const [selecionarTipo, setSelecionarTipo] = useState(false);
  const [perfilPendente, setPerfilPendente] = useState(null);
  const [confirmarTroca, setConfirmarTroca] = useState(false);

  const inicial = (nome || "?").trim().charAt(0).toUpperCase();

  const cardStyle = {
    backgroundColor: "var(--surface)",
    border: "1px solid var(--border)",
  };
  const fieldStyle = {
    backgroundColor: "var(--field)",
    border: "1px solid var(--border)",
    color: "var(--text)",
  };

  function escolherTipo(novo) {
    setSelecionarTipo(false);
    if (novo === perfil) return;
    setPerfilPendente(novo);
    setConfirmarTroca(true);
  }

  function confirmarAlteracao() {
    if (perfilPendente) setPerfil(perfilPendente);
    setConfirmarTroca(false);
    setPerfilPendente(null);
  }

  function salvar() {
    // TODO: persistir no Supabase
    navigate(-1);
  }

  return (
    <div
      className="min-h-screen min-h-[100dvh] w-full flex flex-col"
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
        <h1 className="text-xl font-bold flex-1 text-center pr-10" style={{ color: "var(--text)" }}>
          Editar perfil
        </h1>
      </header>

      <div className="flex-1 px-5 pb-6 space-y-6">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-2 pt-2">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "var(--field)", border: "1px solid var(--border)" }}
          >
            <span className="text-4xl font-bold" style={{ color: "var(--primary)" }}>
              {inicial}
            </span>
          </div>
        </div>



        {/* Nome */}
        <div className="space-y-2">
          <label className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
            Nome
          </label>
          <div className="relative">
            <User
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: "var(--text-secondary)" }}
            />
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Seu nome"
              className="w-full pl-10 pr-3 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]"
              style={fieldStyle}
            />
          </div>
        </div>

        {/* Alterar tipo de MEI */}
        <button
          onClick={() => setSelecionarTipo(true)}
          className="w-full rounded-2xl p-4 flex items-center gap-3 text-left"
          style={cardStyle}
        >
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: "var(--field)" }}
          >
            <Briefcase size={18} style={{ color: "var(--primary)" }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
              Alterar tipo de MEI
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
              Atual: {LABEL_PERFIL[perfil]}
            </p>
          </div>
          <ChevronRight size={18} style={{ color: "var(--text-secondary)" }} />
        </button>
      </div>

      {/* Salvar */}
      <div
        className="px-5 pb-6"
        style={{ paddingBottom: "calc(110px + env(safe-area-inset-bottom))" }}
      >
        <button
          onClick={salvar}
          className="w-full py-3.5 rounded-xl font-semibold"
          style={{
            backgroundColor: "var(--primary)",
            color: "var(--primary-contrast)",
          }}
        >
          Salvar alterações
        </button>
      </div>

      {/* Modal seleção de tipo */}
      {selecionarTipo && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
          onClick={() => setSelecionarTipo(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-5 space-y-4"
            style={cardStyle}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold" style={{ color: "var(--text)" }}>
              Escolha o tipo de MEI
            </h3>
            <div className="space-y-2">
              {["MEI", "MEI_CAMINHONEIRO"].map((opt) => {
                const ativo = perfil === opt;
                return (
                  <button
                    key={opt}
                    onClick={() => escolherTipo(opt)}
                    className="w-full rounded-xl p-4 flex items-center gap-3 text-left"
                    style={{
                      backgroundColor: "var(--field)",
                      border: ativo
                        ? "1px solid var(--primary)"
                        : "1px solid var(--border)",
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                        {opt === "MEI" ? "MEI" : "MEI Caminhoneiro"}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                        Limite anual {fmtBRL(LIMITES[opt])}
                      </p>
                    </div>
                    {ativo && <Check size={18} style={{ color: "var(--primary)" }} />}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setSelecionarTipo(false)}
              className="w-full py-3 rounded-xl font-semibold"
              style={{ backgroundColor: "var(--field)", color: "var(--text)" }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Modal confirmação */}
      {confirmarTroca && perfilPendente && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-5 space-y-4"
            style={cardStyle}
          >
            <h3 className="text-base font-bold" style={{ color: "var(--text)" }}>
              Alterar tipo de MEI?
            </h3>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              O limite anual será recalculado para{" "}
              <strong style={{ color: "var(--text)" }}>
                {fmtBRL(LIMITES[perfilPendente])}
              </strong>
              .
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setConfirmarTroca(false);
                  setPerfilPendente(null);
                }}
                className="flex-1 py-3 rounded-xl font-semibold"
                style={{ backgroundColor: "var(--field)", color: "var(--text)" }}
              >
                Cancelar
              </button>
              <button
                onClick={confirmarAlteracao}
                className="flex-1 py-3 rounded-xl font-semibold"
                style={{ backgroundColor: "var(--primary)", color: "var(--primary-contrast)" }}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
