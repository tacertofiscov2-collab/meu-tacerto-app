/* PERFILPERMISSOES v1 — Perfil > "Permissões e integrações": o que o TaCerto usa, com status e acao: WhatsApp (Conectado; liga/desliga "Lembretes e avisos no WhatsApp"), CNPJ (e Remover CNPJ), Extratos enviados (ver e apagar), Receita Federal e Banco (Em breve), Certificado A1 e Notificacoes do celular (status); rodape com Privacidade e Excluir conta */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Building2, FileUp, Landmark, ShieldCheck, Banknote, Bell, Trash2, ChevronDown, MessageSquareOff, MessageSquare,
} from "lucide-react";
import TopoRolavel from "../components/TopoRolavel.jsx";
import FolhaDeBaixo from "../components/FolhaDeBaixo.jsx";
import IconeWhatsApp from "../components/IconeWhatsApp.jsx";
import { SecaoLista, LinhaLista } from "../components/ListaSimples.jsx";
import { supabase } from "@/lib/supabase";
import { useAppState } from "@/context/AppStateContext";
import { mascararCnpj } from "@/lib/cnpj";
import { listarExtratosEnviados, apagarExtratoEnviado } from "@/lib/importarExtrato";

/* ===================================================================
   PERMISSOES E INTEGRACOES (12/10/2026 — tarefa de 10-10, Bloco K)

   - WhatsApp: "Conectado", SEM botao de remover (e o login e a Isa).
     Logo abaixo, "Lembretes e avisos no WhatsApp" liga/desliga
     (perfis.avisos_whatsapp; antes do SQL de 10-10 fica no aparelho):
     obrigatorio pela LGPD e pelas regras do WhatsApp poder parar as
     mensagens. ⚠️ No piloto quem manda os lembretes e o Fernando: olhar
     esse campo antes de mandar.
   - CNPJ: o numero mascarado (ou "Não conectado") -> pagina do CNPJ; e
     "Remover CNPJ" (a mesma acao da pagina do CNPJ).
   - Extratos enviados: quantos; "Ver e apagar" abre a lista. Apagar tira
     o arquivo e o registro; o que ja foi confirmado continua no
     velocimetro (a frase avisa).
   - Receita Federal (boleto e consultas automaticas): "Em breve".
   - Certificado A1 / nota automatica: perfis.nota_automatica_ativa.
   - Banco (Open Finance): "Em breve" (PLUGGY_ATIVO continua false).
   - Notificacoes do celular: o status do navegador (o app ainda nao manda
     notificacao no celular; so mostra).
   Rodape: Politica de privacidade e Excluir conta.
   =================================================================== */

function nomeDoTipo(tipo) {
  return { ofx: "OFX", csv: "CSV", pdf: "PDF" }[String(tipo || "").toLowerCase()] || "Extrato";
}

