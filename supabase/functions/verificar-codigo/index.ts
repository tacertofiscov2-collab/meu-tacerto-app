// Edge Function: verificar-codigo
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  try {
    const { telefone, codigo, userId } = await req.json();

    if (!telefone || !codigo) {
      return new Response(
        JSON.stringify({ error: "Telefone e código obrigatórios" }),
        { status: 400, headers: { ...CORS, "Content-Type": "application/json" } },
      );
    }

    const digitos = String(telefone).replace(/\D/g, "");
    const numero = digitos.startsWith("55") ? digitos : `55${digitos}`;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: registro, error: buscarErr } = await supabase
      .from("codigos_wpp")
      .select("id, codigo, tentativas, expira_em")
      .eq("telefone", numero)
      .order("criado_em", { ascending: false })
      .limit(1)
      .single();

    if (buscarErr || !registro) {
      return new Response(
        JSON.stringify({ error: "Código não encontrado. Solicite um novo." }),
        { status: 400, headers: { ...CORS, "Content-Type": "application/json" } },
      );
    }

    if (new Date(registro.expira_em) < new Date()) {
      await supabase.from("codigos_wpp").delete().eq("id", registro.id);
      return new Response(
        JSON.stringify({ error: "Código expirado. Solicite um novo." }),
        { status: 400, headers: { ...CORS, "Content-Type": "application/json" } },
      );
    }

    if (registro.tentativas >= 5) {
      await supabase.from("codigos_wpp").delete().eq("id", registro.id);
      return new Response(
        JSON.stringify({ error: "Muitas tentativas. Solicite um novo código." }),
        { status: 400, headers: { ...CORS, "Content-Type": "application/json" } },
      );
    }

    if (registro.codigo !== String(codigo).trim()) {
      await supabase
        .from("codigos_wpp")
        .update({ tentativas: registro.tentativas + 1 })
        .eq("id", registro.id);
      return new Response(
        JSON.stringify({ error: "Código incorreto. Tente novamente." }),
        { status: 400, headers: { ...CORS, "Content-Type": "application/json" } },
      );
    }

    await supabase.from("codigos_wpp").delete().eq("id", registro.id);

    if (userId) {
      await supabase
        .from("perfis")
        .update({ whatsapp: `+${numero}` })
        .eq("id", userId);
    }

    return new Response(
      JSON.stringify({ ok: true }),
      { status: 200, headers: { ...CORS, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("verificar-codigo:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...CORS, "Content-Type": "application/json" } },
    );
  }
});