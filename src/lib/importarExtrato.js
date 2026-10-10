/* IMPORTAREXTRATO v1 — o extrato enviado pelo app vai para o banco: OFX/CSV lidos no aparelho, corte do periodo ANTES de guardar, entradas para a conferencia "É faturamento?", saidas com categoria sugerida, nada duplicado; PDF guardado no Storage "em analise"; e o lancamento das entradas confirmadas sem contar duas vezes */
import { supabase } from "@/lib/supabase";
import {
  detectarTipoArquivo, lerArquivoComoTexto, lerExtrato, cortarPeriodo, gerarChaves,
  separarCreditosDebitos, periodoDasTransacoes, textoPeriodo,
} from "@/lib/extrato";
import {
  sugerirCategoriaEntrada, sugerirCategoriaSaida, chaveFornecedor,
} from "@/lib/categorias";
import { erroDeColunaFaltando } from "@/lib/perfil";
import {
  PREFIXO_EXTRATO, separarAjustes, planoDeAbsorcao, lancamentosAMao, casarComLancamentosAMao,
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
   (as repetidas sao ignoradas pelo banco). */
async function gravarSemRepetir(tabela, linhas, colunasNovas) {
  let novas = 0;
  let semColunasNovas = false;
  for (let i = 0; i < linhas.length; i += LOTE) {
    let lote = linhas.slice(i, i + LOTE);
    if (semColunasNovas) lote = lote.map((l) => tirar(l, colunasNovas));
    let { data, error } = await supabase
      .from(tabela)
      .upsert(lote, { onConflict: "user_id,pluggy_transaction_id", ignoreDuplicates: true })
      .select("id");
    if (error && erroDeColunaFaltando(error) && !semColunasNovas) {
      semColunasNovas = true;
      ({ data, error } = await supabase
        .from(tabela)
        .upsert(lote.map((l) => tirar(l, colunasNovas)), { onConflict: "user_id,pluggy_transaction_id", ignoreDuplicates: true })
        .select("id"));
    }
    if (error) throw error;
    novas += data?.length || 0;
  }
  return novas;
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
    const { data, error } = await supabase
      .from("saidas")
      .select("recebedor_documento, recebedor_nome, descricao, categoria, do_negocio, data")
      .eq("user_id", userId)
      .order("data", { ascending: true });
    if (error) return mapa;
    for (const s of data || []) {
      if (!s.categoria && s.do_negocio == null) continue;
      const chave = chaveFornecedor({ documento: s.recebedor_documento, nome: s.recebedor_nome, descricao: s.descricao });
      mapa.set(chave, { categoria: s.categoria || null, doNegocio: s.do_negocio ?? null });
    }
  } catch { /* sem rede: sem memoria */ }
  return mapa;
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
 *     repetidas, periodo: "de jan a out" }
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
  const { creditos, debitos } = separarCreditosDebitos(comChave);
  const tipoMEI = perfil.tipoMEI || "MEI";

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
    categoria: sugerirCategoriaEntrada(t.descricao, tipoMEI) || null,
    chave_unica: t.chave,
  }));

  const memoria = await memoriaDosFornecedores(user.id);
  const caminhoneiro = tipoMEI === "MEI_CAMINHONEIRO";
  const linhasSaidas = debitos.map((t) => {
    const lembrado = memoria.get(chaveFornecedor({ documento: t.documento, nome: t.nome, descricao: t.descricao }));
    const categoria = lembrado?.categoria || sugerirCategoriaSaida(t.descricao, tipoMEI) || null;
    const doNegocio = lembrado?.doNegocio ?? (categoria && caminhoneiro ? true : null);
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

  const entradasNovas = await gravarSemRepetir("entradas", linhasEntradas, ["categoria", "chave_unica"]);
  const saidasNovas = await gravarSemRepetir("saidas", linhasSaidas, ["categoria", "do_negocio", "chave_unica", "com_nota"]);

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
    repetidas: creditos.length + debitos.length - entradasNovas - saidasNovas,
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
   - cria o lancamento das outras.
   `app` = funcao que devolve o estado ATUAL do app (useAppState), para
   nao usar uma lista de lancamentos velha.
   Devolve { criados, casados, total } (total = soma das que entraram,
   incluindo as casadas).
   =================================================================== */
export async function lancarEntradasConfirmadas(userId, efetivas, app) {
  const lista = Array.isArray(efetivas) ? efetivas : [];
  if (!userId || !lista.length) return { criados: 0, casados: 0, total: 0 };
  const estado = typeof app === "function" ? app() : app;

  let conferidas = [];
  try {
    const { data } = await supabase
      .from("entradas")
      .select("id, valor, data, lancamento_id")
      .eq("user_id", userId)
      .eq("status", "faturamento");
    conferidas = data || [];
  } catch { /* sem rede: casa so pelo que tem */ }
  const idsAgora = new Set(lista.map((e) => e.id));
  conferidas = conferidas.filter((e) => !idsAgora.has(e.id));

  const candidatos = lancamentosAMao(estado.lancamentos || [], conferidas);
  const casados = casarComLancamentosAMao(lista, candidatos);
  for (const [entradaId, lanc] of casados) {
    try {
      await supabase.from("entradas").update({ lancamento_id: lanc.id }).eq("id", entradaId).eq("user_id", userId);
    } catch { /* nao e grave: so pode casar de novo depois */ }
  }

  const novas = lista.filter((e) => !casados.has(e.id));
  const { ajustes } = separarAjustes(estado.lancamentos || [], new Date().getFullYear());
  for (const p of planoDeAbsorcao(ajustes, novas)) {
    if (p.novoValor > 0) estado.atualizarLancamento(p.id, { valor: p.novoValor });
    else estado.removerLancamento(p.id);
  }

  for (const e of novas) {
    estado.adicionarLancamento({
      descricao: nomeParaDescricaoSimples(e.pagador_nome || e.descricao),
      valor: Number(e.valor) || 0,
      data: e.data,
    });
  }

  const total = lista.reduce((s, e) => s + (Number(e.valor) || 0), 0);
  return { criados: novas.length, casados: casados.size, total };
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
