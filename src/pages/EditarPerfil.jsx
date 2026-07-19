import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Briefcase, CalendarDays, Check, ChevronDown, Pencil, Trash2,
} from "lucide-react";

import BottomNav from "../components/BottomNav.jsx";
import Valor from "../components/Valor.jsx";
import { FlatItem, FlatGroup, SectionTitle } from "../components/FlatList.jsx";
import { useUserState, setUserState } from "@/lib/userState";
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

function anosDisponiveis() {
  const atual = new Date().getFullYear();
  const anos = [];
  for (let a = atual; a >= atual - 20; a--) anos.push(a);
  return anos;
}

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

  // Modal alterar data de abertura
  const [editarAbertura, setEditarAbertura] = useState(false);
  const [mesForm, setMesForm] = useState(mesAbertura || "");
  const [anoForm, setAnoForm] = useState(anoAbertura || new Date().getFullYear());

  const [foto, setFoto] = useState(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(FOTO_KEY) || null;
  });

  // Auto-save do nome — debounce 500ms
  useEffect(() => {
    if (nome === nomeSalvo) return;
    const t = setTimeout(() => {
      salvarNome(nome);
    }, 500);
    return () => clearTimeout(t);
  }, [nome, nomeSalvo, salvarNome]);

  // Ao abrir modal de abertura, resetar form com os valores atuais
  useEffect(() => {
    if (editarAbertura) {
      setMesForm(mesAbertura || "");
      setAnoForm(anoAbertura || new Date().getFullYear());
    }
  }, [editarAbertura, mesAbertura, anoAbertura]);

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
      ? `Atual: ${MESES[Number(mesAbertura) - 1]} de ${anoAbertura}`
      : "Não informado";

  function handleFoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = String(reader.result || "");
      try { localStorage.setItem(FOTO_KEY, base64); } catch {}
      setFoto(base64);
    };
    reader.readAsDataURL(file);
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

  function salvarAbertura() {
    if (!mesForm || !anoForm) return;
    setAbertura(Number(mesForm), Number(anoForm));
    setEditarAbertura(false);
  }

  return (
    <div
      className="min-h-screen min-h-[100dvh] w-full flex flex-col"
      style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
    >
      <header className="px-5 pt-6 pb-4 flex items-center gap-3 shrink-0">
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

      <div
        className="flex-1 px-5 flex flex-col"
        style={{ paddingBottom: "calc(24px + env(safe-area-inset-bottom))" }}
      >
        {/* Avatar */}
        <div className="flex flex-col items-center gap-2 pt-2 shrink-0">
          <div className="relative">
            <button
              type="button"
              onClick={() => { if (!visitante) fileRef.current?.click(); }}
              className="block w-24 h-24 rounded-full overflow-hidden active:opacity-80"
              style={{ backgroundColor: "var(--field)", cursor: visitante ? "default" : "pointer" }}
              aria-label={visitante ? "Avatar" : "Alterar foto"}
            >
              {foto && !visitante ? (
                <img src={foto} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-4xl font-bold" style={{ color: "var(--primary)" }}>
                    {inicial}
                  </span>
                </div>
              )}
            </button>
            {!visitante && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                aria-label="Editar foto"
                className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center shadow"
                style={{ backgroundColor: "var(--primary)" }}
              >
                <Pencil size={14} style={{ color: "#0f0f11" }} />
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

        <SectionTitle>Informações pessoais</SectionTitle>
        <div className="space-y-4">
          <div>
            <label
              className="block text-xs mb-2"
              style={{ color: "var(--text-secondary)" }}
            >
              Nome
            </label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Seu nome"
              className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]"
              style={fieldStyle}
            />
          </div>

          <div>
            <label
              className="block text-xs mb-2"
              style={{ color: "var(--text-secondary)" }}
            >
              E-mail
            </label>
            <input
              value={visitante ? "" : (email || "")}
              readOnly
              tabIndex={-1}
              placeholder={visitante ? "Você não tem e-mail cadastrado" : "—"}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none placeholder:opacity-70"
              style={{ ...fieldStyle, opacity: 0.7, cursor: "default" }}
            />
          </div>
        </div>

        <SectionTitle>Perfil fiscal</SectionTitle>
        <FlatGroup>
          <FlatItem
            Icon={Briefcase}
            label="Alterar tipo de MEI"
            sub={`Atual: ${LABEL_PERFIL[perfil]}`}
            onClick={() => setSelecionarTipo(true)}
          />
          <FlatItem
            Icon={CalendarDays}
            label="Alterar data de abertura do MEI"
            sub={subAbertura}
            onClick={() => setEditarAbertura(true)}
          />
        </FlatGroup>

        {/* Excluir conta empurrado pro rodapé */}
        <div style={{ marginTop: "auto", paddingTop: 40 }}>
          <FlatGroup>
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
                      <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: "var(--text-secondary)" }}>
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

      {/* Modal confirmação de troca de tipo */}
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
                style={{ backgroundColor: "var(--primary)", color: "var(--primary-contrast)" }}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal alterar data de abertura do MEI */}
      {editarAbertura && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
          onClick={() => setEditarAbertura(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-5 space-y-4"
            style={cardStyle}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold" style={{ color: "var(--text)" }}>
              Alterar data de abertura do MEI
            </h3>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              O limite anual será recalculado proporcionalmente aos meses de atividade.
            </p>

            {/* Mês */}
            <div>
              <label
                className="block text-xs mb-2"
                style={{ color: "var(--text-secondary)" }}
              >
                Mês de abertura
              </label>
              <div className="relative">
                <select
                  value={mesForm}
                  onChange={(e) => setMesForm(e.target.value)}
                  className="w-full appearance-none pl-4 pr-10 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  style={fieldStyle}
                >
                  <option value="">Selecione o mês</option>
                  {MESES.map((m, i) => (
                    <option key={m} value={i + 1}>{m}</option>
                  ))}
                </select>
                <ChevronDown
                  size={18}
                  className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: "var(--text-secondary)" }}
                />
              </div>
            </div>

            {/* Ano */}
            <div>
              <label
                className="block text-xs mb-2"
                style={{ color: "var(--text-secondary)" }}
              >
                Ano de abertura
              </label>
              <div className="relative">
                <select
                  value={anoForm}
                  onChange={(e) => setAnoForm(e.target.value)}
                  className="w-full appearance-none pl-4 pr-10 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  style={fieldStyle}
                >
                  {anosDisponiveis().map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
                <ChevronDown
                  size={18}
                  className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: "var(--text-secondary)" }}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setEditarAbertura(false)}
                className="flex-1 py-3 rounded-xl font-semibold"
                style={{ backgroundColor: "var(--field)", color: "var(--text)" }}
              >
                Cancelar
              </button>
              <button
                onClick={salvarAbertura}
                disabled={!mesForm || !anoForm}
                className="flex-1 py-3 rounded-xl font-semibold disabled:opacity-50"
                style={{ backgroundColor: "var(--primary)", color: "var(--primary-contrast)" }}
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}