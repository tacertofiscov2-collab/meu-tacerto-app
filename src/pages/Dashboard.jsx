/* DASHBOARD v35 — o portao, quando as regras do pagador resolvem tudo sozinhas, tambem confere se o extrato ja pode substituir o total do ano digitado (substituirTotalPeloExtrato) (v34: proximo DAS com feriados nacionais (vencimentoDas.js: dia 20 ou o proximo dia util) (v33: o atalho NF abre a janela "Notas fiscais" (/notas-fiscais) (v32: o portao das entradas confirma pelas regras do pagador SEM contar duas vezes (lancarEntradasConfirmadas: casa com lancamento a mao e diminui o ajuste do total do ano) (v31: visual F: "Atualizado em 08/10 às 14:32" + botao "Atualizar velocimetro" abaixo do velocimetro (zerado: "Falta informar" e o botao em destaque) e selo Estimado/Conferido no velocimetro do ano; a folha de atualizar abre sempre (v30: valor do DAS pelo CNAE do perfil (fiscal.js) e o CNPJ nas mensagens do WhatsApp (v29: velocimetro maior no visual F (arco, numero, valores, rotulos e bolinhas; o "MEI · anual" fica igual) e a barra dos 3 atalhos centrada entre as bolinhas e o rodape; "Fisco.ia" vira "Fisco" nos textos (v28: tela A (F) escolhida: 3 atalhos curtos (DAS, Fisco com o simbolo do WhatsApp, NF), velocimetro mais alto (respiro antes da barra), notificacao "Atualize seu velocimetro" (FolhaAtualizarVelocimetro) (v27: "tela B" para comparar (visual G = F invertido: 3 atalhos em cima, velocimetro embaixo); seletor A (F) / B (G) (v26: sininho de notificacoes no topo (BotaoNotificacoes) e a Apresentacao do Fisco.ia (tutorial); marca da media lida via useMarcaDaConta (v25: Inicio F com o "+" sem circulo; explicacao da media limite so com texto + "Entendi" e so UMA vez (o "?" do card B some depois de ler) (v24: 3 variacoes novas do Inicio (D cartoes, E DAS em destaque, F barra unica), sem bolinhas; seletor de teste mostra so C, D, E e F (v23: variacoes do visual para teste (Atual, A lista, B blocos, C atalhos), sem bordas de vidro; seletor no topo (MOSTRAR_SELETOR_VISUAL_INICIO) (v22: "Fisco" vira "Fisco.ia" nos textos da tela (v21: card do DAS: "Proximo DAS: 20/10" sem cortar + botao "Emitir boleto" que abre o painel de pagamento (FolhaPagarDas); v20: mensagens prontas do WhatsApp) */
import { useNavigate } from "react-router-dom";
import { useRef, useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Gauge, ChevronRight, Send, X, Mic, Image as ImageIcon, Camera, FileText, Sparkles, BookOpen,
  CalendarClock, MessageCircle, RefreshCw, Check,
} from "lucide-react";
import BottomNav from "../components/BottomNav.jsx";
import { SecaoLista, LinhaLista } from "../components/ListaSimples.jsx";
import Valor from "../components/Valor.jsx";
import VelocimetroAnimado from "../components/VelocimetroAnimado.jsx";
import SimboloPluggy from "../components/SimboloPluggy.jsx";
import FolhaPagarDas from "../components/FolhaPagarDas.jsx";
import BotaoNotificacoes from "../components/Notificacoes.jsx";
import ApresentacaoFisco from "../components/ApresentacaoFisco.jsx";
import FolhaAtualizarVelocimetro from "../components/FolhaAtualizarVelocimetro.jsx";
import IconeWhatsApp from "../components/IconeWhatsApp.jsx";
import { useMarcaDaConta } from "@/lib/marcasDaConta";
import { useAppState } from "@/context/AppStateContext";
import {
  LABEL_TIPO, faixaDoVelocimetro, FAIXA_INFO,
  truncarNome, valorDasMensal,
} from "@/lib/fiscal";
import { supabase } from "@/lib/supabase";
import { listarConexoes, sincronizar, organizarPelasRegras } from "@/lib/openfinance";
import { seloDoVelocimetro, PREFIXO_EXTRATO } from "@/lib/conciliacao";
import { lancarEntradasConfirmadas, substituirTotalPeloExtrato } from "@/lib/importarExtrato";
import { proximoVencimentoDas } from "@/lib/vencimentoDas";
import {
  MOSTRAR_OPEN_FINANCE, MOSTRAR_CHAT_FISCO, MOSTRAR_RESUMO_ANO, linkWhatsAppFisco,
  MENSAGENS_WHATSAPP, dadosParaWhatsApp, abrirWhatsAppFisco,
  MOSTRAR_CARD_DAS, MOSTRAR_TUTORIAL_NOTA,
  MOSTRAR_SELETOR_VISUAL_INICIO, VISUAL_INICIO_PADRAO, MOSTRAR_NOTIFICACOES, MOSTRAR_JANELA_NOTAS,
} from "@/config/piloto";
/* DASHBOARD v19 (04/10/2026) — EXTRAS DO PILOTO
   - Card "Proximo DAS" logo abaixo do velocimetro (CardProximoDas,
     chave MOSTRAR_CARD_DAS): data do proximo vencimento (dia 20) e o
     valor do DAS de 2026 conforme o tipo de MEI, com o botao "Pagar no
     gov.br" que abre o PGMEI. Nao grava nada no banco e nunca diz que
     um DAS esta "em aberto".
   - Botao pequeno "Como emitir nota" no canto de cima, no lugar do
     botao do banco (BotaoComoEmitirNota, chave MOSTRAR_TUTORIAL_NOTA):
     abre /como-emitir-nota. */
/* DASHBOARD v18 (04/10/2026) — PILOTO com 30 MEI Caminhoneiros.

   Chaves em src/config/piloto.js (nada foi apagado):
   - MOSTRAR_OPEN_FINANCE = false: o botao do banco no canto de cima
     some, e com ele a sincronizacao ao abrir o app. O portao das
     entradas ("E faturamento?") continua: ele so le o banco de dados.
   - MOSTRAR_CHAT_FISCO = false: a barra "Pergunte ao Fisco..." vira o
     botao "Falar com o Fisco no WhatsApp" (BotaoFiscoWhatsApp). O balao
     "?" do card A (que abria o "Tirar duvidas") so aparece acima do
     limite (+N% ou alerta) e abre a tela da regra dos 20%. No card B o
     "?" continua abrindo a media limite; o "Nao entendi, falar com o
     Fisco" de la vira "Falar com o Fisco no WhatsApp", com a pergunta
     ja escrita.
   - MOSTRAR_RESUMO_ANO = false: tocar em Faturado/Limite abre o
     Historico de entradas (a lista dos lancamentos), nao o Resumo.

   O que ja existia (carrossel, painel da media limite, caixa do chat,
   botao do banco) continua no arquivo, pronto para religar. */
/* DASHBOARD v3 — cabecalho no painel de perguntas + limpeza do chat morto.

   1) O painel de perguntas abria com um vazio grande no topo (o espaco
      reservado para o X). Agora esse espaco tem titulo: rotulo na cor da
      faixa, o resumo da situacao atual e o que fazer. Ver PainelPerguntas.

   2) REMOVIDO o ChatFiscoExpandido e seus auxiliares (BolhaMensagem,
      MenuMensagem, FiscoDigitando, PainelHistorico). Era uma copia
      inteira do chat que NUNCA abria: so seria acionada por
      abrirConversa/novaConversa, que por sua vez so eram chamadas de
      dentro dele mesmo. Alem disso o onEnviar era funcao vazia.
      O chat de verdade vive em src/components/ChatFiscoUI.jsx, usado
      pela pagina /fisco. Aqui o dashboard so navega pra la.

/* Marca de onde a navegação partiu: o TelaComVoltarReal usa isso para
   mostrar a tela certa por trás quando o usuário arrasta para voltar. */
const DE_DASHBOARD = { state: { de: "dashboard" } };

/* Altura maxima do campo da caixinha do Fisco (em px). Ele cresce com o
   texto ate esse limite e depois rola por dentro, com a barra de rolagem
   visivel. ~150px da umas 6 linhas. */
const MAX_ALTURA_CAIXA_FISCO = 150;

/* ===================================================================
   VIDRO — os valores vêm do index.css e mudam com o tema.

   No tema escuro o fundo é quase preto com brilhos brancos; no tema
   claro, fundo quase branco com brilhos suaves. Ver as variáveis
   --vidro-* em src/index.css.
   =================================================================== */
const VIDRO = {
  background:
    "linear-gradient(160deg, var(--vidro-brilho-1) 0%, var(--vidro-brilho-2) 24%, transparent 58%), var(--vidro-bg)",
  backdropFilter: "blur(24px) saturate(160%)",
  WebkitBackdropFilter: "blur(24px) saturate(160%)",
  border: "1px solid var(--vidro-borda)",
  boxShadow:
    "inset 0 1.5px 0 0 var(--vidro-topo-forte), inset 0 9px 20px -8px var(--vidro-topo-medio), inset 0 -1.5px 0 0 var(--vidro-base), 0 8px 24px var(--vidro-sombra)",
};

/* Reflexo reduzido: um pouco mais forte que o dos cards A/B.
   Usado nas barras do chat e na caixa expandida. */
const VIDRO_SUAVE = {
  background:
    "linear-gradient(160deg, var(--vidro-brilho-1) 0%, var(--vidro-brilho-2) 24%, transparent 58%), var(--vidro-bg)",
  backdropFilter: "blur(24px) saturate(160%)",
  WebkitBackdropFilter: "blur(24px) saturate(160%)",
  border: "1px solid var(--vidro-borda)",
  boxShadow:
    "inset 0 1px 0 0 var(--vidro-topo-medio), inset 0 7px 16px -8px var(--vidro-topo-fraco), inset 0 -1.5px 0 0 var(--vidro-base), 0 8px 24px var(--vidro-sombra)",
};

const VIDRO_CHAT = {
  background:
    "linear-gradient(160deg, var(--vidro-brilho-2) 0%, var(--vidro-brilho-3) 24%, transparent 58%), var(--vidro-bg-leve)",
  backdropFilter: "blur(28px) saturate(160%)",
  WebkitBackdropFilter: "blur(28px) saturate(160%)",
  border: "1px solid var(--vidro-borda)",
  boxShadow:
    "inset 0 1px 0 0 var(--vidro-topo-medio), inset 0 7px 16px -8px var(--vidro-topo-fraco), 0 12px 36px var(--vidro-sombra-forte)",
};


/* Perguntas sugeridas por situação. Tocar numa delas abre o chat do
   Fisco já com a pergunta enviada. */
const PERGUNTAS_POR_FAIXA = {
  tranquilo: [
    "Quanto ainda posso faturar este ano?",
    "Quando vence o DAS e quanto é?",
    "Preciso emitir nota em todo serviço?",
    "O que acontece se eu atrasar o DAS?",
    "Como funciona a declaração anual (DASN)?",
    "Posso ter funcionário sendo MEI?",
    "Tenho direito a aposentadoria?",
    "E se eu ficar doente, recebo alguma coisa?",
    "Posso ter mais de um MEI?",
    "Preciso de conta bancária separada?",
  ],
  fique_de_olho: [
    "Quanto ainda posso faturar este ano?",
    "Estou no ritmo certo para o ano?",
    "Quando vence o DAS e quanto é?",
    "O que acontece se eu passar do limite?",
    "Preciso emitir nota em todo serviço?",
    "Como funciona a declaração anual (DASN)?",
    "Posso ter funcionário sendo MEI?",
    "Tenho direito a aposentadoria?",
    "O que acontece se eu atrasar o DAS?",
    "Preciso de conta bancária separada?",
  ],
  atencao: [
    "O que acontece se eu passar do limite?",
    "Quanto ainda posso faturar sem estourar?",
    "Posso adiantar recebimentos para o ano que vem?",
    "O que é a regra dos 20%?",
    "Como faço para virar ME?",
    "Vou pagar mais imposto se mudar de categoria?",
    "Estou no ritmo certo para o ano?",
    "Perco meus direitos se sair do MEI?",
    "Quando vence o DAS e quanto é?",
    "Devo parar de faturar até dezembro?",
  ],
  perto_do_limite: [
    "Quanto ainda posso faturar sem estourar?",
    "O que acontece se eu passar do limite?",
    "O que é a regra dos 20%?",
    "Posso adiantar recebimentos para o ano que vem?",
    "Como faço para virar ME?",
    "Vou pagar mais imposto se mudar de categoria?",
    "Devo parar de faturar até dezembro?",
    "Perco meus direitos se sair do MEI?",
    "Preciso avisar a Receita de alguma coisa?",
    "Quanto tempo tenho para regularizar?",
  ],
  estourou: [
    "Passei do limite. E agora, o que fazer?",
    "O que é a regra dos 20%?",
    "Vou ter que virar ME? Como funciona?",
    "Quanto vou pagar de imposto sobre o excesso?",
    "Perco meus direitos de MEI?",
    "Preciso avisar a Receita de alguma coisa?",
    "Quanto tempo tenho para regularizar?",
    "Posso voltar a ser MEI no ano que vem?",
    "Vou pagar multa?",
    "Preciso de um contador agora?",
  ],
  critico: [
    "Passei muito do limite. O que fazer agora?",
    "O que acontece quando passo de 20% do limite?",
    "Sou desenquadrado automaticamente?",
    "Vou ter que virar ME? Como funciona?",
    "Quanto vou pagar de imposto sobre o excesso?",
    "Vou pagar multa?",
    "Perco meus direitos de MEI?",
    "Preciso de um contador agora?",
    "Posso voltar a ser MEI no ano que vem?",
    "Quanto tempo tenho para regularizar?",
  ],
};

