/* DECLARACAOANUAL v1 — pagina nova (Perfil > Ajuda): prazo, "Calcular meu Imposto de Renda", como o TaCerto ajuda hoje, explicacao sem juridiques e o passo a passo da DASN-SIMEI */
import { useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  CalendarClock, Calculator, CheckCircle2, Briefcase, User, Percent, ShieldCheck,
  AlertTriangle, Gauge, ListChecks, ChevronDown, ExternalLink,
} from "lucide-react";
import IconeWhatsApp from "../components/IconeWhatsApp.jsx";
import TopoRolavel from "../components/TopoRolavel.jsx";
import { SecaoLista, LinhaLista, numeroDoPasso } from "../components/ListaSimples.jsx";
import Valor from "../components/Valor.jsx";
import { useAppState } from "@/context/AppStateContext";
import {
  MENSAGENS_WHATSAPP, dadosParaWhatsApp, abrirWhatsAppFisco,
} from "@/config/piloto";
import {
  proximaDeclaracao, LINK_DASN_SIMEI, LIMITE_DECLARAR_IR, ANO_DO_LIMITE_IR,
  MULTA_MINIMA_DASN, ISENCAO_MENSAL_IR,
} from "@/lib/declaracao";

/* ===================================================================
   DECLARACAO ANUAL (06/10/2026 — pedido do Fernando)

   Aberta pelo Perfil > Ajuda, igual ao "Como pagar o DAS". Ordem:
   1. Prazo (31 de maio) e sobre qual ano.
   2. "Calcular meu Imposto de Renda" -> /declaracao-anual/calcular
      (janelas perguntando a atividade, o faturamento, os gastos...).
   3. Como o TaCerto ajuda HOJE (piloto): a do MEI a gente faz com os
      valores do app; o IR a gente orienta. Claro e sem promessa a mais.
   4. Entenda, sem juridiques: sao duas declaracoes, o que e isento,
      declarar nao e pagar, se atrasar.
   5. O faturamento do ano no app (o numero da declaracao).
   6. Fazer sozinho: passo a passo da DASN-SIMEI (abre e fecha).
   Regras e numeros: src/lib/declaracao.js (atualizar todo ano).
   ⚠️ Passos do site escritos de memoria: conferir no site real.
   =================================================================== */

function SetaAbre({ aberto }) {
  return (
    <ChevronDown
      size={18}
      style={{ color: "var(--text-tertiary)", transform: aberto ? "rotate(180deg)" : "none", transition: "transform 200ms ease" }}
    />
  );
}

const reais = (v) => Number(v || 0).toLocaleString("pt-BR", { maximumFractionDigits: 0 });

