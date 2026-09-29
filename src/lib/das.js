/* DAS v1 — historico de DAS: registros por mes, comprovante (foto/PDF) e pagamento achado nas saidas */
import { supabase } from "@/lib/supabase";

/* ===================================================================
   HISTORICO DE DAS (28/09/2026) — tela /das

   UM REGISTRO POR MES (competencia "AAAA-MM") na tabela
   `das_pagamentos`: valor, data do pagamento, de onde veio e, se a
   pessoa guardou, o COMPROVANTE (foto ou PDF) no balde privado
   `comprovantes`, na pasta da pessoa:
       comprovantes/<user_id>/das/<AAAA-MM>-<codigo>.jpg

   DE ONDE VEM (`origem`)
     - "manual": a pessoa lancou (com ou sem arquivo)
     - "banco": a pessoa confirmou um pagamento que o app ACHOU nas
       saidas do banco (ver acharDasNasSaidas)
     - no futuro, "integracao": busca direto do governo (DAS
       automatizada — a pesquisar)

   O QUE A TELA NAO FAZ: dizer que uma DAS esta "em aberto". So o
   governo sabe o que foi pago (extrato do PGMEI). Sem registro no app
   = "Sem registro", com atalho para conferir no Portal do Simples.

   FOTO FICA LEVE: reduzida para ate 1600 px em JPG antes de enviar.
   PDF vai como esta. Limite de 10 MB.
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
    const nomeBase = String(arquivo.name || "comprovante").replace(/\.[^.]+$/, "");
    return new File([blob], `${nomeBase}.jpg`, { type: "image/jpeg" });
  } catch {
    return arquivo;
  }
}

/* Registros do ano, como mapa "AAAA-MM" -> registro (com `url` do
   comprovante, valida por 1 hora, quando houver arquivo). */
export async function listarDasDoAno(userId, ano) {
  const { data, error } = await supabase
    .from("das_pagamentos")
    .select("*")
    .eq("user_id", userId)
    .like("competencia", `${ano}-%`);
  if (error) throw error;

  const lista = data || [];
  const comArquivo = lista.filter((r) => r.arquivo_path);
  const porCaminho = {};
  if (comArquivo.length) {
    const { data: urls } = await supabase.storage
      .from(BALDE)
      .createSignedUrls(comArquivo.map((r) => r.arquivo_path), VALIDADE_URL_S);
    for (const u of urls || []) if (u?.path) porCaminho[u.path] = u.signedUrl;
  }

  const mapa = {};
  for (const r of lista) {
    mapa[r.competencia] = { ...r, url: r.arquivo_path ? porCaminho[r.arquivo_path] || null : null };
  }
  return mapa;
}

/* Guarda (ou atualiza) o registro de um mes. `arquivo` e opcional; se
   vier e ja existia outro, o antigo e apagado do Storage. */
export async function guardarDas(userId, { competencia, arquivo, valor, pagoEm, origem = "manual", anterior }) {
  let caminho = anterior?.arquivo_path || null;
  let tipo = anterior?.arquivo_tipo || null;
  let nome = anterior?.nome_arquivo || null;

  if (arquivo) {
    const final = await comprimirImagem(arquivo);
    if (final.size > LIMITE_BYTES) {
      throw new Error("O arquivo passa de 10 MB. Tire uma foto ou escolha um arquivo menor.");
    }
    tipo = final.type || "application/octet-stream";
    const extensao =
      tipo === "application/pdf" ? "pdf" : tipo === "image/png" ? "png" : tipo === "image/webp" ? "webp" : "jpg";
    const novoCaminho = `${userId}/das/${competencia}-${novoCodigo()}.${extensao}`;

    const { error: erroEnvio } = await supabase.storage
      .from(BALDE)
      .upload(novoCaminho, final, { contentType: tipo, upsert: false });
    if (erroEnvio) throw erroEnvio;

    // o comprovante antigo sai (so depois do novo estar guardado)
    if (caminho && caminho !== novoCaminho) {
      await supabase.storage.from(BALDE).remove([caminho]);
    }
    caminho = novoCaminho;
    nome = arquivo.name || null;
  }

  const { data: linha, error } = await supabase
    .from("das_pagamentos")
    .upsert(
      {
        user_id: userId,
        competencia,
        valor: valor ? Number(valor) : null,
        pago_em: pagoEm || null,
        origem,
        arquivo_path: caminho,
        arquivo_tipo: tipo,
        nome_arquivo: nome,
        atualizado_em: new Date().toISOString(),
      },
      { onConflict: "user_id,competencia" },
    )
    .select()
    .single();
  if (error) throw error;

  let url = null;
  if (caminho) {
    const { data: assinado } = await supabase.storage.from(BALDE).createSignedUrl(caminho, VALIDADE_URL_S);
    url = assinado?.signedUrl || null;
  }
  return { ...linha, url };
}

/* Apaga o registro do mes (e o comprovante, se houver). */
export async function apagarDas(userId, registro) {
  if (!registro?.id) return;
  if (registro.arquivo_path) {
    const { error: erroArquivo } = await supabase.storage.from(BALDE).remove([registro.arquivo_path]);
    if (erroArquivo) throw erroArquivo;
  }
  const { error } = await supabase
    .from("das_pagamentos")
    .delete()
    .eq("id", registro.id)
    .eq("user_id", userId);
  if (error) throw error;
}

/* ACHAR A DAS NAS SAIDAS DO BANCO
   Procura saidas com cara de DAS. CUIDADO: "das" e palavra comum
   ("POSTO DAS FLORES"), entao "DAS" sozinho so vale no COMECO da
   descricao ou junto de MEI/SIMEI/SIMPLES. Tambem valem "Simples
   Nacional", "SIMEI", "PGMEI" e "Documento de Arrecadação". "Receita
   Federal" so conta se o valor for de DAS (ate R$ 400) — senao pode ser
   outro imposto (DARF).
   A DAS de um mes vence no dia 20 do mes SEGUINTE: um pagamento feito
   em outubro e, quase sempre, a DAS de setembro. E so uma SUGESTAO —
   a pessoa confirma. Devolve mapa "AAAA-MM" -> saida. */
const PARECE_DAS_FORTE =
  /^\s*DAS\b|DAS[- ]?(MEI|SIMEI|SIMPLES)|SIMPLES NACIONAL|\bSIMEI\b|PGMEI|DOCUMENTO DE ARRECADA/i;
const PARECE_DAS_FRACO = /RECEITA FEDERAL/i;
const VALOR_MAX_DAS = 400;

function pareceDas(s) {
  const texto = `${s.descricao || ""} ${s.recebedor_nome || ""}`;
  if (PARECE_DAS_FORTE.test(s.descricao || "") || PARECE_DAS_FORTE.test(s.recebedor_nome || "")) return true;
  return PARECE_DAS_FRACO.test(texto) && Number(s.valor) > 0 && Number(s.valor) <= VALOR_MAX_DAS;
}

export function acharDasNasSaidas(saidas) {
  const achadas = {};
  for (const s of saidas || []) {
    if (!pareceDas(s)) continue;
    const d = new Date(s.data);
    const competencia = new Date(d.getFullYear(), d.getMonth() - 1, 1);
    const chave = `${competencia.getFullYear()}-${String(competencia.getMonth() + 1).padStart(2, "0")}`;
    if (!achadas[chave]) achadas[chave] = s;
  }
  return achadas;
}