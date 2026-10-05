/* PERFIL v9 — selo "TaCerto! é grátis" no lugar de "Você faz parte do piloto"; v8: cartoes Meu MEI, Minha conta, Ajuda, Sobre */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav.jsx";
import {
  User, Settings, Info, Shield, Lock, LogOut,
  ChevronDown, ChevronRight, UserPlus, X, Check, TrendingUp, BarChart3,
  Trash2, FileText, ArrowUpRight, ArrowDownLeft, CalendarCheck,
  Phone, Mail, Briefcase, CalendarDays, Gauge, MessageCircle, Sparkles,
} from "lucide-react";
import TopoRolavel from "../components/TopoRolavel.jsx";
import Valor from "../components/Valor.jsx";
import { LABEL_TIPO, calcularFaltamOuExcedeu } from "@/lib/fiscal";

import { useUserState, setUserState } from "@/lib/userState";
import {
  lerContas, lerContaAtivaId, ativarConta, removerAcessoConta,
} from "@/lib/contas";
import { supabase } from "@/lib/supabase";
import { useAppState } from "@/context/AppStateContext";
import {
  MOSTRAR_PREFERENCIAS, MOSTRAR_SAIDAS, MOSTRAR_HISTORICO_DAS, MOSTRAR_NOTAS_FISCAIS,
  MOSTRAR_ADICIONAR_MOVIMENTACOES, MOSTRAR_RESUMO_ANO, MOSTRAR_SOBRE,
  MOSTRAR_AVATAR, MOSTRAR_TUTORIAL_NOTA, MOSTRAR_TUTORIAL_DAS,
  MENSAGENS_WHATSAPP, dadosParaWhatsApp, abrirWhatsAppFisco,
} from "@/config/piloto";

/* ===================================================================
   PERFIL v8 (04/10/2026) — pedido do Fernando, so com o que ja existe
   (nada novo no banco; dado que nao existe, a linha nao aparece):
   - Topo: nome em destaque, chip com o tipo de MEI e o WhatsApp.
   - A bola redonda com a inicial (ou foto) saiu: chave MOSTRAR_AVATAR
     em src/config/piloto.js (o codigo da foto continua aqui).
   - Cartoes de vidro (CardSecao/Linha):
       Meu MEI     tipo, abertura (se abriu este ano), limite do ano
                   (proporcional se abriu este ano — limiteAtual do
                   AppState, que usa o fiscal.js), quanto ja faturou
                   (abre o Historico de entradas) e quanto falta (ou
                   quanto passou, que abre a regra dos 20%).
       Minha conta Editar perfil, WhatsApp, e-mail, Alterar senha.
       Ajuda       Falar com o Fisco no WhatsApp, Como emitir nota,
                   Como pagar o DAS.
       Sobre       Termos de uso, Politica de privacidade, selo
                   "TaCerto! é grátis" (v9; antes falava em piloto) e a versao.
   - Por ultimo: Sair da conta e Excluir conta (vermelhos). O Excluir
     abre a tela de exclusao que ja existia (com as confirmacoes).
   - O CNPJ nao aparece: o perfil ainda nao guarda CNPJ.

   PERFIL v7 (04/10/2026) — PILOTO

   1) Itens escondidos pelas chaves de src/config/piloto.js (nada foi
      apagado): Preferencias, Historico de saidas, Historico de DAS,
      Historico de notas fiscais, Adicionar movimentacoes, Resumo do
      ano e Sobre. Ficam: Editar perfil, Historico de entradas, Alterar
      senha, Termos e Privacidade e Sair da conta.

   2) "SAIR DA CONTA" NAO SAIA: so voltava para a tela de boas-vindas e
      a sessao continuava aberta (abrindo /dashboard a pessoa estava
      logada de novo). Agora desloga no Supabase e limpa os dados do
      aparelho, como a Excluir conta ja fazia. Os dados continuam no
      banco: e so entrar de novo.
   =================================================================== */

const FOTO_KEY = "tacerto_foto_usuario";

