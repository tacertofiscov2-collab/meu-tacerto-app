/* COMPROVANTES v1 — comprovante do "+" (foto ou PDF): guarda o arquivo no balde "comprovantes" (pasta da pessoa), pede a leitura para a funcao ler-comprovante (IA) e guarda o registro ligado ao lancamento; tudo sem lancar erro (sem a funcao ou sem a chave, o app segue no lancamento a mao) */
import { supabase } from "@/lib/supabase";
import { comprimirImagem } from "@/lib/notas";

/* ===================================================================
   COMPROVANTE PELO "+" (12/10/2026 — tarefa de 10-10, Bloco J)

   1) enviarArquivoComprovante: foto reduzida (ate 1600 px, JPG; o mesmo
      jeito das notas) ou PDF, ate 10 MB, em
        comprovantes/<id da pessoa>/comprovantes/<codigo>.<ext>
   2) lerComprovante: chama a funcao do Supabase "ler-comprovante"
      (supabase/functions/ler-comprovante, IA). NUNCA lanca: sem a funcao
      publicada, sem a chave da IA, sem rede ou demorou -> { ok: false }.
      O app entao abre o lancamento a mao com o arquivo anexado.
   3) guardarComprovante: grava a linha em `comprovantes` (tabela de
      28/09) com o que a pessoa CONFIRMOU (nao com o que a IA leu).
   4) ligarComprovanteAoLancamento: comprovantes.lancamento_id (SQL de
      10-10). Antes do SQL a coluna nao existe: fica no aparelho
      (localStorage "tacerto_comprovantes_ligados"), como nas notas.
   =================================================================== */

const BALDE = "comprovantes";
const LIMITE_BYTES = 10 * 1024 * 1024;
const TEMPO_LIMITE_MS = 30000;
const CHAVE_LIGADOS = "tacerto_comprovantes_ligados";

function novoCodigo() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/* Guarda o arquivo. Devolve { caminho, tipo, nome } ou lanca (a tela avisa). */
export async function enviarArquivoComprovante(userId, arquivo) {
  const final = await comprimirImagem(arquivo);
  if (final.size > LIMITE_BYTES) {
    throw new Error("O arquivo passa de 10 MB. Tire uma foto ou escolha um arquivo menor.");
  }
  const tipo = final.type || "application/octet-stream";
  const extensao =
    tipo === "application/pdf" ? "pdf" : tipo === "image/png" ? "png" : tipo === "image/webp" ? "webp" : "jpg";
  const caminho = `${userId}/comprovantes/${novoCodigo()}.${extensao}`;
  const { error } = await supabase.storage.from(BALDE).upload(caminho, final, { contentType: tipo, upsert: false });
  if (error) throw error;
  return { caminho, tipo, nome: arquivo?.name || null };
}

/* Pede a leitura para a IA. Nunca lanca. */
export async function lerComprovante({ caminho, tipo }) {
  try {
    const chamada = supabase.functions.invoke("ler-comprovante", { body: { caminho, tipo } });
    const relogio = new Promise((ok) => setTimeout(() => ok({ data: null, error: { message: "tempo" } }), TEMPO_LIMITE_MS));
    const { data, error } = await Promise.race([chamada, relogio]);
    if (error || !data) return { ok: false, motivo: "indisponivel" };
    if (!data.ok) return { ok: false, motivo: data.motivo || "erro" };
    return data;
  } catch {
    return { ok: false, motivo: "indisponivel" };
  }
}

/* Grava o comprovante (o que a pessoa confirmou). Nunca lanca: devolve a linha ou null. */
export async function guardarComprovante(userId, { caminho, tipo, nome, valor, data, descricao, saidaId = null }) {
  if (!userId || !caminho) return null;
  try {
    const { data: linha, error } = await supabase
      .from("comprovantes")
      .insert({
        user_id: userId,
        saida_id: saidaId,
        origem: "app",
        arquivo_path: caminho,
        arquivo_tipo: tipo || null,
        nome_arquivo: nome || null,
        descricao: descricao || null,
        valor: Number(valor) || null,
        data: data || new Date().toISOString(),
      })
      .select("id")
      .single();
    return error ? null : linha;
  } catch {
    return null;
  }
}

/* Liga o comprovante ao lancamento do velocimetro. Nunca lanca. */
export async function ligarComprovanteAoLancamento(userId, comprovanteId, lancamentoId) {
  if (!comprovanteId || !lancamentoId) return { noBanco: false };
  try {
    const ligados = JSON.parse(localStorage.getItem(CHAVE_LIGADOS) || "{}") || {};
    ligados[comprovanteId] = lancamentoId;
    localStorage.setItem(CHAVE_LIGADOS, JSON.stringify(ligados));
  } catch { /* aparelho sem espaco: segue */ }
  try {
    const { error } = await supabase
      .from("comprovantes")
      .update({ lancamento_id: lancamentoId })
      .eq("id", comprovanteId)
      .eq("user_id", userId);
    return { noBanco: !error };
  } catch {
    return { noBanco: false };
  }
}
