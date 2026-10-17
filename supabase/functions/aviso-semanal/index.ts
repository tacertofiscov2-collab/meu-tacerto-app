/* AVISO-SEMANAL v2 — aviso de que o limite de 1.000 linhas do banco vale também para a soma do faturamento (rpc) (v1: notificação da semana no celular: 1 por semana para cada celular que ativou, dizendo quanto do limite do ano o velocímetro já usou. Escrita em 12/10/2026). ⚠️ AINDA NÃO PUBLICADA: publicar só com o "pode" do Fernando (passo a passo em docs/NOTIFICACOES.md). */
//
// QUEM CHAMA ESTA FUNÇÃO
//   O "despertador" do banco (pg_cron + pg_net), toda segunda às 9h de
//   Brasília (PARTE 2 de docs/SQL-PENDENTE-NOTIFICACOES.sql). NÃO é o app
//   e não é uma pessoa logada: por isso o "Verify JWT" fica DESLIGADO ao
//   publicar (verify_jwt = false). A segurança vem de uma senha: o
//   despertador manda o cabeçalho "x-aviso-segredo", que tem que ser
//   igual ao segredo AVISO_SEMANAL_SEGREDO. Sem ele (ou errado): 401 e
//   nada é enviado.
//
// COMO FUNCIONA
//   1) Lê os celulares com a notificação ATIVA (tabela inscricoes_push).
//      Se o mesmo celular aparece em 2 contas (celular emprestado, troca
//      de conta), só a conta mais recente nele recebe — assim ninguém vê
//      o velocímetro de outra pessoa.
//   2) Fica só com quem NÃO recebeu nos últimos 6 dias (rodar 2 vezes no
//      mesmo dia não manda 2 vezes).
//   3) Lê o perfil dessas pessoas (tipo de MEI e mês/ano de abertura) e o
//      faturamento do ano (função do banco faturado_ano_para_aviso, que
//      soma os lançamentos do ano, no horário de Brasília).
//   4) Calcula o limite e o percentual IGUAL ao app (src/lib/fiscal.js:
//      LIMITES_ANUAIS, limiteProporcional no ano de abertura,
//      faixaDoVelocimetro) e manda a notificação.
//   5) Enviou: grava "ultimo_envio_em". A Apple/Google responderam 404 ou
//      410 (o celular cancelou ou não existe mais): marca ativa = false
//      (só ATUALIZA; nunca apaga a linha).
//
// O TEXTO (aparece na tela bloqueada: SEM valor em reais e SEM CNPJ)
//   Sem faturamento no ano:
//     "TaCerto!" / "Seu velocímetro está sem valores. Leva poucos minutos
//     para atualizar."
//   Com faturamento:
//     "TaCerto!" / "Você já usou 42% do limite do ano." + a frase curta da
//     faixa (as de FAIXA_INFO em src/lib/fiscal.js). Nunca fala de DAS.
//   Tocar na notificação abre o Início (/dashboard).
//
// O QUE VAI PARA O CELULAR (o service worker do app lê este JSON)
//   { title, body, url: "/dashboard", tag: "aviso-semanal" }
//   Vale 1 dia (TTL): celular desligado o dia todo perde a da semana.
//
// ENVIO DE TESTE (só para UMA pessoa, sem esperar segunda)
//   Corpo { "teste_user_id": "<id da pessoa>" } (com a mesma senha). Manda
//   para os celulares ativos dessa pessoa mesmo que ela já tenha recebido
//   na semana, e NÃO grava ultimo_envio_em (a de segunda chega normal).
//   O comando pronto está no fim de docs/SQL-PENDENTE-NOTIFICACOES.sql.
//
// SEGREDOS (Supabase > Edge Functions > Secrets)
//   VAPID_KEYS             o par de chaves do TaCerto, em JSON
//                          { "publicKey": {...}, "privateKey": {...} }
//                          (gerado no passo 1 do docs/NOTIFICACOES.md).
//   VAPID_CONTATO          e-mail do TaCerto (a Apple/Google usam se
//                          houver problema com os envios).
//   AVISO_SEMANAL_SEGREDO  a senha do despertador (a mesma da PARTE 2).
//   SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY já existem em toda função.
//   A service_role (chave do servidor) passa por cima do RLS: lê os
//   celulares e os perfis de todos. Ela só existe aqui no servidor.
//
// RESPOSTA (JSON)
//   200 { ok: true, enviados, desativados, erros }
//   401 { ok: false, motivo: "sem_permissao" }   (senha faltando/errada)
//   400 { ok: false, motivo: "teste_id_invalido" } (teste sem um id certo)
//   500 { ok: false, motivo: "sem_chaves" | "banco" | "erro" }
//
// PRIVACIDADE: NUNCA vai para o log o endereço do celular (endpoint), as
// chaves, os textos ou valores. Só contagens (e o código de erro da
// Apple/Google, quando houver).
import * as webpush from "jsr:@negrel/webpush@0.5.0";
import { createClient } from "jsr:@supabase/supabase-js@2";

