# TaCerto! — Handoff das pesquisas e decisões (07 e 08/10/2026)

> **Para o Claude Code:** leia este arquivo DEPOIS do `CLAUDE.md` e do
> `docs/HANDOFF.md`. Ele junta o que o Fernando decidiu e o que foi
> pesquisado (com fontes) em 07 e 08/10, numa conversa fora do Code.
> Os relatórios completos estão em `docs/pesquisas/`.
> O código NÃO mudou desde o último commit de 06/10 (23:42).

---

## 1. Princípios novos (valem para tudo)

1. **Aparece só quando precisa.** Nada de bombardear o usuário com
   pedidos, integrações e explicações de uma vez. Cada dado (CNPJ,
   extrato, certificado, autorização) é pedido **na hora em que o
   benefício faria falta**, com uma frase dizendo o porquê. Tudo fica
   explicado no app para quando ele procurar.
2. **Tudo opcional, mas com o benefício claro.** O app funciona com
   qualquer nível de dado; cada dado a mais destrava benefícios. Quando
   falta um dado, o lugar dele mostra um aviso discreto ("não preenchido").
3. **Quem está no app resolve no app.** Não jogar a pessoa para o
   WhatsApp quando ela está dentro do app (ex.: enviar extrato é dentro do
   app). O WhatsApp é uma opção, não o caminho obrigatório. Exceção
   decidida: o interesse no certificado A1 abre o WhatsApp com mensagem
   pronta (o agendamento é feito por lá).
4. **Automação por código, IA só para entender.** Gerar DAS, consultar
   pagamento etc. = código fixo (APIs oficiais). IA = ler extrato/foto,
   sugerir categoria, escrever mensagem, explicar. O Fernando
   **supervisiona** (nada feito à mão por ele).
5. **"Fisco.ia" só nos textos que explicam a plataforma**; no resto do
   app e no WhatsApp é "Fisco" (já está assim desde 06/10).
6. **Público: só MEI** (MEI Caminhoneiro primeiro, MEI comum junto onde
   fizer sentido). **Não atende autônomo pessoa física.**
7. Nunca pedir senha do gov.br, nunca robô em site do governo (IN RFB
   2.320/2026, art. 13 proíbe robôs/automação de navegador no e-CAC),
   nunca chamar o TaCerto de "contabilidade"/"contador" (DL 9.295/46, art. 20).

---

## 2. Decisões do Fernando (07–08/10)

### Cadastro e perfil
- **CNPJ opcional**, numa tela própria **depois do nome e antes de "Qual
  é o seu MEI?"**, com **"Preencher depois"**. Preenchido → o app busca os
  dados (BrasilAPI), mostra **"Achei você, está certo?"** e pula as
  perguntas de tipo e abertura.
- **Sai a tela "Quanto você já faturou" (faixas).**
- **CNPJ no Perfil**: se não preenchido, aviso "não preenchido" e
  preencher por ali (mesmo fluxo da busca).

### Velocímetro
- No Início: **botão "Atualizar velocímetro" + data, hora e minuto da
  última atualização**. Tocar abre as formas de atualizar:
  **Enviar extrato (recomendado)** · **Digitar** (total do ano ou mês a
  mês, entrada por entrada) · **Mandar pro Fisco no WhatsApp**.
- Primeiro preenchimento: ainda **a decidir** se trava/exige algo. Por
  enquanto: velocímetro zerado **não pode dizer "Tá tranquilo"** (mostra
  "Falta informar" + convite para atualizar).
- **Leitura do extrato:** considerar só **1º/jan a 31/dez do ano**; se o
  MEI abriu no meio do ano, **só da abertura em diante**; o resto é
  descartado **antes** de qualquer IA ler.
- **App e WhatsApp são um TaCerto só:** nada pode ser contado duas vezes
  (mesmo extrato mandado nos dois, lançamento manual + extrato,
  adiantamento + saldo do mesmo frete).
- Atualizando **à mão** a pessoa perde benefícios (histórico por mês,
  projeção, pagadores, gastos, IR certo, declaração pronta, comprovante).
  Mostrar isso de forma curta ao escolher o jeito de atualizar.

### "É faturamento?" (o que conta)
- **Conta:** frete, adiantamento e saldo de frete, serviço do CNPJ,
  **reembolso de despesa** (Solução de Consulta Cosit 72/2020).
- **Não conta:** **vale-pedágio** (Lei 10.209/2001, art. 2º — se vier
  destacado), empréstimo, estorno/devolução, rendimento de aplicação,
  juros/multa por atraso, indenização de seguro, venda do caminhão,
  transferência entre contas próprias, Pix de família.
- O que decide é **pelo que** foi pago, não se veio de CPF ou CNPJ.
- Conta pessoal pode ser usada pelo MEI (é permitido).

### Gastos e "Meu lucro"
- Janela **"Meu lucro"**: Recebido · Gastos · **Sobrou** (mês e ano),
  gastos por categoria de caminhoneiro (Diesel e Arla, Pedágio,
  Manutenção e peças, Pneus, DAS e impostos, Seguro e rastreador, Parcela
  do caminhão, Outros). Opcional depois: custo por km.
- Como separar sem dar trabalho (igual contador): **regras por fornecedor**
  (aprende uma vez), **documento decide** (gasto com nota no CNPJ = do
  negócio), **lista de dúvidas uma vez por mês**, na dúvida = pessoal.
- Selo 🧾 **com nota / sem nota** (só com nota ajuda no IR).

