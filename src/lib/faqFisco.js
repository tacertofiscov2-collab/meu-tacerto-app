import { LIMITES_ANUAIS, limiteAte20Percent } from "./fiscal.js";

const fmt = (v) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(v);

const RESSALVA = "Isso é uma orientação geral — pra decidir, vale confirmar com um contador.";

const ehCaminhoneiro = (c) => c.tipoMEI === "MEI_CAMINHONEIRO";

// Vocabulário aplicado nas respostas
const V = (c) =>
  ehCaminhoneiro(c)
    ? {
        receita: "frete",
        receitas: "fretes",
        oQueEntra: "seus fretes",
        cliente: "embarcador",
        clientes: "embarcadores",
        trabalhar: "rodar",
        trabalho: "frete",
        recebeu: "recebeu pelos fretes",
        atividade: "transporte",
      }
    : {
        receita: "recebimento",
        receitas: "recebimentos",
        oQueEntra: "seus recebimentos",
        cliente: "cliente",
        clientes: "clientes",
        trabalhar: "trabalhar",
        trabalho: "serviço",
        recebeu: "recebeu",
        atividade: "atividade",
      };

// ---- Perguntas por FAIXA (card "Sua situação" do dashboard) ----

const POR_FAIXA = {
  tranquilo: [
    {
      id: "t1",
      pergunta: "Como eu sei se estou no caminho certo?",
      resposta: (c) => {
        const v = V(c);
        return `Pelo velocímetro. Ele compara tudo que você já registrou este ano (${fmt(c.faturado)}) com o seu limite anual (${fmt(c.limite)}). Enquanto o ponteiro estiver na faixa verde, você tem folga.\n\nO segredo é registrar todos ${v.oQueEntra}: dinheiro, Pix, cartão, transferência. Não importa se você emitiu nota ou não — pra Receita, o que conta é o valor recebido.`;
      },
    },
    {
      id: "t2",
      pergunta: "Preciso lançar dinheiro em espécie também?",
      resposta: (c) => {
        const v = V(c);
        return `Sim. O limite olha a receita bruta, que é tudo que entra pelo seu ${v.atividade} — incluindo dinheiro vivo.\n\nDeixar de registrar não diminui o que você faturou de verdade: só faz o velocímetro mostrar um número mais baixo que a realidade, e isso é justamente o que causa susto no fim do ano.`;
      },
    },
    {
      id: "t3",
      pergunta: "O que acontece se eu esquecer de pagar o DAS?",
      resposta: () =>
        `O DAS vence todo dia 20. Se atrasar, ele continua disponível pra pagamento com multa e juros — não some.\n\nO problema maior é acumular: ficar muito tempo sem pagar pode complicar seus benefícios do INSS e até levar à baixa do CNPJ. Dá pra emitir tudo pelo app do MEI ou pelo Portal do Empreendedor.`,
    },
    {
      id: "t4",
      pergunta: "Meu salário CLT conta no limite?",
      resposta: () =>
        `Não. O limite considera só o que a sua empresa fatura pelo CNPJ.\n\nSalário de carteira assinada, aposentadoria, aluguel que você recebe como pessoa física — nada disso entra na conta.`,
    },
    {
      id: "t5",
      pergunta: "Preciso guardar dinheiro pra imposto?",
      resposta: () =>
        `Enquanto você estiver dentro do limite, o seu imposto é o próprio DAS mensal — um valor fixo, baixo, que você já paga.\n\nMas é bom hábito separar uma reserva mesmo assim: se em algum ano você passar do teto, vai existir uma guia extra pra pagar. ${RESSALVA}`,
    },
  ],

  fique_de_olho: [
    {
      id: "f1",
      pergunta: "Já passei da metade. Devo me preocupar?",
      resposta: (c) =>
        `Ainda não é motivo pra preocupação, mas é a hora certa de começar a acompanhar.\n\nVocê registrou ${fmt(c.faturado)} de ${fmt(c.limite)}. Um bom hábito daqui pra frente: olhar o app no fim de cada mês e comparar o ritmo com os meses que faltam.`,
    },
    {
      id: "f2",
      pergunta: "Como saber se vou estourar até dezembro?",
      resposta: () =>
        `O app calcula isso pra você: na tela de detalhes tem a média por mês e a projeção de quanto você fecha o ano se mantiver o ritmo atual.\n\nSe a projeção passar do seu limite, dá tempo de se planejar com calma.`,
    },
    {
      id: "f3",
      pergunta: (c) =>
        ehCaminhoneiro(c) ? "Posso recusar frete pra não estourar?" : "Posso recusar trabalho pra não estourar?",
      resposta: (c) => {
        const v = V(c);
        return `Pode, mas raramente é a melhor saída. Recusar ${v.trabalho} é abrir mão de dinheiro.\n\nAlternativas comuns: negociar com o ${v.cliente} pra que parte do pagamento caia em janeiro do ano seguinte, ou já se planejar pra virar Microempresa. ${RESSALVA}`;
      },
    },
    {
      id: "f4",
      pergunta: "O que acontece se eu passar do limite?",
      resposta: (c) =>
        `Depende de quanto passar.\n\nAté 20% acima (ou seja, até ${fmt(c.teto20)}): você continua MEI até 31 de dezembro e paga uma guia complementar na declaração anual. Em janeiro vira Microempresa.\n\nAcima disso: você deixa de ser MEI desde janeiro deste ano, com recálculo de impostos, multa e juros.`,
    },
    {
      id: "f5",
      pergunta: "Vale a pena virar Microempresa?",
      resposta: () =>
        `Depende do seu faturamento e da sua atividade. A ME permite faturar bem mais, mas os impostos deixam de ser um valor fixo e passam a ser um percentual do que você fatura, e você passa a precisar de contador.\n\nPra muita gente que cresceu, compensa. ${RESSALVA}`,
    },
  ],

  atencao: [
    {
      id: "a1",
      pergunta: "Quanto ainda posso faturar este ano?",
      resposta: (c) => {
        const falta = Math.max(0, c.limite - c.faturado);
        return `Pelo que você registrou, ainda cabem ${fmt(falta)} até bater o limite de ${fmt(c.limite)}.\n\nSe você passar disso, ainda tem a margem dos 20% (até ${fmt(c.teto20)}) antes da situação ficar realmente complicada.`;
      },
    },
    {
      id: "a2",
      pergunta: "Como eu me preparo pra virar ME?",
      resposta: () =>
        `Três coisas ajudam muito: procurar um contador antes de estourar (não depois), manter todos os lançamentos organizados, e separar uma reserva de caixa.\n\nQuem se antecipa costuma pagar bem menos que quem descobre em cima da hora.`,
    },
    {
      id: "a3",
      pergunta: "Posso dividir o pagamento pro ano que vem?",
      resposta: (c) => {
        const v = V(c);
        return `O que conta pro limite é a data em que você recebe, não a data do ${v.trabalho}.\n\nEntão, negociar com o ${v.cliente} pra que parte caia em janeiro é uma prática legítima. Só não vale registrar com data errada — isso sim é problema. ${RESSALVA}`;
      },
    },
    {
      id: "a4",
      pergunta: "O que é o DAS complementar?",
      resposta: () =>
        `É uma guia extra, paga uma vez só, sobre o valor que passou do limite.\n\nEla é gerada quando você faz a declaração anual (DASN-SIMEI), que vence em 31 de maio. Não é um valor alto quando o excesso é pequeno.`,
    },
    {
      id: "a5",
      pergunta: (c) =>
        ehCaminhoneiro(c) ? "Se eu parar de rodar agora, resolve?" : "Se eu parar de faturar agora, resolve?",
      resposta: (c) => {
        const v = V(c);
        return `Se você parar antes de bater o limite, sim — nada muda e você segue MEI normalmente no ano que vem.\n\nMas parar de ${v.trabalhar} raramente é a melhor decisão financeira. Vale conversar com um contador sobre qual sai mais caro: perder o faturamento ou migrar de regime.`;
      },
    },
  ],

  perto_do_limite: [
    {
      id: "p1",
      pergunta: "Estou quase no limite. O que faço?",
      resposta: (c) => {
        const falta = Math.max(0, c.limite - c.faturado);
        const v = V(c);
        return `Você tem ${fmt(falta)} de margem antes de bater os ${fmt(c.limite)}.\n\nA recomendação prática: evite fechar ${v.receitas} grandes agora sem antes falar com um contador. Passar do limite não é o fim do mundo, mas muda sua vida fiscal no ano que vem.`;
      },
    },
    {
      id: "p2",
      pergunta: "Se eu passar, perco o CNPJ?",
      resposta: () =>
        `Não. Você não perde o CNPJ — ele continua o mesmo. O que muda é o regime: de MEI você passa a Microempresa.\n\nNa prática, muda o valor dos impostos e as obrigações. O número do CNPJ segue igual.`,
    },
    {
      id: "p3",
      pergunta: "Preciso avisar a Receita?",
      resposta: (c) =>
        `Se você passar até 20% do limite (até ${fmt(c.teto20)}), a própria declaração anual cuida disso.\n\nSe passar de mais de 20%, aí sim você precisa comunicar o desenquadramento no Portal do Simples Nacional. Um contador faz isso rapidinho.`,
    },
    {
      id: "p4",
      pergunta: "Quanto vou pagar de imposto como ME?",
      resposta: (c) =>
        ehCaminhoneiro(c)
          ? `Como ME no Simples Nacional, o imposto vira um percentual do faturamento. Pra transporte de cargas, a faixa inicial costuma ficar em torno de 6%.\n\nO valor exato depende do seu caso. ${RESSALVA}`
          : `Como ME no Simples Nacional, o imposto vira um percentual do faturamento, e a faixa inicial costuma ficar entre 4% e 6% dependendo da atividade.\n\nO valor exato depende do seu caso. ${RESSALVA}`,
    },
    {
      id: "p5",
      pergunta: "Continuo com meus direitos do INSS?",
      resposta: () =>
        `Sim. O tempo que você contribuiu como MEI continua contando.\n\nComo ME, a forma de contribuir muda, mas o histórico não se perde. Vale conferir seu extrato no Meu INSS.`,
    },
  ],

  estourou: [
    {
      id: "e1",
      pergunta: "Passei do limite. E agora?",
      resposta: (c) =>
        `Calma — você passou, mas ainda está dentro da margem de 20% que a lei permite.\n\nNa prática: você continua MEI até 31 de dezembro, paga o DAS normalmente, e em janeiro vira Microempresa. Vai existir uma guia complementar sobre o valor que passou (${fmt(Math.max(0, c.faturado - c.limite))}).`,
    },
    {
      id: "e2",
      pergunta: "Vou pagar multa?",
      resposta: () =>
        `Nessa faixa, não há multa por estourar. O que existe é a guia complementar sobre o excedente — é imposto, não penalidade.\n\nMulta aparece quando o excesso passa de 20% ou quando a declaração anual é entregue em atraso.`,
    },
    {
      id: "e3",
      pergunta: (c) =>
        ehCaminhoneiro(c) ? "Preciso parar de rodar agora?" : "Preciso parar de faturar agora?",
      resposta: (c) => {
        const v = V(c);
        return `Não precisa parar de ${v.trabalhar}, mas precisa ficar de olho: se o total do ano passar de ${fmt(c.teto20)}, a regra muda completamente e o desenquadramento vira retroativo, com multa e juros.\n\nEssa é a linha que você não quer cruzar sem falar com um contador antes.`;
      },
    },
    {
      id: "e4",
      pergunta: "Quando exatamente viro Microempresa?",
      resposta: () => {
        const proximo = new Date().getFullYear() + 1;
        return `Em 1º de janeiro de ${proximo}, automaticamente.\n\nAté lá você segue MEI: paga o DAS normal, emite nota normal. A virada acontece sozinha, mas o ideal é já procurar um contador antes de dezembro pra não começar o ano perdido.`;
      },
    },
    {
      id: "e5",
      pergunta: "O que eu faço na declaração anual?",
      resposta: () =>
        `Você declara o valor total que faturou no ano, incluindo o que passou do limite. O sistema calcula a guia complementar sozinho.\n\nO prazo é 31 de maio. Entregar em atraso gera multa, então essa data vale anotar.`,
    },
  ],

  critico: [
    {
      id: "c1",
      pergunta: "Passei de 20%. O que muda?",
      resposta: (c) =>
        `Muda bastante, e por isso vale agir rápido.\n\nComo você passou de ${fmt(c.teto20)}, o desenquadramento é retroativo a 1º de janeiro deste ano. Na prática, a Receita passa a considerar que você foi Microempresa o ano inteiro, e os impostos são recalculados por esse regime.`,
    },
    {
      id: "c2",
      pergunta: "Vou pagar muito mais imposto?",
      resposta: (c) => {
        const v = V(c);
        return `Sim, o valor sobe — em vez do DAS fixo, você passa a pagar um percentual sobre tudo que ${v.recebeu} no ano, mais multa e juros sobre o atraso.\n\nO número exato depende da sua atividade e do total faturado. Um contador consegue calcular isso rapidamente.`;
      },
    },
    {
      id: "c3",
      pergunta: "O que faço primeiro?",
      resposta: () =>
        `Procure um contador. Essa é a única resposta honesta aqui.\n\nNão é um caso pra resolver sozinho pelo app: envolve recalcular o ano inteiro, escolher o anexo correto do Simples e emitir guias retroativas. Quanto antes começar, menos juros acumulam.`,
    },
    {
      id: "c4",
      pergunta: "Posso ser multado pela Receita?",
      resposta: () =>
        `Existe multa e juros sobre os impostos que ficaram em atraso, sim.\n\nSe a própria Receita identificar antes de você comunicar, a situação piora — por isso regularizar por conta própria é sempre melhor do que esperar.`,
    },
    {
      id: "c5",
      pergunta: "Meu CNPJ vai ser cancelado?",
      resposta: (c) =>
        ehCaminhoneiro(c)
          ? `Não. O CNPJ continua ativo e é o mesmo — o que muda é o regime tributário.\n\nVocê deixa de ser MEI Caminhoneiro e passa a ser Microempresa. Seu registro na ANTT (RNTRC) também continua valendo.`
          : `Não. O CNPJ continua ativo e é o mesmo — o que muda é o regime tributário.\n\nVocê deixa de ser MEI e passa a ser Microempresa. A empresa segue existindo e funcionando normalmente.`,
    },
  ],
};