function perguntasDaSituacao(faixa) {
  return PERGUNTAS_POR_FAIXA[faixa] || PERGUNTAS_POR_FAIXA.tranquilo;
}

/* Valor em reais com centavos: R$ 6.750,00 / R$ 20.966,67 */
function reais(v) {
  return (
    "R$ " +
    Number(v || 0).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

function saudacaoPorHora() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "Bom dia,";
  if (h >= 12 && h < 18) return "Boa tarde,";
  return "Boa noite,";
}

function hexToRgba(hex, alpha) {
  const h = String(hex).replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function BolinhasIndicadoras({ pagina, irPara, grande = false }) {
  /* v29: um pouco maiores no velocimetro grande (visual F) */
  const [tamAtiva, tamOutra] = grande ? [12, 10] : [11, 9];
  return (
    <div className="flex items-center justify-center gap-2 shrink-0" style={{ marginTop: grande ? 12 : 10 }}>
      {[0, 1].map((i) => {
        const ativa = pagina === i;
        return (
          <button
            key={i}
            onClick={(e) => { e.stopPropagation(); irPara(i); }}
            aria-label={`Ir para tela ${i + 1}`}
            className="rounded-full transition-all"
            style={{
              width: ativa ? tamAtiva : tamOutra,
              height: ativa ? tamAtiva : tamOutra,
              backgroundColor: "var(--primary)",
              opacity: ativa ? 1 : 0.22,
              boxShadow: ativa ? "0 0 9px rgba(34, 197, 94, 0.65)" : "none",
            }}
          />
        );
      })}
    </div>
  );
}

/* ===================================================================
   UMA PAGINA DO CARROSSEL = UM VELOCIMETRO (v7 — decidido 26/09/2026)

   Card A: velocimetro do ANO    -> Faturado x Limite
   Card B: velocimetro da MEDIA  -> Media por mes x Media limite

   A "Media limite" (limite do ano / 12) NAO e teto obrigatorio: nao
   existe limite mensal para o MEI, da para faturar mais num mes e menos
   em outro. E so uma ajuda de controle — se a media por mes ficar ate
   ela, o ano fecha dentro do limite. Por isso o card B nao usa a palavra
   "Limite" sozinha e o balao dele nao mostra o alerta dos 20% (a margem
   da lei vale para o ANO, nao para o mes).

   O balao ao lado do numero existe SEMPRE e abre o painel do card.

   v12: SO O CARD A ALARMA (borda vermelha pulsando, balao "+N%" ou
   alerta). O card B nunca muda de comportamento: o balao dele e sempre
   "?", e so a COR do "?" acompanha a situacao da media.
   =================================================================== */
/* Tamanho do rotulo embaixo do velocimetro ("MEI · anual" e
   "MEI · media mes"), em px. Era 11,5. Para ajustar, mude so este numero. */
const TAMANHO_ROTULO_CARD = 14;

/* ===================================================================
   TAMANHO DO VELOCIMETRO (v16)

   Em tela baixa (celular pequeno, navegador com barras grandes), o
   velocimetro de tamanho fixo nao cabia: o numero e o balao "?"
   invadiam o "MEI · anual". Agora cada pagina MEDE a altura que tem
   e o velocimetro encolhe o necessario (ate um minimo). Em tela alta,
   como o iPhone, continua no tamanho de sempre (205).

   Conta: o arco tem altura = 60% da largura (desenho 200 x 120); embaixo
   dele vem o numero + balao (ALTURA_NUMERO_E_BALAO, com folga).
   =================================================================== */
const LARGURA_MAX_VELOCIMETRO = 205;
const LARGURA_MIN_VELOCIMETRO = 120;
const ALTURA_NUMERO_E_BALAO = 64;

/* v29: VELOCIMETRO GRANDE (visual F) — pedido do Fernando: "cresca tudo
   do velocimetro (letras, numeros, o arco), mantendo o espaco; so o
   'MEI · anual' fica do mesmo tamanho". O arco continua encolhendo
   sozinho se a tela for baixa (conta acima), entao nada sai do lugar. */
const VELOCIMETRO_GRANDE = {
  larguraMax: 250,
  alturaNumero: 86,
  numeroClasse: "text-5xl font-bold",
  valorPx: 19,
  rotuloValorPx: 14,
};

function PaginaVelocimetro({
  rotulo, percentual, alertaDos20 = true, apenasInterrogacao = false, descricao,
  valorEsquerda, rotuloEsquerda, valorDireita, rotuloDireita,
  onBalao, onValores,
  /* v18: false = balao so acima de 100% (+N%/alerta), chamando onExcedente */
  sempreMostrarBalao = true, onExcedente,
  /* v25: true = sem balao nenhum (card B depois de ler a explicacao) */
  semBalao = false,
  /* v29: tamanho maior (visual F), ver VELOCIMETRO_GRANDE */
  grande = false,
  /* v31: selo "Estimado" | "Conferido" ao lado do rotulo (so o ano, visual F) */
  selo = null,
}) {
  const areaRef = useRef(null);
  const larguraMax = grande ? VELOCIMETRO_GRANDE.larguraMax : LARGURA_MAX_VELOCIMETRO;
  const alturaNumero = grande ? VELOCIMETRO_GRANDE.alturaNumero : ALTURA_NUMERO_E_BALAO;
  const [larguraVel, setLarguraVel] = useState(larguraMax);

  useEffect(() => {
    const el = areaRef.current;
    if (!el) return undefined;
    const medir = () => {
      const altura = el.clientHeight;
      if (!altura) return;
      const cabe = Math.floor((altura - alturaNumero) / 0.6);
      setLarguraVel(
        Math.max(LARGURA_MIN_VELOCIMETRO, Math.min(larguraMax, cabe)),
      );
    };
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, [larguraMax, alturaNumero]);

  return (
    <div
      className="h-full flex flex-col px-5 pb-1 min-h-0"
      style={{ flex: "0 0 50%", width: "50%" }}
    >
      <div ref={areaRef} className="flex-1 min-h-0 flex items-center justify-center">
        <VelocimetroAnimado
          percentual={percentual}
          maxWidth={larguraVel}
          numeroClasse={grande ? VELOCIMETRO_GRANDE.numeroClasse : "text-4xl font-bold"}
          sempreMostrarBalao={sempreMostrarBalao}
          onClickBalao={onBalao}
          onClickExcedente={onExcedente}
          alertaDos20={alertaDos20}
          apenasInterrogacao={apenasInterrogacao}
          descricao={descricao}
          semBalao={semBalao}
        />
      </div>

      {rotulo && (
        <p
          className="text-center shrink-0 flex items-center justify-center"
          style={{ color: "var(--text-tertiary)", fontSize: TAMANHO_ROTULO_CARD, marginBottom: 2, gap: 7 }}
        >
          {rotulo}
          {selo && <SeloVelocimetro tipo={selo} />}
        </p>
      )}

      <div
        className="flex items-stretch pt-3 shrink-0"
        style={{ borderTop: "1px solid var(--border)", marginTop: 2 }}
      >
        <button
          onClick={onValores}
          className="toque rounded-xl flex-1 flex flex-col items-center text-center min-w-0"
          style={{ paddingLeft: 12, paddingRight: 12 }}
        >
          <Valor {...(grande ? { px: VELOCIMETRO_GRANDE.valorPx } : { tamanho: "md" })} autoAjustar>{valorEsquerda}</Valor>
          <span
            className="text-xs mt-1"
            style={{ color: "var(--text-secondary)", ...(grande ? { fontSize: VELOCIMETRO_GRANDE.rotuloValorPx } : null) }}
          >
            {rotuloEsquerda}
          </span>
        </button>

        <div
          aria-hidden
          className="shrink-0"
          style={{ width: 1, backgroundColor: "var(--border)" }}
        />

        <button
          onClick={onValores}
          className="toque rounded-xl flex-1 flex flex-col items-center text-center min-w-0"
          style={{ paddingLeft: 12, paddingRight: 12 }}
        >
          <Valor {...(grande ? { px: VELOCIMETRO_GRANDE.valorPx } : { tamanho: "md" })} autoAjustar>{valorDireita}</Valor>
          <span
            className="text-xs mt-1"
            style={{ color: "var(--text-secondary)", ...(grande ? { fontSize: VELOCIMETRO_GRANDE.rotuloValorPx } : null) }}
          >
            {rotuloDireita}
          </span>
        </button>
      </div>
    </div>
  );
}

function CardVelocimetroCarrossel({
  rotuloPerfil, percentual, faturado, limite,
  percentualMedia, mediaMensal, mediaLimite,
  onDuvidas, onResumo, onExcedente,
  /* v23: "vidro" (cartao de sempre) | "nenhuma" (solto no fundo) |
     "suave" (fundo levemente mais claro, sem borda) */
  moldura = "vidro",
  /* v25: a pessoa ja leu a explicacao da media: o "?" do card B some */
  mediaExplicada = false,
  /* v29: velocimetro grande (visual F) */
  grande = false,
  /* v31: selo do velocimetro do ano */
  selo = null,
}) {
  const [pagina, setPagina] = useState(0);
  const [dragPx, setDragPx] = useState(0);
  const [arrastando, setArrastando] = useState(false);
  const [larguraCard, setLarguraCard] = useState(0);

  const containerRef = useRef(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const startTime = useRef(0);
  const ativo = useRef(false);
  const eixo = useRef(null);
  const moveu = useRef(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const medir = () => setLarguraCard(el.clientWidth);
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  function largura() {
    return larguraCard || containerRef.current?.clientWidth || 1;
  }

  function inicio(x, y) {
    startX.current = x;
    startY.current = y;
    startTime.current = Date.now();
    ativo.current = true;
    eixo.current = null;
    moveu.current = false;
    setArrastando(true);
    setDragPx(0);
  }

  function mover(x, y) {
    if (!ativo.current) return;
    const dx = x - startX.current;
    const dy = y - startY.current;

    if (eixo.current === null) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      eixo.current = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      if (eixo.current === "y") {
        ativo.current = false;
        setArrastando(false);
        setDragPx(0);
        return;
      }
    }

    if (eixo.current === "x") {
      moveu.current = true;
      setDragPx(dx);
    }
  }

  function fim(x) {
    if (!ativo.current) {
      setArrastando(false);
      setDragPx(0);
      eixo.current = null;
      return;
    }
    const dx = x - startX.current;
    const dt = Date.now() - startTime.current;
    const velocidade = Math.abs(dx) / Math.max(1, dt);
    const passouMeio = Math.abs(dx) > largura() * 0.3;
    const flick = velocidade > 0.4 && Math.abs(dx) > 30;

    ativo.current = false;
    eixo.current = null;
    setArrastando(false);
    setDragPx(0);

    if (passouMeio || flick) setPagina((p) => (p === 0 ? 1 : 0));
  }

  function irPara(i) {
    setDragPx(0);
    setArrastando(false);
    setPagina(i);
  }

  function seNaoArrastou(fn) {
    return () => { if (!moveu.current) fn(); };
  }

  const bgCard =
    moldura === "nenhuma"
      ? {}
      : moldura === "suave"
      ? { backgroundColor: "var(--surface)" }
      : {
          ...VIDRO,
          boxShadow:
            "inset 0 1px 0 0 var(--vidro-topo-medio), inset 0 6px 14px -8px var(--vidro-topo-fraco), inset 0 -1.5px 0 0 var(--vidro-base), 0 8px 24px var(--vidro-sombra)",
        };

  const larg = larguraCard || 1;
  const base = pagina === 0 ? 0 : -50;
  const dragPct = (dragPx / larg) * 50;
  const translatePct = base + dragPct;

  return (
    <div className="flex flex-col flex-1 min-h-0">
    <div
      ref={containerRef}
      data-carrossel-velocimetro
      className="relative w-full flex-1 min-h-0 rounded-3xl overflow-hidden flex flex-col"
      style={{
        ...bgCard,
        touchAction: "pan-y",
      }}
      onTouchStart={(e) => inicio(e.touches[0].clientX, e.touches[0].clientY)}
      onTouchMove={(e) => mover(e.touches[0].clientX, e.touches[0].clientY)}
      onTouchEnd={(e) => fim(e.changedTouches[0].clientX)}
      onTouchCancel={() => fim(startX.current)}
      onMouseDown={(e) => inicio(e.clientX, e.clientY)}
      onMouseMove={(e) => ativo.current && mover(e.clientX, e.clientY)}
      onMouseUp={(e) => fim(e.clientX)}
      onMouseLeave={(e) => ativo.current && fim(e.clientX)}
    >
      {/* Alerta visual: passou dos 100% do limite. So no card A — ao
          deslizar para o card B a borda some suavemente (v12). */}
      {/* v23: a borda vermelha so faz sentido no cartao de vidro */}
      {percentual > 100 && moldura === "vidro" && (
        <div
          aria-hidden
          className="pointer-events-none absolute"
          style={{
            inset: 0,
            zIndex: 3,
            opacity: pagina === 0 ? 1 : 0,
            transition: "opacity 300ms ease-in-out",
          }}
        >
          <BordaLuminosa raio={24} cor="239,68,68" corClara="248,113,113" />
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-hidden">
        <div
          className="flex h-full"
          style={{
            width: "200%",
            transform: `translateX(${translatePct}%)`,
            transition: arrastando ? "none" : "transform 300ms ease-in-out",
          }}
        >
          <PaginaVelocimetro
            rotulo={rotuloPerfil ? `${rotuloPerfil} · anual` : "Anual"}
            percentual={percentual}
            descricao="Faturamento do ano comparado com o limite"
            valorEsquerda={faturado}
            rotuloEsquerda="Faturado"
            valorDireita={limite}
            rotuloDireita="Limite"
            onBalao={seNaoArrastou(() => onDuvidas("anual"))}
            onValores={seNaoArrastou(onResumo)}
            /* Piloto (v18): sem o chat, o "?" do ano ("Tirar duvidas")
               some; o balao so aparece acima do limite. */
            sempreMostrarBalao={MOSTRAR_CHAT_FISCO}
            onExcedente={seNaoArrastou(onExcedente)}
            grande={grande}
            selo={selo}
          />

          <PaginaVelocimetro
            rotulo={rotuloPerfil ? `${rotuloPerfil} · média mês` : "Média mês"}
            percentual={percentualMedia}
            alertaDos20={false}
            apenasInterrogacao
            descricao="Média por mês comparada com a média limite"
            valorEsquerda={mediaMensal}
            rotuloEsquerda="Faturado"
            valorDireita={mediaLimite}
            rotuloDireita="Limite"
            onBalao={seNaoArrastou(() => onDuvidas("media"))}
            onValores={seNaoArrastou(onResumo)}
            semBalao={mediaExplicada}
            grande={grande}
          />
        </div>
      </div>
    </div>

      <BolinhasIndicadoras pagina={pagina} irPara={irPara} grande={grande} />
    </div>
  );
}

/** Painel só com as perguntas sugeridas conforme a situação.
    Fecha no "×" ou clicando fora.

    v7: abre pelo BALÃO ao lado do número do velocímetro (card A ou B).
    Quando a pessoa passou do limite, o primeiro item é "Entender a regra
    dos 20%", que abre a tela da regra — antes ela abria direto pelo
    balão vermelho.

    v9: sem subtítulo — só o "Tirar dúvidas" e as perguntas.
    v10: só o card A (ano) abre este painel. O balão do card B (média)
    abre a explicação da média limite (PainelMediaLimite). */
function PainelPerguntas({
  aberto, onFechar, perguntas, corFaixa, mostrarRegra20,
  onPerguntar, onRegra20,
}) {
  const listaRef = useRef(null);

  /* TRAVA A ROLAGEM DO DASHBOARD enquanto o painel esta aberto. Sem
     isso, arrastar o dedo fora do painel rolava a tela atras. Mesma
     tecnica da caixinha do Fisco: overflow travado no html/body +
     bloqueio do arrasto — liberado so DENTRO da lista de perguntas,
     que precisa rolar. */
  useEffect(() => {
    if (!aberto) return;

    const htmlEl = document.documentElement;
    const bodyEl = document.body;
    const overflowHtmlAntes = htmlEl.style.overflow;
    const overflowBodyAntes = bodyEl.style.overflow;
    htmlEl.style.overflow = "hidden";
    bodyEl.style.overflow = "hidden";

    const bloquearArrasto = (e) => {
      const lista = listaRef.current;
      if (lista && lista.contains(e.target)) return; // deixa a lista rolar
      e.preventDefault();
    };
    document.addEventListener("touchmove", bloquearArrasto, { passive: false });

    return () => {
      document.removeEventListener("touchmove", bloquearArrasto);
      htmlEl.style.overflow = overflowHtmlAntes;
      bodyEl.style.overflow = overflowBodyAntes;
    };
  }, [aberto]);

  if (!aberto) return null;

  return (
    <div
      className="fixed inset-0 z-[75] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.5)", animation: "menuMsgFade 260ms ease-out" }}
      onClick={onFechar}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex flex-col rounded-3xl overflow-hidden"
        style={{
          ...VIDRO_CHAT,
          width: "calc(100% - 32px)",
          maxWidth: 420,
          maxHeight: "72vh",
          animation: "menuMsgPop 340ms cubic-bezier(0.25,0.9,0.3,1)",
        }}
      >
        {/* As animacoes ficavam no MenuMensagem do chat que existia aqui.
            Com ele removido, elas moram neste painel — que e quem usa. */}
        <style>{`
          @keyframes menuMsgFade {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes menuMsgPop {
            from { opacity: 0; transform: scale(0.94) translateY(6px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
          }
        `}</style>

        <button
          type="button"
          onClick={onFechar}
          aria-label="Fechar"
          className="rounded-full flex items-center justify-center active:scale-95 transition"
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            zIndex: 20,
            width: 30,
            height: 30,
            backgroundColor: "var(--vidro-bg-leve)",
            border: "1px solid var(--vidro-borda)",
          }}
        >
          <X size={15} style={{ color: "var(--text-secondary)" }} />
        </button>

        <div
          ref={listaRef}
          className="flex-1 min-h-0 overflow-y-auto hide-scrollbar"
          style={{ padding: "0 12px 12px", display: "flex", flexDirection: "column", gap: 8 }}
        >
          {/* Titulo DENTRO da lista (v17): rola junto com os cards e sobe
              no arrasto. So o "×" fica fixo no canto. O padding de 40 dos
              lados (+12 da lista = 52) mantem o texto no centro real do
              painel e longe do "×". O espaco embaixo (4 + 8 do gap = 12) e
              o mesmo de antes, entao os cards ficam no mesmo lugar. */}
          <div
            className="shrink-0 text-center"
            style={{ padding: "16px 40px 4px" }}
          >
            <p
              className="font-bold uppercase"
              style={{
                /* Branco sempre: nao acompanha a cor da faixa. */
                color: "var(--text)",
                fontSize: 13,
                letterSpacing: "0.09em",
              }}
            >
              Tirar dúvidas
            </p>
          </div>

          {mostrarRegra20 && (
            <button
              type="button"
              onClick={onRegra20}
              className="toque toque-escala w-full rounded-2xl flex items-center text-left shrink-0"
              style={{
                gap: 11,
                padding: "13px 14px",
                backgroundColor: hexToRgba(corFaixa, 0.14),
                border: `1px solid ${hexToRgba(corFaixa, 0.4)}`,
              }}
            >
              <span
                className="rounded-xl flex items-center justify-center shrink-0"
                style={{ width: 30, height: 30, backgroundColor: hexToRgba(corFaixa, 0.22) }}
              >
                <BookOpen size={15} style={{ color: corFaixa }} />
              </span>
              <span
                className="flex-1 leading-snug font-semibold"
                style={{ color: "var(--text)", fontSize: 14 }}
              >
                Entender a regra dos 20%
              </span>
              <ChevronRight size={15} style={{ color: "var(--text-tertiary)" }} className="shrink-0" />
            </button>
          )}

          {perguntas.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onPerguntar(p)}
              className="toque toque-escala w-full rounded-2xl flex items-center text-left shrink-0"
              style={{
                gap: 11,
                padding: "13px 14px",
                backgroundColor: "var(--vidro-superficie)",
                border: "1px solid var(--vidro-borda)",
              }}
            >
              <span
                className="rounded-xl flex items-center justify-center shrink-0"
                style={{ width: 30, height: 30, backgroundColor: hexToRgba(corFaixa, 0.16) }}
              >
                <Sparkles size={15} style={{ color: corFaixa }} />
              </span>
              <span
                className="flex-1 leading-snug"
                style={{ color: "var(--text)", fontSize: 14 }}
              >
                {p}
              </span>
              <ChevronRight size={15} style={{ color: "var(--text-tertiary)" }} className="shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ===================================================================
   PAINEL DA MEDIA LIMITE (v10 — pedido do Fernando, 26/09/2026)

   O balao do card B (velocimetro da media) NAO abre lista de duvidas:
   abre so esta explicacao, a MESMA em qualquer situacao. A ideia e a
   pessoa entender que a media limite e uma ajuda de controle, nao um
   teto obrigatorio do mes.

   v13: dois botoes bem "tocaveis" no fim:
     - Entendi                       -> verde transparente, fecha
     - Nao entendi, falar com o Fisco -> abre o chat do Fisco com a
       pergunta pronta (PERGUNTA_NAO_ENTENDI_MEDIA), pedindo uma
       explicacao mais facil, com exemplo do dia a dia

   v14: tudo cabe no card sem rolar no iPhone — letras e espacos um
   pouco menores, textos mais curtos e altura maxima pela tela visivel.

   v25 (05/10/2026): so o texto e o "Entendi" no fim. Sairam o "Falar
   com o Fisco.ia" e o "X". E a explicacao so aparece UMA vez: ao fechar
   (Entendi ou toque fora), o "?" do card B some para sempre naquela
   conta, naquele aparelho (useMediaExplicada).
   =================================================================== */
const CHAVE_MEDIA_EXPLICADA = "tacerto_media_explicada";

/* Lembra, por conta e por aparelho, se a pessoa ja leu a explicacao da
   media limite. Enquanto a conta carrega, conta como "nao leu".
   v26: usa useMarcaDaConta (src/lib/marcasDaConta.js); o "1" guardado
   pela v25 continua valendo. */
function useMediaExplicada() {
  const [lida, salvar] = useMarcaDaConta(CHAVE_MEDIA_EXPLICADA, false);
  return [Boolean(lida), () => salvar(true)];
}

function PainelMediaLimite({ aberto, onFechar, limiteAnual, mediaLimite }) {
  const conteudoRef = useRef(null);

  /* Trava a rolagem do Dashboard enquanto aberto (mesma tecnica do
     painel de duvidas). */
  useEffect(() => {
    if (!aberto) return;
    const htmlEl = document.documentElement;
    const bodyEl = document.body;
    const overflowHtmlAntes = htmlEl.style.overflow;
    const overflowBodyAntes = bodyEl.style.overflow;
    htmlEl.style.overflow = "hidden";
    bodyEl.style.overflow = "hidden";

    const bloquearArrasto = (e) => {
      const c = conteudoRef.current;
      if (c && c.contains(e.target)) return; // o texto pode rolar
      e.preventDefault();
    };
    document.addEventListener("touchmove", bloquearArrasto, { passive: false });

    return () => {
      document.removeEventListener("touchmove", bloquearArrasto);
      htmlEl.style.overflow = overflowHtmlAntes;
      bodyEl.style.overflow = overflowBodyAntes;
    };
  }, [aberto]);

  if (!aberto) return null;

  const paragrafo = { color: "var(--text-secondary)", fontSize: 13.5, lineHeight: 1.45 };

  return (
    <div
      className="fixed inset-0 z-[75] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.5)", animation: "menuMsgFade 260ms ease-out" }}
      onClick={onFechar}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex flex-col rounded-3xl overflow-hidden"
        style={{
          ...VIDRO_CHAT,
          width: "calc(100% - 32px)",
          maxWidth: 420,
          maxHeight: "calc(100dvh - 40px)",
          animation: "menuMsgPop 340ms cubic-bezier(0.25,0.9,0.3,1)",
        }}
      >
        <style>{`
          @keyframes menuMsgFade {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes menuMsgPop {
            from { opacity: 0; transform: scale(0.94) translateY(6px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
          }
        `}</style>

        {/* Titulo no mesmo estilo do "Tirar duvidas" (v25: sem o "X") */}
        <div className="shrink-0 text-center" style={{ padding: "15px 52px 8px" }}>
          <p
            className="font-bold uppercase"
            style={{ color: "var(--text)", fontSize: 13, letterSpacing: "0.09em" }}
          >
            Média limite
          </p>
        </div>

        <div
          ref={conteudoRef}
          className="flex-1 min-h-0 overflow-y-auto hide-scrollbar"
          style={{ padding: "0 18px 16px" }}
        >
          <p
            className="font-semibold"
            style={{ color: "var(--text)", fontSize: 15, lineHeight: 1.4 }}
          >
            É quanto você pode faturar por mês, em média, para fechar o ano
            dentro do limite do MEI.
          </p>

          {/* A conta */}
          <div
            className="rounded-2xl text-center"
            style={{
              marginTop: 12,
              padding: "9px 12px",
              backgroundColor: "var(--vidro-superficie)",
              border: "1px solid var(--vidro-borda)",
            }}
          >
            <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>
              {reais(limiteAnual)} no ano ÷ 12 meses
            </p>
            <p
              className="font-bold"
              style={{ color: "var(--primary)", fontSize: 18, marginTop: 1 }}
            >
              {reais(mediaLimite)} por mês
            </p>
          </div>

          <p style={{ ...paragrafo, marginTop: 12 }}>
            <strong style={{ color: "var(--text)" }}>Não é um teto do mês.</strong>{" "}
            Dá para faturar mais num mês e menos no outro. Para a lei, conta o
            total do ano.
          </p>

          <p style={{ ...paragrafo, marginTop: 8 }}>
            <strong style={{ color: "var(--text)" }}>Exemplo:</strong> um mês com o
            dobro da média limite e outro sem nada dão a mesma média. Tudo certo.
          </p>

          <p style={{ ...paragrafo, marginTop: 8 }}>
            <strong style={{ color: "var(--text)" }}>No velocímetro:</strong> até
            100%, seu ritmo cabe no limite do ano. Acima disso, segure a mão nos
            próximos meses.
          </p>

          {/* Entendi: verde transparente (antes era verde cheio) */}
          <button
            type="button"
            onClick={onFechar}
            className="toque w-full rounded-2xl font-semibold transition active:scale-[0.98]"
            style={{
              marginTop: 14,
              paddingTop: 11,
              paddingBottom: 11,
              fontSize: 15.5,
              backgroundColor: "rgba(34,197,94,0.16)",
              border: "1px solid rgba(34,197,94,0.45)",
              color: "var(--primary)",
            }}
          >
            Entendi
          </button>
        </div>
      </div>
    </div>
  );
}

/* Foto redonda pequena do Fisco (28px, borda verde) — a mesma que ja
   ficava no botao "Nao entendi, falar com o Fisco". Separada em v18
   porque agora tambem aparece no botao do WhatsApp. */
function FotoFiscoMini({ tamanho = 28 }) {
  return (
    <span
      className="rounded-full overflow-hidden shrink-0 flex items-center justify-center"
      style={{
        width: tamanho,
        height: tamanho,
        border: "1.5px solid rgba(34,197,94,0.45)",
      }}
    >
      <img
        src="/fisco-perfil.png"
        alt=""
        style={{
          width: "112%",
          height: "112%",
          objectFit: "cover",
          objectPosition: "50% 18%",
        }}
      />
    </span>
  );
}

/* ===================================================================
   BOTAO "FALAR COM O FISCO NO WHATSAPP" (v18 — piloto)

   No piloto o Fisco atende pelo WhatsApp, nao dentro do app. Este
   botao fica no lugar da barra "Pergunte ao Fisco..." e abre a
   conversa no WhatsApp (numero em WHATSAPP_FISCO, src/config/piloto.js).
   Mesma luz verde correndo na borda que a barra antiga tinha.
   =================================================================== */
function BotaoFiscoWhatsApp({ dadosWhats }) {
  return (
    <a
      href={linkWhatsAppFisco(MENSAGENS_WHATSAPP.falarComFisco(dadosWhats))}
      target="_blank"
      rel="noopener noreferrer"
      className="toque relative shrink-0 w-full rounded-2xl font-semibold flex items-center justify-center active:scale-[0.98] transition"
      style={{
        ...VIDRO_SUAVE,
        gap: 10,
        height: 52,
        marginTop: 12,
        marginBottom: 12,
        fontSize: 15,
        color: "var(--text)",
        textDecoration: "none",
      }}
    >
      <BordaCorrendo raio={16} />
      <FotoFiscoMini tamanho={30} />
      Falar com o Fisco no WhatsApp
    </a>
  );
}

/* ===================================================================
   CARD "PROXIMO DAS" (v19 — extra A do piloto)

   O DAS de um mes vence no dia 20 do mes seguinte. Entao, ate o dia
   20, o proximo vencimento e o deste mes; depois do dia 20, o do mes
   que vem. (Fim de semana e feriado nao sao calculados aqui.)

   VALOR: o perfil guarda so o TIPO de MEI, nao a atividade, e o
   DAS_2026 (src/lib/fiscal.js) tem 3 valores por tipo. Mostramos o da
   atividade mais comum de cada tipo (DAS_ATIVIDADE_PADRAO):
     - MEI Caminhoneiro: frete intermunicipal/interestadual (o caso do
       agregado de transportadora) = R$ 195,52. Frete so dentro da
       cidade = R$ 199,52; produtos perigosos/mudancas = R$ 200,52.
     - MEI comum: servicos = R$ 86,05 (comercio/industria R$ 82,05;
       comercio e servicos R$ 87,05).
   O valor exato aparece no PGMEI (painel "Emitir boleto").

   v21: texto "Proximo DAS: 20/10" (sem o "dia") numa linha so, sem
   reticencias (cabe ao lado do botao num iPhone de 375px). O botao
   virou "Emitir boleto" e abre o painel FolhaPagarDas (boleto todo
   mes no WhatsApp, Fisco ajuda agora, fazer sozinho, site do governo).
   ⚠️ Valores de 2026: trocar em fiscal.js quando o salario minimo de
   2027 sair.
   =================================================================== */
/* v30: o valor vem de fiscal.js (valorDasMensal), pelo CNAE do perfil */

/* v34: o vencimento vem de src/lib/vencimentoDas.js — dia 20 ou, se
   nao for dia util (fim de semana ou feriado nacional), o proximo dia
   util. Ex.: 20/11/2026 e feriado (sexta) -> 23/11. */

function CardProximoDas({ tipoMEI, cnaes, onEmitirBoleto }) {
  const vencimento = proximoVencimentoDas();
  const dia = String(vencimento.getDate()).padStart(2, "0");
  const mes = String(vencimento.getMonth() + 1).padStart(2, "0");
  const valor = valorDasMensal(tipoMEI, cnaes);

  return (
    /* Sem icone a esquerda: com ele, "Proximo DAS: dia 20/10" ficava
       cortado ao lado do botao na largura do iPhone. */
    <div
      className="card-tacerto shrink-0 rounded-2xl flex items-center"
      style={{ marginTop: 12, padding: "11px 12px 11px 16px", gap: 12 }}
    >
      <div className="flex-1 min-w-0">
        <p className="whitespace-nowrap" style={{ color: "var(--text-secondary)", fontSize: 13 }}>
          Próximo DAS: {dia}/{mes}
        </p>
        {valor != null && (
          <div style={{ marginTop: 2 }}>
            <Valor tamanho="md">{valor}</Valor>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onEmitirBoleto}
        className="toque shrink-0 rounded-xl font-semibold flex items-center active:scale-[0.98] transition"
        style={{
          gap: 5,
          padding: "9px 11px",
          fontSize: 13.5,
          backgroundColor: "rgba(34,197,94,0.16)",
          border: "1px solid rgba(34,197,94,0.45)",
          color: "var(--primary)",
          whiteSpace: "nowrap",
        }}
      >
        Emitir boleto
      </button>
    </div>
  );
}

/* ===================================================================
   BOTAO "COMO EMITIR NOTA" (v19 — extra C do piloto)
   Pequeno, no canto de cima (onde ficava o botao do banco), na mesma
   altura da linha do logo (34). Abre o passo a passo /como-emitir-nota.
   =================================================================== */
function BotaoComoEmitirNota() {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate("/como-emitir-nota", DE_DASHBOARD)}
      className="toque shrink-0 flex items-center rounded-full"
      style={{
        height: 34,
        gap: 6,
        padding: "0 12px",
        border: "1px solid var(--border)",
        background: "none",
      }}
    >
      <FileText size={15} strokeWidth={2.1} style={{ color: "var(--primary)" }} />
      <span
        className="font-semibold whitespace-nowrap"
        style={{ fontSize: 13, color: "var(--text-secondary)" }}
      >
        Como emitir nota
      </span>
    </button>
  );
}

/* ===================================================================
   VARIACOES DO INICIO (v23 — 05/10/2026, para o Fernando escolher)

   Pedido: Inicio "clean" como o Perfil, SEM a borda de vidro em volta
   do velocimetro, do botao do Fisco e da barra de baixo. Mesmo conteudo
   (velocimetro, proximo DAS, Fisco.ia no WhatsApp, como emitir nota).
     atual  como era (vidro)
     a      LISTA: velocimetro solto + linhas finas (ListaSimples)
     b      BLOCOS: fundos suaves sem borda
     c      ATALHOS: velocimetro solto + 3 atalhos redondos
   O seletor de teste so aparece com MOSTRAR_SELETOR_VISUAL_INICIO.

   v24: o Fernando escolheu o C, mas achou que ainda estava ruim. Tres
   variacoes novas, sem bolinhas (no C as 3 bolinhas disputavam com o
   "+" redondo da barra de baixo):
     d      CARTOES: 3 quadrados lado a lado, info curta dentro
     e      DESTAQUE: DAS em faixa larga com borda verde fina + 2 botoes
            em contorno (Fisco.ia, Emitir nota)
     f      BARRA: os 3 atalhos numa barra so, em contorno, risca fina
   O seletor mostra so as que estao em teste (VISUAIS_NO_SELETOR); as
   outras continuam valendo pela chave VISUAL_INICIO_PADRAO.

   v27: o F foi escolhido. Para comparar, a "tela B" do Fernando:
     g      F INVERTIDO: a barra dos 3 atalhos em cima (logo abaixo do
            logo) e o velocimetro com os dados embaixo
   No seletor elas aparecem como "A" (f, a de hoje) e "B" (g).
   =================================================================== */
const CHAVE_VISUAL_INICIO = "tacerto_visual_inicio";
const VISUAIS_INICIO = [
  ["atual", "Atual"], ["a", "A"], ["b", "B"], ["c", "C"], ["d", "D"], ["e", "E"], ["f", "F"], ["g", "G"],
];
/* v27: [id, rotulo no seletor] — o rotulo pode ser diferente do id */
const VISUAIS_NO_SELETOR = [["f", "A"], ["g", "B"]];

function lerVisualInicio() {
  if (!MOSTRAR_SELETOR_VISUAL_INICIO) return VISUAL_INICIO_PADRAO;
  try {
    const v = localStorage.getItem(CHAVE_VISUAL_INICIO);
    return VISUAIS_NO_SELETOR.some(([id]) => id === v) ? v : VISUAL_INICIO_PADRAO;
  } catch {
    return VISUAL_INICIO_PADRAO;
  }
}

function SeletorVisualInicio({ visual, onEscolher }) {
  return (
    <div className="shrink-0 flex items-center justify-center" style={{ gap: 6, paddingTop: 8 }}>
      <span style={{ fontSize: 11.5, color: "var(--text-tertiary)" }}>Teste do visual:</span>
      {VISUAIS_NO_SELETOR.map(([id, rotulo]) => {
        const ativo = visual === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onEscolher(id)}
            className="rounded-full font-semibold"
            style={{
              fontSize: 12,
              padding: "3px 11px",
              color: ativo ? "var(--primary)" : "var(--text-tertiary)",
              border: `1px solid ${ativo ? "var(--primary)" : "var(--border)"}`,
              background: "none",
            }}
          >
            {rotulo}
          </button>
        );
      })}
    </div>
  );
}

