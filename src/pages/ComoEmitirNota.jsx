/* COMOEMITIRNOTA v14 — somente passo a passo gov.br e orientação da Isa, sem certificado (v13: versão anterior) */
import { useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  AlertTriangle, ExternalLink, ListChecks, ChevronDown, MessageCircle, CheckCircle2,
} from "lucide-react";
import TopoRolavel from "../components/TopoRolavel.jsx";
import { SecaoLista, LinhaLista, numeroDoPasso } from "../components/ListaSimples.jsx";
import { useAppState } from "@/context/AppStateContext";

/* Passo a passo do Emissor Nacional e orientação da Isa no app.
   Conferir os nomes dos botões do portal antes do piloto. */

const LINK_EMISSOR_NACIONAL = "https://www.nfse.gov.br/EmissorNacional";

/* Passos iguais para os dois tipos (o comeco e o fim). */
const PASSO_ENTRAR = {
  titulo: "Entre no Emissor Nacional",
  texto: "Toque em \"Abrir o Emissor Nacional\", lá embaixo, e entre com a sua conta gov.br.",
};
const PASSO_NOVA = {
  titulo: "Comece uma nota nova",
  texto: "No menu, toque em \"Emitir NFS-e\".",
};
const PASSO_EMITIR = {
  titulo: "Emita",
  texto: "Confira tudo e toque em \"Emitir NFS-e\".",
};

const CONTEUDO_POR_TIPO = {
  MEI_CAMINHONEIRO: {
    /* Texto do aviso pedido pelo Fernando (conferir com o contador) */
    /* v9: correcao (HANDOFF-08-10): NFS-e SO para frete na mesma cidade.
       O MEI nunca emite NFS-e de frete entre cidades (Res. CGSN 140,
       art. 106-A); agregado sem IE em MG hoje nao emite. */
    avisoTitulo: "Este passo a passo é para frete na mesma cidade",
    aviso: "Frete entre cidades, contratado direto, é CT-e. Agregado de transportadora em MG, sem Inscrição Estadual, hoje não emite.",
    explicacaoFisco: "Você manda o valor e pra quem foi o frete; a Isa monta tudo e te guia no gov.br.",
    passos: [
      PASSO_ENTRAR,
      PASSO_NOVA,
      {
        titulo: "Quem contratou o frete",
        texto: "Em \"Tomador do serviço\", escolha Brasil e digite o CNPJ de quem contratou o frete. O nome aparece sozinho.",
      },
      {
        titulo: "O serviço",
        texto: "Informe a cidade onde o serviço foi feito, escolha o código do serviço de transporte e escreva a descrição. Exemplo: \"Frete dentro de [cidade], dia [data]\".",
      },
      { titulo: "O valor", texto: "Digite o valor do frete." },
      PASSO_EMITIR,
      {
        titulo: "Baixe o PDF",
        texto: "Na nota emitida, toque em \"Download DANFSe\": é o PDF da nota. Guarde e mande para a transportadora.",
      },
    ],
  },
  MEI: {
    avisoTitulo: "Serviço ou produto?",
    aviso: "Este passo a passo é para quem presta serviço (NFS-e). Se você vende produtos, a nota é outra (NF-e).",
    explicacaoFisco: "Você manda o valor e pra quem foi o serviço; a Isa monta tudo e te guia no gov.br.",
    passos: [
      PASSO_ENTRAR,
      PASSO_NOVA,
      {
        titulo: "Quem contratou o serviço",
        texto: "Em \"Tomador do serviço\", escolha Brasil e digite o CNPJ ou o CPF do cliente.",
      },
      {
        titulo: "O serviço",
        texto: "Informe a cidade onde o serviço foi feito, escolha o código do seu serviço e escreva a descrição. Exemplo: \"Serviço de [o que você fez], dia [data]\".",
      },
      { titulo: "O valor", texto: "Digite o valor do serviço." },
      PASSO_EMITIR,
      {
        titulo: "Baixe o PDF",
        texto: "Na nota emitida, toque em \"Download DANFSe\": é o PDF da nota. Guarde e mande para o cliente.",
      },
    ],
  },
};