/* ===================================================================
   REGRAS FISCAIS — cópia de src/lib/fiscal.js (FISCAL v6).
   ⚠️ Mudou lá (limite, faixas, frases)? Mudar aqui também.
   =================================================================== */
const LIMITES_ANUAIS: Record<string, number> = {
  MEI: 81000,
  MEI_CAMINHONEIRO: 251600,
};

/* Igual ao normalizarTipo do src/context/AppStateContext.jsx */
function normalizarTipo(v: unknown): "MEI" | "MEI_CAMINHONEIRO" {
  return String(v || "MEI").toUpperCase() === "MEI_CAMINHONEIRO" ? "MEI_CAMINHONEIRO" : "MEI";
}

/* Igual ao limiteProporcional do fiscal.js: no ano em que o MEI abriu, o
   limite é proporcional aos meses (mês de abertura até dezembro). */
function limiteProporcional(tipo: string, mesAbertura: number, anoAbertura: number, anoCorrente: number): number {
  const cheio = LIMITES_ANUAIS[tipo] ?? LIMITES_ANUAIS.MEI;
  if (!mesAbertura || !anoAbertura) return cheio;
  if (anoCorrente > anoAbertura) return cheio;
  const mesesRestantes = 12 - mesAbertura + 1;
  return Math.round((cheio / 12) * mesesRestantes);
}

/* Igual ao faixaDoVelocimetro do fiscal.js */
function faixaDoVelocimetro(percentual: number): string {
  if (percentual < 50) return "tranquilo";
  if (percentual < 75) return "fique_de_olho";
  if (percentual < 90) return "atencao";
  if (percentual < 100) return "perto_do_limite";
  if (percentual <= 120) return "estourou";
  return "critico";
}

/* Frase curta de cada faixa, tiradas de FAIXA_INFO (fiscal.js):
   "mensagem" ou "resumo". Acima de 100%, calma e "abra o app". */
const FRASE_DA_FAIXA: Record<string, string> = {
  tranquilo: "Continua no seu ritmo.", //                 FAIXA_INFO.tranquilo.mensagem
  fique_de_olho: "Vale começar a acompanhar de perto.", // FAIXA_INFO.fique_de_olho.mensagem
  atencao: "Bora planejar os próximos meses.", //         FAIXA_INFO.atencao.mensagem
  perto_do_limite: "Muito próximo do teto.", //           FAIXA_INFO.perto_do_limite.resumo
  estourou: "Passou do limite, mas dá pra ajustar. Abra o app para ver.", // FAIXA_INFO.estourou.mensagem + abrir o app
  critico: "Abra o app para ver os próximos passos.", // (sem frase de lá: as de "critico" assustam na tela bloqueada)
};

