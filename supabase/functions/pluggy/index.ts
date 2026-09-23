// Edge Function: pluggy
// PLUGGY v1 — tarefa 1: gerar o Connect Token (abre a janela de conectar banco)
// As chaves ficam nos Secrets do Supabase: PLUGGY_CLIENT_ID e PLUGGY_CLIENT_SECRET
// O usuário é descoberto pelo login — nunca aceitar userId vindo de fora.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PLUGGY_API = "https://api.pluggy.ai";

function responder(corpo: unknown, status = 200) {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

// Troca Client ID + Client Secret por uma API Key temporária da Pluggy
async function pegarApiKey(): Promise<string> {
  const resp = await fetch(`${PLUGGY_API}/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      clientId: Deno.env.get("PLUGGY_CLIENT_ID"),
      clientSecret: Deno.env.get("PLUGGY_CLIENT_SECRET"),
    }),
  });

  if (!resp.ok) {
    const detalhe = await resp.text();
    throw new Error(`Pluggy /auth falhou (${resp.status}): ${detalhe}`);
  }

  const { apiKey } = await resp.json();
  return apiKey;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  try {
    // 1. Quem está chamando? Descobre pelo login, não pelo que vem no pedido.
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");

    if (!token) {
      return responder({ error: "Não autenticado." }, 401);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
    );

    const { data: dadosUsuario, error: erroUsuario } = await supabase.auth.getUser(token);
    const usuario = dadosUsuario?.user;

    if (erroUsuario || !usuario) {
      return responder({ error: "Sessão inválida. Entre novamente." }, 401);
    }

    // 2. O que ele quer fazer?
    const corpo = await req.json().catch(() => ({}));
    const acao = corpo?.acao;

    // Tarefa 1: gerar o Connect Token
    if (acao === "token") {
      const apiKey = await pegarApiKey();

      const resp = await fetch(`${PLUGGY_API}/connect_token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": apiKey,
        },
        body: JSON.stringify({
          options: { clientUserId: usuario.id },
        }),
      });

      if (!resp.ok) {
        const detalhe = await resp.text();
        console.error(`pluggy connect_token (${resp.status}):`, detalhe);
        return responder({ error: "Não foi possível iniciar a conexão com o banco." }, 502);
      }

      const { accessToken } = await resp.json();
      return responder({ accessToken });
    }

    // Tarefa 2 (transações) entra aqui depois
    return responder({ error: "Ação desconhecida." }, 400);
  } catch (err) {
    console.error("pluggy:", err);
    return responder({ error: "Erro interno. Tente novamente." }, 500);
  }
});