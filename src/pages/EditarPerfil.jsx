import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Briefcase, CalendarDays, Check, Pencil, Trash2, X, ChevronRight,
} from "lucide-react";

import Valor from "../components/Valor.jsx";
import Calendario from "../components/Calendario.jsx";
import { useUserState } from "@/lib/userState";
import { LIMITES_ANUAIS, LIMITE_NOME_INPUT } from "@/lib/fiscal";

const FOTO_KEY = "tacerto_foto_usuario";

const LABEL_PERFIL = {
  MEI: "MEI (outras atividades)",
  MEI_CAMINHONEIRO: "MEI Caminhoneiro",
};

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function LinhaFiscal({ Icon, label, valor, onClick, perigo }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left active:opacity-75 transition"
      style={{ background: "linear-gradient(160deg, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0.05) 24%, rgba(255,255,255,0) 58%), rgba(14,14,16,0.82)", backdropFilter: "blur(24px) saturate(160%)", WebkitBackdropFilter: "blur(24px) saturate(160%)", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "inset 0 1.5px 0 0 rgba(255,255,255,0.40), inset 0 9px 20px -8px rgba(255,255,255,0.28), inset 0 -1.5px 0 0 rgba(0,0,0,0.30), 0 8px 24px rgba(0,0,0,0.38)" }}
    >
      <Icon
        size={20}
        strokeWidth={2}
        style={{ color: perigo ? "var(--danger)" : "var(--primary)" }}
        className="shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p
          className="text-[15px] font-semibold leading-tight"
          style={{ color: perigo ? "var(--danger)" : "var(--text)" }}
        >
          {label}
        </p>
        {valor && (
          <p
            className="text-[12px] mt-0.5 truncate"
            style={{ color: "var(--text-secondary)" }}
          >
            {valor}
          </p>
        )}
      </div>
      {!perigo && (
        <ChevronRight size={17} style={{ color: "var(--text-tertiary)" }} className="shrink-0" />
      )}
    </button>
  );
}

