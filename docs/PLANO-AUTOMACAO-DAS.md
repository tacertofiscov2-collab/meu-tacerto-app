# Plano — DAS no automático (rascunho de 10/10/2026)

> PLANO-AUTOMACAO-DAS v1. **É só um plano: nada está construído.** Base:
> `HANDOFF-08-10-PESQUISAS.md`, `docs/pesquisas/`, `AUTOMACAO-PILOTO.md`
> e `DECISOES-PILOTO.md`. *(Sugestão)* = ainda não decidido pelo Fernando.

## 1. Objetivo

1. Todo mês o **boleto do DAS chega no WhatsApp**. A pessoa só paga.
2. O app **confere sozinho se o pagamento caiu** na Receita.
3. O Fernando **só supervisiona**. Ele não faz nada à mão.

## 2. O que o plano usa (já existe ou já está escrito)

| Dado | Onde fica | Como o plano usa |
|---|---|---|
| Dias do lembrete | `perfis.lembrete_das_dias` (padrão `{7,2,0}` = 7 dias antes, 2 dias antes e no dia; vazio = não quer lembrete) | Decide em que dias o Fisco pergunta |
| Hora do lembrete | `perfis.lembrete_das_hora` | Hora do envio *(sugestão: 9h quando estiver vazio)* |
| Vencimento | `src/lib/vencimentoDas.js` | Dia 20. Se não for dia útil (fim de semana ou feriado nacional), **passa para o próximo dia útil**. Os lembretes acompanham a data nova |
| Valor do DAS | `src/lib/fiscal.js` | Ex.: MEI Caminhoneiro R$ 195,52 / 199,52 / 200,52 |
| CNPJ | `perfis.cnpj` (opcional) | Necessário para gerar o boleto. Se faltar, o Fisco pede na hora |

⚠️ As colunas novas do perfil entram com o SQL de 08/10
(`docs/SQL-PENDENTE-08-10.sql`, esperando o "pode"), e o
`vencimentoDas.js` faz parte da mesma tarefa de 08/10.

**Palavras deste documento:**
- **Competência:** o mês a que o DAS se refere. O DAS de setembro vence em 20/10.
- **Serpro (Integra Contador):** serviço oficial que gera o DAS e consulta
  a Receita por computador. Como um caixa eletrônico oficial: cada uso custa centavos.
- **Autorização de Acesso:** a pessoa autoriza o TaCerto no site oficial
  (e-CAC) a ver os dados dela. Como dar a chave reserva ao vizinho, sem a senha.
- **Modelo de mensagem:** texto fixo que a Meta (dona do WhatsApp) aprova antes do uso.
- **Tarefa agendada:** programa que acorda sozinho de hora em hora e vê quem recebe o quê.

## 3. A ficha do mês de cada pessoa (máquina de estados)

Cada pessoa ganha **uma linha por mês** (pessoa + competência), sempre em
**um estado só**, como o rastreio de uma encomenda ("postado → em trânsito → entregue").

| Estado | Quer dizer |
|---|---|
| `aguardando` | Ficha do mês criada. Ainda não chegou o dia do 1º lembrete |
| `perguntado_7d` | Recebeu o 1º lembrete (7 dias antes) |
| `perguntado_2d` | Recebeu o 2º lembrete (2 dias antes) |
| `perguntado_dia` | Recebeu o lembrete do dia do vencimento |
| `lembrar_depois` | Tocou em [Lembrar depois]. Espera o próximo dia escolhido |
| `boleto_enviado` | Tocou em [Sim, mandar] e recebeu o boleto |
| `ja_pagou` | Tocou em [Já paguei]. Falta conferir na Receita |
| `pago_confirmado` | A Receita mostrou o pagamento (só com Autorização de Acesso) |
| `checkup_enviado` | Recebeu o check-up do mês. **Fim do mês** |
| `sem_resposta` | Não respondeu nenhum lembrete até o fim do dia do vencimento |
| `erro_geracao` | O Serpro não conseguiu gerar o boleto |

Os nomes seguem o padrão 7 / 2 / no dia. Com outros dias (ex.: 5 e 1), vale o escolhido.

### O que faz a ficha mudar de estado

