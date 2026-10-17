/* DECLARACAOANUAL v3 — datas certas (Bloco G): a do MEI "Pode ser feita desde o começo do ano até 31 de maio.", o Imposto de Renda "Abre em março e vai até o fim de maio (a Receita divulga as datas todo ano)." e "Quando você quiser, dentro do prazo, a Isa faz com você." (sai o "em maio"); textos de src/lib/declaracao.js (v2: fica SO a explicacao (o que e, prazo, como o TaCerto ajuda) + o botao "Calcular meu Imposto de Renda", que leva ao Calcular > Imposto de Renda (/calcular/imposto-de-renda); sairam o percentual isento, "declarar nao e pagar" e o faturado do ano (estao na conta do IR); o passo a passo da DASN continua, fechado (Bloco F) (v1: pagina nova (Perfil > Ajuda): prazo, "Calcular meu Imposto de Renda", como o TaCerto ajuda hoje, explicacao sem juridiques e o passo a passo da DASN-SIMEI)) */
import { useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  CalendarClock, Calculator, CheckCircle2, Briefcase, User, ListChecks, ChevronDown, ExternalLink,
} from "lucide-react";
import IconeWhatsApp from "../components/IconeWhatsApp.jsx";
import TopoRolavel from "../components/TopoRolavel.jsx";
import { SecaoLista, LinhaLista, numeroDoPasso } from "../components/ListaSimples.jsx";
import { useAppState } from "@/context/AppStateContext";
import {
  MENSAGENS_WHATSAPP, dadosParaWhatsApp, abrirWhatsAppFisco,
} from "@/config/piloto";
import {
  proximaDeclaracao, LINK_DASN_SIMEI, LIMITE_DECLARAR_IR, ANO_DO_LIMITE_IR, MULTA_MINIMA_DASN,
  TEXTO_PRAZO_DASN, TEXTO_PERIODO_IRPF, TEXTO_TACERTO_DECLARACAO,
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
   v2 (12/10/2026, tarefa de 10-10, Bloco F): fica SO a explicacao
   (prazo, o que e, como o TaCerto ajuda) e o botao "Calcular meu Imposto
   de Renda" (-> Calcular > Imposto de Renda). O resto (parte isenta,
   declarar nao e pagar, faturado do ano) esta na conta do IR.
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
            rotulo={`Do MEI: até 31 de maio de ${anoEntrega}`}
            detalhe={`${TEXTO_PRAZO_DASN} Sobre o que você faturou em ${anoDeclarado}, mesmo se não faturou nada. Atrasou: ainda dá, com multa a partir de R$ ${MULTA_MINIMA_DASN}.`}
          />
          <LinhaLista
            Icon={CalendarClock}
            rotulo="Imposto de Renda (pessoa física)"
            detalhe={TEXTO_PERIODO_IRPF}
          />
        </SecaoLista>

        <SecaoLista titulo="O que é">
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
        </SecaoLista>

        <SecaoLista titulo="Como o TaCerto ajuda hoje">
          <LinhaLista
            Icon={CheckCircle2}
            rotulo="A do MEI"
            detalhe={`${TEXTO_TACERTO_DECLARACAO} Com os valores do app, você só confirma no WhatsApp.`}
          />
          <LinhaLista
            Icon={CheckCircle2}
            rotulo="Imposto de Renda: a gente te orienta"
            detalhe="O app calcula. Se precisar declarar, te guiamos no passo a passo."
          />
          <LinhaLista Icon={IconeWhatsApp} rotulo="Quero ajuda com a minha declaração" onClick={pedirAjuda} />
        </SecaoLista>

        {/* v2: a conta do IR mora no Calcular */}
        <button
          type="button"
          onClick={() => navigate("/calcular/imposto-de-renda?passo=1", { state: { novo: true, de: "declaracao" } })}
          className="botao-confirmar toque w-full rounded-2xl font-semibold flex items-center justify-center"
          style={{ marginTop: 24, padding: "15px 0", fontSize: 16, gap: 8 }}
        >
          <Calculator size={19} strokeWidth={2} />
          Calcular meu Imposto de Renda
        </button>

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