/* Dia, mes e valor do proximo DAS (o mesmo calculo do CardProximoDas) */
function dadosProximoDas(tipoMEI, cnaes) {
  const vencimento = proximoVencimentoDas();
  return {
    dia: String(vencimento.getDate()).padStart(2, "0"),
    mes: String(vencimento.getMonth() + 1).padStart(2, "0"),
    valor: valorDasMensal(tipoMEI, cnaes),
  };
}

/* A — LISTA, igual ao Perfil */
function InicioLista({ das, onDas, onFisco, onNota }) {
  return (
    <SecaoLista style={{ marginTop: 4 }}>
      {MOSTRAR_CARD_DAS && (
        <LinhaLista
          Icon={CalendarClock}
          rotulo="Próximo DAS"
          detalhe={`Vence ${das.dia}/${das.mes} · toque para emitir`}
          valor={das.valor != null ? <Valor px={15} cor="var(--text-secondary)">{das.valor}</Valor> : null}
          onClick={onDas}
        />
      )}
      <LinhaLista Icon={MessageCircle} rotulo="Falar com o Fisco" detalhe="No WhatsApp" onClick={onFisco} />
      {MOSTRAR_TUTORIAL_NOTA && <LinhaLista Icon={FileText} rotulo="Como emitir nota" onClick={onNota} />}
    </SecaoLista>
  );
}

