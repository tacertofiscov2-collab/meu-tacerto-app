// Edge Function: pluggy
// PLUGGY v7 — caminho B: bancos | criar | status | diagnostico (TEMPORARIO)  +  token | transacoes | desconectar
// As chaves ficam nos Secrets do Supabase: PLUGGY_CLIENT_ID e PLUGGY_CLIENT_SECRET
// O usuário é descoberto pelo login — nunca aceitar userId vindo de fora.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PLUGGY_API = "https://api.pluggy.ai";

// SANDBOX: true mostra o banco de teste da Pluggy na lista. Produção: false.
const INCLUIR_SANDBOX = true;

// Para onde o banco devolve a pessoa depois de autorizar. A Pluggy exige
// https e NÃO aceita localhost — por isso é o endereço da Vercel.
// A Pluggy acrescenta ?itemId=... no fim.
const OAUTH_RETORNO = "https://meu-tacerto-app-alpha.vercel.app/conectar-banco/retorno";

// Pedimos só o que o app usa. ⚠️ No teste de 24/09 a Pluggy coletou
// investimentos, identidade e empréstimos mesmo assim — no Open Finance
// o consentimento parece ser o pacote completo. Nós só LEMOS e GUARDAMOS
// as entradas; o resto fica na Pluggy e nunca passa pelo app.
const PRODUTOS = ["ACCOUNTS", "TRANSACTIONS"];

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

// Troca Client ID + Client Secret por uma API Key da Pluggy.
// A chave vale 2 horas e a Pluggy limita pedidos ao /auth. Enquanto esta
// função estiver "acordada", a mesma chave é reaproveitada por até 100
// minutos — importante porque a tela pergunta o status a cada poucos
// segundos enquanto a pessoa está no banco.
let chaveEmCache: { valor: string; validaAte: number } | null = null;

async function pegarApiKey(): Promise<string> {
  if (chaveEmCache && Date.now() < chaveEmCache.validaAte) {
    return chaveEmCache.valor;
  }

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
  chaveEmCache = { valor: apiKey, validaAte: Date.now() + 100 * 60 * 1000 };
  return apiKey;
}

// Leitura na Pluggy (contas, transações, item, bancos)
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

