/* COMOEMITIRNOTA v7 — "Fisco.ia" vira "Fisco" nos textos da tela (so a Apresentacao do Fisco.ia mantem o nome) (v6: padrao do Perfil: lista simples sem cartoes, selos nem botao verde cheio; aviso como linha; passos e Certificado A1 abrem em secoes abaixo; letras maiores (v5: A1: "Custa a partir de R$ 99,90" (vale 1 ano) no lugar de "valor a confirmar"; Fisco.ia (v4: selo so "Grátis"; v3: Fisco pelo WhatsApp, fazer sozinho, Certificado A1) */
import { useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  AlertTriangle, ExternalLink, MessageCircle, ListChecks, BadgeCheck, ChevronDown,
  Info, Sparkles, Video, ShieldCheck,
} from "lucide-react";
import TopoRolavel from "../components/TopoRolavel.jsx";
import { SecaoLista, LinhaLista, numeroDoPasso } from "../components/ListaSimples.jsx";
import {
  MENSAGENS_WHATSAPP, dadosParaWhatsApp, abrirWhatsAppFisco,
} from "@/config/piloto";
import { useAppState } from "@/context/AppStateContext";

/* ===================================================================
   CONTEUDO PROVISORIO - CONFERIR

   COMOEMITIRNOTA v3 (04/10/2026) — pedido do Fernando:
   - Topo: aviso curto (pelo tipo de MEI, ver CONTEUDO_POR_TIPO).
   - "Escolha como emitir sua nota", com 3 cards:
       a) Emitir com o Fisco pelo WhatsApp — selo "Grátis durante o
          piloto". Abre o WhatsApp com MENSAGENS_WHATSAPP.notaAjuda.
          No piloto, quem ajuda e o Fernando, na mao.
       b) Fazer sozinho — o passo a passo que ja existia (v2), agora
          RECOLHIVEL (abre e fecha no proprio card).
       c) Nota automatica com Certificado Digital A1 — selo "Em breve".
          Explicacao recolhivel + botao "Tenho interesse no certificado"
          (MENSAGENS_WHATSAPP.certificadoA1), para medir o interesse.
   - A linguagem segue o tipo do perfil (a tela e de dentro do app):
     caminhoneiro fala em frete e transportadora; MEI comum, em servico
     e cliente.

   ⚠️ Os nomes dos botoes do site ("Emitir NFS-e", "Download DANFSe")
   foram escritos de memoria: conferir no site real antes do piloto.
   ⚠️ Conferir com o contador o aviso do topo (NFS-e x CT-e) e o texto
   do Certificado A1 (custo, validade, como tira).

   v2: textos pelo tipo de MEI. v1: passo a passo do Emissor Nacional.
   =================================================================== */

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
    avisoTitulo: "NFS-e ou CT-e?",
    aviso: "Agregado de transportadora geralmente emite NFS-e. Se você pega frete direto, pode precisar de CT-e.",
    explicacaoFisco: "Você me manda o valor e pra quem foi o frete, eu monto tudo e te guio no gov.br.",
    passos: [
      PASSO_ENTRAR,
      PASSO_NOVA,
      {
        titulo: "Quem contratou o frete",
        texto: "Em \"Tomador do serviço\", escolha Brasil e digite o CNPJ da transportadora. O nome dela aparece sozinho.",
      },
      {
        titulo: "O serviço",
        texto: "Informe a cidade onde o serviço foi feito, escolha o código do serviço de transporte e escreva a descrição. Exemplo: \"Frete de [cidade] para [cidade], dia [data]\".",
      },
      { titulo: "O valor", texto: "Digite o valor do frete." },
      PASSO_EMITIR,
      {
        titulo: "Baixe o PDF",
        texto: "Na nota emitida, toque em \"Download DANFSe\": é o PDF da nota. Guarde e mande para a transportadora.",
      },
    ],
    /* A1 tambem serve para os documentos do transporte */
    vantagemExtra: "Serve também para CT-e e MDF-e.",
  },
  MEI: {
    avisoTitulo: "Serviço ou produto?",
    aviso: "Este passo a passo é para quem presta serviço (NFS-e). Se você vende produtos, a nota é outra (NF-e).",
    explicacaoFisco: "Você me manda o valor e pra quem foi o serviço, eu monto tudo e te guio no gov.br.",
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
    vantagemExtra: null,
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

/* v6: lista de frases curtas dentro do detalhe de uma linha */
function Itens({ lista }) {
  return lista.map((t) => (
    <span key={t} className="block" style={{ marginTop: 2 }}>{t}</span>
  ));
}

export default function ComoEmitirNota() {
  const navigate = useNavigate();
  const location = useLocation();
  const app = useAppState();
  const caminhoneiro = app.tipoMEI === "MEI_CAMINHONEIRO";
  const conteudo = CONTEUDO_POR_TIPO[app.tipoMEI] || CONTEUDO_POR_TIPO.MEI;
  const dados = dadosParaWhatsApp(app);

  const [sozinhoAberto, setSozinhoAberto] = useState(false);
  const [a1Aberto, setA1Aberto] = useState(false);
  const sozinhoRef = useRef(null);
  const a1Ref = useRef(null);

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

        {/* v6: as 3 formas em lista (sem cartoes nem selos) */}
        <SecaoLista titulo="Escolha como emitir">
          <LinhaLista
            Icon={MessageCircle}
            rotulo="Com o Fisco no WhatsApp"
            detalhe={conteudo.explicacaoFisco}
            onClick={() => abrirWhatsAppFisco(MENSAGENS_WHATSAPP.notaAjuda(dados, caminhoneiro))}
          />
          <LinhaLista
            Icon={ListChecks}
            rotulo="Fazer sozinho"
            detalhe="Passo a passo no Emissor Nacional"
            semSeta
            valor={<SetaAbre aberto={sozinhoAberto} />}
            onClick={() => alternar(sozinhoAberto, setSozinhoAberto, sozinhoRef)}
          />
          <LinhaLista
            Icon={BadgeCheck}
            rotulo="Nota automática (Certificado A1)"
            detalhe="Em breve"
            semSeta
            valor={<SetaAbre aberto={a1Aberto} />}
            onClick={() => alternar(a1Aberto, setA1Aberto, a1Ref)}
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

        {/* Certificado A1: a explicacao, aberta logo abaixo */}
        <div ref={a1Ref} className="scroll-mt-16">
          {a1Aberto && (
            <SecaoLista titulo="Certificado Digital A1">
              <LinhaLista
                Icon={Info}
                rotulo="O que é"
                detalhe="A assinatura digital do seu CNPJ. É como uma CNH da sua empresa na internet."
              />
              <LinhaLista
                Icon={Sparkles}
                rotulo="Vantagens"
                detalhe={<Itens lista={[
                  "O Fisco emite a nota por você, e você só confirma.",
                  "Não precisa entrar no gov.br toda vez.",
                  ...(conteudo.vantagemExtra ? [conteudo.vantagemExtra] : []),
                  "Nada é emitido sem a sua confirmação.",
                ]} />}
              />
              <LinhaLista
                Icon={Video}
                rotulo="Como tira"
                detalhe={<Itens lista={[
                  "Por videochamada no celular, com a CNH ou o RG na mão.",
                  "Vale por 1 ano.",
                  "Custa a partir de R$ 99,90.",
                  "O TaCerto! te ajuda a agendar.",
                ]} />}
              />
              <LinhaLista
                Icon={ShieldCheck}
                rotulo="Segurança"
                detalhe={<Itens lista={[
                  "O certificado fica numa plataforma de emissão de notas com segurança de banco.",
                  "Nunca pedimos a sua senha do gov.br.",
                ]} />}
              />
              <LinhaLista
                Icon={MessageCircle}
                rotulo="Tenho interesse no certificado"
                onClick={() => abrirWhatsAppFisco(MENSAGENS_WHATSAPP.certificadoA1(dados))}
              />
            </SecaoLista>
          )}
        </div>
      </div>
    </div>
  );
}