// ---- Perguntas GERAIS (chat do Fisco) ----

const GERAIS = [
  {
    id: "g1",
    pergunta: "Quanto é o DAS e quando vence?",
    resposta: (c) =>
      ehCaminhoneiro(c)
        ? `O DAS do MEI Caminhoneiro é um valor fixo mensal, que muda um pouco conforme o tipo de transporte (municipal, intermunicipal ou cargas especiais). Ele já vem com INSS, ICMS e ISS num boleto só.\n\nVence todo dia 20. Se cair em fim de semana ou feriado, antecipa. O valor exato do seu caso aparece no app do MEI ou no Portal do Empreendedor.`
        : `O DAS do MEI é um valor fixo mensal, que muda um pouco conforme a atividade (comércio, serviços ou os dois). Ele já inclui INSS e o imposto estadual ou municipal.\n\nVence todo dia 20. Se cair em fim de semana ou feriado, antecipa. O valor exato aparece no app do MEI ou no Portal do Empreendedor.`,
  },
  {
    id: "g2",
    pergunta: "Qual é o meu limite de faturamento?",
    resposta: (c) => {
      const proporcional = c.limite !== c.limiteCheio;
      const v = V(c);
      return proporcional
        ? `O seu limite este ano é ${fmt(c.limite)}.\n\nEle é menor que o limite cheio (${fmt(c.limiteCheio)}) porque você abriu o MEI no meio do ano — nesse caso a lei calcula proporcional aos meses de atividade.`
        : `O seu limite é ${fmt(c.limite)} por ano.\n\nEsse valor considera tudo que entra pelo CNPJ com ${v.oQueEntra}: dinheiro, Pix, cartão, transferência, com ou sem nota fiscal.`;
    },
  },
  {
    id: "g3",
    pergunta: (c) =>
      ehCaminhoneiro(c) ? "Preciso emitir CT-e em todo frete?" : "Preciso emitir nota fiscal?",
    resposta: (c) =>
      ehCaminhoneiro(c)
        ? `Pra transportar carga de terceiros, o CT-e (Conhecimento de Transporte Eletrônico) é obrigatório. É ele que documenta o frete.\n\nPra emitir, você precisa estar com o RNTRC ativo na ANTT. E atenção: emitir ou não documento não muda o seu limite — o que conta é o valor que você recebeu.`
        : `Pra pessoa física (cliente comum), não é obrigatório — só se ele pedir.\n\nPra empresa (pessoa jurídica), sim, é obrigatório emitir.\n\nMas atenção: emitir ou não nota não muda o seu limite. O que conta é o valor que você recebeu.`,
  },
  {
    id: "g4",
    pergunta: "Que direitos eu tenho pagando o DAS?",
    resposta: () =>
      `O DAS inclui sua contribuição ao INSS, e isso te dá acesso a aposentadoria por idade, auxílio por incapacidade, salário-maternidade e pensão por morte pros dependentes.\n\nCada benefício exige um tempo mínimo de contribuição. Dá pra conferir o seu histórico no app ou site Meu INSS.`,
  },
  {
    id: "g5",
    pergunta: "O que é a declaração anual (DASN)?",
    resposta: () =>
      `É uma declaração simples que todo MEI entrega uma vez por ano, informando quanto faturou no ano anterior.\n\nO prazo é 31 de maio. É gratuita, feita pelo Portal do Simples Nacional, e leva poucos minutos. Entregar em atraso gera multa.`,
  },
  {
    id: "g6",
    pergunta: (c) =>
      ehCaminhoneiro(c) ? "Posso ter um ajudante ou segundo motorista?" : "Posso ter funcionário?",
    resposta: (c) =>
      ehCaminhoneiro(c)
        ? `Sim, mas apenas um — pode ser um ajudante ou um segundo motorista. O salário precisa ser o mínimo ou o piso da categoria.\n\nVocê passa a recolher uma contribuição extra sobre a folha e a ter obrigações trabalhistas. ${RESSALVA}`
        : `Sim, mas apenas um. E o salário precisa ser o mínimo ou o piso da categoria.\n\nVocê passa a recolher uma contribuição extra sobre a folha e a ter obrigações trabalhistas. ${RESSALVA}`,
  },
];

/** Resolve pergunta que pode ser string ou função(ctx) */
export function textoPergunta(item, ctx) {
  return typeof item.pergunta === "function" ? item.pergunta(ctx) : item.pergunta;
}

export function perguntasDaFaixa(faixa) {
  return POR_FAIXA[faixa] || POR_FAIXA.tranquilo;
}

export function perguntasGerais() {
  return GERAIS;
}

export function contextoFaq({ tipoMEI, limite, faturado }) {
  return {
    tipoMEI,
    limite,
    faturado,
    limiteCheio: LIMITES_ANUAIS[tipoMEI],
    teto20: limiteAte20Percent(tipoMEI),
  };
}