const TITULO = "TaCerto!";
const TEXTO_SEM_VALORES = "Seu velocímetro está sem valores. Leva poucos minutos para atualizar.";

/* O texto da notificação (sem reais, sem CNPJ) */
function montarAviso(faturado: number, limite: number): { title: string; body: string } {
  if (!(faturado > 0)) return { title: TITULO, body: TEXTO_SEM_VALORES };
  const percentual = limite > 0 ? (faturado / limite) * 100 : 0; // = calcularPercentual
  const redondo = Math.round(percentual);
  const quanto = redondo < 1 ? "menos de 1%" : `${redondo}%`;
  const frase = FRASE_DA_FAIXA[faixaDoVelocimetro(percentual)] || FRASE_DA_FAIXA.tranquilo;
  return { title: TITULO, body: `Você já usou ${quanto} do limite do ano. ${frase}` };
}

/* ===================================================================
   AJUDANTES
   =================================================================== */
const DIA_MS = 24 * 60 * 60 * 1000;
const JANELA_MS = 6 * DIA_MS; // não manda de novo para quem recebeu nos últimos 6 dias
const TTL_SEGUNDOS = 24 * 60 * 60; // a notificação vale 1 dia
const ENVIOS_JUNTOS = 10; // quantos celulares de cada vez
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Inscricao = {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  atualizado_em: string | null;
  ultimo_envio_em: string | null;
};

