/* LUCRO v2 — gasto lancado a mao (dinheiro vivo: lancarGastoAMao, ja como gasto do negocio com a categoria) e os GASTOS PESSOAIS do periodo (gastosPessoais, para poder desfazer) (respostas 9 e 12 do Fernando) (v1: "Meu lucro": recebido x gastos do negocio por mes e no ano, gastos por categoria, selo com nota / sem nota, anexar a nota de um gasto e a soma dos gastos com nota para o Imposto de Renda */
import { supabase } from "@/lib/supabase";
import { ehAjuste, PREFIXO_EXTRATO } from "@/lib/conciliacao";
import { categoriasSaida, rotuloCategoriaSaida } from "@/lib/categorias";

/* ===================================================================
   MEU LUCRO — REGRAS (10/10/2026, tarefa de 08-10, Etapa 4)

   RECEBIDO = os lancamentos (o que o velocimetro soma). O "Ajuste do
     total do ano" (total digitado, src/lib/conciliacao.js) NAO tem mes:
     fica fora das contas por mes e entra so no total do ano (como no
     velocimetro). A tela avisa quanto e.
   GASTOS = saidas com do_negocio = true ("e gasto do caminhao"). Sem
     resposta ou "pessoal" NAO entra (regra do produto: na duvida =
     pessoal; nao entra no lucro nem no IR).
   SOBROU = recebido - gastos; % = sobrou / recebido.
   COM NOTA = gasto com foto/PDF anexado (saidas.com_nota). So gasto do
     negocio COM nota ajuda no Imposto de Renda (HANDOFF-08-10).
   Datas: o mes e o ano sao os do horario de Brasilia (as datas do banco
   vem com fuso; new Date(...) no celular brasileiro da o dia certo).

   v2 (10/10/2026, respostas do Fernando):
   - GASTO A MAO (resposta 9): para o que foi pago em dinheiro vivo e
     nao aparece no extrato. Entra ja como gasto do negocio (do_negocio
     = true), com a categoria escolhida, origem "manual". Pode ser
     apagado (so os lancados a mao).
   - GASTOS PESSOAIS (resposta 12): os que NAO contam no lucro, para a
     pessoa poder desfazer: "pessoal" (do_negocio = false, inclusive os
     "repetido") e os sem resposta que nao estao na conferencia (sem
     resposta e fora do extrato). Os sem resposta do extrato ficam na
     linha "X gastos para conferir".
   =================================================================== */

const BALDE = "comprovantes";
const LIMITE_BYTES = 10 * 1024 * 1024;

const mesDe = (iso) => new Date(iso).getMonth() + 1;
const anoDe = (iso) => new Date(iso).getFullYear();
const soma = (lista) => lista.reduce((s, x) => s + (Number(x.valor) || 0), 0);

export function ehGastoDoNegocio(s) {
  return s?.do_negocio === true;
}

const doExtrato = (s) => String(s?.pluggy_transaction_id || "").startsWith(PREFIXO_EXTRATO);

/* v2: nao conta no lucro e nao esta esperando a conferencia */
export function ehGastoPessoal(s) {
  if (s?.do_negocio === false) return true;
  return s?.do_negocio == null && !doExtrato(s);
}

/* v2: lancado a mao (pode ser apagado) */
export function ehGastoAMao(s) {
  return s?.origem === "manual";
}

/* Saidas do ano (paginas de 1000), da mais recente para a mais antiga */
export async function listarSaidasDoAno(userId, ano) {
  const todas = [];
  const PAGINA = 1000;
  for (let inicio = 0; ; inicio += PAGINA) {
    const { data, error } = await supabase
      .from("saidas")
      .select("*")
      .eq("user_id", userId)
      .gte("data", `${ano}-01-01T00:00:00-03:00`)
      .lt("data", `${ano + 1}-01-01T00:00:00-03:00`)
      .order("data", { ascending: false })
      .range(inicio, inicio + PAGINA - 1);
    if (error) throw error;
    todas.push(...(data || []));
    if (!data || data.length < PAGINA) break;
  }
  return todas;
}

/* Gastos por categoria (na ordem da lista do tipo de MEI), so os que
   tem valor. [{ id, rotulo, total, quantidade }] */
export function gastosPorCategoria(saidasDoNegocio, tipoMEI) {
  const mapa = new Map();
  for (const s of saidasDoNegocio) {
    const id = s.categoria || "outros";
    const atual = mapa.get(id) || { id, rotulo: rotuloCategoriaSaida(id, tipoMEI), total: 0, quantidade: 0 };
    atual.total += Number(s.valor) || 0;
    atual.quantidade += 1;
    mapa.set(id, atual);
  }
  const ordem = categoriasSaida(tipoMEI).map((c) => c.id);
  return [...mapa.values()].sort((a, b) => {
    const ia = ordem.indexOf(a.id);
    const ib = ordem.indexOf(b.id);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });
}

function fechamento(recebido, gastos) {
  const sobrou = recebido - gastos;
  return { recebido, gastos, sobrou, pct: recebido > 0 ? (sobrou / recebido) * 100 : null };
}

/* Um mes (1 a 12) */
export function resumoDoMes({ lancamentos = [], saidas = [], ano, mes, tipoMEI }) {
  const rec = lancamentos.filter((l) => !ehAjuste(l) && anoDe(l.data) === ano && mesDe(l.data) === mes);
  const gas = saidas.filter((s) => ehGastoDoNegocio(s) && anoDe(s.data) === ano && mesDe(s.data) === mes);
  return {
    ...fechamento(soma(rec), soma(gas)),
    porCategoria: gastosPorCategoria(gas, tipoMEI),
    gastosDoNegocio: gas,
    gastosPessoais: saidas.filter((s) => ehGastoPessoal(s) && anoDe(s.data) === ano && mesDe(s.data) === mes),
  };
}

