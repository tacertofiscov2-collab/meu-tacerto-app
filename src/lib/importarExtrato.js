/* IMPORTAREXTRATO v3 — o que tem o mesmo dia e valor de outro extrato ja guardado NAO fica mais de fora sozinho: entra marcado "repetido" e a pessoa confirma na conferencia (resposta 11 do Fernando); o extrato substitui o total do ano digitado quando cobre o ano ate o dia do total e tudo foi conferido (resposta 1) (v2: o mesmo periodo mandado em outro formato (OFX depois CSV) nao conta duas vezes (dia + valor ja guardados); memoria por fornecedor pelos gastos mais recentes; o lancamento das confirmadas le os lancamentos do banco e nao casa com "lancado a mao" se nao conseguir ler as conferidas (v1: o extrato enviado pelo app vai para o banco: OFX/CSV lidos no aparelho, corte do periodo ANTES de guardar, entradas para a conferencia "É faturamento?", saidas com categoria sugerida, nada duplicado; PDF guardado no Storage "em analise"; e o lancamento das entradas confirmadas sem contar duas vezes */
import { supabase } from "@/lib/supabase";
import {
  detectarTipoArquivo, lerArquivoComoTexto, lerExtrato, cortarPeriodo, gerarChaves,
  separarCreditosDebitos, periodoDasTransacoes, textoPeriodo,
} from "@/lib/extrato";
import {
  sugerirCategoriaEntrada, sugerirCategoriaSaida, chaveFornecedor, CATEGORIA_REPETIDO,
} from "@/lib/categorias";
import { erroDeColunaFaltando } from "@/lib/perfil";
import {
  PREFIXO_EXTRATO, separarAjustes, planoDeAbsorcao, lancamentosAMao, casarComLancamentosAMao, diaBR,
  extratoCobreOAno,
} from "@/lib/conciliacao";

/* ===================================================================
   ENVIAR EXTRATO (10/10/2026 — tarefa de 08-10, Etapa 3)

   OFX e CSV (lidos AQUI, sem IA — src/lib/extrato.js):
   1) CORTE DO PERIODO antes de qualquer coisa: so 1º/jan a 31/dez do
      ano atual e, se o MEI abriu este ano, so da abertura em diante. O
      resto e descartado (nao vai para o banco).
   2) Cada transacao ganha a "impressao digital" (chave_unica). Ela vai
      no pluggy_transaction_id como "extrato-<chave>": a trava de sempre
      do banco (user_id + pluggy_transaction_id) recusa a repetida. Por
      isso mandar o mesmo arquivo 2x nao conta 2x — mesmo ANTES do SQL
      de 08-10 (que cria a coluna chave_unica).
   3) Creditos -> tabela `entradas`, status "pendente": a pessoa confirma
      na conferencia ("É faturamento?"). A categoria ja vem sugerida
      quando o texto deixa claro que NAO e faturamento (vale-pedagio,
      estorno, emprestimo, resgate...).
   4) Debitos -> tabela `saidas`, origem "extrato". Categoria: a que a
      pessoa ja deu para o MESMO fornecedor antes; senao a sugerida pela
      descricao (POSTO -> Diesel, SEM PARAR -> Pedagio...). "E do
      negocio": o que a pessoa ja respondeu para o fornecedor; senao SIM
      quando o caminhoneiro tem categoria sugerida; senao fica em branco
      (duvida: a conferencia de saidas pergunta; sem resposta = pessoal).
   5) Um registro em `extratos_enviados` (tipo, periodo, quantidades).

   PDF: guardado no Storage (balde privado "comprovantes", pasta
   <id da pessoa>/extratos/) e registrado como "em_analise". A leitura
   do PDF (por IA) fica para depois; o Fernando acompanha os pendentes.

   SEM O SQL DE 08-10: as colunas novas (categoria, chave_unica,
   do_negocio) e a tabela extratos_enviados nao existem. A gravacao tenta
   com elas e, se o banco recusar por coluna, grava de novo sem elas. O
   PDF sobe do mesmo jeito; so o registro em extratos_enviados fica de
   fora.
   =================================================================== */

const LOTE = 500;
const MAX_PDF_MB = 10;

/* "2026-03-05" -> meio-dia de Brasilia (o dia nunca muda com o fuso) */
const dataDoBanco = (dia) => `${dia}T12:00:00-03:00`;

