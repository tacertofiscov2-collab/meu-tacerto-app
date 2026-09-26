/* OPENFINANCE v5 — descartarConexaoNova e contarPendentesDaConexao (tela de retorno do banco) */
import { supabase } from "@/lib/supabase";

/* ===================================================================
   OPEN FINANCE — a camada que traz o que caiu na conta

   COMO ESTE ARQUIVO FUNCIONA HOJE (24/09/2026)
   Com PLUGGY_ATIVO = true, `buscarTransacoes` chama a Edge Function
   `pluggy` (supabase/functions/pluggy), que busca na Pluggy as
   ENTRADAS desde 1º de janeiro e devolve no mesmo formato de
   TRANSACOES_FALSAS. A chave da Pluggy fica no servidor, nunca aqui.
   Hoje a conta Pluggy esta no SANDBOX (gratis e sem prazo): os bancos
   sao de teste.

   Com PLUGGY_ATIVO = false volta aos dados FALSOS — de proposito
   bagunçados, do jeito que extrato real vem. Util para mexer em tela
   sem depender da Pluggy.

   Todo o resto — classificacao, regras, gravacao — nao depende de
   onde a lista vem.

   O CAMINHO DE UMA ENTRADA
     1. cai na conta          -> tabela `entradas`, status 'pendente'
     2. o Fisco pergunta      -> "isso é faturamento?"
     3. o usuario responde    -> status 'faturamento' ou 'ignorada'
     4. se for faturamento    -> vira registro em `lancamentos`
     5. o velocimetro         -> nao muda nada. Para ele, lançamento
                                 é lançamento, venha de onde vier.

   NADA ENTRA NO VELOCIMETRO SEM O USUARIO CONFIRMAR.
   Presente nao é receita. Transferencia entre contas proprias nao é.
   Emprestimo devolvido nao é. Conta misturada PF/PJ é a regra no
   publico do app — se somar tudo, o velocimetro mente.
   =================================================================== */

/* true  = fala com a Pluggy de verdade (via Edge Function `pluggy`).
   false = devolve os dados falsos abaixo. */
export const PLUGGY_ATIVO = true;

/* -------------------------------------------------------------------
   DADOS FALSOS

   Feitos de proposito PIORES que os de um sandbox: nome do pagador em
   caixa alta com abreviacao, o mesmo pagador escrito de tres jeitos,
   descricao com codigo do banco no meio, valor quebrado.

   Se a classificacao funcionar com isto, aguenta extrato de verdade.
   ------------------------------------------------------------------- */
const TRANSACOES_FALSAS = [
  {
    id: "tx-001",
    descricao: "PIX RECEBIDO TRANSPORTES ALMEIDA LTDA",
    valor: 1850.0,
    data: diasAtras(0, 14, 32),
    pagadorNome: "TRANSPORTES ALMEIDA LTDA",
    pagadorDocumento: "12345678000190",
    meio: "PIX",
  },
  {
    id: "tx-002",
    descricao: "PIX REC MARIA S FARIA",
    valor: 200.0,
    data: diasAtras(0, 19, 4),
    pagadorNome: "MARIA S FARIA",
    pagadorDocumento: "98765432100",
    meio: "PIX",
  },
  {
    id: "tx-003",
    // mesmo pagador da tx-001, escrito diferente — o teste do
    // aprendizado por documento
    descricao: "TED 341 TRANSP ALMEIDA",
    valor: 2400.5,
    data: diasAtras(1, 9, 15),
    pagadorNome: "TRANSP ALMEIDA",
    pagadorDocumento: "12345678000190",
    meio: "TED",
  },
  {
    id: "tx-004",
    descricao: "PIX RECEBIDO FERNANDO FARIA",
    valor: 500.0,
    data: diasAtras(2, 21, 40),
    pagadorNome: "FERNANDO FARIA",
    pagadorDocumento: "11122233344", // transferencia da propria conta
    meio: "PIX",
  },
  {
    id: "tx-005",
    descricao: "PIX RECEBIDO COOPERATIVA DE CARGAS SUL",
    valor: 3120.75,
    data: diasAtras(3, 16, 8),
    pagadorNome: "COOPERATIVA DE CARGAS SUL",
    pagadorDocumento: "45678912000133",
    meio: "PIX",
  },
];

function diasAtras(dias, hora = 12, minuto = 0) {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  d.setHours(hora, minuto, 0, 0);
  return d.toISOString();
}

