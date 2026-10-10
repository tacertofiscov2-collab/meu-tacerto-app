/* CATEGORIAS v2 — marca "repetido" (CATEGORIA_REPETIDO): entrada ou gasto do extrato com o mesmo dia e valor de outro extrato ja guardado entra marcado e a pessoa confirma (antes ficava de fora sozinho) (v1: categorias das entradas ("É faturamento?") e das saídas (gastos), sugestão de categoria pela descrição do extrato e chave para lembrar a categoria por fornecedor */

/* ===================================================================
   CATEGORIAS — REGRAS (escrito em 10/10/2026)

   POR QUE ESTE ARQUIVO
   - A conferencia de entradas ("É faturamento?") e a tela de saidas
     usam as mesmas categorias e a mesma "adivinhacao" pela descricao
     do extrato. Fica tudo aqui, em JavaScript puro (sem React), para
     dar para testar direto no node.

   ENTRADAS: O QUE CONTA COMO FATURAMENTO (decidido pelo Fernando)
   - CONTA: frete, adiantamento e saldo de frete, servico do CNPJ e
     reembolso de despesa (Solucao de Consulta Cosit 72/2020: o
     reembolso entra na receita bruta).
   - NAO CONTA: vale-pedagio (Lei 10.209/2001, art. 2o: quando vem
     destacado, nao faz parte do frete nem e receita), emprestimo,
     estorno/devolucao, rendimento de aplicacao, juros, indenizacao de
     seguro, venda do caminhao, transferencia entre contas proprias e
     Pix da familia.
   - MEI comum nao ve "Vale-pedágio" (so faz sentido para quem roda com
     carga) e ve "É venda/serviço" no lugar de "É frete/serviço".

   SUGESTAO NAS ENTRADAS: SO PARA O "NAO"
   - Regra do app: nada entra no faturamento sem a pessoa confirmar.
     Por isso o app NUNCA sugere "conta": so sugere uma categoria que
     NAO conta, e so quando o texto deixa isso claro (VALE PEDAGIO,
     ESTORNO, EMPRESTIMO, RESGATE CDB...). O resto fica para a pessoa
     responder.
   - "ANTECIPACAO" ficou de fora de proposito: antecipacao de frete e
     faturamento.
   - Se o texto fala de FRETE ou REEMBOLSO, nao sugere nada (ex.:
     "FRETE + PEDAGIO" ou "REEMBOLSO PEDAGIO" tem parte que conta).
     Melhor perguntar do que esconder faturamento.

   SAIDAS (GASTOS)
   - Saidas sao guardadas sozinhas, sem perguntar. A categoria e so
     para organizar; quando o texto nao deixa claro, fica sem sugestao.
   - Quando o texto casa com mais de uma categoria vale esta ordem:
     pneus > pedagio > parcela > DAS > seguro > manutencao > diesel
     (ex.: "AUTO POSTO PNEUS" e pneus, nao diesel; o nome do lugar
     generico, como POSTO, perde para o que foi comprado).
   - "DAS" sozinho e perigoso: "PADARIA DAS FLORES", "MARIA DAS GRACAS"
     e "VENDAS" nao sao imposto. So vale como DAS quando vem com MEI ou
     SIMPLES, com o mes/ano (03/2026, MARCO 2026), no comeco ("DAS -")
     ou logo depois de PAG/PAGAMENTO no fim do texto ("PAG DAS").
   - MEI comum: posto e pedagio viram "Transporte". O resto (material,
     ferramentas) so a pessoa sabe dizer.

   COMO O TEXTO E COMPARADO
   - Tudo em maiusculo, sem acento, so letras/numeros/espaco
     (normalizarTexto). "VALE-PEDÁGIO" vira "VALE PEDAGIO".
   - Compara por PALAVRA inteira ou expressao: "CDC" nao casa dentro de
     outra palavra, "VPO" so sozinho. Nas listas abaixo, palavra com *
     no fim vale como comeco de palavra (COMBUST* pega COMBUSTIVEL e
     COMBUSTIVEIS; PNEU* pega PNEUS e PNEUMATICOS).

   CHAVE DO FORNECEDOR
   - Para lembrar "esse fornecedor e diesel" na proxima vez:
     doc:<digitos> quando tem CPF/CNPJ; senao nome:<nome>; senao a
     descricao limpa (sem numeros, que mudam toda vez, e sem palavras de
     extrato como PIX, COMPRA, CARTAO).
   =================================================================== */

