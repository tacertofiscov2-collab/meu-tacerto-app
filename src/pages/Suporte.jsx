/* SUPORTE v3 — "Preciso emitir nota?" com a regra do agregado (v2: correcoes de 08-10: DAS vence dia 20 e, se nao for dia util, no proximo dia util; NFS-e so para frete na mesma cidade (agregado sem IE em MG hoje nao emite); A1 a preco de custo (R$ 100,34) (v1: chat de suporte dentro do app (Perfil > Ajuda): perguntas prontas por assunto para afunilar; se nao resolver, a pessoa escreve e vai pro WhatsApp do suporte com tudo anotado */
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import TopoRolavel from "../components/TopoRolavel.jsx";
import IconeWhatsApp from "../components/IconeWhatsApp.jsx";
import { useAppState } from "@/context/AppStateContext";
import { MENSAGENS_WHATSAPP, dadosParaWhatsApp, abrirWhatsAppFisco } from "@/config/piloto";

/* ===================================================================
   SUPORTE (06/10/2026 — pedido do Fernando)

   "Falar com o suporte" (Perfil > Ajuda) abre este chat DENTRO do app.
   E o atendimento HUMANO: as perguntas prontas so afunilam o assunto
   antes de chegar no Fernando.
     1. Sobre o que e? (assuntos)
     2. Qual destas e a sua duvida? (perguntas prontas do assunto)
     3. Resposta curta + "Isso resolveu?"
     4. Nao resolveu (ou "minha duvida e outra"): a pessoa escreve em
        poucas palavras e toca em "Abrir o WhatsApp do suporte": a
        mensagem vai pronta com assunto, pergunta e o que ela escreveu
        (MENSAGENS_WHATSAPP.suporte). Uma pessoa da equipe responde la.
   O campo de escrever fica NO MEIO da conversa (nao preso embaixo):
   assim o teclado do iPhone nao cobre nada.
   ⚠️ Respostas provisorias: conferir com o contador as de DAS e IR.
   =================================================================== */
const ASSUNTOS = [
  {
    id: "velocimetro",
    rotulo: "Velocímetro e limite",
    perguntas: [
      {
        p: "O que o velocímetro mostra?",
        r: "Quanto do limite do ano você já usou. O limite é de R$ 81 mil por ano (MEI Caminhoneiro: R$ 251,6 mil). Ele soma tudo que você lança.",
      },
      {
        p: "Lancei errado. Como corrijo?",
        r: "No Perfil, toque em Histórico de lançamentos. Cada lançamento tem o lápis (editar) e a lixeira (apagar).",
      },
      {
        p: "Como atualizo o total do ano?",
        r: "Toque no + e escolha Total do ano. Digite quanto já faturou no ano e pronto: o velocímetro fica igual.",
      },
      {
        p: "E se eu passar do limite?",
        r: "Até 20% acima, você continua MEI até dezembro e paga uma guia a mais. Acima disso, muda de regime. O app te avisa antes.",
      },
    ],
  },
  {
    id: "das",
    rotulo: "DAS",
    perguntas: [
      {
        p: "Quando vence o DAS?",
        r: "Dia 20. Se cair em fim de semana ou feriado, vence no próximo dia útil. Pagando em dia, você mantém seus direitos no INSS.",
      },
      {
        p: "Como recebo o boleto?",
        r: "No Início, toque em DAS e escolha receber o boleto no WhatsApp. A gente manda pronto antes do vencimento.",
      },
      {
        p: "Atrasei. E agora?",
        r: "Dá para pagar atrasado: o boleto novo já vem com multa e juros. Peça no DAS do Início que a gente gera pra você.",
      },
      {
        p: "Tenho meses antigos sem pagar",
        r: "A gente consulta com você no site do governo quais meses faltam e gera os boletos. Toque em \"Ainda preciso de ajuda\".",
      },
    ],
  },
  {
    id: "nota",
    rotulo: "Nota fiscal",
    perguntas: [
      {
        p: "Preciso emitir nota?",
        r: "Para empresa, em geral sim. Agregado de transportadora em MG, sem Inscrição Estadual, hoje não emite: quem emite é a transportadora. A partir de 2027, o MEI emite em todo serviço, inclusive para pessoa física.",
      },
      {
        p: "Como emito?",
        r: "No Início, toque em NF. Lá diz quando você precisa emitir e como: com o Fisco no WhatsApp, sozinho ou automática, com o Certificado A1.",
      },
      {
        p: "O que é o Certificado A1?",
        r: "A identidade digital do seu CNPJ. Com ele, a nota sai automática e você só confirma. Custa R$ 100,34 por 1 ano, preço de custo: o TaCerto não ganha nada.",
      },
      {
        p: "NFS-e ou CT-e?",
        r: "NFS-e só para frete na mesma cidade. Frete entre cidades, contratado direto, é CT-e. Agregado de transportadora em MG, sem Inscrição Estadual, hoje não emite: quem emite é a transportadora.",
      },
    ],
  },
  {
    id: "declaracao",
    rotulo: "Declaração anual",
    perguntas: [
      {
        p: "Quando entrego?",
        r: "A do MEI vai até 31 de maio, sobre o ano anterior. Mesmo se não faturou nada.",
      },
      {
        p: "Preciso declarar Imposto de Renda?",
        r: "Depende do que sobrou de lucro. No Perfil, em Declaração anual, toque em Calcular: o app te mostra em 1 minuto.",
      },
      {
        p: "Vocês fazem pra mim?",
        r: "A do MEI, sim: em maio a gente faz com os valores do app e você só confirma. No Imposto de Renda, a gente te orienta.",
      },
      {
        p: "Perdi o prazo",
        r: "Ainda dá para entregar. A multa começa em R$ 50 e quanto antes, menor. A gente te ajuda.",
      },
    ],
  },
  {
    id: "conta",
    rotulo: "Minha conta",
    perguntas: [
      {
        p: "Como troco meu número?",
        r: "O número é o seu login, então quem troca é a equipe. Toque em \"Ainda preciso de ajuda\" e diga o número novo.",
      },
      {
        p: "Como mudo meu tipo de MEI?",
        r: "No Perfil, toque em Tipo de MEI e diga o que mudou. A gente explica e atualiza quando valer no seu CNPJ.",
      },
      {
        p: "Meus dados estão seguros?",
        r: "Sim. Seus dados ficam protegidos e só você vê. Os detalhes estão na Política de privacidade, no Perfil.",
      },
      {
        p: "Como excluo minha conta?",
        r: "No Perfil, logo abaixo do Tema, em Excluir conta. Antes, o app pede para você confirmar.",
      },
    ],
  },
  { id: "outro", rotulo: "Outro assunto", perguntas: [] },
];