| Estado atual | O que dispara | O que o sistema faz | Próximo estado |
|---|---|---|---|
| (nenhum) | Dia 1 do mês do vencimento | Cria a ficha com a data certa do vencimento e os dias de lembrete da pessoa | `aguardando` |
| `aguardando` | Chega o 1º dia de lembrete, na hora escolhida | Manda o modelo M1 com os 3 botões | `perguntado_7d` |
| `aguardando` | Lista de dias vazia (não quer lembrete) | Não manda nada. Só a conferência do dia do vencimento roda (se tiver autorização) | `aguardando` |
| `perguntado_7d` | Chega o dia de 2 dias antes, sem resposta | Manda M1 de novo ("daqui a 2 dias") | `perguntado_2d` |
| `perguntado_2d` | Chega o dia do vencimento, sem resposta | Com autorização: consulta antes se já pagou. Se não aparecer, manda M2 | `perguntado_dia` (ou `pago_confirmado`) |
| `perguntado_*` | Toca [Sim, mandar] | Gera o DAS no Serpro e manda o PDF e o código de barras (R1) | `boleto_enviado` |
| `perguntado_*` | Toca [Sim, mandar], mas falta o CNPJ | Pede o CNPJ (R4). Gera assim que chegar | `boleto_enviado` |
| `perguntado_*` | Toca [Lembrar depois] | Responde R2 e guarda o próximo dia escolhido | `lembrar_depois` |
| `lembrar_depois` | Chega o próximo dia escolhido | Manda o lembrete daquele dia | `perguntado_2d` ou `perguntado_dia` |
| `perguntado_*` | Toca [Já paguei] | Responde R3 | `ja_pagou` |
| `perguntado_dia` | Acaba o dia do vencimento sem resposta | Para de lembrar. Vai para o painel como exceção | `sem_resposta` |
| `boleto_enviado` | Dia do vencimento, com autorização | Consulta pagamentos. Não achou: consulta de novo 3 dias depois | `pago_confirmado` (se achou) |
| `boleto_enviado` | Sem autorização | Nada. A ficha fecha assim no fim do mês | `boleto_enviado` |
| `ja_pagou` | Com autorização: 2 dias úteis depois do toque (ou no vencimento, o que vier depois) | Consulta pagamentos. Não achou: de novo 3 dias depois. Não achou de novo: exceção no painel (nunca cobra a pessoa) | `pago_confirmado` |
| `ja_pagou` | Sem autorização | Acredita na pessoa ("pago, informado por você") e manda o check-up simples (M4) | `checkup_enviado` |
| `sem_resposta` | 3 dias depois do vencimento, com autorização | Consulta mais uma vez. Achou: segue para o check-up | `pago_confirmado` |
| `pago_confirmado` | Logo depois da confirmação | Roda o check-up (seção 5) e manda M3 (e M5 se achar algo) | `checkup_enviado` |
| qualquer um que gera boleto | O Serpro falhou | Tenta mais 2 vezes. Responde R5 à pessoa e avisa o Fernando | `erro_geracao` |
| `erro_geracao` | Nova tentativa deu certo | Manda o boleto | `boleto_enviado` |

### Regras que valem sempre

1. **Pediu o boleto, o DAS daquele mês sai da conversa.** O Fisco não
   lembra mais (só manda o check-up, se o pagamento for confirmado).
2. **No dia do vencimento, quem tem Autorização de Acesso é consultado**
   para saber se já pagou. Assim ninguém é lembrado à toa.
3. **App e WhatsApp são um TaCerto só.** O "Emitir boleto" do card
   "Próximo DAS" e o "Já paguei" do app mudam a mesma ficha. Nada sai duas vezes.
4. Tocar num botão de uma mensagem antiga vale do mesmo jeito.
5. **Nunca escrever que o DAS está "em aberto"** (regra do produto). Usar
   "o pagamento ainda não apareceu na Receita".
6. Não sugerir o débito automático do App MEI (decisão de 07–08/10).
7. A ficha nunca é apagada: vira o histórico do DAS da pessoa.
8. Se a pessoa escrever em vez de tocar num botão, vai para o Fernando.
   *(Depois: a IA só ajuda a entender o texto; quem decide é o código.)*

