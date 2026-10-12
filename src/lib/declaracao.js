/* DECLARACAO v3 — regras da isencao conferidas (tarefa de 10-10, Bloco F): parte isenta = receita x percentual da atividade MENOS o DAS devido no ano (LC 123, art. 14 §1o); atividade pelo CNAE PRINCIPAL (atividadeIrPeloCnae, infoAtividadeIr com o aviso de atividade mista); dasDevidoNoAno; limites oficiais de quem precisa declarar com a fonte (LIMITE_DECLARAR_IR, LIMITE_RENDIMENTOS_ISENTOS_IR, LIMITE_BENS_IR, LIMITE_BOLSA_IR, LIMITE_RECEITA_RURAL_IR); simularAnoMei desconta o DAS; resumoDasDoAno (DAS do ano: ja venceram e falta vencer) (v2: simularAnoMei (Simulador do MEI: previsto no ano, % do limite, mes em que passaria, quanto ainda pode por mes, DAS do ano e IR estimado) e atividadeDoIr (pelo tipo e CNAE) (v1: regras e contas da Declaracao anual (DASN-SIMEI do MEI e o Imposto de Renda da pessoa), num lugar so para atualizar todo ano)) */
import {
  LIMITES_ANUAIS, limiteProporcional, valorDasMensal,
} from "./fiscal.js";
import { vencimentoDasDoMes } from "./vencimentoDas.js";

/* ===================================================================
   DECLARACAO ANUAL — REGRAS (pesquisado em 06/10/2026)

   DASN-SIMEI (a declaracao do MEI)
   - Todo ano, ate 31 de maio, sobre o ano anterior. Obrigatoria mesmo
     sem faturamento. Informa o faturamento do ano e se teve empregado.
   - Atrasou: multa de 2% ao mes sobre os impostos declarados, no
     maximo 20%, minimo R$ 50.
   - Feita no site do Simples Nacional (so com o CNPJ) ou no App MEI.

   IMPOSTO DE RENDA DA PESSOA (IRPF) — HANDOFF, Parte 3-IR
   v3 (12/10/2026, tarefa de 10-10, Bloco F — regras conferidas):
   - Parte ISENTA = receita bruta do ano x percentual da atividade (Lei
     9.249/1995, art. 15: 8% comercio, industria e transporte de CARGA;
     16% transporte de passageiros; 32% servicos) MENOS o valor do DAS
     devido no ano (LC 123/2006, art. 14, §1o).
   - Atividade: a do CNAE PRINCIPAL do CNPJ. Atividade mista (CNAEs com
     percentuais diferentes) seria o percentual de cada uma sobre a
     receita dela; o app nao sabe dividir a receita, entao usa o da
     principal e AVISA (infoAtividadeIr().mista). Sem CNPJ: pergunta.
   - Lucro maior que a parte isenta so pode ser isento com escrituracao
     contabil (LC 123, art. 14, §2o). O app NAO usa essa via: so mostra
     "Pode ser maior com contabilidade completa."
   - Lucro = faturamento - gastos com comprovante.
   - Parte que conta como RENDA (tributavel) = lucro - parte isenta
     (minimo 0).
   - Precisa declarar quando a renda tributavel do ano (somando outras,
     como salario e aluguel) passa do limite. LIMITE_DECLARAR_IR e o do
     ultimo ano publicado (R$ 35.584, ano de 2025, declarado em 2026).
     O de 2026 (declarado em 2027) sai no comeco de 2027: atualizar aqui.
   - Lei 15.270/2025: desde 01/01/2026 quem tem renda tributavel de ate
     R$ 5 mil por mes (R$ 60 mil no ano) fica isento do imposto, com
     desconto ate R$ 7.350 por mes. Declarar nao e o mesmo que pagar.
   - Ha outros motivos que obrigam a declarar (bens acima de R$ 800 mil,
     investimentos em bolsa etc.): o app so avisa, nao calcula.
   ⚠️ CONFERIR COM O CONTADOR antes do piloto.
   =================================================================== */

export const PRAZO_DASN = { dia: 31, mes: 5 }; // 31 de maio
export const MULTA_MINIMA_DASN = 50;
export const LINK_DASN_SIMEI =
  "https://www8.receita.fazenda.gov.br/SimplesNacional/Aplicacoes/ATSPO/dasnsimei.app/Identificacao";

