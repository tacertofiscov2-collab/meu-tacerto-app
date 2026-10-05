/* REGRAVINTE v3 — padrao do Perfil: aviso, numeros, regra e passos em lista simples (sem cartoes vermelhos); vermelho so no icone e no valor que passou; letras maiores (v2: topo que rola) */
import { useNavigate } from "react-router-dom";
import { AlertTriangle, TrendingUp, Gauge, ArrowUpRight, Scale, OctagonAlert } from "lucide-react";
import Valor from "../components/Valor.jsx";
import { SecaoLista, LinhaLista, numeroDoPasso } from "../components/ListaSimples.jsx";
import TopoRolavel from "../components/TopoRolavel.jsx";
import { useAppState } from "@/context/AppStateContext";
import {
  limiteAte20Percent, excedenteAcimaDoLimite, vocab,
} from "@/lib/fiscal";

/* REGRAVINTE v2 (28/09/2026): o cabecalho "Passou do limite" passou para
   DENTRO da area que rola (TopoRolavel): o titulo sobe com a rolagem e a
   setinha fica parada e transparente. Nada mais mudou. */

export default function RegraVinte() {
  const navigate = useNavigate();
  const { tipoMEI, faturamentoAtual, limiteAtual } = useAppState();

  const v = vocab(tipoMEI);
  const excedente = excedenteAcimaDoLimite(faturamentoAtual, limiteAtual);
  const tetoDos20 = limiteAte20Percent(tipoMEI);
  const passouDos20 = excedente && !excedente.dentroDos20;
  const cor = passouDos20 ? "#dc2626" : "#ef4444";
  const anoAtual = new Date().getFullYear();
  const pctExcesso = excedente ? Math.round(excedente.percentualExcesso) : 0;

  const passos = passouDos20
    ? [
        {
          titulo: "Procure um contador agora",
          texto: `Como você passou de ${pctExcesso}% do limite, o desenquadramento é retroativo a 1º de janeiro de ${anoAtual}. Um contador vai recalcular seus impostos do ano como Microempresa.`,
        },
        {
          titulo: "Faça o desenquadramento no Portal do Simples",
          texto: "O pedido é feito pelo próprio empreendedor, no Portal do Simples Nacional. O contador te ajuda a escolher o motivo correto.",
        },
        {
          titulo: "Separe uma reserva",
          texto: "Vão existir guias de impostos do ano inteiro, com multa e juros. Quanto antes regularizar, menor o acúmulo.",
        },
        {
          titulo: `Continue registrando ${v.receitaPlural}`,
          texto: "Mesmo desenquadrado, manter o controle facilita muito a vida do contador e evita pagar imposto a mais.",
        },
      ]
    : [
        {
          titulo: `Você continua MEI até 31 de dezembro de ${anoAtual}`,
          texto: "Passar do limite não te tira do MEI na hora. Você segue pagando o DAS normalmente até o fim do ano.",
        },
        {
          titulo: "Em janeiro, você vira Microempresa",
          texto: `A partir de 1º de janeiro de ${anoAtual + 1} sua empresa passa a ser ME automaticamente. Vale procurar um contador antes disso pra se organizar.`,
        },
        {
          titulo: "Vai ter um DAS complementar",
          texto: "Na declaração anual (DASN-SIMEI), o sistema gera uma guia extra sobre o valor que passou do limite. É pago uma vez só.",
        },
        {
          titulo: "Cuidado pra não passar dos 20%",
          texto: `Se o total do ano passar de ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(tetoDos20)}, a regra muda completamente: o desenquadramento vira retroativo, com multa e juros.`,
        },
      ];

  return (
    <div
      className="tela-rolavel w-full flex flex-col"
      style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
    >
      <div
        className="conteudo-rolavel hide-scrollbar px-5"
        style={{ paddingBottom: "calc(40px + env(safe-area-inset-bottom))" }}
      >
        <TopoRolavel titulo="Passou do limite" onVoltar={() => navigate(-1)} />

        {/* v3: aviso como linha simples (vermelho so no icone) */}
        <SecaoLista style={{ marginTop: 4 }}>
          <LinhaLista
            Icon={(props) => <AlertTriangle {...props} style={{ color: cor }} />}
            rotulo={
              passouDos20
                ? `Passei ${pctExcesso}% do limite anual`
                : "Passei do limite, mas dentro dos 20% que a lei permite"
            }
            detalhe={passouDos20 ? "Situação crítica" : "Dentro da margem legal"}
          />
        </SecaoLista>

        {/* v3: situacao em numeros, linhas com valor a direita */}
        <SecaoLista titulo="Como estou hoje">
          <LinhaLista
            Icon={TrendingUp}
            rotulo="Faturei"
            valor={<Valor px={15} cor="var(--text-secondary)">{faturamentoAtual}</Valor>}
          />
          <LinhaLista
            Icon={Gauge}
            rotulo="Meu limite"
            valor={<Valor px={15} cor="var(--text-secondary)">{limiteAtual}</Valor>}
          />
          <LinhaLista
            Icon={ArrowUpRight}
            rotulo="Passei"
            valor={<Valor px={15} cor={cor}>{excedente?.valor || 0}</Valor>}
          />
        </SecaoLista>

        {/* v3: a regra dos 20% */}
        <SecaoLista titulo="Como a lei enxerga">
          <LinhaLista
            Icon={Scale}
            rotulo={<>Até <Valor px={16.5} peso={500}>{tetoDos20}</Valor> (20% acima)</>}
            detalhe="Continua MEI até dezembro e paga uma guia complementar."
          />
          <LinhaLista
            Icon={OctagonAlert}
            rotulo="Acima disso"
            detalhe="Deixa de ser MEI desde janeiro deste ano, com recálculo de impostos, multa e juros."
          />
        </SecaoLista>

        {/* v3: passos numerados em lista */}
        <SecaoLista titulo="O que fazer agora">
          {passos.map((p, i) => (
            <LinhaLista key={i} Icon={numeroDoPasso(i + 1)} rotulo={p.titulo} detalhe={p.texto} />
          ))}
        </SecaoLista>

        <p
          className="leading-relaxed text-center px-2"
          style={{ color: "var(--text-tertiary)", fontSize: 13, marginTop: 28 }}
        >
          O TaCerto! é parceiro do seu contador, não substituto. As informações acima são
          baseadas no que você registrou no app e servem como orientação geral.
        </p>
      </div>
    </div>
  );
}