function tipoDocumento(doc) {
  const d = String(doc || "").replace(/\D/g, "");
  if (d.length === 14) return "CNPJ";
  if (d.length === 11) return "CPF";
  return null;
}

/* Meio do pagamento pela descricao (so para mostrar na conferencia) */
function meioDaDescricao(descricao) {
  const t = String(descricao || "").toUpperCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  if (/\bPIX\b/.test(t)) return "PIX";
  if (/\bTED\b/.test(t)) return "TED";
  if (/\bDOC\b/.test(t)) return "DOC";
  if (/BOLETO/.test(t)) return "BOLETO";
  if (/DEPOSITO/.test(t)) return "DEPOSITO";
  if (/COMPRA|DEBITO|CARTAO/.test(t)) return "CARTAO";
  return null;
}

/* Grava em lotes; se o banco recusar por coluna que ainda nao existe,
   tira as `colunasNovas` e tenta de novo. Devolve quantas ENTRARAM
   (as repetidas sao ignoradas pelo banco) e quantas delas entraram
   marcadas "repetido" (v3). Sem a coluna categoria nao da para marcar:
   a marcada fica de fora, como antes. */
async function gravarSemRepetir(tabela, linhas, colunasNovas) {
  let novas = 0;
  let marcadas = 0;
  let semColunasNovas = false;
  const semMarca = (lote) => lote.filter((l) => l.categoria !== CATEGORIA_REPETIDO).map((l) => tirar(l, colunasNovas));
  for (let i = 0; i < linhas.length; i += LOTE) {
    let lote = linhas.slice(i, i + LOTE);
    if (semColunasNovas) lote = semMarca(lote);
    if (!lote.length) continue;
    let { data, error } = await supabase
      .from(tabela)
      .upsert(lote, { onConflict: "user_id,pluggy_transaction_id", ignoreDuplicates: true })
      .select("id, pluggy_transaction_id");
    if (error && erroDeColunaFaltando(error) && !semColunasNovas) {
      semColunasNovas = true;
      lote = semMarca(lote);
      if (!lote.length) continue;
      ({ data, error } = await supabase
        .from(tabela)
        .upsert(lote, { onConflict: "user_id,pluggy_transaction_id", ignoreDuplicates: true })
        .select("id, pluggy_transaction_id"));
    }
    if (error) throw error;
    novas += data?.length || 0;
    if (!semColunasNovas) {
      const marcadasDoLote = new Set(lote.filter((l) => l.categoria === CATEGORIA_REPETIDO).map((l) => l.pluggy_transaction_id));
      marcadas += (data || []).filter((r) => marcadasDoLote.has(r.pluggy_transaction_id)).length;
    }
  }
  return { novas, marcadas };
}

function tirar(obj, campos) {
  const copia = { ...obj };
  for (const c of campos) delete copia[c];
  return copia;
}

/* O que a pessoa ja respondeu por fornecedor (categoria e "e do
   negocio"), das saidas ja guardadas. Sem a coluna nova: vazio. */
async function memoriaDosFornecedores(userId) {
  const mapa = new Map();
  try {
    /* v2: os mais RECENTES primeiro (o banco devolve no maximo 1000 por
       vez); a primeira resposta de cada fornecedor e a que vale */
    const { data, error } = await supabase
      .from("saidas")
      .select("recebedor_documento, recebedor_nome, descricao, categoria, do_negocio, data")
      .eq("user_id", userId)
      .or("categoria.not.is.null,do_negocio.not.is.null")
      .order("data", { ascending: false })
      .limit(1000);
    if (error) return mapa;
    for (const s of data || []) {
      if (!s.categoria && s.do_negocio == null) continue;
      // v3: "repetido" nao diz nada sobre o fornecedor
      if (s.categoria === CATEGORIA_REPETIDO) continue;
      const chave = chaveFornecedor({ documento: s.recebedor_documento, nome: s.recebedor_nome, descricao: s.descricao });
      if (!mapa.has(chave)) mapa.set(chave, { categoria: s.categoria || null, doNegocio: s.do_negocio ?? null });
    }
  } catch { /* sem rede: sem memoria */ }
  return mapa;
}

