// Fonte ÚNICA da verdade para regras fiscais do TaCerto!
// Nenhuma tela deve ter esses valores hard-coded fora deste arquivo.

export const LIMITES_ANUAIS = {
  MEI: 81000,
  MEI_CAMINHONEIRO: 251600,
};

export const LABEL_TIPO = {
  MEI: "MEI",
  MEI_CAMINHONEIRO: "MEI Caminhoneiro",
};

// Regra dos 20% — LC 123/2006, art. 18-A, §5º-IV
export const MARGEM_20 = 0.2;
export const limiteAte20Percent = (tipo) => LIMITES_ANUAIS[tipo] * (1 + MARGEM_20);

// Limite proporcional para MEI aberto no meio do ano.
// Base: limite anual / 12 * meses de atividade no ano de abertura (inclui o mês de abertura).
export function limiteProporcional(tipo, mesAbertura, anoAbertura, anoCorrente) {
  const cheio = LIMITES_ANUAIS[tipo] ?? LIMITES_ANUAIS.MEI;
  if (!mesAbertura || !anoAbertura) return cheio;
  if (anoCorrente > anoAbertura) return cheio;
  const mesesRestantes = 12 - mesAbertura + 1;
  return Math.round((cheio / 12) * mesesRestantes);
}

export function faixaDoVelocimetro(percentual) {
  if (percentual < 50) return "tranquilo";
  if (percentual < 75) return "fique_de_olho";
  if (percentual < 90) return "atencao";
  if (percentual < 100) return "perto_do_limite";
  if (percentual <= 120) return "estourou";
  return "critico";
}

export const FAIXA_INFO = {
  tranquilo: {
    cor: "#22c55e",
    mensagem: "Continua no seu ritmo.",
    textoDetalhado: (percentual) =>
      `Você usou ${Number(percentual).toFixed(0)}% do seu limite anual. Está tranquilo — ainda tem bastante espaço pra faturar até dezembro. Continue registrando cada recebimento pra manter o velocímetro sempre certo e não ter surpresa depois. O segredo é lançar tudo: dinheiro, Pix, cartão, transferência. Não importa se emitiu nota fiscal ou não.`,
  },
  fique_de_olho: {
    cor: "#84cc16",
    mensagem: "Vale começar a acompanhar de perto.",
    textoDetalhado: (percentual) =>
      `Você já usou ${Number(percentual).toFixed(0)}% do seu limite anual. Ainda está dentro do previsto, mas já passou da metade — vale começar a acompanhar mês a mês pra não ter surpresa no fim do ano. Um bom hábito nessa faixa é olhar o app antes de fechar cada mês e comparar com o mesmo período do ano passado. Assim você antecipa qualquer ajuste.`,
  },
  atencao: {
    cor: "#f59e0b",
    mensagem: "Bora planejar os próximos meses.",
    textoDetalhado: (percentual) =>
      `Você já usou ${Number(percentual).toFixed(0)}% do seu limite anual. Está chegando perto do teto — hora de planejar os próximos recebimentos com cuidado até dezembro. Se você tem previsão de receber um valor grande, vale considerar dividir em parcelas que caiam no ano que vem. E se der pra falar com um contador antes de qualquer decisão maior, melhor ainda.`,
  },
  perto_do_limite: {
    cor: "#f97316",
    mensagem: "Segura a mão até janeiro pra não estourar.",
    textoDetalhado: (percentual) =>
      `Você já usou ${Number(percentual).toFixed(0)}% do seu limite anual — está muito próximo do teto. Se possível, evite receber grandes valores nos próximos meses pra não ultrapassar. A regra é: se passar de 100%, você ainda pode continuar MEI até dezembro (pagando um DAS complementar), desde que não passe de 20% acima do limite. Acima disso, o desenquadramento é retroativo. Fala com um contador antes de fechar qualquer contrato grande agora.`,
  },
  estourou: {
    cor: "#ef4444",
    mensagem: "Você paga DAS complementar e ajusta em janeiro.",
    textoDetalhado: (_percentual) =>
      `Você passou do seu limite anual, mas ainda dentro dos 20% que a lei permite. Você vai continuar sendo MEI até 31 de dezembro, mas vai precisar pagar um DAS complementar sobre o valor que passou. A partir de 1º de janeiro do próximo ano você deixa de ser MEI. Recomendamos falar com um contador pra se planejar.`,
  },
  critico: {
    cor: "#dc2626",
    mensagem: "Fala com um contador o quanto antes.",
    textoDetalhado: (_percentual) =>
      `Você passou mais de 20% do seu limite anual. Pela lei, você deixa de ser MEI com efeito retroativo desde 1º de janeiro deste ano — ou seja, todos os impostos são recalculados como se você já fosse Simples Nacional. É importante falar com um contador o quanto antes pra regularizar sua situação e evitar problemas.`,
  },
};

// Aliases de compatibilidade — todas as chaves antigas apontam para `mensagem`.
for (const chave of Object.keys(FAIXA_INFO)) {
  const f = FAIXA_INFO[chave];
  f.label = f.mensagem;
  f.principal = f.mensagem;
  f.apoio = f.mensagem;
}

// DAS mensal 2026
export const DAS_2026 = {
  MEI: {
    comercio_industria: 82.05,
    servicos: 86.05,
    comercio_e_servicos: 87.05,
  },
  MEI_CAMINHONEIRO: {
    intermunicipal_interestadual: 195.52,
    municipal: 199.52,
    produtos_perigosos_mudancas: 200.52,
  },
};

// Datas fiscais
export const DAS_VENCIMENTO_DIA = 20; // Antecipa se cair em fim de semana/feriado
export const DAS_VENCIMENTO_LABEL =
  "Dia 20 (antecipa se cair em fim de semana ou feriado)";
export const DASN_PRAZO = { dia: 31, mes: 5 }; // 31 de maio

export function calcularPercentual(faturado, limite) {
  if (limite <= 0) return 0;
  return (faturado / limite) * 100;
}

export function calcularFaltam(faturado, limite) {
  return Math.max(0, limite - faturado);
}

export function calcularFaltamOuExcedeu(faturado, limite) {
  const diff = Number(limite) - Number(faturado);
  if (diff >= 0) return { tipo: "faltam", valor: diff };
  return { tipo: "excedeu", valor: Math.abs(diff) };
}

export const fmtBRL = (v) =>
  "R$ " +
  Number(v || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });