/* PERFILPERMISSOES v3 — notificacoes so com "Permitir notificações" e a chave, sem texto explicando (pedido do Fernando: "sem falar e explicar demais"; saiu o "No iPhone, adicione a Tela de Inicio" e a folha "Como fazer"; se o celular nao deixar, so um aviso curto no toque) (v2: so o que o app tem hoje (pedido do Fernando, 12/10): WhatsApp (Conectado + liga/desliga dos lembretes e avisos), CNPJ (e Remover CNPJ) e a Notificacao da semana no celular (ativar, liga/desliga; no iPhone, como adicionar a Tela de Inicio); sairam Extratos enviados, Receita Federal, Certificado A1 (fica com a plataforma de notas, nao com o TaCerto), Banco (Open Finance) e o rodape com Privacidade e Excluir conta (ja estao no Perfil) (v1: o que o TaCerto usa, com status e acao: WhatsApp, CNPJ, Extratos enviados (ver e apagar), Receita Federal e Banco (Em breve), Certificado A1 e Notificacoes do celular (status); rodape com Privacidade e Excluir conta)) */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Building2, Bell, BellOff, Trash2, MessageSquareOff, MessageSquare } from "lucide-react";
import TopoRolavel from "../components/TopoRolavel.jsx";
import FolhaDeBaixo from "../components/FolhaDeBaixo.jsx";
import IconeWhatsApp from "../components/IconeWhatsApp.jsx";
import { SecaoLista, LinhaLista } from "../components/ListaSimples.jsx";
import { supabase } from "@/lib/supabase";
import { useAppState } from "@/context/AppStateContext";
import { mascararCnpj } from "@/lib/cnpj";
import {
  estadoNotificacoes, ativarNotificacoes, desligarNotificacoes, garantirInscricaoPush,
} from "@/lib/notificacoesCelular";

/* ===================================================================
   PERMISSOES E INTEGRACOES (12/10/2026 — v1 na tarefa de 10-10, Bloco
   K; v2 pelo print do Fernando: "falar so sobre o que tem no aplicativo,
   nada do que esta por vir")

   - WhatsApp: "Conectado", SEM botao de remover (e o login e a Isa).
     Logo abaixo, "Lembretes e avisos no WhatsApp" liga/desliga
     (perfis.avisos_whatsapp; antes do SQL de 10-10 fica no aparelho):
     obrigatorio pela LGPD e pelas regras do WhatsApp poder parar as
     mensagens. ⚠️ No piloto quem manda os lembretes e o Fernando: olhar
     esse campo antes de mandar.
   - CNPJ: o numero mascarado (ou "Não conectado") -> pagina do CNPJ; e
     "Remover CNPJ" (a mesma acao da pagina do CNPJ).
   - Notificacoes: "Permitir notificações" com a chave e NADA de texto
     (v3, pedido do Fernando). E a notificacao da semana (como esta o
     velocimetro; src/lib/notificacoesCelular.js). A permissao do celular
     so e pedida no toque na chave. No iPhone so funciona com o TaCerto na
     Tela de Inicio (iOS 16.4+): no Safari normal, ligar a chave so mostra
     um aviso curto. O envio comeca quando o SQL e a funcao aviso-semanal
     estiverem no ar (docs/NOTIFICACOES.md); antes disso ja da para ligar.
   v2 tirou: Extratos enviados (o extrato vira entradas e saidas no app e
   o arquivo fica guardado; se a pessoa pedir, a equipe manda pelo
   WhatsApp), Receita Federal e Banco (Em breve), Certificado A1 (quem
   guarda o A1 e a plataforma de emissao de notas, nao o TaCerto) e o
   rodape (Politica de privacidade e Excluir conta ja estao no Perfil).
   =================================================================== */

/* Liga/desliga, sem verde (padrao do app: ligado = claro) */
function Chave({ ligada, onMudar, rotulo, desativada = false }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={ligada}
      aria-label={rotulo}
      disabled={desativada}
      onClick={() => onMudar(!ligada)}
      className="toque shrink-0 rounded-full relative"
      style={{
        width: 50,
        height: 30,
        border: `1px solid ${ligada ? "var(--text)" : "var(--border)"}`,
        backgroundColor: ligada ? "var(--text)" : "transparent",
        transition: "background-color 180ms ease, border-color 180ms ease",
        opacity: desativada ? 0.5 : 1,
      }}
    >
      <span
        aria-hidden
        className="absolute rounded-full"
        style={{
          top: 3,
          left: ligada ? 23 : 3,
          width: 22,
          height: 22,
          backgroundColor: ligada ? "var(--bg)" : "var(--text-tertiary)",
          transition: "left 180ms ease",
        }}
      />
    </button>
  );
}

/* Linha com icone, titulo, frase e a chave (WhatsApp e notificacoes) */
function LinhaComChave({ Icon, titulo, frase, ligada, onMudar, desativada }) {
  return (
    <div className="w-full flex items-center text-left" style={{ gap: 14, padding: "14px 0", minHeight: 54 }}>
      <Icon size={20} strokeWidth={1.9} className="shrink-0" style={{ color: "var(--text-tertiary)" }} />
      <span className="flex-1 min-w-0">
        <span className="block font-medium leading-snug" style={{ fontSize: 16.5 }}>{titulo}</span>
        {frase && <span className="block" style={{ color: "var(--text-tertiary)", fontSize: 13.5, marginTop: 1 }}>{frase}</span>}
      </span>
      <Chave ligada={ligada} onMudar={onMudar} rotulo={titulo} desativada={desativada} />
    </div>
  );
}

const NOTIFICACAO = "Permitir notificações";