## 4. Mensagens do WhatsApp

Regra da Meta: para **começar** uma conversa, só vale um modelo aprovado.
Depois que a pessoa toca num botão, abre uma janela de 24 horas e o Fisco
pode responder com texto livre (é assim que o boleto chega).
Categoria dos modelos: **Utilidade**. `{{1}}`, `{{2}}`... são os campos que
o sistema preenche (nome, mês, valor, data).

**Modelos para a Meta aprovar:**

| Modelo | Texto | Botões |
|---|---|---|
| M1 `das_lembrete_antes` | Oi, {{1}}! Aqui é o Fisco, do TaCerto. O DAS de {{2}} (R$ {{3}}) vence em {{4}}, daqui a {{5}}. Quer que eu mande o boleto? | [Sim, mandar] [Lembrar depois] [Já paguei] |
| M2 `das_lembrete_hoje` | Oi, {{1}}! O DAS de {{2}} (R$ {{3}}) vence hoje. Quer o boleto agora? | [Sim, mandar] [Lembrar depois] [Já paguei] |
| M3 `das_checkup_mensal` | Check-up de {{1}} do seu MEI: DAS pago e confirmado. Dívida ativa: {{2}}. CNPJ: {{3}}. Mensagens da Receita: {{4}}. Pendências: {{5}}. Fisco, do TaCerto | [Ver no app] |
| M4 `das_checkup_simples` | {{1}}, anotei que o DAS de {{2}} está pago. Quer que eu confira tudo sozinho na Receita todo mês? É só uma autorização no site oficial, sem passar senha. | [Quero saber] [Agora não] |
| M5 `das_checkup_atencao` | {{1}}, no check-up de {{2}} achei uma coisa para olhar: {{3}}. Quer ajuda? | [Quero ajuda] [Depois] |

- No M2, [Lembrar depois] = mais uma vez no mesmo dia, às 18h *(sugestão)*.
- M4 aparece no máximo 1 vez a cada 3 meses *(sugestão)*: o pedido da
  autorização só vem quando o benefício faz sentido.

**Respostas dentro das 24 horas (não precisam de aprovação):**

| Resposta | Texto |
|---|---|
| R1 boleto | Aqui está o boleto do DAS de {mês}: R$ {valor}, vence {data}. [PDF] Código de barras: {código}. Pode pagar no app do seu banco. Não vou te lembrar mais deste mês. |
| R2 lembrar depois | Combinado! Te lembro de novo em {data}. |
| R3 já paguei | Com autorização: "Boa! Vou conferir na Receita e te aviso." Sem: "Boa! Anotado." |
| R4 falta CNPJ | Para gerar o boleto, preciso do seu CNPJ. Pode me mandar aqui? |
| R5 erro | Não consegui gerar o boleto agora. Já estou vendo e te mando em seguida. |

## 5. Check-up mensal (depois que pagou)

| Item | De onde vem | Precisa de Autorização de Acesso? | Custo |
|---|---|---|---|
| DAS pago e confirmado | Serpro: consultar pagamentos (código 00004) | **Sim** | R$ 0,24 por consulta (já feita na confirmação) |
| Dívida ativa | Serpro: situação fiscal (00002) | **Sim** | R$ 0,24 |
| CNPJ ativo e ainda MEI | Dados públicos do CNPJ (BrasilAPI, já usada no cadastro) | Não | Grátis |
| Mensagens da Receita | Serpro: caixa postal (00006) | **Sim** | R$ 0,24 |
| Pendências | Serpro: situação fiscal (00002), a mesma consulta da dívida | **Sim** | (já contada) |

- **Sem autorização:** check-up simples (M4). Só o "pago, informado por
  você" e o CNPJ pelos dados públicos.
- *(Sugestão)* A IA resume cada mensagem da caixa postal em português
  simples. Quem decide se é alerta é o código.

## 6. Serpro (Integra Contador)

Conferido nas páginas oficiais do Serpro em 08/10/2026.

- **Quem pode contratar:** "Software-houses" e startups, com **e-CNPJ A1**
  (o certificado digital da empresa). A contratação é online e pós-paga.
