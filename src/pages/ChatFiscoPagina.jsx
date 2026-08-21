import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ChatFiscoUI from "../components/ChatFiscoUI.jsx";
import {
  lerConversas, salvarConversa, apagarConversa, novoIdConversa,
  carregarConversasDoBanco,
} from "@/lib/chatHistorico";

/* ===================================================================
   PAGINA /fisco — o chat do Fisco em tela cheia.

   Fluxo: no dashboard a pessoa digita na caixinha "Pergunte ao Fisco"
   e envia. O dashboard navega pra ca passando a primeira mensagem em
   location.state.primeiraMensagem. Aqui a gente cria a conversa, mostra
   a mensagem dela e dispara a resposta do Fisco.

   Se abrir /fisco sem primeira mensagem (ex.: link direto), comeca uma
   conversa vazia — a pessoa digita na propria pagina.
   =================================================================== */
export default function ChatFiscoPagina() {
  const navigate = useNavigate();
  const location = useLocation();

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
      setMensagens([minhaMsg]);
      responderComoFisco();
      // Limpa o state pra um refresh nao reenviar a mesma mensagem.
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Salva sempre que a conversa muda (e nao esta no meio de uma resposta).
  useEffect(() => {
    if (!idConversa || mensagens.length === 0 || digitando) return;
    salvarConversa(idConversa, mensagens);
    setConversas(lerConversas());
  }, [mensagens, digitando, idConversa]);

  function responderComoFisco() {
    setDigitando(true);
    // Tempo "pensando/digitando": ~2s, com leve variacao (2,0s a 2,4s)
    // pra nao parecer robotico sempre igual.
    const tempo = 2000 + Math.floor(Math.random() * 400);
    setTimeout(() => {
      setDigitando(false);
      setMensagens((m) => [
        ...m,
        {
          id: Date.now() + 1,
          autor: "fisco",
          texto: "Ainda estou aprendendo a responder de verdade, mas em breve vou te ajudar com isso!",
        },
      ]);
    }, tempo);
  }

  function enviarMensagem(texto, respondendo) {
    const minhaMsg = {
      id: Date.now(),
      autor: "user",
      texto,
      ...(respondendo ? { citando: respondendo.texto } : {}),
    };
    if (!idConversa) setIdConversa(novoIdConversa());
    setMensagens((m) => [...m, minhaMsg]);
    responderComoFisco();
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
    setMensagens([]);
  }

  function removerConversa(id) {
    apagarConversa(id);
    const restantes = lerConversas();
    setConversas(restantes);
    if (id === idConversa) {
      setIdConversa(null);
      setMensagens([]);
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
    />
  );
}