/* Marca de onde a navegação partiu. Hoje não é usada (o gesto de
   deslize entre telas está desativado — ver PENDENCIAS_FUTURAS.md),
   mas fica aqui porque volta a ser útil quando o app for empacotado
   com Capacitor e o gesto nativo entrar. */
const DE_PERFIL = { state: { de: "perfil" } };

/* ===================================================================
   CARTOES DE VIDRO DO PERFIL (v8)

   Cada secao e um cartao no estilo vidro do app (o mesmo dos cards do
   Inicio), com um titulo pequeno em cima. Dentro, uma Linha por item:
   icone, rotulo, valor (se tiver) e a setinha quando da para tocar.
   As linhas sao separadas por uma risca fina (divide-y), entao tanto faz
   quais aparecem: item escondido por chave nao deixa risca sobrando.
   =================================================================== */
const VIDRO_CARD = {
  background:
    "linear-gradient(160deg, var(--vidro-brilho-1) 0%, var(--vidro-brilho-2) 24%, transparent 58%), var(--vidro-bg)",
  border: "1px solid var(--vidro-borda)",
  boxShadow: "inset 0 1px 0 0 var(--vidro-topo-medio), 0 8px 24px var(--vidro-sombra)",
};

function CardSecao({ titulo, children }) {
  return (
    <section style={{ marginTop: 20 }}>
      {titulo && (
        <p
          className="text-[12px] font-semibold uppercase"
          style={{ color: "var(--text-tertiary)", letterSpacing: "0.06em", margin: "0 4px 8px" }}
        >
          {titulo}
        </p>
      )}
      <div
        className="rounded-2xl overflow-hidden divide-y divide-[color:var(--border)]"
        style={VIDRO_CARD}
      >
        {children}
      </div>
    </section>
  );
}

function Linha({ Icon, rotulo, detalhe, valor, onClick, cor }) {
  const conteudo = (
    <>
      {Icon && (
        <Icon size={20} strokeWidth={2} style={{ color: cor || "var(--primary)" }} className="shrink-0" />
      )}
      <span className="flex-1 min-w-0">
        <span className="block text-[15px] font-semibold leading-snug" style={{ color: cor || "var(--text)" }}>
          {rotulo}
        </span>
        {detalhe && (
          <span className="block text-[12.5px]" style={{ color: "var(--text-tertiary)", marginTop: 1 }}>
            {detalhe}
          </span>
        )}
      </span>
      {valor != null && valor !== "" && (
        <span
          className="shrink-0 text-right text-[14px] truncate"
          style={{ color: "var(--text-secondary)", maxWidth: "55%" }}
        >
          {valor}
        </span>
      )}
      {onClick && <ChevronRight size={17} style={{ color: "var(--text-tertiary)" }} className="shrink-0" />}
    </>
  );
  const estilo = { gap: 12, padding: "13px 14px", minHeight: 52 };
  if (!onClick) {
    return (
      <div className="w-full flex items-center text-left" style={estilo}>
        {conteudo}
      </div>
    );
  }
  return (
    <button type="button" onClick={onClick} className="toque w-full flex items-center text-left" style={estilo}>
      {conteudo}
    </button>
  );
}

