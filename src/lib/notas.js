/* NOTAS v1 — notas fiscais lancadas a mao (e, no futuro, as emitidas pelo app) */
import { supabase } from "@/lib/supabase";

/* ===================================================================
   NOTAS FISCAIS (28/09/2026) — tela "Histórico de notas"

   Tabela `notas_fiscais` (SQL de 28/09). Cada nota: numero, data,
   valor, cliente (tomador: nome e CPF/CNPJ), descricao do servico e,
   se a pessoa guardar, o ARQUIVO da nota (PDF ou foto) no balde privado
   `comprovantes`, na pasta da pessoa:
       comprovantes/<user_id>/notas/<codigo>.pdf

   DE ONDE VEM (`origem`)
     - "manual": a pessoa lancou (nota emitida fora do app)
     - no futuro, "app": NFS-e emitida pelo proprio TaCerto
   So as "manual" podem ser apagadas pela tela.

   Foto e reduzida antes de enviar (ate 1600 px, JPG); PDF vai como
   esta; limite de 10 MB.
   =================================================================== */

const BALDE = "comprovantes";
const LIMITE_BYTES = 10 * 1024 * 1024;
const VALIDADE_URL_S = 60 * 60;

function novoCodigo() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
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
    const largura = Math.round(img.width * escala);
    const altura = Math.round(img.height * escala);
    const canvas = document.createElement("canvas");
    canvas.width = largura;
    canvas.height = altura;
    canvas.getContext("2d").drawImage(img, 0, 0, largura, altura);
    URL.revokeObjectURL(endereco);
    const blob = await new Promise((ok) => canvas.toBlob(ok, "image/jpeg", qualidade));
    if (!blob) return arquivo;
    const nomeBase = String(arquivo.name || "nota").replace(/\.[^.]+$/, "");
    return new File([blob], `${nomeBase}.jpg`, { type: "image/jpeg" });
  } catch {
    return arquivo;
  }
}

/* Notas do ano (mais recente primeiro), cada uma com `url` do arquivo
   (vale 1 hora) quando houver. */
export async function listarNotasDoAno(userId, ano) {
  const { data, error } = await supabase
    .from("notas_fiscais")
    .select("*")
    .eq("user_id", userId)
    .gte("data", `${ano}-01-01T00:00:00-03:00`)
    .lt("data", `${ano + 1}-01-01T00:00:00-03:00`)
    .order("data", { ascending: false });
  if (error) throw error;

  const lista = data || [];
  const comArquivo = lista.filter((n) => n.arquivo_path);
  const porCaminho = {};
  if (comArquivo.length) {
    const { data: urls } = await supabase.storage
      .from(BALDE)
      .createSignedUrls(comArquivo.map((n) => n.arquivo_path), VALIDADE_URL_S);
    for (const u of urls || []) if (u?.path) porCaminho[u.path] = u.signedUrl;
  }
  return lista.map((n) => ({ ...n, url: n.arquivo_path ? porCaminho[n.arquivo_path] || null : null }));
}

/* Lanca uma nota (arquivo opcional). */
export async function lancarNota(
  userId,
  { numero, data, valor, tomadorNome, tomadorDocumento, descricao, arquivo },
) {
  let caminho = null;
  let tipo = null;

  if (arquivo) {
    const final = await comprimirImagem(arquivo);
    if (final.size > LIMITE_BYTES) {
      throw new Error("O arquivo passa de 10 MB. Tire uma foto ou escolha um arquivo menor.");
    }
    tipo = final.type || "application/octet-stream";
    const extensao =
      tipo === "application/pdf" ? "pdf" : tipo === "image/png" ? "png" : tipo === "image/webp" ? "webp" : "jpg";
    caminho = `${userId}/notas/${novoCodigo()}.${extensao}`;
    const { error: erroEnvio } = await supabase.storage
      .from(BALDE)
      .upload(caminho, final, { contentType: tipo, upsert: false });
    if (erroEnvio) throw erroEnvio;
  }

  const { data: linha, error } = await supabase
    .from("notas_fiscais")
    .insert({
      user_id: userId,
      origem: "manual",
      numero: numero || null,
      data,
      valor: Number(valor) || 0,
      tomador_nome: tomadorNome || null,
      tomador_documento: String(tomadorDocumento || "").replace(/\D/g, "") || null,
      descricao: descricao || null,
      arquivo_path: caminho,
      arquivo_tipo: tipo,
      nome_arquivo: arquivo?.name || null,
    })
    .select()
    .single();

  if (error) {
    if (caminho) await supabase.storage.from(BALDE).remove([caminho]);
    throw error;
  }

  let url = null;
  if (caminho) {
    const { data: assinado } = await supabase.storage.from(BALDE).createSignedUrl(caminho, VALIDADE_URL_S);
    url = assinado?.signedUrl || null;
  }
  return { ...linha, url };
}

/* Apaga uma nota lancada a mao (e o arquivo, se houver). */
export async function apagarNota(userId, nota) {
  if (!nota?.id) return;
  if (nota.arquivo_path) {
    const { error: erroArquivo } = await supabase.storage.from(BALDE).remove([nota.arquivo_path]);
    if (erroArquivo) throw erroArquivo;
  }
  const { error } = await supabase
    .from("notas_fiscais")
    .delete()
    .eq("id", nota.id)
    .eq("user_id", userId)
    .eq("origem", "manual");
  if (error) throw error;
}