/* ===================================================================
   QUEM PRECISA DECLARAR O IR (v3) — limites do ULTIMO ano publicado:
   declaracao de 2026, sobre o ano de 2025. Fonte: Receita Federal,
   regras do IRPF 2026 ("Quem deve declarar", divulgadas em 02/2026;
   noticia: https://www.congressoemfoco.com.br/noticia/117288/quem-deve-declarar-receita-divulga-regras-do-ir-2026
   e CRC-MA: https://crcma.org.br/noticias/quem-precisa-declarar-o-imposto-de-renda-2026).
   ATUALIZAR TODO ANO quando a Receita divulgar (comeco do ano).
   O app so pergunta "Voce teve outra renda no ano?" (sim/nao + valor);
   os outros motivos so aparecem na tela como aviso.
   =================================================================== */
/* Rendimentos tributaveis (MEI + salario, aluguel, aposentadoria...) acima disso */
export const LIMITE_DECLARAR_IR = 35584;
export const ANO_DO_LIMITE_IR = 2025;
/* Rendimentos isentos, nao tributaveis ou tributados so na fonte acima disso */
export const LIMITE_RENDIMENTOS_ISENTOS_IR = 200000;
/* Bens e direitos (casa, caminhao, carro...) acima disso em 31/12 */
export const LIMITE_BENS_IR = 800000;
/* Operacoes na bolsa acima disso no ano (ou com lucro tributavel) */
export const LIMITE_BOLSA_IR = 40000;
/* Receita bruta de atividade rural acima disso */
export const LIMITE_RECEITA_RURAL_IR = 177920;
export const FONTE_LIMITES_IR = "Receita Federal, regras do IRPF 2026 (ano de 2025)";

/* Lei 15.270/2025: isento ate R$ 5 mil por mes (desde 2026) */
export const ISENCAO_MENSAL_IR = 5000;
/* v3: vale para a renda de 2026 em diante (declaracao de 2027). A
   declaracao de 2026 (ano de 2025) ainda usa a tabela antiga. */
export const ANO_INICIO_ISENCAO_5MIL = 2026;

/* Atividades e o percentual que fica isento */
export const ATIVIDADES = [
  { id: "cargas", rotulo: "Transporte de cargas", detalhe: "Caminhoneiro, frete", percentual: 0.08 },
  { id: "comercio", rotulo: "Comércio ou indústria", detalhe: "Venda de produtos, fabricação", percentual: 0.08 },
  { id: "passageiros", rotulo: "Transporte de passageiros", detalhe: "Van, táxi, aplicativo", percentual: 0.16 },
  { id: "servicos", rotulo: "Serviços", detalhe: "Mão de obra, manutenção, outros", percentual: 0.32 },
];

/* Ano em que a proxima DASN vence (31/05) e o ano que ela declara */
export function proximaDeclaracao(hoje = new Date()) {
  const ano = hoje.getFullYear();
  const passouDoPrazo = hoje > new Date(ano, PRAZO_DASN.mes - 1, PRAZO_DASN.dia, 23, 59, 59);
  const anoEntrega = passouDoPrazo ? ano + 1 : ano;
  return { anoEntrega, anoDeclarado: anoEntrega - 1 };
}

/* ===================================================================
   ATIVIDADE DO IR PELO CNAE (v3)
     4930-2/xx (frete)                               -> cargas      8%
     49.21 a 49.29 (onibus, van, taxi, escolar...)   -> passageiros 16%
     comercio 45 a 47 (menos 4520/4543, manutencao)
       e industria 05 a 32                           -> comercio    8%
     o resto                                         -> servicos   32%
   =================================================================== */
export function atividadeIrPeloCnae(cnae) {
  const c = String(cnae ?? "").replace(/\D/g, "");
  if (c.length !== 7) return null;
  if (c.startsWith("49302")) return "cargas";
  const grupo = c.slice(0, 4);
  const divisao = Number(c.slice(0, 2));
  if (c.startsWith("492")) return "passageiros";
  if (grupo === "4520" || grupo === "4543") return "servicos";
  if ((divisao >= 45 && divisao <= 47) || (divisao >= 5 && divisao <= 32)) return "comercio";
  return "servicos";
}

const percentualDe = (id) => (ATIVIDADES.find((a) => a.id === id) || {}).percentual;

/**
 * Atividade para o IR. cnaes[0] = o PRINCIPAL.
 * { atividade, doCnpj, mista }:
 *   - com CNAE: a do principal (doCnpj = true); mista = algum secundario
 *     tem outro percentual (a tela avisa que usou o da principal);
 *   - sem CNAE: caminhoneiro = cargas; MEI comum = null (a tela pergunta).
 */
