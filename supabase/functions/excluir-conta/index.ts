// EXCLUIR-CONTA v4 — cópia fiel da versão publicada no Supabase (versão 4),
//   baixada em 03/10/2026 só lendo. Só estas linhas de cabeçalho foram
//   acrescentadas; o código abaixo é exatamente o que está no ar.
//   ⚠️ Pendência (HANDOFF Parte 12): antes de apagar o usuário, falta
//   desconectar os bancos na Pluggy e apagar os arquivos do balde
//   "comprovantes" (e a foto no balde "avatares").
import { createClient } from "jsr:@supabase/supabase-js@2";

// Cabeçalhos CORS: liberam o app (no navegador) a chamar esta função.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  // Pré-voo do navegador (CORS): responde OK e encerra.
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1) Pega o token do usuário que está pedindo a exclusão.
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Sem autenticação." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 2) Cliente comum, só para descobrir QUEM é o usuário pelo token.
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const clienteUsuario = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userErr } =
      await clienteUsuario.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(
        JSON.stringify({ error: "Sessão inválida." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const userId = userData.user.id;

    // 3) Cliente ADMIN (service_role) — só existe aqui no servidor.
    //    É ele que tem permissão para apagar o usuário do Auth.
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const clienteAdmin = createClient(supabaseUrl, serviceKey);

    // 4) Apaga o usuário do Auth. O cascade (on delete) apaga
    //    perfil + lançamentos + conversas junto.
    const { error: delErr } =
      await clienteAdmin.auth.admin.deleteUser(userId);

    if (delErr) {
      return new Response(
        JSON.stringify({ error: "Falha ao excluir: " + delErr.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ sucesso: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "Erro inesperado: " + String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
