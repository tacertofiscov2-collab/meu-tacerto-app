/* FISCAL v3 — palavraDaSituacao: velocimetro zerado diz "Falta informar" (nunca "Tá tranquilo") (v2: valor do DAS pelo CNAE (caminhoneiro: municipal / intermunicipal / os dois; MEI comum: comercio / servicos / os dois) (v1: fonte unica das regras fiscais) */
// Fonte ÚNICA da verdade para regras fiscais do TaCerto!

export const LIMITES_ANUAIS = {
  MEI: 81000,
  MEI_CAMINHONEIRO: 251600,
};

export const LABEL_TIPO = {
  MEI: "MEI",
  MEI_CAMINHONEIRO: "MEI Caminhoneiro",
};

// Limites de caracteres — MUD 17
export const LIMITE_NOME_INPUT = 20;
export const LIMITE_NOME_EXIBICAO = 16;
export const LIMITE_VALOR_LANCAMENTO = 9999999.99;
export const LIMITE_PERGUNTA_CHAT = 300;

export function truncarNome(nome, max = LIMITE_NOME_EXIBICAO) {
  const n = String(nome || "").trim();
  if (n.length <= max) return n;
  return n.slice(0, max).trimEnd() + "…";
}

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
    palavra: "Tá tranquilo",
    textoDetalhado: (p) =>
      `Você usou ${Number(p).toFixed(0)}% do seu limite anual. Está tranquilo — ainda tem bastante espaço até dezembro.`,
  },
  fique_de_olho: {
    cor: "#84cc16",
    mensagem: "Vale começar a acompanhar de perto.",
    resumo: "Já passou da metade do limite.",
    palavra: "Tá tranquilo",
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
    palavra: "Passou",
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

/* v3 (10/10/2026): velocimetro ZERADO no ano nao e "Tá tranquilo" —
   e falta de informacao. Use esta funcao no lugar de
   FAIXA_INFO[faixa].palavra sempre que mostrar a palavra da faixa. */
export const PALAVRA_SEM_FATURAMENTO = "Falta informar";
export function palavraDaSituacao(percentual, faturado) {
  if (!(Number(faturado) > 0)) return PALAVRA_SEM_FATURAMENTO;
  return (FAIXA_INFO[faixaDoVelocimetro(percentual)] || FAIXA_INFO.tranquilo).palavra;
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
    /* v2: R$ 200,52 e quem paga ICMS + ISS (frete municipal E
       intermunicipal). O nome antigo da chave ficou para nao quebrar
       quem ja usa; o certo e "icms_e_iss" (abaixo). */
    produtos_perigosos_mudancas: 200.52,
    icms_e_iss: 200.52,
  },
};

/* ===================================================================
   VALOR DO DAS PELO CNAE (v2 — 10/10/2026)

   Salario minimo de 2026: R$ 1.621 (Decreto 12.797/2025). O DAS do MEI
   e INSS + R$ 1 de ICMS (comercio, industria, frete entre cidades) e/ou
   R$ 5 de ISS (servicos, frete na mesma cidade).

   MEI CAMINHONEIRO (CNAE 4930-2/xx):
     so 4930-2/01 (frete municipal)            -> ISS        R$ 199,52
     4930-2/01 + outro 4930-2/0x               -> ICMS + ISS R$ 200,52
     so 4930-2/02, /03 ou /04 (entre cidades)  -> ICMS       R$ 195,52
     sem CNAE no perfil                        -> R$ 195,52 (como antes)
   MEI COMUM:
     comercio (divisoes 45 a 47) ou industria (05 a 33) -> ICMS R$ 82,05
     servico (o resto)                                   -> ISS  R$ 86,05
     os dois                                             -> R$ 87,05
     sem CNAE no perfil -> R$ 86,05 (servicos, como antes)
   Conta o CNAE principal E os secundarios (o DAS cobra pelas
   atividades registradas).
   ⚠️ Valores de 2026: trocar DAS_2026 quando sair o salario de 2027.
   =================================================================== */
export const DAS_ATIVIDADE_PADRAO = {
  MEI_CAMINHONEIRO: "intermunicipal_interestadual",
  MEI: "servicos",
};

function cnae7(c) {
  const d = String(c ?? "").replace(/\D/g, "");
  return d.length === 7 ? d : "";
}

/* Qual linha do DAS_2026 vale para o tipo e os CNAEs (principal +
   secundarios, em qualquer formato: 4930202, "4930-2/02"...) */
export function atividadeDasPeloCnae(tipo, cnaes = []) {
  const lista = (Array.isArray(cnaes) ? cnaes : [cnaes]).map(cnae7).filter(Boolean);
  if (tipo === "MEI_CAMINHONEIRO") {
    const frete = lista.filter((c) => c.startsWith("49302"));
    if (!frete.length) return DAS_ATIVIDADE_PADRAO.MEI_CAMINHONEIRO;
    const municipal = frete.includes("4930201");
    const entreCidades = frete.some((c) => c !== "4930201");
    if (municipal && entreCidades) return "icms_e_iss";
    return municipal ? "municipal" : "intermunicipal_interestadual";
  }
  if (!lista.length) return DAS_ATIVIDADE_PADRAO.MEI;
  const divisao = (c) => Number(c.slice(0, 2));
  const comercioOuIndustria = lista.some((c) => {
    const d = divisao(c);
    return (d >= 45 && d <= 47) || (d >= 5 && d <= 33);
  });
  const servico = lista.some((c) => {
    const d = divisao(c);
    return !((d >= 45 && d <= 47) || (d >= 5 && d <= 33));
  });
  if (comercioOuIndustria && servico) return "comercio_e_servicos";
  return comercioOuIndustria ? "comercio_industria" : "servicos";
}

/* Valor do DAS do mes (R$) para o tipo e os CNAEs do perfil */
export function valorDasMensal(tipo, cnaes = []) {
  const tabela = DAS_2026[tipo] || DAS_2026.MEI;
  return tabela[atividadeDasPeloCnae(tipo, cnaes)] ?? tabela[DAS_ATIVIDADE_PADRAO[tipo] || DAS_ATIVIDADE_PADRAO.MEI];
}

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

/* ===================================================================
   COR DO BALÃO DO FISCO — apenas 3 cores (verde / amarelo / vermelho)
   O velocímetro tem 6 cores; o balão simplifica em 3 níveis.
   =================================================================== */
export const BALAO_CORES = {
  verde: "#22c55e",
  amarelo: "#f59e0b",
  vermelho: "#ef4444",
};

export function corBalaoDaFaixa(faixa) {
  if (faixa === "tranquilo" || faixa === "fique_de_olho") return BALAO_CORES.verde;
  if (faixa === "atencao" || faixa === "perto_do_limite") return BALAO_CORES.amarelo;
  return BALAO_CORES.vermelho;
}