/* PERFIL v14 — os itens do Editar perfil vieram para ca, todos tocaveis (Nome, WhatsApp, Tipo de MEI, Abertura); sai a linha "Editar perfil"; "Excluir conta" no fim, tamanho normal (v13: "Falta" vira "Limite restante"; linha nova "Historico de lancamentos" (abre /historico) no Meu MEI (v12: sem a barra de baixo (MOSTRAR_BARRA_NO_PERFIL); botoes Sair/Remover em contorno vermelho (v11: sem o nome grande no topo; "Conta" primeiro (Editar perfil + Tema Preto/Branco); letras maiores (v10: lista simples estilo Pierre Finance; v9: selo "gratis"; v8: cartoes) */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav.jsx";
import {
  User, Settings, Info, Shield, Lock, LogOut,
  ChevronDown, UserPlus, X, Check, TrendingUp, BarChart3,
  Trash2, FileText, ArrowUpRight, ArrowDownLeft, CalendarCheck,
  Briefcase, CalendarDays, Gauge, MessageCircle, Sun, Moon, History, Phone,
} from "lucide-react";
import Calendario from "../components/Calendario.jsx";
import { LinhaCampo, AvisoFaleConosco, FolhaTipoMei } from "../components/PerfilFolhas.jsx";
import {
  DIAS_PARA_CORRIGIR_TIPO, formatarTelefone, sincronizarPerfilNoBanco,
} from "@/lib/perfil";
import { aplicarTema, temaEfetivo } from "./Preferencias.jsx";
import TopoRolavel from "../components/TopoRolavel.jsx";
import { SecaoLista, LinhaLista } from "../components/ListaSimples.jsx";
import Valor from "../components/Valor.jsx";
import { LABEL_TIPO, calcularFaltamOuExcedeu, LIMITE_NOME_INPUT } from "@/lib/fiscal";

import { useUserState, setUserState } from "@/lib/userState";
import {
  lerContas, lerContaAtivaId, ativarConta, removerAcessoConta,
} from "@/lib/contas";
import { supabase } from "@/lib/supabase";
import { useAppState } from "@/context/AppStateContext";
import {
  MOSTRAR_PREFERENCIAS, MOSTRAR_SAIDAS, MOSTRAR_HISTORICO_DAS, MOSTRAR_NOTAS_FISCAIS,
  MOSTRAR_ADICIONAR_MOVIMENTACOES, MOSTRAR_RESUMO_ANO, MOSTRAR_SOBRE,
  MOSTRAR_AVATAR, MOSTRAR_TUTORIAL_NOTA, MOSTRAR_TUTORIAL_DAS, MOSTRAR_LOGIN_EMAIL,
  MENSAGENS_WHATSAPP, dadosParaWhatsApp, abrirWhatsAppFisco,
} from "@/config/piloto";

/* ===================================================================
   PERFIL v14 (05/10/2026) — pedido do Fernando: "o Editar perfil ta
   vazio, com poucos itens: passe eles pra fora, clicaveis"
   - CONTA: Nome (toca e ja digita na linha; "Salvar" aparece embaixo
     quando muda), WhatsApp (toca: aviso "fale com a gente", o numero e
     o login) e Tema.
   - MEU MEI: Tipo de MEI abre a folha "Seu tipo de MEI" (O que
     mudou?); Abertura abre o calendario, so para quem abriu este ano
     (como no Editar perfil). Limite, ja faturado, limite restante e o
     Historico de lancamentos continuam.
   - No fim: Sair da conta e "Excluir conta" no tamanho normal.
   - A tela /editar-perfil continua existindo, sem link.
   As folhas e a gravacao no banco sao as mesmas do Editar perfil
   (components/PerfilFolhas.jsx e lib/perfil.js).
   =================================================================== */

/* ===================================================================
   PERFIL v11 (05/10/2026) — pedido do Fernando
   - Saiu o NOME GRANDE do topo (MOSTRAR_NOME_NO_TOPO = false, abaixo;
     o codigo continua). A tela abre direto na lista, sob o titulo
     "Perfil".
   - Ordem nova: CONTA primeiro (Editar perfil e Tema), depois MEU MEI,
     AJUDA, SOBRE e, por ultimo, Sair da conta.
   - TEMA de volta, so Preto ou Branco (sem "automatico"): grava em
     localStorage "tacerto_tema" ("escuro"/"claro") — a mesma chave que
     o main.jsx le ao abrir o app — e aplica na hora (aplicarTema, de
     Preferencias.jsx).
   - Letras maiores: ListaSimples v2 e valores em 15px.
   =================================================================== */
