/* EXTRATO v1 — leitura do extrato do banco (OFX e CSV) no proprio aparelho, corte do periodo e impressao digital de cada transacao para nunca contar duas vezes */

/* ===================================================================
   EXTRATO DO BANCO — REGRAS (escrito em 10/10/2026)

   POR QUE ESTE ARQUIVO
   - A pessoa baixa o extrato no app do banco (Nubank, Inter, Itau,
     Bradesco, BB, Caixa, Santander, Sicoob, Sicredi, C6, Mercado Pago,
     PicPay...) e manda no TaCerto. Creditos viram "entradas" (a pessoa
     confirma se e faturamento) e debitos viram "saidas" (gastos).
   - A leitura e feita AQUI, no aparelho: sem IA e sem servidor. O
     arquivo do banco nao sai do celular; so vai para o Supabase o que
     sobrar depois do corte do periodo (ver abaixo).
   - JavaScript puro (sem React, sem "@/"), para testar direto no node.

   ORDEM DE USO (a tela faz assim)
     1. lerArquivoComoTexto(file)        -> texto (acento certo)
     2. lerExtrato(texto) ou lerOFX/lerCSV -> transacoes
     3. cortarPeriodo(transacoes, {...})  -> so o que vale guardar
     4. gerarChaves(dentro, { conta })    -> impressao digital
     5. separarCreditosDebitos(...)       -> entradas e saidas
   ⚠️ gerarChaves ANTES de separarCreditosDebitos: a chave usa o valor
     COM sinal (credito de 100 e debito de 100 no mesmo dia sao coisas
     diferentes). Depois de separar, o debito fica positivo.

   LETRAS (ACENTO)
   - Bancos brasileiros mandam OFX em "CHARSET:1252" (o jeito antigo do
     Windows de guardar acento). Primeiro tenta UTF-8 (o jeito novo);
     se o arquivo nao for UTF-8 valido, le como windows-1252. Assim
     "ALIMENTAÇÃO" nao vira "ALIMENTA��O".

   OFX (o formato "oficial" de extrato)
   - Versao 1.x e meio torta: as tags NAO fecham ("<TRNAMT>-50.00" e a
     linha seguinte ja e outra tag). A versao 2.x e XML (fecha tudo).
     Por isso o valor de cada campo e "tudo ate o proximo <": funciona
     nos dois e tambem quando o arquivo vem todo numa linha so.
   - Data: so os 8 primeiros digitos (AAAAMMDD); hora e fuso
     ("120000[-3:BRT]") sao jogados fora, para o fuso do celular nao
     mudar o dia.
   - Valor: ponto OU virgula como decimal ("-1.234,56" de alguns
     bancos, "1234.56", "-50,00").
   - Alguns bancos mandam debito POSITIVO com TRNTYPE=DEBIT. So quando o
     arquivo inteiro NAO tem nenhum valor negativo (sinal de que o banco
     nao usa o sinal), os tipos de saida (DEBIT, PAYMENT, POS...) viram
     negativos. Se ha algum negativo, o sinal do banco manda.

   CSV (planilha em texto)
   - Cada banco tem um jeito: separador ";" "," ou TAB; titulo, agencia
     e conta antes do cabecalho; aspas; linhas de SALDO no meio. As
     colunas sao achadas pelo NOME do cabecalho (sem acento, minusculo).
   - Valor numa coluna so, ou em duas ("Credito" e "Debito"), ou com
     uma coluna de tipo ("C"/"D", "Entrada"/"Saída").
   - "1.850" e mil oitocentos e cinquenta ou um virgula oito? Olha o
     arquivo inteiro: se os valores usam virgula para centavos
     ("250,50"), o ponto e de milhar. Se usam ponto ("250.50"), a
     virgula e de milhar.
   - Linhas de saldo ("SALDO", "SALDO ANTERIOR", "S A L D O" do BB) NAO
     sao transacao: ignoradas. Linha com data ou valor que nao da para
     entender e pulada sem quebrar o resto.
   - Bradesco e outros quebram a descricao em 2 linhas (a de baixo sem
     data e sem valor): a de baixo e juntada na de cima.
   - Sem cabecalho nenhum (Itau as vezes): acha a coluna de data e a de
     valor olhando o conteudo.
   - Cartao do Nubank ("date,title,amount"): la a compra vem POSITIVA.
     Nesse formato o sinal e virado (compra vira saida).

   CPF / CNPJ NA DESCRICAO
   - So vira documento se os digitos verificadores estiverem certos
     (conta oficial "modulo 11"). Assim numero de conta, agencia ou
     telefone nao vira CPF por engano. CPF escondido pelo banco
     ("•••.456.789-••") nao vira documento.
   - CNPJ com letras (empresas novas, desde jul/2026) ainda nao e
     reconhecido (igual src/lib/cnpj.js).

   PERIODO (REGRA DO PRODUTO)
   - So vale de 1º/jan a 31/dez do ano atual. Se o MEI abriu NESTE ano,
     so da abertura (dia 1 do mes) em diante. O resto e DESCARTADO antes
     de guardar. Datas comparadas como TEXTO "AAAA-MM-DD" (sem
     new Date(texto), que muda o dia por causa do fuso).

   IMPRESSAO DIGITAL (chave) — PARA NUNCA CONTAR DUAS VEZES
   - A pessoa pode mandar o mesmo extrato 2 vezes, ou um de jan-mar e
     depois um de mar-jun (marco repete). Cada transacao ganha uma chave
     curta; chave igual = mesma transacao = nao entra de novo.
   - Com o codigo do banco (FITID no OFX, "Identificador" no Nubank):
       "id|conta|codigo|valor"   -> mesmo arquivo de novo, mesma chave.
   - Sem codigo: "sem-id|data|valor|descricao|ocorrencia". Ocorrencia
     conta 1, 2, 3... as transacoes IGUAIS (mesma data, valor e
     descricao) dentro do mesmo arquivo, na ordem. Duas compras iguais
     no mesmo dia continuam duas (1 e 2); o mesmo arquivo 2x da as
     mesmas chaves (1 e 2 de novo).
   - Codigo do banco repetido em transacoes DIFERENTES (mesmo codigo e
     valor, mas outra data ou descricao) nao e codigo de verdade: essas
     ficam sem id e usam a regra "sem codigo".
   - Conta: FNV-1a de 64 bits (BigInt). Rapida, sem servidor e sempre
     da o mesmo resultado para o mesmo texto.
   - O mesmo mes mandado uma vez em OFX e outra em CSV gera chaves
     diferentes (o banco escreve diferente em cada um). A tela deve
     pedir sempre o mesmo formato.
   =================================================================== */