export default function DeclaracaoAnual() {
  const navigate = useNavigate();
  const location = useLocation();
  const app = useAppState();
  const { anoEntrega, anoDeclarado } = proximaDeclaracao();
  const anoAtual = new Date().getFullYear();
  const caminhoneiro = app.tipoMEI === "MEI_CAMINHONEIRO";
  const [sozinhoAberto, setSozinhoAberto] = useState(false);
  const sozinhoRef = useRef(null);

  function voltar() {
    if (location.key !== "default") navigate(-1);
    else navigate("/perfil", { replace: true });
  }

  function alternarSozinho() {
    const abrir = !sozinhoAberto;
    setSozinhoAberto(abrir);
    if (abrir) setTimeout(() => sozinhoRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 60);
  }

  const pedirAjuda = () => abrirWhatsAppFisco(MENSAGENS_WHATSAPP.declaracaoAjuda(dadosParaWhatsApp(app)));

  const passos = [
    { titulo: "Abra o site da declaração", texto: "Toque em \"Abrir o site da declaração\", lá embaixo." },
    { titulo: "Digite seu CNPJ", texto: "Confirme que não é robô e toque em Continuar." },
    { titulo: "Escolha o ano", texto: `Escolha ${anoDeclarado} e a opção "Original".` },
    { titulo: "Informe o faturamento", texto: "Digite o total que faturou no ano (o app mostra aqui em cima) e diga se teve funcionário." },
    { titulo: "Envie e guarde o recibo", texto: "Toque em Transmitir e baixe o recibo. Pronto." },
  ];

  return (
    <div className="tela-rolavel w-full flex flex-col" style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}>
      <div
        className="conteudo-rolavel hide-scrollbar w-full max-w-md mx-auto px-5"
        style={{ paddingBottom: "calc(40px + env(safe-area-inset-bottom))" }}
      >
        <TopoRolavel titulo="Declaração anual" onVoltar={voltar} />

        <SecaoLista style={{ marginTop: 4 }}>
          <LinhaLista
            Icon={CalendarClock}
            rotulo={`Entregue até 31 de maio de ${anoEntrega}`}
            detalhe={`Sobre o que você faturou em ${anoDeclarado}. Mesmo se não faturou nada.`}
          />
        </SecaoLista>

        <SecaoLista titulo="Calcular">
          <LinhaLista
            Icon={Calculator}
            rotulo="Calcular meu Imposto de Renda"
            detalhe="Quanto é isento e se você precisa declarar. Leva 1 minuto."
            onClick={() => navigate("/declaracao-anual/calcular?passo=1", { state: { novo: true } })}
          />
        </SecaoLista>

        <SecaoLista titulo="Como o TaCerto ajuda hoje">
          <LinhaLista
            Icon={CheckCircle2}
            rotulo="A do MEI, a gente faz por você"
            detalhe="Em maio, com os valores que você lançou no app. Você só confirma no WhatsApp."
          />
          <LinhaLista
            Icon={CheckCircle2}
            rotulo="Imposto de Renda: a gente te orienta"
            detalhe="O app calcula. Se precisar declarar, te guiamos no passo a passo."
          />
          <LinhaLista Icon={IconeWhatsApp} rotulo="Quero ajuda com a minha declaração" onClick={pedirAjuda} />
        </SecaoLista>

        <SecaoLista titulo="Entenda">
          <LinhaLista
            Icon={Briefcase}
            rotulo="A do MEI (DASN-SIMEI)"
            detalhe="Você conta ao governo quanto o MEI faturou no ano e se teve funcionário. É rápida."
          />
          <LinhaLista
            Icon={User}
            rotulo="A sua, de Imposto de Renda"
            detalhe={`É a da pessoa, não a do MEI. Só é obrigatória se o que conta como renda passar de R$ ${reais(LIMITE_DECLARAR_IR)} no ano (limite de ${ANO_DO_LIMITE_IR}).`}
          />
          <LinhaLista
            Icon={Percent}
            rotulo="Parte do faturamento é isenta"
            detalhe={caminhoneiro
              ? "No transporte de cargas, 8% do que você fatura não conta como renda. Gastos com nota ou recibo também abatem."
              : "De 8% a 32% do que você fatura não conta como renda, conforme a atividade. Gastos com nota ou recibo também abatem."}
          />
          <LinhaLista
            Icon={ShieldCheck}
            rotulo="Declarar não é pagar"
            detalhe={`Desde 2026, quem tem até R$ ${reais(ISENCAO_MENSAL_IR)} por mês de renda fica isento do imposto. Muita gente declara e não paga nada.`}
          />
          <LinhaLista
            Icon={AlertTriangle}
            rotulo="Se atrasar"
            detalhe={`A do MEI ainda pode ser entregue, com multa a partir de R$ ${MULTA_MINIMA_DASN}. Quanto antes, menor.`}
          />
        </SecaoLista>

        <SecaoLista titulo={`Seu ${anoAtual} até agora`}>
          <LinhaLista
            Icon={Gauge}
            rotulo="Faturado no ano"
            detalhe="É esse número que vai na declaração."
            valor={<Valor px={15} cor="var(--text-secondary)">{app.faturamentoAtual}</Valor>}
          />
        </SecaoLista>

        <SecaoLista titulo="Fazer sozinho">
          <LinhaLista
            Icon={ListChecks}
            rotulo="Passo a passo da declaração do MEI"
            detalhe="Leva uns 5 minutos"
            semSeta
            valor={<SetaAbre aberto={sozinhoAberto} />}
            onClick={alternarSozinho}
          />
        </SecaoLista>
        <div ref={sozinhoRef} className="scroll-mt-16">
          {sozinhoAberto && (
            <SecaoLista titulo="Passo a passo">
              {passos.map((p, i) => (
                <LinhaLista key={p.titulo} Icon={numeroDoPasso(i + 1)} rotulo={p.titulo} detalhe={p.texto} />
              ))}
              <LinhaLista
                Icon={ExternalLink}
                rotulo="Abrir o site da declaração"
                onClick={() => window.open(LINK_DASN_SIMEI, "_blank", "noopener")}
              />
            </SecaoLista>
          )}
        </div>
      </div>
    </div>
  );
}