/* ===================================================================
   v2 — O MESMO PERIODO EM OUTRO FORMATO (OFX e depois CSV)
   A impressao digital muda de um formato para o outro (o banco escreve
   diferente). Para nao contar duas vezes: conta quantas transacoes do
   extrato JA existem em cada DIA com cada VALOR; do arquivo novo, o que
   passar dessa conta entra normal. Duas transacoes iguais no mesmo dia,
   no mesmo arquivo, continuam duas.
   v3 (resposta 11 do Fernando): o que bate com o que ja existe NAO fica
   mais de fora sozinho (podia ser outra conta de banco com o mesmo
   valor no mesmo dia). Entra marcado "repetido" e a pessoa confirma na
   conferencia ("Pode ser repetido"). O arquivo IDENTICO mandado de novo
   continua nao entrando (a impressao digital e a mesma).
   =================================================================== */
async function jaGuardadasPorDiaEValor(tabela, userId, inicio, fim) {
  const mapa = new Map();
  if (!inicio || !fim) return mapa;
  const PAGINA = 1000;
  for (let de = 0; ; de += PAGINA) {
    const { data, error } = await supabase
      .from(tabela)
      .select("data, valor")
      .eq("user_id", userId)
      .like("pluggy_transaction_id", `${PREFIXO_EXTRATO}%`)
      .gte("data", `${inicio}T00:00:00-03:00`)
      .lte("data", `${fim}T23:59:59-03:00`)
      .range(de, de + PAGINA - 1);
    if (error) throw error;
    for (const r of data || []) {
      const k = `${diaBR(r.data)}|${Math.round((Number(r.valor) || 0) * 100)}`;
      mapa.set(k, (mapa.get(k) || 0) + 1);
    }
    if (!data || data.length < PAGINA) break;
  }
  return mapa;
}

/* v3: marca (repetido: true) o que bate com o que ja existe, pela
   conta de dia+valor acima. Nada sai do arquivo. */
function marcarPossiveisRepetidas(transacoes, jaExistem) {
  const sobra = new Map(jaExistem);
  return transacoes.map((t) => {
    const k = `${t.data}|${Math.round((Number(t.valor) || 0) * 100)}`;
    const n = sobra.get(k) || 0;
    if (n > 0) {
      sobra.set(k, n - 1);
      return { ...t, repetido: true };
    }
    return t;
  });
}

/* Registro do extrato (tabela nova; sem o SQL, fica de fora) */
async function registrarExtrato(linha) {
  try {
    const { error } = await supabase.from("extratos_enviados").insert(linha);
    return !error;
  } catch {
    return false;
  }
}

/**
 * Envia UM arquivo de extrato. Nunca grava nada fora do periodo.
 * perfil: { tipoMEI, mesAbertura, anoAbertura } (do AppState)
 * Devolve:
 *   { tipo: "pdf", guardado: true }
 *   { tipo: "ofx" | "csv", entradasNovas, saidasNovas, lidas, descartadas,
 *     repetidas, possiveisRepetidas (v3: entraram marcadas "repetido"),
 *     periodo: "de jan a out" }
 * Lanca Error com mensagem em portugues quando nao da para ler.
 */