/* "+5537999999999" -> "+55 (37) 99999-9999" */
function formatarWhatsapp(valor) {
  const d = String(valor || "").replace(/\D/g, "").replace(/^55/, "");
  if (d.length < 10) return valor || "";
  const ddd = d.slice(0, 2);
  const resto = d.slice(2);
  const meio = resto.length === 9 ? resto.slice(0, 5) : resto.slice(0, 4);
  return `+55 (${ddd}) ${meio}-${resto.slice(meio.length)}`;
}

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export default function Perfil() {
  const navigate = useNavigate();
  const { nome, visitante } = useUserState();
  const app = useAppState();
  const { resetarConta, tipoMEI, mesAnoAbertura, limiteAtual, faturamentoAtual, email } = app;
  const [saindo, setSaindo] = useState(false);

  /* v7: sai de verdade (ver o topo do arquivo). */
  async function sairDaConta() {
    if (saindo) return;
    setSaindo(true);
    try { await supabase.auth.signOut(); } catch {}
    try { resetarConta(); } catch {}
    setConfirmarSair(false);
    navigate("/", { replace: true });
  }

  const [foto, setFoto] = useState(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(FOTO_KEY) || null;
  });
  const [contas, setContas] = useState(lerContas);
  const [contaAtivaId, setContaAtivaId] = useState(lerContaAtivaId);
  const [seletorAberto, setSeletorAberto] = useState(false);
  const [confirmarSair, setConfirmarSair] = useState(false);
  const [contaARemover, setContaARemover] = useState(null);

  /* v8: WhatsApp do perfil (coluna `whatsapp` da tabela perfis, a mesma
     que o Cadastro e o Editar perfil usam). So leitura. */
  const [whatsapp, setWhatsapp] = useState("");
  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        const { data: u } = await supabase.auth.getUser();
        if (!u?.user) return;
        const { data } = await supabase
          .from("perfis")
          .select("whatsapp")
          .eq("id", u.user.id)
          .single();
        if (ativo && data?.whatsapp) setWhatsapp(formatarWhatsapp(data.whatsapp));
      } catch {
        /* sem rede: a linha mostra "Não informado" */
      }
    })();
    return () => { ativo = false; };
  }, []);

  useEffect(() => {
    const handler = () => {
      setContas(lerContas());
      setContaAtivaId(lerContaAtivaId());
      try { setFoto(localStorage.getItem(FOTO_KEY) || null); } catch {}
    };
    window.addEventListener("storage", handler);
    window.addEventListener("tacerto-user-changed", handler);
    return () => {
      window.removeEventListener("storage", handler);
      window.removeEventListener("tacerto-user-changed", handler);
    };
  }, []);

  const totalContas = contas.length;
  // MULTI-CONTA: escondido no piloto (vira plano pago na monetização).
  // Para reativar, restaure: !visitante && totalContas >= 2
  const temMultiplas = false;
  const nomeExibido = nome && nome.trim() ? nome : "Visitante";
  const inicial = (nomeExibido || "?").trim().charAt(0).toUpperCase();
  const anoAtual = new Date().getFullYear();

  /* v8: o que aparece no cartao "Meu MEI" (so dados que ja existem) */
  const rotuloTipo = LABEL_TIPO[tipoMEI] || "";
  const abertura = mesAnoAbertura?.mes && mesAnoAbertura?.ano
    ? `${MESES[Number(mesAnoAbertura.mes) - 1]} de ${mesAnoAbertura.ano}`
    : "";
  // Limite proporcional: abriu este ano depois de janeiro (fiscal.js)
  const limiteEhProporcional =
    Number(mesAnoAbertura?.ano) === anoAtual && Number(mesAnoAbertura?.mes) > 1;
  const situacao = calcularFaltamOuExcedeu(faturamentoAtual, limiteAtual);

  function trocarConta(id) {
    const conta = ativarConta(id);
    if (conta) {
      setUserState({
        nome: conta.nome || "",
        email: conta.email || "",
        visitante: false,
      });
      setContaAtivaId(id);
    }
    setSeletorAberto(false);
  }

  function confirmarRemocao() {
    if (!contaARemover) return;
    const { novaAtivaId } = removerAcessoConta(contaARemover.id);
    const restantes = lerContas();
    setContas(restantes);
    setContaAtivaId(novaAtivaId);

    /* Se a conta removida era a que estava em uso, entra na que
       assumiu o lugar. Sem nenhuma conta, volta a ser visitante. */
    if (novaAtivaId) {
      const nova = restantes.find((c) => c.id === novaAtivaId);
      if (nova) {
        setUserState({
          nome: nova.nome || "",
          email: nova.email || "",
          visitante: false,
        });
      }
    } else {
      setUserState({ nome: "", email: "", visitante: true });
    }

    setContaARemover(null);
    if (restantes.length === 0) setSeletorAberto(false);
  }

  // MULTI-CONTA escondido no piloto (vira plano pago na monetização).
  // Visitante ainda pode cadastrar; quem já está logado não vê opção de
  // adicionar/trocar conta. Para reativar, restaure o if/else completo:
  //   if (visitante) { ...Cadastrar conta... }
  //   else if (totalContas <= 1) { ...Adicionar nova conta... }
  //   else { ...Trocar de conta (setSeletorAberto)... }
  let contaItem = null;
  if (visitante) {
    contaItem = { Icon: UserPlus, label: "Cadastrar conta", onClick: () => navigate("/cadastro", DE_PERFIL) };
  }

  return (
    <div
      className="tela-rolavel w-full flex flex-col"
      style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
    >
      <div
        className="conteudo-rolavel hide-scrollbar"
        style={{ paddingBottom: "calc(100px + env(safe-area-inset-bottom))" }}
      >
        {/* v6: titulo sobe com a rolagem, setinha fica (transparente) */}
        <TopoRolavel titulo="Perfil" onVoltar={() => navigate(-1)} recuo={20} />

        {/* v8: bola com foto/inicial escondida (MOSTRAR_AVATAR) */}
        {MOSTRAR_AVATAR && (
          <div className="px-5 pt-3 flex flex-col items-center">
            <div
              className="rounded-full overflow-hidden shrink-0"
              style={{
                /* Tamanho travado em px + box-sizing: sem isso a borda
                   somava ao total e a foto parecia encolher. */
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
            >
              {foto && !visitante ? (
                <img
                  src={foto}
                  alt=""
                  className="object-cover"
                  style={{ width: "100%", height: "100%", display: "block" }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="font-bold" style={{ color: "var(--primary)", fontSize: 34 }}>
                    {inicial || "?"}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="px-5">
          {/* ===== Topo: nome em destaque + chip do tipo + WhatsApp ===== */}
          <div style={{ paddingTop: 6 }}>
            <button
              type="button"
              disabled={!temMultiplas}
              onClick={() => temMultiplas && setSeletorAberto(true)}
              className="flex items-center gap-1.5 text-left max-w-full"
            >
              <span className="font-bold truncate" style={{ color: "var(--text)", fontSize: 26, lineHeight: 1.2 }}>
                {nomeExibido}
              </span>
              {temMultiplas && (
                <ChevronDown size={18} style={{ color: "var(--text-secondary)" }} className="shrink-0" />
              )}
            </button>

            <div className="flex items-center flex-wrap" style={{ gap: 8, marginTop: 8 }}>
              {!visitante && rotuloTipo && (
                <span
                  className="rounded-full font-semibold"
                  style={{
                    fontSize: 13,
                    padding: "4px 11px",
                    color: "var(--primary)",
                    backgroundColor: "rgba(34,197,94,0.14)",
                    border: "1px solid rgba(34,197,94,0.4)",
                  }}
                >
                  {rotuloTipo}
                </span>
              )}
              {whatsapp && (
                <span className="flex items-center text-[13.5px]" style={{ gap: 5, color: "var(--text-secondary)" }}>
                  <Phone size={14} strokeWidth={2} className="shrink-0" />
                  {whatsapp}
                </span>
              )}
            </div>
          </div>

          {/* ===== Meu MEI ===== */}
          {!visitante && (
            <CardSecao titulo="Meu MEI">
              <Linha
                Icon={Briefcase}
                rotulo="Tipo de MEI"
                valor={rotuloTipo}
                onClick={() => navigate("/editar-perfil", DE_PERFIL)}
              />
              {abertura && (
                <Linha
                  Icon={CalendarDays}
                  rotulo="Abertura"
                  valor={abertura}
                  onClick={() => navigate("/editar-perfil", DE_PERFIL)}
                />
              )}
              <Linha
                Icon={Gauge}
                rotulo={`Limite de ${anoAtual}`}
                detalhe={limiteEhProporcional ? "Proporcional aos meses desde a abertura" : null}
                valor={<Valor tamanho="sm">{limiteAtual}</Valor>}
              />
              <Linha
                Icon={ArrowDownLeft}
                rotulo="Já faturou"
                valor={<Valor tamanho="sm">{faturamentoAtual}</Valor>}
                onClick={() => navigate("/historico", DE_PERFIL)}
              />
              {situacao.tipo === "faltam" ? (
                <Linha
                  Icon={TrendingUp}
                  rotulo="Falta para o limite"
                  valor={<Valor tamanho="sm">{situacao.valor}</Valor>}
                />
              ) : (
                <Linha
                  Icon={TrendingUp}
                  rotulo="Passou do limite"
                  cor="var(--danger)"
                  valor={<Valor tamanho="sm">{situacao.valor}</Valor>}
                  onClick={() => navigate("/regra-vinte", DE_PERFIL)}
                />
              )}
              {/* Telas escondidas no piloto (chaves em src/config/piloto.js) */}
              {MOSTRAR_SAIDAS && (
                <Linha Icon={ArrowUpRight} rotulo="Histórico de saídas" onClick={() => navigate("/saidas", DE_PERFIL)} />
              )}
              {MOSTRAR_HISTORICO_DAS && (
                <Linha Icon={CalendarCheck} rotulo="Histórico de DAS" onClick={() => navigate("/das", DE_PERFIL)} />
              )}
              {MOSTRAR_NOTAS_FISCAIS && (
                <Linha Icon={FileText} rotulo="Histórico de notas fiscais" onClick={() => navigate("/notas-fiscais", DE_PERFIL)} />
              )}
              {MOSTRAR_ADICIONAR_MOVIMENTACOES && (
                <Linha Icon={TrendingUp} rotulo="Adicionar movimentações" onClick={() => navigate("/adicionar-faturamento", DE_PERFIL)} />
              )}
              {MOSTRAR_RESUMO_ANO && (
                <Linha Icon={BarChart3} rotulo={`Resumo de ${anoAtual}`} onClick={() => navigate("/perfil/resumo", DE_PERFIL)} />
              )}
            </CardSecao>
          )}

          {/* ===== Minha conta ===== */}
          <CardSecao titulo="Minha conta">
            {contaItem && <Linha Icon={contaItem.Icon} rotulo={contaItem.label} onClick={contaItem.onClick} />}
            {!visitante && (
              <Linha Icon={User} rotulo="Editar perfil" onClick={() => navigate("/editar-perfil", DE_PERFIL)} />
            )}
            {!visitante && (
              <Linha
                Icon={Phone}
                rotulo="WhatsApp"
                valor={whatsapp || "Não informado"}
                onClick={() => navigate("/editar-perfil", DE_PERFIL)}
              />
            )}
            {!visitante && email && (
              <Linha Icon={Mail} rotulo="E-mail" valor={email} onClick={() => navigate("/editar-perfil", DE_PERFIL)} />
            )}
            {!visitante && (
              <Linha Icon={Lock} rotulo="Alterar senha" onClick={() => navigate("/alterar-senha", DE_PERFIL)} />
            )}
            {MOSTRAR_PREFERENCIAS && (
              <Linha Icon={Settings} rotulo="Preferências" onClick={() => navigate("/preferencias", DE_PERFIL)} />
            )}
          </CardSecao>

          {/* ===== Ajuda ===== */}
          <CardSecao titulo="Ajuda">
            <Linha
              Icon={MessageCircle}
              rotulo="Falar com o Fisco no WhatsApp"
              onClick={() => abrirWhatsAppFisco(MENSAGENS_WHATSAPP.falarComFisco(dadosParaWhatsApp(app)))}
            />
            {MOSTRAR_TUTORIAL_NOTA && (
              <Linha Icon={FileText} rotulo="Como emitir nota" onClick={() => navigate("/como-emitir-nota", DE_PERFIL)} />
            )}
            {MOSTRAR_TUTORIAL_DAS && (
              <Linha Icon={CalendarCheck} rotulo="Como pagar o DAS" onClick={() => navigate("/como-pagar-das", DE_PERFIL)} />
            )}
          </CardSecao>

          {/* ===== Sobre ===== */}
          <CardSecao titulo="Sobre">
            <Linha Icon={Shield} rotulo="Termos de uso" onClick={() => navigate("/termos-de-uso", DE_PERFIL)} />
            <Linha Icon={Lock} rotulo="Política de privacidade" onClick={() => navigate("/privacidade", DE_PERFIL)} />
            {MOSTRAR_SOBRE && (
              <Linha Icon={Info} rotulo="Sobre o TaCerto!" onClick={() => navigate("/sobre", DE_PERFIL)} />
            )}
          </CardSecao>

          {/* selo discreto do piloto + versao */}
          <div className="flex flex-col items-center" style={{ marginTop: 14, gap: 6 }}>
            <span
              className="rounded-full flex items-center"
              style={{
                gap: 5,
                fontSize: 12,
                padding: "4px 10px",
                color: "var(--text-secondary)",
                border: "1px solid var(--border)",
              }}
            >
              <Sparkles size={12} strokeWidth={2.2} style={{ color: "var(--primary)" }} />
              TaCerto! é grátis
            </span>
            <span style={{ color: "var(--text-tertiary)", fontSize: 11 }}>v0.1</span>
          </div>

          {/* ===== Sair e Excluir (por ultimo) ===== */}
          {!visitante && (
            <CardSecao>
              <Linha Icon={LogOut} rotulo="Sair da conta" cor="var(--danger)" onClick={() => setConfirmarSair(true)} />
              <Linha Icon={Trash2} rotulo="Excluir conta" cor="var(--danger)" onClick={() => navigate("/excluir-conta", DE_PERFIL)} />
            </CardSecao>
          )}
        </div>
      </div>

      {seletorAberto && (
        <div
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
          onClick={() => setSeletorAberto(false)}
        >
          <div
            className="w-full max-w-md p-4 flex flex-col"
            style={{
              backgroundColor: "var(--surface)",
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              /* O rodapé fixo tem ~100px. Sem contar com ele aqui, o
                 último item da lista ("Adicionar nova conta") ficava
                 escondido atrás do BottomNav. */
              paddingBottom: "calc(env(safe-area-inset-bottom) + 96px)",
              maxHeight: "80dvh",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-1 pb-2 shrink-0">
              <p className="text-base font-bold" style={{ color: "var(--text)" }}>
                Minhas contas
              </p>
              <button
                onClick={() => setSeletorAberto(false)}
                aria-label="Fechar"
                className="toque w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "linear-gradient(160deg, var(--vidro-brilho-1) 0%, var(--vidro-brilho-2) 24%, transparent 58%), var(--vidro-bg)", backdropFilter: "blur(6px) saturate(160%)", WebkitBackdropFilter: "blur(6px) saturate(160%)", border: "1px solid var(--vidro-borda)", boxShadow: "inset 0 1.5px 0 0 var(--vidro-topo-forte), inset 0 9px 20px -8px var(--vidro-topo-medio), inset 0 -1.5px 0 0 var(--vidro-base), 0 8px 24px var(--vidro-sombra)" }}
              >
                <X size={16} style={{ color: "var(--text)" }} />
              </button>
            </div>
            {/* Rola quando há muitas contas, em vez de estourar a tela */}
            <div className="space-y-1 overflow-y-auto hide-scrollbar min-h-0">
              {contas.map((c) => {
                const ini = (c.nome || "?").trim().charAt(0).toUpperCase();
                const ativa = c.id === contaAtivaId;
                return (
                  <div key={c.id} className="flex items-center rounded-xl">
                    <button
                      onClick={() => trocarConta(c.id)}
                      className="toque flex-1 min-w-0 flex items-center gap-3 p-3 rounded-xl"
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 overflow-hidden"
                        style={{ background: "linear-gradient(160deg, var(--vidro-brilho-1) 0%, var(--vidro-brilho-2) 24%, transparent 58%), var(--vidro-bg)", backdropFilter: "blur(6px) saturate(160%)", WebkitBackdropFilter: "blur(6px) saturate(160%)", border: "1px solid var(--vidro-borda)", boxShadow: "inset 0 1.5px 0 0 var(--vidro-topo-forte), inset 0 9px 20px -8px var(--vidro-topo-medio), inset 0 -1.5px 0 0 var(--vidro-base), 0 8px 24px var(--vidro-sombra)" }}
                      >
                        {c.foto ? (
                          <img src={c.foto} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="font-bold" style={{ color: "var(--primary)" }}>{ini}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-sm font-semibold truncate" style={{ color: "var(--text)" }}>
                          {c.nome || "Conta"}
                        </p>
                        {c.email && (
                          <p className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>
                            {c.email}
                          </p>
                        )}
                      </div>
                      {ativa && <Check size={20} style={{ color: "var(--primary)" }} className="shrink-0" />}
                    </button>

                    {/* Remove só o acesso neste aparelho — não exclui a conta */}
                    <button
                      onClick={(e) => { e.stopPropagation(); setContaARemover(c); }}
                      aria-label={`Remover acesso da conta ${c.nome || ""}`}
                      className="toque w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                      style={{ marginLeft: 4 }}
                    >
                      <Trash2 size={17} style={{ color: "var(--text-tertiary)" }} />
                    </button>
                  </div>
                );
              })}
              <button
                onClick={() => { setSeletorAberto(false); navigate("/cadastro", DE_PERFIL); }}
                className="toque w-full flex items-center gap-3 p-3 rounded-xl"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: "linear-gradient(160deg, var(--vidro-brilho-1) 0%, var(--vidro-brilho-2) 24%, transparent 58%), var(--vidro-bg)", backdropFilter: "blur(6px) saturate(160%)", WebkitBackdropFilter: "blur(6px) saturate(160%)", border: "1px solid var(--vidro-borda)", boxShadow: "inset 0 1.5px 0 0 var(--vidro-topo-forte), inset 0 9px 20px -8px var(--vidro-topo-medio), inset 0 -1.5px 0 0 var(--vidro-base), 0 8px 24px var(--vidro-sombra)" }}
                >
                  <UserPlus size={18} style={{ color: "var(--primary)" }} />
                </div>
                <span className="text-sm font-semibold" style={{ color: "var(--primary)" }}>
                  Adicionar nova conta
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {contaARemover && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
          onClick={() => setContaARemover(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl p-5 space-y-3"
            style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <h3 className="text-base font-bold" style={{ color: "var(--text)" }}>
              Remover acesso?
            </h3>
            <p className="text-sm leading-snug" style={{ color: "var(--text-secondary)" }}>
              A conta{" "}
              <span style={{ color: "var(--text)", fontWeight: 600 }}>
                {contaARemover.email || contaARemover.nome || "selecionada"}
              </span>{" "}
              sai deste aparelho, mas não é excluída. Você pode entrar nela de
              novo quando quiser.
            </p>
            <p className="text-xs leading-snug" style={{ color: "var(--text-tertiary)" }}>
              Para excluir a conta de verdade, entre nela e use “Excluir conta”.
            </p>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setContaARemover(null)}
                className="toque flex-1 py-3 rounded-xl font-semibold"
                style={{ backgroundColor: "var(--field)", color: "var(--text)" }}
              >
                Cancelar
              </button>
              <button
                onClick={confirmarRemocao}
                className="toque flex-1 py-3 rounded-xl font-semibold"
                style={{ backgroundColor: "#ef4444", color: "#fff" }}
              >
                Remover
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmarSair && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-5 space-y-4"
            style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <h3 className="text-base font-bold" style={{ color: "var(--text)" }}>
              Quer sair da conta?
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmarSair(false)}
                className="toque flex-1 py-3 rounded-xl font-semibold"
                style={{ backgroundColor: "var(--field)", color: "var(--text)" }}
              >
                Cancelar
              </button>
              <button
                onClick={sairDaConta}
                disabled={saindo}
                className="toque flex-1 py-3 rounded-xl font-semibold"
                style={{ backgroundColor: "#ef4444", color: "#fff" }}
              >
                {saindo ? "Saindo..." : "Sair"}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav ativo="perfil" />
    </div>
  );
}