/* O ano: totais (com o ajuste do total do ano no recebido) e os 12 meses */
export function resumoDoAno({ lancamentos = [], saidas = [], ano, tipoMEI }) {
  const doAno = lancamentos.filter((l) => anoDe(l.data) === ano);
  const ajustes = doAno.filter(ehAjuste);
  const gas = saidas.filter((s) => ehGastoDoNegocio(s) && anoDe(s.data) === ano);
  const meses = [];
  for (let m = 1; m <= 12; m++) {
    meses.push({
      mes: m,
      recebido: soma(doAno.filter((l) => !ehAjuste(l) && mesDe(l.data) === m)),
      gastos: soma(gas.filter((s) => mesDe(s.data) === m)),
    });
  }
  return {
    ...fechamento(soma(doAno), soma(gas)),
    semMes: soma(ajustes),
    meses,
    porCategoria: gastosPorCategoria(gas, tipoMEI),
    gastosDoNegocio: gas,
    gastosPessoais: saidas.filter((s) => ehGastoPessoal(s) && anoDe(s.data) === ano),
  };
}

/* Tem dado de gasto no ano? (nenhuma saida = nunca mandou extrato) */
export function temDadosDeGastos(saidas = []) {
  return saidas.length > 0;
}

/* Soma dos gastos do NEGOCIO COM NOTA do ano (calculadora do IR) */
export async function somarGastosComNota(userId, ano) {
  const { data, error } = await supabase
    .from("saidas")
    .select("valor")
    .eq("user_id", userId)
    .eq("do_negocio", true)
    .eq("com_nota", true)
    .gte("data", `${ano}-01-01T00:00:00-03:00`)
    .lt("data", `${ano + 1}-01-01T00:00:00-03:00`);
  if (error) throw error;
  return soma(data || []);
}

/* v2: gasto lancado a mao (dinheiro vivo). Ja e do negocio, com a
   categoria escolhida (sem escolher: "outros"). data = "AAAA-MM-DD". */
export async function lancarGastoAMao(userId, { valor, data, descricao, categoria }) {
  const codigo = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const { data: linha, error } = await supabase
    .from("saidas")
    .insert({
      user_id: userId,
      conexao_id: null,
      pluggy_transaction_id: `manual-${codigo}`,
      origem: "manual",
      descricao: descricao || null,
      valor: Number(valor) || 0,
      data: `${data}T12:00:00-03:00`,
      recebedor_nome: null,
      meio: "Dinheiro",
      categoria: categoria || "outros",
      do_negocio: true,
    })
    .select()
    .single();
  if (error) throw error;
  return linha;
}

/* Muda a categoria e/ou "e do negocio" de um gasto */
export async function mudarGasto(userId, id, { categoria, doNegocio } = {}) {
  const patch = {};
  if (categoria !== undefined) patch.categoria = categoria;
  if (doNegocio !== undefined) patch.do_negocio = doNegocio;
  const { error } = await supabase.from("saidas").update(patch).eq("id", id).eq("user_id", userId);
  if (error) throw error;
}

async function comprimirImagem(arquivo, ladoMax = 1600, qualidade = 0.8) {
  if (!arquivo?.type?.startsWith("image/")) return arquivo;
  try {
    const endereco = URL.createObjectURL(arquivo);
    const img = await new Promise((ok, falha) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = falha;
      i.src = endereco;
    });
    const escala = Math.min(1, ladoMax / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * escala);
    canvas.height = Math.round(img.height * escala);
    canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(endereco);
    const blob = await new Promise((ok) => canvas.toBlob(ok, "image/jpeg", qualidade));
    if (!blob) return arquivo;
    return new File([blob], `${String(arquivo.name || "nota").replace(/\.[^.]+$/, "")}.jpg`, { type: "image/jpeg" });
  } catch {
    return arquivo;
  }
}

/* Anexa a nota (foto ou PDF) de um gasto: arquivo no balde privado
   (comprovantes/<user_id>/gastos/...), uma linha em `comprovantes`
   ligada a saida e o selo com_nota = true. */
export async function anexarNotaDoGasto(userId, saida, arquivo) {
  const final = await comprimirImagem(arquivo);
  if (final.size > LIMITE_BYTES) throw new Error("O arquivo passa de 10 MB. Tire uma foto ou escolha um arquivo menor.");
  const tipo = final.type || "application/octet-stream";
  const extensao = tipo === "application/pdf" ? "pdf" : tipo === "image/png" ? "png" : tipo === "image/webp" ? "webp" : "jpg";
  const codigo = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`;
  const caminho = `${userId}/gastos/${codigo}.${extensao}`;
  const { error: erroEnvio } = await supabase.storage.from(BALDE).upload(caminho, final, { contentType: tipo, upsert: false });
  if (erroEnvio) throw new Error("Não consegui enviar o arquivo agora. Tente de novo.");
  const { error } = await supabase.from("comprovantes").insert({
    user_id: userId,
    saida_id: saida.id,
    origem: "manual",
    arquivo_path: caminho,
    arquivo_tipo: tipo,
    nome_arquivo: arquivo?.name || null,
    descricao: saida.descricao || null,
    valor: Number(saida.valor) || 0,
    data: saida.data,
  });
  if (error) {
    await supabase.storage.from(BALDE).remove([caminho]);
    throw new Error("Não consegui guardar a nota agora. Tente de novo.");
  }
  const { error: erroSelo } = await supabase.from("saidas").update({ com_nota: true }).eq("id", saida.id).eq("user_id", userId);
  if (erroSelo) throw new Error("Guardei o arquivo, mas não consegui marcar o gasto. Tente de novo.");
}
