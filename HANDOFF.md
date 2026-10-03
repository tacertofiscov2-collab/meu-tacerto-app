# TaCerto! — HANDOFF

> Cole este arquivo no início de um chat novo. Ele contém tudo que é
> preciso para continuar o trabalho sem repetir descobertas.
>
> Atualizado em 03/10/2026. Substitui as versões de 23/08, 20/09, 22/09,
> 23/09, 24/09, 26/09 e 27/09.
>
> ⚠️ A PARTIR DE AGORA O TRABALHO SEGUE NO **CLAUDE CODE** (ver Parte 14 e
> o arquivo `CLAUDE.md` na raiz do projeto).

---

## PARTE 0 — POR ONDE COMEÇAR (próximo passo)

### Estado em uma frase

**Tudo commitado na `main` (`f0d04cb`).** De 28 a 29/09 entraram:
Histórico de entradas, saídas, DAS e notas (com "Lançar nota"),
"Adicionar movimentações", Resumo com saídas e IR, o **topo que rola** em
todas as telas com rolagem, e o ajuste do Vite para túnel. **16 commits
sem `git push` na `main`** (a branch `preview-ajustes-telas` já foi para o
GitHub e está publicada como prévia na Vercel). A produção ainda está no
commit antigo `f1832bb`.

### ➡️ PRÓXIMO PASSO

1. **Testar no iPhone tudo o que foi feito em 28-29/09** (lista na Parte
   12 → "Conferir no iPhone"). Prints de tudo que não estiver certo,
   **juntos**, e corrigir em lote.
2. **Religar a proteção da prévia na Vercel** (Settings → Deployment
   Protection → Require Log In) assim que o amigo terminar de testar.
3. **Push da `main` para a produção**, alinhado com o Ruan. Depois do
   push, conferir o deploy da Vercel. Só depois disso dá para testar a
   conexão com o banco de ponta a ponta (a volta do banco cai na
   PRODUÇÃO — Parte 8).
4. Depois: termos com Open Finance, velocímetro 2027 junto com a emissão
   de nota, WhatsApp coincidindo com o app, produção da Pluggy.
5. **⚠️ POR ÚLTIMO (pedido do Fernando): contador parceiro** (Parte 5,
   item 7).

---

## PARTE 1 — QUEM É O FERNANDO E COMO TRABALHAR COM ELE

Fernando não é programador. Ele conhece o produto a fundo, testa tudo no
celular (iPhone) e tem olho apurado para detalhe visual — mas **não lê
código**.

**Regras de ouro (aprendidas na prática, algumas doloridamente):**

1. **SEMPRE entregue o ARQUIVO COMPLETO.** Ele nunca edita linha solta.
   Peça o conteúdo atual (`notepad caminho\arquivo`, ele cola), devolva
   o arquivo inteiro corrigido. **Para colar de volta (desde 27/09):**
   junto do código, mande o comando `notepad caminho\arquivo` — ele abre
   no Bloco de Notas, faz Ctrl+A → Ctrl+V → Ctrl+S, confere **UTF-8** no
   canto de baixo (se estiver ANSI: Salvar como → Codificação UTF-8) e
   fecha. O PC dele é lento; assim não precisa procurar no Cursor. Regra
   dele, textual: "voce que vai mudar chat, eu nunca mudo assim, e regra
   nossa".

2. **NUNCA reconstrua um arquivo de memória.** Peça o conteúdo e edite
   em cima do texto exato.

3. **Sempre peça `notepad`, nunca `findstr`, para LER conteúdo.** O
   `findstr` fica para conferir "salvou ou não". Exceção útil: listar
   NOMES de arquivos (`findstr /s /m /i "palavra" src\*.jsx`) para
   descobrir onde algo mora.

