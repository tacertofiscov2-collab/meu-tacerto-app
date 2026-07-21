import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Briefcase, CalendarDays, Check, Pencil, Trash2, X,
} from "lucide-react";

import BottomNav from "../components/BottomNav.jsx";
import Valor from "../components/Valor.jsx";
import Calendario from "../components/Calendario.jsx";
import { FlatItem, FlatGroup } from "../components/FlatList.jsx";
import { useUserState } from "@/lib/userState";
import { LIMITES_ANUAIS } from "@/lib/fiscal";

const FOTO_KEY = "tacerto_foto_usuario";

const LABEL_PERFIL = {
  MEI: "MEI (outras atividades)",
  MEI_CAMINHONEIRO: "MEI Caminhoneiro",
};

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export default function EditarPerfil() {
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const {
    nome: nomeSalvo,
    email,
    visitante,
    tipo,
    mesAbertura,
    anoAbertura,
    setNome: salvarNome,
    setTipo,
    setAbertura,
  } = useUserState();

  const [nome, setNome] = useState(nomeSalvo || "");
  const perfil = tipo;
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

  useEffect(() => {
    setNome(nomeSalvo || "");
  }, [nomeSalvo]);

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
    if (novo === perfil) return;
    setPerfilPendente(novo);
    setConfirmarTroca(true);
  }

  function confirmarAlteracao() {
    if (perfilPendente) setTipo(perfilPendente);
    setConfirmarTroca(false);
    setPerfilPendente(null);
  }

  return (
    <div
      className="w-full flex flex-col"
      style={{
        backgroundColor: "var(--bg)",
        color: "var(--text)",
        height: "100dvh",
        overflow: "hidden",
      }}
    >
      <header className="px-5 pt-5 pb-1 flex items-center gap-3 shrink-0">
        <button
          onClick={() => navigate(-1)}
          aria-label="Voltar"
          className="w-10 h-10 rounded-full flex items-center justify-center hover:opacity-80"
          style={{ backgroundColor: "var(--field)" }}
        >
          <ArrowLeft size={20} style={{ color: "var(--text)" }} />
        </button>
        <h1
          className="text-xl font-bold flex-1 text-center pr-10"
          style={{ color: "var(--text)" }}
        >
          Editar perfil
        </h1>
      </header>

      <div
        className="flex-1 px-5 flex flex-col min-h-0"
        style={{ paddingBottom: "calc(16px + env(safe-area-inset-bottom))" }}
      >
        <div className="flex flex-col items-center py-5 shrink-0">
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                if (!visitante) setMenuFoto(true);
              }}
              className="block w-24 h-24 rounded-full overflow-hidden active:opacity-80"
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
                  <span
                    className="text-4xl font-bold"
                    style={{ color: "var(--primary)" }}
                  >
                    {inicial}
                  </span>
                </div>
              )}
            </button>
            {!visitante && (
              <button
                type="button"
                onClick={() => setMenuFoto(true)}
                aria-label="Editar foto"
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center shadow"
                style={{ backgroundColor: "var(--primary)" }}
              >
                <Pencil size={15} style={{ color: "var(--primary-contrast)" }} />
              </button>
            )}
            {!visitante && (
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFoto}
              />
            )}
          </div>
        </div>

        <p className="text-[13px] mb-2" style={{ color: "var(--text-secondary)" }}>
          Informações pessoais
        </p>
        <div className="space-y-3">
          <div>
            <label
              className="block text-xs mb-1.5"
              style={{ color: "var(--text-secondary)" }}
            >
              Nome
            </label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Seu nome"
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]"
              style={fieldStyle}
            />
          </div>

          <div>
            <label
              className="block text-xs mb-1.5"
              style={{ color: "var(--text-secondary)" }}
            >
              E-mail
            </label>
            <input
              value={visitante ? "" : email || ""}
              readOnly
              tabIndex={-1}
              placeholder={visitante ? "Você não tem e-mail cadastrado" : "—"}
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none placeholder:opacity-70"
              style={{ ...fieldStyle, opacity: 0.7, cursor: "default" }}
            />
          </div>

          {(temMudanca || salvo) && (
            <button
              onClick={salvarAlteracoes}
              disabled={salvo}
              className="w-full py-3 rounded-xl font-semibold text-sm transition active:scale-[0.99]"
              style={{
                backgroundColor: salvo ? "var(--field)" : "var(--primary)",
                color: salvo ? "var(--primary)" : "var(--primary-contrast)",
              }}
            >
              {salvo ? "Alterações salvas" : "Salvar alterações"}
            </button>
          )}
        </div>

        <p
          className="text-[13px] mt-6 mb-1"
          style={{ color: "var(--text-secondary)" }}
        >
          Perfil fiscal
        </p>
        <FlatGroup>
          <FlatItem
            Icon={Briefcase}
            label="Alterar tipo de MEI"
            sub={LABEL_PERFIL[perfil]}
            onClick={() => setSelecionarTipo(true)}
          />
          <FlatItem
            Icon={CalendarDays}
            label="Alterar data de abertura do MEI"
            sub={subAbertura}
            onClick={() => setCalendarioAberto(true)}
          />
          <FlatItem
            Icon={Trash2}
            label="Excluir conta"
            cor="#ef4444"
            iconCor="#ef4444"
            semChevron
            onClick={() => navigate("/excluir-conta")}
          />
        </FlatGroup>
      </div>

      <Calendario
        aberto={calendarioAberto}
        modo="mesAno"
        mes={mesAbertura}
        ano={anoAbertura}
        onFechar={() => setCalendarioAberto(false)}
        onSelecionarMesAno={(m, a) => {
          setAbertura(m, a);
          setCalendarioAberto(false);
        }}
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
                style={{ backgroundColor: "var(--field)" }}
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
                style={{ backgroundColor: "var(--field)", color: "#ef4444" }}
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
                const ativo = perfil === opt;
                return (
                  <button
                    key={opt}
                    onClick={() => escolherTipo(opt)}
                    className="w-full rounded-xl p-4 flex items-center gap-3 text-left transition"
                    style={{
                      backgroundColor: ativo
                        ? "var(--surface-selected)"
                        : "var(--field)",
                      border: "none",
                      opacity: ativo ? 1 : 0.55,
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm"
                        style={{
                          color: "var(--text)",
                          fontWeight: ativo ? 700 : 500,
                        }}
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
                    {ativo && <Check size={18} style={{ color: "var(--text)" }} />}
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
                style={{
                  backgroundColor: "var(--primary)",
                  color: "var(--primary-contrast)",
                }}
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