/* B — BLOCOS de fundo suave, sem borda */
function InicioBlocos({ das, onDas, onFisco, onNota }) {
  const bloco = { backgroundColor: "var(--surface)", borderRadius: 20, border: "none" };
  return (
    <div className="shrink-0" style={{ marginTop: 12 }}>
      <div className="grid grid-cols-2" style={{ gap: 10 }}>
        {MOSTRAR_CARD_DAS && (
          <button type="button" onClick={onDas} className="toque text-left flex flex-col" style={{ ...bloco, padding: "14px 15px" }}>
            <span style={{ fontSize: 13, color: "var(--text-tertiary)" }}>Próximo DAS · {das.dia}/{das.mes}</span>
            {das.valor != null && (
              <span style={{ marginTop: 4 }}><Valor px={17} peso={700}>{das.valor}</Valor></span>
            )}
            <span className="font-semibold" style={{ fontSize: 13.5, color: "var(--primary)", marginTop: "auto", paddingTop: 10 }}>
              Emitir boleto
            </span>
          </button>
        )}
        <button type="button" onClick={onFisco} className="toque text-left flex flex-col" style={{ ...bloco, padding: "14px 15px" }}>
          <span className="flex items-center" style={{ gap: 8 }}>
            <FotoFiscoMini tamanho={24} />
            <span className="font-semibold" style={{ fontSize: 15, color: "var(--text)" }}>Fisco</span>
          </span>
          <span style={{ fontSize: 13, color: "var(--text-tertiary)", marginTop: 4 }}>Dúvidas e ajuda</span>
          <span className="font-semibold" style={{ fontSize: 13.5, color: "var(--primary)", marginTop: "auto", paddingTop: 10 }}>
            Falar no WhatsApp
          </span>
        </button>
      </div>
      {MOSTRAR_TUTORIAL_NOTA && (
        <button
          type="button"
          onClick={onNota}
          className="toque w-full flex items-center"
          style={{ ...bloco, marginTop: 10, padding: "13px 15px", gap: 12 }}
        >
          <FileText size={19} strokeWidth={1.9} style={{ color: "var(--text-tertiary)" }} className="shrink-0" />
          <span className="flex-1 text-left font-medium" style={{ fontSize: 15.5, color: "var(--text)" }}>Como emitir nota</span>
          <ChevronRight size={18} style={{ color: "var(--text-tertiary)" }} className="shrink-0" />
        </button>
      )}
    </div>
  );
}