- **"Gerar DAS" (PDF e código de barras) NÃO exige procuração.** Só
  depende do contrato do TaCerto com o Serpro e do CNPJ da pessoa.
- **Exigem Autorização de Acesso:** consultar pagamentos (00004), caixa
  postal (00006) e situação fiscal (00002).
- **Autorização de Acesso:** a pessoa dá no e-CAC (gov.br prata ou ouro),
  com validade de até 5 anos, escolhida por ela. O **TaCerto confirma
  cada uma em até 30 dias** (IN RFB 2.320/2026, art. 7º). Sem gov.br
  prata ou ouro: procuração com análise de documentos (uns 10 dias
  úteis, R$ 14 em cartório). O app mostra o passo a passo e abre o site
  oficial. **Não faz a autorização no lugar da pessoa.**
- **Entregar a DASN-SIMEI:** existe no catálogo, mas "ainda não está
  disponível para contratação".
- **Preços (1ª faixa):** emissão R$ 0,32 · consulta R$ 0,24 · declaração
  R$ 0,40. Com mais volume o preço cai (faixas): as contas abaixo são o teto.

**Por pessoa por mês:** sem autorização, 1 emissão = **R$ 0,32**. Com
autorização: 1 emissão (R$ 0,32) + até 2 consultas de pagamento (R$ 0,48)
+ até 3 consultas do check-up (R$ 0,72, com folga) = **R$ 1,52** (menos
de 8% de uma mensalidade de R$ 19,90).

| Cenário (por mês) | 30 pessoas | 1.000 pessoas |
|---|---|---|
| Ninguém com autorização (R$ 0,32 cada) | R$ 9,60 | R$ 320,00 |
| Metade com autorização | R$ 27,60 | R$ 920,00 |
| Todos com autorização (R$ 1,52 cada) | R$ 45,60 | R$ 1.520,00 |

Quem não pede o boleto no mês não custa nada. O custo da Meta por
mensagem não está nas pesquisas (a confirmar).

**NUNCA:**
- Pedir a senha do gov.br da pessoa.
- Usar robô no e-CAC, no PGMEI ou em qualquer site da Receita. A IN RFB
  2.320/2026, art. 13, proíbe robôs, scripts e automação de navegador.
  Por isso a Infosimples está descartada.
- Chamar o TaCerto de "contabilidade" ou "contador" (DL 9.295/46, art. 20).

**Fontes (Serpro, conferidas em 08/10/2026):**
- Loja (quem pode contratar e preços): https://loja.serpro.gov.br/product/integracontador
- Como contratar: https://apicenter.estaleiro.serpro.gov.br/documentacao/api-integra-contador/pt/como_contratar/
- Serviços x Procurações (Gerar DAS = "n/a"; 00004, 00006, 00002): https://apicenter.estaleiro.serpro.gov.br/documentacao/api-integra-contador/pt/servicos_vs_procuracoes/
- DASN-SIMEI ainda não contratável: https://apicenter.estaleiro.serpro.gov.br/documentacao/api-integra-contador/pt/solucoes/integra-mei/dasnsimei/servicos/entregar_declaracao/
- IN RFB 2.320/2026 (texto): https://cnbsp.org.br/2026/04/14/dou-instrucao-normativa-receita-federal-do-brasil-n-2-320-2026-dispoe-sobre-o-acesso-a-servicos-por-meio-digital-no-ambito-da-secretaria-especial-da-receita-federal-do-brasil/

## 7. Supervisão em 3 fases