const MESES_CURTOS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/* Tipos de transacao do OFX que sao saida de dinheiro */
const TIPOS_SAIDA_OFX = new Set(["DEBIT", "PAYMENT", "CHECK", "ATM", "POS", "FEE", "SRVCHG", "DIRECTDEBIT", "CASH"]);

/* Nome legivel do tipo do OFX, quando a transacao vem sem NAME e MEMO */
const ROTULO_TIPO_OFX = {
  CREDIT: "Crédito",
  DEBIT: "Débito",
  INT: "Juros",
  DIV: "Dividendos",
  FEE: "Tarifa",
  SRVCHG: "Tarifa",
  DEP: "Depósito",
  ATM: "Saque",
  POS: "Compra",
  XFER: "Transferência",
  CHECK: "Cheque",
  PAYMENT: "Pagamento",
  CASH: "Saque",
  DIRECTDEP: "Depósito",
  DIRECTDEBIT: "Débito automático",
  OTHER: "Outro",
};

/* ========================= TEXTO ========================= */

/* Texto limpo: sem caracteres de controle e sem espacos repetidos */
function limparTexto(valor) {
  if (valor == null) return "";
  return String(valor)
    .replace(/[\u0000-\u001F\u007F ﻿]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function semAcento(s) {
  return String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/* Maiusculo e sem acento, MESMO TAMANHO do original (letra por letra).
   Serve para procurar padroes ignorando acento e depois cortar o texto
   original nas mesmas posicoes (o nome volta como o banco escreveu). */
function normalizarMesmoTamanho(s) {
  let out = "";
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    let m = c.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase();
    if (c === "–" || c === "—" || c === "−") m = "-";
    out += m.length === 1 ? m : c;
  }
  return out;
}

/* Descricao comparavel: maiusculo, sem acento, espacos unicos */
function normalizarDescricao(s) {
  return semAcento(limparTexto(s)).toUpperCase().replace(/\s+/g, " ").trim();
}

/* &amp; &lt; &gt; &quot; &apos; &#233; &#xE9; -> letras de verdade */
function decodificarEntidades(s) {
  return String(s).replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (inteiro, e) => {
    const k = e.toLowerCase();
    if (k[0] === "#") {
      const cod = k[1] === "x" ? parseInt(k.slice(2), 16) : parseInt(k.slice(1), 10);
      try {
        return String.fromCodePoint(cod);
      } catch {
        return inteiro;
      }
    }
    return { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " }[k];
  });
}

/* ========================= ARQUIVO ========================= */

/* Que tipo de arquivo e, pelo nome e pelo tipo (mime) que o celular
   informa. "ofx" | "csv" | "pdf" | null (nao da para ler). */
export function detectarTipoArquivo(nome, mime) {
  const n = String(nome ?? "").trim().toLowerCase();
  const t = String(mime ?? "").trim().toLowerCase().split(";")[0].trim();
  const ponto = n.lastIndexOf(".");
  const ext = ponto >= 0 ? n.slice(ponto + 1) : "";

  if (ext === "ofx" || ext === "qfx") return "ofx";
  if (ext === "csv" || ext === "txt" || ext === "tsv") return "csv";
  if (ext === "pdf") return "pdf";
  // Planilha do Excel de verdade (binaria) nao da para ler aqui
  if (ext === "xls" || ext === "xlsx" || ext === "ods" || ext === "numbers") return null;

  if (t === "application/pdf") return "pdf";
  if (["application/x-ofx", "application/ofx", "application/vnd.intu.qfx", "application/x-qfx", "text/ofx"].includes(t)) return "ofx";
  if (["text/csv", "text/comma-separated-values", "application/csv", "text/x-csv", "application/x-csv", "text/tab-separated-values"].includes(t)) return "csv";
  // application/vnd.ms-excel: o iPhone usa para .csv, mas tambem e o
  // tipo do .xls. So vale se o nome terminar em .csv (ja tratado acima).
  if (t === "text/plain" && !ext) return "csv";
  return null;
}

/* Bytes do arquivo -> texto. Tenta UTF-8; se nao for UTF-8 valido, le
   como windows-1252 (o "latin1" dos bancos). Tira o BOM do comeco. */
export function decodificarTexto(arrayBuffer) {
  let bytes;
  if (arrayBuffer instanceof ArrayBuffer) bytes = new Uint8Array(arrayBuffer);
  else if (ArrayBuffer.isView(arrayBuffer)) bytes = new Uint8Array(arrayBuffer.buffer, arrayBuffer.byteOffset, arrayBuffer.byteLength);
  else return limparBom(String(arrayBuffer ?? ""));

  // UTF-16 com marca no comeco (Excel "Texto Unicode")
  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) return limparBom(new TextDecoder("utf-16le").decode(bytes));
  if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) return limparBom(new TextDecoder("utf-16be").decode(bytes));

  let texto;
  try {
    texto = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    texto = new TextDecoder("windows-1252").decode(bytes);
  }
  return limparBom(texto);
}

function limparBom(s) {
  return s.charCodeAt(0) === 0xfeff ? s.slice(1) : s;
}

/* No navegador: File (do <input type="file">) -> texto */
export async function lerArquivoComoTexto(file) {
  if (file && typeof file.arrayBuffer === "function") return decodificarTexto(await file.arrayBuffer());
  // Safari antigo sem Blob.arrayBuffer
  const buffer = await new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onload = () => resolve(leitor.result);
    leitor.onerror = () => reject(leitor.error || new Error("Não consegui abrir o arquivo."));
    leitor.readAsArrayBuffer(file);
  });
  return decodificarTexto(buffer);
}

/* O texto parece OFX? (vale para .txt com OFX dentro) */
export function pareceOFX(texto) {
  return /OFXHEADER\s*:|<\?OFX|<OFX>|<STMTTRN>/i.test(String(texto ?? "").slice(0, 20000));
}

/* Atalho: le OFX ou CSV olhando o CONTEUDO (o nome do arquivo engana) */
export function lerExtrato(texto, tipo = null) {
  if (tipo === "pdf") throw new Error("PDF ainda não dá para ler aqui. Baixe o extrato em OFX ou CSV no app do banco.");
  if (pareceOFX(texto)) {
    const r = lerOFX(texto);
    return { transacoes: r.transacoes, conta: r.conta, banco: r.banco, origem: "ofx" };
  }
  const r = lerCSV(texto);
  return { transacoes: r.transacoes, conta: "", banco: "", origem: "csv" };
}

