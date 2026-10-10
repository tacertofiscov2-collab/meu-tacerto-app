/* CNPJ v1 — CNPJ do MEI: mascara enquanto digita, CNPJ escondido, conferencia dos digitos e busca dos dados publicos na BrasilAPI (nome, CNAE, data do MEI) */

/* Conferido em 10/10/2026 (verificacao independente), ainda v1 porque nao
   foi publicado. Corrigido:
   - buscarCnpj(cnpj, null) dava erro (TypeError); agora usa as opcoes padrao.
     A busca tem de "nunca lancar".
   - timeoutMs = Infinity ou enorme desistia NA HORA (o setTimeout do
     navegador estoura acima de ~24 dias e vira 1 ms). Agora so vale de 1 ms
     ate 2 minutos; fora disso, os 8 segundos padrao.
   - CNPJ da resposta chegando como NUMERO (191 em vez de "00000000000191")
     dava "falha" por parecer outro CNPJ. Agora completa os zeros antes de
     comparar.
   - soDigitosCnae(49302) virava "0049302" (CNAE que nao existe). O zero na
     frente so e posto em numero de 6 digitos (o caso real: 0111-3/01 que
     chega como 111301); com 5 digitos ou menos devolve "". */

/* ===================================================================
   CNPJ DO MEI — REGRAS (escrito em 10/10/2026)

   POR QUE ESTE ARQUIVO
   - O CNPJ aparece em varios lugares (cadastro, Perfil, conferencia de
     entradas). Mascara, conferencia e busca ficam aqui, num lugar so,
     em JavaScript puro (sem React), para dar para testar direto no node.

   O NUMERO
   - CNPJ tem 14 digitos: 8 da "raiz" (a empresa), 4 da filial (0001 =
     matriz; o MEI e sempre 0001) e 2 digitos verificadores (DV).
   - Os 2 DV saem de uma conta com os 12 primeiros digitos (algoritmo
     oficial da Receita, "modulo 11", pesos 5..2,9..2 e 6..2,9..2). Serve
     para pegar erro de digitacao ANTES de ir na internet: numero com DV
     errado nem e consultado.
   - 14 digitos iguais (00000000000000, 11111111111111...) passam na
     conta mas nao existem: sao recusados.
   - Mostrar escondido (padrao do app, igual ConferirEntradas e Saidas):
     12.345.•••/••01-90.
   ⚠️ CNPJ COM LETRAS: a Receita passou a dar (desde jul/2026, IN RFB
     2.229/2024) CNPJ com letras e numeros para empresas NOVAS. Os
     antigos continuam so de numeros. Este arquivo so entende o CNPJ de
     numeros: um CNPJ com letras da como "invalido". Rever quando o
     primeiro MEI do piloto tiver um.

   BUSCA NA BRASILAPI
   - https://brasilapi.com.br/api/cnpj/v1/{14 digitos}: gratis, sem
     chave, funciona direto do navegador. Os dados sao os publicos da
     Receita (a mesma base aberta que qualquer um consulta).
   - So sai do aparelho o numero do CNPJ (dado publico), nada da pessoa.
   - Fora do navegador (node, Edge Function) a BrasilAPI responde 403
     para o fetch padrao (ela recusa o "User-Agent: node"). Nesse caso,
     passar um fetchImpl que mande um User-Agent proprio. No iPhone e no
     PC (navegador) funciona direto.
   - A base aberta da Receita e atualizada mais ou menos 1 vez por mes:
     MEI aberto ha poucas semanas pode ainda nao aparecer (404). O app
     tem de deixar a pessoa seguir preenchendo a mao.
   - A busca NUNCA trava o app: buscarCnpj sempre devolve um objeto
     ({ ok: true, dados } ou { ok: false, motivo }), nunca da erro, e
     desiste sozinha depois de 8 segundos (sinal fraco na estrada).

   CNAE DO CAMINHONEIRO
   - MEI Caminhoneiro (LC 188/2021) e o transportador autonomo de carga.
     Os CNAEs dele comecam com 4930-2:
       4930-2/01 carga municipal
       4930-2/02 carga intermunicipal, interestadual e internacional
       4930-2/03 produtos perigosos
       4930-2/04 mudancas
   - Se o CNAE principal OU um secundario e desses, "parece"
     caminhoneiro. So "parece": quem confirma o tipo de MEI e a pessoa
     (o tipo e travado no app; so muda pela folha "O que mudou?").
   - A BrasilAPI manda o CNAE como numero (4930202). CNAE que comeca com
     0 (agricultura, ex.: 0111-3/01) chega como 111301: por isso numero
     de 6 digitos ganha zero na frente. Numero menor (5 digitos ou menos)
     daria divisao "00", que nao existe: e recusado.
   - Sem CNAE secundario, a BrasilAPI manda [{ codigo: 0, descricao: "" }]:
     esse codigo 0 e ignorado.

   NOME DA PESSOA
   - A razao social do MEI e "raiz do CNPJ + nome" (12.345.678 FULANO
     DE TAL) ou, nos mais antigos, "nome + CPF" (FULANO DE TAL
     12345678900). Para chamar a pessoa pelo nome, tira o numero das
     pontas e arruma as maiusculas: "Fulano de Tal".

   DATA DO MEI (regra dos anos)
   - No ano em que o MEI abre, o limite de faturamento e proporcional
     aos meses (conta a partir do mes de abertura). Por isso o mes de
     abertura so importa se abriu NESTE ano; nos outros anos o limite e
     o cheio e a data nao muda nada (mesAnoDaOpcaoMei devolve null).
   - Datas sao tratadas como TEXTO "AAAA-MM-DD", sem new Date(texto):
     new Date("2026-03-01") e meia-noite em Londres, que no Brasil ainda
     e 28/02 as 21h, e o mes viraria fevereiro.
   =================================================================== */

