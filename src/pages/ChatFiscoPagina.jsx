/* CHATFISCOPAGINA v1 — chat da Isa no app: responde com o motor de respostas prontas que ja existia (faqFisco, sem IA nova); o que nao souber mostra o botao "Falar com a Isa no WhatsApp" (com a pergunta); toda conversa comeca com "Oi, sou a Isa, a assistente com IA do TaCerto." e as perguntas comuns (antes respondia sempre "Ainda estou aprendendo...") */
import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ChatFiscoUI from "../components/ChatFiscoUI.jsx";
import { useAppState } from "@/context/AppStateContext";
import { contextoFaq, responderPergunta, perguntasGerais, textoPergunta } from "@/lib/faqFisco";
import {
  FRASE_APRESENTACAO_ISA, MENSAGENS_WHATSAPP, dadosParaWhatsApp, abrirWhatsAppFisco,
} from "@/config/piloto";
import {
  lerConversas, salvarConversa, apagarConversa, novoIdConversa,
  carregarConversasDoBanco,
} from "@/lib/chatHistorico";

/* ===================================================================
   PAGINA /fisco — o chat da Isa em tela cheia (nome interno "fisco").

   Fluxo: no dashboard a pessoa digita na caixinha "Pergunte à Isa"
   e envia. O dashboard navega pra ca passando a primeira mensagem em
   location.state.primeiraMensagem. Aqui a gente cria a conversa, mostra
   a mensagem dela e dispara a resposta da Isa.

   v1 (10/10/2026): a resposta vem do faqFisco (responderPergunta), o
   mesmo motor de respostas prontas que o chat antigo (Chat.jsx) usava.
   Toda conversa comeca com a fala da Isa (FRASE_APRESENTACAO_ISA). Sem
   resposta pronta: a bolha marca acao "whatsapp" e o ChatFiscoUI mostra
   o botao "Falar com a Isa no WhatsApp" logo abaixo (a mensagem pronta
   leva a pergunta). O botao abre DENTRO do toque (regra do iPhone).

   Se abrir /fisco sem primeira mensagem (ex.: link direto), comeca uma
   conversa vazia — a pessoa digita na propria pagina.
   =================================================================== */