export async function importarExtrato(file, perfil = {}) {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) throw new Error("Entre na sua conta para enviar o extrato.");

  const tipo = detectarTipoArquivo(file?.name, file?.type);
  if (!tipo) throw new Error("Esse arquivo eu não leio. Mande o extrato em OFX, CSV ou PDF.");

  if (tipo === "pdf") return guardarPdf(user.id, file);

  const texto = await lerArquivoComoTexto(file);
  const lido = lerExtrato(texto, tipo);

  const ano = new Date().getFullYear();
  const abriuEsteAno = Number(perfil.anoAbertura) === ano;
  const { dentro, descartadas } = cortarPeriodo(lido.transacoes, {
    ano,
    mesAbertura: abriuEsteAno ? Number(perfil.mesAbertura) : null,
    anoAbertura: abriuEsteAno ? ano : null,
  });

  const comChave = gerarChaves(dentro, { conta: lido.conta || "" });
  const separadas = separarCreditosDebitos(comChave);
  const tipoMEI = perfil.tipoMEI || "MEI";

  /* v2: o que ja veio de outro extrato (mesmo dia e valor), mesmo em
     outro formato. v3: entra marcado "repetido" e a pessoa confirma */
  const periodoArquivo = periodoDasTransacoes(dentro);
  const [entradasJa, saidasJa] = await Promise.all([
    jaGuardadasPorDiaEValor("entradas", user.id, periodoArquivo.inicio, periodoArquivo.fim),
    jaGuardadasPorDiaEValor("saidas", user.id, periodoArquivo.inicio, periodoArquivo.fim),
  ]);
  const creditos = marcarPossiveisRepetidas(separadas.creditos, entradasJa);
  const debitos = marcarPossiveisRepetidas(separadas.debitos, saidasJa);

  const linhasEntradas = creditos.map((t) => ({
    user_id: user.id,
    conexao_id: null,
    pluggy_transaction_id: `${PREFIXO_EXTRATO}${t.chave}`,
    descricao: t.descricao || null,
    valor: Number(t.valor) || 0,
    data: dataDoBanco(t.data),
    pagador_nome: t.nome || "",
    pagador_documento: t.documento || "",
    pagador_tipo: tipoDocumento(t.documento),
    meio: meioDaDescricao(t.descricao),
    status: "pendente",
    categoria: t.repetido ? CATEGORIA_REPETIDO : sugerirCategoriaEntrada(t.descricao, tipoMEI) || null,
    chave_unica: t.chave,
  }));

  const memoria = await memoriaDosFornecedores(user.id);
  const caminhoneiro = tipoMEI === "MEI_CAMINHONEIRO";
  const linhasSaidas = debitos.map((t) => {
    const lembrado = memoria.get(chaveFornecedor({ documento: t.documento, nome: t.nome, descricao: t.descricao }));
    /* v3: o possivel repetido fica em duvida (a pessoa confirma) */
    const categoria = t.repetido ? CATEGORIA_REPETIDO : lembrado?.categoria || sugerirCategoriaSaida(t.descricao, tipoMEI) || null;
    const doNegocio = t.repetido ? null : lembrado?.doNegocio ?? (categoria && caminhoneiro ? true : null);
    return {
      user_id: user.id,
      conexao_id: null,
      pluggy_transaction_id: `${PREFIXO_EXTRATO}${t.chave}`,
      origem: "extrato",
      descricao: t.descricao || null,
      valor: Number(t.valor) || 0,
      data: dataDoBanco(t.data),
      recebedor_nome: t.nome || null,
      recebedor_documento: t.documento || null,
      recebedor_tipo: tipoDocumento(t.documento),
      meio: meioDaDescricao(t.descricao),
      categoria,
      do_negocio: doNegocio,
      chave_unica: t.chave,
    };
  });

  const ent = await gravarSemRepetir("entradas", linhasEntradas, ["categoria", "chave_unica"]);
  const sai = await gravarSemRepetir("saidas", linhasSaidas, ["categoria", "do_negocio", "chave_unica", "com_nota"]);
  const entradasNovas = ent.novas;
  const saidasNovas = sai.novas;

  const periodo = periodoDasTransacoes(dentro);
  await registrarExtrato({
    user_id: user.id,
    tipo,
    status: "lido",
    nome_arquivo: String(file?.name || "").slice(0, 200) || null,
    periodo_inicio: periodo.inicio,
    periodo_fim: periodo.fim,
    qtd_entradas: entradasNovas,
    qtd_saidas: saidasNovas,
  });

  return {
    tipo,
    entradasNovas,
    saidasNovas,
    lidas: comChave.length,
    descartadas: descartadas.length,
    repetidas: separadas.creditos.length + separadas.debitos.length - entradasNovas - saidasNovas,
    possiveisRepetidas: ent.marcadas + sai.marcadas,
    periodo: textoPeriodo(periodo.inicio, periodo.fim),
  };
}

async function guardarPdf(userId, file) {
  if (file.size > MAX_PDF_MB * 1024 * 1024) {
    throw new Error(`Esse PDF é grande demais (máximo ${MAX_PDF_MB} MB).`);
  }
  const nomeSeguro = String(file.name || "extrato.pdf")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .slice(-80);
  const caminho = `${userId}/extratos/${Date.now()}-${nomeSeguro}`;
  const { error } = await supabase.storage
    .from("comprovantes")
    .upload(caminho, file, { contentType: "application/pdf", upsert: false });
  if (error) throw new Error("Não consegui enviar o PDF agora. Tente de novo.");
  await registrarExtrato({
    user_id: userId,
    tipo: "pdf",
    status: "em_analise",
    arquivo_path: caminho,
    nome_arquivo: String(file.name || "").slice(0, 200) || null,
  });
  return { tipo: "pdf", guardado: true };
}

