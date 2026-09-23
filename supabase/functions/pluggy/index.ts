// Edge Function: pluggy
// PLUGGY v2 — tarefa 1: Connect Token | tarefa 2: buscar as entradas do ano
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

// Leitura na Pluggy (contas, transações, item)
async function pluggyGet(caminho: string, apiKey: string) {
  const resp = await fetch(`${PLUGGY_API}${caminho}`, {
    headers: { "X-API-KEY": apiKey },
  });

  if (!resp.ok) {
    const detalhe = await resp.text();
    throw new Error(`Pluggy GET ${caminho.split("?")[0]} falhou (${resp.status}): ${detalhe}`);
  }

  return await resp.json();
}

// 1º de janeiro do ano atual, no horário de Brasília -> "2026-01-01"
// O limite do MEI é anual, então o velocímetro precisa do ano inteiro.
function inicioDoAno(): string {
  const ano = new Intl.DateTimeFormat("en", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
  }).format(new Date());
  return `${ano}-01-01`;
}

// Transação da Pluggy -> formato que o openfinance.js espera
// deno-lint-ignore no-explicit-any
function traduzir(t: any) {
  const pagador = t.paymentData?.payer ?? {};
  return {
    id: t.id,
    descricao: t.description ?? "",
    valor: Math.abs(Number(t.amount) || 0),
    data: t.date,
    pagadorNome: pagador.name ?? "",
    pagadorDocumento: pagador.documentNumber?.value ?? "",
    meio: t.paymentData?.paymentMethod ?? t.operationType ?? "",
  };
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

    // Cliente "em nome do usuário": respeita as regras de acesso (RLS) do banco
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: dadosUsuario, error: erroUsuario } = await supabase.auth.getUser(token);
    const usuario = dadosUsuario?.user;

    if (erroUsuario || !usuario) {
      return responder({ error: "Sessão inválida. Entre novamente." }, 401);
    }

    // 2. O que ele quer fazer?
    const corpo = await req.json().catch(() => ({}));
    const acao = corpo?.acao;

    // ---------------------------------------------------------------
    // TAREFA 1: gerar o Connect Token (abre a janela de conectar banco)
    // ---------------------------------------------------------------
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

    // ---------------------------------------------------------------
    // TAREFA 2: buscar as entradas do ano de uma conexão
    // Só ENTRADAS (CREDIT). Saídas ficam para o módulo de despesas.
    // ---------------------------------------------------------------
    if (acao === "transacoes") {
      const conexaoId = corpo?.conexaoId;

      if (!conexaoId) {
        return responder({ error: "Conexão não informada." }, 400);
      }

      // Trava 1: a conexão precisa ser deste usuário no nosso banco
      const { data: conexao, error: erroConexao } = await supabase
        .from("conexoes_bancarias")
        .select("pluggy_item_id")
        .eq("id", conexaoId)
        .eq("user_id", usuario.id)
        .maybeSingle();

      if (erroConexao) throw erroConexao;

      if (!conexao?.pluggy_item_id) {
        return responder({ error: "Conexão não encontrada." }, 404);
      }

      const apiKey = await pegarApiKey();

      // Trava 2: na Pluggy, a conexão precisa ter sido criada por este usuário
      const item = await pluggyGet(`/items/${conexao.pluggy_item_id}`, apiKey);

      if (item.clientUserId !== usuario.id) {
        console.error("pluggy: item de outro usuário", conexao.pluggy_item_id);
        return responder({ error: "Conexão não encontrada." }, 404);
      }

      const desde = inicioDoAno();
      const contas = await pluggyGet(`/accounts?itemId=${conexao.pluggy_item_id}`, apiKey);
      const entradas: unknown[] = [];

      for (const conta of contas.results ?? []) {
        // Cartão de crédito fica de fora — só conta corrente/poupança
        if (conta.type !== "BANK") continue;

        let pagina = 1;
        let totalPaginas = 1;

        do {
          const lote = await pluggyGet(
            `/transactions?accountId=${conta.id}&from=${desde}&pageSize=500&page=${pagina}`,
            apiKey,
          );

          for (const t of lote.results ?? []) {
            // Só entradas, e só as já confirmadas pelo banco
            if (t.type === "CREDIT" && t.status !== "PENDING") {
              entradas.push(traduzir(t));
            }
          }

          totalPaginas = lote.totalPages ?? 1;
          pagina++;
        } while (pagina <= totalPaginas);
      }

      return responder({ transacoes: entradas, desde });
    }

    return responder({ error: "Ação desconhecida." }, 400);
  } catch (err) {
    console.error("pluggy:", err);
    return responder({ error: "Erro interno. Tente novamente." }, 500);
  }
});