const BOAS_VINDAS = "Oi! Aqui é o suporte do TaCerto, com pessoas da equipe. Sobre o que é a sua dúvida?";
const PEDE_DETALHE = "Me conta em poucas palavras o que aconteceu.";

function Balao({ de, children }) {
  const meu = de === "voce";
  return (
    <div className={`flex ${meu ? "justify-end" : "justify-start"}`} style={{ animation: "suporteEntra 220ms ease-out" }}>
      <div
        style={{
          maxWidth: "85%",
          padding: "11px 14px",
          fontSize: 16,
          lineHeight: 1.45,
          color: "var(--text)",
          border: `1px solid ${meu ? "rgba(34,197,94,0.45)" : "var(--border)"}`,
          borderRadius: meu ? "18px 18px 6px 18px" : "18px 18px 18px 6px",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function Opcoes({ lista, onEscolher }) {
  return (
    <div className="flex flex-wrap" style={{ gap: 8, animation: "suporteEntra 220ms ease-out" }}>
      {lista.map((rotulo) => (
        <button
          key={rotulo}
          type="button"
          onClick={() => onEscolher(rotulo)}
          className="toque rounded-full"
          style={{ padding: "9px 15px", fontSize: 15, color: "var(--text)", border: "1px solid var(--border)", background: "none" }}
        >
          {rotulo}
        </button>
      ))}
    </div>
  );
}

export default function Suporte() {
  const navigate = useNavigate();
  const location = useLocation();
  const app = useAppState();
  const fimRef = useRef(null);

  const [mensagens, setMensagens] = useState([{ de: "suporte", texto: BOAS_VINDAS }]);
  const [etapa, setEtapa] = useState("assunto");
  const [assunto, setAssunto] = useState(null);
  const [pergunta, setPergunta] = useState("");
  const [detalhe, setDetalhe] = useState("");

  useEffect(() => {
    const t = setTimeout(() => fimRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }), 60);
    return () => clearTimeout(t);
  }, [mensagens, etapa]);

  function voltar() {
    if (location.key !== "default") navigate(-1);
    else navigate("/perfil", { replace: true });
  }

  const falar = (...novas) => setMensagens((m) => [...m, ...novas]);

  function escolherAssunto(rotulo) {
    const a = ASSUNTOS.find((x) => x.rotulo === rotulo);
    setAssunto(a);
    setPergunta("");
    if (a.perguntas.length === 0) {
      falar({ de: "voce", texto: rotulo }, { de: "suporte", texto: PEDE_DETALHE });
      setEtapa("escrever");
    } else {
      falar({ de: "voce", texto: rotulo }, { de: "suporte", texto: "Qual destas é a sua dúvida?" });
      setEtapa("pergunta");
    }
  }

  function escolherPergunta(rotulo) {
    if (rotulo === "Minha dúvida é outra") {
      falar({ de: "voce", texto: rotulo }, { de: "suporte", texto: PEDE_DETALHE });
      setEtapa("escrever");
      return;
    }
    const item = assunto.perguntas.find((x) => x.p === rotulo);
    setPergunta(rotulo);
    falar({ de: "voce", texto: rotulo }, { de: "suporte", texto: item.r }, { de: "suporte", texto: "Isso resolveu?" });
    setEtapa("resolveu");
  }

  function responderResolveu(rotulo) {
    if (rotulo === "Resolveu, obrigado") {
      falar({ de: "voce", texto: rotulo }, { de: "suporte", texto: "Que bom! Se precisar, é só chamar." });
      setEtapa("fim");
    } else {
      falar({ de: "voce", texto: rotulo }, { de: "suporte", texto: PEDE_DETALHE });
      setEtapa("escrever");
    }
  }

  function enviarDetalhe() {
    const texto = detalhe.trim();
    if (!texto) return;
    falar(
      { de: "voce", texto },
      { de: "suporte", texto: "Anotei tudo. Toque abaixo para ir ao WhatsApp do suporte: uma pessoa da equipe te responde por lá." },
    );
    setEtapa("whatsapp");
  }

  function abrirWhatsApp() {
    abrirWhatsAppFisco(MENSAGENS_WHATSAPP.suporte(dadosParaWhatsApp(app), {
      assunto: assunto?.rotulo || "",
      pergunta,
      detalhe: detalhe.trim(),
    }));
  }

  function recomecar() {
    setAssunto(null);
    setPergunta("");
    setDetalhe("");
    falar({ de: "voce", texto: "Tenho outra dúvida" }, { de: "suporte", texto: "Claro! Sobre o que é?" });
    setEtapa("assunto");
  }

  return (
    <div className="tela-rolavel w-full flex flex-col" style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}>
      <style>{`
        @keyframes suporteEntra {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div
        className="conteudo-rolavel hide-scrollbar w-full max-w-md mx-auto px-5"
        style={{ paddingBottom: "calc(40px + env(safe-area-inset-bottom))" }}
      >
        <TopoRolavel titulo="Suporte" onVoltar={voltar} />

        <div className="flex flex-col" style={{ gap: 10, marginTop: 10 }}>
          {mensagens.map((m, i) => (
            <Balao key={i} de={m.de}>{m.texto}</Balao>
          ))}

          <div style={{ marginTop: 4 }}>
            {etapa === "assunto" && <Opcoes lista={ASSUNTOS.map((a) => a.rotulo)} onEscolher={escolherAssunto} />}
            {etapa === "pergunta" && (
              <Opcoes lista={[...assunto.perguntas.map((x) => x.p), "Minha dúvida é outra"]} onEscolher={escolherPergunta} />
            )}
            {etapa === "resolveu" && (
              <Opcoes lista={["Resolveu, obrigado", "Ainda preciso de ajuda"]} onEscolher={responderResolveu} />
            )}
            {etapa === "fim" && <Opcoes lista={["Tenho outra dúvida"]} onEscolher={recomecar} />}
            {etapa === "escrever" && (
              <div style={{ animation: "suporteEntra 220ms ease-out" }}>
                <textarea
                  value={detalhe}
                  onChange={(e) => setDetalhe(e.target.value.slice(0, 500))}
                  rows={3}
                  placeholder="Escreva aqui..."
                  className="campo-tacerto card-tacerto w-full rounded-2xl resize-none"
                  style={{ fontSize: 16, lineHeight: 1.45, padding: "12px 14px", color: "var(--text)", background: "transparent" }}
                />
                <button
                  type="button"
                  onClick={enviarDetalhe}
                  disabled={!detalhe.trim()}
                  className="botao-confirmar toque w-full rounded-2xl font-semibold disabled:opacity-40"
                  style={{ marginTop: 10, padding: "13px 0", fontSize: 16 }}
                >
                  Enviar
                </button>
              </div>
            )}
            {etapa === "whatsapp" && (
              <div style={{ animation: "suporteEntra 220ms ease-out" }}>
                <button
                  type="button"
                  onClick={abrirWhatsApp}
                  className="botao-confirmar toque w-full rounded-2xl font-semibold flex items-center justify-center"
                  style={{ padding: "13px 0", fontSize: 16, gap: 10 }}
                >
                  <IconeWhatsApp size={20} strokeWidth={1.9} />
                  Abrir o WhatsApp do suporte
                </button>
                <button
                  type="button"
                  onClick={recomecar}
                  className="w-full font-semibold"
                  style={{ marginTop: 8, padding: "10px 0", fontSize: 15, color: "var(--text-secondary)" }}
                >
                  Tenho outra dúvida
                </button>
              </div>
            )}
          </div>
          <div ref={fimRef} />
        </div>
      </div>
    </div>
  );
}
