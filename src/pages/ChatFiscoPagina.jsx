/* CHATFISCOPAGINA v6 — espera a Isa até 50s (check-up do CNPJ faz duas consultas) (v5: a Isa monta a nota fiscal pelo chat (texto ou ditado): a IA devolve os dados, aparece um cartão para conferir e só emite no toque "Emitir" (/api/nfse/emitir); nada é emitido sem a pessoa confirmar (v4: IA opcional desligada, fallback e dúvidas locais; sem saída para WhatsApp (v3: aba Isa)) */
import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ChatFiscoUI from "../components/ChatFiscoUI.jsx";
import { MOSTRAR_EMISSAO_PROPRIA, CODIGO_SERVICO_NOTA } from "@/config/piloto";
import { toast } from "sonner";
import { deixarArquivoPendente } from "@/lib/arquivoPendente";
import { useAppState } from "@/context/AppStateContext";
import { contextoFaq, responderPergunta, perguntasGerais, textoPergunta } from "@/lib/faqFisco";
import { supabase } from "@/lib/supabase";
import { LIMITE_PERGUNTA_CHAT, valorDasMensal } from "@/lib/fiscal";
import {
  FRASE_APRESENTACAO_ISA, ISA_IA_ATIVA, FRASE_ISA_NAO_SEI,
} from "@/config/piloto";
import {
  lerConversas, salvarConversa, apagarConversa, novoIdConversa,
  carregarConversasDoBanco,
} from "@/lib/chatHistorico";

// Sem envio ao banco: dúvidas da fase desligada ficam apenas neste aparelho.
function guardarDuvidaLocal(pergunta, conta) {
  try {
    const chave = `tacerto_isa_duvidas:${conta || "visitante"}`;
    const salvo = JSON.parse(localStorage.getItem(chave) || "[]");
    const lista = Array.isArray(salvo) ? salvo : [];
    localStorage.setItem(chave, JSON.stringify([...lista, { pergunta, criado_em: new Date().toISOString(), respondida: false }]));
  } catch { /* armazenamento indisponível não derruba o chat */ }
}

// Conversas antigas não voltam a oferecer a ação de saída removida.
function mensagensAtuais(lista) {
  return lista.map(({ acao, ...m }) => acao ? { ...m, texto: FRASE_ISA_NAO_SEI } : m);
}

/* ===================================================================
   PAGINA /fisco — o chat da Isa em tela cheia (nome interno "fisco").

   Fluxo: no dashboard a pessoa digita na caixinha "Pergunte à Isa"
   e envia. O dashboard navega pra ca passando a primeira mensagem em
   location.state.primeiraMensagem. Aqui a gente cria a conversa, mostra
   a mensagem dela e dispara a resposta da Isa.

   Bloco 6: responde pela IA somente com a chave ligada. Na falha,
   usa faqFisco; sem resposta pronta, guarda a duvida no aparelho.

   Se abrir /fisco sem primeira mensagem (ex.: link direto), comeca uma
   conversa vazia — a pessoa digita na propria pagina.
   =================================================================== */