// Cor do banco: a Pluggy às vezes manda com "#", às vezes sem
function corComCerquilha(cor: unknown): string | null {
  if (typeof cor !== "string" || !cor) return null;
  return cor.startsWith("#") ? cor : `#${cor}`;
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
    // BANCOS: lista os bancos do Open Finance para a NOSSA tela de escolha
    // Só bancos (PF e PJ) do Open Finance regulado. Os logos são
    // hospedados pela própria Pluggy.
    // ---------------------------------------------------------------
    if (acao === "bancos") {
      const apiKey = await pegarApiKey();
      const lista = await pluggyGet(
        `/connectors?countries=BR${INCLUIR_SANDBOX ? "&sandbox=true" : ""}`,
        apiKey,
      );

      const bancos = (lista.results ?? [])
        // deno-lint-ignore no-explicit-any
        .filter((c: any) => c.isOpenFinance === true)
        // deno-lint-ignore no-explicit-any
        .filter((c: any) => c.type === "PERSONAL_BANK" || c.type === "BUSINESS_BANK")
        // deno-lint-ignore no-explicit-any
        .filter((c: any) => INCLUIR_SANDBOX || c.isSandbox !== true)
        // deno-lint-ignore no-explicit-any
        .map((c: any) => {
          // deno-lint-ignore no-explicit-any
          const campos = (c.credentials ?? []).map((k: any) => k.name);
          const pedeCnpj = campos.includes("cnpj") || c.type === "BUSINESS_BANK";
          return {
            id: c.id,
            nome: c.name,
            logo: c.imageUrl ?? null,
            cor: corComCerquilha(c.primaryColor),
            tipo: c.type === "BUSINESS_BANK" ? "PJ" : "PF",
            documento: pedeCnpj ? "cnpj" : "cpf",
            sandbox: c.isSandbox === true,
            online: c.health?.status !== "OFFLINE",
          };
        })
        // Banco de teste primeiro; o resto em ordem alfabética
        // deno-lint-ignore no-explicit-any
        .sort((a: any, b: any) =>
          a.sandbox === b.sandbox ? a.nome.localeCompare(b.nome, "pt-BR") : a.sandbox ? -1 : 1
        );

      return responder({ bancos });
    }

    // ---------------------------------------------------------------
    // CRIAR: abre a conexão no banco escolhido, com o CPF ou CNPJ
    // ⚠️ O documento NÃO é guardado nem vai para o log: passa direto
    //    para a Pluggy, que precisa dele para o Open Finance.
    // Devolve só o itemId. O link do banco vem pela tarefa STATUS.
    // ---------------------------------------------------------------
    if (acao === "criar") {
      const connectorId = Number(corpo?.connectorId);
      const documento = String(corpo?.documento ?? "").replace(/\D/g, "");

      if (!Number.isInteger(connectorId) || connectorId <= 0) {
        return responder({ error: "Banco não informado." }, 400);
      }
      if (documento.length !== 11 && documento.length !== 14) {
        return responder({ error: "Confira o CPF ou CNPJ." }, 400);
      }

      const apiKey = await pegarApiKey();
      const conector = await pluggyGet(`/connectors/${connectorId}`, apiKey);

      if (conector?.isOpenFinance !== true || (conector.isSandbox && !INCLUIR_SANDBOX)) {
        return responder({ error: "Esse banco não está disponível." }, 400);
      }

      // O nome exato do campo vem do próprio banco (cpf ou cnpj)
      // deno-lint-ignore no-explicit-any
      const campos = (conector.credentials ?? []).map((k: any) => k.name);
      const campo =
        campos.find((n: string) => n === "cpf" || n === "cnpj") ??
        (conector.type === "BUSINESS_BANK" ? "cnpj" : "cpf");

      if (campo === "cpf" && documento.length !== 11) {
        return responder({ error: "Essa é uma conta pessoal: use o CPF." }, 400);
      }
      if (campo === "cnpj" && documento.length !== 14) {
        return responder({ error: "Essa é uma conta de empresa: use o CNPJ." }, 400);
      }

      const resp = await fetch(`${PLUGGY_API}/items`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": apiKey,
        },
        body: JSON.stringify({
          connectorId,
          parameters: { [campo]: documento },
          clientUserId: usuario.id,
          oauthRedirectUri: OAUTH_RETORNO,
          products: PRODUTOS,
        }),
      });

      if (!resp.ok) {
        // Só a mensagem da Pluggy vai para o log — nunca o corpo do
        // pedido, que tem o documento.
        let mensagem = "";
        try {
          mensagem = (await resp.json())?.message ?? "";
        } catch {
          /* sem corpo legível */
        }
        console.error(`pluggy criar item (${resp.status}):`, mensagem);
        return responder({ error: "Não foi possível iniciar a conexão com esse banco." }, 502);
      }

      const item = await resp.json();
      return responder({ itemId: item.id });
    }

    // ---------------------------------------------------------------
    // STATUS: como está a conexão? Devolve o link do banco quando ele
    // fica pronto e, depois, se deu certo.
    // Trava: só responde sobre conexão criada por este usuário.
    // ---------------------------------------------------------------
    if (acao === "status") {
      const itemId = String(corpo?.itemId ?? "");

      if (!FORMATO_UUID.test(itemId)) {
        return responder({ error: "Conexão não informada." }, 400);
      }

      const apiKey = await pegarApiKey();
      const item = await pluggyGet(`/items/${itemId}`, apiKey);

      if (item.clientUserId !== usuario.id) {
        console.error("pluggy status: item de outro usuário", itemId);
        return responder({ error: "Conexão não encontrada." }, 404);
      }

      // O link do banco vem no `parameter` quando o item espera a pessoa
      const p = item.parameter;
      const urlBanco =
        p && typeof p.data === "string" && p.data.startsWith("https://")
          ? p.data
          : typeof item.userAction?.url === "string"
          ? item.userAction.url
          : null;

      return responder({
        status: item.status ?? null,
        execucao: item.executionStatus ?? null,
        banco: item.connector?.name ?? "",
        urlBanco,
        expiraEm: p?.expiresAt ?? null,
        erro: item.error?.code ?? null,
      });
    }

    // ---------------------------------------------------------------
    // DIAGNOSTICO — ⚠️ TEMPORÁRIO, REMOVER depois do teste de 24/09
    // Mostra o que a Pluggy tem para uma conexão: o resultado de cada
    // parte da coleta, as contas e um resumo das transações SEM filtro
    // de data. Mesma trava de dono das outras tarefas.
    // ---------------------------------------------------------------
    if (acao === "diagnostico") {
      const itemId = String(corpo?.itemId ?? "");

      if (!FORMATO_UUID.test(itemId)) {
        return responder({ error: "Conexão não informada." }, 400);
      }

      const apiKey = await pegarApiKey();
      const item = await pluggyGet(`/items/${itemId}`, apiKey);

      if (item.clientUserId !== usuario.id) {
        return responder({ error: "Conexão não encontrada." }, 404);
      }

      const contas = await pluggyGet(`/accounts?itemId=${itemId}`, apiKey);
      const resumoContas: unknown[] = [];

      for (const conta of contas.results ?? []) {
        const numero = String(conta.number ?? "");
        const base = {
          tipo: conta.type,
          subtipo: conta.subtype,
          nome: conta.name ?? conta.marketingName ?? "",
          final: numero ? numero.slice(-4) : "",
        };

        if (conta.type !== "BANK") {
          resumoContas.push(base);
          continue;
        }

        // Primeira página, SEM filtro de data
        const lote = await pluggyGet(`/v2/transactions?accountId=${conta.id}`, apiKey);
        // deno-lint-ignore no-explicit-any
        const lista: any[] = lote.results ?? [];
        const datas = lista.map((t) => String(t.date ?? "")).filter(Boolean).sort();

        resumoContas.push({
          ...base,
          transacoesNaPrimeiraPagina: lista.length,
          temMaisPaginas: Boolean(lote.next),
          entradas: lista.filter((t) => t.type === "CREDIT").length,
          saidas: lista.filter((t) => t.type === "DEBIT").length,
          pendentes: lista.filter((t) => t.status === "PENDING").length,
          maisAntiga: datas[0] ?? null,
          maisRecente: datas[datas.length - 1] ?? null,
          comProviderId: lista.filter((t) => t.providerId).length,
          comPagador: lista.filter((t) => t.paymentData?.payer?.name).length,
          exemplos: lista.slice(0, 3).map((t) => ({
            data: t.date,
            tipo: t.type,
            valor: t.amount,
            status: t.status,
            descricao: String(t.description ?? "").slice(0, 40),
          })),
        });
      }

      return responder({
        status: item.status,
        execucao: item.executionStatus,
        partes: item.statusDetail ?? null,
        erro: item.error ?? null,
        contas: resumoContas,
      });
    }

    // ---------------------------------------------------------------
    // TAREFA 1: gerar o Connect Token (widget da Pluggy)
    // No caminho B a conexão não usa mais o widget; fica aqui até as
    // telas novas substituírem a ConectarBanco atual.
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
    //       (b) a pessoa desconectar o próprio banco.
    // Libera a vaga no pacote de 500 conexões.
    // A linha em `conexoes_bancarias`, quando existir, quem trata é o app.
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