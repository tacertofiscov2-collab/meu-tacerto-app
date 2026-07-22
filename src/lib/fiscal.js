// Fonte ÚNICA da verdade para regras fiscais do TaCerto!

export const LIMITES_ANUAIS = {
  MEI: 81000,
  MEI_CAMINHONEIRO: 251600,
};

export const LABEL_TIPO = {
  MEI: "MEI",
  MEI_CAMINHONEIRO: "MEI Caminhoneiro",
};

// Vocabulário por tipo de MEI — usado em textos do app e do Fisco.
export const VOCAB = {
  MEI: {
    receita: "recebimento",
    receitas: "recebimentos",
    receitaPlural: "seus recebimentos",
    quemPaga: "clientes",
    verbo: "receber",
  },
  MEI_CAMINHONEIRO: {
    receita: "frete",
    receitas: "fretes",
    receitaPlural: "seus fretes",
    quemPaga: "embarcadores",
    verbo: "rodar",
  },
};

export const vocab = (tipo) => VOCAB[tipo] || VOCAB.MEI;

// Regra dos 20% — LC 123/2006, art. 18-A
export const MARGEM_20 = 0.2;
export const limiteAte20Percent = (tipo) =>
  (LIMITES_ANUAIS[tipo] ?? LIMITES_ANUAIS.MEI) * (1 + MARGEM_20);

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
    palavra: "Tá de boa",
    textoDetalhado: (p) =>
      `Você usou ${Number(p).toFixed(0)}% do seu limite anual. Está tranquilo — ainda tem bastante espaço até dezembro.`,
  },
  fique_de_olho: {
    cor: "#84cc16",
    mensagem: "Vale começar a acompanhar de perto.",
    resumo: "Já passou da metade do limite.",
    palavra: "Tá de boa",
    textoDetalhado: (p) =>
      `Você já usou ${Number(p).toFixed(0)}% do seu limite anual. Ainda está dentro do previsto, mas vale acompanhar mês a mês.`,
  },
  atencao: {
    cor: "#f59e0b",
    mensagem: "Bora planejar os próximos meses.",
    resumo: "Chegando perto do teto.",
    palavra: "Atenção",
    textoDetalhado: (p) =>
      `Você já usou ${Number(p).toFixed(0)}% do seu limite anual. Hora de planejar os próximos meses com cuidado.`,
  },
  perto_do_limite: {
    cor: "#f97316",
    mensagem: "Segura a mão até janeiro.",
    resumo: "Muito próximo do teto.",
    palavra: "Atenção",
    textoDetalhado: (p) =>
      `Você já usou ${Number(p).toFixed(0)}% do seu limite anual — está bem perto do teto.`,
  },
  estourou: {
    cor: "#ef4444",
    mensagem: "Passou do limite, mas dá pra ajustar.",
    resumo: "Passou do limite, dentro dos 20% da lei.",
    palavra: "Cuidado",
    textoDetalhado: () =>
      `Você passou do limite, mas ainda dentro dos 20% que a lei permite. Continua MEI até dezembro.`,
  },
  critico: {
    cor: "#dc2626",
    mensagem: "Fala com um contador o quanto antes.",
    resumo: "Passou mais de 20% do limite.",
    palavra: "Cuidado",
    textoDetalhado: () =>
      `Você passou mais de 20% do limite. Pela lei, o desenquadramento é retroativo a janeiro deste ano.`,
  },
};

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

export function dataMinimaLancamento(mesAbertura, anoAbertura) {
  const anoCorrente = new Date().getFullYear();
  if (mesAbertura && anoAbertura && Number(anoAbertura) === anoCorrente) {
    return `${anoCorrente}-${String(mesAbertura).padStart(2, "0")}-01`;
  }
  return `${anoCorrente}-01-01`;
}

/**
 * Excedente acima de 100% do limite.
 * Retorna null se ainda não passou.
 * - percentualExcesso: quanto passou (ex: 12 = 12% acima)
 * - dentroDos20: se ainda está na margem legal
 */
export function excedenteAcimaDoLimite(faturado, limite) {
  if (!limite || faturado <= limite) return null;
  const excesso = faturado - limite;
  const percentualExcesso = (excesso / limite) * 100;
  return {
    valor: excesso,
    percentualExcesso,
    dentroDos20: percentualExcesso <= 20,
  };
}