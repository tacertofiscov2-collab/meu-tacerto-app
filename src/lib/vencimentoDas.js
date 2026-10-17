/* VENCIMENTODAS v1 — vencimento do DAS do MEI (dia 20, prorrogado para o proximo dia util) com os feriados nacionais */

/* ===================================================================
   VENCIMENTO DO DAS — REGRA (Receita Federal, conferida em 10/10/2026)

   - O DAS do MEI vence no DIA 20 do mes seguinte ao da competencia
     (o DAS de outubro vence em 20 de novembro).
   - Se o dia 20 cair em sabado, domingo ou feriado, o prazo e
     PRORROGADO para o proximo dia util. Nunca e antecipado.
     Exemplo oficial: 20/10/2018 (sabado) -> vence 22/10/2018 (segunda).
     Exemplo do app: 20/11/2026 e feriado nacional e cai numa sexta ->
     vence 23/11/2026 (segunda).

   QUAIS FERIADOS CONTAM: SO OS NACIONAIS (lista abaixo).
   - Carnaval e Corpus Christi sao PONTO FACULTATIVO, nao feriado: ficam
     de fora.
   - Feriados de estado e de cidade tambem ficam de fora.
   - POR QUE: se o app deixar um feriado de fora, no maximo mostra uma
     data ANTES da verdadeira (a pessoa paga um dia antes, sem multa).
     O contrario (mostrar DEPOIS) faria a pessoa pagar atrasada. Por
     isso a lista e curta de proposito.

   FERIADOS NACIONAIS
     01/01  Confraternizacao Universal
     movel  Paixao de Cristo (Sexta-feira Santa) = Pascoa - 2 dias
     21/04  Tiradentes
     01/05  Dia do Trabalho
     07/09  Independencia do Brasil
     12/10  Nossa Senhora Aparecida
     02/11  Finados
     15/11  Proclamacao da Republica
     20/11  Consciencia Negra — SO a partir de 2024 (Lei 14.759/2023).
            Em 20/11/2023 (segunda) ainda NAO era feriado nacional.
     25/12  Natal

   DATAS SEM SURPRESA DE FUSO
   - Toda data aqui e "so o dia" (sem hora): texto "AAAA-MM-DD" ou
     Date LOCAL criado com new Date(ano, mes, dia).
   - NUNCA usar toISOString() para virar texto: ele converte para o
     horario de Londres e, a noite no Brasil, ja e o dia seguinte. O
     texto e montado com getFullYear / getMonth / getDate.
   - Entrada invalida (texto fora do formato, 30/02 etc.) nao quebra a
     tela: as funcoes devolvem null (ou false / "" conforme o caso).
   =================================================================== */

export const DAS_DIA_VENCIMENTO = 20;
export const TEXTO_VENCIMENTO_DAS =
  "Dia 20. Se cair em fim de semana ou feriado, vence no próximo dia útil.";

/* Ano em que o 20/11 virou feriado nacional (Lei 14.759/2023) */
const ANO_INICIO_CONSCIENCIA_NEGRA = 2024;

const UM_DIA_MS = 24 * 60 * 60 * 1000;

/* ---------- ajudantes de data (so o dia, sem hora) ---------- */

/* Aceita Date ou "AAAA-MM-DD" e devolve um Date LOCAL a meia-noite,
   ou null se a data nao existir. */
function paraData(data) {
  if (data instanceof Date) {
    if (Number.isNaN(data.getTime())) return null;
    return new Date(data.getFullYear(), data.getMonth(), data.getDate());
  }
  if (typeof data === "string") {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(data.trim());
    if (!m) return null;
    const ano = Number(m[1]);
    const mes = Number(m[2]);
    const dia = Number(m[3]);
    const d = new Date(ano, mes - 1, dia);
    /* 2026-02-30 "vira" 02/03 no Date: aqui isso e data invalida */
    if (d.getFullYear() !== ano || d.getMonth() !== mes - 1 || d.getDate() !== dia) return null;
    return d;
  }
  return null;
}

/* Date local -> "AAAA-MM-DD" (sem toISOString, por causa do fuso) */
function paraTexto(d) {
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
}

