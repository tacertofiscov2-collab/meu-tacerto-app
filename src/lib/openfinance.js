import { supabase } from "@/lib/supabase";

/* ===================================================================
   OPEN FINANCE — a camada que traz o que caiu na conta

   COMO ESTE ARQUIVO FUNCIONA HOJE
   Ainda NAO fala com o Pluggy de verdade. Enquanto a conta nao é
   ativada (sao 14 dias de teste, entao so ligamos quando o app
   estiver pronto), ele devolve dados FALSOS — de proposito
   bagunçados, do jeito que extrato real vem.

   Quando for ligar o Pluggy, so a funcao `buscarTransacoes` muda.
   Todo o resto — classificacao, regras, gravacao — continua igual.

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

/* Liga isto quando a conta do Pluggy estiver ativa. */
export const PLUGGY_ATIVO = false;

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

   É ESTA a unica funcao que muda quando o Pluggy entrar. Ela devolve
   uma lista no formato de cima; de onde vem a lista, o resto do app
   nao precisa saber.
   ------------------------------------------------------------------- */
export async function buscarTransacoes(/* conexaoId */) {
  if (!PLUGGY_ATIVO) {
    // pequeno atraso, para a tela mostrar o "carregando" de verdade
    await new Promise((r) => setTimeout(r, 400));
    return TRANSACOES_FALSAS;
  }

  // TODO quando ativar o Pluggy:
  //   - chamar a Edge Function do Supabase (a chave do Pluggy NUNCA
  //     pode ficar no app: ele roda no navegador e qualquer um le)
  //   - a Edge Function chama GET /transactions do Pluggy
  //   - devolver no mesmo formato de TRANSACOES_FALSAS
  return [];
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
   ------------------------------------------------------------------- */
export async function listarConexoes(userId) {
  const { data, error } = await supabase
    .from("conexoes_bancarias")
    .select("*")
    .eq("user_id", userId)
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

/* Conexão falsa, para desenvolver a tela sem o Pluggy ativo. */
export async function conectarBancoFalso(userId) {
  return salvarConexao(userId, {
    itemId: "item-falso-001",
    instituicao: "Banco de Teste",
    numeroConta: "•••• 4432",
  });
}