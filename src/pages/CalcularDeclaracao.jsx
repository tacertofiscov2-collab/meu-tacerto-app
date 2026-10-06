/* CALCULARDECLARACAO v1 — "Calcular meu Imposto de Renda": uma pergunta por janela (atividade, faturamento, gastos, outras rendas, funcionario) e o resultado (parte isenta, se precisa declarar, o que vai na declaracao do MEI) */
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Check, ShieldCheck } from "lucide-react";
import { SecaoLista, LinhaLista } from "../components/ListaSimples.jsx";
import Valor from "../components/Valor.jsx";
import { useAppState } from "@/context/AppStateContext";
import { MENSAGENS_WHATSAPP, dadosParaWhatsApp, abrirWhatsAppFisco } from "@/config/piloto";
import {
  ATIVIDADES, calcularIR, proximaDeclaracao, LIMITE_DECLARAR_IR, ANO_DO_LIMITE_IR, ISENCAO_MENSAL_IR,
} from "@/lib/declaracao";

/* ===================================================================
   CALCULAR MEU IMPOSTO DE RENDA (06/10/2026 — pedido do Fernando:
   "janelas perguntando as funcoes etc pra saber sobre a isencao")

   - Uma pergunta por tela, com o numero do passo no endereco
     (?passo=1..6): o gesto de voltar do iPhone volta UMA pergunta.
   - Opcao escolhida: so fica mais "acesa" (borda e texto mais claros),
     sem verde. Verde so no botao de continuar (contorno).
   - O faturamento ja vem com o que o app somou no ano; da para ajustar.
   - Conta e regras: src/lib/declaracao.js. E uma ESTIMATIVA.
   - Aberta direto num passo do meio (recarregou), volta ao passo 1.
   - As RESPOSTAS ficam no sessionStorage (RESPOSTAS_IR): a tela inteira
     remonta a cada pergunta (TransicaoTela usa o endereco como chave,
     e e isso que faz a pergunta nova deslizar). Entrando pela pagina da
     Declaracao anual (state.novo), comeca do zero.
   =================================================================== */
const RESPOSTAS_IR = "tacerto_respostas_ir";
function lerRespostas() {
  try { return JSON.parse(sessionStorage.getItem(RESPOSTAS_IR) || "null"); } catch { return null; }
}
function gravarRespostas(r) {
  try { sessionStorage.setItem(RESPOSTAS_IR, JSON.stringify(r)); } catch { /* ignora */ }
}
const TOTAL_PERGUNTAS = 5;
const MAX_CENTAVOS = 99999999999;

function formatar(centavos) {
  const r = Math.floor(centavos / 100);
  return `${r.toLocaleString("pt-BR")},${String(centavos % 100).padStart(2, "0")}`;
}

/* Campo de dinheiro (igual ao do "+"): digita so numeros */
function CampoDinheiro({ centavos, onMudar }) {
  return (
    <div className="card-tacerto flex items-center rounded-xl overflow-hidden" style={{ marginTop: 22 }}>
      <span className="font-bold" style={{ color: "var(--text)", paddingLeft: 16, paddingRight: 8, fontSize: 22 }}>R$</span>
      <input
        type="text"
        inputMode="numeric"
        value={centavos > 0 ? formatar(centavos) : ""}
        onChange={(e) => {
          const d = e.target.value.replace(/\D/g, "").slice(0, 11);
          onMudar(Math.min(d ? parseInt(d, 10) : 0, MAX_CENTAVOS));
        }}
        placeholder="0,00"
        className="flex-1 bg-transparent font-bold focus:outline-none placeholder:opacity-40"
        style={{ color: "var(--text)", fontSize: 27, padding: "12px 16px 12px 0" }}
      />
    </div>
  );
}

/* Opcao de escolha: a escolhida fica mais clara, sem cor */
function Opcao({ rotulo, detalhe, escolhida, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={escolhida}
      className="toque w-full flex items-center text-left rounded-2xl"
      style={{
        gap: 12,
        padding: "15px 16px",
        background: "none",
        border: `1px solid ${escolhida ? "var(--text-secondary)" : "var(--border)"}`,
        transition: "border-color 150ms ease",
      }}
    >
      <span className="flex-1 min-w-0">
        <span className="block font-semibold" style={{ fontSize: 16.5, color: escolhida ? "var(--text)" : "var(--text-secondary)" }}>
          {rotulo}
        </span>
        {detalhe && (
          <span className="block" style={{ fontSize: 14, color: "var(--text-tertiary)", marginTop: 2 }}>{detalhe}</span>
        )}
      </span>
      {escolhida && <Check size={20} strokeWidth={2.2} className="shrink-0" style={{ color: "var(--text)" }} />}
    </button>
  );
}

function Pergunta({ titulo, ajuda }) {
  return (
    <>
      <h2 className="font-bold" style={{ fontSize: 23, lineHeight: 1.25, color: "var(--text)", marginTop: 14 }}>{titulo}</h2>
      {ajuda && <p style={{ fontSize: 15, lineHeight: 1.45, color: "var(--text-secondary)", marginTop: 8 }}>{ajuda}</p>}
    </>
  );
}

