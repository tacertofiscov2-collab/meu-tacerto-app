// Edge Function: enviar-codigo
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
    const { telefone } = await req.json();

    if (!telefone) {
      return new Response(
        JSON.stringify({ error: "Telefone obrigatório" }),
        { status: 400, headers: { ...CORS, "Content-Type": "application/json" } },
      );
    }

    const digitos = String(telefone).replace(/\D/g, "");
    const numero = digitos.startsWith("55") ? digitos : `55${digitos}`;

    if (numero.length < 12 || numero.length > 13) {
      return new Response(
        JSON.stringify({ error: "Número de WhatsApp inválido" }),
        { status: 400, headers: { ...CORS, "Content-Type": "application/json" } },
      );
    }

    const codigo = String(Math.floor(100000 + Math.random() * 900000));

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    await supabase.from("codigos_wpp").delete().eq("telefone", numero);

    const { error: dbError } = await supabase.from("codigos_wpp").insert({
      telefone: numero,
      codigo,
      expira_em: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    });

    if (dbError) throw new Error(`Erro ao salvar código: ${dbError.message}`);

    const zapiInstanceId = Deno.env.get("ZAPI_INSTANCE_ID")!;
    const zapiToken = Deno.env.get("ZAPI_TOKEN")!;
    const zapiClientToken = Deno.env.get("ZAPI_CLIENT_TOKEN")!;
    const zapiUrl = `https://api.z-api.io/instances/${zapiInstanceId}/token/${zapiToken}/send-text`;

    const mensagem = `🔐 *TaCerto!*\n\nSeu código de verificação é:\n\n*${codigo}*\n\nEle expira em 10 minutos. Não compartilhe com ninguém.`;

    const zapiRes = await fetch(zapiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Client-Token": zapiClientToken,
      },
      body: JSON.stringify({ phone: numero, message: mensagem }),
    });

    if (!zapiRes.ok) {
      const zapiErr = await zapiRes.text();
      throw new Error(`Z-API erro: ${zapiErr}`);
    }

    return new Response(
      JSON.stringify({ ok: true }),
      { status: 200, headers: { ...CORS, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("enviar-codigo:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...CORS, "Content-Type": "application/json" } },
    );
  }
});