export default function ChatFiscoPagina({ aba = false }) {
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
  const requisicaoRef = useRef(0);
  const ocupadaRef = useRef(false);
  const abortarRef = useRef(null);

  function interromperResposta() {
    requisicaoRef.current++;
    ocupadaRef.current = false;
    abortarRef.current?.abort();
    abortarRef.current = null;
    setDigitando(false);
  }
  useEffect(() => () => {
    requisicaoRef.current++;
    abortarRef.current?.abort();
  }, []);

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
    carregarConversasDoBanco({ somenteLocal: !ISA_IA_ATIVA }).then((lista) => setConversas(lista));
  }, []);

  // Ao montar, se veio uma primeira mensagem do dashboard, dispara ela.
  useEffect(() => {
    if (primeiraTratada.current) return;
    let ativo = true;
    // Só inicia após a montagem: o ciclo de teste do StrictMode não duplica
    // a chamada nem cancela a única resposta à primeira mensagem.
    queueMicrotask(() => {
      if (!ativo || primeiraTratada.current) return;
      primeiraTratada.current = true;
      const texto = location.state?.primeiraMensagem;
      if (texto && String(texto).trim()) {
        const minhaMsg = { id: Date.now(), autor: "user", texto: String(texto).trim().slice(0, LIMITE_PERGUNTA_CHAT) };
        setIdConversa(novoIdConversa());
        setMensagens([falaDeAbertura(), minhaMsg]);
        responderComoFisco(minhaMsg.texto);
        navigate(location.pathname, { replace: true, state: {} });
      } else {
        setMensagens([falaDeAbertura()]);
      }
    });
    return () => { ativo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Salva sempre que a conversa muda (e nao esta no meio de uma resposta).
  // v1: so a fala de abertura (ninguem perguntou nada) nao e salva.
  useEffect(() => {
    if (!idConversa || mensagens.length === 0 || digitando) return;
    if (!mensagens.some((m) => m.autor === "user")) return;
    salvarConversa(idConversa, mensagens, { somenteLocal: !ISA_IA_ATIVA });
    setConversas(lerConversas());
  }, [mensagens, digitando, idConversa]);

  async function responderComoFisco(pergunta) {
    if (ocupadaRef.current) return;
    ocupadaRef.current = true;
    const requisicao = ++requisicaoRef.current;
    setDigitando(true);
    try {
      const a = appRef.current;
      let resposta = null;
      let notaProposta = null;
      if (ISA_IA_ATIVA) {
        const controle = new AbortController();
        abortarRef.current = controle;
        const tempo = setTimeout(() => controle.abort(), 50000);
        try {
          const cnaes = [a.cnae, ...(Array.isArray(a.cnaesSecundarios) ? a.cnaesSecundarios : [])].filter(Boolean);
          const historico = mensagens.filter((m) => m.autor === "user" || m.autor === "fisco").slice(-6)
            .map((m) => ({ role: m.autor === "user" ? "user" : "assistant", content: m.texto }));
          const { data, error } = await supabase.functions.invoke("isa-chat", {
            signal: controle.signal,
            body: { pergunta, historico, contexto: {
              tipoMEI: a.tipoMEI, faturado: a.faturamentoAtual, limite: a.limiteAtual,
              valorDas: valorDasMensal(a.tipoMEI, cnaes), cnaes,
            }, recursos: { emitirNota: MOSTRAR_EMISSAO_PROPRIA } },
          });
          if (!error && !data?.erro && typeof data?.resposta === "string" && data.resposta.trim()) {
            resposta = data.resposta;
            if (data.nota && MOSTRAR_EMISSAO_PROPRIA) notaProposta = { ...data.nota, estado: "conferir" };
          }
        } catch { /* sem função, rede ou chave: usa a resposta pronta */ }
        finally { clearTimeout(tempo); }
      } else {
        await new Promise((resolve) => setTimeout(resolve, 1100));
      }
      if (requisicao !== requisicaoRef.current) return;
      if (!resposta) {
        const ctx = contextoFaq({ tipoMEI: a.tipoMEI, limite: a.limiteAtual, faturado: a.faturamentoAtual });
        const pronta = responderPergunta(pergunta, ctx);
        resposta = pronta.achou ? pronta.texto : FRASE_ISA_NAO_SEI;
        if (!pronta.achou) guardarDuvidaLocal(pergunta, a.email);
      }
      setMensagens((m) => [...m, { id: Date.now() + 1, autor: "fisco", texto: resposta, ...(notaProposta ? { nota: notaProposta } : {}) }]);
    } finally {
      if (requisicao === requisicaoRef.current) {
        ocupadaRef.current = false;
        abortarRef.current = null;
        setDigitando(false);
      }
    }
  }

  function enviarMensagem(texto, respondendo) {
    if (ocupadaRef.current) return;
    texto = String(texto || "").trim().slice(0, LIMITE_PERGUNTA_CHAT);
    if (!texto) return;
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
    interromperResposta();
    setIdConversa(c.id);
    setMensagens(mensagensAtuais(c.mensagens));
  }

  function novaConversa() {
    interromperResposta();
    setIdConversa(null);
    setMensagens([falaDeAbertura()]);
  }

  function removerConversa(id) {
    apagarConversa(id);
    const restantes = lerConversas();
    setConversas(restantes);
    if (id === idConversa) {
      interromperResposta();
      setIdConversa(null);
      setMensagens([falaDeAbertura()]);
    }
  }

  /* Nota montada pela Isa: só emite quando a pessoa toca "Emitir". */
  function mudarNota(id, mudanca) {
    setMensagens((lista) => lista.map((m) => (m.id === id ? { ...m, nota: { ...m.nota, ...mudanca } } : m)));
  }
  async function emitirNotaDaConversa(msg) {
    const n = msg.nota;
    if (!n || n.estado === "emitindo" || n.estado === "emitida") return;
    mudarNota(msg.id, { estado: "emitindo" });
    try {
      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;
      const r = await fetch("/api/nfse/emitir", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          valor: n.valor, descricao: n.descricao, cTribNac: CODIGO_SERVICO_NOTA,
          ...(n.tomadorDocumento ? { tomador: { documento: n.tomadorDocumento, nome: n.tomadorNome || "" } } : {}),
        }),
      });
      const resp = await r.json().catch(() => null);
      if (resp?.ok) {
        mudarNota(msg.id, { estado: "emitida", chaveAcesso: resp.chaveAcesso, pdfBase64: resp.pdfBase64, teste: resp.ambiente !== "producao" });
      } else {
        mudarNota(msg.id, { estado: "conferir" });
        toast(resp?.mensagem || "Não deu para emitir agora. Tente de novo.");
      }
    } catch {
      mudarNota(msg.id, { estado: "conferir" });
      toast("Sem conexão. Tente de novo.");
    }
  }

  /* Arquivos seguem para o lançamento; ditado é tratado no ChatFiscoUI. */
  function receberAnexo(tipo, arquivo) {
    if (tipo === "extrato") return navigate("/enviar-extrato", { state: { de: "fisco" } });
    if (!arquivo) return;
    deixarArquivoPendente(arquivo);
    navigate("/lancar", { state: { de: "fisco" } });
  }

  return (
    <ChatFiscoUI
      mensagens={mensagens}
      digitando={digitando}
      onEnviar={enviarMensagem}
      onEditarMensagem={editarMensagem}
      onFechar={aba ? null : () => navigate("/dashboard")}
      comRodape={aba}
      conversas={conversas}
      idAtual={idConversa}
      onAbrirConversa={abrirConversa}
      onNovaConversa={novaConversa}
      onApagarConversa={removerConversa}
      perguntasProntas={mensagens.some((m) => m.autor === "user") ? [] : perguntasProntas}
      onPerguntaPronta={(texto) => enviarMensagem(texto)}
      onAnexo={receberAnexo}
      onEmitirNota={emitirNotaDaConversa}
    />
  );
}