/* ===================================================================
   LANCAR O QUE FOI CONFIRMADO, SEM CONTAR DUAS VEZES
   (regras em src/lib/conciliacao.js)

   Recebe as entradas que ACABARAM de virar "faturamento" (na
   conferencia ou pelas regras de pagador) e:
   - liga cada uma a um lancamento A MAO igual (mesmo valor, ate 3
     dias), se houver: nao cria outro, e grava o lancamento_id na
     entrada (para nao casar de novo);
   - diminui o "Ajuste do total do ano" pelo que ja estava dentro dele
     (recebimento ate a data do ajuste);
   - v3: se o que sobrou do ajuste pode ser trocado pelo extrato
     (extratos cobrindo o ano ate o dia do total e nada sem resposta),
     o ajuste SAI inteiro: o extrato substitui o total digitado;
   - cria o lancamento das outras.
   `app` = funcao que devolve o estado ATUAL do app (useAppState), para
   nao usar uma lista de lancamentos velha.
   Devolve { criados, casados, total, absorvido, substituido } (total =
   soma das que entraram, incluindo as casadas; absorvido = quanto do
   ajuste do total do ano essas entradas "pagaram": ja estavam no total
   digitado; substituido (v3) = o total digitado que saiu porque o
   extrato tomou o lugar dele).
   =================================================================== */
export async function lancarEntradasConfirmadas(userId, efetivas, app) {
  const lista = Array.isArray(efetivas) ? efetivas : [];
  if (!userId || !lista.length) return { criados: 0, casados: 0, total: 0 };
  const estado = typeof app === "function" ? app() : app;

  /* v2: os lancamentos vem do BANCO (o estado do app pode ainda nao ter
     carregado, ex.: o portao do Inicio logo ao abrir). Sem conseguir
     ler, usa o do app. */
  let lancamentos = estado.lancamentos || [];
  try {
    const { data, error } = await supabase
      .from("lancamentos")
      .select("id, descricao, valor, data")
      .eq("user_id", userId);
    if (!error && Array.isArray(data)) lancamentos = data;
  } catch { /* sem rede: fica com o do app */ }

  /* v2: sem conseguir ler as entradas ja conferidas, NAO casa com
     lancamento a mao (poderia confundir um lancamento que veio de outro
     extrato com um lancado a mao e deixar de lancar). */
  let conferidas = null;
  try {
    const { data, error } = await supabase
      .from("entradas")
      .select("id, valor, data, lancamento_id")
      .eq("user_id", userId)
      .eq("status", "faturamento");
    if (!error) conferidas = data || [];
  } catch { /* sem rede: nao casa */ }
  const idsAgora = new Set(lista.map((e) => e.id));

  const candidatos = conferidas
    ? lancamentosAMao(lancamentos, conferidas.filter((e) => !idsAgora.has(e.id)))
    : [];
  const casados = casarComLancamentosAMao(lista, candidatos);
  for (const [entradaId, lanc] of casados) {
    try {
      await supabase.from("entradas").update({ lancamento_id: lanc.id }).eq("id", entradaId).eq("user_id", userId);
    } catch { /* nao e grave: so pode casar de novo depois */ }
  }

  const novas = lista.filter((e) => !casados.has(e.id));
  const { ajustes } = separarAjustes(lancamentos, new Date().getFullYear());
  const plano = planoDeAbsorcao(ajustes, novas);
  const novoValor = new Map(plano.map((p) => [p.id, p.novoValor]));
  const restantes = ajustes
    .map((a) => (novoValor.has(a.id) ? { ...a, valor: novoValor.get(a.id) } : a))
    .filter((a) => (Number(a.valor) || 0) > 0);
  let absorvido = 0;
  let substituido = 0;
  if (restantes.length && (await podeSubstituirOTotal(userId, restantes, estado))) {
    /* v3: o extrato substitui o total digitado — o ajuste sai inteiro */
    substituido = restantes.reduce((s, a) => s + (Number(a.valor) || 0), 0);
    for (const a of ajustes) estado.removerLancamento(a.id);
  } else {
    for (const p of plano) {
      const antes = Number(ajustes.find((a) => a.id === p.id)?.valor) || 0;
      absorvido += Math.max(0, antes - p.novoValor);
      if (p.novoValor > 0) estado.atualizarLancamento(p.id, { valor: p.novoValor });
      else estado.removerLancamento(p.id);
    }
  }

  for (const e of novas) {
    estado.adicionarLancamento({
      descricao: nomeParaDescricaoSimples(e.pagador_nome || e.descricao),
      valor: Number(e.valor) || 0,
      data: e.data,
    });
  }

  const total = lista.reduce((s, e) => s + (Number(e.valor) || 0), 0);
  return {
    criados: novas.length,
    casados: casados.size,
    total,
    absorvido: Math.round(absorvido * 100) / 100,
    substituido: Math.round(substituido * 100) / 100,
  };
}