/* Só dígitos. CPF tem 11, CNPJ tem 14. */
function tipoDocumento(doc) {
  const d = String(doc || "").replace(/\D/g, "");
  if (d.length === 14) return "CNPJ";
  if (d.length === 11) return "CPF";
  return null;
}

/* Nome do pagador virando descricao legivel.
   "TRANSPORTES ALMEIDA LTDA" -> "Transportes Almeida"

   No lançamento manual a descricao continua sendo "3º Lançamento de
   Agosto". Aqui, o nome de quem pagou diz muito mais. */
export function nomeParaDescricao(nome) {
  if (!nome) return "Recebimento";
  return String(nome)
    .toLowerCase()
    .replace(/\b(ltda|me|epp|eireli|sa|s\/a)\b\.?/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((p) => (p.length <= 2 ? p : p[0].toUpperCase() + p.slice(1)))
    .join(" ")
    .slice(0, 40);
}

/* -------------------------------------------------------------------
   BUSCAR TRANSACOES

   É a unica funcao que sabe DE ONDE vem a lista. Ela devolve sempre o
   formato de TRANSACOES_FALSAS; o resto do app nao precisa saber se
   veio da Pluggy ou dos dados falsos.

   `conexaoId` é o `id` da linha em `conexoes_bancarias` (NAO o
   pluggy_item_id). A Edge Function confere se a conexao é do usuario
   logado — no nosso banco e na propria Pluggy — antes de devolver.

   ⚠️ Nem toda entrada real traz o documento do pagador (deposito,
   algumas TEDs, creditos de sistema). Nesses casos pagadorNome e
   pagadorDocumento vem vazios, e o aprendizado por documento nao se
   aplica — o Fisco pergunta uma a uma.
   ------------------------------------------------------------------- */
export async function buscarTransacoes(conexaoId) {
  if (!PLUGGY_ATIVO) {
    // pequeno atraso, para a tela mostrar o "carregando" de verdade
    await new Promise((r) => setTimeout(r, 400));
    return TRANSACOES_FALSAS;
  }

  // Sem conexao nao ha o que buscar — e nunca cai nos dados falsos
  if (!conexaoId) return [];

  const { data, error } = await supabase.functions.invoke("pluggy", {
    body: { acao: "transacoes", conexaoId },
  });

  if (error || data?.error) {
    throw new Error(
      (data && data.error) || "Não foi possível buscar as entradas do banco.",
    );
  }

  return data?.transacoes || [];
}

/* -------------------------------------------------------------------
   SINCRONIZAR

   Traz o que caiu na conta e guarda em `entradas`.

   A TRAVA CONTRA DUPLICATA é o coracao desta funcao. Sem ela, cada
   sincronizacao traria as mesmas transacoes de novo e o velocimetro
   contaria dobrado. O `upsert` com onConflict resolve: se o
   pluggy_transaction_id ja existe para aquele usuario, ignora.
   ------------------------------------------------------------------- */
export async function sincronizar(userId, conexaoId = null) {
  const transacoes = await buscarTransacoes(conexaoId);
  if (!transacoes.length) return { novas: 0 };

  const linhas = transacoes.map((t) => ({
    user_id: userId,
    conexao_id: conexaoId,
    pluggy_transaction_id: t.id,
    descricao: t.descricao,
    valor: Number(t.valor) || 0,
    data: t.data,
    pagador_nome: t.pagadorNome,
    pagador_documento: String(t.pagadorDocumento || "").replace(/\D/g, ""),
    pagador_tipo: tipoDocumento(t.pagadorDocumento),
    meio: t.meio,
    status: "pendente",
  }));

  const { data, error } = await supabase
    .from("entradas")
    .upsert(linhas, {
      onConflict: "user_id,pluggy_transaction_id",
      ignoreDuplicates: true,
    })
    .select("id");

  if (error) throw error;
  return { novas: data?.length || 0 };
}

/* -------------------------------------------------------------------
   LER
   ------------------------------------------------------------------- */
export async function listarPendentes(userId) {
  const { data, error } = await supabase
    .from("entradas")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "pendente")
    .order("data", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function listarPorStatus(userId, status) {
  const { data, error } = await supabase
    .from("entradas")
    .select("*")
    .eq("user_id", userId)
    .eq("status", status)
    .order("data", { ascending: false });
  if (error) throw error;
  return data || [];
}

/* -------------------------------------------------------------------
   REGRAS DE PAGADOR — o aprendizado do Fisco

   Na primeira vez ele pergunta. Da segunda em diante, ja sabe.
   A chave é o DOCUMENTO, nao o nome: o mesmo pagador aparece como
   "TRANSPORTES ALMEIDA LTDA" e "TRANSP ALMEIDA", mas o CNPJ é igual.
   ------------------------------------------------------------------- */
export async function lerRegras(userId) {
  const { data, error } = await supabase
    .from("regras_pagador")
    .select("*")
    .eq("user_id", userId);
  if (error) throw error;

  // vira um mapa documento -> regra, para consulta rapida
  const mapa = {};
  for (const r of data || []) mapa[r.pagador_documento] = r;
  return mapa;
}

export async function salvarRegra(userId, documento, nome, acao) {
  const doc = String(documento || "").replace(/\D/g, "");
  if (!doc) return null;

  const { data, error } = await supabase
    .from("regras_pagador")
    .upsert(
      {
        user_id: userId,
        pagador_documento: doc,
        pagador_nome: nome,
        acao, // faturamento | ignorar | perguntar
        atualizado_em: new Date().toISOString(),
      },
      { onConflict: "user_id,pagador_documento" },
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

/* -------------------------------------------------------------------
   SUGESTAO — o que o Fisco ACHA que é

   Devolve apenas uma sugestao, nunca uma decisao. Quem decide é o
   usuario. O campo `motivo` existe para o Fisco poder explicar:
   "achei que era faturamento porque você marcou assim das outras
   vezes".

   ⚠️ CUIDADO COM A REGRA DO CPF: muito cliente de caminhoneiro é
   pessoa fisica — frete de mudanca, entrega para quem nao tem
   empresa. Por isso `ignorar_cpf` é OPCIONAL e, quando ligado, as
   entradas de CPF nao somem caladas: vao para um resumo no fim do
   mes ("ignorei 4 entradas de CPF, quer conferir?").
   ------------------------------------------------------------------- */
export function sugerirClassificacao(entrada, regras = {}, preferencias = {}) {
  const doc = entrada.pagador_documento;

  // 1. Regra salva para este pagador manda em tudo
  const regra = doc ? regras[doc] : null;
  if (regra && regra.acao !== "perguntar") {
    return {
      sugestao: regra.acao === "faturamento" ? "faturamento" : "ignorada",
      confianca: "alta",
      automatico: true,
      motivo: `Você já marcou ${regra.pagador_nome || "este pagador"} assim antes.`,
    };
  }

  // 2. Modo automático: tudo que entra é faturamento
  if (preferencias.modo_classificacao === "automatico") {
    return {
      sugestao: "faturamento",
      confianca: "media",
      automatico: true,
      motivo: "Você pediu para eu lançar tudo automaticamente.",
    };
  }

  // 3. Atalho do CPF, se o usuário tiver ligado
  if (preferencias.ignorar_cpf && entrada.pagador_tipo === "CPF") {
    return {
      sugestao: "ignorada",
      confianca: "media",
      automatico: true,
      motivo: "Veio de CPF, e você pediu para eu não contar esses.",
    };
  }

  // 4. Pagador com CNPJ tem cara de cliente — mas só sugere
  if (entrada.pagador_tipo === "CNPJ") {
    return {
      sugestao: "faturamento",
      confianca: "media",
      automatico: false,
      motivo: "Veio de um CNPJ, então parece pagamento de cliente.",
    };
  }

  // 5. No resto, pergunta
  return {
    sugestao: null,
    confianca: "baixa",
    automatico: false,
    motivo: null,
  };
}

/* -------------------------------------------------------------------
   CLASSIFICAR — o momento em que a entrada vira (ou não) lançamento

   `criarLancamento` vem de fora: é o adicionarLancamento do
   AppStateContext. Assim esta camada não precisa saber nada sobre
   como o app guarda lançamento — e o velocímetro continua sendo
   alimentado pelo mesmo caminho de sempre.
   ------------------------------------------------------------------- */
export async function classificar(
  userId,
  entrada,
  decisao, // 'faturamento' | 'ignorada'
  { criarLancamento, salvarComoRegra = false } = {},
) {
  const agora = new Date().toISOString();
  let lancamentoId = null;

  if (decisao === "faturamento" && typeof criarLancamento === "function") {
    // Descrição = nome do pagador. No lançamento manual continua
    // sendo "3º Lançamento de Agosto"; aqui, quem pagou diz mais.
    criarLancamento({
      descricao: nomeParaDescricao(entrada.pagador_nome),
      valor: Number(entrada.valor) || 0,
      data: entrada.data,
    });
  }

  const { error } = await supabase
    .from("entradas")
    .update({
      status: decisao,
      lancamento_id: lancamentoId,
      classificada_por: "usuario",
      classificada_em: agora,
    })
    .eq("id", entrada.id);

  if (error) throw error;

  // "sempre faça assim com este pagador"
  if (salvarComoRegra && entrada.pagador_documento) {
    await salvarRegra(
      userId,
      entrada.pagador_documento,
      entrada.pagador_nome,
      decisao === "faturamento" ? "faturamento" : "ignorar",
    );
  }

  return { ok: true };
}

/* -------------------------------------------------------------------
   PREFERENCIAS

   NAO sao perguntadas no cadastro. Nascem da conversa: no primeiro
   Pix o Fisco pergunta, e depois oferece "quer que eu faça sempre
   assim?".

   O padrao é o mais conservador: pergunta tudo, nao emite nota
   sozinho.
   ------------------------------------------------------------------- */
export async function lerPreferencias(userId) {
  const { data } = await supabase
    .from("preferencias_fisco")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  return (
    data || {
      modo_classificacao: "perguntar",
      ignorar_cpf: false,
      modo_nota: "perguntar",
      horario_resumo: "20:30",
      frequencia_resumo: "diario",
      lembrete_das: true,
      dias_antes_das: 3,
    }
  );
}

export async function salvarPreferencias(userId, patch) {
  const { data, error } = await supabase
    .from("preferencias_fisco")
    .upsert(
      { user_id: userId, ...patch, atualizado_em: new Date().toISOString() },
      { onConflict: "user_id" },
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}

/* -------------------------------------------------------------------
   CONEXOES BANCARIAS

   ⚠️ Conexao desconectada NAO aparece em listarConexoes: some da
   tela, o Dashboard para de sincronizar e a protecao contra banco
   repetido (ConectarBanco) nao confunde uma antiga desligada com uma
   nova. As entradas dela continuam guardadas — o historico fica.
   ------------------------------------------------------------------- */
export async function listarConexoes(userId) {
  const { data, error } = await supabase
    .from("conexoes_bancarias")
    .select("*")
    .eq("user_id", userId)
    .neq("status", "desconectada")
    .order("criado_em", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function salvarConexao(userId, { itemId, instituicao, numeroConta }) {
  const { data, error } = await supabase
    .from("conexoes_bancarias")
    .upsert(
      {
        user_id: userId,
        pluggy_item_id: itemId,
        instituicao,
        numero_conta: numeroConta,
        status: "ativa",
        ultima_sync: new Date().toISOString(),
      },
      { onConflict: "user_id,pluggy_item_id" },
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}

/* DESCONECTAR — a pessoa tira o banco do app.

   1. Pede a Edge Function para apagar a conexao NA PLUGGY. Libera a
      vaga no pacote de 500 (cada conta conectada conta como uma).
   2. Marca a linha como "desconectada" no nosso banco de dados.

   NAO apaga as entradas ja guardadas: o historico fica (decisao do
   handoff). Se a Pluggy falhar, avisa e NAO marca nada — para nao
   ficar uma conexao "fantasma" viva na Pluggy ocupando vaga paga. */
export async function desconectarConexao(conexao) {
  if (!conexao?.id) throw new Error("Conexão não informada.");

  if (PLUGGY_ATIVO && conexao.pluggy_item_id) {
    const { data, error } = await supabase.functions.invoke("pluggy", {
      body: { acao: "desconectar", itemId: conexao.pluggy_item_id },
    });
    if (error || data?.error) {
      throw new Error((data && data.error) || "Não foi possível desconectar agora.");
    }
  }

  const { error } = await supabase
    .from("conexoes_bancarias")
    .update({ status: "desconectada" })
    .eq("id", conexao.id);

  if (error) throw error;
  return { ok: true };
}

/* -------------------------------------------------------------------
   CONECTAR UM BANCO — CAMINHO B (fluxo nosso, sem a janela da Pluggy)

   As telas /conectar-banco/escolher e /conectar-banco/retorno usam
   estas tres funcoes. Todas passam pela Edge Function `pluggy`, que
   descobre o usuario pelo login (nunca confia em id vindo da tela).

     listarBancos()                -> bancos do Open Finance
     criarConexao(id, documento)   -> cria a conexao e devolve o itemId
     statusConexao(itemId)         -> em que pe esta a conexao. Quando o
                                      link do banco fica pronto, ele vem
                                      em `urlBanco`

   ⚠️ O CPF/CNPJ digitado vai direto para a Pluggy (o Open Finance
   exige). NAO guardamos e NAO vai para log — nem aqui, nem na funcao.
   ------------------------------------------------------------------- */

/* Chama a Edge Function e devolve so a resposta. Se der erro, tenta
   ler a mensagem que a funcao mandou; senao usa a mensagem padrao. */
async function chamarPluggy(corpo, mensagemPadrao) {
  const { data, error } = await supabase.functions.invoke("pluggy", { body: corpo });
  if (error || data?.error) {
    let mensagem = data?.error;
    if (!mensagem && error?.context && typeof error.context.json === "function") {
      try {
        const corpoErro = await error.context.json();
        mensagem = corpoErro?.error;
      } catch {
        /* resposta sem JSON — fica a mensagem padrao */
      }
    }
    throw new Error(mensagem || mensagemPadrao);
  }
  return data || {};
}

/* Bancos do Open Finance, no formato:
   [{ id, nome, logo, cor, tipo: "PF"|"PJ", documento: "cpf"|"cnpj",
      sandbox, online }]
   No sandbox, o banco de teste vem primeiro. */
export async function listarBancos() {
  if (!PLUGGY_ATIVO) throw new Error("A conexão com os bancos está desligada.");
  const data = await chamarPluggy({ acao: "bancos" }, "Não foi possível carregar os bancos.");
  return data.bancos || [];
}

/* Comeca a conexao com o banco escolhido. `documento` é o CPF (conta
   pessoal) ou CNPJ (conta da empresa) — com ou sem pontuacao. */
export async function criarConexao(connectorId, documento) {
  if (!PLUGGY_ATIVO) throw new Error("A conexão com os bancos está desligada.");
  const doc = String(documento || "").replace(/\D/g, "");
  const data = await chamarPluggy(
    { acao: "criar", connectorId, documento: doc },
    "Não foi possível começar a conexão com o banco.",
  );
  if (!data.itemId) throw new Error("Não foi possível começar a conexão com o banco.");
  return data.itemId;
}

/* Em que pe esta a conexao:
   { status, execucao, banco, urlBanco, expiraEm, erro } */
export async function statusConexao(itemId) {
  if (!PLUGGY_ATIVO) throw new Error("A conexão com os bancos está desligada.");
  return chamarPluggy({ acao: "status", itemId }, "Não foi possível acompanhar a conexão.");
}

/* Apaga NA PLUGGY uma conexao que acabou de ser criada e que NAO vamos
   guardar — por exemplo, quando o banco ja estava conectado (conexao
   repetida ocupa vaga paga e duplicaria as entradas).
   Diferente de desconectarConexao, que mexe numa conexao ja guardada
   no nosso banco de dados. A funcao `pluggy` confere se a conexao e
   do usuario logado antes de apagar. */
export async function descartarConexaoNova(itemId) {
  if (!PLUGGY_ATIVO || !itemId) return;
  await chamarPluggy(
    { acao: "desconectar", itemId },
    "Não foi possível descartar a conexão repetida.",
  );
}

/* Quantas entradas daquele banco estao esperando a pessoa conferir.
   Usada na tela de retorno: "Achei X entradas desde janeiro". */
export async function contarPendentesDaConexao(userId, conexaoId) {
  const { count, error } = await supabase
    .from("entradas")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("conexao_id", conexaoId)
    .eq("status", "pendente");
  if (error) throw error;
  return count || 0;
}

/* Conexão falsa, para desenvolver a tela sem o Pluggy ativo.
   ⚠️ Só faz sentido com PLUGGY_ATIVO = false: com a Pluggy ligada, a
   Edge Function recusa este item (ele nao existe na Pluggy). */
export async function conectarBancoFalso(userId) {
  return salvarConexao(userId, {
    itemId: "item-falso-001",
    instituicao: "Banco de Teste",
    numeroConta: "•••• 4432",
  });
}