/* ========================= DATAS ========================= */

function diasNoMes(ano, mes) {
  if (mes === 2) return (ano % 4 === 0 && ano % 100 !== 0) || ano % 400 === 0 ? 29 : 28;
  return [4, 6, 9, 11].includes(mes) ? 30 : 31;
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

/* Numeros -> "AAAA-MM-DD", ou null se a data nao existe (31/02...) */
function dataIso(ano, mes, dia) {
  if (!Number.isInteger(ano) || !Number.isInteger(mes) || !Number.isInteger(dia)) return null;
  if (ano < 1900 || ano > 2100 || mes < 1 || mes > 12 || dia < 1 || dia > diasNoMes(ano, mes)) return null;
  return `${ano}-${pad2(mes)}-${pad2(dia)}`;
}

/* Data do OFX: so os 8 primeiros digitos (AAAAMMDD). Hora e fuso fora. */
function parsearDataOFX(texto) {
  const m = limparTexto(texto).match(/^(\d{4})(\d{2})(\d{2})/);
  return m ? dataIso(+m[1], +m[2], +m[3]) : null;
}

/* Data de CSV -> "AAAA-MM-DD" ou null.
   Aceita DD/MM/AAAA, DD/MM/AA (20AA), AAAA-MM-DD, DD-MM-AAAA, DD.MM.AAAA
   e AAAAMMDD, com ou sem hora depois. Se o "mes" passa de 12 e o "dia"
   nao, e data americana (MM/DD): troca. */
export function parsearData(texto) {
  const s = limparTexto(texto).replace(/^["']+|["']+$/g, "");
  if (!s) return null;
  let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?=$|[\sT,])/);
  if (m) return dataIso(+m[1], +m[2], +m[3]);
  m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4}|\d{2})(?=$|[\sT,])/);
  if (m) {
    let ano = +m[3];
    if (m[3].length === 2) ano += 2000;
    let dia = +m[1];
    let mes = +m[2];
    if (mes > 12 && dia <= 12) [dia, mes] = [mes, dia];
    return dataIso(ano, mes, dia);
  }
  m = s.match(/^(20\d{2})(\d{2})(\d{2})(?:\d{6})?(?=$|[\s.[])/);
  if (m) return dataIso(+m[1], +m[2], +m[3]);
  return null;
}

/* ========================= VALORES ========================= */

function arredondar(v) {
  const r = Math.round(v * 100) / 100;
  return Object.is(r, -0) ? 0 : r;
}

/* Valor com 2 casas em texto (para a chave): -250.5 -> "-250.50" */
function valor2(v) {
  return arredondar(Number(v) || 0).toFixed(2);
}

/* So digitos, "." e "," -> numero. estilo: "br" (virgula = centavos),
   "ponto" (ponto = centavos) ou null (adivinha valor por valor). */
function interpretarNumero(d, estilo) {
  const v = d.lastIndexOf(",");
  const p = d.lastIndexOf(".");
  let sepDec = null;
  if (v >= 0 && p >= 0) {
    sepDec = v > p ? "," : "."; // o ultimo separador e o dos centavos
  } else if (v >= 0 || p >= 0) {
    const sep = v >= 0 ? "," : ".";
    const qtd = d.split(sep).length - 1;
    const depois = d.length - d.lastIndexOf(sep) - 1;
    if (qtd > 1) sepDec = null; // 1.234.567 -> so milhar
    else if (depois !== 3) sepDec = sep; // 250,5 / 250.50 -> centavos
    else if (estilo === "br") sepDec = sep === "," ? "," : null; // 1.850 -> 1850
    else if (estilo === "ponto") sepDec = sep === "." ? "." : null; // 1,850 -> 1850
    else sepDec = sep; // sem pista: trata como centavos
  }
  let inteiro;
  let dec = "";
  if (sepDec) {
    const k = d.lastIndexOf(sepDec);
    inteiro = d.slice(0, k).replace(/[.,]/g, "");
    dec = d.slice(k + 1).replace(/[.,]/g, "");
  } else {
    inteiro = d.replace(/[.,]/g, "");
  }
  if (!inteiro && !dec) return NaN;
  return Number(`${inteiro || "0"}.${dec || "0"}`);
}

/* Texto de valor -> numero com sinal (2 casas) ou NaN.
   "1.234,56" "-1.234,56" "1234.56" "R$ 1.234,56" "(1.234,56)" (negativo)
   "1.234,56 D" e "1.234,56-" (negativo) "1.234,56 C" (positivo). */
export function parsearValor(texto, estilo = null) {
  if (typeof texto === "number") return Number.isFinite(texto) ? arredondar(texto) : NaN;
  let s = limparTexto(texto).toUpperCase().replace(/[−–—]/g, "-");
  if (!s) return NaN;
  let negativo = false;
  if (/^\(.*\)$/.test(s)) {
    negativo = true;
    s = s.slice(1, -1).trim();
  }
  const sufixo = s.match(/^(.*\d[.,]?)\s*(DEB|DB|D|CRED|CR|C)\.?$/);
  if (sufixo) {
    s = sufixo[1].trim();
    if (sufixo[2][0] === "D") negativo = true;
  }
  s = s.replace(/R\$/g, "").replace(/\s+/g, "");
  if (/^\(.*\)$/.test(s)) {
    negativo = true;
    s = s.slice(1, -1);
  }
  if (/-$/.test(s)) {
    negativo = true;
    s = s.slice(0, -1);
  }
  if (/^[+-]/.test(s)) {
    if (s.replace(/[^+-]/g, "").includes("-")) negativo = true;
    s = s.replace(/^[+-]+/, "");
  }
  if (!/^[\d.,]+$/.test(s) || !/\d/.test(s)) return NaN;
  const n = interpretarNumero(s, estilo);
  if (!Number.isFinite(n)) return NaN;
  return arredondar(negativo ? -n : n);
}

/* ========================= CPF / CNPJ ========================= */

