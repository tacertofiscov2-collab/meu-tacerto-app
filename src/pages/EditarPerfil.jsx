import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Check, Trash2, ChevronRight, CheckCircle2, AlertCircle,
} from "lucide-react";

import Valor from "../components/Valor.jsx";
import Calendario from "../components/Calendario.jsx";
import { useUserState } from "@/lib/userState";
import { supabase } from "@/lib/supabase";
import { LIMITES_ANUAIS, LIMITE_NOME_INPUT } from "@/lib/fiscal";

/* ===================================================================
   EDITARPERFIL v4 — rotulo FORA do card (cabecalho original mantido)

   Mudanca de layout: o rotulo ("Nome", "E-mail"...) saiu de dentro do
   card e foi para cima dele. O card fica so com o dado, em negrito e
   com mais altura. Os titulos de secao viraram caixa normal, sem o
   uppercase espacado.

   SELO DE VERIFICADO: aparece so no E-mail, e le o dado REAL do
   Supabase (email_confirmed_at). O WhatsApp NAO tem selo de proposito
   — a verificacao por SMS ainda nao existe (a tela de codigo aceita
   qualquer numero), entao um "verificado" ali seria mentira. Quando o
   provedor de SMS entrar, e so ligar o mesmo componente aqui.
   =================================================================== */

// ---------------------------------------------------------------------
// Espaçamentos ajustáveis desta tela.
// A SOMA de ACIMA + ABAIXO do avatar define onde começam os cards:
// mudando um e compensando no outro, só a bola se move.
// ---------------------------------------------------------------------
const ESPACO_ACIMA_AVATAR = 28;
const ESPACO_ABAIXO_AVATAR = 28;
const ESPACO_ENTRE_SECOES = 26;

const LABEL_PERFIL = {
  MEI: "MEI (outras atividades)",
  MEI_CAMINHONEIRO: "MEI Caminhoneiro",
};

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