/* ===== Texto ===== */

/* Maiusculo, sem acento, so letras/numeros/espaco, espacos unicos */
export function normalizarTexto(s) {
  return String(s ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .trim();
}

/* Transforma um termo da lista ("COMBUST*", "VALE-PEDAGIO") numa
   expressao que so casa com palavra inteira */
function termoParaRegex(termo) {
  const corpo = String(termo)
    .trim()
    .split(/\s+/)
    .map((palavra) => {
      const comeco = palavra.endsWith("*");
      const base = normalizarTexto(palavra.replace(/\*+$/, ""));
      return comeco ? `${base}[A-Z0-9]*` : base;
    })
    .filter(Boolean)
    .join(" ");
  return new RegExp(`(?:^| )${corpo}(?= |$)`);
}

const compilar = (termos) => termos.map(termoParaRegex);
const casaAlgum = (texto, regexes) => regexes.some((re) => re.test(texto));

/* Tipo de MEI: o mesmo jeito do AppStateContext (padrao MEI) */
function ehCaminhoneiro(tipoMEI) {
  return String(tipoMEI || "MEI").toUpperCase() === "MEI_CAMINHONEIRO";
}

/* ===================================================================
   POSSIVEL REPETIDO (v2 — 10/10/2026, resposta 11 do Fernando)
   "Nao descartar sozinho: mostrar como 'pode ser repetido' e a pessoa
   confirma." Quando um extrato traz uma transacao com o MESMO dia e
   valor de outra que ja veio de outro extrato (o mesmo periodo em
   outro formato, ou duas contas), ela entra com categoria "repetido":
   - entrada: fica pendente e a conferencia pergunta "Pode ser
     repetido" (É repetido = nao conta; ou uma das respostas normais);
   - gasto: fica em duvida e a conferencia dos gastos pergunta igual.
   "repetido" nunca vira regra nem memoria do fornecedor.
   =================================================================== */
export const CATEGORIA_REPETIDO = "repetido";

export function ehRepetido(x) {
  return x?.categoria === CATEGORIA_REPETIDO;
}

/* ===================================================================
   ENTRADAS
   =================================================================== */

export const CATEGORIAS_ENTRADA = Object.freeze([
  Object.freeze({ id: "frete", rotulo: "É frete/serviço", rotuloComum: "É venda/serviço", conta: true }),
  Object.freeze({ id: "reembolso", rotulo: "Reembolso de despesa", conta: true }),
  Object.freeze({ id: "vale_pedagio", rotulo: "Vale-pedágio", conta: false }),
  Object.freeze({ id: "emprestimo", rotulo: "Empréstimo", conta: false }),
  Object.freeze({ id: "estorno", rotulo: "Estorno/devolução", conta: false }),
  Object.freeze({ id: "pessoal", rotulo: "Dinheiro meu/família", conta: false }),
]);

/* Categorias que o MEI comum nao ve */
const SO_CAMINHONEIRO_ENTRADA = new Set(["vale_pedagio"]);

const achaEntrada = (id) => CATEGORIAS_ENTRADA.find((c) => c.id === id) || null;

function rotuloEntradaPara(cat, caminhoneiro) {
  return !caminhoneiro && cat.rotuloComum ? cat.rotuloComum : cat.rotulo;
}

/* Lista para a tela, com o rotulo certo para o tipo de MEI */
export function categoriasEntrada(tipoMEI) {
  const caminhoneiro = ehCaminhoneiro(tipoMEI);
  return CATEGORIAS_ENTRADA.filter((c) => caminhoneiro || !SO_CAMINHONEIRO_ENTRADA.has(c.id)).map((c) => ({
    id: c.id,
    rotulo: rotuloEntradaPara(c, caminhoneiro),
    conta: c.conta,
  }));
}

/* Conta no faturamento? So frete e reembolso. Id desconhecido: nao */
export function entradaConta(categoriaId) {
  const cat = achaEntrada(categoriaId);
  return cat ? cat.conta === true : false;
}

/* Texto da categoria (id desconhecido: texto vazio) */
export function rotuloCategoriaEntrada(id, tipoMEI) {
  const cat = achaEntrada(id);
  return cat ? rotuloEntradaPara(cat, ehCaminhoneiro(tipoMEI)) : "";
}

/* O que deixa claro que NAO e faturamento. A ordem conta: a primeira
   que casar ganha (todas sao "nao conta", entao tanto faz para a conta) */
const TERMOS_ENTRADA = [
  [
    "vale_pedagio",
    compilar(["VALE PEDAGIO", "VALE-PEDAGIO", "VALEPEDAGIO", "VPO", "PEDAGIO"]),
  ],
  [
    "estorno",
    compilar(["ESTORNO", "DEVOLUCAO", "DEVOLVIDO", "DEV PIX", "PIX DEVOLVIDO", "CHARGEBACK", "CANCELAMENTO"]),
  ],
  [
    "emprestimo",
    // Sem "ANTECIPACAO": antecipacao de frete e faturamento
    compilar(["EMPRESTIMO", "CREDITO PESSOAL", "CONSIGNADO", "FINANCIAMENTO", "CDC", "LIBERACAO DE CREDITO"]),
  ],
  [
    "pessoal",
    compilar([
      "RESGATE",
      "RENDIMENTO",
      "RENDIMENTOS",
      "APLICACAO",
      "CDB",
      "POUPANCA",
      "JUROS",
      "TRANSF ENTRE CONTAS",
      "TRANSFERENCIA ENTRE CONTAS",
      "MESMA TITULARIDADE",
      "CASHBACK",
      "SEGURO INDENIZ*",
      "INDENIZ* SEGURO",
      "INDENIZ* DE SEGURO",
    ]),
  ],
];

/* Se o texto fala disso, tem parte que conta: a pessoa responde */
const TRAVA_ENTRADA = compilar(["FRETE*", "REEMBOLS*"]);

/**
 * Sugere a categoria de uma ENTRADA pela descricao do extrato.
 * Devolve o id so quando o texto deixa claro que NAO e faturamento;
 * senao null (a pessoa responde "É faturamento?").
 * tipoMEI e opcional: com "MEI" (comum) nao sugere vale-pedagio.
 */
export function sugerirCategoriaEntrada(descricao, tipoMEI) {
  const texto = normalizarTexto(descricao);
  if (!texto) return null;
  if (casaAlgum(texto, TRAVA_ENTRADA)) return null;
  for (const [id, regexes] of TERMOS_ENTRADA) {
    if (casaAlgum(texto, regexes)) {
      if (tipoMEI !== undefined && !ehCaminhoneiro(tipoMEI) && SO_CAMINHONEIRO_ENTRADA.has(id)) return null;
      return id;
    }
  }
  return null;
}

/* ===================================================================
   SAIDAS
   =================================================================== */

export const CATEGORIAS_SAIDA = Object.freeze({
  MEI_CAMINHONEIRO: Object.freeze([
    Object.freeze({ id: "diesel", rotulo: "Diesel e Arla" }),
    Object.freeze({ id: "pedagio", rotulo: "Pedágio" }),
    Object.freeze({ id: "manutencao", rotulo: "Manutenção e peças" }),
    Object.freeze({ id: "pneus", rotulo: "Pneus" }),
    Object.freeze({ id: "das", rotulo: "DAS e impostos" }),
    Object.freeze({ id: "seguro", rotulo: "Seguro e rastreador" }),
    Object.freeze({ id: "parcela", rotulo: "Parcela do caminhão" }),
    Object.freeze({ id: "outros", rotulo: "Outros" }),
  ]),
  MEI: Object.freeze([
    Object.freeze({ id: "material", rotulo: "Material/mercadoria" }),
    Object.freeze({ id: "ferramentas", rotulo: "Ferramentas" }),
    Object.freeze({ id: "transporte", rotulo: "Transporte" }),
    Object.freeze({ id: "outros", rotulo: "Outros" }),
  ]),
});

/* Lista do tipo de MEI (padrao: MEI comum) */
export function categoriasSaida(tipoMEI) {
  const lista = ehCaminhoneiro(tipoMEI) ? CATEGORIAS_SAIDA.MEI_CAMINHONEIRO : CATEGORIAS_SAIDA.MEI;
  return lista.map((c) => ({ ...c }));
}

/* Texto da categoria: procura primeiro na lista do tipo, depois na
   outra (gasto antigo de quando o tipo era outro); senao "Outros" */
export function rotuloCategoriaSaida(id, tipoMEI) {
  const listas = ehCaminhoneiro(tipoMEI)
    ? [CATEGORIAS_SAIDA.MEI_CAMINHONEIRO, CATEGORIAS_SAIDA.MEI]
    : [CATEGORIAS_SAIDA.MEI, CATEGORIAS_SAIDA.MEI_CAMINHONEIRO];
  for (const lista of listas) {
    const cat = lista.find((c) => c.id === id);
    if (cat) return cat.rotulo;
  }
  return "Outros";
}

/* Palavras de cada categoria do caminhoneiro (DAS tem regra propria) */
const TERMOS_SAIDA = {
  pneus: compilar(["PNEU*", "BORRACHARIA*", "RECAPAGEM", "RECAPADORA", "RECAUCHUT*"]),
  pedagio: compilar([
    "SEM PARAR",
    "SEMPARAR",
    "CONECTCAR",
    "VELOE",
    "MOVE MAIS",
    "MOVEMAIS",
    "TAGGY",
    "PEDAGIO*",
    "ECORODOVIAS",
    "CCR",
    "ARTERIS",
    "AUTOBAN",
    "ECOVIAS",
    "ECOPISTAS",
    "ECOPONTE",
    "VIAOESTE",
    "ENTREVIAS",
  ]),
  parcela: compilar([
    "FINANCIAMENTO*",
    "CONSORCIO*",
    "BANCO VOLKSWAGEN",
    "BANCO MERCEDES*",
    "MERCEDES-BENZ FIN*",
    "SCANIA BANCO",
    "BANCO SCANIA",
    "BANCO VOLVO",
    "BANCO DAF",
    "IVECO CAPITAL",
    "PARCELA CAMINHAO",
    "PARCELA DO CAMINHAO",
  ]),
  das: compilar(["SIMPLES NACIONAL", "PGMEI", "DAS MEI", "DASMEI", "RECEITA FEDERAL", "RECEITA FED", "DARF"]),
  seguro: compilar(["SEGURO*", "SEGURADORA", "RASTREA*", "SASCAR", "OMNILINK", "AUTOTRAC", "ONIXSAT", "POSITRON"]),
  manutencao: compilar([
    "AUTO PECAS",
    "AUTOPECAS",
    "PECAS",
    "OFICINA*",
    "MECANICA*",
    "RETIFICA*",
    "LUBRIFICANTE*",
    "TROCA DE OLEO",
    "TROCA OLEO",
    "ELETRICA AUTOMOTIVA",
    "AUTO ELETRICA",
    "MOLAS",
    "FREIOS",
  ]),
  diesel: compilar([
    "POSTO",
    "POSTOS",
    "AUTO POSTO",
    "COMBUST*",
    "DIESEL",
    "ARLA*",
    "PETROBRAS",
    "IPIRANGA",
    "SHELL",
    "ALE COMBUSTIVEIS",
    "GRAAL",
    "RODOPOSTO*",
  ]),
};

/* Quando casa mais de uma, ganha a primeira desta lista */
const PRIORIDADE_SAIDA = ["pneus", "pedagio", "parcela", "das", "seguro", "manutencao", "diesel"];

/* --- DAS como palavra solta: so com sinal claro de imposto --- */
const MESES =
  "JANEIRO|FEVEREIRO|MARCO|ABRIL|MAIO|JUNHO|JULHO|AGOSTO|SETEMBRO|OUTUBRO|NOVEMBRO|DEZEMBRO|" +
  "JAN|FEV|MAR|ABR|MAI|JUN|JUL|AGO|SET|OUT|NOV|DEZ";
const PAGOU = "PAG|PAGTO|PGTO|PAGAMENTO|PAG DE|PAGTO DE|PAGAMENTO DE|PAGAMENTO DO|BOLETO|GUIA|DEB AUT|DEBITO AUT|DEBITO AUTOMATICO";
const REGRAS_DAS = [
  // DAS + MEI / SIMPLES / CNPJ / competencia
  /(?:^| )DAS (?:DO )?(?:MEI|SIMPLES[A-Z]*|CNPJ|COMPET[A-Z]*)(?= |$)/,
  // DAS + mes/ano em numero: "DAS 03 2026", "DAS 032026", "DAS 2026"
  /(?:^| )DAS (?:\d{1,2} \d{2,4}|\d{4,14})(?= |$)/,
  // DAS + mes por extenso, com ano ou no fim: "DAS MARCO 2026", "DAS MAR 26"
  new RegExp(`(?:^| )DAS (?:${MESES})(?: \\d{2,4})?$|(?:^| )DAS (?:${MESES}) \\d{2,4}(?= |$)`),
  // "PAG DAS", "PAGAMENTO DE DAS" no fim do texto; ou o texto e so "DAS"
  new RegExp(`(?:^|(?:^| )(?:${PAGOU}) )DAS$`),
];
/* "DAS -" / "PAG DAS:" no comeco (olha o texto antes de tirar o traco) */
const DAS_COM_TRACO = new RegExp(`^\\s*(?:(?:${PAGOU})\\s+)?DAS\\s*[-–—:]`);

function pareceDas(descricao, texto) {
  if (REGRAS_DAS.some((re) => re.test(texto))) return true;
  const semAcento = String(descricao ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/\s+/g, " ");
  return DAS_COM_TRACO.test(semAcento);
}

/* MEI comum: so posto e pedagio tem para onde ir */
const SAIDA_MEI_COMUM = { diesel: "transporte", pedagio: "transporte" };

/**
 * Sugere a categoria de uma SAIDA pela descricao do extrato.
 * Devolve o id da lista do tipo de MEI, ou null quando nao da para saber.
 */
export function sugerirCategoriaSaida(descricao, tipoMEI) {
  const texto = normalizarTexto(descricao);
  if (!texto) return null;

  let achou = null;
  for (const id of PRIORIDADE_SAIDA) {
    const casou = casaAlgum(texto, TERMOS_SAIDA[id]) || (id === "das" && pareceDas(descricao, texto));
    if (casou) {
      achou = id;
      break;
    }
  }
  if (!achou) return null;
  if (ehCaminhoneiro(tipoMEI)) return achou;
  return SAIDA_MEI_COMUM[achou] || null;
}

/* ===================================================================
   CHAVE DO FORNECEDOR (para lembrar a categoria da proxima vez)
   =================================================================== */

/* Palavras de extrato que nao dizem quem e o fornecedor */
const RUIDO = new Set([
  "PIX",
  "ENVIADO",
  "ENVIADA",
  "RECEBIDO",
  "RECEBIDA",
  "TED",
  "DOC",
  "COMPRA",
  "NO",
  "DEBITO",
  "DEB",
  "CARTAO",
  "PAGAMENTO",
  "PAG",
  "PAGTO",
  "PGTO",
  "BOLETO",
  "EFETUADO",
  "TRANSFERENCIA",
  "TRANSF",
  "PELO",
  "AG",
  "CC",
  "CONTA",
  "NR",
]);

export function chaveFornecedor(dados) {
  const { documento, nome, descricao } = dados || {};
  const digitos = String(documento ?? "").replace(/\D/g, "");
  if (digitos) return `doc:${digitos}`;

  const nomeLimpo = normalizarTexto(nome);
  if (nomeLimpo) return `nome:${nomeLimpo}`;

  const desc = normalizarTexto(descricao)
    .replace(/[0-9]+/g, " ")
    .split(" ")
    .filter((p) => p && !RUIDO.has(p))
    .join(" ");
  return `desc:${desc || "SEM DESCRICAO"}`;
}