/* "03/10/2026" */
function dataCurta(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const p = (n) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/* Status das notificacoes do navegador */
function statusNotificacoes() {
  if (typeof window === "undefined" || !("Notification" in window)) return "Não disponível";
  const p = window.Notification.permission;
  return p === "granted" ? "Ligadas" : p === "denied" ? "Bloqueadas" : "Não pedidas";
}

/* Liga/desliga, sem verde (padrao do app: ligado = claro) */
function Chave({ ligada, onMudar, rotulo }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={ligada}
      aria-label={rotulo}
      onClick={() => onMudar(!ligada)}
      className="toque shrink-0 rounded-full relative"
      style={{
        width: 50,
        height: 30,
        border: `1px solid ${ligada ? "var(--text)" : "var(--border)"}`,
        backgroundColor: ligada ? "var(--text)" : "transparent",
        transition: "background-color 180ms ease, border-color 180ms ease",
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

export default function PerfilPermissoes() {
  const navigate = useNavigate();
  const app = useAppState();
  const { cnpj, cnpjConfirmado, avisosWhatsapp, notaAutomaticaAtiva, salvarExtras, removerCnpj, visitante } = app;
  const [userId, setUserId] = useState(null);
  const [extratos, setExtratos] = useState(null); // null = carregando
  const [listaAberta, setListaAberta] = useState(false);
  const [paraApagar, setParaApagar] = useState(null);
  const [confirmarRemoverCnpj, setConfirmarRemoverCnpj] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const temCnpj = Boolean(cnpj);

  useEffect(() => {
    let ativo = true;
    (async () => {
      const { data } = await supabase.auth.getUser().catch(() => ({ data: null }));
      const id = data?.user?.id || null;
      if (!ativo) return;
      setUserId(id);
      const lista = id ? await listarExtratosEnviados(id) : [];
      if (ativo) setExtratos(lista);
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

  async function apagar() {
    if (!paraApagar || ocupado) return;
    setOcupado(true);
    const ok = await apagarExtratoEnviado(userId, paraApagar);
    setOcupado(false);
    if (ok) {
      setExtratos((l) => (l || []).filter((x) => x.id !== paraApagar.id));
      toast("Extrato apagado");
    } else {
      toast.error("Não consegui apagar agora. Tente de novo.");
    }
    setParaApagar(null);
  }

  async function removerOCnpj() {
    setConfirmarRemoverCnpj(false);
    await removerCnpj();
    toast("CNPJ removido");
  }

  const qtdExtratos = extratos ? extratos.length : null;

  return (
    <div className="tela-rolavel w-full flex flex-col" style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}>
      <div
        className="conteudo-rolavel hide-scrollbar w-full max-w-md mx-auto px-5"
        style={{ paddingBottom: "calc(40px + env(safe-area-inset-bottom))" }}
      >
        <TopoRolavel titulo="Permissões e integrações" onVoltar={voltar} />

        <SecaoLista titulo="WhatsApp" style={{ marginTop: 8 }}>
          <LinhaLista Icon={IconeWhatsApp} rotulo="WhatsApp" detalhe="Seu login e o canal da Isa" valor="Conectado" />
          <div className="w-full flex items-center text-left" style={{ gap: 14, padding: "14px 0", minHeight: 54 }}>
            {avisosWhatsapp ? (
              <MessageSquare size={20} strokeWidth={1.9} className="shrink-0" style={{ color: "var(--text-tertiary)" }} />
            ) : (
              <MessageSquareOff size={20} strokeWidth={1.9} className="shrink-0" style={{ color: "var(--text-tertiary)" }} />
            )}
            <span className="flex-1 min-w-0">
              <span className="block font-medium leading-snug" style={{ fontSize: 16.5 }}>Lembretes e avisos no WhatsApp</span>
              <span className="block" style={{ color: "var(--text-tertiary)", fontSize: 13.5, marginTop: 1 }}>
                {avisosWhatsapp ? "Desligue quando quiser parar as mensagens." : "Desligados: a Isa só responde quando você chamar."}
              </span>
            </span>
            <Chave ligada={Boolean(avisosWhatsapp)} onMudar={mudarAvisos} rotulo="Lembretes e avisos no WhatsApp" />
          </div>
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
          {!visitante && (
            <LinhaLista
              Icon={FileUp}
              rotulo="Extratos enviados"
              detalhe={qtdExtratos ? "Ver e apagar" : null}
              semSeta
              valor={
                <span className="inline-flex items-center" style={{ gap: 6 }}>
                  {qtdExtratos === null ? "..." : qtdExtratos === 0 ? "Nenhum" : qtdExtratos}
                  {qtdExtratos > 0 && (
                    <ChevronDown size={17} style={{ color: "var(--text-tertiary)", transform: listaAberta ? "rotate(180deg)" : "none", transition: "transform 200ms ease" }} />
                  )}
                </span>
              }
              onClick={qtdExtratos > 0 ? () => setListaAberta((a) => !a) : undefined}
            />
          )}
        </SecaoLista>

        {listaAberta && qtdExtratos > 0 && (
          <>
            <SecaoLista style={{ marginTop: 4 }}>
              {extratos.map((x) => (
                <LinhaLista
                  key={x.id}
                  rotulo={x.nome_arquivo || `Extrato ${nomeDoTipo(x.tipo)}`}
                  umaLinha
                  detalhe={`${nomeDoTipo(x.tipo)} · enviado em ${dataCurta(x.criado_em)}${x.status === "em_analise" ? " · em análise" : ""}`}
                  semSeta
                  valor={<Trash2 size={17} style={{ color: "var(--text-tertiary)" }} />}
                  onClick={() => setParaApagar(x)}
                />
              ))}
            </SecaoLista>
            <p style={{ fontSize: 13, lineHeight: 1.45, color: "var(--text-tertiary)", marginTop: 6 }}>
              Apagar tira o arquivo e o registro. O que você já confirmou continua no velocímetro.
            </p>
          </>
        )}

        <SecaoLista titulo="Integrações">
          <LinhaLista Icon={Landmark} rotulo="Receita Federal" detalhe="Boleto do DAS e consultas automáticas" valor="Em breve" />
          <LinhaLista
            Icon={ShieldCheck}
            rotulo="Certificado A1"
            detalhe="Nota fiscal automática"
            valor={notaAutomaticaAtiva ? "Ativo" : "Não tem"}
            onClick={() => navigate("/notas-fiscais", { state: { de: "permissoes" } })}
          />
          <LinhaLista Icon={Banknote} rotulo="Banco (Open Finance)" detalhe="Extrato chegando sozinho" valor="Em breve" />
          <LinhaLista Icon={Bell} rotulo="Notificações do celular" valor={statusNotificacoes()} />
        </SecaoLista>

        <div className="flex items-center justify-center" style={{ gap: 18, marginTop: 30 }}>
          <button
            type="button"
            onClick={() => navigate("/privacidade", { state: { de: "permissoes" } })}
            className="toque font-medium"
            style={{ fontSize: 14, color: "var(--text-secondary)", background: "none" }}
          >
            Política de privacidade
          </button>
          {!visitante && (
            <button
              type="button"
              onClick={() => navigate("/excluir-conta", { state: { de: "permissoes" } })}
              className="toque font-medium"
              style={{ fontSize: 14, color: "var(--text-secondary)", background: "none" }}
            >
              Excluir conta
            </button>
          )}
        </div>
      </div>

      <FolhaDeBaixo aberto={Boolean(paraApagar)} onFechar={() => !ocupado && setParaApagar(null)} titulo="Apagar este extrato?">
        <p className="text-center" style={{ color: "var(--text-secondary)", fontSize: 15, lineHeight: 1.45, marginTop: -4 }}>
          O arquivo e o registro saem do app. O que você já confirmou continua no velocímetro.
        </p>
        <BotoesConfirmar ocupado={ocupado} rotulo="Apagar" onCancelar={() => setParaApagar(null)} onConfirmar={apagar} />
      </FolhaDeBaixo>

      <FolhaDeBaixo aberto={confirmarRemoverCnpj} onFechar={() => setConfirmarRemoverCnpj(false)} titulo="Remover o CNPJ?">
        <p className="text-center" style={{ color: "var(--text-secondary)", fontSize: 15, lineHeight: 1.45, marginTop: -4 }}>
          Os dados que vieram dele saem do app. Você pode preencher à mão ou buscar de novo quando quiser.
        </p>
        <BotoesConfirmar rotulo="Remover" onCancelar={() => setConfirmarRemoverCnpj(false)} onConfirmar={removerOCnpj} />
      </FolhaDeBaixo>
    </div>
  );
}

function BotoesConfirmar({ ocupado = false, rotulo, onCancelar, onConfirmar }) {
  return (
    <div className="flex" style={{ gap: 10, marginTop: 18, paddingBottom: 8 }}>
      <button
        type="button"
        onClick={onCancelar}
        disabled={ocupado}
        className="toque flex-1 rounded-2xl font-semibold"
        style={{ padding: "13px 0", fontSize: 15.5, border: "1px solid var(--border)", color: "var(--text)", background: "none" }}
      >
        Cancelar
      </button>
      <button
        type="button"
        onClick={onConfirmar}
        disabled={ocupado}
        className="botao-perigo toque flex-1 rounded-2xl font-semibold"
        style={{ padding: "13px 0", fontSize: 15.5 }}
      >
        {rotulo}
      </button>
    </div>
  );
}