4. **NUNCA edite por comandos PowerShell com `` `n `` em aspas simples.**
   Grava o texto literal e quebra o código.

5. **Sempre diga o caminho de destino**, e destaque quando for pasta
   diferente do usual (`components`, `lib`, `context`, `hooks`, raiz de
   `src`, raiz do projeto). Um arquivo por vez.

6. **Confirme que salvou** com um marcador único no topo do arquivo
   (`/* DASHBOARD v14 ... */`) + `findstr /n /c:"DASHBOARD v14" caminho`.
   Use `/c:` — sem ele, o `findstr` procura cada palavra separada.

7. **Um passo por vez.** Mande um comando, espere o retorno.

8. **`&&` NÃO FUNCIONA** no PowerShell dele. Git vai um comando por vez:
   `git add ...` → `git commit -m "..."` → `git push`.

9. **Valide o JSX antes de entregar.** Confira imports órfãos e UTF-8.
   No container do chat dá para checar a sintaxe com o parser do
   TypeScript (está instalado globalmente). O `findstr` mostra `ÔÇö` no
   lugar do travessão e `├ú` no lugar de "ã" — é só o terminal. Os
   caracteres `´╗┐` antes do `/*` são o BOM de alguns arquivos (App.jsx,
   Dashboard.jsx) — inofensivos.

10. **Ele fica frustrado quando o problema volta.** Aí pare de corrigir
    sintoma e ataque a arquitetura. Quando uma correção falhar 3-4
    vezes, PARE e proponha mudar de abordagem.

11. **Não aplique o que ele não pediu.** Defeito seu pode corrigir, mas
    avise em uma linha.

12. **Salvar arquivo novo:** `notepad caminho\NomeExato.jsx` → o Bloco
    de Notas pergunta "Deseja criar um novo arquivo?" → Sim (conferir
    UTF-8). Alternativa: pelo Cursor (botão direito na pasta → New File).

13. **Conversas longas degradam.** Pode avisar, mas **o HANDOFF novo só
    é criado quando ELE mandar** (pedido explícito dele em 26/09).

14. **Site de terceiros (cadastro, painel):** peça print de cada tela
    ANTES de ele preencher ou clicar.

15. **Ctrl+S só salva com o cursor DENTRO do código.** Bolinha branca
    ● na aba = não salvo. Se o `findstr` não achar o marcador novo, a
    primeira suspeita é essa — ou ele copiou do cartão errado (regra 21).

16. **Quando a barra do Cursor mostrar `main*`**, faça `git add` SÓ dos
    arquivos do passo, não `-A`.

17. **Onde cada arquivo vai:**
    - `supabase/functions/...` (Edge Functions) → **DOIS lugares**:
      Supabase (Edge Functions → função → aba Code → colar → **Deploy
      updates**) E Cursor (cópia do Git).
    - `src/...` → **só no Cursor**. Vai ao ar pela Vercel com `git push`.

18. **Explique em linguagem simples, com exemplo do dia a dia.**

19. **Limite de imagens do chat:** quando ele avisar, peça que DESCREVA.

20. **Testes pelo Console do Chrome** funcionam bem (F12 → Console →
    `allow pasting`). Ver snippets na Parte 7.

21. **⚠️ Nome do cartão do arquivo COM A VERSÃO** (`Dashboard_v14.jsx`,
    `EscolherBanco_v2.jsx`). Em 25/09 ele colou a versão antiga porque
    havia dois cartões com o mesmo nome no chat. O arquivo de DESTINO no
    projeto continua com o nome de sempre — deixar isso claro.

22. **Decisões com várias escolhas:** a ferramenta de botões
    (perguntas de múltipla escolha) funcionou bem com ele.

23. **Pesquisa quando ele pedir "pesquisa aprofundada"**: ele gosta de
    fontes oficiais e de uma recomendação clara no fim.

24. **Git: mandar o `git add` e o `git commit` juntos**, um embaixo do
    outro, sem esperar ele avisar (pedido dele em 26/09). Ele roda um de
    cada vez.

25. **Mudança visual que não agradou:** em vez de colar e testar versão
    atrás de versão, mostrar **2-3 variações lado a lado no chat**
    (visualizador de telas) para ele escolher. Funcionou em 27/09
    (escolheu a "B" da explicação da conferência).

26. **Ele quer telas "básicas e minimalistas, sem muita explicação"**
    nos fluxos do dia a dia; explicação só onde é a primeira vez.

27. **Uma coisa por mensagem quando há troca de arquivos** (29/09): ou
    "cole este arquivo no seu PC" OU "me mande este arquivo", nunca os
    dois juntos — misturar fez ele colar o arquivo antigo no chat em vez
    de colar o novo no projeto, duas vezes.

28. **Pedir tudo de uma vez** (29/09): quando faltarem vários arquivos ou
    passos, listar tudo numa mensagem e esperar ele voltar com tudo (ele
    quer economizar tokens). Comando que junta vários arquivos num só:
    `Out-File telas.txt` e anexar — mas anexar .txt NÃO funcionou com
    ele; colar textos grandes também falhou. Na dúvida, um por vez.

29. **Testes em lote:** ele testa no iPhone e manda **todos os prints
    juntos**; a correção vem em lote.

30. **A partir de 03/10: Claude Code.** Ver Parte 14. As regras acima
    continuam valendo para a conversa; o que muda é que o Claude Code lê
    e altera os arquivos sozinho (sem Bloco de Notas, sem copiar e
    colar) e roda o git.

---

## PARTE 2 — O PRODUTO E A VISÃO

**TaCerto!** — ⚠️ **reposicionado em 25/09: app de GESTÃO do MEI, sem
complexidade — ENTRADAS E GASTOS, SEMPRE** (antes era "educação fiscal").
Foco em **MEI Caminhoneiro**. Velocímetro mostra quanto do limite anual
de faturamento a pessoa já usou.

- **Limites:** MEI R$ 81.000 / MEI Caminhoneiro R$ 251.600
- **Diferencial:** o **Fisco**, assistente ativo que vive no app E no
  WhatsApp. A **integração bancária** é, junto com o Fisco, uma das
  funções principais do app.
- Textos novos devem falar de **entradas e gastos** (receber E pagar),
  não só de faturamento.

### A ambição, nas palavras dele

> "Básicamente quero fazer tudo que um contador faz pela pessoa mei
> chat, absolutamente tudo, porém vamos ter que ser muito
> estratégicos."

### ⚠️ A EMISSÃO DE NOTA PELO WHATSAPP É O CORAÇÃO DO PRODUTO

> "jamais, emitir nota gratuitamente pelo site do governo é uma merda,
> é demorado, o site deles é horrivel, esse negocio nosso de emitir
> nota pelo chat watsap é um grande forte do app, muito"

**Nunca sugira tirar a emissão de nota do escopo.**

### O princípio que guia o desenho

Quanto mais a pessoa usa, menos o app pergunta. O aprendizado é por
**documento** (CNPJ/CPF), não por nome. **A emissão de nota NUNCA é
automática** — sempre passa pela confirmação do usuário.

### ⚠️ SÓ EMITIMOS NFS-e (nota de serviço)

Nada de nota de mercadoria, NFF ou CT-e.

### Contador parceiro (decisão de 26/09)

Quando surgir algo que **só um contador resolve**, o app encaminha a
pessoa para o **escritório de contabilidade parceiro**: botão que abre o
WhatsApp do escritório com texto pronto ("Olá! Vim pelo TaCerto..."). Quem
decide encaminhar será o **Fisco (IA)**, só quando precisar mesmo. Na
validação a função já fica disponível, nos pontos em que sabemos que é
caso de contador (ver Parte 0). O Fernando vai conversar com o escritório
antes. Combina com o plano Pro (DASN pelo contador parceiro).

### Suporte do próprio app

Será um **chat dentro do app** (a "janela de suporte", projeto futuro) —
**não** WhatsApp. Na validação, o Fernando resolve pessoalmente com as 10
pessoas (ajustes no Supabase na mão).

### Saídas, DAS e notas — FEITOS em 28/09 (ver Parte 6)

As saídas são guardadas **sozinhas, sem perguntar nada**; a tela de
saídas é IGUAL à de entradas. O segmento e a parte isenta do IR ficam no
**Resumo do ano**. Para depois: **"imprimir"** em PDF/DOC (relatório com
entradas, saídas, data, valor, quem pagou/recebeu e código do Pix — ajuda
o contador, não substitui nota).

### DAS paga: o contador pede os comprovantes? (pesquisado 28/09)

- **Para a declaração anual (DASN-SIMEI), não:** ela pede a receita do
  ano e se teve empregado. Quem mostra o que foi pago é o **extrato do
  PGMEI** (Portal do Simples → SIMEI Serviços → PGMEI → Consulta
  Extrato/Pendências); é ele que o contador confere.
- **O comprovante importa** quando um pagamento não aparece (passados 5
  dias úteis, levar o comprovante à Receita) e para **benefícios do
  INSS** (parte da DAS é a contribuição previdenciária).
- **DAS atrasada:** multa de 0,33% ao dia, limitada a 20%, + juros Selic.
- O app NUNCA diz "em aberto" (só o governo sabe o que foi pago): mostra
  o que está registrado e um atalho para o Portal do Simples.

### O que o Open Finance entrega (e o que não) — confirmado 27/09

- **Só leitura dos DADOS da transação:** data, valor, descrição do
  extrato, entrada/saída, meio (Pix, TED, boleto, cartão), nome e CPF/CNPJ
  de quem pagou/recebeu **quando o banco manda**, e no Pix geralmente o
  código único da transação. Não movimenta dinheiro.
- **NÃO entrega** o comprovante (PDF/imagem do app do banco) nem a nota
  fiscal/cupom da compra. Para gasto dedutível do IR normalmente é
  preciso documento → a pessoa manda a foto (app ou WhatsApp) e o Fisco
  sugere com qual pagamento ela casa (Parte 4-Caminhoneiro).
- Dá para montar telas com **cara de comprovante** com o que vier:
  documento **mascarado** (CNPJ 12.345.•••/••01-90, CPF •••.654.321-••),
  valor, data/hora, meio, banco, código do Pix — o que faltar some.

### Empréstimo, aporte, estorno: NÃO são faturamento (27/09)

Faturamento do MEI = receita da venda do que ele faz (serviço, frete,
mercadoria). Empréstimo (no CPF ou no CNPJ) é dívida; aporte do dono,
rendimento de aplicação, estorno e reembolso também não contam.
⚠️ Cuidado: **antecipação de recebíveis** da maquininha parece
empréstimo, mas é dinheiro de VENDA — conta (na data da venda).
Confirmar com o contador antes de o Fisco falar disso.

### Notificações: saíram do app (24/09)

Aviso importante vai pelo **WhatsApp**. No primeiro acesso, no lugar de
notificações, vai existir um **tutorial do Fisco**. A tela `Alertas.jsx`
(`/alertas`) ficou sem caminho.

---

## PARTE 3 — ⚠️ A REFORMA TRIBUTÁRIA DE 2027 (LEIA ANTES DE CODAR)

**Decisão: o app está sendo construído já para as regras que valem a
partir de 1º/01/2027.** Na validação, o Fernando explica pessoalmente
às 10 pessoas que o app segue as regras do ano seguinte.

Base: **art. 517 da LC 214/2025** e **Resoluções CGSN 190 e 191/2026**
(DOU 10/08/2026), efeitos a partir de 1º/01/2027.

- **Art. 106** — nota obrigatória em vendas e serviços, sem exceção para
  pessoa física.
- **Art. 106-A** — serviços vão de **NFS-e** de padrão nacional,
  obrigatoriamente, sem custo para o MEI.
- **Art. 106-B** — transporte intermunicipal/interestadual vai de NFF
  (não é emissão nossa).
- **Art. 2º, §§ 8º e 9º-A — ⚠️ MUDA O QUE É FATURAMENTO:** faturamento
  passa a ser a **emissão do documento fiscal**.

**O velocímetro hoje conta O QUE CAIU NA CONTA. A partir de 2027 conta
QUANDO A NOTA FOI EMITIDA.** **Ajuste estrutural mais importante
pendente.**

Regras úteis: MEI dispensado de destacar IBS/CBS; multa de obrigação
acessória com redução de 90% (mínimo R$ 50); estourar até 20% não expulsa
na hora; DAS 2027-2028 (Anexo XIII): ICMS R$ 1,00, ISS R$ 5,00, CBS
R$ 0,994, IBS R$ 0,006; MEI fora do regime regular/híbrido.

Ciclo anual: ano-calendário 1º/jan a 31/dez (o velocímetro zera);
DASN-SIMEI até **31 de maio** do ano seguinte; sem retroatividade.

Ainda nebuloso: alíquotas de referência de IBS/CBS; controvérsia sobre o
fim do regime de caixa.

---

## PARTE 3-IR — IMPOSTO DE RENDA DA PESSOA FÍSICA DO MEI (pesquisado 24/09)

A regra é a MESMA para todo MEI:
1. **Parcela isenta:** faturamento anual × **8%** (comércio, indústria,
   transporte de CARGA), **16%** (passageiros), **32%** (serviços).
2. **Lucro evidenciado:** faturamento − despesas comprovadas.
3. **Parte tributável:** lucro evidenciado − parcela isenta.
4. **Com contador (escrituração regular):** todo o lucro evidenciado
   vira isento.

→ **Despesas comprovadas reduzem o IR mesmo SEM contador.** Pesa mais
nas atividades de 8% (caminhoneiro, comércio). Para serviços (32%), com a
isenção do IR até R$ 5 mil/mês, muitas vezes o IR já dá zero.

Consequências: módulo de despesas para TODOS os MEIs; argumento por
ATIVIDADE; revisar a apresentação do plano Pro; ⚠️ validar números com o
contador parceiro antes de o Fisco falar disso.

---

## PARTE 3-MEI — TROCA DE TIPO DE MEI (pesquisado 26/09)

Fontes: gov.br (página MEI Caminhoneiro), Resolução CGSN 165/2022 (que
alterou a 140/2018), Sebrae, blogs de bancos sobre baixa de MEI.

1. **Comum → Caminhoneiro, mesmo CNPJ:** só pelo Portal do Empreendedor
   (alterar ocupações para a Tabela B) **entre o primeiro e o último dia
   útil de JANEIRO**. Feita em janeiro, vale o ano todo. Fora de janeiro,
   só no ano seguinte. Quem mudou de ramo em junho continua MEI comum
   (R$ 81 mil) até dezembro.
2. **Caminhoneiro → Comum:** exercer QUALQUER ocupação fora da Tabela B
   durante o ano faz valer os limites do MEI comum — o limite cai para
   R$ 81 mil **no ano todo, na hora** (pode já ter estourado).
3. **Fechou o MEI e abriu outro CNPJ:** baixa é definitiva; novo MEI =
   CNPJ novo, sem carência, empresa nova começando do zero (limite
   proporcional a partir do mês de abertura). O CNPJ antigo deve a
   **declaração de extinção** (DASN-SIMEI situação especial). Um CPF só
   pode ter um MEI ativo por vez. Abrir já como caminhoneiro: formalizar
   escolhendo ocupação da Tabela B.
4. **Limite proporcional no 1º ano:** R$ 6.750 × meses (comum) ou
   R$ 20.966,67 × meses (caminhoneiro), fração de mês conta inteira.
   O app já calcula (`limiteProporcional` em `fiscal.js`).

**Por que NÃO "excluir a conta e criar outra" para trocar o tipo:** nos
casos 1 e 2 o CNPJ é o mesmo, então o faturamento desde janeiro continua
contando — conta nova começaria do zero e o velocímetro mentiria. No
caso 3, os dados do CNPJ antigo são o que a pessoa precisa para a
declaração de extinção. E reconectar banco gera vaga paga nova na Pluggy.

⚠️ Validar os três casos com o contador parceiro.

---

## PARTE 3-TERMOS — TERMOS E CONSENTIMENTO NO OPEN FINANCE (pesquisado 25/09)

- Na tela **"Conexão bancária"** não precisa de termos (nada é aceito ali).
- Na **folha "Conectar conta"** (antes de ir ao banco) **precisa** — e já
  está feito (ESCOLHERBANCO v2). Motivo: no caminho B saímos do widget, e
  era o widget que mostrava o aceite dos Termos da Pluggy. A própria
  documentação da Pluggy diz que dá para criar conexões pela API, mas
  recomenda o widget porque ele mantém o fluxo dentro das regras do Open
  Finance — sem ele, isso vira tarefa nossa.
- **Resolução Conjunta nº 1/2020, art. 10:** identificar o cliente;
  finalidade; prazo; de qual banco vêm os dados; quais dados. **Proibido**
  consentimento por contrato de adesão, caixinha pré-marcada ou presumido
  → o aceite não pode ficar escondido nos Termos; o toque no botão é a
  ação ativa.
- **LGPD art. 9:** informação clara sobre finalidade, forma, duração,
  controlador e contato, compartilhamento e direitos; consentimento nulo
  se a informação for enganosa. Por isso NÃO prometemos "só saldo e
  extrato" (o banco pede o pacote completo).
- **Parcerias:** o contrato Pluggy–parceiro deve prever informar o cliente
  de que o parceiro não age em nome da instituição. O BC propôs em 2026
  que o consentimento cite expressamente a empresa parceira (1 por
  parceira) — até 26/09 não achei a norma publicada. Citar "TaCerto" na
  folha já deixa preparado.
- Pluggy pede consentimentos **sem data de expiração** por padrão →
  texto "Até você desconectar".

**Pendências:** perguntar à Pluggy se exigem mostrar os termos deles no
fluxo por API (e se têm texto padrão); `Termos.jsx` precisa cobrir Open
Finance e Pluggy; **política de privacidade do TaCerto** (precisa do CNPJ
como controlador); revisão por advogado; na produção, **registrar o
aceite** (data + versão do texto).

---

## PARTE 4 — MONETIZAÇÃO (desenhada em 19-22/09/2026)

**⚠️ NADA DISSO É PARA A VALIDAÇÃO.** Na validação, tudo é grátis e o
Fernando paga do bolso.

> "quero que ela praticamente só se pague durante 2 ou 3 anos... não
> importo de não ganhar mas não quero sair no prejuizo pois precisamos
> reinvestir... primeiro criar necessidade e valor em cima da
> plataforma, depois penso em dinheiro"

**Mês de conquista:** todo usuário novo entra com 30 dias de plano Médio
grátis. Não assinou → desconecta o Open Finance (`desconectarConexao`) e
cai no free manual. O histórico fica. Por volta do dia 20 o Fisco conta o
que já fez.

**FREE — manual:** Fisco 33%; 1 conexão Open Finance; DAS só lembrete;
DASN indica parceiro; NF não emite.
**MÉDIO — R$ 19,90/mês:** Fisco 66%; 1 conexão; DAS lembrete + boleto;
DASN com IA; folha com IA; 30% de emissão de NF; A1 à parte.
**PRO — R$ 49,90/mês:** Fisco 100%; 2 conexões; DAS lembrete + boleto;
DASN pelo contador parceiro + "isenção de IR na PF" (⚠️ rever à luz da
Parte 3-IR); folha IA + contador; 100% de NF; A1 incluso.

⚠️ Percentuais precisam virar números absolutos (falta a média de notas
por mês de um MEI).

**Pluggy (confirmado no WhatsApp, 24/09):** R$ 2.500/mês, franquia de
500 conexões, **1 conta conectada = 1 conexão** → R$ 5/conexão/mês.
⚠️ Dúvida: corrente + poupança na mesma conexão = 1 ou 2?

| | Médio R$ 19,90 | Pro R$ 49,90 |
|---|---|---|
| Receita/ano | R$ 238,80 | R$ 598,80 |
| Certificado A1 | — | R$ 85 |
| Pluggy | R$ 60 | R$ 120 |
| IA + WhatsApp | R$ 40 | R$ 55 |
| **Custo** | **R$ 100** | **R$ 260** |
| **Sobra** | **R$ 138,80** | **R$ 338,80** |

Ponto de equilíbrio: ~25 assinantes.

**Guarda de documentos:** tudo que o app gerar vai no WhatsApp E em
pastas no app; mesmo cancelando, as pastas ficam. ⚠️ Desde a validação.

**Nota simulada:** Pix confirmado como faturamento → nota SIMULADA com
"devo emitir e guardar essa NF?". Free → tela de planos.

---

## PARTE 4-CAMINHONEIRO — O DESENHO DO MEI CAMINHONEIRO (22/09)

Duas trilhas que não se misturam:

```
FATURAMENTO → velocímetro → limite anual → nota fiscal
DESPESAS    → tela de comprovantes → declaração de IR no fim do ano
```

**Despesa NÃO entra no velocímetro.** Módulo de despesas vale para TODO
MEI. O Open Finance vê entradas E saídas. Categorias para o caminhoneiro:
diesel / pedágio / manutenção / pneu / alimentação / diária (⚠️ confirmar
com o contador).

**⚠️ Duplicata de despesa (crítico):** a mesma despesa pode chegar pela
foto e pelo Pix. A despesa é o registro, com uma ou duas evidências; a IA
SUGERE o casamento, a pessoa CONFIRMA.

Frete interestadual (NFF) NÃO tem nota emitida pelo app.

---

## PARTE 5 — INTEGRAÇÕES: ESTADO E CUSTOS

### 1. Google OAuth — ✅ FUNCIONANDO (18/09)

### 2. Z-API (WhatsApp) — ⚠️ INFRAESTRUTURA PRONTA, SERVIÇO PAUSADO

`enviar-codigo` e `verificar-codigo` existem. ⚠️ Falha de segurança na
`verificar-codigo` (Parte 12). Religar: `src/lib/flags.js`,
`WHATSAPP_ATIVO = true`.

### 3. Pluggy (Open Finance) — ✅ CAMINHO B COMPLETO NO SANDBOX (25-26/09)

**Conta:** `dashboard.pluggy.ai`, e-mail `fernandofaria1346@gmail.com`,
time "TaCerto!". ⚠️ NÃO confundir com Meu Pluggy (`meu.pluggy.ai`).

**Comercial:** R$ 2.500/mês, 500 conexões. **Produção exige CNPJ ativo e
contrato social.**

**Trial** (produção, bancos reais): acaba por volta de **08/10/2026**. O
sandbox continua grátis.

**Customização** (dashboard → Dados Financeiros → Customização): "Nome
da empresa" estava **"Demo"** → trocar para **"TaCerto!"**. (No sandbox a
página de confirmação mostra "Pluggy Sandbox" — é fixo.)

**Símbolo da Pluggy:** uso autorizado. `public/pluggy-logo.png` +
componente `SimboloPluggy` (recorta os anéis).

#### O fluxo do caminho B (como está hoje)

1. Dashboard → símbolo da Pluggy → **"Conexão bancária"** (`/conectar-banco`)
2. "Conectar banco" → **"Escolha seu banco"** (`/conectar-banco/escolher`)
3. toca no banco → **folha "Conectar conta"** (CPF/CNPJ + consentimento)
4. "Continuar para o banco" → `criarConexao` → `statusConexao` até vir
   `urlBanco` → vai ao banco **na MESMA aba** (Safari bloqueia janela
   nova que não nasce do toque)
5. banco → página de confirmação da Pluggy ("Concluir")
6. volta para **`/conectar-banco/retorno?itemId=...`** → espera ~40 s →
   guarda a conexão → busca entradas desde janeiro → "Banco conectado!"
   (ou "Esse banco já estava conectado", ou o erro em linguagem simples)

- **CPF/CNPJ é obrigatório** no Open Finance. CPF → conta pessoal, CNPJ
  → empresa. **Não guardamos**: passa direto para a Pluggy, sem log.
- **O consentimento é o pacote completo** (o banco pede cartões,
  empréstimos etc.) → texto honesto: "o TaCerto usa só as entradas e os
  gastos".
- **Retorno exige https** →
  `https://meu-tacerto-app-alpha.vercel.app/conectar-banco/retorno`.

#### Como testar o caminho B no sandbox

- Banco de teste: **connector 600 "Sandbox Open Finance"** (aparece
  primeiro em "Mais usados", marcado "Banco de teste").
- **CPF de teste:** `761.092.776-73`.
- Link leva ao **MockBank**. Login: `ralph.bragg@gmail.com` /
  `P@ssword01`. Clicar Sign in **UMA vez**.
- ⚠️ **MockBank "400 Bad Request"**: FECHAR TODAS as janelas anônimas
  (fechar só a aba não basta), abrir uma anônima nova, fazer o fluxo
  inteiro sem pausa. Resolveu em 26/09.
- Telas: "I consent to the above data" → Confirm Consent → página da
  Pluggy → Concluir.
- **Enquanto a Vercel não tiver o código novo**, a volta cai na Vercel
  antiga ("Em construção"): trocar na barra de endereço o começo
  `https://meu-tacerto-app-alpha.vercel.app` por `http://localhost:8080`,
  mantendo `/conectar-banco/retorno?itemId=...`.
- **O MockBank só tem SAÍDAS** → "Ainda não achei entradas" é o
  resultado CORRETO. ⚠️ O caso "Achei X entradas" (X > 0) ainda não foi
  visto no caminho B.
- **Trava de dono testada (sem querer, 26/09):** a conexão de um usuário
  não abre na conta de outro — a tela de retorno mostra erro.

#### Proteções contra conexão/entrada repetida

1. **Escolha seu banco:** banco com o mesmo nome de um já conectado
   aparece "Conectado" e não abre (aviso "Esse banco já está conectado").
2. **Tela de retorno:** se mesmo assim vier repetido, apaga a conexão nova
   na Pluggy (`descartarConexaoNova`) e só atualiza a antiga. Se a pessoa
   recarregar a página, reaproveita a conexão com o mesmo itemId.
3. **Chave com `providerId`** nas entradas do Open Finance regulado.
Limite: compara por NOME.

#### Outros achados técnicos da Pluggy

- `GET /transactions` aposentado (410) → `GET /v2/transactions`.
- A Pluggy atualiza as conexões sozinha 1x por dia; transação nova pode
  levar até 24 h.
- `/auth` tem limite; a chave vale 2 h → a função guarda por 100 min.
- Lista de bancos: **195 bancos** (128 PF, 67 PJ). A regra "caixa" dos
  Mais usados pega "CAIXA - clientes sem conta", "Caixa Econômica
  Federal" e "Caixa Tem" (possível ajuste).
- Conexão criada e **abandonada** (fechou a folha ou não voltou do
  banco) fica parada na Pluggy; no sandbox some em 30 dias. ⚠️
  Perguntar se conta como vaga.
- ⚠️ **Apagar usuário direto no Supabase NÃO apaga as conexões dele na
  Pluggy.** Em produção, conta só se apaga pela tela Excluir conta — que
  ainda precisa desconectar os bancos antes (Parte 12).

### 4. Certificado Digital A1 — CERTIFICADORA JÁ ESCOLHIDA

Para o APP emitir sem gov.br. Provedores (Focus NFe, NFE.io, Celcoin,
Woovi) emitem NFS-e por API com A1. ~R$ 85/certificado.

### 5. IA do Fisco — NÃO ESCOLHIDA

⚠️ Já existem perguntas prontas que chegam ao chat (painel "Tirar
dúvidas" e "Não entendi, falar com o Fisco"). A qualidade das respostas
depende da IA que ainda não existe. Quando entrar, ela também decide o
**encaminhamento ao contador parceiro**.

### 6. DAS automatizado — A PESQUISAR

Provavelmente procuração eletrônica no e-CAC.

### 7. Contador parceiro — POR ÚLTIMO (Parte 0, item 6 do roteiro)

Nome + WhatsApp do escritório: o Fernando passa depois de conversar com
eles.

---

## PARTE 6 — DECISÕES DE PRODUTO JÁ TOMADAS

### Dashboard

**Botão do banco (DASHBOARD v6 em diante):** símbolo da Pluggy, sem
círculo e sem número. **Sem banco conectado:** texto **"Conectar banco"**
ao lado do símbolo, com um brilho verde que passa pelas letras e um
"pulinho" do símbolo no fim (o pontinho verde foi rejeitado). Depois da
1ª conexão, o texto some e o símbolo fica no mesmo lugar. Se desconectar
todos os bancos, o convite volta. Tocar leva SEMPRE a `/conectar-banco`.
Sincroniza ao abrir o app (máx. 1x a cada 30 min).

**Carrossel de 2 cards (DASHBOARD v7 → v14):**
- **Card A — ano:** velocímetro do limite anual; embaixo "Faturado" ×
  "Limite"; rótulo **"MEI · anual"** (14px). **É o ÚNICO que alarma:**
  borda vermelha pulsando acima de 100% (some ao deslizar para o B),
  balão "+N%" / alerta acima de 120%.
- **Balão ao lado do número:** existe SEMPRE. Card A: "?" na cor da
  faixa (ou "+N%"/alerta) → abre o **"Tirar dúvidas"** (só o título, sem
  subtítulo; perguntas por situação do ano). Passou do limite → primeiro
  item **"Entender a regra dos 20%"** (abre `/regra-vinte`).
- **Card B — média:** velocímetro da média por mês; embaixo **"Faturado"**
  (é a MÉDIA por mês) × **"Limite"** (a média limite); rótulo **"MEI ·
  média mês"**. **Nunca alarma:** balão sempre "?", só a COR muda com a
  situação. Tocar abre o card **"Média limite"**:
  *É quanto você pode faturar por mês, em média, para fechar o ano
  dentro do limite do MEI.* / caixa "R$ 81.000,00 no ano ÷ 12 meses =
  R$ 6.750,00 por mês" / *Não é um teto do mês...* / *Exemplo...* /
  *No velocímetro...* / botões **Entendi** (verde transparente) e
  **"Não entendi, falar com o Fisco"** (foto do Fisco; abre o chat com
  "Me explica melhor a média limite, de um jeito mais fácil de entender?
  Pode usar um exemplo do dia a dia."). Cabe inteiro na tela do iPhone.
- **Média limite** = limite CHEIO do ano ÷ 12 (R$ 6.750 / R$ 20.966,67).
  Não é teto mensal: não existe limite mensal para o MEI.
- **Média por mês (APPSTATE v2)** = faturado no ano ÷ meses que já
  passaram (contando o atual), desde janeiro ou desde o mês de abertura
  se abriu este ano. Antes dividia só pelos meses com lançamento (bug).
- Saíram do card B antigo: "Como estou", "Últimos lançamentos" (histórico
  segue pelo Perfil), "Meu ritmo", "Faixas de risco".

### Conexão bancária (`/conectar-banco`, CONECTARBANCO v9)

Símbolo da Pluggy maior (46), bloco ancorado embaixo (espaço sobrando vai
para cima), rodapé "Conexão feita pela Pluggy..." no pé da tela, texto do
botão 16px. Textos: *"Conecte o banco do seu MEI e o Fisco organiza suas
entradas e seus gastos sozinho."* / *"Nada entra no seu faturamento nem
nos seus gastos sem você confirmar."* / Desconectar: *"O Fisco para de
ver as entradas e os gastos novos desse banco..."*

### Escolha seu banco (`/conectar-banco/escolher`, ESCOLHERBANCO v2)

Título **"Escolha seu banco"**; subtítulo *"O banco que você usa no seu
MEI, para receber dos clientes e pagar os gastos."*; chave Conta pessoal
(CPF) | Conta da empresa (CNPJ); busca; "Mais usados" + "Outros bancos".
**Folha "Conectar conta":** TaCerto ⇄ logo do banco; *"Digite o CPF da
conta que você usa no seu MEI"* (máscara + dígitos verificadores; "O CPF
vai direto para a conexão com o banco. O TaCerto não guarda esse
número."); bloco **O que o TaCerto vai ver** (*As entradas e os gastos da
sua conta, a partir de 1º de janeiro deste ano, para organizar seu
faturamento e suas despesas. O banco pode pedir autorização para outros
dados também, mas o TaCerto usa só as entradas e os gastos.*) / **Por
quanto tempo** (*Até você desconectar...*) / **Quem faz a conexão** (*A
Pluggy, instituição autorizada pelo Banco Central.*); linha dos três
lugares; botão **Continuar para o banco** sempre visível (mesmo com
teclado); junto dele: *"Ao tocar em Continuar para o banco, você concorda
com os Termos de uso do TaCerto e com os Termos e a Política de
privacidade da Pluggy."* (links `/termos` e `https://www.pluggy.ai/legal`).

### Tipo de MEI travado (FEITO 26/09 — EDITARPERFIL v12)

- Editar perfil: card com **cadeado**; tocar abre **"Seu tipo de MEI"**:
  > **MEI (outras atividades)**, limite de R$ 81.000 no ano
  > O tipo segue o que está registrado no seu CNPJ e define o seu limite.
  > Por isso ele não muda por aqui.
  > **O que mudou?** 〉 Mudei de atividade no mesmo CNPJ 〉 Fechei meu
  > MEI e abri outro CNPJ 〉 Escolhi errado no cadastro
- **Mesmo CNPJ** — comum: *"A troca para MEI Caminhoneiro é feita no
  Portal do Empreendedor, e só em janeiro. Feita em janeiro, vale para o
  ano todo. Fora de janeiro, só passa a valer no ano seguinte."* —
  caminhoneiro: *"Se você passou a fazer outra atividade além do
  transporte de cargas, seu CNPJ vira MEI comum e o limite cai para
  R$ 81.000, já neste ano."*
- **Outro CNPJ:** *"O MEI fechado não volta, e o novo começa do zero, com
  limite proporcional aos meses que faltam no ano. O CNPJ antigo ainda
  precisa entregar a declaração de extinção."*
- As duas terminam com *"Quando a troca valer no seu CNPJ, a equipe
  TaCerto atualiza seu tipo aqui no app."* (na validação: o Fernando, no
  Supabase). O botão **"Falar com o contador parceiro"** entra aqui só no
  FIM de tudo (Parte 0, item 6 do roteiro).
- **Escolhi errado:** correção livre nos **primeiros 7 dias** após o
  cadastro (`user.created_at`), com confirmação do novo limite; depois:
  "O prazo para corrigir sozinho passou... Avise a equipe TaCerto".
- Onboarding: **SEM aviso** na escolha do tipo — o "Confira: isso define
  seu limite..." foi testado e REJEITADO pelo Fernando (26/09). O
  ONBOARDING v6 só corrigiu os acentos dos textos.

### Data de abertura (FEITO — EDITARPERFIL v12; o onboarding já perguntava)

Onboarding pergunta **"Você abriu seu MEI em 2026?"** → Sim: mês. Não:
não guarda nada. Editar perfil: campo **só para quem abriu no ano
corrente**, fácil de mudar; escolher ano anterior apaga a informação; em
janeiro some sozinho. O mês é necessário para o limite proporcional do
1º ano.

### Conferência de entradas (FEITO 27/09 — CONFERIRENTRADAS v10)

- **Portão (DASHBOARD v15):** ao abrir o Dashboard (e quando a
  sincronização com o banco termina), o app organiza sozinho o que o
  Fisco já sabe (`organizarPelasRegras`) e, se sobrar entrada sem regra,
  manda **direto** para `/conferir-entradas`. A pessoa **só volta a usar
  o app depois de confirmar tudo** (sem seta de voltar, sem "deixar para
  depois"). Sem rede/login: não faz nada.
- **Minimalista:** título "Novas entradas" grande e centralizado,
  "1 de 7" + barra, **um card por pagador com cara de comprovante**
  (PAGADOR, inicial, nome, documento mascarado, picote, Entradas /
  Período / Meio / Total recebido, "Ver as entradas") e a pergunta
  **"É faturamento?" [Sim] [Não]**. Tem "Anterior". Fim: "Pronto! R$ X
  entraram no seu faturamento." → Continuar.
- **Agrupamento:** por CPF/CNPJ do pagador; sem documento, pela
  descrição sem números ("TED RECEBIDA 001 AG 1234" → "TED RECEBIDA").
  **Ordem por DATA** (pagador da entrada mais antiga primeiro) — pedido
  dele.
- **Sim** → faturamento + **regra** (o Fisco aprende). **Não** → fica de
  fora e **NÃO vira regra** (um "Não" por engano nunca esconde
  faturamento para sempre; pergunta de novo da próxima vez).
- **Respostas gravadas só no fim** (por isso o "Anterior" funciona sem
  desfazer nada). `classificarGrupo` só mexe no que ainda está
  "pendente" → nunca duplica lançamento.
- **Explicação SÓ na primeira vez** ("primeira vez" = nenhuma entrada
  fora de "pendente"; vem do banco, vale em qualquer aparelho): ícone de
  lista com checks no topo; **3 passos centralizados** (1 Veja quem te
  pagou — Nome, valor e datas / 2 Responda: é faturamento? — Sim ou Não /
  3 O Fisco aprende — Da próxima vez, entra sozinho); "Por exemplo:"
  fora do quadro; quadro com "Sim = cliente pagando seu trabalho
  (serviço, frete, vendas)" e "Não = transferência sua, presente,
  empréstimo, reembolso" (Sim e Não em branco); botão "Entendi, vamos
  lá" perto da barra de baixo.
- Abre também pela faixa "X entradas esperando você" (Lançar,
  PENDENCIASENTRADAS v2 — os cards de uma entrada por vez SAÍRAM) e pelo
  "Conferir agora" da volta do banco (RETORNOBANCO v3 — o "Depois" saiu).

### REGRA DOS ANOS (28/09 — vale para o app inteiro)

Históricos, calendários e datas ficam **limitados ao ano em que a pessoa
começou a usar o app** (ano de criação da conta, hook `useAnoInicio`).
Antes disso não interessa. Usou 2026 inteiro → em 2027 o calendário
mostra 2026 e 2027; em 2028, 2026-2028; e assim por diante.

### Perfil → Meu MEI (PERFIL v6)

Itens, na ordem: **Histórico de entradas** (seta ↙ — dinheiro chegando),
**Histórico de saídas** (seta ↗), **Histórico de DAS** (calendário com
check), Histórico de notas fiscais, **Adicionar movimentações** (antes
"Adicionar faturamento"), Resumo do ano.

### Histórico de entradas (HISTORICO v3)

Título "Histórico de entradas". Busca, **"Ir para o mês"** (escolhe mês e
ano e a tela DESCE até o mês), card com total do mês + total do ano,
**"Lançar entrada"**, e a **lista do ano inteiro** com o nome do mês
pequeno separando (quem não quer filtrar, só rola).

### Histórico de saídas (SAIDAS v2) — IGUAL ao de entradas

Mesmo desenho e funções. As saídas do banco chegam sozinhas
(OPENFINANCE v8); **"Lançar saída"** (folha: valor, data, para quem, o
que foi, como pagou) para o que foi pago fora do banco; as lançadas à mão
têm "Lançada por você" e lixeira; as do banco não se apagam. SEM textos
de explicação.

### Histórico de DAS (HISTORICODAS v2)

Mesmo padrão do Histórico de notas: **12 janelinhas** (grade 3×4, sem
rolagem). **Paga = acesa** (verde, com valor); **achada no banco = meio
acesa** (amarelo: o app procura nas saídas "DAS"/"Simples
Nacional"/"PGMEI"/"SIMEI"/"Documento de Arrecadação"; "Receita Federal"
só até R$ 400; "das" sozinho só no começo da descrição — "POSTO DAS
FLORES" não conta); **a pagar = apagada**; meses que não chegaram e antes
da abertura do MEI = bem apagados e não abrem. Tocar abre o painel:
comprovante (foto/PDF), valor, data; ver, trocar, apagar. Atalho
"Portal do Simples ↗". SEM texto explicando. A DAS de um mês vence dia 20
do mês seguinte.

### Histórico de notas (HISTORICONOTAS v2)

Grade de 12 meses (mês com nota ACESO, com "2 notas"; sem nota, apagado).
**"Lançar nota"**: valor, data, número, cliente, CPF/CNPJ do cliente,
descrição, PDF ou foto da nota (opcionais). No painel do mês: "Ver nota"
e "Apagar" (só as lançadas à mão). As notas emitidas pelo próprio app
entram aqui no futuro (`origem` = app).

### Adicionar movimentações (ADICIONARFATURAMENTO v2)

Caminho continua `/adicionar-faturamento`. Opções: **Conectar banco** (em
destaque) → Lançar entrada → Lançar saída → Digitar o total → Enviar
extrato → Colar texto do extrato.

### Resumo do ano (RESUMOPERFIL v2)

Faturado, Limite, Faltam, Entradas (quantidade), **Saídas** (total) e
**Pagamentos** (quantidade); **Imposto de Renda**: segmento (8/16/32%) e
**parte isenta (aproximado)** = faturado × percentual; Meu ritmo;
gráfico **Por mês com duas barras** (entradas verde, saídas cinza).

### Topo que rola (TOPOROLAVEL v2) — em TODAS as telas com rolagem

O **título sobe com a rolagem**; a **setinha de voltar fica parada e
fica transparente** enquanto a tela está rolada, e volta ao normal no
topo. Uso: `<TopoRolavel titulo="..." onVoltar={...} />` como primeiro
item DENTRO da área que rola. `recuo={20}` quando a área não tem padding
(Perfil); `titulo=""` quando o título da tela é outro (Sobre, Cadastro);
`simples` = setinha sem círculo (telas de entrada, igual Login e
Onboarding). Já está em: Perfil, Editar perfil, Históricos de entradas e
saídas, Adicionar movimentações, Resumo, Conexão bancária, Termos, Sobre,
Regra dos 20%, Excluir conta, Alterar WhatsApp, Cadastro. **Exceção de
propósito:** Escolha seu banco (título, chave e busca parados; só a lista
rola). Telas sem rolagem (DAS, notas, Preferências, Alterar senha) não
usam.

### Outras decisões (mantidas)

- **Primeira conexão do banco: traz tudo desde 1º de janeiro.**
- **Frequência de conferência** (ideia para depois): `preferencias_fisco`
  já tem `frequencia_resumo` e `horario_resumo`.
- Confirmação de e-mail antes da 1ª nota; alterar WhatsApp exige senha;
  responsabilidade visível no fluxo; **tema padrão: escuro**; tela de FAQ
  morta.

---

## PARTE 7 — AMBIENTE

- **Projeto:** `C:\Users\ferna\Documents\meu-tacerto-app`
- **Stack:** React + Vite + Tailwind + Supabase. Gerenciador: **npm**
  (o `bun.lock` é resto antigo).
- **Dev:** `npm run dev` → PC em `localhost:8080`, iPhone (mesmo Wi-Fi)
  em `192.168.1.224:8080` (o `192.168.56.1` é do VirtualBox — não usar).
  No terminal do Vite, `u` + Enter mostra os endereços de novo.
- **Se o iPhone não abrir** (aconteceu em 28/09 e voltou sozinho em
  30/09): 1) desligar e ligar o Wi-Fi do iPhone; 2) conferir que está no
  mesmo Wi-Fi do PC; 3) plano B, no **PowerShell de ADMINISTRADOR** (não
  no terminal do Cursor): `Get-NetConnectionProfile |
  Set-NetConnectionProfile -NetworkCategory Private` e
  `New-NetFirewallRule -DisplayName "TaCerto Vite 8080" -Direction
  Inbound -Protocol TCP -LocalPort 8080 -Action Allow -Profile Private`.
  Outra saída usada em 28/09: túnel HTTPS
  `npx cloudflared tunnel --url http://localhost:8080` (o link
  `trycloudflare.com` muda a cada vez; o `vite.config.js` já tem
  `allowedHosts: [".trycloudflare.com"]`). Fechar o túnel com Ctrl+C
  quando não precisar.
- `npm install` avisou 8 vulnerabilidades — **NÃO rodar
  `npm audit fix --force`**.

### ⚠️ SUPABASE — COMO ENTRAR

**A conta dona entra pelo botão "Continue with ChatGPT".**
- Organização: `tacertofisco.v2` (id `exezvncqhbmilpcgwngf`)
- Projeto: `tacerto-fiscov2's Project` (ref `txejrqynagsfhteaofai`)
- E-mail: `fernandofaria1346@gmail.com`
- URL: `https://txejrqynagsfhteaofai.supabase.co`

**O projeto pausa em 7 dias de inatividade.** Diagnóstico:
`https://dns.google/query?name=txejrqynagsfhteaofai.supabase.co`
(`Status: 3` = pausado). Resolver: painel → "Restore project".

### EDGE FUNCTIONS E SECRETS

- **Publicadas (4):** `enviar-codigo`, `verificar-codigo`,
  `excluir-conta`, `pluggy` (**v9** no ar — 28/09: a tarefa
  `transacoes` devolve as ENTRADAS em `transacoes` e as SAÍDAS em
  `saidas`; tarefas: bancos, criar, status, transacoes, desconectar).
  `react-pluggy-connect` desinstalado.
- **Secrets:** `ZAPI_INSTANCE_ID`, `ZAPI_TOKEN`, `ZAPI_CLIENT_TOKEN`,
  `PLUGGY_CLIENT_ID`, `PLUGGY_CLIENT_SECRET`.
- Atualizar: função → aba Code → colar → **Deploy updates**. Logs: aba
  Logs. **Verify JWT:** LIGADO na `pluggy`. Os "7 problemas" do Cursor
  nos `index.ts` são falsos (Deno).

### Tabelas e balde criados em 28/09 (SQL rodado no SQL Editor)

Os três comandos abaixo JÁ FORAM RODADOS no Supabase (ficam só no banco,
não no Git). Todos podem ser rodados de novo sem estragar nada.

- **`saidas`** (saídas do banco + lançadas à mão; `origem` = `banco` |
  `manual`; chave única `user_id + pluggy_transaction_id`; manual usa
  `manual-<código>`) + coluna **`perfis.segmento_ir`**
  (`comercio_carga` 8% | `passageiros` 16% | `servicos` 32%).
- **`das_pagamentos`** (um registro por mês: `competencia` "AAAA-MM",
  `valor`, `pago_em`, `origem`, arquivo) + **balde privado
  `comprovantes`** no Storage (só foto/PDF, até 10 MB; cada pessoa só
  mexe na pasta `comprovantes/<user_id>/...`).
- **`notas_fiscais`** (`origem` manual | app, `numero`, `data`, `valor`,
  `tomador_nome`, `tomador_documento`, `descricao`, arquivo no mesmo
  balde, pasta `<user_id>/notas/`).

Todas com RLS: cada pessoa só vê e mexe nas próprias linhas.

```sql
-- SAIDAS
create table if not exists public.saidas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  conexao_id uuid,
  pluggy_transaction_id text not null,
  origem text not null default 'banco',
  descricao text, valor numeric(14,2) not null default 0,
  data timestamptz not null,
  recebedor_nome text, recebedor_documento text, recebedor_tipo text, meio text,
  criado_em timestamptz not null default now(),
  unique (user_id, pluggy_transaction_id)
);
create index if not exists saidas_user_data on public.saidas (user_id, data desc);
alter table public.saidas enable row level security;
-- policies: "saidas: ver/inserir/atualizar/apagar as proprias" (auth.uid() = user_id)
alter table public.perfis add column if not exists segmento_ir text;

-- DAS
create table if not exists public.das_pagamentos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  competencia text not null, valor numeric(14,2), pago_em timestamptz,
  origem text not null default 'manual',
  arquivo_path text, arquivo_tipo text, nome_arquivo text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (user_id, competencia)
);
-- RLS + policies "das: ..." iguais as de saidas
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('comprovantes','comprovantes', false, 10485760,
        array['image/jpeg','image/png','image/webp','image/heic','image/heif','application/pdf'])
on conflict (id) do nothing;
-- storage.objects: "comprovantes: ver/enviar/apagar arquivos proprios"
--   bucket_id = 'comprovantes' and (storage.foldername(name))[1] = auth.uid()::text

-- NOTAS
create table if not exists public.notas_fiscais (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  origem text not null default 'manual', numero text,
  data timestamptz not null, valor numeric(14,2) not null default 0,
  tomador_nome text, tomador_documento text, descricao text,
  arquivo_path text, arquivo_tipo text, nome_arquivo text,
  criado_em timestamptz not null default now()
);
-- RLS + policies "notas: ..." iguais
```

⚠️ Pendência: guardar esses SQLs completos no repositório
(`src/supabase/migrations.sql`), junto com o resto do schema.

### Snippets de teste no Console do Chrome

App aberto e logado, **F5**, F12 → Console. Dá para importar módulos:
`await import('/src/lib/supabase.js')`,
`await import('/src/lib/openfinance.js')`.

```js
// Status de uma conexão (quem está logado + resposta da função)
(async () => {
  const { supabase } = await import('/src/lib/supabase.js');
  const { data: u } = await supabase.auth.getUser();
  console.log('LOGADO COMO:', u?.user?.email);
  const { data, error } = await supabase.functions.invoke('pluggy', {
    body: { acao: 'status', itemId: 'COLE_O_ITEMID_AQUI' },
  });
  console.log('RESPOSTA:', JSON.stringify(data), error ? 'ERRO: ' + error.message : '');
})();
```

```js
// Lista de bancos
(async () => {
  const { supabase } = await import('/src/lib/supabase.js');
  const { data, error } = await supabase.functions.invoke('pluggy', { body: { acao: 'bancos' } });
  if (error) { console.log('ERRO', error); return; }
  console.log('BANCOS:', data.bancos.length);
  console.table(data.bancos.filter(x => x.sandbox));
})();
```

### Tema

`src/main.jsx` (MAIN v2) aplica tema e fonte ANTES de desenhar a tela,
lendo `localStorage` `tacerto_tema` (padrão **"escuro"**). O hook
`src/hooks/useTemaEscuroForcado.js` força escuro nas telas de entrada e
restaura a escolha ao sair (padrão "escuro" também). "auto" = claro das
6h às 18h, só se a pessoa ESCOLHER em Preferências.

### ⚠️ A CHAVE ANON NÃO É MAIS ROTACIONÁVEL

RLS conferida em 18/09 (8 tabelas, 15 políticas, `auth.uid()`).
`codigos_wpp` tem RLS SEM política, de propósito. Chave anon no `.env`
(nunca cole em chat). Confirm email DESLIGADO. Sem backup automático.

### Estado dos dados de teste (27/09)

- ⚠️ Em 25/09 o Fernando **apagou todos os usuários** no Supabase e
  recriou a Piloto2 (**id novo**). Conexões antigas da Pluggy ficaram
  órfãs no sandbox (somem em 30 dias).
- **Piloto2** (`piloto2@gmail.com` / `teste12345`): conexão "Sandbox Open
  Finance" (caminho B, 0 entradas reais) + **17 entradas de teste**
  (`pluggy_transaction_id` começando com `teste-`).
- **Piloto3** (`piloto3@gmail.com` / `teste12345`): criada em 27/09 para
  ver a "primeira vez"; também com as 17 entradas de teste.
- ⚠️ A prévia da Vercel usa o MESMO banco da produção: conferir se o
  amigo que testou criou conta e apagar se quiser.
- **Conta do Fernando:** sem banco; faturamento de teste de R$ 88.000
  (card A +9%, card B média R$ 9.777,78 = 88 mil ÷ 9 meses, +45%).
- As 17 entradas de teste viram **7 perguntas**: Logística Rápida (jan),
  Cooperativa de Cargas Sul (fev), Transportes Almeida (mar, 5 entradas,
  escrito de dois jeitos), Maria S Faria (CPF), Piloto Teste (CPF, "sou
  eu"), Depósito em dinheiro e TED Recebida (sem documento). Teste padrão:
  Sim para as 3 empresas → **R$ 32.106,25** no faturamento.
- O código do WhatsApp está desligado: no cadastro, qualquer código de 4
  a 6 números passa.

**Snippets (Console do Chrome no PC, logado na conta de teste; o Safari
do iPhone não tem Console):**

```js
// CRIAR as 17 entradas de teste na conta logada
(async () => {
  const { supabase } = await import('/src/lib/supabase.js');
  const { data: u } = await supabase.auth.getUser();
  const user = u?.user;
  if (!user) return console.log('Faça login primeiro');
  const ano = new Date().getFullYear(), mesMax = new Date().getMonth() + 1;
  const quando = (m, d) => new Date(ano, Math.min(m, mesMax) - 1, d, 12).toISOString();
  const E = (n, m, d, valor, nome, doc, desc, meio = 'PIX') => ({
    user_id: user.id, conexao_id: null, pluggy_transaction_id: 'teste-' + String(n).padStart(3, '0'),
    descricao: desc, valor, data: quando(m, d), pagador_nome: nome, pagador_documento: doc,
    pagador_tipo: doc.length === 14 ? 'CNPJ' : doc.length === 11 ? 'CPF' : null, meio, status: 'pendente' });
  const linhas = [
    E(1,3,5,1850,'TRANSPORTES ALMEIDA LTDA','12345678000190','PIX RECEBIDO TRANSPORTES ALMEIDA LTDA'),
    E(2,4,12,2400.5,'TRANSP ALMEIDA','12345678000190','TED 341 TRANSP ALMEIDA','TED'),
    E(3,6,8,3100,'TRANSPORTES ALMEIDA LTDA','12345678000190','PIX RECEBIDO TRANSPORTES ALMEIDA LTDA'),
    E(4,7,20,1950,'TRANSP ALMEIDA','12345678000190','PIX REC TRANSP ALMEIDA'),
    E(5,9,2,2780,'TRANSPORTES ALMEIDA LTDA','12345678000190','PIX RECEBIDO TRANSPORTES ALMEIDA LTDA'),
    E(6,2,15,3120.75,'COOPERATIVA DE CARGAS SUL','45678912000133','PIX RECEBIDO COOPERATIVA DE CARGAS SUL'),
    E(7,5,18,2890,'COOP CARGAS SUL','45678912000133','TED COOP CARGAS SUL','TED'),
    E(8,8,22,4015,'COOPERATIVA DE CARGAS SUL','45678912000133','PIX RECEBIDO COOPERATIVA DE CARGAS SUL'),
    E(9,1,28,5200,'LOGISTICA RAPIDA EIRELI','98765432000155','PIX RECEBIDO LOGISTICA RAPIDA EIRELI'),
    E(10,6,30,4800,'LOGISTICA RAPIDA EIRELI','98765432000155','PIX RECEBIDO LOGISTICA RAPIDA EIRELI'),
    E(11,3,10,200,'MARIA S FARIA','98765432100','PIX REC MARIA S FARIA'),
    E(12,8,3,350,'MARIA S FARIA','98765432100','PIX REC MARIA S FARIA'),
    E(13,4,1,500,'PILOTO TESTE','11122233344','PIX RECEBIDO PILOTO TESTE'),
    E(14,7,5,1000,'PILOTO TESTE','11122233344','TRANSF ENTRE CONTAS PILOTO','TED'),
    E(15,5,9,300,'','','DEPOSITO EM DINHEIRO','DEPOSITO'),
    E(16,9,14,450,'','','DEPOSITO EM DINHEIRO','DEPOSITO'),
    E(17,6,17,1200,'','','TED RECEBIDA 001 AG 1234','TED'),
  ];
  const { data, error } = await supabase.from('entradas')
    .upsert(linhas, { onConflict: 'user_id,pluggy_transaction_id', ignoreDuplicates: true }).select('id');
  console.log(error ? 'ERRO: ' + error.message : 'CRIADAS: ' + data.length);
})();
```

```js
// RESETAR: apaga os lançamentos criados das entradas de teste, volta as
// 17 para "pendente" e esquece as regras dos pagadores de teste
// (a conta volta a ser "primeira vez" se só tiver entradas de teste)
(async () => {
  const { supabase } = await import('/src/lib/supabase.js');
  const { data: u } = await supabase.auth.getUser();
  const user = u?.user;
  if (!user) return console.log('Faça login primeiro');
  const { data: testes } = await supabase.from('entradas').select('id, valor, data, pagador_documento')
    .eq('user_id', user.id).like('pluggy_transaction_id', 'teste-%');
  const chave = (v, d) => Number(v).toFixed(2) + '|' + new Date(d).toISOString().slice(0, 10);
  const alvo = new Set(testes.map((t) => chave(t.valor, t.data)));
  const { data: lancs } = await supabase.from('lancamentos').select('id, valor, data').eq('user_id', user.id);
  const apagar = (lancs || []).filter((l) => alvo.has(chave(l.valor, l.data))).map((l) => l.id);
  if (apagar.length) await supabase.from('lancamentos').delete().in('id', apagar);
  await supabase.from('entradas').update({ status: 'pendente', classificada_por: null, classificada_em: null, lancamento_id: null })
    .eq('user_id', user.id).like('pluggy_transaction_id', 'teste-%');
  const docs = [...new Set(testes.map((t) => t.pagador_documento).filter(Boolean))];
  if (docs.length) await supabase.from('regras_pagador').delete().eq('user_id', user.id).in('pagador_documento', docs);
  console.log('PRONTO:', apagar.length, 'lançamentos,', testes.length, 'entradas,', docs.length, 'regras');
})();
```

---

## PARTE 8 — GIT E DEPLOY

**Repo:** `github.com/tacertofiscov2-collab/meu-tacerto-app`
**Sócio:** Ruan. Alinhar antes de `git push`.

- Vercel: time **`tacerto1`** (plano Hobby), login
  `fernandofaria1346@gmail.com`, projeto `meu-tacerto-app`. Deploys em
  `vercel.com/tacerto1/meu-tacerto-app/deployments`.
- **Produção:** **`meu-tacerto-app-alpha.vercel.app`** — ainda no commit
  ANTIGO `f1832bb` (main do GitHub). É também o endereço de **retorno do
  banco** (Open Finance): enquanto a produção não for atualizada, quem
  conectar banco por uma prévia volta para a versão antiga.
- **Prévia:** branch `preview-ajustes-telas` (commit `f0d04cb`), deploy
  Ready no ambiente Preview. ⚠️ Em Settings → Deployment Protection o
  **"Require Log In" (Vercel Authentication) foi DESLIGADO** para um
  amigo testar sem login — **RELIGAR** quando ele terminar. O login com
  Google provavelmente não funciona na prévia (o retorno só conhece a
  produção).
- ⚠️ Não clicar em "Rotate" na `VITE_SUPABASE_KEY`
- Push com `rejected` / `fetch first` = o Ruan subiu algo antes. Não
  rodar mais nada, mandar print.
- Depois do próximo push, conferir se o deploy da Vercel passou.

**Commits de 25-26/09 (todos sem push):**
- `24b9e82` feat: caminho B do Open Finance - funcao pluggy v7, tela Conexao bancaria, simbolo da Pluggy
- `859cce4` ui: botao do banco com convite animado, Conexao bancaria com simbolo maior e rodape no pe da tela
- `f5b7708` feat: tela Escolha seu banco com folha Conectar conta (caminho B) + funcoes listarBancos, criarConexao e statusConexao
- `da87a51` feat: tela de retorno do banco (espera, guarda conexao, busca entradas, protege banco repetido) - caminho B completo
- `31bbc37` fix: tema abre escuro quando nada foi escolhido + textos de entradas e gastos na Conexao bancaria
- `4786be8` feat: card B vira velocimetro da media mensal (media limite), balao de duvidas sempre visivel, card A e o unico que alarma
- (26/09) feat: tipo de MEI travado com O que mudou (correcao livre em 7 dias), data de abertura so para quem abriu este ano, acentos no onboarding
- `bdfd24b` chore: faxina da funcao pluggy v8 (sem diagnostico e token) + remove react-pluggy-connect
- `476f0b1` feat: conferencia de entradas por pagador com cara de comprovante, explicacao na primeira vez e portao no Dashboard
- `d0c7886` ui: explicacao da primeira conferencia enquadrada (a CONFERIRENTRADAS v10)
- `ed94504` ui: velocimetro encolhe em tela baixa + titulo do Tirar duvidas rola junto com os cards
- `200474a` feat: historicos de entradas, saidas, DAS e notas (lancar nota), Adicionar movimentacoes, Resumo com saidas e IR, topo que rola
- `f0d04cb` Ajustes de telas e vite.config para tunel (topo que rola nas 9 telas restantes + allowedHosts) — feito na branch `preview-ajustes-telas` e trazido para a `main` por fast-forward em 30/09

**Situação:** `main` local = `f0d04cb`, **16 commits à frente** da
`origin/main`. A branch `preview-ajustes-telas` já está no GitHub.
Antes do push da `main`: alinhar com o Ruan.

⚠️ `telas.txt` (arquivo solto de 29/09, não versionado) pode ser apagado:
`Remove-Item telas.txt`.

⚠️ O `HANDOFF.md` não apareceu no `git status` de 25/09 nem no de 27/09 —
ou não está salvo na raiz do projeto, ou está no `.gitignore`. Conferir
ao salvar este (se o `git add HANDOFF.md` avisar "ignored", é o
`.gitignore`).

---

## PARTE 9 — PADRÕES VISUAIS

- **`.card-tacerto`** (em `src/index.css`): o padrão de card. Para mudar
  no app inteiro, mexa no CSS.
- **Foco dos campos:** `.campo-tacerto:focus` → borda verde fina. Nas
  telas novas (EscolherBanco) a borda verde de foco é feita por estado
  (`focado`). Não criar regra global.
- **Campos no iPhone: fonte ≥ 16px** (abaixo disso o Safari dá zoom).
- **Cabeçalho de tela:** seta à esquerda, título AO LADO — nunca
  centralizado.
- **Botão principal:** `var(--primary)`, `rounded-2xl`, `py-3.5`,
  **texto 16px** semibold.
- **Botão "leve" verde:** fundo `rgba(34,197,94,0.16)`, borda
  `rgba(34,197,94,0.45)`, texto `var(--primary)` (ex.: "Entendi").
- **Símbolo da Pluggy:** `<SimboloPluggy altura={N} />` — 46 no topo da
  Conexão bancária, 26 no Dashboard, 11 nos rodapés.
- **Modal de confirmação:** fundo `rgba(0,0,0,0.55)`, card `var(--bg)`
  com borda `var(--card-borda)`, `rounded-3xl`, dois botões lado a lado.
- **Painéis do Dashboard** (Tirar dúvidas, Média limite): `VIDRO_CHAT`,
  título em caixa alta pequeno centralizado, X no canto, trava a rolagem
  do fundo.
- **Folha de baixo com campo de texto** (EscolherBanco): portal no
  `document.body`, área que acompanha o `visualViewport` (fica acima do
  teclado), miolo que rola, rodapé fixo com o botão.
- **Tela centralizada na altura:** área de rolagem como coluna flex +
  `marginTop/marginBottom: auto` no bloco (nada é cortado se não couber).
- **Toasts:** `import { toast } from "sonner"`.
- **Topo que rola:** `TopoRolavel` (ver Parte 6) em toda tela com
  rolagem.
- **Grade de meses** (DAS, notas): `tela-fixa`, grade 3×4 com
  `card-tacerto`; **aceso** = fundo `rgba(34,197,94,0.12)` + borda
  `rgba(34,197,94,0.55)`; **apagado** = opacidade 0.45; **futuro** = 0.22
  e não abre. Painel do mês sobe de baixo (fundo `var(--surface)`, cantos
  20).
- **Folhas de lançar** (saída, nota, DAS): mesma técnica do
  `visualViewport` (botão no rodapé nunca some atrás do teclado); campos
  com fundo `var(--field)` dentro de folha `var(--surface)`.
- **Documento mascarado:** CNPJ `12.345.•••/••01-90`, CPF
  `•••.654.321-••`.

---

## PARTE 10 — O QUE FOI FEITO (arquivos-chave e versões atuais)

| Arquivo | Versão | O que é |
|---|---|---|
| `supabase/functions/pluggy/index.ts` | PLUGGY v9 (no ar) | bancos, criar, status, transacoes (entradas + saídas), desconectar |
| `src/lib/openfinance.js` | OPENFINANCE v8 | `classificarGrupo`, `organizarPelasRegras`, **saídas** (`buscarMovimentacoes`, `listarSaidas`, `lancarSaida`, `apagarSaidaManual`), **segmento** (`lerSegmento`, `salvarSegmento`) |
| `src/lib/das.js` | DAS v1 | `listarDasDoAno`, `guardarDas`, `apagarDas`, `acharDasNasSaidas` |
| `src/lib/notas.js` | NOTAS v1 | `listarNotasDoAno`, `lancarNota`, `apagarNota` |
| `src/hooks/useAnoInicio.js` | USEANOINICIO v1 | ano em que a pessoa começou a usar o app |
| `src/components/TopoRolavel.jsx` | TOPOROLAVEL v2 | título que rola + setinha fixa transparente (`recuo`, `simples`) |
| `src/components/SeletorMesAno.jsx` | SELETORMESANO v2 | prop `anoMinimo` |
| `src/pages/Historico.jsx` | HISTORICO v3 | Histórico de entradas |
| `src/pages/Saidas.jsx` | SAIDAS v2 | Histórico de saídas (`/saidas`) |
| `src/pages/HistoricoDas.jsx` | HISTORICODAS v2 | Histórico de DAS (`/das`) |
| `src/pages/HistoricoNotas.jsx` | HISTORICONOTAS v2 | notas + Lançar nota |
| `src/pages/AdicionarFaturamento.jsx` | ADICIONARFATURAMENTO v2 | "Adicionar movimentações" |
| `src/pages/ResumoPerfil.jsx` | RESUMOPERFIL v2 | resumo com saídas e IR |
| `src/pages/Perfil.jsx` | PERFIL v6 | Meu MEI com os históricos e setas |
| `src/pages/ConferirEntradas.jsx` | CONFERIRENTRADAS v10 | conferência por pagador |
| `src/components/PendenciasEntradas.jsx` | PENDENCIASENTRADAS v2 | só a faixa de Lançar |
| `src/pages/Dashboard.jsx` | DASHBOARD v17 | portão + velocímetro que encolhe em tela baixa + título do Tirar dúvidas que rola |
| `src/pages/RetornoBanco.jsx` | RETORNOBANCO v3 | volta do banco |
| `src/App.jsx` | APP v9 | + rotas `/saidas` e `/das` |
| `src/pages/EditarPerfil.jsx` | EDITARPERFIL v13 | + topo que rola |
| `src/pages/ConectarBanco.jsx` | CONECTARBANCO v10 | + topo que rola |
| `src/pages/Termos.jsx` | TERMOS v3 | + topo que rola (texto ainda diz "educação fiscal") |
| `src/pages/Sobre.jsx` | SOBRE v3 | + setinha que rola (texto ainda diz "educação fiscal") |
| `src/pages/RegraVinte.jsx` | REGRAVINTE v2 | + topo que rola |
| `src/pages/ExcluirConta.jsx` | EXCLUIRCONTA v4 | + topo que rola |
| `src/pages/AlterarWhatsapp.jsx` | ALTERARWHATSAPP v3 | + topo que rola |
| `src/pages/Cadastro.jsx` | CADASTRO v13 | + setinha simples que rola |
| `src/pages/Onboarding.jsx` | ONBOARDING v6 | acentos corrigidos |
| `src/pages/EscolherBanco.jsx` | ESCOLHERBANCO v2 | topo parado de propósito |
| `src/components/VelocimetroAnimado.jsx` | VELOCIMETROANIMADO v3 | |
| `src/context/AppStateContext.jsx` | APPSTATE v2 | `mediaMensal`, `mediaLimite` |
| `src/main.jsx` | MAIN v2 | tema padrão escuro |
| `vite.config.js` | (sem marca) | `allowedHosts: [".trycloudflare.com"]` |

**RetornoBanco — detalhes:** pergunta o status a cada 3 s (máx. 3 min →
"Está demorando mais que o normal / Continuar esperando"); mensagens
"Conectando ao banco..." → "Buscando suas movimentações..." (12 s) →
"Quase pronto..." (30 s); traduz status da Pluggy em: negado, expirou,
recusado (LOGIN_ERROR), falhou (OUTDATED/erro), falhou_app (nosso — "Tentar
de novo" retoma dali); processo fora do componente (mapa por itemId) para
não rodar em dobro no modo de desenvolvimento.

**EscolherBanco — pendências conhecidas no código:** conexão abandonada
fica parada na Pluggy; **CNPJ alfanumérico** (CNPJs novos a partir de
jul/2026) — o campo, o `criarConexao` e a função `pluggy` aceitam só
números; ajustar os três juntos.

**Anteriores:** `PendenciasEntradas.jsx` (faixa + "é faturamento?" em
`/lancar`), `flags.js`, EditarPerfil v11, AlterarWhatsapp,
autenticação, chat do Fisco em `ChatFiscoUI.jsx`. Schema em
`src/supabase/migrations.sql`.

---

## PARTE 11 — BUGS RESOLVIDOS (não reintroduzir)

1. Onboarding repetindo → `onboarding_ok`.
2. "E-mail já cadastrado" em e-mail novo → `if (loading) return` +
   fallback `signInWithPassword`.
3. WhatsApp pedido duas vezes → `finalizarCadastro()` única.
4. Mojibake → conferir UTF-8.
5. Rolagem travada → `.tela-rolavel` na raiz + `.conteudo-rolavel` FILHO
   DIRETO.
6. ⚠️ Teclado no iOS — parcialmente resolvido. Ainda acontece em
   EditarPerfil e ExcluirConta. (A folha do EscolherBanco usa a técnica
   do `visualViewport`, que funciona.)
7. Pluggy 410 → `/v2/transactions`.
8. Conexão repetida duplicando entradas → proteções da Parte 5.
9. **Tema abrindo BRANCO de dia** (26/09): o `main.jsx` usava "auto"
   como padrão quando não havia escolha guardada (janela anônima,
   aparelho novo, Safari limpando dados). Agora padrão "escuro".
10. **Média mensal inflada** (26/09): dividia só pelos meses COM
    lançamento. Agora divide pelos meses que passaram.
11. **Pontinho do botão do banco** substituído (pedido dele) pelo texto
    "Conectar banco" com brilho.
12. **Balão "?" por cima do "MEI · anual" em tela baixa** (28/09): o
    velocímetro agora mede a altura do card e encolhe (205 → mínimo 120).
13. **"Posto das Flores" contado como DAS** (28/09): a busca de DAS nas
    saídas só aceita "DAS" no começo ou junto de MEI/SIMEI/SIMPLES.

---

## PARTE 12 — PENDÊNCIAS

**Conferir no iPhone (o que foi feito em 28-29/09, ainda não testado):**
- [ ] Perfil: setas ↙ ↗, "Adicionar movimentações", topo que rola
- [ ] Histórico de entradas: ano inteiro com meses separando; "Ir para o
      mês" (calendário só com 2026); editar/excluir
- [ ] Histórico de saídas: saídas do banco de teste (Piloto2) depois de
      recarregar o Dashboard; Lançar saída; lixeira só nas lançadas
- [ ] Histórico de DAS: grade; guardar comprovante (mês acende); ver,
      trocar, apagar; "achamos no banco" (lançar saída "DAS Simples
      Nacional" R$ 81,05 em 18/09 → agosto amarelo)
- [ ] Histórico de notas: Lançar nota com foto (mês acende); Ver/Apagar
- [ ] Adicionar movimentações; Resumo (saídas, 2 barras, segmento, parte
      isenta salva)
- [ ] Topo que rola nas telas: Editar perfil, Termos, Sobre, Regra dos
      20%, Excluir conta, Alterar WhatsApp, Cadastro, Conexão bancária

**Git / Vercel / prévia:**
- [ ] Push da `main` (16 commits), alinhado com o Ruan; conferir deploy
- [ ] **Religar "Require Log In"** em Deployment Protection
- [ ] Conferir/apagar a conta criada pelo amigo na prévia
- [ ] Apagar `telas.txt`
- [ ] Guardar os SQLs de 28/09 em `src/supabase/migrations.sql`

**Open Finance:**
- [ ] Teste real de ponta a ponta (depois do push: a volta do banco cai
      na produção)
- [ ] Trocar "Demo" por "TaCerto!" na Customização da Pluggy
- [ ] Perguntas à Pluggy: corrente + poupança = 1 ou 2 conexões? conexão
      abandonada conta como vaga? exigem mostrar os termos deles?
- [ ] CNPJ ativo + contrato social para a produção; trial acaba ~08/10
- [ ] CNPJ alfanumérico (campo + `criarConexao` + função `pluggy`)
- [ ] Aplicar as regras já na sincronização
- [ ] Compras no cartão de crédito ficam de fora das saídas (só conta
      corrente/poupança)
- [ ] Confirmações pelo WhatsApp coincidindo com o app
- [ ] Conexão expirada → card "reconecte seu banco"; webhook
- [ ] Limpar as entradas de teste ("teste-") antes da validação

**Termos e textos:**
- [ ] `Termos.jsx` cobrindo Open Finance e Pluggy; política de
      privacidade (controlador = CNPJ); revisão por advogado
- [ ] Termos e Sobre ainda dizem "educação fiscal" (posicionamento antigo
      — hoje é "gestão: entradas e saídas")

**Saídas / DAS / notas:**
- [ ] "Imprimir" (PDF/DOC) das entradas e saídas
- [ ] DAS automatizada (integração com o governo) — pesquisar
- [ ] Notas emitidas pelo app entrando no Histórico de notas
- [ ] Velocímetro 2027 (nota emitida) junto com a emissão de nota

**⚠️ Segurança:**
- [ ] `verificar-codigo` aceita `userId` do corpo → pegar do login
- [ ] `excluir-conta` publicada mas FALTA no repo
- [ ] `ExcluirConta` precisa desconectar os bancos na Pluggy E apagar os
      arquivos do balde `comprovantes` antes
- [ ] Nunca apagar usuários direto no Supabase depois da produção

**Validar com o contador parceiro:** troca de tipo de MEI, despesas do
IR, empréstimo e antecipação de recebíveis, comprovantes da DAS.

**Ideias do Fernando para depois:** tutorial do Fisco; frequência de
conferência; tela da DAS + integração; plano Pro para serviços; suporte
por chat dentro do app.

**⚠️ Por último de tudo:** contador parceiro (Parte 5, item 7).

**Correções antigas:** teclado cobrindo campo (bug 6) em telas
antigas; chave anon legacy → `sb_publishable_`; dump do schema; `bun.lock`
e as 8 vulnerabilidades do npm.

---

## PARTE 13 — ARQUIVOS PRINCIPAIS

```
index.html                     favicon + script do teclado iOS (bug 6)
HANDOFF.md                     este arquivo (raiz do projeto)
PENDENCIAS_FUTURAS.md          o que fica para o Capacitor
public/
  favicon.svg  fisco-perfil.png  fisco-joinha.png
  pluggy-logo.png              logo oficial da Pluggy (autorizado)
src/
  main.jsx                     ⚠️ MAIN v2 (tema padrão escuro)
  App.jsx                      ⚠️ APP v9 (rotas)
  index.css                    --vidro-*, --card-borda, .card-tacerto,
                               .campo-tacerto, .tela-fixa, .tela-rolavel
  supabase/migrations.sql      ⚠️ schema (pasta src\supabase — NÃO
                               confundir com a supabase\ da raiz)
  context/
    AppStateContext.jsx        ⚠️ APPSTATE v2 (mediaMensal, mediaLimite)
  hooks/
    useTemaEscuroForcado.js    força escuro nas telas de entrada
    useAnoInicio.js            ⚠️ USEANOINICIO v1 (regra dos anos)
  components/
    VelocimetroAnimado.jsx     ⚠️ VELOCIMETROANIMADO v3
    TopoRolavel.jsx            ⚠️ TOPOROLAVEL v2 (título que rola)
    SeletorMesAno.jsx          ⚠️ SELETORMESANO v2 (anoMinimo)
    SimboloPluggy.jsx          anéis da Pluggy
    PendenciasEntradas.jsx     ⚠️ PENDENCIASENTRADAS v2 (só a faixa)
    ChatFiscoUI.jsx            o chat do Fisco
    Calendario.jsx             seletor de mês/ano (EditarPerfil)
    TecladoVisivel.jsx         ⚠️ NEUTRALIZADO — registro do bug 6
    TransicaoTela.jsx  BottomNav.jsx  AuthError.jsx  Fisco.jsx  Valor.jsx
    SwipeBack.jsx              DESATIVADO de propósito
  lib/
    openfinance.js             ⚠️ OPENFINANCE v8 (+ saídas, segmento)
    das.js                     ⚠️ DAS v1
    notas.js                   ⚠️ NOTAS v1
    fiscal.js                  limites, faixas, limiteProporcional
    userState.js               useUserState (usado pelo EditarPerfil)
    flags.js  supabase.js  contas.js  chatHistorico.js  faqFisco.js
    localData.js  utils.ts
    (por último) contadorParceiro.js
  pages/
    Dashboard.jsx              ⚠️ DASHBOARD v17
    Historico.jsx              ⚠️ HISTORICO v3 (Histórico de entradas)
    Saidas.jsx                 ⚠️ SAIDAS v2 (Histórico de saídas)
    HistoricoDas.jsx           ⚠️ HISTORICODAS v2
    HistoricoNotas.jsx         ⚠️ HISTORICONOTAS v2
    AdicionarFaturamento.jsx   ⚠️ v2 ("Adicionar movimentações")
    ResumoPerfil.jsx           ⚠️ RESUMOPERFIL v2
    ConferirEntradas.jsx       ⚠️ CONFERIRENTRADAS v10
    ConectarBanco.jsx          ⚠️ CONECTARBANCO v10
    EscolherBanco.jsx          ⚠️ ESCOLHERBANCO v2
    RetornoBanco.jsx           ⚠️ RETORNOBANCO v3
    EditarPerfil.jsx           ⚠️ EDITARPERFIL v13
    Onboarding.jsx             ⚠️ ONBOARDING v6
    Lancar.jsx                 onde mora a faixa PendenciasEntradas
    RegraVinte.jsx             aberta pelo painel de dúvidas (>100%)
    ChatFiscoPagina.jsx        /fisco (recebe primeiraMensagem)
    Perfil.jsx                 ⚠️ PERFIL v6
    Cadastro.jsx (v13)  Login.jsx  AuthCallback.jsx  Welcome.jsx
    Preferencias.jsx  AlterarWhatsapp.jsx (v3)  AlterarSenha.jsx
    ExcluirConta.jsx (v4)  Termos.jsx (v3)  Sobre.jsx (v3)
    Alertas.jsx                ⚠️ sem caminho
    Faq.jsx                    ⚠️ TELA MORTA
supabase/                      ⚠️ pasta da RAIZ (Edge Functions)
  functions/
    enviar-codigo/  verificar-codigo/
    pluggy/index.ts            ⚠️ PLUGGY v9 (no ar)
    (excluir-conta/ publicada, mas FALTA aqui)
```

**Último commit:** `f0d04cb` "Ajustes de telas e vite.config para tunel"
(na `main` e na `preview-ajustes-telas`). Nada pendente de commit além
deste HANDOFF (e do `CLAUDE.md`, quando for criado).

---

## PARTE 14 — CLAUDE CODE (a partir de 03/10/2026)

O trabalho passa para o **Claude Code**, pelo aplicativo Claude para
computador (aba **Code**), aberto na pasta
`C:\Users\ferna\Documents\meu-tacerto-app`.

- O **`CLAUDE.md`** na raiz do projeto tem as regras de trabalho com o
  Fernando e o resumo do projeto; o Claude Code lê sozinho ao começar.
  Este HANDOFF é a referência completa.
- **Muda:** o Claude Code lê e altera os arquivos direto (só as linhas
  necessárias), roda `git`, `npm` e conferências, e vê os erros. Acabou o
  Bloco de Notas / copiar e colar / `findstr` de conferência.
- **Continua:** o Fernando testa no iPhone e manda os prints (arrastando
  o arquivo do print para a janela do Claude Code — colar print no
  Windows às vezes falha); Supabase e Vercel são feitos no navegador por
  ele, com o passo a passo.
- **Regras de ouro:** commit a cada etapa (dá para voltar); nunca `git
  push` sem ele confirmar que alinhou com o Ruan; mostrar o que vai mudar
  antes de mudar; português simples.
- O chat do claude.ai continua útil para decisões de produto, pesquisas e
  prévias visuais lado a lado.