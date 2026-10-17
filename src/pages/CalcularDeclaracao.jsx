/* CALCULARDECLARACAO v4 — rodape do resultado sem "Receita" (decisao do Fernando, 12/10): "Estimativa pelas regras do Imposto de Renda 2026 (ano de 2025)." (antes "Estimativa com as regras de hoje. Limites: Receita Federal, regras do IRPF 2026 (ano de 2025).") (v3: vira "Calcular > Imposto de Renda" (/calcular/imposto-de-renda; Bloco F): com CNPJ a atividade vem do CNAE principal (pula a pergunta; aviso se for atividade mista); "Você teve outra renda no ano?" Sim/Não + valor; a parte isenta desconta o DAS do ano (LC 123, art. 14 §1o) e mostra "Pode ser maior com contabilidade completa."; os outros motivos que obrigam a declarar com os limites oficiais e a fonte; barra "Calculado com seus dados até" (v2: os gastos ja vem com a soma dos gastos do negocio COM NOTA guardados no app ("Meu lucro"); a pessoa ainda pode ajustar (v1: "Calcular meu Imposto de Renda": uma pergunta por janela (atividade, faturamento, gastos, outras rendas, funcionario) e o resultado (parte isenta, se precisa declarar, o que vai na declaracao do MEI)))) */
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { somarGastosComNota } from "@/lib/lucro";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Check, ShieldCheck, Info } from "lucide-react";
import { SecaoLista, LinhaLista } from "../components/ListaSimples.jsx";
import BarraDadosAte from "../components/BarraDadosAte.jsx";
import Valor from "../components/Valor.jsx";
import { useAppState } from "@/context/AppStateContext";
import { MENSAGENS_WHATSAPP, dadosParaWhatsApp, abrirWhatsAppFisco } from "@/config/piloto";
import {
  ATIVIDADES, calcularIR, proximaDeclaracao, LIMITE_DECLARAR_IR, ANO_DO_LIMITE_IR, ISENCAO_MENSAL_IR,
  ANO_INICIO_ISENCAO_5MIL, infoAtividadeIr, dasDevidoNoAno, LIMITE_BENS_IR, LIMITE_RENDIMENTOS_ISENTOS_IR,
  LIMITE_BOLSA_IR, LIMITE_RECEITA_RURAL_IR, FONTE_LIMITES_IR,
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
/* v3: o endereco novo (Calcular > Imposto de Renda). O antigo
   /declaracao-anual/calcular leva para ca (App.jsx). */
const ROTA_IR = "/calcular/imposto-de-renda";
const reaisInteiros = (v) => `R$ ${Number(v || 0).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`;

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
  /* v3: com CNPJ a atividade vem do CNAE principal e a 1a pergunta some */
  const cnaes = [app.cnae, ...(app.cnaesSecundarios || [])].filter(Boolean);
  const infoAtiv = infoAtividadeIr(app.tipoMEI, cnaes);
  const primeiroPasso = infoAtiv.doCnpj ? 2 : 1;
  const totalPerguntas = TOTAL_PERGUNTAS - (primeiroPasso - 1);
  const passo = Math.min(6, Math.max(primeiroPasso, Number(params.get("passo")) || 1));

  const [r, setR] = useState(() => {
    const salvas = location.state?.novo ? null : lerRespostas();
    const inicio = salvas || {
      atividade: infoAtiv.atividade,
      fatCent: anoDeclarado === anoAtual ? Math.round((Number(app.faturamentoAtual) || 0) * 100) : 0,
      gastosCent: 0,
      outrasCent: 0,
      outraRenda: null,
      funcionario: null,
    };
    if (infoAtiv.doCnpj) inicio.atividade = infoAtiv.atividade;
    gravarRespostas(inicio);
    return inicio;
  });
  const mudar = (campo) => (valor) =>
    setR((ant) => {
      const novo = { ...ant, [campo]: valor };
      gravarRespostas(novo);
      return novo;
    });
  const { atividade, fatCent, gastosCent, outrasCent, outraRenda, funcionario, gastosDoApp } = r;
  const setAtividade = mudar("atividade");
  const setFatCent = mudar("fatCent");
  /* v2: mexeu nos gastos = a pessoa manda (o app nao troca mais) */
  const setGastosCent = (valor) =>
    setR((ant) => {
      const novo = { ...ant, gastosCent: valor, gastosMexido: true, gastosDoApp: false };
      gravarRespostas(novo);
      return novo;
    });

  /* v2: gastos do negocio COM NOTA do ano declarado (src/lib/lucro.js),
     so se a pessoa ainda nao digitou nada */
  useEffect(() => {
    if (r.gastosCent > 0 || r.gastosMexido) return undefined;
    let ativo = true;
    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (!data?.user) return;
        const total = await somarGastosComNota(data.user.id, anoDeclarado);
        if (!ativo || !(total > 0)) return;
        setR((ant) => {
          if (ant.gastosCent > 0 || ant.gastosMexido) return ant;
          const novo = { ...ant, gastosCent: Math.round(total * 100), gastosDoApp: true };
          gravarRespostas(novo);
          return novo;
        });
      } catch { /* sem rede: a pessoa digita */ }
    })();
    return () => { ativo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const setOutrasCent = mudar("outrasCent");
  const setOutraRenda = mudar("outraRenda");
  const setFuncionario = mudar("funcionario");

  /* "Comecar do zero" vale uma vez so: tira a marca do historico, senao
     voltar para a 1a pergunta apagaria as respostas */
  useEffect(() => {
    if (location.state?.novo) navigate(`${location.pathname}${location.search}`, { replace: true, state: null });
  }, [location, navigate]);

  /* Recarregou no meio sem as respostas: volta ao passo 1 */
  useEffect(() => {
    if (passo > 1 && !atividade) navigate(`${ROTA_IR}?passo=1`, { replace: true });
  }, [passo, atividade, navigate]);

  const irPara = (n) => navigate(`${ROTA_IR}?passo=${n}`);
  const voltar = () => navigate(-1);

  const podeSeguir = {
    1: !!atividade,
    2: fatCent > 0,
    3: true,
    4: outraRenda === false || (outraRenda === true && outrasCent > 0),
    5: funcionario !== null,
  }[passo];

  /* v3: o DAS devido no ano declarado sai da parte isenta */
  const dasDoAno = dasDevidoNoAno({
    tipo: app.tipoMEI,
    cnaes,
    ano: anoDeclarado,
    mesAbertura: app.mesAnoAbertura?.mes,
    anoAbertura: app.mesAnoAbertura?.ano,
  });
  const conta = calcularIR({
    atividade,
    faturamento: fatCent / 100,
    gastos: gastosCent / 100,
    outrasRendas: outraRenda ? outrasCent / 100 : 0,
    dasDevido: dasDoAno,
  });
  const pct = Math.round(conta.percentual * 100);
  const rotuloAtividade = (ATIVIDADES.find((a) => a.id === atividade) || {}).rotulo || "";
  /* Isencao de ate R$ 5 mil por mes: so para a renda de 2026 em diante */
  const valeIsencaoNova = anoDeclarado >= ANO_INICIO_ISENCAO_5MIL;

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
          ajuda={gastosDoApp
            ? "Já veio a soma dos gastos com nota que você guardou no app. Ajuste se precisar."
            : "Só o que tem nota ou recibo: combustível, manutenção, pedágio, peças. Pode deixar em branco."}
        />
        <CampoDinheiro centavos={gastosCent} onMudar={setGastosCent} />
      </>
    );
  } else if (passo === 4) {
    conteudo = (
      <>
        <Pergunta titulo="Você teve outra renda no ano?" ajuda="Salário, aposentadoria ou aluguel, fora o MEI." />
        <div className="flex flex-col" style={{ gap: 10, marginTop: 22 }}>
          <Opcao rotulo="Não" escolhida={outraRenda === false} onClick={() => setOutraRenda(false)} />
          <Opcao rotulo="Sim" escolhida={outraRenda === true} onClick={() => setOutraRenda(true)} />
        </div>
        {outraRenda === true && (
          <>
            <p style={{ fontSize: 15, lineHeight: 1.45, color: "var(--text-secondary)", marginTop: 18 }}>Quanto, somando o ano todo?</p>
            <CampoDinheiro centavos={outrasCent} onMudar={setOutrasCent} />
          </>
        )}
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

        <BarraDadosAte style={{ marginTop: 18 }} />

        <SecaoLista titulo="A conta">
          <LinhaLista rotulo="Faturamento" valor={<Valor px={15} cor="var(--text-secondary)">{fatCent / 100}</Valor>} />
          <LinhaLista
            rotulo={`Parte isenta (${pct}%)`}
            detalhe={
              <>
                <span className="block">
                  {pct}% do faturamento (<Valor px={13.5} cor="var(--text-tertiary)">{conta.isentaBruta}</Valor>) menos o DAS do ano (<Valor px={13.5} cor="var(--text-tertiary)">{conta.das}</Valor>).
                </span>
                <span className="block" style={{ marginTop: 3 }}>Pode ser maior com contabilidade completa.</span>
              </>
            }
            valor={<Valor px={15} cor="var(--text-secondary)">{conta.isenta}</Valor>}
          />
          {gastosCent > 0 && <LinhaLista rotulo="Gastos com comprovante" valor={<Valor px={15} cor="var(--text-secondary)">{gastosCent / 100}</Valor>} />}
          <LinhaLista rotulo="Conta como renda (do MEI)" detalhe="Faturamento, menos gastos, menos a parte isenta." valor={<Valor px={15} cor="var(--text-secondary)">{conta.tributavelMei}</Valor>} />
          {outraRenda && outrasCent > 0 && <LinhaLista rotulo="Outras rendas" valor={<Valor px={15} cor="var(--text-secondary)">{outrasCent / 100}</Valor>} />}
          <LinhaLista rotulo="Renda do ano" valor={<Valor px={15.5} peso={700}>{conta.rendaTributavel}</Valor>} />
        </SecaoLista>

        {infoAtiv.doCnpj && (
          <p className="flex" style={{ gap: 8, fontSize: 13.5, lineHeight: 1.45, color: "var(--text-tertiary)", marginTop: 12 }}>
            <Info size={15} className="shrink-0" style={{ marginTop: 2 }} />
            <span>
              Atividade do seu CNPJ: {rotuloAtividade} ({pct}%).
              {infoAtiv.mista ? " Você tem atividades com percentuais diferentes: usei o da principal." : ""}
            </span>
          </p>
        )}

        <SecaoLista titulo="Imposto">
          <LinhaLista
            Icon={ShieldCheck}
            rotulo={valeIsencaoNova && conta.dentroDaIsencaoNova ? "Imposto: provavelmente zero" : "Pode ter imposto a pagar"}
            detalhe={valeIsencaoNova && conta.dentroDaIsencaoNova
              ? `Até R$ ${(ISENCAO_MENSAL_IR * 12).toLocaleString("pt-BR")} de renda no ano fica isento (lei nova, desde 2026).`
              : "A gente confere com você e te ajuda a declarar."}
          />
        </SecaoLista>

        <SecaoLista titulo={`Declaração do MEI (até 31/05/${anoEntrega})`}>
          <LinhaLista rotulo="Faturamento do ano" valor={<Valor px={15} cor="var(--text-secondary)">{fatCent / 100}</Valor>} />
          <LinhaLista rotulo="Teve funcionário" valor={funcionario ? "Sim" : "Não"} />
        </SecaoLista>

        {/* v3: os outros motivos que obrigam a declarar (so aviso; o app nao calcula) */}
        <SecaoLista titulo="Também precisa declarar quem teve">
          <LinhaLista rotulo={`Bens acima de ${reaisInteiros(LIMITE_BENS_IR)}`} detalhe="Casa, caminhão, carro... somados, em 31 de dezembro." />
          <LinhaLista rotulo={`Rendimentos isentos acima de ${reaisInteiros(LIMITE_RENDIMENTOS_ISENTOS_IR)}`} detalhe="A parte isenta do MEI, FGTS, poupança..." />
          <LinhaLista rotulo={`Bolsa de valores acima de ${reaisInteiros(LIMITE_BOLSA_IR)}`} detalhe="Ou lucro com ações." />
          <LinhaLista rotulo={`Atividade rural acima de ${reaisInteiros(LIMITE_RECEITA_RURAL_IR)}`} />
        </SecaoLista>

        <p style={{ fontSize: 13, lineHeight: 1.45, color: "var(--text-tertiary)", marginTop: 22 }}>
          Estimativa pelas {FONTE_LIMITES_IR}.
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
          {ehResultado ? "Resultado" : "Imposto de Renda"}
        </h1>
        {!ehResultado && (
          <span className="ml-auto" style={{ fontSize: 14, color: "var(--text-tertiary)", paddingRight: 4 }}>
            {passo - (primeiroPasso - 1)} de {totalPerguntas}
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
              onClick={() => navigate(-(6 - primeiroPasso))}
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