/* ===================================================================
   v3 — O EXTRATO SUBSTITUI O TOTAL DO ANO (resposta 1 do Fernando)
   Regras em src/lib/conciliacao.js (regra 1). Pode trocar quando:
   - os extratos enviados (OFX/CSV, tabela extratos_enviados) cobrem do
     comeco do ano (ou do mes da abertura do MEI, se abriu este ano) ate
     o dia do total digitado (extratoCobreOAno);
   - nao sobrou entrada do extrato sem resposta ate esse dia.
   Sem conseguir ler, NAO troca (fica o que a pessoa digitou).
   =================================================================== */
async function podeSubstituirOTotal(userId, ajustes, estado) {
  if (!userId || !ajustes?.length) return false;
  const ano = new Date().getFullYear();
  const maisRecente = [...ajustes].sort((a, b) => new Date(b.data) - new Date(a.data))[0];
  const ate = diaBR(maisRecente.data);
  if (!ate) return false;
  const ab = estado?.mesAnoAbertura;
  const mesAb = Number(ab?.mes);
  const inicio = Number(ab?.ano) === ano && mesAb >= 1 && mesAb <= 12
    ? `${ano}-${String(mesAb).padStart(2, "0")}-01`
    : `${ano}-01-01`;
  try {
    const { data: periodos, error } = await supabase
      .from("extratos_enviados")
      .select("periodo_inicio, periodo_fim")
      .eq("user_id", userId)
      .in("tipo", ["ofx", "csv"])
      .gte("periodo_fim", inicio);
    if (error) return false;
    const lista = (periodos || []).map((p) => ({ inicio: p.periodo_inicio, fim: p.periodo_fim }));
    if (!extratoCobreOAno(lista, { inicio, ate })) return false;
    const { count, error: erroPendentes } = await supabase
      .from("entradas")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "pendente")
      .like("pluggy_transaction_id", `${PREFIXO_EXTRATO}%`)
      .gte("data", `${inicio}T00:00:00-03:00`)
      .lte("data", `${ate}T23:59:59-03:00`);
    if (erroPendentes || (count || 0) > 0) return false;
    return true;
  } catch {
    return false;
  }
}

/* v3 — No fim da conferencia, quando NADA novo contou (todas as
   respostas foram "nao conta"), lancarEntradasConfirmadas nao roda; esta
   faz so a troca do total pelo extrato. Devolve o total que saiu (0 =
   nada mudou). `app` = funcao que devolve o estado atual do app. */
export async function substituirTotalPeloExtrato(userId, app) {
  const estado = typeof app === "function" ? app() : app;
  if (!userId || !estado) return 0;
  let lancamentos = estado.lancamentos || [];
  try {
    const { data, error } = await supabase
      .from("lancamentos")
      .select("id, descricao, valor, data")
      .eq("user_id", userId);
    if (!error && Array.isArray(data)) lancamentos = data;
  } catch { /* sem rede: fica com o do app */ }
  const { ajustes } = separarAjustes(lancamentos, new Date().getFullYear());
  const restantes = ajustes.filter((a) => (Number(a.valor) || 0) > 0);
  if (!restantes.length || !(await podeSubstituirOTotal(userId, restantes, estado))) return 0;
  for (const a of ajustes) estado.removerLancamento(a.id);
  return Math.round(restantes.reduce((s, a) => s + (Number(a.valor) || 0), 0) * 100) / 100;
}

/* "TRANSPORTES ALMEIDA LTDA" -> "Transportes Almeida" (igual ao
   nomeParaDescricao do openfinance.js, sem importar de la para nao
   criar volta entre os arquivos) */
function nomeParaDescricaoSimples(nome) {
  if (!nome) return "Recebimento";
  return String(nome)
    .toLowerCase()
    .replace(/\b(ltda|me|epp|eireli|sa|s\/a)\b\.?/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((p) => (p.length <= 2 ? p : p[0].toUpperCase() + p.slice(1)))
    .join(" ")
    .slice(0, 40) || "Recebimento";
}
