/* CONCILIACAO v2 — o ajuste do total do ano so absorve recebimento ate o DIA do ajuste (horario de Brasilia) e do mesmo ano; diaBR (v1:o que e ESTIMADO no velocimetro (total digitado) e o que e CONFERIDO (extrato confirmado), selo do velocimetro e a regra para nunca contar duas vezes (total do ano + extrato, lancamento a mao + extrato) */

/* ===================================================================
   NADA CONTADO DUAS VEZES (decisao do Fernando, HANDOFF-08-10)

   "App e WhatsApp sao um TaCerto so: nada pode ser contado duas vezes
   (mesmo extrato mandado nos dois, lancamento manual + extrato,
   adiantamento + saldo do mesmo frete)."

   1) TOTAL DO ANO (ESTIMADO)
      O "+" no modo "Total do ano" guarda UM lancamento de AJUSTE
      ("Ajuste do total do ano"; o antigo do cadastro, "Faturamento
      estimado até hoje", conta igual). Ajuste = total digitado - soma
      dos recebimentos. Ou seja: o total digitado JA INCLUI tudo que foi
      recebido ate a data do ajuste.
      Quando o extrato confirma recebimentos com data ATE a data do
      ajuste, eles ja estavam dentro do total: o ajuste DIMINUI o mesmo
      tanto (nunca fica negativo; zerou, some). Recebimento DEPOIS da
      data do ajuste e dinheiro novo: soma normal.
      Se o extrato mostrar MENOS do que o total digitado, sobra ajuste:
      o app mantem o que a pessoa disse (pode ter outra conta, dinheiro
      vivo). Pergunta registrada para o Fernando no HANDOFF.

   2) LANCAMENTO A MAO + EXTRATO
      Se a pessoa ja lancou a mao um recebimento com o MESMO valor (ao
      centavo) e data ate 3 dias de diferenca, a entrada do extrato e a
      mesma coisa: nao cria outro lancamento. Cada lancamento a mao so
      "casa" com UMA entrada. "A mao" = nao e ajuste e nao veio de uma
      entrada ja conferida (mesmo valor e mesma data exata de uma
      entrada com status "faturamento").

   3) MESMO EXTRATO DUAS VEZES
      Cuidado na gravacao: cada transacao tem uma "impressao digital"
      (chave_unica, src/lib/extrato.js) e o banco recusa repetida.
   =================================================================== */

export const DESCRICAO_AJUSTE_ANO = "Ajuste do total do ano";
/* Do cadastro antigo (ONBOARDING ate a v14) */
export const DESCRICAO_ESTIMADO = "Faturamento estimado até hoje";
export const DESCRICOES_DE_AJUSTE = [DESCRICAO_AJUSTE_ANO, DESCRICAO_ESTIMADO];

export function ehAjuste(l) {
  return DESCRICOES_DE_AJUSTE.includes(String(l?.descricao || "").trim());
}

const DIA_MS = 86400000;
const centavos = (v) => Math.round((Number(v) || 0) * 100);

/* "AAAA-MM-DD" no horario de Brasilia (UTC-3, sem horario de verao
   desde 2019), venha a data como vier (com fuso do banco ou local) */
export function diaBR(valor) {
  const t = new Date(valor).getTime();
  if (Number.isNaN(t)) return "";
  return new Date(t - 3 * 3600 * 1000).toISOString().slice(0, 10);
}
const doAno = (l, ano) => new Date(l.data).getFullYear() === ano;

/* Ajustes do ano (mais recente primeiro) e a soma dos recebimentos */
export function separarAjustes(lancamentos = [], ano = new Date().getFullYear()) {
  const daqui = lancamentos.filter((l) => doAno(l, ano));
  const ajustes = daqui.filter(ehAjuste).sort((a, b) => new Date(b.data) - new Date(a.data));
  const recebimentos = daqui.filter((l) => !ehAjuste(l));
  return {
    ajustes,
    recebimentos,
    somaAjustes: ajustes.reduce((s, l) => s + (Number(l.valor) || 0), 0),
    somaRecebimentos: recebimentos.reduce((s, l) => s + (Number(l.valor) || 0), 0),
  };
}