export default function CalcularDeclaracao() {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const app = useAppState();
  const { anoEntrega, anoDeclarado } = proximaDeclaracao();
  const anoAtual = new Date().getFullYear();
  const passo = Math.min(6, Math.max(1, Number(params.get("passo")) || 1));

  const [r, setR] = useState(() => {
    const salvas = location.state?.novo ? null : lerRespostas();
    const inicio = salvas || {
      atividade: app.tipoMEI === "MEI_CAMINHONEIRO" ? "cargas" : null,
      fatCent: anoDeclarado === anoAtual ? Math.round((Number(app.faturamentoAtual) || 0) * 100) : 0,
      gastosCent: 0,
      outrasCent: 0,
      funcionario: null,
    };
    gravarRespostas(inicio);
    return inicio;
  });
  const mudar = (campo) => (valor) =>
    setR((ant) => {
      const novo = { ...ant, [campo]: valor };
      gravarRespostas(novo);
      return novo;
    });
  const { atividade, fatCent, gastosCent, outrasCent, funcionario } = r;
  const setAtividade = mudar("atividade");
  const setFatCent = mudar("fatCent");
  const setGastosCent = mudar("gastosCent");
  const setOutrasCent = mudar("outrasCent");
  const setFuncionario = mudar("funcionario");

  /* "Comecar do zero" vale uma vez so: tira a marca do historico, senao
     voltar para a 1a pergunta apagaria as respostas */
  useEffect(() => {
    if (location.state?.novo) navigate(`${location.pathname}${location.search}`, { replace: true, state: null });
  }, [location, navigate]);

  /* Recarregou no meio sem as respostas: volta ao passo 1 */
  useEffect(() => {
    if (passo > 1 && !atividade) navigate("/declaracao-anual/calcular?passo=1", { replace: true });
  }, [passo, atividade, navigate]);

  const irPara = (n) => navigate(`/declaracao-anual/calcular?passo=${n}`);
  const voltar = () => navigate(-1);

  const podeSeguir = {
    1: !!atividade,
    2: fatCent > 0,
    3: true,
    4: true,
    5: funcionario !== null,
  }[passo];

  const conta = calcularIR({
    atividade,
    faturamento: fatCent / 100,
    gastos: gastosCent / 100,
    outrasRendas: outrasCent / 100,
  });
  const pct = Math.round(conta.percentual * 100);

  let conteudo;
  if (passo === 1) {
    conteudo = (
      <>
        <Pergunta titulo="O que você faz?" ajuda="A parte isenta do imposto depende da sua atividade." />
        <div className="flex flex-col" style={{ gap: 10, marginTop: 22 }}>
          {ATIVIDADES.map((a) => (
            <Opcao key={a.id} rotulo={a.rotulo} detalhe={a.detalhe} escolhida={atividade === a.id} onClick={() => setAtividade(a.id)} />
          ))}
        </div>
      </>
    );
  } else if (passo === 2) {
    conteudo = (
      <>
        <Pergunta
          titulo={`Quanto você faturou em ${anoDeclarado}?`}
          ajuda={anoDeclarado === anoAtual ? "Já veio o que o app somou dos seus lançamentos. Ajuste se precisar." : "O total do ano, somando tudo que recebeu como MEI."}
        />
        <CampoDinheiro centavos={fatCent} onMudar={setFatCent} />
      </>
    );
  } else if (passo === 3) {
    conteudo = (
      <>
        <Pergunta
          titulo="Quanto gastou para trabalhar?"
          ajuda="Só o que tem nota ou recibo: combustível, manutenção, pedágio, peças. Pode deixar em branco."
        />
        <CampoDinheiro centavos={gastosCent} onMudar={setGastosCent} />
      </>
    );
  } else if (passo === 4) {
    conteudo = (
      <>
        <Pergunta titulo="Teve outra renda no ano?" ajuda="Salário, aposentadoria ou aluguel. Some o ano todo. Se não teve, deixe em branco." />
        <CampoDinheiro centavos={outrasCent} onMudar={setOutrasCent} />
      </>
    );
  } else if (passo === 5) {
    conteudo = (
      <>
        <Pergunta titulo="Teve funcionário registrado?" ajuda="A declaração do MEI pergunta isso." />
        <div className="flex flex-col" style={{ gap: 10, marginTop: 22 }}>
          <Opcao rotulo="Não" escolhida={funcionario === false} onClick={() => setFuncionario(false)} />
          <Opcao rotulo="Sim" escolhida={funcionario === true} onClick={() => setFuncionario(true)} />
        </div>
      </>
    );
  } else {
    const limite = `R$ ${LIMITE_DECLARAR_IR.toLocaleString("pt-BR")}`;
    conteudo = (
      <>
        <h2 className="font-bold" style={{ fontSize: 23, lineHeight: 1.25, marginTop: 14 }}>
          {conta.precisaDeclarar ? "Você precisa declarar o Imposto de Renda" : "Pelo valor, você não precisa declarar o Imposto de Renda"}
        </h2>
        <p style={{ fontSize: 15, lineHeight: 1.45, color: "var(--text-secondary)", marginTop: 8 }}>
          {conta.precisaDeclarar
            ? `O que conta como renda passou de ${limite} (limite de ${ANO_DO_LIMITE_IR}).`
            : `O que conta como renda ficou abaixo de ${limite} (limite de ${ANO_DO_LIMITE_IR}).`}
        </p>

        <SecaoLista titulo="A conta">
          <LinhaLista rotulo="Faturamento" valor={<Valor px={15} cor="var(--text-secondary)">{fatCent / 100}</Valor>} />
          <LinhaLista rotulo={`Parte isenta (${pct}%)`} valor={<Valor px={15} cor="var(--text-secondary)">{conta.isenta}</Valor>} />
          {gastosCent > 0 && <LinhaLista rotulo="Gastos com comprovante" valor={<Valor px={15} cor="var(--text-secondary)">{gastosCent / 100}</Valor>} />}
          <LinhaLista rotulo="Conta como renda (do MEI)" valor={<Valor px={15} cor="var(--text-secondary)">{conta.tributavelMei}</Valor>} />
          {outrasCent > 0 && <LinhaLista rotulo="Outras rendas" valor={<Valor px={15} cor="var(--text-secondary)">{outrasCent / 100}</Valor>} />}
          <LinhaLista rotulo="Renda do ano" valor={<Valor px={15.5} peso={700}>{conta.rendaTributavel}</Valor>} />
        </SecaoLista>

        <SecaoLista titulo="Imposto">
          <LinhaLista
            Icon={ShieldCheck}
            rotulo={conta.dentroDaIsencaoNova ? "Imposto: provavelmente zero" : "Pode ter imposto a pagar"}
            detalhe={conta.dentroDaIsencaoNova
              ? `Até R$ ${(ISENCAO_MENSAL_IR * 12).toLocaleString("pt-BR")} de renda no ano fica isento (lei nova, desde 2026).`
              : "A gente confere com você e te ajuda a declarar."}
          />
        </SecaoLista>

        <SecaoLista titulo={`Declaração do MEI (até 31/05/${anoEntrega})`}>
          <LinhaLista rotulo="Faturamento do ano" valor={<Valor px={15} cor="var(--text-secondary)">{fatCent / 100}</Valor>} />
          <LinhaLista rotulo="Teve funcionário" valor={funcionario ? "Sim" : "Não"} />
        </SecaoLista>

        <p style={{ fontSize: 13, lineHeight: 1.45, color: "var(--text-tertiary)", marginTop: 22 }}>
          Estimativa com as regras de hoje. Bens acima de R$ 800 mil e investimentos também podem obrigar a declarar.
        </p>
      </>
    );
  }

  const ehResultado = passo === 6;
  const textoBotao = ehResultado ? "Quero ajuda com a declaração" : passo === 5 ? "Ver resultado" : "Continuar";

  return (
    <div className="tela-fixa w-full flex flex-col" style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}>
      <header className="px-4 pt-5 pb-1 flex items-center gap-2 shrink-0">
        <button
          onClick={voltar}
          aria-label="Voltar"
          className="toque toque-escala w-[46px] h-[46px] rounded-full flex items-center justify-center"
          style={{ border: "1px solid var(--border)", backgroundColor: "transparent" }}
        >
          <ArrowLeft size={24} style={{ color: "var(--text)" }} />
        </button>
        <h1 className="font-bold" style={{ color: "var(--text)", fontSize: 20 }}>
          {ehResultado ? "Resultado" : "Calcular"}
        </h1>
        {!ehResultado && (
          <span className="ml-auto" style={{ fontSize: 14, color: "var(--text-tertiary)", paddingRight: 4 }}>
            {passo} de {TOTAL_PERGUNTAS}
          </span>
        )}
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto hide-scrollbar px-5" style={{ paddingBottom: 12 }}>
        <div className="max-w-md mx-auto">{conteudo}</div>
      </div>

      <div className="shrink-0 px-5" style={{ paddingTop: 12, paddingBottom: "calc(env(safe-area-inset-bottom) + 14px)" }}>
        <div className="max-w-md mx-auto">
          <button
            type="button"
            disabled={!ehResultado && !podeSeguir}
            onClick={() => {
              if (ehResultado) abrirWhatsAppFisco(MENSAGENS_WHATSAPP.declaracaoAjuda(dadosParaWhatsApp(app)));
              else irPara(passo + 1);
            }}
            className="botao-confirmar toque toque-escala w-full rounded-2xl font-bold disabled:opacity-40"
            style={{ padding: "16px 0", fontSize: 16.5, transition: "opacity 200ms ease" }}
          >
            {textoBotao}
          </button>
          {ehResultado && (
            <button
              type="button"
              onClick={() => navigate(-(TOTAL_PERGUNTAS))}
              className="w-full font-semibold"
              style={{ marginTop: 10, padding: "10px 0", fontSize: 15, color: "var(--text-secondary)" }}
            >
              Refazer a conta
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
