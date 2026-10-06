/* DECLARACAO v1 — regras e contas da Declaracao anual (DASN-SIMEI do MEI e o Imposto de Renda da pessoa), num lugar so para atualizar todo ano */

/* ===================================================================
   DECLARACAO ANUAL — REGRAS (pesquisado em 06/10/2026)

   DASN-SIMEI (a declaracao do MEI)
   - Todo ano, ate 31 de maio, sobre o ano anterior. Obrigatoria mesmo
     sem faturamento. Informa o faturamento do ano e se teve empregado.
   - Atrasou: multa de 2% ao mes sobre os impostos declarados, no
     maximo 20%, minimo R$ 50.
   - Feita no site do Simples Nacional (so com o CNPJ) ou no App MEI.

   IMPOSTO DE RENDA DA PESSOA (IRPF) — HANDOFF, Parte 3-IR
   - Parte ISENTA = faturamento x percentual da atividade: 8% comercio,
     industria e transporte de CARGA; 16% transporte de passageiros;
     32% servicos.
   - Lucro = faturamento - gastos com comprovante.
   - Parte que conta como RENDA (tributavel) = lucro - parte isenta.
   - Precisa declarar quando a renda tributavel do ano (somando outras,
     como salario e aluguel) passa do limite. LIMITE_DECLARAR_IR e o do
     ultimo ano publicado (R$ 35.584, ano de 2025, declarado em 2026).
     O de 2026 (declarado em 2027) sai no comeco de 2027: atualizar aqui.
   - Lei 15.270/2025: desde 01/01/2026 quem tem renda tributavel de ate
     R$ 5 mil por mes (R$ 60 mil no ano) fica isento do imposto, com
     desconto ate R$ 7.350 por mes. Declarar nao e o mesmo que pagar.
   - Ha outros motivos que obrigam a declarar (bens acima de R$ 800 mil,
     investimentos em bolsa etc.): o app so avisa, nao calcula.
   ⚠️ CONFERIR COM O CONTADOR antes do piloto.
   =================================================================== */

export const PRAZO_DASN = { dia: 31, mes: 5 }; // 31 de maio
export const MULTA_MINIMA_DASN = 50;
export const LINK_DASN_SIMEI =
  "https://www8.receita.fazenda.gov.br/SimplesNacional/Aplicacoes/ATSPO/dasnsimei.app/Identificacao";

/* Limite de renda tributavel para ter de declarar o IR (ultimo publicado) */
export const LIMITE_DECLARAR_IR = 35584;
export const ANO_DO_LIMITE_IR = 2025;

/* Lei 15.270/2025: isento ate R$ 5 mil por mes (desde 2026) */
export const ISENCAO_MENSAL_IR = 5000;

/* Atividades e o percentual que fica isento */
export const ATIVIDADES = [
  { id: "cargas", rotulo: "Transporte de cargas", detalhe: "Caminhoneiro, frete", percentual: 0.08 },
  { id: "comercio", rotulo: "Comércio ou indústria", detalhe: "Venda de produtos, fabricação", percentual: 0.08 },
  { id: "passageiros", rotulo: "Transporte de passageiros", detalhe: "Van, táxi, aplicativo", percentual: 0.16 },
  { id: "servicos", rotulo: "Serviços", detalhe: "Mão de obra, manutenção, outros", percentual: 0.32 },
];

/* Ano em que a proxima DASN vence (31/05) e o ano que ela declara */
export function proximaDeclaracao(hoje = new Date()) {
  const ano = hoje.getFullYear();
  const passouDoPrazo = hoje > new Date(ano, PRAZO_DASN.mes - 1, PRAZO_DASN.dia, 23, 59, 59);
  const anoEntrega = passouDoPrazo ? ano + 1 : ano;
  return { anoEntrega, anoDeclarado: anoEntrega - 1 };
}

/**
 * Conta do Imposto de Renda do MEI (estimativa).
 * Valores em reais. Devolve as partes e se precisa declarar.
 */
export function calcularIR({ atividade, faturamento, gastos = 0, outrasRendas = 0 }) {
  const ativ = ATIVIDADES.find((a) => a.id === atividade) || ATIVIDADES[0];
  const fat = Math.max(0, Number(faturamento) || 0);
  const gas = Math.max(0, Number(gastos) || 0);
  const outras = Math.max(0, Number(outrasRendas) || 0);
  const isenta = fat * ativ.percentual;
  const lucro = Math.max(0, fat - gas);
  const tributavelMei = Math.max(0, lucro - isenta);
  const rendaTributavel = tributavelMei + outras;
  return {
    percentual: ativ.percentual,
    isenta,
    lucro,
    tributavelMei,
    rendaTributavel,
    precisaDeclarar: rendaTributavel > LIMITE_DECLARAR_IR,
    dentroDaIsencaoNova: rendaTributavel <= ISENCAO_MENSAL_IR * 12,
  };
}