/**
 * Regra 1: quanto o ajuste do total do ano deve diminuir quando estas
 * entradas (ja confirmadas como faturamento) viram lancamento.
 * Devolve a lista do que fazer: [{ id, novoValor }] (novoValor 0 = apagar).
 * So conta entrada com data ate a data do ajuste.
 */
export function planoDeAbsorcao(ajustes = [], entradasConfirmadas = []) {
  if (!ajustes.length || !entradasConfirmadas.length) return [];
  const plano = [];
  // O mais recente primeiro: e ele que reflete o ultimo total digitado
  const lista = [...ajustes].sort((a, b) => new Date(b.data) - new Date(a.data));
  /* v2: compara pelo DIA de Brasilia (o recebimento do dia seguinte ao
     total digitado e dinheiro novo) e so do mesmo ano do ajuste */
  const diaLimite = diaBR(lista[0].data);
  const anoAjuste = diaLimite.slice(0, 4);
  let aAbater = entradasConfirmadas
    .filter((e) => {
      const d = diaBR(e.data);
      return d.slice(0, 4) === anoAjuste && d <= diaLimite;
    })
    .reduce((s, e) => s + centavos(e.valor), 0);
  for (const a of lista) {
    if (aAbater <= 0) break;
    const atual = centavos(a.valor);
    const tira = Math.min(atual, aAbater);
    aAbater -= tira;
    plano.push({ id: a.id, novoValor: (atual - tira) / 100 });
  }
  return plano;
}

/**
 * Regra 2: lancamentos feitos A MAO que podem ser a mesma coisa que
 * entradas do extrato. `entradasConferidas` = entradas com status
 * "faturamento" (as que ja viraram lancamento pelo app).
 */
export function lancamentosAMao(lancamentos = [], entradasConferidas = []) {
  const chaves = new Set(entradasConferidas.map((e) => `${centavos(e.valor)}|${new Date(e.data).getTime()}`));
  // Lancamento a mao que ja "casou" com uma entrada antes (lancamento_id
  // gravado na entrada) nao casa de novo
  const jaCasados = new Set(entradasConferidas.map((e) => e.lancamento_id).filter(Boolean));
  return lancamentos.filter(
    (l) => !ehAjuste(l) && !jaCasados.has(l.id) && !chaves.has(`${centavos(l.valor)}|${new Date(l.data).getTime()}`),
  );
}

/* Para cada entrada, o lancamento a mao igual (mesmo valor, ate 3 dias),
   sem usar o mesmo lancamento duas vezes. Devolve Map(entradaId -> lancamento). */
export function casarComLancamentosAMao(entradas = [], candidatos = [], dias = 3) {
  const usados = new Set();
  const casados = new Map();
  const ordenadas = [...entradas].sort((a, b) => new Date(a.data) - new Date(b.data));
  for (const e of ordenadas) {
    const ce = centavos(e.valor);
    const te = new Date(e.data).getTime();
    let melhor = null;
    let melhorDist = Infinity;
    for (const l of candidatos) {
      if (usados.has(l.id) || centavos(l.valor) !== ce) continue;
      const dist = Math.abs(new Date(l.data).getTime() - te);
      if (dist <= dias * DIA_MS && dist < melhorDist) {
        melhor = l;
        melhorDist = dist;
      }
    }
    if (melhor) {
      usados.add(melhor.id);
      casados.set(e.id, melhor);
    }
  }
  return casados;
}

/* ===================================================================
   SELO DO VELOCIMETRO (Etapa 2)
     "estimado"  existe ajuste do total do ano com valor (o numero e, ao
                 menos em parte, o que a pessoa disse)
     "conferido" sem ajuste, e ha recebimento do ano que veio de extrato
                 e foi confirmado pela pessoa
     null        nem um nem outro (so lancamentos a mao, ou nada)
   =================================================================== */
export function seloDoVelocimetro({ lancamentos = [], conferidosDoExtrato = 0, ano = new Date().getFullYear() } = {}) {
  const { somaAjustes } = separarAjustes(lancamentos, ano);
  if (somaAjustes > 0) return "estimado";
  if (conferidosDoExtrato > 0) return "conferido";
  return null;
}

/* Prefixo do pluggy_transaction_id das entradas/saidas que vieram de
   extrato enviado pelo app (ver src/lib/importarExtrato.js) */
export const PREFIXO_EXTRATO = "extrato-";