export default function PerfilPermissoes() {
  const navigate = useNavigate();
  const app = useAppState();
  const { cnpj, cnpjConfirmado, avisosWhatsapp, salvarExtras, removerCnpj } = app;
  const [userId, setUserId] = useState(null);
  const [confirmarRemoverCnpj, setConfirmarRemoverCnpj] = useState(false);
  const [notificacoes, setNotificacoes] = useState(estadoNotificacoes);
  const [ativando, setAtivando] = useState(false);
  const temCnpj = Boolean(cnpj);

  useEffect(() => {
    let ativo = true;
    (async () => {
      const { data } = await supabase.auth.getUser().catch(() => ({ data: null }));
      const id = data?.user?.id || null;
      if (!ativo) return;
      setUserId(id);
      /* ja ligadas: garante a inscricao deste aparelho (ex.: ativou antes
         da chave existir) */
      if (id) garantirInscricaoPush(id);
    })();
    return () => { ativo = false; };
  }, []);

  function voltar() {
    if ((window.history.state?.idx ?? 0) > 0) navigate(-1);
    else navigate("/perfil", { replace: true });
  }

  function mudarAvisos(ligar) {
    salvarExtras({ avisosWhatsapp: ligar });
    toast(ligar ? "Lembretes e avisos no WhatsApp ligados" : "Pronto: a Isa não manda mais lembretes nem avisos");
  }

  /* Ativar: o pedido de permissao tem que sair DENTRO do toque (iPhone) */
  async function ativar() {
    if (ativando) return;
    setAtivando(true);
    const novo = await ativarNotificacoes(userId);
    setAtivando(false);
    setNotificacoes(novo);
    if (novo === "bloqueadas") toast("Notificações bloqueadas nos Ajustes do celular.");
  }

  /* v3: so a chave. Quando o celular nao deixa, um aviso curto no toque */
  async function mudarNotificacoes(ligar) {
    if (!ligar) {
      setNotificacoes(await desligarNotificacoes(userId));
      return;
    }
    if (notificacoes === "instalar") return toast("Adicione o TaCerto à Tela de Início para permitir.");
    if (notificacoes === "indisponivel") return toast("Este celular não recebe notificações do app.");
    return ativar();
  }

  async function removerOCnpj() {
    setConfirmarRemoverCnpj(false);
    await removerCnpj();
    toast("CNPJ removido");
  }

  return (
    <div className="tela-rolavel w-full flex flex-col" style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}>
      <div
        className="conteudo-rolavel hide-scrollbar w-full max-w-md mx-auto px-5"
        style={{ paddingBottom: "calc(40px + env(safe-area-inset-bottom))" }}
      >
        <TopoRolavel titulo="Permissões e integrações" onVoltar={voltar} />

        <SecaoLista titulo="WhatsApp" style={{ marginTop: 8 }}>
          <LinhaLista Icon={IconeWhatsApp} rotulo="WhatsApp" detalhe="Seu login e o canal da Isa" valor="Conectado" />
          <LinhaComChave
            Icon={avisosWhatsapp ? MessageSquare : MessageSquareOff}
            titulo="Lembretes e avisos no WhatsApp"
            frase={avisosWhatsapp ? "Desligue quando quiser parar as mensagens." : "Desligados: a Isa só responde quando você chamar."}
            ligada={Boolean(avisosWhatsapp)}
            onMudar={mudarAvisos}
          />
        </SecaoLista>

        <SecaoLista titulo="Seus dados">
          <LinhaLista
            Icon={Building2}
            rotulo="CNPJ"
            detalhe={temCnpj ? (cnpjConfirmado ? "Conectado" : "Guardado, sem os dados") : "Preenche seus dados sozinho"}
            valor={temCnpj ? mascararCnpj(cnpj) : "Não conectado"}
            onClick={() => navigate("/perfil/cnpj", { state: { de: "permissoes" } })}
          />
          {temCnpj && (
            <LinhaLista Icon={Trash2} rotulo="Remover CNPJ" semSeta onClick={() => setConfirmarRemoverCnpj(true)} />
          )}
        </SecaoLista>

        <SecaoLista titulo="Notificações">
          <LinhaComChave
            Icon={notificacoes === "ligadas" ? Bell : BellOff}
            titulo={NOTIFICACAO}
            ligada={notificacoes === "ligadas"}
            onMudar={mudarNotificacoes}
            desativada={ativando}
          />
        </SecaoLista>
      </div>

      <FolhaDeBaixo aberto={confirmarRemoverCnpj} onFechar={() => setConfirmarRemoverCnpj(false)} titulo="Remover o CNPJ?">
        <p className="text-center" style={{ color: "var(--text-secondary)", fontSize: 15, lineHeight: 1.45, marginTop: -4 }}>
          Os dados que vieram dele saem do app. Você pode preencher à mão ou buscar de novo quando quiser.
        </p>
        <BotoesConfirmar rotulo="Remover" onCancelar={() => setConfirmarRemoverCnpj(false)} onConfirmar={removerOCnpj} />
      </FolhaDeBaixo>
    </div>
  );
}

function BotoesConfirmar({ rotulo, onCancelar, onConfirmar }) {
  return (
    <div className="flex" style={{ gap: 10, marginTop: 18, paddingBottom: 8 }}>
      <button
        type="button"
        onClick={onCancelar}
        className="toque flex-1 rounded-2xl font-semibold"
        style={{ padding: "13px 0", fontSize: 15.5, border: "1px solid var(--border)", color: "var(--text)", background: "none" }}
      >
        Cancelar
      </button>
      <button
        type="button"
        onClick={onConfirmar}
        className="botao-perigo toque flex-1 rounded-2xl font-semibold"
        style={{ padding: "13px 0", fontSize: 15.5 }}
      >
        {rotulo}
      </button>
    </div>
  );
}