/* C — ATALHOS redondos */
function InicioAtalhos({ das, onDas, onFisco, onNota }) {
  const itens = [
    MOSTRAR_CARD_DAS && { Icon: CalendarClock, rotulo: "Boleto do DAS", onClick: onDas },
    { Icon: MessageCircle, rotulo: "Fisco", onClick: onFisco },
    MOSTRAR_TUTORIAL_NOTA && { Icon: FileText, rotulo: "Emitir nota", onClick: onNota },
  ].filter(Boolean);
  return (
    <div className="shrink-0" style={{ marginTop: 10 }}>
      {MOSTRAR_CARD_DAS && (
        <p className="text-center flex items-center justify-center" style={{ fontSize: 14, color: "var(--text-secondary)", gap: 5 }}>
          Próximo DAS: {das.dia}/{das.mes} ·
          {das.valor != null && <Valor px={14} peso={600}>{das.valor}</Valor>}
        </p>
      )}
      <div className="grid" style={{ gridTemplateColumns: `repeat(${itens.length}, 1fr)`, marginTop: 16 }}>
        {itens.map(({ Icon, rotulo, onClick }) => (
          <button key={rotulo} type="button" onClick={onClick} className="toque flex flex-col items-center" style={{ gap: 8 }}>
            <span className="rounded-full flex items-center justify-center" style={{ width: 54, height: 54, backgroundColor: "var(--surface)" }}>
              <Icon size={22} strokeWidth={1.9} style={{ color: "var(--primary)" }} />
            </span>
            <span className="font-medium" style={{ fontSize: 13.5, color: "var(--text)" }}>{rotulo}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* v24: os 3 atalhos, na ordem de sempre (some o que a chave esconder) */
function atalhosInicio({ onDas, onFisco, onNota }) {
  return [
    MOSTRAR_CARD_DAS && { id: "das", Icon: CalendarClock, onClick: onDas },
    { id: "fisco", Icon: MessageCircle, onClick: onFisco },
    MOSTRAR_TUTORIAL_NOTA && { id: "nota", Icon: FileText, onClick: onNota },
  ].filter(Boolean);
}

/* Borda verde fina dos destaques (mesma cor do DESTAQUE_BORDA dos slides) */
const BORDA_DESTAQUE_INICIO = "1px solid rgba(34,197,94,0.4)";

/* D — CARTOES: 3 quadrados lado a lado, fundo suave, sem borda */
function InicioCartoes(acoes) {
  const textos = {
    das: ["DAS", `Vence ${acoes.das.dia}/${acoes.das.mes}`],
    fisco: ["Fisco", "WhatsApp"],
    nota: ["Nota fiscal", "Como emitir"],
  };
  const itens = atalhosInicio(acoes);
  return (
    <div className="shrink-0 grid" style={{ gridTemplateColumns: `repeat(${itens.length}, 1fr)`, gap: 10, marginTop: 14 }}>
      {itens.map(({ id, Icon, onClick }) => (
        <button
          key={id}
          type="button"
          onClick={onClick}
          className="toque text-left flex flex-col min-w-0"
          style={{ backgroundColor: "var(--surface)", borderRadius: 18, border: "none", padding: "14px 13px 13px", minHeight: 100 }}
        >
          <Icon size={22} strokeWidth={1.9} style={{ color: "var(--primary)" }} className="shrink-0" />
          <span className="font-semibold truncate" style={{ fontSize: 15, color: "var(--text)", marginTop: "auto", paddingTop: 14 }}>
            {textos[id][0]}
          </span>
          <span className="truncate" style={{ fontSize: 12.5, color: "var(--text-tertiary)", marginTop: 2 }}>
            {textos[id][1]}
          </span>
        </button>
      ))}
    </div>
  );
}

/* E — DESTAQUE: o DAS em faixa larga com borda verde fina; embaixo,
   Fisco.ia e Emitir nota em botoes de contorno */
function InicioDestaque({ das, onDas, onFisco, onNota }) {
  const pilula = {
    height: 48, borderRadius: 999, border: "1px solid var(--border)", background: "none", gap: 8,
  };
  return (
    <div className="shrink-0" style={{ marginTop: 14 }}>
      {MOSTRAR_CARD_DAS && (
        <button
          type="button"
          onClick={onDas}
          className="toque w-full flex items-center text-left"
          style={{ border: BORDA_DESTAQUE_INICIO, borderRadius: 18, background: "none", padding: "12px 14px 12px 16px", gap: 12 }}
        >
          <CalendarClock size={22} strokeWidth={1.9} style={{ color: "var(--primary)" }} className="shrink-0" />
          <span className="flex-1 min-w-0 flex flex-col">
            <span className="font-semibold" style={{ fontSize: 15.5, color: "var(--text)" }}>Próximo DAS</span>
            <span style={{ fontSize: 13, color: "var(--text-tertiary)", marginTop: 1 }}>Vence {das.dia}/{das.mes}</span>
          </span>
          {das.valor != null && <Valor px={16} peso={700}>{das.valor}</Valor>}
          <ChevronRight size={18} style={{ color: "var(--text-tertiary)" }} className="shrink-0" />
        </button>
      )}
      <div className="grid" style={{ gridTemplateColumns: MOSTRAR_TUTORIAL_NOTA ? "1fr 1fr" : "1fr", gap: 10, marginTop: 10 }}>
        <button type="button" onClick={onFisco} className="toque flex items-center justify-center" style={pilula}>
          <MessageCircle size={19} strokeWidth={1.9} style={{ color: "var(--primary)" }} />
          <span className="font-medium" style={{ fontSize: 15, color: "var(--text)" }}>Fisco</span>
        </button>
        {MOSTRAR_TUTORIAL_NOTA && (
          <button type="button" onClick={onNota} className="toque flex items-center justify-center" style={pilula}>
            <FileText size={19} strokeWidth={1.9} style={{ color: "var(--primary)" }} />
            <span className="font-medium" style={{ fontSize: 15, color: "var(--text)" }}>Emitir nota</span>
          </button>
        )}
      </div>
    </div>
  );
}

/* F — BARRA: os 3 atalhos numa barra so, em contorno, risca fina entre eles.
   v27: `emCima` = a barra vem antes do velocimetro (visual G, "tela B")
   v28: rotulos curtos (DAS, Fisco, NF) e o Fisco com o simbolo do
   WhatsApp em contorno. Embaixo do velocimetro (F) a barra nao tem
   margem propria: quem separa e o respiro (ver RESPIRO_ACIMA_DA_BARRA). */
function InicioBarra({ emCima = false, ...acoes }) {
  const rotulos = { das: "DAS", fisco: "Fisco", nota: "NF" };
  const icones = { fisco: IconeWhatsApp };
  return (
    <div
      className="shrink-0 flex items-stretch overflow-hidden"
      style={{
        marginTop: emCima ? 6 : 0,
        marginBottom: emCima ? 10 : 0,
        border: "1px solid var(--border)",
        borderRadius: 18,
      }}
    >
      {atalhosInicio(acoes).map(({ id, Icon: IconePadrao, onClick }, i) => {
        const Icon = icones[id] || IconePadrao;
        return (
          <button
            key={id}
            type="button"
            onClick={onClick}
            className="toque flex-1 flex flex-col items-center justify-center min-w-0"
            style={{ padding: "12px 4px 11px", gap: 6, background: "none", borderLeft: i ? "1px solid var(--border)" : "none" }}
          >
            <Icon size={21} strokeWidth={1.9} style={{ color: "var(--primary)" }} />
            <span className="font-medium truncate" style={{ fontSize: 13.5, color: "var(--text)" }}>{rotulos[id]}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ===================================================================
   v31 (10/10/2026) — ATUALIZAR O VELOCIMETRO (tarefa de 08-10, Etapa 2)

   Visual F, logo abaixo das bolinhas do velocimetro:
   - linha discreta "Atualizado em 08/10 às 14:32" (ultima mudanca nos
     lancamentos: perfis.velocimetro_atualizado_em, ou o lancamento
     criado por ultimo — ver AppStateContext v3);
   - botao pequeno, em contorno, "Atualizar velocímetro": abre a folha
     com os 3 jeitos (FolhaAtualizarVelocimetro).
   Faturamento ZERO no ano: no lugar da data vem "Falta informar" (nunca
   "Tá tranquilo") e o botao fica em DESTAQUE (contorno verde).

   SELO no velocimetro do ano, ao lado de "MEI Caminhoneiro · anual":
   "Estimado" (tem total do ano digitado) ou "Conferido" (veio de
   extrato e a pessoa confirmou). Sem nenhum dos dois, sem selo.
   Regra em src/lib/conciliacao.js (seloDoVelocimetro).
   =================================================================== */
function SeloVelocimetro({ tipo }) {
  const conferido = tipo === "conferido";
  return (
    <span
      className="inline-flex items-center rounded-full font-medium"
      style={{
        gap: 3,
        fontSize: 11.5,
        lineHeight: "16px",
        padding: "1px 8px",
        border: "1px solid var(--border)",
        color: "var(--text-tertiary)",
      }}
    >
      {conferido && <Check size={11} strokeWidth={2.6} />}
      {conferido ? "Conferido" : "Estimado"}
    </span>
  );
}

const pad2 = (n) => String(n).padStart(2, "0");
function textoAtualizadoEm(iso) {
  const d = iso ? new Date(iso) : null;
  if (!d || isNaN(d.getTime())) return "";
  return `Atualizado em ${pad2(d.getDate())}/${pad2(d.getMonth() + 1)} às ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function LinhaAtualizacao({ quando, faltaInformar, onAtualizar }) {
  const texto = faltaInformar ? "Falta informar" : textoAtualizadoEm(quando);
  return (
    <div className="shrink-0 flex flex-col items-center" style={{ marginTop: 12, gap: 8 }}>
      {texto && (
        <p style={{ fontSize: 13, color: faltaInformar ? "var(--text-secondary)" : "var(--text-tertiary)" }}>
          {texto}
        </p>
      )}
      <button
        type="button"
        onClick={onAtualizar}
        className={`${faltaInformar ? "botao-confirmar " : ""}toque rounded-full font-medium flex items-center`}
        style={{
          gap: 6,
          height: 34,
          padding: "0 14px",
          fontSize: 13.5,
          background: "none",
          border: "1px solid var(--border)",
          color: "var(--text-secondary)",
        }}
      >
        <RefreshCw size={14} strokeWidth={2.1} />
        Atualizar velocímetro
      </button>
    </div>
  );
}

/* Quantos recebimentos do ano vieram de extrato e foram confirmados
   (para o selo "Conferido"). Sem login ou sem rede: 0. */
function useConferidosDoExtrato() {
  const [quantos, setQuantos] = useState(0);
  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        const user = data?.user;
        if (!user) return;
        const ano = new Date().getFullYear();
        const { count } = await supabase
          .from("entradas")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("status", "faturamento")
          .like("pluggy_transaction_id", `${PREFIXO_EXTRATO}%`)
          .gte("data", `${ano}-01-01T00:00:00-03:00`);
        if (ativo) setQuantos(count || 0);
      } catch { /* sem rede: sem selo */ }
    })();
    return () => { ativo = false; };
  }, []);
  return quantos;
}

/* v28: RESPIRO entre as bolinhas do velocimetro e a barra dos 3 atalhos
   (visual F). Pedido do Fernando: "levantar tudo a partir das 2 bolinhas,
   separando dos 3 itens". E uma parte do espaco livre da tela (cresce em
   tela alta, encolhe em tela baixa), nunca menor que o minimo. O resto
   do espaco fica com o velocimetro, que continua centrado no dele.
   v29: a barra fica CENTRADA entre as bolinhas e o rodape: um respiro
   igual embaixo dela. O de cima comeca com 17px a mais porque, embaixo,
   entre o fim desta area e os icones do rodape ja existem ~17px (folga
   da area + respiro do proprio rodape). */
const RESPIRO_ACIMA_DA_BARRA = { flex: "0.09 1 17px", minHeight: 30 };
const RESPIRO_ABAIXO_DA_BARRA = { flex: "0.09 1 0%", minHeight: 13 };

/** Borda pulsando — acende e apaga suavemente, com halo em volta.
    Usada em verde no chat do Fisco e em vermelho no card do
    velocímetro quando o usuário passa dos 100% do limite.
    Funciona em qualquer navegador (não depende de @property). */
function BordaLuminosa({ raio = 28, cor = "34,197,94", corClara = "74,222,128" }) {
  const id = `pulsa-${cor.replace(/[^0-9]/g, "")}`;
  return (
    <>
      <style>{`
        @keyframes ${id} {
          0%, 100% {
            border-color: rgba(${cor},0.30);
            box-shadow:
              0 0 0 0 rgba(${cor},0),
              inset 0 0 12px -6px rgba(${cor},0.35);
          }
          50% {
            border-color: rgba(${corClara},0.85);
            box-shadow:
              0 0 18px 1px rgba(${cor},0.35),
              inset 0 0 18px -4px rgba(${corClara},0.55);
          }
        }
        .${id} {
          animation: ${id} 2.4s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .${id} { animation: none; }
        }
      `}</style>
      <div
        aria-hidden
        className={`${id} pointer-events-none absolute`}
        style={{
          inset: 0,
          borderRadius: raio,
          border: `1.6px solid rgba(${cor},0.30)`,
          zIndex: 3,
        }}
      />
    </>
  );
}

/** Luz verde correndo em volta da borda. Usada na barra fechada do
    Fisco no dashboard, para chamar atenção. Fica girando o tempo todo,
    mas o elemento é pequeno — o custo de repintura é baixo. */
function BordaCorrendo({ raio = 999, espessura = 1.6 }) {
  return (
    <>
      <style>{`
        @property --anguloLuz {
          syntax: '<angle>';
          initial-value: 0deg;
          inherits: false;
        }
        @keyframes girarLuz {
          to { --anguloLuz: 360deg; }
        }
        .borda-correndo {
          animation: girarLuz 3.2s linear infinite;
        }
        /* Safari antigo não suporta @property: a luz não gira, então
           some — a borda normal do elemento continua ali. */
        @supports not (background: conic-gradient(from 0deg, red, blue)) {
          .borda-correndo { display: none; }
        }
        @media (prefers-reduced-motion: reduce) {
          .borda-correndo { animation: none; opacity: 0.5; }
        }
      `}</style>
      <span
        aria-hidden
        className="borda-correndo pointer-events-none absolute"
        style={{
          inset: 0,
          borderRadius: raio,
          padding: espessura,
          background:
            "conic-gradient(from var(--anguloLuz), transparent 0%, transparent 62%, rgba(34,197,94,0.35) 74%, #4ade80 86%, rgba(134,239,172,0.9) 92%, transparent 100%)",
          WebkitMask:
            "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          WebkitMaskComposite: "xor",
          mask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          maskComposite: "exclude",
          zIndex: 2,
        }}
      />
    </>
  );
}

function CaixaFiscoExpandida({ onEnviarPrimeira }) {
  const [rascunho, setRascunho] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function submeter(e) {
    e.preventDefault();
    const texto = rascunho.trim();
    if (!texto) return;
    onEnviarPrimeira(texto);
    setRascunho("");
    // Volta o campo pro tamanho inicial (ele cresceu enquanto digitava).
    if (inputRef.current) inputRef.current.style.height = "auto";
  }

  return (
    <form
      onSubmit={submeter}
      onClick={() => inputRef.current?.focus()}
      className="rounded-3xl flex flex-col relative"
      style={{
        ...VIDRO_SUAVE,
        background:
          "linear-gradient(160deg, var(--vidro-brilho-2) 0%, var(--vidro-brilho-3) 24%, transparent 58%), var(--vidro-bg-transparente)",
        padding: 14,
        gap: 10,
        cursor: "text",
        // Avisa o navegador pra preparar a camada do vidro antes da
        // animacao de entrada. Sem isso, o Safari pintava o backdrop-filter
        // um frame depois e a caixinha aparecia so com a borda.
        willChange: "backdrop-filter",
      }}
    >
      <BordaLuminosa raio={24} />

      <textarea
        ref={inputRef}
        value={rascunho}
        rows={2}
        onChange={(e) => {
          setRascunho(e.target.value);
          // Cresce com o texto ate MAX_ALTURA_CAIXA_FISCO; passando disso,
          // para de crescer e rola por dentro (barra de rolagem visivel).
          const el = e.target;
          el.style.height = "auto";
          el.style.height = `${Math.min(el.scrollHeight, MAX_ALTURA_CAIXA_FISCO)}px`;
        }}
        className="w-full resize-none"
        style={{
          background: "none",
          border: "none",
          outline: "none",
          color: "var(--text)",
          caretColor: "var(--primary)",
          fontSize: 15,
          lineHeight: 1.4,
          fontFamily: "inherit",
          maxHeight: MAX_ALTURA_CAIXA_FISCO,
          overflowY: "auto",
        }}
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center" style={{ gap: 6 }}>
          <button
            type="button"
            onClick={(e) => e.stopPropagation()}
            aria-label="Tirar foto"
            className="toque rounded-full flex items-center justify-center"
            style={{
              width: 36,
              height: 36,
              backgroundColor: "var(--vidro-superficie)",
              border: "1px solid var(--vidro-borda)",
            }}
          >
            <Camera size={17} style={{ color: "var(--text)" }} />
          </button>
          <button
            type="button"
            onClick={(e) => e.stopPropagation()}
            aria-label="Galeria"
            className="toque rounded-full flex items-center justify-center"
            style={{
              width: 36,
              height: 36,
              backgroundColor: "var(--vidro-superficie)",
              border: "1px solid var(--vidro-borda)",
            }}
          >
            <ImageIcon size={17} style={{ color: "var(--text)" }} />
          </button>
          <button
            type="button"
            onClick={(e) => e.stopPropagation()}
            aria-label="Documento"
            className="toque rounded-full flex items-center justify-center"
            style={{
              width: 36,
              height: 36,
              backgroundColor: "var(--vidro-superficie)",
              border: "1px solid var(--vidro-borda)",
            }}
          >
            <FileText size={17} style={{ color: "var(--text)" }} />
          </button>
        </div>

        {rascunho.trim() ? (
          <button
            type="submit"
            aria-label="Enviar"
            className="toque rounded-full flex items-center justify-center shrink-0"
            style={{ width: 38, height: 38 }}
          >
            <Send size={21} strokeWidth={2.1} style={{ color: "var(--primary)" }} />
          </button>
        ) : (
          <button
            type="button"
            onClick={(e) => e.stopPropagation()}
            aria-label="Gravar áudio"
            className="toque rounded-full flex items-center justify-center shrink-0"
            style={{ width: 38, height: 38 }}
          >
            <Mic size={21} strokeWidth={2.1} style={{ color: "var(--primary)" }} />
          </button>
        )}
      </div>
    </form>
  );
}

/* Caixa expandida do Fisco.

   Em vez de "crescer" a partir da barra do dashboard, ela e criada como
   um elemento novo que aparece suavemente ancorado ao teclado.

   Como funciona o posicionamento (a parte que antes falhava): montamos um
   container que ocupa EXATAMENTE a area visivel (o espaco que sobra acima
   do teclado) e colocamos a caixa no fim dele. Assim ela fica acima do
   teclado por construcao - sem calcular posicao, entao nao tem como errar
   e ficar escondida. Vive num portal, fora da arvore do dashboard. */
function CaixaFiscoFlutuante({ onFechar, onEnviarPrimeira }) {
  const areaRef = useRef(null);
  // Enquanto "fechando", roda a animacao de saida; so depois disso o
  // componente e removido de verdade (senao sumia do nada).
  const [fechando, setFechando] = useState(false);

  function fecharSuave() {
    if (fechando) return;
    setFechando(true);
    setTimeout(onFechar, 200);
  }

  useEffect(() => {
    const vv = window.visualViewport;
    const area = areaRef.current;
    if (!vv || !area) return;

    // TRAVA A ROLAGEM DO DASHBOARD enquanto a caixinha esta aberta. Com o
    // teclado aberto o iOS libera o scroll da pagina (pra "revelar" o que
    // esta atras do teclado) e dava pra rolar o dashboard inteiro por
    // tras. Aqui: overflow travado + bloqueio do arrasto fora do campo.
    const htmlEl = document.documentElement;
    const bodyEl = document.body;
    const overflowHtmlAntes = htmlEl.style.overflow;
    const overflowBodyAntes = bodyEl.style.overflow;
    htmlEl.style.overflow = "hidden";
    bodyEl.style.overflow = "hidden";

    const bloquearArrasto = (e) => {
      // Deixa rolar so dentro do proprio campo de texto (quando o texto
      // passa do tamanho da caixa).
      const alvo = e.target;
      if (alvo && alvo.tagName === "TEXTAREA") return;
      e.preventDefault();
    };
    document.addEventListener("touchmove", bloquearArrasto, { passive: false });

    // Faz o container acompanhar a area visivel. Como a caixa esta
    // alinhada ao fim dele, ela acompanha o teclado naturalmente.
    const ajustar = () => {
      const teclado = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      area.style.top = `${vv.offsetTop}px`;
      area.style.height = `${vv.height}px`;
      // Com teclado aberto, cola perto dele; sem teclado, um respiro maior.
      area.style.paddingBottom = teclado > 60 ? "10px" : "26px";
    };

    // Perdeu o foco = teclado descendo: a caixa fecha junto e o dashboard
    // volta ao normal. A checagem evita fechar quando o foco so pulou pra
    // outro campo por um instante.
    const aoSair = () => {
      setTimeout(() => {
        const a = document.activeElement;
        const digitando = a && (a.tagName === "INPUT" || a.tagName === "TEXTAREA");
        if (!digitando) fecharSuave();
      }, 80);
    };

    ajustar();
    vv.addEventListener("resize", ajustar);
    vv.addEventListener("scroll", ajustar);
    document.addEventListener("focusout", aoSair);
    return () => {
      vv.removeEventListener("resize", ajustar);
      vv.removeEventListener("scroll", ajustar);
      document.removeEventListener("focusout", aoSair);
      // Devolve a rolagem do dashboard ao fechar a caixinha.
      document.removeEventListener("touchmove", bloquearArrasto);
      htmlEl.style.overflow = overflowHtmlAntes;
      bodyEl.style.overflow = overflowBodyAntes;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return createPortal(
    <>
      <style>{`
        @keyframes caixaFiscoEntra {
          from { opacity: 0.35; transform: translateY(12px) scale(0.99); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes caixaFiscoSai {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to   { opacity: 0; transform: translateY(14px) scale(0.985); }
        }
        @media (prefers-reduced-motion: reduce) {
          .caixa-fisco-anima { animation: none !important; }
        }
      `}</style>

      {/* Fundo: fecha ao tocar fora */}
      <div
        className="fixed inset-0"
        style={{
          zIndex: 60,
          opacity: fechando ? 0 : 1,
          transition: "opacity 200ms ease-out",
        }}
        onClick={fecharSuave}
      />

      {/* Container = area visivel (acima do teclado). A caixa fica no fim
          dele, entao nunca cai atras do teclado. */}
      <div
        ref={areaRef}
        className="fixed flex flex-col justify-end"
        style={{
          zIndex: 61,
          left: 0,
          right: 0,
          top: 0,
          height: "100dvh",
          paddingLeft: 20,
          paddingRight: 20,
          paddingBottom: 26,
          pointerEvents: "none",
        }}
      >
        <div
          className="caixa-fisco-anima"
          style={{
            pointerEvents: "auto",
            animation: fechando
              ? "caixaFiscoSai 200ms cubic-bezier(0.4,0,1,1) forwards"
              : "caixaFiscoEntra 240ms cubic-bezier(0.22,0.61,0.36,1)",
          }}
        >
          <CaixaFiscoExpandida onEnviarPrimeira={onEnviarPrimeira} />
        </div>
      </div>
    </>,
    document.body,
  );
}

/* ===================================================================
   BOTAO DO BANCO — no canto de cima, no lugar do sino

   v4 (24/09/2026): o sino saiu. Aviso importante vai pelo WhatsApp e o
   canto de cima virou a porta para a conexao bancaria, que e uma das
   funcoes principais do app.

   v5: so o simbolo da Pluggy, sem circulo de fundo e SEM NUMERO.

   v6: o pontinho verde saiu. Sem banco conectado, aparece o texto
   "Conectar banco" ao lado do simbolo. Um brilho verde passa pelas
   letras, da esquerda para a direita, e quando chega ao simbolo ele da
   um pulinho com um brilho verde em volta. Pausa e repete. Depois da
   conexao o texto some e fica so o simbolo, no mesmo lugar.

   Tocar leva SEMPRE a tela "Conexao bancaria" (/conectar-banco).
   As entradas novas continuam aparecendo na conferencia (faixa
   PendenciasEntradas, em /lancar).

   SINCRONIZA AO ABRIR O APP
   Busca as entradas novas de todos os bancos conectados. No maximo uma
   vez a cada 30 minutos enquanto o app esta aberto (a variavel abaixo
   zera quando o app recarrega), para nao chamar a Pluggy toda vez que
   a pessoa volta ao inicio.
   =================================================================== */
const INTERVALO_SYNC_MS = 30 * 60 * 1000;
let ultimaSincronizacao = 0;

/* Tamanho do simbolo da Pluggy no canto de cima (altura em px).
   Para aumentar ou diminuir o simbolo, mude so este numero. */
const ALTURA_SIMBOLO_BANCO = 26;

/* Duracao de um ciclo do convite (brilho no texto + pulinho do simbolo),
   em segundos. Numero maior = mais calmo. */
const CICLO_CONVITE_S = 3.6;

function BotaoBanco({ onSincronizou }) {
  const navigate = useNavigate();
  const [estado, setEstado] = useState({ carregado: false, temBanco: false });

  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        const user = data?.user;
        if (!user) return;

        const conexoes = await listarConexoes(user.id);
        if (!ativo) return;
        setEstado({ carregado: true, temBanco: conexoes.length > 0 });

        // Sincroniza ao abrir o app (no maximo 1x a cada 30 min)
        if (conexoes.length && Date.now() - ultimaSincronizacao > INTERVALO_SYNC_MS) {
          ultimaSincronizacao = Date.now();
          await Promise.allSettled(conexoes.map((c) => sincronizar(user.id, c.id)));
          // Chegou entrada nova? O portao do Dashboard confere (v15)
          onSincronizou?.();
        }
      } catch {
        /* sem rede ou sem login — o botao fica so com o simbolo */
        if (ativo) setEstado((e) => ({ ...e, carregado: true }));
      }
    })();
    return () => { ativo = false; };
  }, []);

  // So mostra o convite depois de saber que NAO ha banco. Assim quem ja
  // tem banco nao ve o texto aparecer por um instante ao abrir o app.
  const mostrarConvite = estado.carregado && !estado.temBanco;

  return (
    <button
      onClick={() => navigate("/conectar-banco", DE_DASHBOARD)}
      aria-label={mostrarConvite ? "Conectar banco" : "Conexão bancária"}
      className="toque relative flex items-center shrink-0"
      style={{
        // Mesma altura da linha do logo (34) para o simbolo ficar
        // alinhado com o velocimetro do "TaCerto!".
        height: 34,
        gap: 4,
        background: "none",
        border: "none",
        padding: 0,
      }}
    >
      {mostrarConvite && (
        <>
          <style>{`
            @keyframes conviteBancoEntra {
              from { opacity: 0; transform: translateX(6px); }
              to   { opacity: 1; transform: translateX(0); }
            }
            /* O brilho atravessa o texto no primeiro terco do ciclo */
            @keyframes conviteBancoBrilho {
              0%       { background-position: 100% 0; }
              34%, 100% { background-position: 0% 0; }
            }
            /* ...e o simbolo pula quando o brilho chega nele */
            @keyframes conviteBancoPulo {
              0%, 28% {
                transform: scale(1);
                filter: drop-shadow(0 0 0 rgba(74,222,128,0));
              }
              36% {
                transform: scale(1.14);
                filter: drop-shadow(0 0 7px rgba(74,222,128,0.75));
              }
              44% { transform: scale(0.96); }
              52%, 100% {
                transform: scale(1);
                filter: drop-shadow(0 0 0 rgba(74,222,128,0));
              }
            }
            .convite-banco-texto {
              background-image: linear-gradient(
                90deg,
                var(--text-secondary) 0%,
                var(--text-secondary) 42%,
                #4ade80 50%,
                var(--text-secondary) 58%,
                var(--text-secondary) 100%
              );
              background-size: 250% 100%;
              background-position: 100% 0;
              -webkit-background-clip: text;
              background-clip: text;
              -webkit-text-fill-color: transparent;
              color: transparent;
              animation:
                conviteBancoEntra 450ms ease-out both,
                conviteBancoBrilho ${CICLO_CONVITE_S}s ease-in-out infinite;
            }
            .convite-banco-simbolo {
              animation: conviteBancoPulo ${CICLO_CONVITE_S}s ease-in-out infinite;
            }
            @media (prefers-reduced-motion: reduce) {
              .convite-banco-texto {
                animation: none;
                -webkit-text-fill-color: #4ade80;
                color: #4ade80;
              }
              .convite-banco-simbolo { animation: none; }
            }
          `}</style>
          <span
            className="convite-banco-texto font-semibold whitespace-nowrap"
            style={{ fontSize: 13, letterSpacing: "0.01em" }}
          >
            Conectar banco
          </span>
        </>
      )}

      {/* Caixa fixa de 44 x 34 em volta do simbolo: com ou sem o texto,
          o simbolo fica exatamente no mesmo lugar (nao "pula" de lado). */}
      <span
        className="flex items-center justify-center shrink-0"
        style={{ width: 44, height: 34 }}
      >
        <span
          className={mostrarConvite ? "convite-banco-simbolo" : undefined}
          style={{ display: "inline-flex" }}
        >
          <SimboloPluggy altura={ALTURA_SIMBOLO_BANCO} />
        </span>
      </span>
    </button>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const app = useAppState();
  const {
    nome, tipoMEI, faturamentoAtual, limiteAtual, limiteCheio, percentualAtual,
    mediaMensal, mediaLimite, cnpj, cnae, cnaesSecundarios,
    lancamentos, ultimaAtualizacaoVelocimetro,
  } = app;
  // v20: nome e tipo de MEI que vao nas mensagens prontas do WhatsApp
  // v30: e o CNPJ do perfil
  const dadosWhats = dadosParaWhatsApp({ nome, tipoMEI, cnpj });

  /* =================================================================
     PORTAO DAS ENTRADAS (v15 — pedido do Fernando, 27/09/2026)

     Se tem entrada nova esperando, a pessoa vai DIRETO para a
     conferencia ("É faturamento?" Sim/Não) e so volta a usar o app
     depois de confirmar tudo. Roda ao abrir o Dashboard e de novo
     quando a sincronizacao com o banco termina (BotaoBanco).

     Antes, organiza sozinho o que o Fisco ja sabe (pagadores que a
     pessoa ja confirmou como cliente): so manda para a conferencia se
     sobrar alguma entrada SEM regra.

     Sem rede ou sem login: nao faz nada — o app segue normal.
     (WhatsApp: quando as confirmacoes tambem acontecerem por la, o
     portao ja respeita — ele so olha o que esta pendente no banco.)
     ================================================================= */
  /* v32: o que a regra do pagador confirma sozinho passa pela mesma
     regra de nao contar duas vezes (lancarEntradasConfirmadas) */
  const appRef = useRef(app);
  appRef.current = app;
  const verificarEntradas = useCallback(async () => {
    try {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;
      if (!user) return;
      const { pendentes, organizadas } = await organizarPelasRegras(user.id, {
        tipoMEI: appRef.current.tipoMEI,
        aoConfirmar: (efetivas) => lancarEntradasConfirmadas(user.id, efetivas, () => appRef.current),
      });
      if (pendentes.length > 0) navigate("/conferir-entradas", { replace: true });
      /* v35: as regras resolveram tudo: o extrato ja pode tomar o lugar
         do total do ano digitado? (src/lib/conciliacao.js, regra 1) */
      else if (organizadas > 0) await substituirTotalPeloExtrato(user.id, () => appRef.current);
    } catch {
      /* sem rede: segue normal */
    }
  }, [navigate]);

  useEffect(() => {
    verificarEntradas();
  }, [verificarEntradas]);

  /* v31: selo e "Atualizado em" do velocimetro (visual F) */
  const conferidosDoExtrato = useConferidosDoExtrato();
  const seloVelocimetro = seloDoVelocimetro({ lancamentos, conferidosDoExtrato });
  const faltaInformar = !(Number(faturamentoAtual) > 0);

  // Card B: quanto a media por mes representa da media limite
  const percentualMedia = mediaLimite > 0 ? (mediaMensal / mediaLimite) * 100 : 0;

  // Situacao do ano (cor e perguntas do painel de duvidas)
  const faixaAnual = faixaDoVelocimetro(percentualAtual);

  const rotuloPerfil = LABEL_TIPO[tipoMEI];
  const saudacao = saudacaoPorHora();

  const [caixaExpandida, setCaixaExpandida] = useState(false);
  // v21: painel "Como voce quer pagar seu DAS?" (botao "Emitir boleto")
  const [folhaDas, setFolhaDas] = useState(false);
  // v26: Apresentacao do Fisco.ia (abre pela notificacao do sininho)
  const [apresentacao, setApresentacao] = useState(false);
  // v28: folha "Atualize seu velocimetro" (outra notificacao do sininho)
  const [folhaAtualizar, setFolhaAtualizar] = useState(false);
  function abrirNotificacao(id) {
    if (id === "apresentacao") setApresentacao(true);
    else if (id === "atualizar") setFolhaAtualizar(true);
  }

  /* v23: variacao do visual (ver "VARIACOES DO INICIO") */
  const [visual, setVisual] = useState(lerVisualInicio);
  function escolherVisual(v) {
    setVisual(v);
    try { localStorage.setItem(CHAVE_VISUAL_INICIO, v); } catch { /* ignora */ }
  }
  /* v30: CNAE principal + secundarios do perfil (valor do DAS) */
  const cnaesPerfil = [cnae, ...(cnaesSecundarios || [])].filter(Boolean);
  const das = dadosProximoDas(tipoMEI, cnaesPerfil);
  const acoesInicio = {
    das,
    onDas: () => setFolhaDas(true),
    onFisco: () => abrirWhatsAppFisco(MENSAGENS_WHATSAPP.falarComFisco(dadosWhats)),
    /* v33: o NF abre a janela "Notas fiscais" (MOSTRAR_JANELA_NOTAS) */
    onNota: () => navigate(MOSTRAR_JANELA_NOTAS ? "/notas-fiscais" : "/como-emitir-nota", DE_DASHBOARD),
  };
  const molduraVelocimetro = visual === "atual" ? "vidro" : visual === "b" ? "suave" : "nenhuma";
  /* v25: no F, o "+" fica sem circulo (BottomNav "simples") */
  const visualBarra = { atual: "vidro", a: "linha", b: "solta", c: "lisa", d: "lisa", e: "lisa", f: "simples", g: "simples" }[visual] || "vidro";
  /* v25: explicacao da media limite so aparece uma vez */
  const [mediaExplicada, marcarMediaExplicada] = useMediaExplicada();

  // Paineis dos baloes: null (fechado), "anual" (card A -> Tirar duvidas)
  // ou "media" (card B -> explicacao da media limite)
  const [painelDuvidas, setPainelDuvidas] = useState(null);

  /* O historico de conversas nao vive mais aqui: quem cuida dele e a
     pagina /fisco (ver ChatFiscoPagina + lib/chatHistorico). */

  // Abre a pagina do chat do Fisco (/fisco) levando a primeira mensagem.
  // A pagina cria a conversa, mostra a mensagem e dispara a resposta.
  function enviarPrimeiraMensagem(texto) {
    setCaixaExpandida(false);
    navigate("/fisco", { state: { primeiraMensagem: texto } });
  }

  function perguntarAoFisco(texto) {
    setPainelDuvidas(null);
    navigate("/fisco", { state: { primeiraMensagem: texto } });
  }

  return (
    <div
      className="tela-fixa w-full flex flex-col"
      style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
    >
      <div
        className="flex-1 flex flex-col min-h-0"
        style={{ paddingBottom: "calc(76px + env(safe-area-inset-bottom))" }}
      >
        {/* v23: seletor de teste do visual (some com a chave desligada) */}
        {MOSTRAR_SELETOR_VISUAL_INICIO && <SeletorVisualInicio visual={visual} onEscolher={escolherVisual} />}

        <header className="px-5 pt-4 pb-1 flex items-start justify-between shrink-0">
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2.5">
              <Gauge size={34} style={{ color: "var(--primary)" }} strokeWidth={2.2} className="shrink-0" />
              <span
                className="font-bold text-2xl leading-none"
                style={{ color: "var(--text)" }}
              >
                Ta<span style={{ color: "var(--primary)" }}>Certo!</span>
              </span>
            </div>
            <div className="flex items-baseline gap-1.5 min-w-0" style={{ marginTop: 6 }}>
              <span
                className="font-semibold shrink-0"
                style={{ color: "var(--text-secondary)", fontSize: 14, letterSpacing: "0.01em" }}
              >
                {saudacao.replace(/,\s*$/, "")}
              </span>
              <span
                className="font-extrabold leading-none truncate"
                style={{ color: "var(--text)", fontSize: 19 }}
              >
                {nome ? truncarNome(nome) : "Bem-vindo"}
              </span>
            </div>
          </div>

          {/* Piloto: sem Open Finance, sem o botao do banco (v18); no lugar,
              o botao pequeno do tutorial da nota (v19) */}
          <div className="flex items-center shrink-0" style={{ gap: 8 }}>
            {/* v23: nas variacoes, "Como emitir nota" vai para baixo */}
            {MOSTRAR_TUTORIAL_NOTA && visual === "atual" && <BotaoComoEmitirNota />}
            {MOSTRAR_OPEN_FINANCE && <BotaoBanco onSincronizou={verificarEntradas} />}
            {/* v26: sininho discreto das notificacoes */}
            {MOSTRAR_NOTIFICACOES && (
              <BotaoNotificacoes onAbrir={abrirNotificacao} />
            )}
          </div>
        </header>

        <div className="px-5 pt-2 flex-1 flex flex-col min-h-0 relative">
          {/* v27: "tela B" (G) — os 3 atalhos em cima do velocimetro */}
          {visual === "g" && <InicioBarra {...acoesInicio} emCima />}

          <CardVelocimetroCarrossel
            rotuloPerfil={rotuloPerfil}
            percentual={percentualAtual}
            faturado={faturamentoAtual}
            limite={limiteAtual}
            percentualMedia={percentualMedia}
            mediaMensal={mediaMensal}
            mediaLimite={mediaLimite}
            onDuvidas={(qual) => setPainelDuvidas(qual)}
            onResumo={() =>
              navigate(MOSTRAR_RESUMO_ANO ? "/perfil/resumo" : "/historico", DE_DASHBOARD)
            }
            onExcedente={() => navigate("/regra-vinte", DE_DASHBOARD)}
            moldura={molduraVelocimetro}
            mediaExplicada={mediaExplicada}
            grande={visual === "f"}
            selo={visual === "f" ? seloVelocimetro : null}
          />

          {/* v31: "Atualizado em..." + "Atualizar velocímetro" (so no F) */}
          {visual === "f" && (
            <LinhaAtualizacao
              quando={ultimaAtualizacaoVelocimetro}
              faltaInformar={faltaInformar}
              onAtualizar={() => setFolhaAtualizar(true)}
            />
          )}

          {/* Piloto (v19): proximo DAS, logo abaixo do velocimetro */}
          {MOSTRAR_CARD_DAS && visual === "atual" && (
            <CardProximoDas tipoMEI={tipoMEI} cnaes={cnaesPerfil} onEmitirBoleto={() => setFolhaDas(true)} />
          )}

          {/* Piloto (v18): o Fisco atende pelo WhatsApp */}
          {!MOSTRAR_CHAT_FISCO && visual === "atual" && <BotaoFiscoWhatsApp dadosWhats={dadosWhats} />}

          {/* v23: variacoes A, B e C (mesmo conteudo, sem vidro) */}
          {visual === "a" && <InicioLista {...acoesInicio} />}
          {visual === "b" && <InicioBlocos {...acoesInicio} />}
          {visual === "c" && <InicioAtalhos {...acoesInicio} />}
          {/* v24: variacoes novas D, E e F */}
          {visual === "d" && <InicioCartoes {...acoesInicio} />}
          {visual === "e" && <InicioDestaque {...acoesInicio} />}
          {/* v28: respiro entre as bolinhas e a barra (sobe o velocimetro) */}
          {visual === "f" && <div aria-hidden style={RESPIRO_ACIMA_DA_BARRA} />}
          {visual === "f" && <InicioBarra {...acoesInicio} />}
          {visual === "f" && <div aria-hidden style={RESPIRO_ABAIXO_DA_BARRA} />}
          {visual !== "atual" && visual !== "f" && <div aria-hidden className="shrink-0" style={{ height: 12 }} />}

          {caixaExpandida && (
            <CaixaFiscoFlutuante
              onFechar={() => setCaixaExpandida(false)}
              onEnviarPrimeira={enviarPrimeiraMensagem}
            />
          )}

          {MOSTRAR_CHAT_FISCO && (
          <button
            onClick={() => setCaixaExpandida(true)}
            className="shrink-0 w-full flex items-start gap-2"
            style={{
              background: "none",
              border: "none",
              padding: 0,
              marginTop: 4,
              marginBottom: 12,
            }}
          >
              <span
                className="relative shrink-0 rounded-full flex items-center justify-center"
                style={{
                  width: 96,
                  height: 96,
                  ...VIDRO,
                  border: "1.5px solid rgba(34,197,94,0.45)",
                }}
              >
                <span className="rounded-full overflow-hidden flex items-center justify-center" style={{ width: "100%", height: "100%" }}>
                  <img
                    src="/fisco-perfil.png"
                    alt="Fisco"
                    style={{
                      width: "108%",
                      height: "108%",
                      objectFit: "cover",
                      objectPosition: "50% 18%",
                    }}
                  />
                </span>
                <span
                  className="absolute rounded-full"
                  style={{
                    width: 26,
                    height: 26,
                    backgroundColor: "var(--primary)",
                    border: "4px solid var(--bg)",
                    bottom: 2,
                    right: 2,
                  }}
                />
              </span>

              <span
                className="toque relative flex-1 flex items-center gap-2 text-left min-w-0 rounded-full"
                style={{
                  ...VIDRO_SUAVE,
                  height: 48,
                  paddingLeft: 18,
                  paddingRight: 12,
                  marginTop: 24,
                  // So a barrinha some quando a caixa expandida esta aberta.
                  // A foto do Fisco fica fixa, inclusive durante o fecho.
                  visibility: caixaExpandida ? "hidden" : "visible",
                }}
              >
                <BordaCorrendo />

                <span
                  className="flex-1 truncate"
                  style={{
                    color: "var(--text-tertiary)",
                    fontSize: 15,
                    fontStyle: "italic",
                    fontFamily: '"Comic Neue", "Chalkboard SE", "Comic Sans MS", cursive',
                  }}
                >
                  Pergunte ao Fisco...
                </span>

                <Send
                  size={22}
                  strokeWidth={2.2}
                  className="shrink-0"
                  style={{ color: "var(--primary)" }}
                />
              </span>
            </button>
          )}
        </div>
      </div>

      <PainelPerguntas
        aberto={MOSTRAR_CHAT_FISCO && painelDuvidas === "anual"}
        onFechar={() => setPainelDuvidas(null)}
        perguntas={perguntasDaSituacao(faixaAnual)}
        corFaixa={FAIXA_INFO[faixaAnual].cor}
        mostrarRegra20={faixaAnual === "estourou" || faixaAnual === "critico"}
        onPerguntar={perguntarAoFisco}
        onRegra20={() => {
          setPainelDuvidas(null);
          navigate("/regra-vinte", DE_DASHBOARD);
        }}
      />

      {MOSTRAR_CARD_DAS && (
        <FolhaPagarDas aberto={folhaDas} onFechar={() => setFolhaDas(false)} />
      )}

      {MOSTRAR_NOTIFICACOES && (
        <ApresentacaoFisco aberto={apresentacao} onFechar={() => setApresentacao(false)} />
      )}
      {/* v31: abre pelo sininho E pelo botao "Atualizar velocímetro" */}
      <FolhaAtualizarVelocimetro aberto={folhaAtualizar} onFechar={() => setFolhaAtualizar(false)} />

      <PainelMediaLimite
        aberto={painelDuvidas === "media"}
        onFechar={() => {
          setPainelDuvidas(null);
          marcarMediaExplicada();
        }}
        limiteAnual={limiteCheio}
        mediaLimite={mediaLimite}
      />

      {/* O rodape some enquanto a caixinha do Fisco esta aberta: ele
          ficava por cima dela e "roubava" o espaco acima do teclado. */}
      {!caixaExpandida && <BottomNav ativo="inicio" visual={visualBarra} />}
    </div>
  );
}