const URL_BRASILAPI_CNPJ = "https://brasilapi.com.br/api/cnpj/v1/";
const TEMPO_LIMITE_PADRAO = 8000; // 8 segundos
const TEMPO_LIMITE_MAXIMO = 120000; // 2 minutos (acima disso, usa o padrao)

const PESOS_DV1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
const PESOS_DV2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

/* CNAEs do MEI Caminhoneiro: 4930-2/01 a 4930-2/04 (todos comecam com 49302) */
const INICIO_CNAE_CAMINHONEIRO = "49302";

/* Palavras que ficam em minusculo no meio do nome ("Maria das Dores") */
const PALAVRAS_MINUSCULAS = new Set(["de", "da", "do", "das", "dos", "e"]);

/* Texto seguro: so aceita texto ou numero; o resto (null, objeto...) vira "" */
function texto(valor) {
  if (typeof valor === "string") return valor;
  if (typeof valor === "number" && Number.isFinite(valor)) return String(valor);
  return "";
}

/* Todos os digitos, sem cortar (para conferir se sao exatamente 14) */
function todosOsDigitos(valor) {
  return texto(valor).replace(/\D/g, "");
}

/* ============================ CNPJ ============================ */

/* "12.345.678/0001-90" -> "12345678000190" (no maximo 14 digitos) */
export function soDigitosCnpj(valor) {
  return todosOsDigitos(valor).slice(0, 14);
}

/* Mascara enquanto digita: "12" "12.3" "12.345.6" "12.345.678/0" ...
   ate "12.345.678/0001-90". Letras e espacos sao ignorados. */
export function formatarCnpj(valor) {
  const d = soDigitosCnpj(valor);
  let s = d.slice(0, 2);
  if (d.length > 2) s += "." + d.slice(2, 5);
  if (d.length > 5) s += "." + d.slice(5, 8);
  if (d.length > 8) s += "/" + d.slice(8, 12);
  if (d.length > 12) s += "-" + d.slice(12, 14);
  return s;
}