export function infoAtividadeIr(tipo, cnaes = []) {
  const lista = (Array.isArray(cnaes) ? cnaes : [cnaes]).filter(Boolean);
  const principal = atividadeIrPeloCnae(lista[0]);
  if (principal) {
    const pct = percentualDe(principal);
    const mista = lista.slice(1).some((c) => {
      const a = atividadeIrPeloCnae(c);
      return a && percentualDe(a) !== pct;
    });
    return { atividade: principal, doCnpj: true, mista };
  }
  return { atividade: tipo === "MEI_CAMINHONEIRO" ? "cargas" : null, doCnpj: false, mista: false };
}

/* DAS devido no ano: valor do mes (pelo CNAE) x meses do ano em que era
   MEI (de janeiro, ou do mes de abertura se abriu naquele ano).
   ⚠️ Usa os valores de 2026 (DAS_2026) para qualquer ano. */
export function dasDevidoNoAno({ tipo = "MEI", cnaes = [], ano, mesAbertura = null, anoAbertura = null } = {}) {
  const abriuNoAno = Number(anoAbertura) === Number(ano) && Number(mesAbertura) >= 1;
  const meses = abriuNoAno ? 12 - Math.min(Number(mesAbertura), 12) + 1 : 12;
  return (valorDasMensal(tipo, cnaes) || 0) * meses;
}

/**
 * Conta do Imposto de Renda do MEI (estimativa).
 * Valores em reais. Devolve as partes e se precisa declarar.
 * v3: dasDevido = DAS devido no ano (sai da parte isenta).
 */
export function calcularIR({ atividade, faturamento, gastos = 0, outrasRendas = 0, dasDevido = 0 }) {
  const ativ = ATIVIDADES.find((a) => a.id === atividade) || ATIVIDADES[0];
  const fat = Math.max(0, Number(faturamento) || 0);
  const gas = Math.max(0, Number(gastos) || 0);
  const outras = Math.max(0, Number(outrasRendas) || 0);
  const das = Math.max(0, Number(dasDevido) || 0);
  const isentaBruta = fat * ativ.percentual;
  const isenta = Math.max(0, isentaBruta - das);
  const lucro = Math.max(0, fat - gas);
  const tributavelMei = Math.max(0, lucro - isenta);
  const rendaTributavel = tributavelMei + outras;
  return {
    percentual: ativ.percentual,
    isentaBruta,
    das,
    isenta,
    lucro,
    tributavelMei,
    rendaTributavel,
    precisaDeclarar: rendaTributavel > LIMITE_DECLARAR_IR,
    dentroDaIsencaoNova: rendaTributavel <= ISENCAO_MENSAL_IR * 12,
  };
}

/* ===================================================================
   SIMULADOR DO MEI (v2 — 10/10/2026, tarefa de 08-10, Etapa 7)

   Entrada: o ritmo que a pessoa diz (quanto recebe por mes; ja vem com a
   media real do app) e, se quiser, quanto gasta por mes.
   Conta (as mesmas regras do resto do app):
   - meses ativos do ano: de janeiro, ou do mes de abertura se o MEI
     abriu este ano, ate dezembro;
   - LIMITE do ano: cheio (R$ 251.600 caminhoneiro / R$ 81.000 MEI) ou
     proporcional se abriu este ano (fiscal.js, limiteProporcional);
   - PREVISTO = o que ja faturou + ritmo x meses que faltam depois do mes
     atual (o mesmo jeito da projecao do AppState);
   - MES EM QUE PASSA: o primeiro mes em que o acumulado passa do limite
     (null se nao passa; o mes atual se ja passou);
   - QUANTO AINDA PODE POR MES: (limite - ja faturado) / meses que faltam
     ate dezembro (contando o atual). Nunca negativo;
   - DAS DO ANO: valor do DAS pelo CNAE x meses ativos;
   - IR: calcularIR com o previsto, os gastos do ano previstos (gasto por
     mes x meses ativos) e a atividade do tipo/CNAE (atividadeDoIr).
   E uma ESTIMATIVA (a tela diz isso).
   =================================================================== */

/* Atividade do IR pelo tipo de MEI e CNAE. v3: a do CNAE PRINCIPAL
   (infoAtividadeIr); sem CNAE: caminhoneiro = cargas, MEI comum =
   servicos (32%, o mais conservador para uma estimativa) */
export function atividadeDoIr(tipo, cnaes = []) {
  return infoAtividadeIr(tipo, cnaes).atividade || "servicos";
}