function responder(status: number, corpo: Record<string, unknown>) {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/* Compara a senha sem "vazar" pelo tempo da comparação */
async function senhaConfere(recebida: string | null, esperada: string): Promise<boolean> {
  if (!recebida || !esperada) return false;
  const cod = new TextEncoder();
  const [a, b] = await Promise.all([
    crypto.subtle.digest("SHA-256", cod.encode(recebida)),
    crypto.subtle.digest("SHA-256", cod.encode(esperada)),
  ]);
  const x = new Uint8Array(a);
  const y = new Uint8Array(b);
  let diferenca = 0;
  for (let i = 0; i < x.length; i++) diferenca |= x[i] ^ y[i];
  return diferenca === 0;
}

/* O ano de hoje no horário de Brasília (o app soma o ano do aparelho) */
function anoEmSaoPaulo(agora = new Date()): number {
  return Number(new Intl.DateTimeFormat("en-US", { timeZone: "America/Sao_Paulo", year: "numeric" }).format(agora));
}

function momento(iso: string | null): number {
  const t = iso ? Date.parse(iso) : NaN;
  return Number.isFinite(t) ? t : 0;
}

/* A Apple exige o contato como "mailto:..." (ou um endereço https) */
function contatoVapid(v: string): string {
  const t = v.trim();
  return t.startsWith("mailto:") || t.startsWith("https://") ? t : `mailto:${t}`;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return responder(405, { ok: false, motivo: "metodo" });

  // 1) Só o despertador (quem sabe a senha) pode chamar
  const senha = Deno.env.get("AVISO_SEMANAL_SEGREDO") || "";
  if (!senha) console.error("aviso-semanal: falta o segredo AVISO_SEMANAL_SEGREDO");
  if (!(await senhaConfere(req.headers.get("x-aviso-segredo"), senha))) {
    return responder(401, { ok: false, motivo: "sem_permissao" });
  }

  try {
    const corpo = await req.json().catch(() => ({}));
    const pediuTeste = corpo != null && typeof corpo === "object" && "teste_user_id" in corpo;
    const testeUserId =
      pediuTeste && typeof corpo.teste_user_id === "string" && UUID.test(corpo.teste_user_id.trim())
        ? corpo.teste_user_id.trim()
        : null;
    // Teste com o id errado (ex.: esqueceu de trocar <ID_DA_PESSOA>): não
    // manda para ninguém (nunca vira o envio para todos)
    if (pediuTeste && !testeUserId) return responder(400, { ok: false, motivo: "teste_id_invalido" });

    // 2) As chaves do TaCerto (para a Apple/Google aceitarem o envio)
    const chavesJson = Deno.env.get("VAPID_KEYS");
    const contato = Deno.env.get("VAPID_CONTATO");
    if (!chavesJson || !contato) {
      console.error("aviso-semanal: faltam os segredos VAPID_KEYS e/ou VAPID_CONTATO");
      return responder(500, { ok: false, motivo: "sem_chaves" });
    }
    const chavesVapid = await Promise.resolve()
      .then(() => webpush.importVapidKeys(JSON.parse(chavesJson), { extractable: false }))
      .catch(() => null);
    if (!chavesVapid) {
      console.error("aviso-semanal: VAPID_KEYS com formato errado");
      return responder(500, { ok: false, motivo: "sem_chaves" });
    }
    const contatoInformado = contatoVapid(contato);

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // 3) Os celulares com a notificação ativa (TODOS, para achar o mesmo
    //    celular em 2 contas). ⚠️ O banco devolve no máximo 1.000 linhas
    //    por vez: passou disso, paginar aqui E na soma do passo 5 (rpc),
    //    senão quem ficar de fora recebe "sem valores" sem ser verdade.
    let consulta = supabase
      .from("inscricoes_push")
      .select("id, user_id, endpoint, p256dh, auth, atualizado_em, ultimo_envio_em")
      .eq("ativa", true);
    if (testeUserId) consulta = consulta.eq("user_id", testeUserId);
    const { data: linhas, error: erroInscricoes } = await consulta;
    if (erroInscricoes) {
      console.error("aviso-semanal: falha ao ler inscricoes_push", erroInscricoes.code);
      return responder(500, { ok: false, motivo: "banco" });
    }
    const inscricoes = (linhas || []) as Inscricao[];

    // Mesmo celular em 2 contas: fica a mais recente
    const porCelular = new Map<string, Inscricao>();
    for (const i of inscricoes) {
      const atual = porCelular.get(i.endpoint);
      if (!atual || momento(i.atualizado_em) > momento(atual.atualizado_em)) porCelular.set(i.endpoint, i);
    }
    const repetidas = inscricoes.length - porCelular.size;

    // 4) Só quem não recebeu nos últimos 6 dias (no teste, manda sempre)
    const corte = Date.now() - JANELA_MS;
    const paraEnviar = [...porCelular.values()].filter(
      (i) => testeUserId || !i.ultimo_envio_em || momento(i.ultimo_envio_em) < corte,
    );
    if (paraEnviar.length === 0) {
      console.log(JSON.stringify({ ativas: inscricoes.length, repetidas, para_enviar: 0, teste: !!testeUserId }));
      return responder(200, { ok: true, enviados: 0, desativados: 0, erros: 0 });
    }

    // 5) Perfil (tipo de MEI, abertura) e faturamento do ano
    const pessoas = [...new Set(paraEnviar.map((i) => i.user_id))];
    const { data: perfis, error: erroPerfis } = await supabase
      .from("perfis")
      .select("id, tipo_mei, mes_abertura, ano_abertura")
      .in("id", pessoas);
    if (erroPerfis) {
      console.error("aviso-semanal: falha ao ler perfis", erroPerfis.code);
      return responder(500, { ok: false, motivo: "banco" });
    }
    const ano = anoEmSaoPaulo();
    const { data: somas, error: erroSomas } = await supabase.rpc("faturado_ano_para_aviso", { p_ano: ano });
    if (erroSomas) {
      console.error("aviso-semanal: falha na faturado_ano_para_aviso", erroSomas.code);
      return responder(500, { ok: false, motivo: "banco" });
    }
    const perfilDe = new Map<string, { tipo_mei: unknown; mes_abertura: unknown; ano_abertura: unknown }>();
    for (const p of perfis || []) perfilDe.set(p.id, p);
    const faturadoDe = new Map<string, number>();
    for (const s of (somas || []) as { user_id: string; faturado: unknown }[]) {
      faturadoDe.set(s.user_id, Number(s.faturado) || 0);
    }

    // 6) Manda (de 10 em 10)
    const enviadosIds: string[] = [];
    const desativarIds: string[] = [];
    let erros = 0;
    const errosPorCodigo: Record<string, number> = {};

    async function enviar(i: Inscricao) {
      try {
        const perfil = perfilDe.get(i.user_id);
        const tipo = normalizarTipo(perfil?.tipo_mei);
        const mes = Number(perfil?.mes_abertura) || 0;
        const anoAbertura = Number(perfil?.ano_abertura) || 0;
        // Igual ao app: sem mês E ano de abertura, vale o limite cheio
        const limite = mes && anoAbertura ? limiteProporcional(tipo, mes, anoAbertura, ano) : LIMITES_ANUAIS[tipo];
        const aviso = montarAviso(faturadoDe.get(i.user_id) || 0, limite);
        const mensagem = JSON.stringify({ ...aviso, url: "/dashboard", tag: "aviso-semanal" });

        // Um "remetente" novo para cada envio (chave de uso único, como
        // pede a regra da criptografia das notificações)
        const remetente = await webpush.ApplicationServer.new({
          contactInformation: contatoInformado,
          vapidKeys: chavesVapid,
        });
        await remetente
          .subscribe({ endpoint: i.endpoint, keys: { p256dh: i.p256dh, auth: i.auth } })
          .pushTextMessage(mensagem, { ttl: TTL_SEGUNDOS, urgency: webpush.Urgency.Normal, topic: "aviso-semanal" });
        enviadosIds.push(i.id);
      } catch (e) {
        if (e instanceof webpush.PushMessageError) {
          const codigo = e.response.status;
          await e.response.body?.cancel().catch(() => {});
          // 404/410: o celular cancelou (ou trocou de aparelho) — desliga
          if (codigo === 404 || codigo === 410) {
            desativarIds.push(i.id);
            return;
          }
          errosPorCodigo[String(codigo)] = (errosPorCodigo[String(codigo)] || 0) + 1;
        } else {
          errosPorCodigo.outro = (errosPorCodigo.outro || 0) + 1;
        }
        erros++;
      }
    }

    for (let k = 0; k < paraEnviar.length; k += ENVIOS_JUNTOS) {
      await Promise.all(paraEnviar.slice(k, k + ENVIOS_JUNTOS).map(enviar));
    }

    // 7) Anota quem recebeu (no teste, não: a de segunda chega normal)
    const agora = new Date().toISOString();
    if (enviadosIds.length && !testeUserId) {
      const { error } = await supabase.from("inscricoes_push").update({ ultimo_envio_em: agora }).in("id", enviadosIds);
      if (error) console.error("aviso-semanal: falha ao gravar ultimo_envio_em", error.code);
    }
    // Desliga os celulares que cancelaram (ATUALIZA; nunca apaga)
    if (desativarIds.length) {
      const { error } = await supabase
        .from("inscricoes_push")
        .update({ ativa: false, atualizado_em: agora })
        .in("id", desativarIds);
      if (error) console.error("aviso-semanal: falha ao desativar inscricoes", error.code);
    }

    console.log(
      JSON.stringify({
        ativas: inscricoes.length,
        repetidas,
        para_enviar: paraEnviar.length,
        enviados: enviadosIds.length,
        desativados: desativarIds.length,
        erros,
        erros_por_codigo: errosPorCodigo,
        teste: !!testeUserId,
      }),
    );
    return responder(200, { ok: true, enviados: enviadosIds.length, desativados: desativarIds.length, erros });
  } catch (e) {
    // Sem detalhes no log (nada de endereço do celular); só o tipo do erro
    console.error("aviso-semanal falhou:", e instanceof Error ? e.name : "erro");
    return responder(500, { ok: false, motivo: "erro" });
  }
});
