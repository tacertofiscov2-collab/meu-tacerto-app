/* PERFIL (lib) v1 — o que o Perfil e o Editar perfil usam juntos: nomes do tipo de MEI, prazo para corrigir o tipo, telefone formatado e gravar no banco (veio do EditarPerfil.jsx) */
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