function textoDe(ano, mes, dia) {
  return `${ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

/* Numero do dia contado em UTC (so para contar dias sem erro de
   horario de verao do computador) */
function numeroDoDia(d) {
  return Math.round(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / UM_DIA_MS);
}

function anoValido(ano) {
  return Number.isInteger(ano) && ano >= 1583 && ano <= 9999;
}

/* ---------- Pascoa e feriados ---------- */

/* Pascoa pelo algoritmo de Meeus/Jones/Butcher ("anonimo gregoriano").
   Vale para o calendario gregoriano (de 1583 em diante). */
export function dataPascoa(ano) {
  if (!anoValido(ano)) return null;
  const a = ano % 19;
  const b = Math.floor(ano / 100);
  const c = ano % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31); // 3 = marco, 4 = abril
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(ano, mes - 1, dia);
}

/* Guarda a lista de cada ano depois da primeira conta (a lista nao
   muda; so evita refazer a Pascoa a cada dia testado). */
const cacheFeriados = new Map();

function feriadosDoAno(ano) {
  if (cacheFeriados.has(ano)) return cacheFeriados.get(ano);
  const lista = [
    [textoDe(ano, 1, 1), "Confraternização Universal"],
    [textoDe(ano, 4, 21), "Tiradentes"],
    [textoDe(ano, 5, 1), "Dia do Trabalho"],
    [textoDe(ano, 9, 7), "Independência do Brasil"],
    [textoDe(ano, 10, 12), "Nossa Senhora Aparecida"],
    [textoDe(ano, 11, 2), "Finados"],
    [textoDe(ano, 11, 15), "Proclamação da República"],
    [textoDe(ano, 12, 25), "Natal"],
  ];
  const pascoa = dataPascoa(ano);
  const sextaSanta = new Date(pascoa.getFullYear(), pascoa.getMonth(), pascoa.getDate() - 2);
  lista.push([paraTexto(sextaSanta), "Paixão de Cristo (Sexta-feira Santa)"]);
  if (ano >= ANO_INICIO_CONSCIENCIA_NEGRA) {
    lista.push([textoDe(ano, 11, 20), "Dia Nacional de Zumbi e da Consciência Negra"]);
  }
  /* Em ordem de data (a Sexta-feira Santa pode cair antes ou depois de
     21/04) */
  lista.sort((x, y) => (x[0] < y[0] ? -1 : x[0] > y[0] ? 1 : 0));
  const mapa = new Map(lista);
  cacheFeriados.set(ano, mapa);
  return mapa;
}

/* Map "AAAA-MM-DD" -> nome do feriado, em ordem de data. Devolve uma
   copia: quem chamar pode mexer sem estragar o cache. */
export function feriadosNacionais(ano) {
  if (!anoValido(ano)) return new Map();
  return new Map(feriadosDoAno(ano));
}

export function ehFeriadoNacional(data) {
  const d = paraData(data);
  if (!d || !anoValido(d.getFullYear())) return false;
  return feriadosDoAno(d.getFullYear()).has(paraTexto(d));
}

/* Dia util = nao e sabado, domingo nem feriado nacional */
export function ehDiaUtil(data) {
  const d = paraData(data);
  if (!d) return false;
  const diaSemana = d.getDay(); // 0 = domingo, 6 = sabado
  if (diaSemana === 0 || diaSemana === 6) return false;
  return !ehFeriadoNacional(d);
}

/* A propria data, se for dia util; senao o proximo dia util */
export function proximoDiaUtil(data) {
  const inicio = paraData(data);
  if (!inicio) return null;
  let d = inicio;
  /* No pior caso sao poucos dias (fim de semana + feriado); o limite
     so protege contra laco infinito. */
  for (let i = 0; i < 15 && !ehDiaUtil(d); i++) {
    d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
  }
  return d;
}

/* ---------- vencimento do DAS ---------- */

/* Vencimento do DAS que vence no mes informado (mes de 1 a 12):
   dia 20, prorrogado para o proximo dia util. */
export function vencimentoDasDoMes(ano, mes) {
  if (!anoValido(ano) || !Number.isInteger(mes) || mes < 1 || mes > 12) return null;
  return proximoDiaUtil(new Date(ano, mes - 1, DAS_DIA_VENCIMENTO));
}

/* Proximo vencimento a partir de hoje (so o dia, sem hora).
   Se hoje ainda e ate o vencimento deste mes (contando a prorrogacao),
   e o deste mes. Ex.: 21/11/2026 -> 23/11/2026, porque o de novembro
   foi prorrogado. Passou: o do mes seguinte (dezembro -> janeiro do
   ano seguinte). O vencimento nunca sai do mes (no maximo dia 23),
   entao basta olhar este mes e o seguinte. */
export function proximoVencimentoDas(hoje = new Date()) {
  const h = paraData(hoje);
  if (!h) return null;
  const ano = h.getFullYear();
  const mes = h.getMonth() + 1;
  const desteMes = vencimentoDasDoMes(ano, mes);
  if (desteMes && numeroDoDia(h) <= numeroDoDia(desteMes)) return desteMes;
  return mes === 12 ? vencimentoDasDoMes(ano + 1, 1) : vencimentoDasDoMes(ano, mes + 1);
}

/* O DAS que vence num mes e o da competencia do MES ANTERIOR
   (vence em novembro -> competencia de outubro). Mes de 1 a 12. */
export function competenciaDoVencimento(dataVencimento) {
  const d = paraData(dataVencimento);
  if (!d) return null;
  const anterior = new Date(d.getFullYear(), d.getMonth() - 1, 1);
  return { mes: anterior.getMonth() + 1, ano: anterior.getFullYear() };
}

/* ---------- textos e contas para a tela ---------- */

/* "23/11" */
export function formatarDiaMes(data) {
  const d = paraData(data);
  if (!d) return "";
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/* Dias de calendario ate a data (0 = hoje, 1 = amanha, negativo = ja
   passou). Ignora as horas. */
export function diasAte(data, hoje = new Date()) {
  const d = paraData(data);
  const h = paraData(hoje);
  if (!d || !h) return null;
  return numeroDoDia(d) - numeroDoDia(h);
}
