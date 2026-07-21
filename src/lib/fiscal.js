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

export const FAIXAS_ORDEM = [
  "tranquilo", "fique_de_olho", "atencao", "perto_do_limite", "estourou", "critico",
];

export const FAIXA_RANGE_LABEL = {
  tranquilo: "0–50%",
  fique_de_olho: "50–75%",
  atencao: "75–90%",
  perto_do_limite: "90–100%",
  estourou: "100–120%",
  critico: "120%+",
};

export const FAIXA_INFO = {
  tranquilo: {
    cor: "#22c55e",
    mensagem: "Continua no seu ritmo.",
    resumo: "Tudo tranquilo, dentro do esperado.",
    textoDetalhado: (percentual) =>
      `Você usou ${Number(percentual).toFixed(0)}% do seu limite anual. Está tranquilo — ainda tem bastante espaço pra faturar até dezembro. Continue registrando cada recebimento pra manter o velocímetro sempre certo e não ter surpresa depois. O segredo é lançar tudo: dinheiro, Pix, cartão, transferência. Não importa se emitiu nota fiscal ou não.`,
  },
  fique_de_olho: {
    cor: "#84cc16",
    mensagem: "Vale começar a acompanhar de perto.",
    resumo: "Já passou da metade do limite — comece a acompanhar mês a mês.",
    textoDetalhado: (percentual) =>
      `Você já usou ${Number(percentual).toFixed(0)}% do seu limite anual. Ainda está dentro do previsto, mas já passou da metade — vale começar a acompanhar mês a mês pra não ter surpresa no fim do ano. Um bom hábito nessa faixa é olhar o app antes de fechar cada mês e comparar com o mesmo período do ano passado. Assim você antecipa qualquer ajuste.`,
  },
  atencao: {
    cor: "#f59e0b",
    mensagem: "Bora planejar os próximos meses.",
    resumo: "Chegando perto do teto — planeje os próximos recebimentos.",
    textoDetalhado: (percentual) =>
      `Você já usou ${Number(percentual).toFixed(0)}% do seu limite anual. Está chegando perto do teto — hora de planejar os próximos recebimentos com cuidado até dezembro. Se você tem previsão de receber um valor grande, vale considerar dividir em parcelas que caiam no ano que vem. E se der pra falar com um contador antes de qualquer decisão maior, melhor ainda.`,
  },
  perto_do_limite: {
    cor: "#f97316",
    mensagem: "Segura a mão até janeiro pra não estourar.",
    resumo: "Muito próximo do teto — segure grandes valores até janeiro.",
    textoDetalhado: (percentual) =>
      `Você já usou ${Number(percentual).toFixed(0)}% do seu limite anual — está muito próximo do teto. Se possível, evite receber grandes valores nos próximos meses pra não ultrapassar. A regra é: se passar de 100%, você ainda pode continuar MEI até dezembro (pagando um DAS complementar), desde que não passe de 20% acima do limite. Acima disso, o desenquadramento é retroativo. Fala com um contador antes de fechar qualquer contrato grande agora.`,
  },
  estourou: {
    cor: "#ef4444",
    mensagem: "Você paga DAS complementar e ajusta em janeiro.",
    resumo: "Passou do limite, mas ainda dentro dos 20% permitidos por lei.",
    textoDetalhado: (_percentual) =>
      `Você passou do seu limite anual, mas ainda dentro dos 20% que a lei permite. Você vai continuar sendo MEI até 31 de dezembro, mas vai precisar pagar um DAS complementar sobre o valor que passou. A partir de 1º de janeiro do próximo ano você deixa de ser MEI. Recomendamos falar com um contador pra se planejar.`,
  },
  critico: {
    cor: "#dc2626",
    mensagem: "Fala com um contador o quanto antes.",
    resumo: "Passou mais de 20% do limite — desenquadramento retroativo.",
    textoDetalhado: (_percentual) =>
      `Você passou mais de 20% do seu limite anual. Pela lei, você deixa de ser MEI com efeito retroativo desde 1º de janeiro deste ano — ou seja, todos os impostos são recalculados como se você já fosse Simples Nacional. É importante falar com um contador o quanto antes pra regularizar sua situação e evitar problemas.`,
  },
};

// Aliases de compatibilidade
for (const chave of Object.keys(FAIXA_INFO)) {
  const f = FAIXA_INFO[chave];
  f.label = f.mensagem;
  f.principal = f.mensagem;
  f.apoio = f.mensagem;
}

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

export const DAS_VENCIMENTO_DIA = 20;
export const DAS_VENCIMENTO_LABEL =
  "Dia 20 (antecipa se cair em fim de semana ou feriado)";
export const DASN_PRAZO = { dia: 31, mes: 5 };

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

// Data mínima selecionável para lançamentos, conforme abertura do MEI.
// Se abriu antes do ano corrente: 01/01 do ano corrente.
// Se abriu durante o ano corrente: 01 do mês de abertura.
export function dataMinimaLancamento(mesAbertura, anoAbertura) {
  const anoCorrente = new Date().getFullYear();
  if (mesAbertura && anoAbertura && Number(anoAbertura) === anoCorrente) {
    const mm = String(mesAbertura).padStart(2, "0");
    return `${anoCorrente}-${mm}-01`;
  }
  return `${anoCorrente}-01-01`;
}