### DAS
- **Lembretes** (quem escolhe os dias é o usuário; padrão 7 dias, 2 dias e
  no dia) com botões **[Sim, mandar] [Lembrar depois] [Já paguei]**.
  Pediu o boleto → não fala mais de DAS no mês. No dia do vencimento, se
  tiver autorização, consulta se pagou.
- **Vencimento: dia 20; se não for dia útil, vai para o PRÓXIMO dia útil**
  (prorroga — exemplo oficial da Receita: 20/10/2018, sábado → 22/10).
  ⚠️ O texto atual do app diz "antecipa": está errado.
- **Check-up mensal** depois que pagou: DAS pago e confirmado, dívida
  ativa, CNPJ ativo e MEI, mensagens da Receita, pendências.
- **Não** sugerir o débito automático do App MEI (decisão de negócio;
  se o usuário perguntar direto, não negar).
- Valores 2026 (salário mínimo R$ 1.621, Decreto 12.797/2025): MEI
  Caminhoneiro R$ 195,52 (ICMS, frete intermunicipal 4930-2/02) /
  R$ 199,52 (ISS, frete municipal 4930-2/01) / R$ 200,52 (ambos);
  MEI comum R$ 82,05 / 86,05 / 87,05. (Já estão em `fiscal.js`.)

### Serpro (Integra Contador) — conferido nas páginas oficiais em 08/10
- Pode contratar: **"Software-houses"** e startups, com **e-CNPJ A1**.
- **"Gerar DAS" (PDF e código de barras) NÃO exige procuração** (n/a).
- Exigem **Autorização de Acesso** (e-CAC, até 5 anos; o TaCerto
  confirma cada uma em até 30 dias): consultar pagamentos (00004), caixa
  postal (00006), situação fiscal (00002).
- **Entregar DASN-SIMEI:** existe no catálogo, mas "ainda não está
  disponível para contratação".
- Preço (1ª faixa): emissão R$ 0,32 · consulta R$ 0,24 · declaração R$ 0,40.
- Falta do lado do Fernando: decidir o **CNPJ do TaCerto** e tirar o
  e-CNPJ A1; contrato; WhatsApp oficial da Meta com modelos aprovados.

### Nota fiscal e certificado
- **Janela "Notas fiscais"**: antes do certificado, explica (quando
  emitir, regras da nota de serviço, certificado A1, vantagens, preço,
  videoconferência) com botão **"Tenho interesse no certificado"** →
  WhatsApp com mensagem pronta. **Depois do certificado ativo, vira
  "Minhas notas"** (guardar e emitir).
- **Certificado A1 pela Tecnosign (certificadora Soluti), pelo link de
  venda, a preço de custo: R$ 100,34** ("o TaCerto não ganha nada com
  isso"). ⚠️ O app hoje diz R$ 99,90: corrigir. API da Tecnosign: depois.
- Senha do certificado **nunca no chat do WhatsApp**.
- Emissão automática: certificado guardado **no provedor de notas**
  (ex.: Focus NFe), nunca no banco do TaCerto; o motorista confirma cada
  nota com "SIM". (Depois do piloto.)
- **Qual documento** (ver `docs/pesquisas/Nota fiscal e certificado do caminhoneiro.md`):
  frete na mesma cidade = **NFS-e**; frete entre cidades contratado
  direto = **CT-e + MDF-e** (IE + RNTRC + credenciamento na SEF-MG + A1);
  **agregado de transportadora sem IE em MG = não emite hoje** (RICMS-MG).
  MEI **nunca** emite NFS-e de frete intermunicipal (Res. CGSN 140,
  art. 106-A §1º).
- **2027:** MEI passa a ser obrigado a emitir nota em toda venda/serviço
  (LC 214/2025, art. 517). **CT-e e MDF-e automáticos: guardar para depois.**

### Outros
- **Simulador do MEI** (janela): ritmo de recebimento → projeção do ano,
  % do limite, mês em que estoura, quanto ainda pode faturar por mês, IR
  estimado e DAS do ano.
- **Chat do Fisco no app:** volta (como nos slides), mas **design à noite
  com o Fernando** e falta decidir quem responde no piloto.
- **CT-e/MDF-e automáticos, Open Finance sob demanda, Serpro e WhatsApp
  automático:** planejados, não agora.
- Mercado: concorrente mais parecido é a **MotoMei** (R$ 39,90/mês,
  contabilidade humana no WhatsApp, foco motoboy; app de prateleira
  OpenMEI). Parceiros B2B priorizados: Tora, Giro Certo, CNTA, Mello, BBM.

---

## 3. Correções de coisas que estavam erradas antes

| Antes | Certo |
|---|---|
| DAS em fim de semana/feriado "antecipa" | **Prorroga** para o próximo dia útil |
| Agregado emite NFS-e | Agregado sem IE em MG **não emite** hoje; NFS-e só frete municipal |
| A1 R$ 99,90 | **R$ 100,34** (Tecnosign, preço de custo) |
| "Relatório Mensal de Receitas" como recurso | Res. CGSN 190/2026 revoga partes a partir de 2027 (artigo exato não confirmado) — **não construir** |
| Precisa de procuração para gerar DAS | **Não precisa** (Serpro: n/a) |

---

## 4. Ainda não confirmado (não prometer no app)

- Se o MEI com IE em MG continua dispensado de emitir como agregado.
- Como confirmar as Autorizações de Acesso em grande quantidade (hoje
  parece manual no e-CAC, até 30 dias).
- Percentual do crédito presumido de IBS/CBS de 2027 (LC 214, art. 169).
- Se cartões de frete (Pamcard/Roadcard, Edenred Frete) exportam extrato.
