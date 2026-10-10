/* PERFIL (lib) v2 — campos novos do perfil (CNPJ, atualizacao do velocimetro, lembrete do DAS, nota automatica): ler e gravar SEM QUEBRAR se a coluna ainda nao existir no banco (v1: nomes do tipo de MEI, prazo para corrigir o tipo, telefone formatado e gravar no banco (veio do EditarPerfil.jsx)) */
import { supabase } from "@/lib/supabase";

/* Nome do tipo de MEI como aparece no perfil */
export const LABEL_PERFIL = {
  MEI: "MEI (outras atividades)",
  MEI_CAMINHONEIRO: "MEI Caminhoneiro",
};

/* Dias depois do cadastro em que a pessoa ainda pode corrigir o tipo
   de MEI sozinha ("Escolhi errado no cadastro"). */
export const DIAS_PARA_CORRIGIR_TIPO = 7;

/* Formata enquanto digita: (11) 98765-4321 */
export function formatarTelefone(valor) {
  const d = String(valor).replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/**
 * Grava os campos de perfil na tabela `perfis` do Supabase.
 *
 * Recebe os valores JÁ RESOLVIDOS (não lê do estado do React), porque
 * setState é assíncrono: logo após um setTipo/setAbertura o estado ainda
 * tem o valor antigo. Passando explícito, gravamos o que o usuário
 * acabou de escolher.
 *
 * Só grava os campos presentes no patch (undefined é ignorado; null
 * grava vazio — é assim que a data de abertura é apagada).
 * Silencioso para visitante (sem sessão) — igual ao resto do app.
 */
export async function sincronizarPerfilNoBanco(patch) {
  try {
    const { data } = await supabase.auth.getUser();
    if (!data?.user) return; // visitante: nada a fazer

    const update = { atualizado_em: new Date().toISOString() };
    if (patch.nome !== undefined) update.nome = patch.nome;
    if (patch.tipo !== undefined) update.tipo_mei = patch.tipo;
    if (patch.mesAbertura !== undefined) update.mes_abertura = patch.mesAbertura;
    if (patch.anoAbertura !== undefined) update.ano_abertura = patch.anoAbertura;
    if (patch.whatsapp !== undefined) update.whatsapp = patch.whatsapp;

    await supabase.from("perfis").update(update).eq("id", data.user.id);
  } catch {
    /* falha de rede/visitante — não quebra a tela */
  }
}

/* ===================================================================
   CAMPOS NOVOS DO PERFIL (v2 — 10/10/2026)

   Vieram com o SQL de 08-10 (docs/SQL-PENDENTE-08-10.sql). Enquanto o
   SQL nao roda, as colunas NAO existem no banco e o Supabase recusa
   qualquer leitura ou gravacao que cite uma delas. Por isso:
   - elas sao lidas numa consulta SEPARADA da leitura de sempre (nome,
     tipo, abertura). Se essa falhar, o resto do perfil continua;
   - a gravacao e tolerante: se a coluna nao existe, devolve
     { ok: false, faltaColuna: true } e ninguem quebra. O valor fica
     guardado no aparelho (AppStateContext) e vai para o banco sozinho
     quando o SQL rodar (ver "empurrar" no AppStateContext).

   Nomes no app (camelCase) -> coluna no banco:
   =================================================================== */
export const CAMPOS_PERFIL_NOVOS = {
  cnpj: "cnpj",
  cnae: "cnae",
  cnaesSecundarios: "cnaes_secundarios",
  dataOpcaoMei: "data_opcao_mei",
  cnpjConfirmado: "cnpj_confirmado",
  velocimetroAtualizadoEm: "velocimetro_atualizado_em",
  lembreteDasDias: "lembrete_das_dias",
  lembreteDasHora: "lembrete_das_hora",
  notaAutomaticaAtiva: "nota_automatica_ativa",
};

/* Para o select: "cnpj, cnae, ..." */
export const COLUNAS_PERFIL_NOVAS = Object.values(CAMPOS_PERFIL_NOVOS).join(", ");

/* O erro e de coluna que ainda nao existe?
   - leitura: Postgres 42703 ("column perfis.cnpj does not exist")
   - gravacao: PostgREST PGRST204 ("Could not find the 'cnpj' column") */
export function erroDeColunaFaltando(error) {
  if (!error) return false;
  const codigo = String(error.code || "");
  if (codigo === "42703" || codigo === "PGRST204") return true;
  return /column/i.test(String(error.message || "")) && /(does not exist|could not find)/i.test(String(error.message || ""));
}

/* Linha do banco (snake_case) -> objeto do app (camelCase), so com o
   que veio. */
export function perfilNovoDoBanco(linha) {
  const saida = {};
  if (!linha) return saida;
  for (const [app, coluna] of Object.entries(CAMPOS_PERFIL_NOVOS)) {
    if (coluna in linha) saida[app] = linha[coluna];
  }
  return saida;
}

/**
 * Grava os campos novos do perfil (patch em camelCase, so os presentes).
 * Nunca lanca. Devolve { ok } ou { ok: false, faltaColuna, visitante }.
 */
export async function gravarPerfilNovo(patch = {}) {
  try {
    const { data } = await supabase.auth.getUser();
    if (!data?.user) return { ok: false, visitante: true };

    const update = {};
    for (const [app, coluna] of Object.entries(CAMPOS_PERFIL_NOVOS)) {
      if (patch[app] !== undefined) update[coluna] = patch[app];
    }
    if (Object.keys(update).length === 0) return { ok: true };

    const { error } = await supabase.from("perfis").update(update).eq("id", data.user.id);
    if (error) return { ok: false, faltaColuna: erroDeColunaFaltando(error) };
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