export default function ChatFiscoPagina() {
  const navigate = useNavigate();
  const location = useLocation();
  const app = useAppState();
  const appRef = useRef(app);
  appRef.current = app;

  /* v1: fala de abertura da Isa (primeira bolha de toda conversa) */
  function falaDeAbertura() {
    return { id: Date.now() - 1, autor: "fisco", texto: FRASE_APRESENTACAO_ISA };
  }
  /* v1: perguntas comuns, na conversa que ainda nao comecou */
  const ctxAgora = contextoFaq({ tipoMEI: app.tipoMEI, limite: app.limiteAtual, faturado: app.faturamentoAtual });
  const perguntasProntas = perguntasGerais().map((item) => textoPergunta(item, ctxAgora));

  const [mensagens, setMensagens] = useState([]);
  const [digitando, setDigitando] = useState(false);
  const [conversas, setConversas] = useState([]);
  const [idConversa, setIdConversa] = useState(null);

  // Evita processar a primeira mensagem duas vezes (StrictMode roda o
  // efeito 2x em dev).
  const primeiraTratada = useRef(false);

  /* NOTA: no Safari, arrastar da borda esquerda volta pro dashboard.
     Nao da pra bloquear esse gesto por codigo - o iOS o trata no nivel do
     sistema e so avisa a pagina depois que ja aconteceu. Tentar prender a
     rota deixava a tela indo e voltando, pior que o gesto em si. Como o
     destino e o mesmo do X (o dashboard), fica assim por enquanto e some
     quando o app for empacotado com Capacitor (ver PENDENCIAS_FUTURAS.md). */

  // Carrega a lista de conversas salvas ao montar.
  useEffect(() => {
    setConversas(lerConversas());
    carregarConversasDoBanco().then((lista) => setConversas(lista));
  }, []);

  // Ao montar, se veio uma primeira mensagem do dashboard, dispara ela.
  useEffect(() => {
    if (primeiraTratada.current) return;
    primeiraTratada.current = true;

    const texto = location.state?.primeiraMensagem;
    if (texto && String(texto).trim()) {
      const minhaMsg = { id: Date.now(), autor: "user", texto: String(texto).trim() };
      setIdConversa(novoIdConversa());
      setMensagens([falaDeAbertura(), minhaMsg]);
      responderComoFisco(minhaMsg.texto);
      // Limpa o state pra um refresh nao reenviar a mesma mensagem.
      navigate(location.pathname, { replace: true, state: {} });
    } else {
      // v1: conversa nova sem pergunta: a Isa se apresenta
      setMensagens([falaDeAbertura()]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Salva sempre que a conversa muda (e nao esta no meio de uma resposta).
  // v1: so a fala de abertura (ninguem perguntou nada) nao e salva.
  useEffect(() => {
    if (!idConversa || mensagens.length === 0 || digitando) return;
    if (!mensagens.some((m) => m.autor === "user")) return;
    salvarConversa(idConversa, mensagens);
    setConversas(lerConversas());
  }, [mensagens, digitando, idConversa]);

  /* v1: resposta pelo faqFisco (respostas prontas, src/lib/faqFisco.js).
     Sem resposta: { acao: "whatsapp", pergunta } e o chat mostra o botao. */
  function responderComoFisco(pergunta) {
    setDigitando(true);
    // Tempo "digitando": ~1,2s, com leve variacao
    const tempo = 1100 + Math.floor(Math.random() * 300);
    setTimeout(() => {
      const a = appRef.current;
      const ctx = contextoFaq({ tipoMEI: a.tipoMEI, limite: a.limiteAtual, faturado: a.faturamentoAtual });
      const r = responderPergunta(pergunta, ctx);
      setDigitando(false);
      setMensagens((m) => [
        ...m,
        {
          id: Date.now() + 1,
          autor: "fisco",
          texto: r.texto,
          ...(r.achou ? {} : { acao: "whatsapp", pergunta }),
        },
      ]);
    }, tempo);
  }

  /* v1: "Falar com a Isa no WhatsApp" (chamado dentro do toque) */
  function falarNoWhatsApp(msg) {
    abrirWhatsAppFisco(MENSAGENS_WHATSAPP.duvidaDoChat(dadosParaWhatsApp(appRef.current), msg?.pergunta || ""));
  }

  function enviarMensagem(texto, respondendo) {
    const minhaMsg = {
      id: Date.now(),
      autor: "user",
      texto,
      ...(respondendo ? { citando: respondendo.texto } : {}),
    };
    if (!idConversa) setIdConversa(novoIdConversa());
    setMensagens((m) => [...(m.length ? m : [falaDeAbertura()]), minhaMsg]);
    responderComoFisco(texto);
  }

  function editarMensagem(id, novoTexto) {
    setMensagens((m) =>
      m.map((msg) => (msg.id === id ? { ...msg, texto: novoTexto } : msg)),
    );
  }

  function abrirConversa(id) {
    const c = lerConversas().find((x) => x.id === id);
    if (!c) return;
    setIdConversa(c.id);
    setMensagens(c.mensagens);
  }

  function novaConversa() {
    setIdConversa(null);
    setMensagens([falaDeAbertura()]);
  }

  function removerConversa(id) {
    apagarConversa(id);
    const restantes = lerConversas();
    setConversas(restantes);
    if (id === idConversa) {
      setIdConversa(null);
      setMensagens([falaDeAbertura()]);
    }
  }

  return (
    <ChatFiscoUI
      mensagens={mensagens}
      digitando={digitando}
      onEnviar={enviarMensagem}
      onEditarMensagem={editarMensagem}
      onFechar={() => navigate("/dashboard")}
      conversas={conversas}
      idAtual={idConversa}
      onAbrirConversa={abrirConversa}
      onNovaConversa={novaConversa}
      onApagarConversa={removerConversa}
      onWhatsApp={falarNoWhatsApp}
      perguntasProntas={mensagens.some((m) => m.autor === "user") ? [] : perguntasProntas}
      onPerguntaPronta={(texto) => enviarMensagem(texto)}
    />
  );
}