export function simularAnoMei({
  tipo = "MEI",
  cnaes = [],
  mesAbertura = null,
  anoAbertura = null,
  faturadoAteAgora = 0,
  recebeMes = 0,
  gastaMes = 0,
  hoje = new Date(),
} = {}) {
  const ano = hoje.getFullYear();
  const mesAtual = hoje.getMonth() + 1;
  const abriuEsteAno = Number(anoAbertura) === ano && Number(mesAbertura) >= 1;
  const mesInicio = abriuEsteAno ? Math.min(Number(mesAbertura), 12) : 1;
  const mesesAtivos = 12 - mesInicio + 1;

  const limite = abriuEsteAno
    ? limiteProporcional(tipo, Number(mesAbertura), ano, ano)
    : LIMITES_ANUAIS[tipo] ?? LIMITES_ANUAIS.MEI;

  const faturado = Math.max(0, Number(faturadoAteAgora) || 0);
  const ritmo = Math.max(0, Number(recebeMes) || 0);
  const gasto = Math.max(0, Number(gastaMes) || 0);

  const mesesDepois = Math.max(0, 12 - Math.max(mesAtual, mesInicio));
  const previsto = faturado + ritmo * mesesDepois;

  let mesQuePassa = null;
  if (faturado > limite) mesQuePassa = mesAtual;
  else {
    let acumulado = faturado;
    for (let m = Math.max(mesAtual, mesInicio) + 1; m <= 12; m++) {
      acumulado += ritmo;
      if (acumulado > limite) { mesQuePassa = m; break; }
    }
  }

  const mesesQueFaltam = 12 - Math.max(mesAtual, mesInicio) + 1;
  const podePorMes = Math.max(0, limite - faturado) / Math.max(1, mesesQueFaltam);

  const dasDoAno = (valorDasMensal(tipo, cnaes) || 0) * mesesAtivos;
  const ir = calcularIR({
    atividade: atividadeDoIr(tipo, cnaes),
    faturamento: previsto,
    gastos: gasto * mesesAtivos,
    dasDevido: dasDoAno, // v3: o DAS do ano sai da parte isenta
  });

  return {
    ano,
    limite,
    proporcional: abriuEsteAno && mesInicio > 1,
    previsto,
    pctDoLimite: limite > 0 ? (previsto / limite) * 100 : 0,
    mesQuePassa,
    podePorMes,
    dasDoAno,
    ir,
  };
}

/* ===================================================================
   DAS DO ANO (v3 — 12/10/2026, Bloco F, "Calcular > DAS do ano")

   Competencias do ano em que era MEI (janeiro, ou o mes de abertura se
   abriu no ano) ate dezembro. O DAS de cada mes vence no dia 20 do mes
   SEGUINTE (prorrogado para o dia util: vencimentoDas.js). "Ja venceram"
   = vencimento ate hoje; "falta vencer" = o resto.
   ⚠️ O app NUNCA diz que um DAS esta "em aberto" (so o governo sabe):
   aqui so conta quantos venceram, nao se foram pagos. Pagos = so os que
   a pessoa guardou no Historico do DAS (quem chama soma).
   =================================================================== */
export function resumoDasDoAno({ tipo = "MEI", cnaes = [], ano = new Date().getFullYear(), mesAbertura = null, anoAbertura = null, hoje = new Date() } = {}) {
  const valorMes = valorDasMensal(tipo, cnaes) || 0;
  const abriuNoAno = Number(anoAbertura) === Number(ano) && Number(mesAbertura) >= 1;
  const mesInicio = abriuNoAno ? Math.min(Number(mesAbertura), 12) : 1;
  const hojeDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()).getTime();
  const competencias = [];
  for (let m = mesInicio; m <= 12; m++) {
    const venc = m === 12 ? vencimentoDasDoMes(ano + 1, 1) : vencimentoDasDoMes(ano, m + 1);
    competencias.push({ mes: m, vencimento: venc, venceu: Boolean(venc) && venc.getTime() <= hojeDia });
  }
  const vencidas = competencias.filter((c) => c.venceu);
  const aVencer = competencias.filter((c) => !c.venceu);
  return {
    ano,
    valorMes,
    mesInicio,
    meses: competencias.length,
    total: valorMes * competencias.length,
    vencidas: vencidas.length,
    valorVencidas: valorMes * vencidas.length,
    aVencer: aVencer.length,
    valorAVencer: valorMes * aVencer.length,
    proximoVencimento: aVencer[0]?.vencimento || null,
    competencias,
  };
}