const MOSTRAR_NOME_NO_TOPO = false;

/* v12 (pedido do Fernando): a barra de baixo (Inicio, +, Perfil) some no
   Perfil. Volta-se ao Inicio pela setinha do topo ou pelo gesto. */
const MOSTRAR_BARRA_NO_PERFIL = false;

/* Preto | Branco, na propria linha do Tema */
function SeletorTema({ tema, onEscolher }) {
  const opcoes = [["escuro", "Preto"], ["claro", "Branco"]];
  return (
    <span className="inline-flex rounded-full" style={{ padding: 2, border: "1px solid var(--border)" }}>
      {opcoes.map(([valor, rotulo]) => {
        const ativo = tema === valor;
        return (
          <button
            key={valor}
            type="button"
            onClick={() => onEscolher(valor)}
            aria-pressed={ativo}
            className="rounded-full font-medium transition-colors"
            style={{
              fontSize: 14,
              padding: "5px 13px",
              backgroundColor: ativo ? "var(--field)" : "transparent",
              color: ativo ? "var(--text)" : "var(--text-tertiary)",
            }}
          >
            {rotulo}
          </button>
        );
      })}
    </span>
  );
}

/* ===================================================================
   PERFIL v10 (05/10/2026) — LISTA SIMPLES (referencia: Pierre Finance)
   - Sem cartoes: cada item e uma linha (SecaoLista/LinhaLista, em
     src/components/ListaSimples.jsx — o Editar perfil usa as mesmas).
   - Topo: SO o nome. Sairam o chip verde do tipo de MEI e o WhatsApp.
   - Saiu o selo "TaCerto! é grátis". A versao fica no rodape.
   - WhatsApp e e-mail nao aparecem mais aqui (so no Editar perfil).
   - MEU MEI: so informacao (sem setinha): tipo, abertura, limite do
     ano, ja faturado e falta (ou quanto passou, em vermelho).
   - CONTA: Editar perfil. "Alterar senha" so com MOSTRAR_LOGIN_EMAIL.
   - AJUDA: Falar com o Fisco.ia no WhatsApp, Como emitir nota, Como
     pagar o DAS. SOBRE: Termos de uso, Politica de privacidade.
   - Por ultimo "Sair da conta", linha simples. O "Excluir conta" foi
     para o fim do Editar perfil.
   =================================================================== */

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

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export default function Perfil() {
  const navigate = useNavigate();
  const { nome, visitante, setNome: salvarNome, setTipo } = useUserState();
  const app = useAppState();
  const { resetarConta, tipoMEI, mesAnoAbertura, setMesAnoAbertura, limiteAtual, faturamentoAtual, email } = app;
  const [saindo, setSaindo] = useState(false);

  /* v14: dados que vieram do Editar perfil (ver o topo do arquivo) */
  const [nomeCampo, setNomeCampo] = useState(nome || "");
  const [nomeSalvo, setNomeSalvo] = useState(false);
  const [whatsSalvo, setWhatsSalvo] = useState("");
  const [criadoEm, setCriadoEm] = useState(null);
  const [folhaTipoAberta, setFolhaTipoAberta] = useState(false);
  const [calendarioAberto, setCalendarioAberto] = useState(false);
  const [avisoWhats, setAvisoWhats] = useState(false);
  useEffect(() => { setNomeCampo(nome || ""); }, [nome]);
  const mudouNome = nomeCampo.trim() !== "" && nomeCampo.trim() !== (nome || "").trim();

  /* Numero do WhatsApp (perfis.whatsapp ou o telefone do login) e a
     data do cadastro (prazo para corrigir o tipo de MEI). */
  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const user = userData?.user;
        if (!user) return;
        if (ativo) setCriadoEm(user.created_at || null);
        const { data } = await supabase.from("perfis").select("whatsapp").eq("id", user.id).single();
        const numero = data?.whatsapp || user.phone || "";
        if (ativo && numero) setWhatsSalvo(formatarTelefone(String(numero).replace(/^\+?55/, "")));
      } catch { /* sem rede: a linha mostra "Não informado" */ }
    })();
    return () => { ativo = false; };
  }, []);

  function salvarNomeNovo() {
    const limpo = nomeCampo.trim();
    if (!limpo) return;
    salvarNome(limpo);
    sincronizarPerfilNoBanco({ nome: limpo });
    setNomeSalvo(true);
    setTimeout(() => setNomeSalvo(false), 1800);
  }

  const podeCorrigirTipo =
    !!criadoEm && Date.now() - new Date(criadoEm).getTime() <= DIAS_PARA_CORRIGIR_TIPO * 86400000;
  function corrigirTipo(novo) {
    setTipo(novo);
    sincronizarPerfilNoBanco({ tipo: novo });
    setFolhaTipoAberta(false);
  }

  /* Abertura: ano corrente grava; ano anterior apaga (so importa no 1o ano) */
  function escolherAbertura(m, a) {
    if (Number(a) === new Date().getFullYear()) {
      setMesAnoAbertura(m, a);
      sincronizarPerfilNoBanco({ mesAbertura: m, anoAbertura: a });
    } else {
      setMesAnoAbertura(null, null);
      sincronizarPerfilNoBanco({ mesAbertura: null, anoAbertura: null });
    }
    setCalendarioAberto(false);
  }

  const cardFolha = { backgroundColor: "var(--surface)", border: "1px solid var(--border)" };

  /* v12: sem a barra de baixo, a setinha e o caminho de volta. Se o
     Perfil foi aberto de dentro do app, volta uma tela; se foi aberto
     direto (link/recarregou), vai para o Inicio. */
  function voltarDoPerfil() {
    if ((window.history.state?.idx ?? 0) > 0) navigate(-1);
    else navigate("/dashboard", { replace: true });
  }

  /* v11: tema Preto/Branco. "auto" (de versoes antigas) vira o que
     estiver valendo agora. */
  const [tema, setTema] = useState(() => {
    try {
      return temaEfetivo(localStorage.getItem("tacerto_tema") || "escuro");
    } catch {
      return "escuro";
    }
  });
  function escolherTema(valor) {
    setTema(valor);
    try { localStorage.setItem("tacerto_tema", valor); } catch { /* ignora */ }
    aplicarTema(valor);
  }

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
        style={{ paddingBottom: MOSTRAR_BARRA_NO_PERFIL ? "calc(100px + env(safe-area-inset-bottom))" : "calc(32px + env(safe-area-inset-bottom))" }}
      >
        {/* v6: titulo sobe com a rolagem, setinha fica (transparente) */}
        <TopoRolavel titulo="Perfil" onVoltar={voltarDoPerfil} recuo={20} />

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
          {/* ===== v11: Conta PRIMEIRO (Editar perfil + Tema) ===== */}
          <SecaoLista titulo="Conta" style={{ marginTop: 8 }}>
            {contaItem && <LinhaLista Icon={contaItem.Icon} rotulo={contaItem.label} onClick={contaItem.onClick} />}
            {/* v14: Nome e WhatsApp vieram do Editar perfil */}
            {!visitante && (
              <LinhaCampo Icon={User} rotulo="Nome">
                <input
                  value={nomeCampo}
                  maxLength={LIMITE_NOME_INPUT}
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  onChange={(e) => setNomeCampo(e.target.value)}
                  placeholder="Seu nome"
                  className="flex-1 min-w-0 bg-transparent text-right outline-none"
                  style={{ color: "var(--text-secondary)", fontSize: 16, border: "none", boxShadow: "none" }}
                />
              </LinhaCampo>
            )}
            {!visitante && (
              <LinhaLista
                Icon={Phone}
                rotulo="WhatsApp"
                valor={whatsSalvo ? `+55 ${whatsSalvo}` : "Não informado"}
                onClick={() => setAvisoWhats(true)}
              />
            )}
            <LinhaLista
              Icon={tema === "claro" ? Sun : Moon}
              rotulo="Tema"
              valor={<SeletorTema tema={tema} onEscolher={escolherTema} />}
            />
            {/* v10: so com o login por e-mail ligado (MOSTRAR_LOGIN_EMAIL) */}
            {!visitante && MOSTRAR_LOGIN_EMAIL && (
              <LinhaLista Icon={Lock} rotulo="Alterar senha" onClick={() => navigate("/alterar-senha", DE_PERFIL)} />
            )}
            {MOSTRAR_PREFERENCIAS && (
              <LinhaLista Icon={Settings} rotulo="Preferências" onClick={() => navigate("/preferencias", DE_PERFIL)} />
            )}
          </SecaoLista>

          {/* v14: "Salvar" do nome, so quando o nome mudou */}
          {(mudouNome || nomeSalvo) && (
            <button
              type="button"
              onClick={salvarNomeNovo}
              disabled={nomeSalvo}
              className={`${nomeSalvo ? "" : "botao-confirmar "}toque w-full rounded-2xl font-semibold`}
              style={{
                marginTop: 10,
                padding: "13px 0",
                fontSize: 15.5,
                color: "var(--primary)",
                backgroundColor: nomeSalvo ? "var(--field)" : "transparent",
              }}
            >
              {nomeSalvo ? "Nome salvo" : "Salvar nome"}
            </button>
          )}

          {/* ===== Topo: SO o nome (v10). v11: escondido (MOSTRAR_NOME_NO_TOPO) ===== */}
          {MOSTRAR_NOME_NO_TOPO && (
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
          </div>
          )}

          {/* ===== Meu MEI: so informacao, sem setinha ===== */}
          {!visitante && (
            <SecaoLista titulo="Meu MEI">
              {/* v14: tocaveis (vieram do Editar perfil). A abertura so
                  muda para quem abriu este ano (limite proporcional). */}
              <LinhaLista Icon={Briefcase} rotulo="Tipo de MEI" valor={rotuloTipo} onClick={() => setFolhaTipoAberta(true)} />
              {abertura && (
                <LinhaLista
                  Icon={CalendarDays}
                  rotulo="Abertura"
                  valor={abertura}
                  onClick={Number(mesAnoAbertura?.ano) === anoAtual ? () => setCalendarioAberto(true) : undefined}
                />
              )}
              <LinhaLista
                Icon={Gauge}
                rotulo="Limite do ano"
                detalhe={limiteEhProporcional ? "Proporcional" : null}
                valor={<Valor px={15} cor="var(--text-secondary)">{limiteAtual}</Valor>}
              />
              <LinhaLista
                Icon={ArrowDownLeft}
                rotulo="Já faturado"
                valor={<Valor px={15} cor="var(--text-secondary)">{faturamentoAtual}</Valor>}
              />
              {situacao.tipo === "faltam" ? (
                <LinhaLista
                  Icon={TrendingUp}
                  rotulo="Limite restante"
                  valor={<Valor px={15} cor="var(--text-secondary)">{situacao.valor}</Valor>}
                />
              ) : (
                <LinhaLista
                  Icon={TrendingUp}
                  rotulo="Passou do limite"
                  valor={<Valor px={15} cor="var(--danger)">{situacao.valor}</Valor>}
                />
              )}
              {/* v13: historico de lancamentos (entradas) */}
              <LinhaLista Icon={History} rotulo="Histórico de lançamentos" onClick={() => navigate("/historico", DE_PERFIL)} />
              {/* Telas escondidas no piloto (chaves em src/config/piloto.js) */}
              {MOSTRAR_SAIDAS && (
                <LinhaLista Icon={ArrowUpRight} rotulo="Histórico de saídas" onClick={() => navigate("/saidas", DE_PERFIL)} />
              )}
              {MOSTRAR_HISTORICO_DAS && (
                <LinhaLista Icon={CalendarCheck} rotulo="Histórico de DAS" onClick={() => navigate("/das", DE_PERFIL)} />
              )}
              {MOSTRAR_NOTAS_FISCAIS && (
                <LinhaLista Icon={FileText} rotulo="Histórico de notas fiscais" onClick={() => navigate("/notas-fiscais", DE_PERFIL)} />
              )}
              {MOSTRAR_ADICIONAR_MOVIMENTACOES && (
                <LinhaLista Icon={TrendingUp} rotulo="Adicionar movimentações" onClick={() => navigate("/adicionar-faturamento", DE_PERFIL)} />
              )}
              {MOSTRAR_RESUMO_ANO && (
                <LinhaLista Icon={BarChart3} rotulo={`Resumo de ${anoAtual}`} onClick={() => navigate("/perfil/resumo", DE_PERFIL)} />
              )}
            </SecaoLista>
          )}

          {/* ===== Ajuda ===== */}
          <SecaoLista titulo="Ajuda">
            <LinhaLista
              Icon={MessageCircle}
              rotulo="Falar com o Fisco.ia no WhatsApp"
              onClick={() => abrirWhatsAppFisco(MENSAGENS_WHATSAPP.falarComFisco(dadosParaWhatsApp(app)))}
            />
            {MOSTRAR_TUTORIAL_NOTA && (
              <LinhaLista Icon={FileText} rotulo="Como emitir nota" onClick={() => navigate("/como-emitir-nota", DE_PERFIL)} />
            )}
            {MOSTRAR_TUTORIAL_DAS && (
              <LinhaLista Icon={CalendarCheck} rotulo="Como pagar o DAS" onClick={() => navigate("/como-pagar-das", DE_PERFIL)} />
            )}
          </SecaoLista>

          {/* ===== Sobre ===== */}
          <SecaoLista titulo="Sobre">
            <LinhaLista Icon={Shield} rotulo="Termos de uso" onClick={() => navigate("/termos-de-uso", DE_PERFIL)} />
            <LinhaLista Icon={Lock} rotulo="Política de privacidade" onClick={() => navigate("/privacidade", DE_PERFIL)} />
            {MOSTRAR_SOBRE && (
              <LinhaLista Icon={Info} rotulo="Sobre o TaCerto!" onClick={() => navigate("/sobre", DE_PERFIL)} />
            )}
          </SecaoLista>

          {/* ===== Sair e Excluir conta (por ultimo, linhas simples).
               v14: o "Excluir conta" voltou do Editar perfil. ===== */}
          {!visitante && (
            <SecaoLista>
              <LinhaLista
                Icon={LogOut}
                rotulo="Sair da conta"
                cor="var(--danger)"
                semSeta
                onClick={() => setConfirmarSair(true)}
              />
              {/* v14: Excluir conta voltou para o Perfil, tamanho normal */}
              <LinhaLista
                Icon={Trash2}
                rotulo="Excluir conta"
                cor="var(--danger)"
                semSeta
                onClick={() => navigate("/excluir-conta", DE_PERFIL)}
              />
            </SecaoLista>
          )}

          {/* Versao do app no rodape */}
          <p className="text-center" style={{ color: "var(--text-tertiary)", fontSize: 11, marginTop: 24 }}>
            v0.1
          </p>
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
                className="botao-perigo toque flex-1 py-3 rounded-xl font-semibold"
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
                className="botao-perigo toque flex-1 py-3 rounded-xl font-semibold"
                style={{ backgroundColor: "#ef4444", color: "#fff" }}
              >
                {saindo ? "Saindo..." : "Sair"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* v14: folhas que vieram do Editar perfil */}
      <Calendario
        aberto={calendarioAberto}
        modo="mesAno"
        mes={mesAnoAbertura?.mes || null}
        ano={mesAnoAbertura?.ano || null}
        onFechar={() => setCalendarioAberto(false)}
        onSelecionarMesAno={escolherAbertura}
      />
      {folhaTipoAberta && (
        <FolhaTipoMei
          tipo={tipoMEI}
          podeCorrigir={podeCorrigirTipo}
          onFechar={() => setFolhaTipoAberta(false)}
          onCorrigir={corrigirTipo}
          cardStyle={cardFolha}
        />
      )}
      {avisoWhats && (
        <AvisoFaleConosco
          texto="Seu número é usado para entrar no app. Para trocar, fale com a gente."
          onWhatsApp={() => {
            abrirWhatsAppFisco(MENSAGENS_WHATSAPP.trocarNumero(dadosParaWhatsApp({ ...app, nome: nomeCampo.trim() || nome })));
            setAvisoWhats(false);
          }}
          onFechar={() => setAvisoWhats(false)}
          cardStyle={cardFolha}
        />
      )}

      {/* v12: sem a barra de baixo no Perfil (MOSTRAR_BARRA_NO_PERFIL) */}
      {MOSTRAR_BARRA_NO_PERFIL && <BottomNav ativo="perfil" />}
    </div>
  );
}