export default function EditarPerfil() {
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const {
    nome: nomeSalvo, email, visitante, tipo, mesAbertura, anoAbertura,
    setNome: salvarNome, setTipo, setAbertura,
  } = useUserState();

  const [nome, setNome] = useState(nomeSalvo || "");
  const [selecionarTipo, setSelecionarTipo] = useState(false);
  const [perfilPendente, setPerfilPendente] = useState(null);
  const [confirmarTroca, setConfirmarTroca] = useState(false);
  const [menuFoto, setMenuFoto] = useState(false);
  const [calendarioAberto, setCalendarioAberto] = useState(false);
  const [salvo, setSalvo] = useState(false);

  const [foto, setFoto] = useState(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(FOTO_KEY) || null;
  });

  const temMudanca = nome.trim() !== (nomeSalvo || "").trim() && nome.trim() !== "";

  useEffect(() => { setNome(nomeSalvo || ""); }, [nomeSalvo]);

  const inicial = (nome || "?").trim().charAt(0).toUpperCase();

  const cardStyle = {
    backgroundColor: "var(--surface)",
    border: "1px solid var(--border)",
  };

  const subAbertura =
    mesAbertura && anoAbertura
      ? `${MESES[Number(mesAbertura) - 1]} de ${anoAbertura}`
      : "Não informado";

  function handleFoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = String(reader.result || "");
      try {
        localStorage.setItem(FOTO_KEY, base64);
        window.dispatchEvent(new Event("tacerto-user-changed"));
      } catch {}
      setFoto(base64);
    };
    reader.readAsDataURL(file);
    setMenuFoto(false);
  }

  function removerFoto() {
    try {
      localStorage.removeItem(FOTO_KEY);
      window.dispatchEvent(new Event("tacerto-user-changed"));
    } catch {}
    setFoto(null);
    setMenuFoto(false);
  }

  function salvarAlteracoes() {
    salvarNome(nome.trim());
    setSalvo(true);
    setTimeout(() => setSalvo(false), 1800);
  }

  function escolherTipo(novo) {
    setSelecionarTipo(false);
    if (novo === tipo) return;
    setPerfilPendente(novo);
    setConfirmarTroca(true);
  }

  return (
    <div
      className="tela-rolavel w-full flex flex-col"
      style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
    >
      <header className="px-5 pt-5 pb-2 flex items-center gap-3 shrink-0">
        <button
          onClick={() => navigate(-1)}
          aria-label="Voltar"
          className="w-10 h-10 rounded-full flex items-center justify-center hover:opacity-80"
          style={{ background: "linear-gradient(160deg, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0.05) 24%, rgba(255,255,255,0) 58%), rgba(14,14,16,0.82)", backdropFilter: "blur(24px) saturate(160%)", WebkitBackdropFilter: "blur(24px) saturate(160%)", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "inset 0 1.5px 0 0 rgba(255,255,255,0.40), inset 0 9px 20px -8px rgba(255,255,255,0.28), inset 0 -1.5px 0 0 rgba(0,0,0,0.30), 0 8px 24px rgba(0,0,0,0.38)" }}
        >
          <ArrowLeft size={20} style={{ color: "var(--text)" }} />
        </button>
        <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>
          Editar perfil
        </h1>
      </header>

      <div
        className="conteudo-rolavel hide-scrollbar px-5"
        style={{ paddingBottom: "calc(16px + env(safe-area-inset-bottom))" }}
      >
        <div className="flex flex-col items-center pt-2 pb-4">
          <div className="relative">
            <button
              type="button"
              onClick={() => { if (!visitante) setMenuFoto(true); }}
              className="block w-20 h-20 rounded-full overflow-hidden active:opacity-80"
              style={{
                backgroundColor: "var(--field)",
                cursor: visitante ? "default" : "pointer",
              }}
              aria-label={visitante ? "Avatar" : "Alterar foto"}
            >
              {foto && !visitante ? (
                <img src={foto} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="font-bold" style={{ color: "var(--primary)", fontSize: 32 }}>
                    {inicial}
                  </span>
                </div>
              )}
            </button>
            {!visitante && (
              <>
                <button
                  type="button"
                  onClick={() => setMenuFoto(true)}
                  aria-label="Editar foto"
                  className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center shadow"
                  style={{ backgroundColor: "var(--primary)" }}
                >
                  <Pencil size={14} style={{ color: "var(--primary-contrast)" }} />
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFoto}
                />
              </>
            )}
          </div>
        </div>

        <p
          className="text-[12px] font-semibold uppercase mb-2"
          style={{ color: "var(--text-tertiary)", letterSpacing: "0.06em" }}
        >
          Informações pessoais
        </p>

        <div className="space-y-2">
          <div
            className="rounded-2xl px-4 py-2.5"
            style={{ background: "linear-gradient(160deg, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0.05) 24%, rgba(255,255,255,0) 58%), rgba(14,14,16,0.82)", backdropFilter: "blur(24px) saturate(160%)", WebkitBackdropFilter: "blur(24px) saturate(160%)", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "inset 0 1.5px 0 0 rgba(255,255,255,0.40), inset 0 9px 20px -8px rgba(255,255,255,0.28), inset 0 -1.5px 0 0 rgba(0,0,0,0.30), 0 8px 24px rgba(0,0,0,0.38)" }}
          >
            <label
              className="block text-[11px] mb-0.5"
              style={{ color: "var(--text-tertiary)" }}
            >
              Nome
            </label>
            <input
              value={nome}
              maxLength={LIMITE_NOME_INPUT}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Seu nome"
              className="campo-tacerto w-full bg-transparent text-[15px] font-semibold outline-none"
              style={{ color: "var(--text)", border: "none", boxShadow: "none" }}
            />
          </div>

          <div
            className="rounded-2xl px-4 py-2.5"
            style={{ backgroundColor: "var(--field)", opacity: 0.75 }}
          >
            <label
              className="block text-[11px] mb-0.5"
              style={{ color: "var(--text-tertiary)" }}
            >
              E-mail
            </label>
            <p
              className="w-full text-[15px] truncate"
              style={{
                color: visitante || !email ? "var(--text-secondary)" : "var(--text)",
              }}
              title={visitante ? "" : email || ""}
            >
              {visitante ? "Sem e-mail cadastrado" : email || "—"}
            </p>
          </div>
        </div>

        {(temMudanca || salvo) && (
          <div className="pt-2.5">
            <button
              onClick={salvarAlteracoes}
              disabled={salvo}
              className="w-full py-3 rounded-2xl font-semibold text-sm transition active:scale-[0.99]"
              style={{
                backgroundColor: salvo ? "var(--field)" : "var(--primary)",
                color: salvo ? "var(--primary)" : "var(--primary-contrast)",
              }}
            >
              {salvo ? "Alterações salvas" : "Salvar alterações"}
            </button>
          </div>
        )}

        <p
          className="text-[12px] font-semibold uppercase mb-2 mt-4"
          style={{ color: "var(--text-tertiary)", letterSpacing: "0.06em" }}
        >
          Perfil fiscal
        </p>

        <div className="space-y-2">
          <LinhaFiscal
            Icon={Briefcase}
            label="Tipo de MEI"
            valor={LABEL_PERFIL[tipo]}
            onClick={() => setSelecionarTipo(true)}
          />
          <LinhaFiscal
            Icon={CalendarDays}
            label="Data de abertura"
            valor={subAbertura}
            onClick={() => setCalendarioAberto(true)}
          />
        </div>

        <div className="pt-4">
          <LinhaFiscal
            Icon={Trash2}
            label="Excluir conta"
            perigo
            onClick={() => navigate("/excluir-conta")}
          />
        </div>
      </div>

      <Calendario
        aberto={calendarioAberto}
        modo="mesAno"
        mes={mesAbertura}
        ano={anoAbertura}
        onFechar={() => setCalendarioAberto(false)}
        onSelecionarMesAno={(m, a) => { setAbertura(m, a); setCalendarioAberto(false); }}
      />

      {menuFoto && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
          onClick={() => setMenuFoto(false)}
        >
          <div
            className="w-full max-w-md p-4 space-y-2"
            style={{
              backgroundColor: "var(--surface)",
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-1 pb-1">
              <p className="text-base font-bold" style={{ color: "var(--text)" }}>
                Foto de perfil
              </p>
              <button
                onClick={() => setMenuFoto(false)}
                aria-label="Fechar"
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "linear-gradient(160deg, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0.05) 24%, rgba(255,255,255,0) 58%), rgba(14,14,16,0.82)", backdropFilter: "blur(24px) saturate(160%)", WebkitBackdropFilter: "blur(24px) saturate(160%)", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "inset 0 1.5px 0 0 rgba(255,255,255,0.40), inset 0 9px 20px -8px rgba(255,255,255,0.28), inset 0 -1.5px 0 0 rgba(0,0,0,0.30), 0 8px 24px rgba(0,0,0,0.38)" }}
              >
                <X size={16} style={{ color: "var(--text)" }} />
              </button>
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full py-3.5 rounded-xl font-semibold text-sm"
              style={{ backgroundColor: "var(--field)", color: "var(--text)" }}
            >
              {foto ? "Trocar foto" : "Escolher foto"}
            </button>
            {foto && (
              <button
                onClick={removerFoto}
                className="w-full py-3.5 rounded-xl font-semibold text-sm"
                style={{ backgroundColor: "var(--field)", color: "var(--danger)" }}
              >
                Remover foto
              </button>
            )}
          </div>
        </div>
      )}

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
                const ativo = tipo === opt;
                return (
                  <button
                    key={opt}
                    onClick={() => escolherTipo(opt)}
                    className="w-full rounded-xl p-4 flex items-center gap-3 text-left transition"
                    style={{
                      backgroundColor: ativo ? "rgba(34,197,94,0.07)" : "var(--field)",
                      border: ativo ? "1px solid var(--primary)" : "1px solid transparent",
                      opacity: ativo ? 1 : 0.55,
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm"
                        style={{ color: "var(--text)", fontWeight: ativo ? 700 : 500 }}
                      >
                        {opt === "MEI" ? "MEI" : "MEI Caminhoneiro"}
                      </p>
                      <p
                        className="text-xs mt-0.5 flex items-center gap-1"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        Limite anual <Valor tamanho="sm">{LIMITES_ANUAIS[opt]}</Valor>
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

      {confirmarTroca && perfilPendente && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
        >
          <div className="w-full max-w-sm rounded-2xl p-5 space-y-4" style={cardStyle}>
            <h3 className="text-base font-bold" style={{ color: "var(--text)" }}>
              Alterar tipo de MEI?
            </h3>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              O limite anual será recalculado para{" "}
              <Valor tamanho="sm">{LIMITES_ANUAIS[perfilPendente]}</Valor>.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => { setConfirmarTroca(false); setPerfilPendente(null); }}
                className="flex-1 py-3 rounded-xl font-semibold"
                style={{ backgroundColor: "var(--field)", color: "var(--text)" }}
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (perfilPendente) setTipo(perfilPendente);
                  setConfirmarTroca(false);
                  setPerfilPendente(null);
                }}
                className="flex-1 py-3 rounded-xl font-semibold"
                style={{ backgroundColor: "var(--primary)", color: "var(--primary-contrast)" }}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

