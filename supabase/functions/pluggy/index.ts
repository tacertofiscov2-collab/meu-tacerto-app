// Edge Function: pluggy
// PLUGGY v5 — tarefa 1: Connect Token | tarefa 2: entradas do ano | tarefa 3: desconectar
// As chaves ficam nos Secrets do Supabase: PLUGGY_CLIENT_ID e PLUGGY_CLIENT_SECRET
// O usuário é descoberto pelo login — nunca aceitar userId vindo de fora.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PLUGGY_API = "https://api.pluggy.ai";

// Trava de segurança contra laço infinito na paginação (500 por página)
const MAX_PAGINAS_POR_CONTA = 50;

// Códigos da Pluggy são UUID. Tudo que vier de fora e for parar num
// endereço da Pluggy precisa ter esse formato.
const FORMATO_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function responder(corpo: unknown, status = 200) {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

// Troca Client ID + Client Secret por uma API Key temporária da Pluggy
// ⚠️ A Pluggy limita pedidos ao /auth e a chave vale 2 horas. Hoje
// pedimos uma por chamada — ok para a validação; guardar em cache
// quando o número de usuários crescer.
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

// Ano atual no horário de Brasília
function anoAtual(): string {
  return new Intl.DateTimeFormat("en", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
  }).format(new Date());
}

// Transação da Pluggy -> formato que o openfinance.js espera
//
// ⚠️ O `id` é a chave da TRAVA DE DUPLICATA no nosso banco.
// O id da Pluggy muda se a mesma conta for conectada duas vezes.
// Por isso, quando o banco manda o código PRÓPRIO da transação
// (`providerId`, presente nas conexões do Open Finance regulado), a
// chave passa a ser banco + conta + código do banco — igual em
// qualquer conexão. Sem `providerId` (ex.: sandbox), fica o id da Pluggy.
// deno-lint-ignore no-explicit-any
function traduzir(t: any, chaveConta: string) {
  const pagador = t.paymentData?.payer ?? {};
  const id = t.providerId ? `of:${chaveConta}:${t.providerId}` : t.id;
  return {
    id,
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
    // avoidDuplicates ajuda, mas NÃO é garantia: no teste de 24/09 a
    // Pluggy criou uma segunda conexão mesmo com ele. A proteção de
    // verdade está na tela (banco repetido) e na chave da tarefa 2.
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
          options: {
            clientUserId: usuario.id,
            avoidDuplicates: true,
          },
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
    // Usa GET /v2/transactions (paginação por cursor): o endereço
    // antigo GET /transactions foi aposentado pela Pluggy (410).
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

      // 1º de janeiro, meia-noite em Brasília (= 03:00 em UTC)
      const ano = anoAtual();
      const desde = `${ano}-01-01`;
      const desdeISO = `${ano}-01-01T03:00:00.000Z`;

      const contas = await pluggyGet(`/accounts?itemId=${conexao.pluggy_item_id}`, apiKey);
      const entradas: unknown[] = [];

      for (const conta of contas.results ?? []) {
        // Cartão de crédito fica de fora — só conta corrente/poupança
        if (conta.type !== "BANK") continue;

        // Identidade estável da conta: banco + número da conta
        const chaveConta = `${item.connector?.id ?? "banco"}:${conta.number ?? conta.id}`;

        let caminho: string | null =
          `/v2/transactions?accountId=${conta.id}&dateFrom=${encodeURIComponent(desdeISO)}`;
        let paginas = 0;

        while (caminho && paginas < MAX_PAGINAS_POR_CONTA) {
          const lote = await pluggyGet(caminho, apiKey);
          paginas++;

          for (const t of lote.results ?? []) {
            // Só entradas, e só as já confirmadas pelo banco
            if (t.type === "CREDIT" && t.status !== "PENDING") {
              entradas.push(traduzir(t, chaveConta));
            }
          }

          // `next` já vem pronto para anexar ao endereço (ex.: "?accountId=...&after=...")
          const next = lote.next;
          caminho = next
            ? `/v2/transactions${String(next).startsWith("?") ? next : `?${next}`}`
            : null;
        }
      }

      return responder({ transacoes: entradas, desde });
    }

    // ---------------------------------------------------------------
    // TAREFA 3: desconectar — apaga a conexão NA PLUGGY
    // Usos: (a) conexão repetida do mesmo banco, que a tela não guarda;
    //       (b) a pessoa desconectar o próprio banco (futuro).
    // Libera a vaga no pacote de 500 conexões.
    // A linha em `conexoes_bancarias`, quando existir, quem apaga é o app.
    // ---------------------------------------------------------------
    if (acao === "desconectar") {
      const itemId = String(corpo?.itemId ?? "");

      if (!FORMATO_UUID.test(itemId)) {
        return responder({ error: "Conexão não informada." }, 400);
      }

      const apiKey = await pegarApiKey();

      // Trava: só apaga conexão criada por este usuário
      const item = await pluggyGet(`/items/${itemId}`, apiKey);

      if (item.clientUserId !== usuario.id) {
        console.error("pluggy desconectar: item de outro usuário", itemId);
        return responder({ error: "Conexão não encontrada." }, 404);
      }

      const resp = await fetch(`${PLUGGY_API}/items/${itemId}`, {
        method: "DELETE",
        headers: { "X-API-KEY": apiKey },
      });

      if (!resp.ok) {
        const detalhe = await resp.text();
        console.error(`pluggy delete item (${resp.status}):`, detalhe);
        return responder({ error: "Não foi possível desconectar agora." }, 502);
      }

      return responder({ ok: true });
    }

    return responder({ error: "Ação desconhecida." }, 400);
  } catch (err) {
    console.error("pluggy:", err);
    return responder({ error: "Erro interno. Tente novamente." }, 500);
  }
});