/* Formata enquanto digita: (11) 98765-4321 */
function formatarTelefone(valor) {
  const d = String(valor).replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/**
 * Grava os campos de perfil na tabela `perfis` do Supabase.
 *
 * Recebe os valores JÁ RESOLVIDOS (não lê do estado do React), porque
 * setState é assíncrono: logo após um setTipo/setAbertura o estado ainda
 * tem o valor antigo. Passando explícito, gravamos o que o usuário
 * acabou de escolher.
 *
 * Só grava os campos presentes no patch (undefined é ignorado).
 * Silencioso para visitante (sem sessão) — igual ao resto do app.
 */
async function sincronizarPerfilNoBanco(patch) {
  try {
    const { data } = await supabase.auth.getUser();
    if (!data?.user) return; // visitante: nada a fazer

    const update = { atualizado_em: new Date().toISOString() };
    if (patch.nome !== undefined) update.nome = patch.nome;
    if (patch.tipo !== undefined) update.tipo_mei = patch.tipo;
    if (patch.mesAbertura !== undefined) update.mes_abertura = patch.mesAbertura;
    if (patch.anoAbertura !== undefined) update.ano_abertura = patch.anoAbertura;
    if (patch.whatsapp !== undefined) update.whatsapp = patch.whatsapp;

    await supabase.from("perfis").update(update).eq("id", data.user.id);
  } catch {
    /* falha de rede/visitante — não quebra a tela */
  }
}

/* Titulo de secao: caixa normal, cinza, discreto. */
function TituloSecao({ children, primeiro }) {
  return (
    <p
      className="text-[14px] mb-3"
      style={{
        color: "var(--text-tertiary)",
        marginTop: primeiro ? 0 : ESPACO_ENTRE_SECOES,
      }}
    >
      {children}
    </p>
  );
}

/* Rotulo do campo: fica FORA do card, logo acima dele. */
function Rotulo({ children }) {
  return (
    <label className="block text-[14px] mb-1.5" style={{ color: "var(--text)" }}>
      {children}
    </label>
  );
}

/* Linha de escolha (Tipo de MEI, Data de abertura): o card mostra o
   valor atual e a seta indica que abre um seletor. */
function CampoEscolha({ rotulo, valor, onClick }) {
  return (
    <div>
      <Rotulo>{rotulo}</Rotulo>
      <button
        onClick={onClick}
        className="card-tacerto w-full flex items-center gap-3 px-4 py-4 rounded-2xl text-left active:opacity-75 transition"
      >
        <span
          className="flex-1 min-w-0 truncate text-[16px] font-semibold"
          style={{ color: "var(--text)" }}
        >
          {valor}
        </span>
        <ChevronRight size={18} style={{ color: "var(--text-tertiary)" }} className="shrink-0" />
      </button>
    </div>
  );
}

export default function EditarPerfil() {
  const navigate = useNavigate();

  const {
    nome: nomeSalvo, email, visitante, tipo, mesAbertura, anoAbertura,
    setNome: salvarNome, setTipo, setAbertura,
  } = useUserState();

  const [nome, setNome] = useState(nomeSalvo || "");
  /* WhatsApp: canal de atendimento do TaCerto. Vive na coluna `whatsapp`
     da tabela `perfis` — a mesma que o Cadastro grava. Guardamos com o
     +55 no banco e mostramos só os dígitos locais na tela. */
  const [whats, setWhats] = useState("");
  const [whatsSalvo, setWhatsSalvo] = useState("");
  const [selecionarTipo, setSelecionarTipo] = useState(false);
  const [perfilPendente, setPerfilPendente] = useState(null);
  const [confirmarTroca, setConfirmarTroca] = useState(false);
  const [calendarioAberto, setCalendarioAberto] = useState(false);
  const [salvo, setSalvo] = useState(false);
  /* Vem do proprio Supabase (email_confirmed_at). null = ainda carregando,
     para nao piscar o icone errado no primeiro instante. */
  const [emailConfirmado, setEmailConfirmado] = useState(null);
  const [avisoReenvio, setAvisoReenvio] = useState("");

  const mudouNome = nome.trim() !== (nomeSalvo || "").trim() && nome.trim() !== "";
  const mudouWhats = whats.replace(/\D/g, "") !== whatsSalvo.replace(/\D/g, "");
  const temMudanca = mudouNome || mudouWhats;

  useEffect(() => { setNome(nomeSalvo || ""); }, [nomeSalvo]);

  // Busca o WhatsApp salvo e o estado de confirmação do e-mail.
  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const user = userData?.user;
        if (!user) return; // visitante
        if (ativo) setEmailConfirmado(Boolean(user.email_confirmed_at));

        const { data } = await supabase
          .from("perfis")
          .select("whatsapp")
          .eq("id", user.id)
          .single();
        if (!ativo) return;
        if (data?.whatsapp) {
          const local = formatarTelefone(String(data.whatsapp).replace(/^\+55/, ""));
          setWhats(local);
          setWhatsSalvo(local);
        }
      } catch {
        /* coluna ausente ou falha de rede — campo fica vazio */
      }
    })();
    return () => { ativo = false; };
  }, []);

  /* Reenvia o e-mail de confirmação. O Supabase limita a 2 e-mails por
     hora, então a mensagem de erro precisa aparecer para o usuário não
     ficar clicando achando que funcionou. */
  async function reenviarVerificacao() {
    setAvisoReenvio("");
    try {
      const { error } = await supabase.auth.resend({ type: "signup", email });
      setAvisoReenvio(
        error
          ? "Não foi possível reenviar agora. Tente de novo mais tarde."
          : "Enviamos um novo link para o seu e-mail."
      );
    } catch {
      setAvisoReenvio("Não foi possível reenviar agora. Tente de novo mais tarde.");
    }
  }

  const inicial = (nome || "?").trim().charAt(0).toUpperCase();

  const cardStyle = {
    backgroundColor: "var(--surface)",
    border: "1px solid var(--border)",
  };

  const subAbertura =
    mesAbertura && anoAbertura
      ? `${MESES[Number(mesAbertura) - 1]} de ${anoAbertura}`
      : "Não informado";

  function salvarAlteracoes() {
    const nomeLimpo = nome.trim();
    const digitos = whats.replace(/\D/g, "");
    salvarNome(nomeLimpo);
    sincronizarPerfilNoBanco({
      nome: nomeLimpo,
      whatsapp: digitos ? `+55${digitos}` : null,
    });
    setWhatsSalvo(whats);
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
          style={{ border: "1px solid var(--border)", backgroundColor: "transparent" }}
        >
          <ArrowLeft size={20} style={{ color: "var(--text)" }} />
        </button>
        <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>
          Editar perfil
        </h1>
      </header>

      <div
        className="conteudo-rolavel hide-scrollbar px-5"
        style={{ paddingBottom: "calc(24px + env(safe-area-inset-bottom))" }}
      >
        {/* Avatar: só a inicial. A opção de foto foi retirada no piloto
            (será reativada quando o app for empacotado como nativo). */}
        <div
          className="flex flex-col items-center"
          style={{ paddingTop: ESPACO_ACIMA_AVATAR, paddingBottom: ESPACO_ABAIXO_AVATAR }}
        >
          <div
            className="rounded-full overflow-hidden shrink-0 flex items-center justify-center"
            style={{
              width: 80,
              height: 80,
              minWidth: 80,
              minHeight: 80,
              boxSizing: "border-box",
              flexShrink: 0,
              background: "linear-gradient(160deg, var(--vidro-brilho-1) 0%, var(--vidro-brilho-2) 24%, transparent 58%), var(--vidro-bg)",
              backdropFilter: "blur(6px) saturate(160%)",
              WebkitBackdropFilter: "blur(6px) saturate(160%)",
              border: "1px solid var(--vidro-borda)",
              boxShadow: "inset 0 1.5px 0 0 var(--vidro-topo-forte), inset 0 9px 20px -8px var(--vidro-topo-medio), inset 0 -1.5px 0 0 var(--vidro-base), 0 8px 24px var(--vidro-sombra)",
            }}
            aria-label="Avatar"
          >
            <span className="font-bold" style={{ color: "var(--primary)", fontSize: 34 }}>
              {inicial || "?"}
            </span>
          </div>
        </div>

        {/* ================= INFORMACOES PESSOAIS ================= */}
        <TituloSecao primeiro>Informações pessoais</TituloSecao>

        <div>
          <Rotulo>Nome</Rotulo>
          <div className="card-tacerto rounded-2xl px-4 py-4">
            <input
              value={nome}
              maxLength={LIMITE_NOME_INPUT}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Seu nome"
              className="w-full bg-transparent text-[16px] font-semibold outline-none"
              style={{ color: "var(--text)", border: "none", boxShadow: "none" }}
            />
          </div>
        </div>

        {/* ================= INFORMACOES DE CONTATO ================= */}
        <TituloSecao>Informações de contato</TituloSecao>

        <div className="space-y-4">
          <div>
            <Rotulo>E-mail</Rotulo>
            <div className="card-tacerto rounded-2xl px-4 py-4 flex items-center gap-3">
              <p
                className="flex-1 min-w-0 truncate text-[16px] font-semibold"
                style={{ color: visitante || !email ? "var(--text-tertiary)" : "var(--text)" }}
                title={visitante ? "" : email || ""}
              >
                {visitante ? "Sem e-mail cadastrado" : email || "—"}
              </p>
              {/* Selo com o dado real do Supabase. Enquanto carrega
                  (null), nao mostra nada. */}
              {!visitante && email && emailConfirmado === true && (
                <CheckCircle2 size={20} style={{ color: "var(--primary)" }} className="shrink-0" />
              )}
              {!visitante && email && emailConfirmado === false && (
                <AlertCircle size={20} style={{ color: "#f59e0b" }} className="shrink-0" />
              )}
            </div>

            {!visitante && email && emailConfirmado === false && (
              <button
                onClick={reenviarVerificacao}
                className="mt-2 text-[14px] font-medium"
                style={{ color: "var(--primary)" }}
              >
                Reenviar verificação
              </button>
            )}
            {avisoReenvio && (
              <p className="mt-2 text-[13px]" style={{ color: "var(--text-secondary)" }}>
                {avisoReenvio}
              </p>
            )}
          </div>

          <div>
            <Rotulo>WhatsApp</Rotulo>
            <div className="card-tacerto rounded-2xl px-4 py-4">
              <div className="flex items-center gap-2">
                <span
                  className="text-[16px] font-semibold shrink-0"
                  style={{ color: "var(--text-secondary)" }}
                >
                  +55
                </span>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={whats}
                  onChange={(e) => setWhats(formatarTelefone(e.target.value))}
                  placeholder="(00) 00000-0000"
                  autoComplete="off"
                  className="flex-1 min-w-0 bg-transparent text-[16px] font-semibold outline-none placeholder:font-normal placeholder:opacity-50"
                  style={{ color: "var(--text)", border: "none", boxShadow: "none" }}
                />
              </div>
            </div>
          </div>
        </div>

        {(temMudanca || salvo) && (
          <div className="pt-4">
            <button
              onClick={salvarAlteracoes}
              disabled={salvo}
              className="w-full py-3.5 rounded-2xl font-semibold text-sm transition active:scale-[0.99]"
              style={{
                backgroundColor: salvo ? "var(--field)" : "var(--primary)",
                color: salvo ? "var(--primary)" : "var(--primary-contrast)",
              }}
            >
              {salvo ? "Alterações salvas" : "Salvar alterações"}
            </button>
          </div>
        )}

        {/* ================= PERFIL FISCAL ================= */}
        <TituloSecao>Perfil fiscal</TituloSecao>

        <div className="space-y-4">
          <CampoEscolha
            rotulo="Tipo de MEI"
            valor={LABEL_PERFIL[tipo] || "Não informado"}
            onClick={() => setSelecionarTipo(true)}
          />
          <CampoEscolha
            rotulo="Data de abertura"
            valor={subAbertura}
            onClick={() => setCalendarioAberto(true)}
          />
        </div>

        {/* Excluir conta: sem card, so o icone e o texto. */}
        <div className="pt-8">
          <button
            onClick={() => navigate("/excluir-conta")}
            className="flex items-center gap-2.5 active:opacity-70 transition"
          >
            <Trash2 size={20} strokeWidth={2} style={{ color: "var(--danger)" }} />
            <span className="text-[16px] font-medium" style={{ color: "var(--danger)" }}>
              Excluir conta
            </span>
          </button>
        </div>
      </div>

      <Calendario
        aberto={calendarioAberto}
        modo="mesAno"
        mes={mesAbertura}
        ano={anoAbertura}
        onFechar={() => setCalendarioAberto(false)}
        onSelecionarMesAno={(m, a) => {
          setAbertura(m, a);
          sincronizarPerfilNoBanco({ mesAbertura: m, anoAbertura: a });
          setCalendarioAberto(false);
        }}
      />

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
                  if (perfilPendente) {
                    setTipo(perfilPendente);
                    sincronizarPerfilNoBanco({ tipo: perfilPendente });
                  }
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