/* CNPJ escondido, padrao do app: "12.345.•••/••01-90".
   Sem os 14 digitos, nao mostra nada. */
export function mascararCnpj(valor) {
  const d = todosOsDigitos(valor);
  if (d.length !== 14) return "";
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.•••/••${d.slice(10, 12)}-${d.slice(12)}`;
}

/* Conta oficial do digito verificador (modulo 11) */
function digitoVerificador(base, pesos) {
  let soma = 0;
  for (let i = 0; i < pesos.length; i++) soma += Number(base[i]) * pesos[i];
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

/* true so com 14 digitos, nao todos iguais, e os 2 DV certos */
export function cnpjValido(valor) {
  const d = todosOsDigitos(valor);
  if (d.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(d)) return false;
  return (
    digitoVerificador(d, PESOS_DV1) === Number(d[12]) &&
    digitoVerificador(d, PESOS_DV2) === Number(d[13])
  );
}

/* ============================ CNAE ============================ */

/* 4930202, "4930202" ou "4930-2/02" -> "4930202". Nao deu 7 digitos -> "".
   Numero ganha zero na frente (111301 -> "0111301"), porque a BrasilAPI
   manda o CNAE como numero e o zero da frente se perde. */
export function soDigitosCnae(codigo) {
  if (typeof codigo === "number") {
    if (!Number.isInteger(codigo) || codigo < 100000 || codigo > 9999999) return "";
    return String(codigo).padStart(7, "0");
  }
  const d = todosOsDigitos(codigo);
  if (d.length !== 7 || /^0+$/.test(d)) return "";
  return d;
}

/* 4930202 -> "4930-2/02". Invalido -> "" */
export function formatarCnae(codigo) {
  const d = soDigitosCnae(codigo);
  if (!d) return "";
  return `${d.slice(0, 4)}-${d.slice(4, 5)}/${d.slice(5)}`;
}

/* CNAE de transporte de carga do MEI Caminhoneiro (4930-2/01 a /04) */
export function ehCnaeCaminhoneiro(codigo) {
  return soDigitosCnae(codigo).startsWith(INICIO_CNAE_CAMINHONEIRO);
}

/* ============================ NOME ============================ */

/* Primeira letra maiuscula, tambem depois de hifen e apostrofo
   ("ANA-CLARA D'ÁVILA" -> "Ana-Clara D'Ávila") */
function primeiraMaiuscula(palavra) {
  return palavra
    .split(/([-'’])/)
    .map((parte) => (parte ? parte.charAt(0).toLocaleUpperCase("pt-BR") + parte.slice(1) : parte))
    .join("");
}

/* "12.345.678 FULANO DE TAL" ou "FULANO DE TAL 12345678900" -> "Fulano de Tal" */
export function nomeDaRazaoSocial(razao) {
  let s = texto(razao).normalize("NFC").replace(/\s+/g, " ").trim();
  s = s.replace(/^\d[\d.\-/ ]*/, ""); // numero do comeco (raiz do CNPJ)
  s = s.replace(/[ ,\-/]*\d[\d.\-/ ]*$/, ""); // numero solto do fim (CPF)
  s = s.replace(/^[ ,\-/]+|[ ,\-/]+$/g, ""); // sobra de tracinho ou barra
  if (!s) return "";
  return s
    .toLocaleLowerCase("pt-BR")
    .split(" ")
    .filter(Boolean)
    .map((p, i) => (i > 0 && PALAVRAS_MINUSCULAS.has(p) ? p : primeiraMaiuscula(p)))
    .join(" ");
}

/* ============================ DATAS ============================ */

function diasNoMes(ano, mes) {
  if (mes === 2) return (ano % 4 === 0 && ano % 100 !== 0) || ano % 400 === 0 ? 29 : 28;
  return [4, 6, 9, 11].includes(mes) ? 30 : 31;
}

/* "2021-03-15" (ou "2021-03-15T...", ou "15/03/2021") -> "2021-03-15".
   Data que nao existe (31/02, mes 13) ou vazia -> null. So texto, sem fuso. */
function dataIso(valor) {
  const t = texto(valor).trim();
  let ano;
  let mes;
  let dia;
  let m = /^(\d{4})-(\d{2})-(\d{2})(?:$|[T ])/.exec(t);
  if (m) {
    [ano, mes, dia] = [Number(m[1]), Number(m[2]), Number(m[3])];
  } else {
    m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(t);
    if (!m) return null;
    [dia, mes, ano] = [Number(m[1]), Number(m[2]), Number(m[3])];
  }
  if (ano < 1900 || mes < 1 || mes > 12 || dia < 1 || dia > diasNoMes(ano, mes)) return null;
  return `${String(ano).padStart(4, "0")}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

/* Ano de hoje no horario de Brasilia (so quando quem chama nao informa) */
function anoHojeNoBrasil(agora = new Date()) {
  try {
    const ano = Number(
      new Intl.DateTimeFormat("en-US", { timeZone: "America/Sao_Paulo", year: "numeric" }).format(agora)
    );
    if (Number.isInteger(ano)) return ano;
  } catch {
    /* aparelho sem a tabela de fusos: usa o ano do proprio aparelho */
  }
  return agora.getFullYear();
}

/* Mes e ano em que virou MEI, SO se foi neste ano (limite proporcional).
   "2026-03-15", 2026 -> { mes: 3, ano: 2026 }. Outro ano ou invalido -> null */
export function mesAnoDaOpcaoMei(dataOpcaoMei, anoAtual = anoHojeNoBrasil()) {
  const iso = dataIso(dataOpcaoMei);
  if (!iso) return null;
  const ano = Number(iso.slice(0, 4));
  const mes = Number(iso.slice(5, 7));
  if (ano !== Number(anoAtual)) return null;
  return { mes, ano };
}

/* "2021-03-15" -> "03/2021" (para "MEI desde 03/2021"). Invalido -> "" */
export function mesAnoTexto(dataISO) {
  const iso = dataIso(dataISO);
  if (!iso) return "";
  return `${iso.slice(5, 7)}/${iso.slice(0, 4)}`;
}

/* ============================ BRASILAPI ============================ */

function falha() {
  return { ok: false, motivo: "falha" };
}

/* Transforma o JSON da BrasilAPI no formato do app */
function montarDados(c, digitos) {
  const razaoSocial = texto(c.razao_social).trim();
  const cnaePrincipal = soDigitosCnae(c.cnae_fiscal);

  const cnaesSecundarios = [];
  const lista = Array.isArray(c.cnaes_secundarios) ? c.cnaes_secundarios : [];
  for (const item of lista) {
    const cod = soDigitosCnae(item && typeof item === "object" ? item.codigo : item);
    if (cod && !cnaesSecundarios.includes(cod)) cnaesSecundarios.push(cod);
  }

  const opcao = c.opcao_pelo_mei;

  return {
    cnpj: digitos,
    razaoSocial,
    nome: nomeDaRazaoSocial(razaoSocial),
    nomeFantasia: texto(c.nome_fantasia).trim(),
    cnaePrincipal,
    cnaePrincipalDescricao: texto(c.cnae_fiscal_descricao).trim(),
    cnaesSecundarios,
    opcaoMei: opcao === true ? true : opcao === false ? false : null,
    dataOpcaoMei: dataIso(c.data_opcao_pelo_mei),
    situacao: texto(c.descricao_situacao_cadastral).trim(),
    dataInicioAtividade: dataIso(c.data_inicio_atividade),
    municipio: texto(c.municipio).trim(),
    uf: texto(c.uf).trim(),
    pareceCaminhoneiro:
      ehCnaeCaminhoneiro(cnaePrincipal) || cnaesSecundarios.some((cod) => ehCnaeCaminhoneiro(cod)),
  };
}

/* Le a resposta: 404 = nao achou; 2xx com JSON de CNPJ = ok; o resto = falha */
async function lerResposta(resp, digitos) {
  if (!resp || typeof resp !== "object") return falha();
  const status = Number(resp.status);
  if (status === 404) return { ok: false, motivo: "nao_encontrado" };
  const deuCerto = status > 0 ? status >= 200 && status < 300 : resp.ok === true;
  if (!deuCerto) return falha();

  let corpo;
  if (typeof resp.json === "function") corpo = await resp.json();
  else if (typeof resp.text === "function") corpo = JSON.parse(await resp.text());
  else return falha();

  if (!corpo || typeof corpo !== "object" || Array.isArray(corpo)) return falha();
  /* Tem de parecer um cadastro de CNPJ, e do CNPJ que foi pedido */
  if (corpo.razao_social == null && corpo.cnpj == null) return falha();
  /* padStart: se o CNPJ vier como numero, os zeros da frente somem (191) */
  const cnpjDaResposta = todosOsDigitos(corpo.cnpj);
  if (cnpjDaResposta && cnpjDaResposta.padStart(14, "0") !== digitos) return falha();

  return { ok: true, dados: montarDados(corpo, digitos) };
}

/**
 * Busca os dados publicos do CNPJ na BrasilAPI. Nunca da erro:
 *   { ok: false, motivo: "invalido" }        CNPJ errado (nem vai na internet)
 *   { ok: false, motivo: "nao_encontrado" }  a Receita ainda nao tem esse CNPJ
 *   { ok: false, motivo: "falha" }           sem internet, demorou, servidor fora...
 *   { ok: true, dados }                      deu certo
 * opcoes = { timeoutMs = 8000, fetchImpl }:
 *   timeoutMs: tempo maximo em ms (fora de 1 ms a 2 min, usa 8000).
 *   fetchImpl: so para teste (troca o fetch de verdade por um falso).
 */
export async function buscarCnpj(cnpj, opcoes = {}) {
  /* opcoes null ou nao-objeto nao pode fazer a busca dar erro */
  const { timeoutMs = TEMPO_LIMITE_PADRAO, fetchImpl } =
    opcoes && typeof opcoes === "object" ? opcoes : {};
  if (!cnpjValido(cnpj)) return { ok: false, motivo: "invalido" };
  const digitos = todosOsDigitos(cnpj);

  const buscar =
    typeof fetchImpl === "function"
      ? fetchImpl
      : typeof globalThis.fetch === "function"
        ? (url, opcoes) => globalThis.fetch(url, opcoes)
        : null;
  if (!buscar) return falha();

  /* De 1 ms a 2 minutos. Acima de ~24 dias (ou Infinity) o setTimeout
     estoura e dispara na hora; por isso fora da faixa vale o padrao. */
  const pedidoMs = Number(timeoutMs);
  const limite = pedidoMs > 0 && pedidoMs <= TEMPO_LIMITE_MAXIMO ? pedidoMs : TEMPO_LIMITE_PADRAO;
  const controle = typeof AbortController === "function" ? new AbortController() : null;

  /* O relogio desiste sozinho, mesmo que o fetch nao respeite o "abort" */
  let relogio;
  const tempoEsgotado = new Promise((resolve) => {
    relogio = setTimeout(() => {
      try {
        controle?.abort();
      } catch {
        /* nada a fazer */
      }
      resolve(falha());
    }, limite);
  });

  const pedido = (async () => {
    try {
      const resp = await buscar(URL_BRASILAPI_CNPJ + digitos, { signal: controle?.signal });
      return await lerResposta(resp, digitos);
    } catch {
      return falha();
    }
  })();

  try {
    return await Promise.race([pedido, tempoEsgotado]);
  } catch {
    return falha();
  } finally {
    clearTimeout(relogio);
  }
}