| | Fase 1: piloto (aprova tudo) | Fase 2: automático com resumo | Fase 3: automático com alertas |
|---|---|---|---|
| **O sistema faz** | Prepara cada mensagem, boleto e check-up e deixa numa fila no painel. Responde na hora só "Recebi! Já te mando o boleto." | Envia tudo sozinho. Às 20h manda ao Fernando o resumo do dia e a lista de exceções | Envia tudo sozinho. Só chama o Fernando quando algo sai do normal |
| **O Fernando faz** | Confere pessoa, mês e valor e toca em Aprovar (um por um ou "aprovar todos"). Responde quem escreveu texto | Lê o resumo e resolve as exceções: erro do Serpro, "já paguei" não confirmado, sem resposta, autorizações para confirmar | Resolve os alertas: Serpro fora do ar, erros acima de 5% numa hora, modelo pausado pela Meta, autorização perto dos 30 dias, custo acima do previsto, tarefa agendada que não rodou |
| **Tempo (estimativa)** | Uns 15 min por dia nos dias de lembrete (cerca de 6 dias no mês): perto de 1h30 por mês para 30 pessoas | Uns 5 min por dia, mais as exceções | Uns 15 min por semana, mais os alertas |
| **Passa para a próxima quando** | 2 meses seguidos com: **0 envio errado** (pessoa, mês ou valor), 98% ou mais dos boletos gerados sem erro, nenhuma mensagem que o Fernando precisou corrigir, nenhuma reclamação de mensagem repetida | 3 meses seguidos com: exceções abaixo de 2% das pessoas, todas resolvidas em até 1 dia útil, 0 envio errado e o teste dos alertas feito (simular o Serpro fora do ar e ver o alerta chegar) | É a fase final |

**Volta uma fase se:** houver qualquer envio errado ou as exceções
passarem de 5% das pessoas num mês.

Na Fase 1, o boleto pedido espera o OK do Fernando *(sugestão: avisar o
Fernando no celular quando tiver algo na fila, com a meta de aprovar em
até 1 hora, das 8h às 20h)*.

## 8. O que falta, em ordem

**Do lado do Fernando:**
1. Decidir o **CNPJ do TaCerto** (os Termos e a Privacidade também precisam dele).
2. Tirar o **e-CNPJ A1** desse CNPJ.
3. Assinar o **contrato do Integra Contador** na loja do Serpro, com o e-CNPJ.
4. Abrir o **WhatsApp oficial da Meta** (conta de empresa verificada) e
   decidir o número: o do Fisco, (37) 99199-9373, ou um novo. (A Z-API de
   hoje não é a API oficial.)
5. Mandar os **modelos M1 a M5** para a Meta e esperar a aprovação.

**O que construir (depois do "pode" do Fernando):**
1. **Tabela das fichas do mês** (pessoa + competência + estado), com o
   histórico de cada mudança.
2. **Tarefa agendada** (de hora em hora): cria as fichas e manda os lembretes.
3. **Função que fala com o Serpro** (gerar DAS, pagamentos, caixa postal,
   situação fiscal). O e-CNPJ fica como segredo no Supabase, nunca no app nem no Git.
4. **Função que fala com o WhatsApp oficial:** manda os modelos e recebe os toques.
5. **Painel de supervisão** (só do Fernando): fila de aprovação, resumo
   diário e alertas.
6. No app: **passo a passo da Autorização de Acesso** (abre o site
   oficial, nada do governo dentro do app) e o card "Próximo DAS" com o estado do mês.

## 9. Ainda não confirmado (não prometer no app)

Do `HANDOFF-08-10-PESQUISAS.md`:
- **Como confirmar as Autorizações de Acesso em grande quantidade.** Hoje
  parece manual no e-CAC, uma a uma, em até 30 dias. Enquanto for
  assim, é a única tarefa à mão do Fernando neste plano.

Das pesquisas (`docs/pesquisas/`) e deste plano:
- Teto de autorizações por representante (IN 2.320, art. 15): não
  publicado. Há limite de 20 por CPF: o representante deve ser o CNPJ do TaCerto.
- Se o "Gerar DAS" devolve a guia atrasada já com juros e multa (define
  o que fazer com `sem_resposta`).
- Quantos dias o pagamento leva para aparecer na Receita (as 2 consultas
  e os 3 dias são um palpite).
- Se a situação fiscal (00002) mostra a dívida ativa do MEI separada.
- Se feriado estadual ou municipal adia o DAS (hoje: só os nacionais).
- A Receita às vezes adia o DAS fora da regra (abril/2025 foi para
  28/05/2025): o Fernando precisa poder mudar a data à mão.
- Quando a DASN-SIMEI pelo Serpro vai poder ser contratada.
- Preço da Meta por mensagem; se o número do Fisco fica no celular e na
  API oficial ao mesmo tempo.