/* true so com 11 digitos, nao todos iguais, e os 2 DV certos */
export function cpfValido(valor) {
  const d = String(valor ?? "").replace(/\D/g, "");
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const dv = (n) => {
    let soma = 0;
    for (let i = 0; i < n; i++) soma += Number(d[i]) * (n + 1 - i);
    const r = (soma * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return dv(9) === Number(d[9]) && dv(10) === Number(d[10]);
}

/* true so com 14 digitos, nao todos iguais, e os 2 DV certos */
export function cnpjValido(valor) {
  const d = String(valor ?? "").replace(/\D/g, "");
  if (d.length !== 14 || /^(\d)\1{13}$/.test(d)) return false;
  const dv = (pesos) => {
    let soma = 0;
    for (let i = 0; i < pesos.length; i++) soma += Number(d[i]) * pesos[i];
    const r = soma % 11;
    return r < 2 ? 0 : 11 - r;
  };
  return (
    dv([5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]) === Number(d[12]) &&
    dv([6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]) === Number(d[13])
  );
}

/* Primeiro CPF (11) ou CNPJ (14) VALIDO no texto, so digitos, ou null.
   Pedaco grudado em "•" ou "*" (CPF escondido pelo banco) nao conta. */
export function extrairDocumento(texto) {
  const s = String(texto ?? "");
  const re = /(^|[^\d•*])(\d[\d./-]{9,20}\d)(?![\d•*])/g;
  let m;
  while ((m = re.exec(s)) !== null) {
    const d = m[2].replace(/\D/g, "");
    if (d.length === 14 && cnpjValido(d)) return d;
    if (d.length === 11 && cpfValido(d)) return d;
  }
  return null;
}

/* Campo proprio de CPF/CNPJ (coluna do CSV) -> so digitos, ou null */
function documentoDoCampo(texto) {
  const s = limparTexto(texto);
  if (!s || /[•*]/.test(s)) return null;
  const d = s.replace(/\D/g, "");
  if (d.length === 11 && cpfValido(d)) return d;
  if (d.length === 14 && cnpjValido(d)) return d;
  return null;
}

/* ========================= NOME DO PAGADOR ========================= */

/* Comecos de descricao que vem antes do nome de quem pagou/recebeu.
   Procurados no texto em maiusculo e sem acento. */
const PREFIXOS_NOME = [
  // "Transferência recebida pelo Pix - NOME - ...", "Transferência Pix recebida NOME"
  /^TRANSFERENCIA\s+(?:PIX\s+)?(?:RECEBIDA|ENVIADA|RECEBIDO|ENVIADO)(?:\s+(?:PELO|VIA)\s+PIX|\s+PIX)?(?=[\s\-:]|$)\s*[-:]?\s*(?:(?:DE|PARA)\s+)?/,
  // "Pix - Recebido - 05/03 14:22 NOME" (BB)
  /^PIX\s*-\s*(?:RECEBIDO|ENVIADO|RECEBIDA|ENVIADA)(?=[\s\-:]|$)\s*[-:]?\s*/,
  // "PIX RECEBIDO - NOME", "PIX REC NOME", "PIX ENVIADO NOME", "PIX TRANSF NOME05/03"
  /^PIX\s+(?:RECEBIDO|RECEBIDA|ENVIADO|ENVIADA|REC|ENV|TRANSFERENCIA|TRANSF|QRS|QR\s+CODE|QR)\.?(?=[\s\-:]|$)\s*[-:]?\s*(?:(?:DE|PARA)\s+)?/,
  // "TED RECEBIDA NOME", "DOC ENVIADO NOME"
  /^(?:TED|DOC|TEV)\s+(?:(?:RECEBIDA|RECEBIDO|ENVIADA|ENVIADO|REC|ENV|CREDITO|DEBITO)(?=[\s\-:]|$))?\s*[-:]?\s*(?:(?:DE|PARA)\s+)?/,
  // "TRANSF RECEBIDA NOME"
  /^TRANSF(?:ERENCIA)?\.?\s+(?:RECEBIDA|RECEBIDO|ENVIADA|ENVIADO|REC|ENV)(?=[\s\-:]|$)\s*[-:]?\s*(?:(?:DE|PARA)\s+)?/,
  // "Compra no débito - ESTABELECIMENTO", "Compra com cartão de crédito - LOJA"
  /^COMPRA\s+(?:(?:NO|COM)\s+)?(?:CARTAO\s+(?:DE\s+)?)?(?:DEBITO|CREDITO)(?=[\s\-:]|$)\s*[-:]?\s*/,
  // "Pagamento de boleto efetuado - NOME", "PAG BOLETO NOME"
  /^PAG(?:AMENTO|TO)?\.?\s+(?:DE\s+)?(?:BOLETO|TITULO|TIT\.?)(?:\s+EFETUADO)?(?=[\s\-:]|$)\s*[-:]?\s*/,
  // "Pagamento com QR Pix NOME" (Mercado Pago)
  /^PAGAMENTO\s+(?:COM\s+)?(?:QR\s+)?PIX(?=[\s\-:]|$)\s*[-:]?\s*/,
];

/* Onde o nome acaba: conta, agencia, documento, data, hora, codigo */
function primeiroCorte(n) {
  const cortes = [];
  const m1 = n.match(/\s(?:AG(?:ENCIA)?|CONTA|C\/C|CC|CPF|CNPJ|BCO)(?=[\s:.]|$)/);
  if (m1) cortes.push(m1.index);
  const m2 = n.match(/(^|[^\d])(?:[•*]|\d{2,3}\.\d{3}\.\d{3}|\d{6,}|\d{1,2}\/\d{1,2}(?:\/\d{2,4})?(?!\d)|\d{1,2}:\d{2}(?!\d))/);
  if (m2) cortes.push(m2.index + m2[1].length);
  return cortes.length ? Math.min(...cortes) : -1;
}

/* Nome de quem pagou/recebeu, tirado da descricao do banco, ou null.
   Volta como o banco escreveu (quem arruma maiusculas e a tela). */
export function extrairNome(descricao) {
  const original = limparTexto(descricao);
  if (!original) return null;
  const n = normalizarMesmoTamanho(original);

  let prefixo = null;
  for (const re of PREFIXOS_NOME) {
    prefixo = n.match(re);
    if (prefixo) break;
  }
  if (!prefixo) return null;

  let ini = prefixo[0].length;
  let fim = n.length;

  // So o primeiro pedaco ("NOME - documento - banco...")
  const seg = n.slice(ini).search(/\s+-\s+/);
  if (seg >= 0) fim = ini + seg;

  // Lixo no comeco: "05/03 14:22 00012345678 NOME"
  const lixo = n.slice(ini, fim).match(/^(?:[\d/.:\-*•]+\s+)+/);
  if (lixo) ini += lixo[0].length;

  const corte = primeiroCorte(n.slice(ini, fim));
  if (corte >= 0) fim = ini + corte;

  // Pontuacao solta no fim e parenteses com numero "(0001)"
  let pedaco = n.slice(ini, fim);
  const parenteses = pedaco.match(/\s*\(\s*\d[^)]*\)?\s*$/);
  if (parenteses) fim -= parenteses[0].length;
  pedaco = n.slice(ini, fim);
  const rabo = pedaco.match(/[\s\-:,.;/(|]+$/);
  if (rabo) fim -= rabo[0].length;

  if (!/[A-Z]{2}/.test(n.slice(ini, fim))) return null;
  return limparTexto(original.slice(ini, fim)) || null;
}

/* ========================= IDS DO BANCO ========================= */

/* Codigo do banco vazio, "0", "000" ou "-" nao e codigo */
function limparId(texto) {
  const s = limparTexto(texto);
  if (!s || /^[0\s.\-]*$/.test(s)) return null;
  return s;
}

/* Mesmo codigo + mesmo valor em transacoes DIFERENTES (outra data ou
   descricao): o banco nao gera codigo unico. Essas ficam sem id. */
function limparIdsRepetidos(lista) {
  const grupos = new Map();
  for (const t of lista) {
    if (!t.id) continue;
    const k = `${t.id}|${valor2(t.valor)}`;
    if (!grupos.has(k)) grupos.set(k, new Set());
    grupos.get(k).add(`${t.data}|${normalizarDescricao(t.descricao)}`);
  }
  for (const t of lista) {
    if (t.id && grupos.get(`${t.id}|${valor2(t.valor)}`).size > 1) t.id = null;
  }
  return lista;
}

/* ========================= OFX ========================= */

/* Valor de uma tag: tudo ate o proximo "<" (OFX 1.x e 2.x) */
function campoOFX(bloco, tag) {
  const m = bloco.match(new RegExp(`<${tag}>([^<]*)`, "i"));
  return m ? limparTexto(decodificarEntidades(m[1])) : "";
}

/* NAME e MEMO juntos sem repetir: "NAME - MEMO" */
function juntarNomeMemo(name, memo) {
  if (!name) return memo;
  if (!memo) return name;
  const a = normalizarDescricao(name);
  const b = normalizarDescricao(memo);
  if (a === b || a.includes(b)) return name;
  if (b.includes(a)) return memo;
  return `${name} - ${memo}`;
}

/* Texto do OFX -> { transacoes, conta, banco }. Lanca erro sem <STMTTRN>. */
export function lerOFX(texto) {
  const t = String(texto ?? "").replace(/^﻿/, "");
  const partes = t.split(/<STMTTRN>/i);
  if (partes.length < 2) throw new Error("OFX sem transações");

  const cabeca = partes[0];
  const conta = campoOFX(cabeca, "ACCTID") || campoOFX(t, "ACCTID");
  const banco = campoOFX(cabeca, "BANKID") || campoOFX(cabeca, "ORG") || campoOFX(t, "BANKID") || campoOFX(t, "ORG");

  const brutas = [];
  for (let i = 1; i < partes.length; i++) {
    let bloco = partes[i];
    const fimBloco = bloco.search(/<\/STMTTRN>|<\/BANKTRANLIST>|<\/STMTRS>|<\/CCSTMTRS>|<LEDGERBAL>|<AVAILBAL>/i);
    if (fimBloco >= 0) bloco = bloco.slice(0, fimBloco);

    const data = parsearDataOFX(campoOFX(bloco, "DTPOSTED")) || parsearDataOFX(campoOFX(bloco, "DTUSER"));
    const valor = parsearValor(campoOFX(bloco, "TRNAMT"));
    if (!data || !Number.isFinite(valor)) continue; // transacao quebrada: pula

    brutas.push({
      tipo: campoOFX(bloco, "TRNTYPE").toUpperCase(),
      data,
      valor,
      name: campoOFX(bloco, "NAME"),
      memo: campoOFX(bloco, "MEMO"),
      fitid: campoOFX(bloco, "FITID"),
      checknum: campoOFX(bloco, "CHECKNUM"),
      refnum: campoOFX(bloco, "REFNUM"),
    });
  }
  if (!brutas.length) throw new Error("OFX sem transações");

  // Banco que manda debito positivo (ver regras no topo)
  if (!brutas.some((b) => b.valor < 0)) {
    for (const b of brutas) if (TIPOS_SAIDA_OFX.has(b.tipo) && b.valor > 0) b.valor = -b.valor;
  }

  const transacoes = brutas.map((b) => {
    let descricao = juntarNomeMemo(b.name, b.memo);
    if (!descricao) {
      const doc = b.checknum || b.refnum;
      descricao = doc ? `Documento ${doc}` : ROTULO_TIPO_OFX[b.tipo] || b.tipo || "";
    }
    descricao = limparTexto(descricao);
    const nome = extrairNome(descricao) || (b.name && b.memo ? extrairNome(`${b.memo} - ${b.name}`) : null);
    return {
      data: b.data,
      valor: b.valor,
      descricao,
      nome: nome || null,
      documento: extrairDocumento(descricao),
      id: limparId(b.fitid),
      origem: "ofx",
    };
  });
  limparIdsRepetidos(transacoes);
  return { transacoes, conta, banco };
}

/* ========================= CSV ========================= */

/* Quebra o texto em linhas e colunas respeitando aspas ("a;b" e "").
   aspasAtravessamLinha=false: uma aspa sem par nao engole o resto. */
function quebrarCSV(texto, sep, aspasAtravessamLinha = true) {
  const linhas = [];
  let linha = [];
  let campo = "";
  let aspas = false;
  let abertaNoFim = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (aspas) {
      if (c === '"') {
        if (texto[i + 1] === '"') {
          campo += '"';
          i++;
        } else aspas = false;
        continue;
      }
      if ((c === "\n" || c === "\r") && !aspasAtravessamLinha) {
        aspas = false; // fecha na marra e segue para o fim da linha abaixo
      } else {
        campo += c;
        continue;
      }
    }
    if (c === '"' && campo.trim() === "") {
      aspas = true;
      campo = "";
      continue;
    }
    if (c === sep) {
      linha.push(campo);
      campo = "";
      continue;
    }
    if (c === "\n" || c === "\r") {
      if (c === "\r" && texto[i + 1] === "\n") i++;
      linha.push(campo);
      linhas.push(linha);
      linha = [];
      campo = "";
      continue;
    }
    campo += c;
  }
  if (aspas) abertaNoFim = true;
  if (campo !== "" || linha.length) {
    linha.push(campo);
    linhas.push(linha);
  }
  return { linhas, abertaNoFim };
}

function quebrarCSVSeguro(texto, sep) {
  const r = quebrarCSV(texto, sep, true);
  return r.abertaNoFim ? quebrarCSV(texto, sep, false).linhas : r.linhas;
}

/* Celula limpa (Excel as vezes escreve ="123") */
function limparCelula(s) {
  return limparTexto(String(s ?? "").replace(/^\s*="(.*)"\s*$/, "$1"));
}

/* Nome de coluna comparavel: sem acento, minusculo, "_" vira espaco */
function normalizarCabecalho(s) {
  return semAcento(limparCelula(s)).toLowerCase().replace(/_+/g, " ").replace(/["']/g, "").replace(/\s+/g, " ").trim();
}

const PALAVRAS_DESCRICAO = [
  "descricao", "historico", "lancamento", "memo", "description", "detalhe", "titulo", "title",
  "estabelecimento", "complemento", "transaction type", "transacao", "operacao", "informac", "observac",
];
const PALAVRAS_NOME = ["favorecido", "pagador", "beneficiario", "remetente", "destinatario", "recebedor", "contraparte", "nome"];
const TIPO_EXATO = new Set([
  "d/c", "c/d", "dc", "cd", "d c", "c d", "sinal", "deb cred", "cred deb", "deb/cred", "cred/deb", "e/s", "s/e",
]);

/* Papel de uma coluna pelo nome do cabecalho (a ordem importa:
   "Data Lançamento" e data, "Tipo Lançamento" e tipo, "Saldo" fora) */
function papelDaColuna(n) {
  const p = n.split(/[^a-z0-9$]+/).filter(Boolean);
  const tem = (palavra) => p.includes(palavra);
  if (tem("saldo") || tem("balance")) return "saldo";
  if (tem("data") || tem("date") || tem("dt") || n === "dia") return "data";
  if (n.includes("cpf") || n.includes("cnpj")) return "documento";
  const credito = n.includes("credito") || tem("entrada") || tem("entradas") || tem("credit") || tem("credits");
  const debito = n.includes("debito") || tem("saida") || tem("saidas") || tem("debit") || tem("debits");
  if (p[0] === "tipo" || n.includes("natureza") || TIPO_EXATO.has(n) || (credito && debito)) return "tipo";
  if (credito) return "credito";
  if (debito) return "debito";
  if (n.includes("valor") || tem("value") || tem("amount") || tem("quantia") || tem("montante") || tem("importe") || n === "r$") return "valor";
  if (tem("id") || tem("fitid") || tem("nsu") || n.includes("identificador") || n.includes("codigo da transacao") || n.includes("cod transacao")) return "id";
  if (PALAVRAS_NOME.some((x) => tem(x)) || (tem("origem") && tem("destino"))) return "nome";
  if (PALAVRAS_DESCRICAO.some((x) => n.includes(x))) return "descricao";
  return null; // inclui "documento"/"Nº doc": numero do banco, nao e codigo unico
}

/* Uma linha e o cabecalho? Devolve o mapa das colunas ou null */
function mapearCabecalho(celulas) {
  const m = { data: -1, valor: -1, credito: -1, debito: -1, tipo: -1, id: -1, documento: -1, nome: -1, descricoes: [], reconhecidas: 0, inverter: false };
  celulas.forEach((cel, i) => {
    const n = normalizarCabecalho(cel);
    if (!n || n.length > 40) return; // celula comprida nao e nome de coluna
    const papel = papelDaColuna(n);
    if (!papel) return;
    m.reconhecidas++;
    if (papel === "saldo") return;
    if (papel === "descricao") {
      m.descricoes.push(i);
      return;
    }
    if (papel === "nome") {
      if (m.nome < 0) m.nome = i;
      m.descricoes.push(i);
      return;
    }
    if (m[papel] < 0) m[papel] = i;
  });
  if (m.data < 0) return null;
  if (m.valor < 0 && m.credito < 0 && m.debito < 0) return null;
  if (parsearData(celulas[m.data])) return null; // e linha de dado, nao cabecalho
  // Cartao do Nubank: "date,title,amount" com compra positiva
  const nomes = celulas.map(normalizarCabecalho).filter(Boolean).join(",");
  if (nomes === "date,title,amount") m.inverter = true;
  return m;
}

const RE_DINHEIRO = /^\(?[+\-−]?\s*(?:R\$)?\s*[+\-−]?\s*\d{1,3}(?:[.,]?\d{3})*(?:[.,]\d{1,2})?\s*-?\)?\s*(?:D|C)?$/i;

/* Sem cabecalho: acha data, valor e descricao olhando o conteudo */
function mapearSemCabecalho(regs) {
  const amostra = regs.filter((r) => r.some((c) => limparCelula(c))).slice(0, 80);
  const contagem = new Map();
  for (const r of amostra) {
    const k = r.findIndex((c) => parsearData(limparCelula(c)));
    if (k >= 0) contagem.set(k, (contagem.get(k) || 0) + 1);
  }
  let colData = -1;
  let maior = 0;
  for (const [k, qtd] of contagem) if (qtd > maior) [colData, maior] = [k, qtd];
  if (colData < 0) return null;

  const linhas = amostra.filter((r) => parsearData(limparCelula(r[colData])));
  const nCol = Math.max(...linhas.map((r) => r.length));
  const candidatas = [];
  for (let j = 0; j < nCol; j++) {
    if (j === colData) continue;
    let ok = 0;
    let centavos = 0;
    for (const r of linhas) {
      const c = limparCelula(r[j]);
      if (c && RE_DINHEIRO.test(c) && !parsearData(c)) {
        ok++;
        if (/[.,]\d{2}(?!\d)/.test(c)) centavos++;
      }
    }
    if (ok >= Math.ceil(linhas.length * 0.6)) candidatas.push({ j, comCentavos: centavos >= Math.ceil(linhas.length * 0.6) });
  }
  if (!candidatas.length) return null;
  // A 1ª com centavos (valor vem antes do saldo); senao a 1ª que serve
  const colValor = (candidatas.find((c) => c.comCentavos) || candidatas[0]).j;

  let colDesc = -1;
  let letras = 0;
  for (let j = 0; j < nCol; j++) {
    if (j === colData || j === colValor) continue;
    const qtd = linhas.reduce((s, r) => s + (limparCelula(r[j]).match(/[A-Za-zÀ-ÿ]/g) || []).length, 0);
    if (qtd > letras) [colDesc, letras] = [j, qtd];
  }
  return {
    data: colData, valor: colValor, credito: -1, debito: -1, tipo: -1, id: -1, documento: -1, nome: -1,
    descricoes: colDesc >= 0 ? [colDesc] : [], reconhecidas: 0, inverter: false, pontos: linhas.length,
  };
}

/* O arquivo usa virgula ou ponto para os centavos? (ver regras) */
function estiloDosValores(regs, inicio, colunas) {
  let br = 0;
  let ponto = 0;
  for (let i = inicio; i < regs.length && i < inicio + 1000; i++) {
    for (const idx of colunas) {
      if (idx < 0) continue;
      const d = String(regs[i][idx] ?? "").replace(/[^\d.,]/g, "");
      if (!/\d/.test(d)) continue;
      const v = d.lastIndexOf(",");
      const p = d.lastIndexOf(".");
      if (v > p && d.length - v - 1 <= 2) br++;
      else if (p > v && d.length - p - 1 <= 2) ponto++;
    }
  }
  if (br > ponto) return "br";
  if (ponto > br) return "ponto";
  return null;
}

/* "C", "Crédito", "Entrada" -> +1; "D", "Débito", "Saída" -> -1; senao 0 */
function sinalDoTipo(texto) {
  const n = semAcento(limparTexto(texto)).toUpperCase();
  if (!n) return 0;
  if (/^(D|DB|DEB|DEBITO|S|SAIDA|SAQUE|DEBIT|OUT|-)$/.test(n) || /^(DEBITO|SAIDA)/.test(n)) return -1;
  if (/^(C|CR|CRED|CREDITO|E|ENTRADA|CREDIT|IN|\+)$/.test(n) || /^(CREDITO|ENTRADA)/.test(n)) return 1;
  return 0;
}

/* Linha de saldo: "SALDO", "SALDO ANTERIOR", "S A L D O", "SDO CTA..." */
function ehSaldo(texto) {
  const n = semAcento(limparTexto(texto)).toUpperCase();
  return /^[^A-Z0-9]*(?:S\s*A\s*L\s*D\s*O|SDO)(?![A-Z])/.test(n);
}

/* Partes da descricao juntas, sem repetir: "Pix recebido - NOME" */
function juntarPartes(partes) {
  const fica = [];
  for (const parte of partes) {
    const p = limparTexto(parte);
    if (!p) continue;
    const np = normalizarDescricao(p);
    if (fica.some((f) => normalizarDescricao(f).includes(np))) continue;
    for (let i = fica.length - 1; i >= 0; i--) if (np.includes(normalizarDescricao(fica[i]))) fica.splice(i, 1);
    fica.push(p);
  }
  return fica.join(" - ");
}

/* Le as linhas de dado a partir de um cabecalho (ou sem cabecalho) */
function linhasDoCSV({ regs, linha, mapa: m, sep }) {
  const estilo = estiloDosValores(regs, linha + 1, [m.valor, m.credito, m.debito]);
  const colunasValor = [m.valor, m.credito, m.debito].filter((x) => x >= 0);
  const brutas = [];
  let ultima = null;
  // Descricao na ULTIMA coluna com o separador dentro e sem aspas: as
  // sobras da linha voltam para a descricao (nao perde o fim do texto)
  const nCab = linha >= 0 ? regs[linha].length : 0;
  const descNoFim = nCab > 0 && m.descricoes.includes(nCab - 1);

  for (let i = linha + 1; i < regs.length; i++) {
    let crua = regs[i];
    if (descNoFim && crua.length > nCab) {
      crua = crua.slice();
      while (crua.length > nCab && !limparCelula(crua[crua.length - 1])) crua.pop();
      if (crua.length > nCab) crua.splice(nCab - 1, crua.length, crua.slice(nCab - 1).join(sep));
    }
    const c = crua.map(limparCelula);
    if (c.every((x) => !x)) continue;
    const pega = (idx) => (idx >= 0 ? c[idx] ?? "" : "");

    const tipoTxt = pega(m.tipo);
    const sinal = sinalDoTipo(tipoTxt);
    const partes = m.descricoes.map(pega).filter(Boolean);
    // Coluna "Tipo" com texto (ex.: "Pix") ajuda a descricao
    if (tipoTxt && !sinal && !RE_DINHEIRO.test(tipoTxt)) partes.unshift(tipoTxt);

    const data = parsearData(pega(m.data));
    if (!data) {
      // Continuacao da descricao da linha de cima (sem data e sem valor)
      const semValor = colunasValor.every((idx) => !pega(idx) || pega(idx) === "-");
      if (ultima && !pega(m.data) && semValor && partes.length) {
        ultima.partes.push(...partes);
        continue;
      }
      ultima = null;
      continue;
    }
    if (partes.some(ehSaldo)) {
      ultima = null;
      continue;
    }

    let valor = NaN;
    if (m.valor >= 0 && pega(m.valor)) {
      valor = parsearValor(pega(m.valor), estilo);
    } else if (m.credito >= 0 || m.debito >= 0) {
      const cr = parsearValor(pega(m.credito), estilo);
      const db = parsearValor(pega(m.debito), estilo);
      const temCr = Number.isFinite(cr) && cr !== 0;
      const temDb = Number.isFinite(db) && db !== 0;
      if (temCr || temDb) valor = arredondar((temCr ? Math.abs(cr) : 0) - (temDb ? Math.abs(db) : 0));
      else if (Number.isFinite(cr) || Number.isFinite(db)) valor = 0;
    }
    if (!Number.isFinite(valor)) {
      ultima = null;
      continue;
    }
    if (sinal) valor = sinal * Math.abs(valor);
    if (m.inverter) valor = -valor;
    valor = arredondar(valor);

    ultima = { data, valor, partes, id: pega(m.id), doc: pega(m.documento), nome: pega(m.nome) };
    brutas.push(ultima);
  }
  return brutas;
}

/* Texto do CSV -> { transacoes }. Lanca erro em portugues se nao der.
   Pode haver mais de uma linha com cara de cabecalho (ex.: "Data de
   emissão: ...;Valor total: ..." antes do cabecalho de verdade): fica a
   que rende MAIS transacoes; empate, a que vem primeiro. */
export function lerCSV(texto) {
  let t = String(texto ?? "").replace(/^\uFEFF/, "");
  let separadores = [";", ",", "\t", "|"];
  const linhaSep = t.match(/^sep=(.)\r?\n/i); // Excel: primeira linha "sep=;"
  if (linhaSep) {
    separadores = [linhaSep[1]];
    t = t.slice(linhaSep[0].length);
  }

  const quebrados = separadores.map((sep) => ({ sep, regs: quebrarCSVSeguro(t, sep) }));
  const candidatos = [];
  for (const { sep, regs } of quebrados) {
    const limite = Math.min(regs.length, 60);
    for (let i = 0; i < limite; i++) {
      const mapa = mapearCabecalho(regs[i]);
      if (mapa) candidatos.push({ regs, linha: i, mapa, sep });
    }
  }

  let melhor = null;
  let brutas = [];
  for (const cand of candidatos) {
    const linhas = linhasDoCSV(cand);
    const ganha =
      !melhor ||
      linhas.length > brutas.length ||
      (linhas.length === brutas.length &&
        (cand.linha < melhor.linha || (cand.linha === melhor.linha && cand.mapa.reconhecidas > melhor.mapa.reconhecidas)));
    if (ganha) [melhor, brutas] = [cand, linhas];
  }

  // Sem cabecalho (ou nenhum cabecalho rendeu nada): olha o conteudo
  if (!brutas.length) {
    for (const { sep, regs } of quebrados) {
      const mapa = mapearSemCabecalho(regs);
      if (!mapa) continue;
      const linhas = linhasDoCSV({ regs, linha: -1, mapa, sep });
      if (linhas.length > brutas.length) [melhor, brutas] = [{ regs, linha: -1, mapa, sep }, linhas];
    }
  }
  if (!melhor) throw new Error("Não reconheci as colunas desse arquivo.");

  const transacoes = brutas.map((b) => {
    const descricao = juntarPartes(b.partes);
    const nomeColuna = limparTexto(b.nome);
    const nome = nomeColuna && /[A-Za-zÀ-ÿ]{2}/.test(nomeColuna) ? nomeColuna : extrairNome(descricao);
    return {
      data: b.data,
      valor: b.valor,
      descricao,
      nome: nome || null,
      documento: documentoDoCampo(b.doc) || extrairDocumento(descricao),
      id: limparId(b.id),
      origem: "csv",
    };
  });
  limparIdsRepetidos(transacoes);
  if (!transacoes.length) throw new Error("Não achei nenhum lançamento nesse arquivo.");
  return { transacoes };
}

/* ========================= PERIODO ========================= */

/* So o que vale guardar: 1º/jan a 31/dez do ano (ou da abertura do
   MEI, se abriu neste ano). Comparacao como texto "AAAA-MM-DD". */
export function cortarPeriodo(transacoes, { ano, mesAbertura = null, anoAbertura = null } = {}) {
  const a = Number(ano) || new Date().getFullYear();
  const mes = Number(mesAbertura);
  const abriuNoAno = anoAbertura != null && Number(anoAbertura) === a && mes >= 1 && mes <= 12;
  const inicio = abriuNoAno ? `${a}-${pad2(mes)}-01` : `${a}-01-01`;
  const fim = `${a}-12-31`;
  const dentro = [];
  const descartadas = [];
  for (const t of transacoes || []) {
    const d = typeof t?.data === "string" ? t.data : "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(d) && d >= inicio && d <= fim) dentro.push(t);
    else descartadas.push(t);
  }
  return { dentro, descartadas, inicio, fim };
}

/* Creditos (entradas) e debitos (saidas, com valor positivo). Zero some. */
export function separarCreditosDebitos(transacoes) {
  const creditos = [];
  const debitos = [];
  for (const t of transacoes || []) {
    const v = Number(t?.valor);
    if (!Number.isFinite(v) || v === 0) continue;
    if (v > 0) creditos.push(t);
    else debitos.push({ ...t, valor: Math.abs(v) });
  }
  return { creditos, debitos };
}

/* ========================= IMPRESSAO DIGITAL ========================= */

const FNV_INICIO = BigInt("0xcbf29ce484222325");
const FNV_PRIMO = BigInt("0x100000001b3");
const MASCARA_64 = BigInt("0xffffffffffffffff");

/* FNV-1a 64 bits do texto (em bytes UTF-8) -> 16 letras hex */
function fnv1a64(texto) {
  const bytes = new TextEncoder().encode(texto);
  let h = FNV_INICIO;
  for (let i = 0; i < bytes.length; i++) {
    h ^= BigInt(bytes[i]);
    h = (h * FNV_PRIMO) & MASCARA_64;
  }
  return h.toString(16).padStart(16, "0");
}

/* Nova lista com o campo "chave" em cada transacao (ver regras no topo) */
export function gerarChaves(transacoes, { conta = "" } = {}) {
  const contaTxt = limparTexto(conta);
  const ocorrencias = new Map();
  return (transacoes || []).map((t) => {
    const valor = valor2(t.valor);
    const id = t.id == null ? "" : limparTexto(t.id);
    let base;
    if (id) {
      base = `id|${contaTxt}|${id}|${valor}`;
    } else {
      const igual = `${t.data}|${valor}|${normalizarDescricao(t.descricao)}`;
      const n = (ocorrencias.get(igual) || 0) + 1;
      ocorrencias.set(igual, n);
      base = `sem-id|${igual}|${n}`;
    }
    return { ...t, chave: fnv1a64(base) };
  });
}

/* ========================= PERIODO EM TEXTO ========================= */

/* Menor e maior data da lista */
export function periodoDasTransacoes(transacoes) {
  let inicio = null;
  let fim = null;
  for (const t of transacoes || []) {
    const d = t?.data;
    if (typeof d !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(d)) continue;
    if (!inicio || d < inicio) inicio = d;
    if (!fim || d > fim) fim = d;
  }
  return { inicio, fim };
}

/* "de jan a out", "em out"; anos diferentes: "de dez/2025 a jan/2026" */
export function textoPeriodo(inicio, fim) {
  const a = inicio || fim;
  const b = fim || inicio;
  if (!a) return "";
  const ma = String(a).match(/^(\d{4})-(\d{2})/);
  const mb = String(b).match(/^(\d{4})-(\d{2})/);
  if (!ma || !mb) return "";
  const nomeA = MESES_CURTOS[+ma[2] - 1];
  const nomeB = MESES_CURTOS[+mb[2] - 1];
  if (!nomeA || !nomeB) return "";
  if (ma[1] === mb[1]) return ma[2] === mb[2] ? `em ${nomeA}` : `de ${nomeA} a ${nomeB}`;
  return `de ${nomeA}/${ma[1]} a ${nomeB}/${mb[1]}`;
}