/* v6: setinha que gira ao abrir/fechar (no lugar da "maior que") */
function SetaAbre({ aberto }) {
  return (
    <ChevronDown
      size={18}
      style={{
        color: "var(--text-tertiary)",
        transform: aberto ? "rotate(180deg)" : "none",
        transition: "transform 200ms ease",
      }}
    />
  );
}

export default function ComoEmitirNota() {
  const navigate = useNavigate();
  const location = useLocation();
  const app = useAppState();
  const conteudo = CONTEUDO_POR_TIPO[app.tipoMEI] || CONTEUDO_POR_TIPO.MEI;

  const [sozinhoAberto, setSozinhoAberto] = useState(false);
  const sozinhoRef = useRef(null);

  /* Aberta direto pelo endereco (sem tela antes): volta para o Inicio */
  function voltar() {
    if (location.key !== "default") navigate(-1);
    else navigate("/dashboard", { replace: true });
  }

  /* Abre/fecha um card recolhivel e, ao abrir, rola ate ele */
  function alternar(aberto, setAberto, ref) {
    const abrir = !aberto;
    setAberto(abrir);
    if (abrir) setTimeout(() => ref.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 60);
  }

  return (
    <div
      className="tela-rolavel w-full flex flex-col"
      style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
    >
      {/* Filho DIRETO de .tela-rolavel (padrao de rolagem do app) */}
      <div
        className="conteudo-rolavel hide-scrollbar w-full max-w-md mx-auto px-5"
        style={{ paddingBottom: "calc(40px + env(safe-area-inset-bottom))" }}
      >
        <TopoRolavel titulo="Como emitir sua nota" onVoltar={voltar} />

        {/* v6: aviso como linha simples (sem a caixa amarela) */}
        <SecaoLista style={{ marginTop: 4 }}>
          <LinhaLista Icon={AlertTriangle} rotulo={conteudo.avisoTitulo} detalhe={conteudo.aviso} />
        </SecaoLista>

        {/* Gov.br e orientação da Isa dentro do app. */}
        <SecaoLista titulo="Escolha como emitir">
          <LinhaLista
            Icon={MessageCircle}
            rotulo="Com a Isa aqui no app"
            detalhe={conteudo.explicacaoFisco}
            onClick={() => navigate("/fisco")}
          />
          <LinhaLista
            Icon={ListChecks}
            rotulo="Fazer sozinho"
            detalhe="Passo a passo no Emissor Nacional"
            semSeta
            valor={<SetaAbre aberto={sozinhoAberto} />}
            onClick={() => alternar(sozinhoAberto, setSozinhoAberto, sozinhoRef)}
          />
        </SecaoLista>

        {/* v8: o que o TaCerto faz HOJE (piloto), claro e sem prometer a mais */}
        <SecaoLista titulo="Como o TaCerto ajuda hoje">
          <LinhaLista
            Icon={CheckCircle2}
            rotulo="Aqui no app, a Isa orienta você"
            detalhe="Você manda o valor e pra quem foi. Em poucos minutos ela está pronta."
          />
          <LinhaLista
            Icon={CheckCircle2}
            rotulo="Emita pelo gov.br"
            detalhe="Basta a conta gov.br prata ou ouro."
          />
        </SecaoLista>

        {/* Fazer sozinho: os passos, abertos logo abaixo */}
        <div ref={sozinhoRef} className="scroll-mt-16">
          {sozinhoAberto && (
            <SecaoLista titulo="Passo a passo">
              {conteudo.passos.map((p, i) => (
                <LinhaLista key={p.titulo} Icon={numeroDoPasso(i + 1)} rotulo={p.titulo} detalhe={p.texto} />
              ))}
              <LinhaLista
                Icon={ExternalLink}
                rotulo="Abrir o Emissor Nacional"
                onClick={() => window.open(LINK_EMISSOR_NACIONAL, "_blank", "noopener")}
              />
            </SecaoLista>
          )}
        </div>

      </div>
    </div>
  );
}
