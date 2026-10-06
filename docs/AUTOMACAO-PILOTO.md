# TaCerto! — Até onde dá para automatizar (DAS, nota, declaração anual)

> Análise de 06/10/2026, pedida pelo Fernando para a validação (piloto
> com 30 MEI Caminhoneiros). O que o app **promete hoje** está nas
> seções "Como o TaCerto ajuda hoje" das páginas Como pagar o DAS, Como
> emitir nota e Declaração anual. Regra: prometer só o que dá para
> cumprir à mão no piloto.

---

## Resumo em uma tabela

| Serviço | Hoje no piloto (à mão, pelo WhatsApp) | O que precisa para ficar automático | Dá para o piloto? |
|---|---|---|---|
| **Boleto do DAS** | A equipe gera no PGMEI só com o **CNPJ** (o site do governo não pede senha) e manda o PDF no WhatsApp antes do dia 20. Atrasado também (o boleto já vem com multa e juros). | **Integra Contador / Integra MEI (Serpro)**: API oficial que gera o DAS do MEI. Exige **e-CNPJ do TaCerto** (certificado da empresa), contrato com o Serpro e **procuração eletrônica** de cada MEI no e-CAC. | **Sim, à mão.** Automático depois. |
| **Nota fiscal (NFS-e)** | A pessoa manda valor e tomador; a equipe monta a nota e guia a emissão no **Emissor Nacional** (login gov.br ou usuário e senha do emissor, da própria pessoa). | **Certificado Digital A1** do MEI (certificadora parceira) + provedor de emissão por API (Focus NFe, NFE.io etc., ~R$ 85/certificado). O Emissor Nacional não exige certificado, mas a API exige. | **Sim, guiado.** Automática com o A1. |
| **Declaração do MEI (DASN-SIMEI)** | Em maio, a equipe faz com os valores do app: o site da DASN pede **só o CNPJ** (e o captcha). A pessoa só confirma no WhatsApp. | Integra Contador (transmissão da declaração, mesma exigência do DAS: e-CNPJ + procuração). | **Sim, à mão.** |
| **Imposto de Renda (pessoa física)** | O app **calcula** (parte isenta, se precisa declarar) — `/declaracao-anual/calcular`. A equipe orienta; quem envia é a pessoa (ou o contador parceiro, no futuro). | Não é automatizável por nós sem acesso à conta gov.br da pessoa (e não pedimos senha). | **Orientação.** |

---

## Detalhes e fontes

### DASN-SIMEI
- Prazo: **31 de maio** do ano seguinte; obrigatória mesmo sem faturamento.
- Informa: faturamento do ano e se teve empregado.
- Atraso: multa de 2% ao mês sobre os impostos declarados, máx. 20%,
  **mínimo R$ 50** (com a reforma, a multa de obrigação acessória do MEI
  tem redução de 90% — HANDOFF Parte 3).
- Onde: Portal do Simples Nacional (só CNPJ) ou App MEI.
- Fontes: [Jornal Opção](https://www.jornalopcao.com.br/ultimas-noticias/atraso-na-declaracao-pode-gerar-multa-meis-tem-prazo-ate-31-de-maio-830883/), [meutudo](https://meutudo.com.br/blog/noticias/2026/01/13/declaracao-do-mei-2026-ja-esta-disponivel-veja-como-preencher/).

### Imposto de Renda do MEI (pessoa física)
- Parte isenta = faturamento × **8%** (comércio, indústria, transporte
  de **cargas**), 16% (passageiros), 32% (serviços).
- Renda tributável = (faturamento − gastos com comprovante) − parte isenta.
- Precisa declarar se a renda tributável do ano passar do limite:
  **R$ 35.584** (ano de 2025, declarado em 2026). O limite de 2026 sai no
  começo de 2027 → atualizar `LIMITE_DECLARAR_IR` em `src/lib/declaracao.js`.
- **Lei 15.270/2025** (sancionada em 26/11/2025): desde 01/01/2026 quem
  tem renda tributável de até **R$ 5 mil/mês** fica isento do imposto
  (desconto até R$ 7.350/mês). Vale para a declaração de 2027.
- Fontes: [Tax Group](https://www.taxgroup.com.br/intelligence/como-declarar-o-imposto-de-renda-mei-2026/), [contadores.cnt.br](https://contadores.cnt.br/projetos/46/noticias/tecnicas/2026/04/02/imposto-de-renda-2026-como-calcular-os-rendimentos-tributaveis-do-mei.html), [Senior — Lei 15.270](https://documentacao.senior.com.br/exigenciaslegais/noticias/trabalhista-previdenciaria/2025/2025-11-27-trabalhista-lei-15-270-2025-sancionada-lei-que-amplia-isenção-do-imposto-de-renda-para-quem-ganha-ate-5-mil).

### DAS automático (Integra Contador / Integra MEI)
- Plataforma oficial Receita + Serpro: APIs que fazem o que o e-CAC faz.
  O **Integra MEI** gera o DAS, consulta dívida e atualiza benefício.
- Exige **e-CNPJ** de quem integra (o TaCerto) e **autorização do dono
  da informação** (procuração eletrônica no e-CAC).
- Fontes: [CRC-SP](https://online.crcsp.org.br/portal/noticias/noticia.asp?c=5649), [Serpro](https://serpro.gov.br/menu/noticias/noticias-2022/integra-contador-unifica-acesso-a-informacoes-contabeis).

### Nota fiscal (NFS-e padrão nacional)
- Obrigatória no padrão nacional para o MEI que presta serviço a
  empresas; no **Emissor Nacional** o certificado **não** é obrigatório
  (login gov.br prata/ouro ou usuário e senha do emissor).
- Para o **app emitir sozinho** (API), precisa do **Certificado A1** do
  MEI — por isso o caminho "Nota automática" com a certificadora parceira.
- Fontes: [Agência Sebrae](https://agenciasebrae.com.br/economia-e-politica/nfs-e-emissao-no-padrao-nacional-para-mei-passa-a-ser-obrigatoria-veja-o-passo-a-passo), [gov.br NT 2023/001](https://www.gov.br/nfse/pt-br/nt-2023-001-obrigatoriedade-da-nfs-e-nacional-para-o-mei.pdf).

---

## O que fazer depois do piloto (ordem sugerida)
1. **e-CNPJ do TaCerto + contrato Integra Contador** → DAS e DASN
   automáticos (com procuração de cada MEI no e-CAC; criar o passo a
   passo da procuração no app).
2. **Certificadora parceira + provedor de NFS-e por API** → nota
   automática (o app já explica o A1 e já tem "Quero agendar meu
   certificado").
3. **Contador parceiro** (é a última coisa a construir, pedido do
   Fernando) → Imposto de Renda feito por eles.

⚠️ Conferir com o contador: textos do Imposto de Renda, NFS-e x CT-e do
agregado, e o limite de declaração de 2027 quando sair.
