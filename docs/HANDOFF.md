# TaCerto! — Resumo de passagem (sessões de 05 a 10/10/2026)

> **Para o Claude do chat novo:** leia este arquivo primeiro. Depois:
> **`CLAUDE.md`** (regras de trabalho e quem é o Fernando),
> **`docs/HANDOFF-08-10-PESQUISAS.md`** (decisões de 07–08/10, com fontes),
> **`docs/DECISOES-PILOTO.md`** (decisões e pendências do piloto),
> **`docs/PLANO-AUTOMACAO-DAS.md`** (como o DAS vai ficar automático),
> **`docs/AUTOMACAO-PILOTO.md`** e, se precisar, o **`HANDOFF.md` da raiz**
> (referência completa). As pesquisas estão em `docs/pesquisas/`. Login no
> painel do Supabase, clique por clique: **`docs/LOGIN-WHATSAPP-PASSO-A-PASSO.md`**.

---

## 0. Como o Fernando trabalha (resumo do CLAUDE.md)

- Não é programador; testa tudo no **iPhone (Safari)**. Português simples,
  respostas curtas, **tudo de uma vez** para testar em lote.
- Telas **minimalistas**: pouco texto, **menos cor**, fundo preto, verde
  só no botão de confirmar/continuar (contorno). Quando um visual não
  agradar: mostrar **2-3 variações**.
- **"Aparece só quando precisa"** (08/10): cada pedido de dado vem com UMA
  frase dizendo o benefício; tudo opcional; dado que falta mostra um aviso
  discreto ("Não preenchido").
- Antes de mexer: dizer em poucas linhas o que muda. Marca de versão na
  1ª linha de cada arquivo alterado (`/* ARQUIVO vN — o que mudou (vN-1: ...) */`).
  Commit a cada etapa. **`git push` só quando ele pedir.**
- SQL e funções do Supabase: **só com o "pode"** dele (e a rotina de
  cópia/conferência do CLAUDE.md).

---

## 1. Onde está o código

- Branch **`piloto-simplificado`**. **Enviado ao GitHub (`git push`) em
  10/10, a pedido do Fernando**, com tudo da tarefa de 08-10: a prévia da
  Vercel passa a mostrar esta versão. Nunca `--force`. A **`main` não foi
  mexida**; produção continua em `f1832bb`.
- Commits da tarefa de 08-10 (antigo → novo): `b459798` (SQL pendente e
  pesquisas), `dc957cd` (CNPJ), `df0cd74` (velocímetro), `e4cd3e0`
  (bibliotecas do extrato), `d19cfdf` (CNPJ conferido), `dc8b181` (SQL
  rodado), `f03bff8` (enviar extrato), `2a2b458` (Meu lucro), `750deb2`
  (Notas fiscais), `a9abf2b` (DAS e lembretes), `391165f` (Simulador),
  `eb47665` (Termos e Privacidade) e os de fechamento (revisão e este
  resumo).
- Servidor local: o `npm run dev` costuma rodar no terminal do Cursor
  (`localhost:8080`; iPhone em `192.168.1.224:8080`). Nas sessões de
  08-10 o Claude ligou pelo app (configuração `tacerto-dev` em
  `.claude/launch.json`) e **desligou** no fim. Para o iPhone, o Fernando
  liga o `npm run dev` no Cursor.

---

## 2. O app hoje, tela por tela

### Antes de entrar (sempre no tema preto)

| Tela | Endereço | Como está |
|---|---|---|
| **Boas-vindas** (slides) | `/` | 5 slides, sem mudança (pedido). ⚠️ O slide 1 ainda mostra o Início antigo. |
| **Entrar pelo WhatsApp** | `/login`, `/cadastro` | Número + código de 6 números. **Modo teste ligado** (37 00000-0001 a 9999, qualquer código). |
| **Cadastro (Onboarding)** | `/onboarding` | **Novo (08-10):** 1 Nome → **2 "Qual o CNPJ do seu MEI?"** (opcional; "Com ele eu preencho o resto pra você."; máscara, confere os dígitos; "Buscar" na BrasilAPI; "Preencher depois") → **"Achei você"** (nome, "Parece MEI Caminhoneiro", 1 toque troca, "MEI desde MM/AAAA"; aviso amarelo se a Receita diz que não é MEI) → "Está certo" grava tudo e vai pro Início. Sem CNPJ (ou busca falhou: "Não consegui buscar agora"): 3 Tipo de MEI → 4 "Abriu este ano?" → "Começar a usar". **Saiu** a etapa "Quanto você já faturou". |

### Dentro do app

| Tela | Endereço | Como está |
|---|---|---|
| **Início** | `/dashboard` | Visual F. **Novo:** embaixo do velocímetro, "Atualizado em 08/10 às 14:32" + botão "Atualizar velocímetro" (contorno). Zerado no ano: "Falta informar" e o botão em verde. **Selo** pequeno ao lado de "MEI Caminhoneiro · anual": "Estimado" (tem total do ano digitado) ou "Conferido" (veio de extrato e foi confirmado). A barra DAS \| Fisco \| NF não mudou de cara; o **NF** agora abre a janela "Notas fiscais". |
| **Folha "Atualize seu velocímetro"** | (botão do Início e sininho) | 3 jeitos, uma frase cada: **Enviar extrato** (recomendado, borda verde fina) · **Digitar** (o "+") · **Mandar pro Fisco no WhatsApp**. |
| **Enviar extrato** | `/enviar-extrato` | **Novo.** "Escolher arquivo" (OFX, CSV ou PDF). OFX/CSV lidos no celular, sem IA; só fica o que é do ano (ou da abertura em diante); o mesmo arquivo não entra 2x. **Desde 10/10 (tarde):** o que bate no dia e no valor com outro extrato já enviado entra marcado "pode ser repetido" (a linha "X podem ser repetidas: você confirma na conferência."). Fim: "Encontrei 37 entradas e 52 saídas de jan a out. Vamos conferir?" → Conferir / Depois. Mesmo arquivo de novo: "Esse extrato já estava aqui. Nada novo." PDF: guardado (pasta privada) "em análise": "Recebi! Vou ler e te aviso quando estiver pronto." |
| **Conferência "É faturamento?"** | `/conferir-entradas` | **Novo:** 6 respostas curtas: É frete/serviço ✓ · Reembolso de despesa ✓ · Vale-pedágio ✕ · Empréstimo ✕ · Estorno/devolução ✕ · Dinheiro meu/família ✕ (MEI comum: "É venda/serviço" e sem vale-pedágio). Quando o extrato já diz o que é (vale-pedágio, estorno, resgate...), vem num grupo próprio com a resposta sugerida (borda verde fina). O que conta vira regra do pagador. **Nada contado duas vezes**: recebimento já lançado à mão (mesmo valor, até 3 dias) não é lançado de novo; o que já estava no "total do ano" digitado diminui o ajuste. A tela final avisa os dois casos. Vindo do extrato, segue para os gastos. **Desde 10/10 (tarde):** (a) os possíveis repetidos vêm num grupo só, primeiro: "Pode ser repetido · N entradas iguais às de outro extrato" → **Sim, é repetido** (não conta) ou **Não é repetido** (vira as perguntas normais, por pagador); (b) **o extrato substitui o total digitado** quando os extratos cobrem do começo do ano (ou da abertura) até o dia do total e nada ficou sem resposta: o ajuste sai e a tela final diz "Agora o velocímetro usa o extrato no lugar do total que você digitou." (selo vira Conferido). Extrato de só alguns meses não substitui (só desconta o que já estava no total). |
| **Seus gastos** | `/conferir-saidas` | **Novo.** Só os gastos do extrato em dúvida: "É gasto do caminhão?" com a categoria, ou "Não, é pessoal"; "O resto é pessoal" encerra. Grava na hora e lembra pelo fornecedor. **Desde 10/10 (tarde):** o grupo "Pode ser repetido" primeiro (Sim, é repetido / Não é repetido), igual às entradas. |
| **Meu lucro** | `/meu-lucro` | **Novo** (o Resumo do ano evoluído). Mês \| Ano. Recebido · Gastos · Sobrou (%). Ano com gráfico por mês. Gastos → por categoria → cada gasto com "com nota"/"sem nota"; tocar: anexar nota (foto/PDF), trocar categoria, "Não é do negócio". Sem extrato: só Recebido + "Envie o extrato para ver quanto sobrou." **Desde 10/10 (tarde):** linha **"Lançar gasto"** (dinheiro vivo: valor, data, categoria, "o que foi"; entra já como gasto do negócio; aparece como "Gasto em dinheiro" e pode ser apagado) e, no fim de Gastos, **"Gastos pessoais"** (os que não contam, inclusive os "repetido"; tocar → "É do negócio" → escolhe a categoria e volta para o lucro). |
| **Simulador** | `/simulador` | **Novo.** Quanto recebe por mês (já vem a média) e gasta (opcional) → previsto no ano, % do limite, mês em que passa, quanto ainda pode por mês, DAS do ano, Imposto de Renda estimado. | **Desde 12/10 (Bloco F):** virou **"Quanto ainda posso faturar"**, uma das contas do **Calcular** (sem o "quanto gasta", sem DAS e IR, que têm conta própria).
| **Calcular** | `/calcular` | **Novo (12/10, Bloco F).** Perfil > Meu MEI > **Calcular** (no lugar do Simulador). Topo: barra **"Calculado com seus dados até 09/10 (há 3 dias)."** + "Enviar extrato" com selo Recomendado (sem recebimentos no ano: "Para calcular, comece pelo extrato do banco..." e o botão vira o destaque). "O que você quer calcular?": **Quanto ainda posso faturar** (`/simulador`) · **Imposto de Renda** (`/calcular/imposto-de-renda`, a calculadora que estava na Declaração anual; o endereço antigo leva para cá) · **DAS do ano** (`/calcular/das-do-ano`: DAS do ano, já venceram, falta vencer com o próximo dia, pagos que você guardou) · **Meu lucro**. A barra aparece no topo de todas as contas. |
| **Notas fiscais** | `/notas-fiscais` | **Novo.** Sem certificado: quando emitir (NFS-e só frete na mesma cidade; CT-e entre cidades contratado direto; agregado sem IE em MG hoje não emite; 2027 em todo serviço), como o TaCerto ajuda, Certificado A1 (**R$ 100,34**, preço de custo; videochamada) e "Tenho interesse no certificado" (WhatsApp). Com `perfis.nota_automatica_ativa = true` (o Fernando liga à mão): vira **"Minhas notas"**. | **Desde 12/10 (Bloco E):** fica no Perfil > **Meu MEI** (logo abaixo do DAS; saiu da Ajuda). Topo: "Emita suas notas grátis pelo TaCerto" + "Para emitir é preciso o Certificado Digital A1 (R$ 100,34, pago à certificadora; o TaCerto não ganha nada)." (CDC). **Emitir nota** (sem A1: folha com O que é / Por que precisa / Como tira + "Tenho interesse no certificado" e, embaixo, "Sem certificado, hoje": a Isa monta a nota com você ou fazer sozinho; com A1: WhatsApp com a Isa) · **Guardar uma nota** (foto ou PDF primeiro, valor, data, número, cliente...) · **Minhas notas** (`/notas-fiscais/minhas`, grade por mês sem verde). Nota guardada deste ano: **"Essa nota é de um frete que você recebeu? Posso somar R$ X no velocímetro?"** Sim → procura recebimento parecido (±1%, ±15 dias): achou, "Achei um recebimento parecido: 03/10, R$ 1.500,00. É o mesmo?" (só liga a nota a ele); não achou ou "é outro": cria o lançamento "Nota fiscal nº 77 · Cliente". O extrato que chegar depois casa com esse lançamento na mesma folga (não conta duas vezes). Nota ligada mostra "No velocímetro: Sim". |
| **Preferências** | `/preferencias` | **Religada, só com o Lembrete do DAS:** dias antes (7, 5, 3, 2, 1, no dia; padrão 7, 2 e no dia), horário (padrão 9:00), "Não quero lembretes". Grava no perfil. |
| **Painel do DAS** | (DAS no Início) | Agora mostra no topo "Vence 20/10 · R$ 195,52" (data real com feriados; valor pelo CNAE). |
| **DAS** | `/das` | **Novo (12/10, Bloco D).** Abre pelo Perfil (Meu MEI > **DAS**, "Vence 20/10") e pelo "Emitir boleto" do card Próximo DAS do Início (antes abria a folha). Título "DAS" + "o imposto mensal do MEI". Topo: próximo vencimento real ("terça, 20/10", feriado prorroga) e o valor pela atividade (com CNPJ: "Valor pela sua atividade (frete entre cidades)"; sem: "o mais comum"). **"Como você quer pagar seu DAS?"**: **A Isa me manda o boleto** (selo Recomendado; "Todo mês, antes do dia 20, no seu WhatsApp."; sem CNPJ abre a página do CNPJ com "Para a Isa gerar seu boleto do DAS, preciso do seu CNPJ." e volta; com CNPJ: guarda a escolha, religa lembretes e avisos no WhatsApp e abre o WhatsApp pedindo o boleto; escolhida, mostra "Lembretes no WhatsApp · 7 e 2 dias antes e no dia · 9:00" → Preferências) ou **Pago sozinho** (4 passos: App MEI ou Portal do Simples, CNPJ com toque para copiar, gerar, pagar; "Abrir o Portal do Simples"). Mais: **A Isa me ajuda agora** (boleto deste mês ou atrasado) e **Histórico do DAS** (`/das/historico`, a grade de 12 meses com o comprovante, agora sem verde e sem a barra de baixo). Chave `MOSTRAR_PAGINA_DAS`; `/como-pagar-das` abre `/das`. Nunca fala em débito automático. |
| **Perfil** | `/perfil` | Meu MEI: **CNPJ** (12.345.•••/••01-90 ou "Não preenchido" + pontinho amarelo; abre `/perfil/cnpj`), Tipo, Abertura, Limite, Já faturado, Limite restante, **Meu lucro**, **Simulador**, Histórico. Conta: **Preferências** (Lembrete do DAS). Ajuda: Suporte, **Notas fiscais**, Declaração anual. **Desde 12/10:** Meu MEI ganha **DAS** (abre `/das`); sai o "Como pagar o DAS" da Ajuda. |
| **CNPJ pelo Perfil** | `/perfil/cnpj` | **Desde 12/10 (Bloco C):** **sem CNPJ**, "Com o seu CNPJ" com 5 vantagens curtas + o campo de busca → "Achei você". **Com CNPJ**, só para ler: CNPJ mascarado, Nome, Situação (Ativa; outra situação com pontinho e aviso amarelo), MEI desde, Município, Atividades (nome + código, "principal"), "🔒 Veio do seu CNPJ · Consultado em 12/10 às 14:53"; destaque **"Pedir pra Isa conferir meu CNPJ"** (WhatsApp com o CNPJ; quem confere hoje é a equipe, a tela não promete consulta automática); **"Atualizar dados do CNPJ"** (busca de novo) e **"Remover CNPJ"** (folha de confirmação; apaga o CNPJ e o que veio dele). Não muda o tipo de MEI (só avisa se o CNPJ sugere outro). Se virou MEI este ano, acerta a abertura. No **Perfil**, Tipo de MEI (quando bate com o CNPJ) e Abertura (com a data do CNPJ) ficam **travados**: cadeado pequeno + "Veio do seu CNPJ"; tocar abre esta página. Removeu o CNPJ: voltam a ser editáveis. |
| **Calcular IR** | `/declaracao-anual/calcular` | Os gastos já vêm com a soma dos **gastos com nota** guardados no app (dá para ajustar). | **Desde 12/10 (Bloco F):** mora em `/calcular/imposto-de-renda`. Com CNPJ, a atividade vem do **CNAE principal** e a 1ª pergunta some (4 perguntas); atividade mista avisa "usei o da principal". "Você teve outra renda no ano?" **Sim/Não** + valor. Parte isenta = faturamento × % **menos o DAS do ano** (LC 123, art. 14 §1º), com "Pode ser maior com contabilidade completa." No fim, "Também precisa declarar quem teve": bens > R$ 800 mil, rendimentos isentos > R$ 200 mil, bolsa > R$ 40 mil, rural > R$ 177.920 (fonte: regras do IRPF 2026, em `src/lib/declaracao.js`). A Declaração anual ficou só com a explicação + botão "Calcular meu Imposto de Renda". |
| **Como emitir nota / Como pagar o DAS / Suporte / Termos / Privacidade** | | Textos corrigidos (ver seção 4). |

### Escondido por chave (nada foi apagado)

Ver `docs/DECISOES-PILOTO.md`, seção 3. Endereço escondido aberto direto
volta para o Início.

---

## 3. Chaves (`src/config/piloto.js`)

| Chave | Valor |
|---|---|
| `MOSTRAR_OPEN_FINANCE`, `MOSTRAR_CHAT_FISCO`, `MOSTRAR_NOTAS_FISCAIS` (histórico antigo), `MOSTRAR_SAIDAS`, `MOSTRAR_HISTORICO_DAS`, `MOSTRAR_ADICIONAR_MOVIMENTACOES`, `MOSTRAR_RESUMO_ANO` (endereço antigo), `MOSTRAR_SOBRE`, `MOSTRAR_INACABADOS`, `MOSTRAR_AVATAR`, `MOSTRAR_LOGIN_EMAIL`, `MOSTRAR_LOGIN_GOOGLE`, `MOSTRAR_WHATSAPP_DOCUMENTOS` | `false` |
| **`MODO_TESTE_LOGIN`** | **`true`** ⚠️ desligar antes de gente real |
| `MOSTRAR_CARD_DAS`, `MOSTRAR_TUTORIAL_DAS`, `MOSTRAR_TUTORIAL_NOTA`, `MOSTRAR_NOTIFICACOES`, `MOSTRAR_SUPORTE`, `MOSTRAR_DECLARACAO_ANUAL` | `true` |
| **Novas de 08-10:** `MOSTRAR_ENVIAR_EXTRATO` (`/enviar-extrato`, `/conferir-saidas`), `MOSTRAR_MEU_LUCRO` (`/meu-lucro`), `MOSTRAR_JANELA_NOTAS` (`/notas-fiscais` nova), `MOSTRAR_SIMULADOR` (`/simulador`), `MOSTRAR_PREFERENCIAS` (religada) | `true` |
| `MOSTRAR_SELETOR_VISUAL_INICIO` / `VISUAL_INICIO_PADRAO` | `false` / `"f"` |
| `WHATSAPP_FISCO` | `"5537991999373"` — (37) 99199-9373 |

Fora do `piloto.js`: `PLUGGY_ATIVO = false` (`src/lib/openfinance.js`).
Regras fiscais num lugar só: `src/lib/fiscal.js` (limites, DAS pelo CNAE,
preço do A1 `PRECO_CERTIFICADO_A1 = 100.34`), `src/lib/vencimentoDas.js`
(dia 20 + feriados nacionais, prorroga), `src/lib/declaracao.js` (IR e
Simulador), `src/lib/categorias.js` (o que conta como faturamento e as
categorias de gasto).

---

## 4. O que foi feito em 08-10 (tarefa de `docs/PROMPT-CODE-08-10.md`)

- **Etapa 0 — SQL:** rodado em 10/10 com o "pode" (migration
  `tacerto_08_10_cnpj_extrato_lucro_lembrete`), conferido e registrado em
  `src/supabase/migrations.sql` (PARTE 4D). Cópia antes:
  `backups/2026-10-10_antes_sql_08-10.json`.
- **Etapa 1 — CNPJ:** cadastro e Perfil (BrasilAPI), valor do DAS pelo
  CNAE (4930-2/01 = R$ 199,52; outros 4930-2/0x = R$ 195,52; os dois =
  R$ 200,52; MEI comum: comércio R$ 82,05 / serviço R$ 86,05 / os dois
  R$ 87,05), CNPJ formatado nas mensagens do WhatsApp.
- **Etapa 2 — Velocímetro:** "Atualizado em", botão, "Falta informar",
  selo Estimado/Conferido, folha com 3 jeitos.
- **Etapa 3 — Extrato:** leitura de OFX/CSV no celular (Nubank, Inter,
  Itaú, BB, C/D, crédito/débito, latin1...), corte do período, impressão
  digital por transação, PDF no Storage, conferência com 6 respostas,
  gastos em dúvida, nada contado duas vezes.
- **Etapa 4 — Meu lucro** (+ calculadora do IR puxando os gastos com nota).
- **Etapa 5 — Notas fiscais** (janela com 2 estados).
- **Etapa 6 — DAS:** vencimento real (20/11/2026 feriado → 23/11), textos
  "antecipa" corrigidos para "vence no próximo dia útil" em todo o app,
  Preferências com o Lembrete do DAS, **`docs/PLANO-AUTOMACAO-DAS.md`**.
- **Etapa 7 — Simulador do MEI.**
- **Etapa 8 — Termos de uso e Privacidade** reescritos (CNPJ, extrato,
  gastos, quem confirma o faturamento; sem "contabilidade/contador" para
  descrever o TaCerto).
- **Correções de texto em todo o app:** A1 R$ 99,90 → **R$ 100,34**;
  "agregado emite NFS-e" → **NFS-e só frete na mesma cidade**; DAS
  "antecipa" → **prorroga**; reembolso de despesa **conta** como
  faturamento (a explicação antiga dizia que não).
- **Revisão:** bibliotecas com testes (scratchpad), revisão de código por
  agentes independentes (3 focos + verificação), revisão visual Preto e
  Branco, 390×844 e 390×664, Console limpo, build OK.
- **Corrigido na revisão (10/10):** o "Depois" do extrato fazia a
  conferência dos gastos sumir (agora a conferência sempre termina nos
  gastos em dúvida, e o Meu lucro mostra "X gastos para conferir"); o
  mesmo período mandado em outro formato (OFX e depois CSV) não conta mais
  duas vezes; o "total do ano" só absorve recebimento até o dia em que foi
  digitado; lançamentos criados de uma vez às vezes não iam para o banco
  (AppStateContext v4); gravações com centenas de itens vão em partes;
  "Está certo" sem a data do MEI ainda pergunta "Abriu este ano?"; DAS de
  oficina mecânica conta como serviço; textos da nota (passo a passo e
  suporte) e dos Termos (PDF guardado até ser lido).
- **Respostas do Fernando às perguntas (10/10, tarde)** — feito no mesmo
  dia e enviado ao GitHub:
  - 1 (extrato substitui o total): **feito**, com a trava de segurança
    (só quando o extrato cobre o ano até o dia do total e tudo foi
    respondido; folga de 10 dias). `conciliacao.js` v3
    (`extratoCobreOAno`), `importarExtrato.js` v3
    (`substituirTotalPeloExtrato`), Início v35, conferência v15.
  - 8: o sininho diz **"Leva poucos minutos"**.
  - 9: **Lançar gasto** no Meu lucro (`FolhaLancarGasto.jsx`, `lucro.js` v2).
  - 11: **não descarta mais sozinho**: "Pode ser repetido" nas duas
    conferências (`categorias.js` v2: `CATEGORIA_REPETIDO`).
  - 12: lista **Gastos pessoais** para desfazer (`GastosDoLucro.jsx` v2).
  - 2, 3, 5, 6, 7 (com a linha de aviso) e 10: ok como estavam. 4: manter
    o portão.

---

## 5. O que testar no iPhone (com uma conta de teste nova, 37 00000-xxxx)

1. Cadastro: CNPJ (com e sem), "Achei você", "Trocar", "Não sou eu",
   "Preencher depois".
2. Perfil > CNPJ (mascarado / "Não preenchido").
3. Início: "Falta informar", botão "Atualizar velocímetro", folha com 3
   jeitos; depois de lançar algo, "Atualizado em..." e o selo.
4. Enviar extrato com um **OFX ou CSV de verdade** do seu banco: a
   contagem, a conferência das 6 respostas, os gastos em dúvida; mandar
   o mesmo arquivo de novo (não pode duplicar); um PDF.
5. Meu lucro (Mês/Ano, gráfico, gastos por categoria, anexar nota,
   **Lançar gasto**, **Gastos pessoais** → "É do negócio").
5b. **Novos de 10/10 (tarde):** com um total do ano digitado, mandar o
   extrato do ano inteiro e conferir tudo (o selo deve virar Conferido e
   a tela final dizer que o velocímetro usa o extrato); mandar o mesmo
   período em outro formato (OFX e CSV do mesmo banco): aparece "Pode ser
   repetido" nas entradas e nos gastos.
6. Simulador, Notas fiscais, Preferências (lembrete), painel do DAS
   ("Vence ..."), Termos e Privacidade.

---

## 6. Supabase — situação

| Item | Situação |
|---|---|
| **SQL de 08-10** | **Rodado e conferido em 10/10** (perfis: cnpj, cnae, cnaes_secundarios, data_opcao_mei, cnpj_confirmado, velocimetro_atualizado_em, lembrete_das_dias, lembrete_das_hora, nota_automatica_ativa; entradas/saidas: categoria, chave_unica (+ com_nota, do_negocio nas saídas); tabela extratos_enviados com RLS e GRANT) |
| PDF do extrato | Balde `comprovantes` (já existia), pasta `<user_id>/extratos/`. Os pendentes: tabela `extratos_enviados`, `status = 'em_analise'` |
| Nota automática | Ligar à mão: `update perfis set nota_automatica_ativa = true where id = '...'` (com o "pode", na rotina) |
| Provider **Phone** / função `enviar-otp-whatsapp` / Send SMS Hook | **Não feito** (ver `docs/LOGIN-WHATSAPP-PASSO-A-PASSO.md`) |
| Advisors de segurança | Só os 2 avisos antigos já aceitos (codigos_wpp sem política; senha vazada desligada) |

---

## 7. Cuidados técnicos aprendidos (não repetir os erros)

- **A tela inteira remonta quando muda o endereço, inclusive o `?`**
  (`TransicaoTela`). Estado entre etapas com `?passo=` vai para o
  `sessionStorage` (ver `CalcularDeclaracao.jsx`).
- **Gesto de voltar do iPhone = voltar do navegador.**
- **Campos novos do perfil** (CNPJ etc.): lidos numa consulta SEPARADA
  (`COLUNAS_PERFIL_NOVAS` em `src/lib/perfil.js`), gravados de forma
  tolerante (`gravarPerfilNovo`). O AppState guarda no aparelho com o id
  da conta (`donoExtras`) e sobe para o banco o que faltar.
- **Extrato:** a trava contra repetido é o `pluggy_transaction_id =
  "extrato-<chave>"` (restrição única do banco). E, para o mesmo período
  em outro formato, o que já existe de extrato com o mesmo DIA e VALOR
  entra com `categoria = "repetido"` e a pessoa confirma (v3; antes ficava
  de fora). "repetido" nunca vira regra nem memória do fornecedor. Datas do extrato vão como
  `AAAA-MM-DDT12:00:00-03:00` (o dia nunca muda com o fuso).
- **`adicionarLancamento` monta o lançamento ANTES do `setState`** (v4):
  dentro do `setState` o React 18 pode adiar e a gravação no banco saía
  vazia quando vários eram criados de uma vez.
- **Conferência:** o que conta é lançado por `lancarEntradasConfirmadas`
  (`src/lib/importarExtrato.js`) — nunca por `criarLancamento` direto —
  para não contar duas vezes. O "portão" do Início usa a mesma função.
- **Tailwind lê os comentários do código:** escrever "[-3:BRT]" num
  comentário virou uma classe CSS quebrada no build. Evitar colchetes com
  dois-pontos em comentários.
- **Testar telas com login sem entrar em conta:** o Claude não faz login
  no Supabase. Usa um "banco de mentira" só no navegador de teste
  (`node_modules/.tacerto-teste/mock.js`, fora do Git; recriado a partir
  do scratchpad): troca o `supabase` do app por dados na memória e simula
  o "SIGNED_IN". Nada vai para o banco real.
- **Sessão na nuvem (12/10):** não tem `.env` nem Supabase. O
  `package-lock.json` tem 8 endereços antigos do Lovable que a nuvem não
  acessa: com o ok do Fernando, os pacotes foram instalados numa cópia
  (scratchpad) com o endereço trocado para o `registry.npmjs.org` e a
  `node_modules` foi movida para o projeto (o lock do projeto não
  mudou). O Vite roda com `VITE_SUPABASE_URL` de mentira, e o
  Playwright serve o `node_modules/.tacerto-teste/mock.js` no lugar de
  `/src/lib/supabase.js` (`page.route`). No mock, `localStorage`
  `mock_sql_10_10 = "1"` simula o SQL de 10-10 já rodado (sem isso, as
  colunas novas "não existem": leitura dá 42703 e gravação PGRST204).
- **HMR** (atualização ao salvar) às vezes carrega duas cópias do
  AppStateContext e a tela fica branca com "useAppState precisa estar
  dentro de <AppStateProvider>": não é bug do app; recarregar a página.
- **Arquivos com fim de linha do Windows (CRLF):** scripts de troca de
  texto normalizam `\r\n`. Script em node com aspas simples dentro do
  `node -e '...'` quebra no Bash: usar arquivo de trocas (JSON).
- **ESLint não está instalado:** sintaxe com `npx esbuild arquivo.jsx
  --loader:.jsx=jsx`; build: `npx vite build --outDir <pasta temporária>`.
- **Tema:** testar o Branco pelo alternador do Perfil; voltar para Preto.
- Simulação no PC ≠ altura do iPhone: sobra/falta de espaço vertical quem
  decide é o print do iPhone.

---

## 8. Arquivos novos de 08-10

| Arquivo | Para quê |
|---|---|
| `src/lib/cnpj.js` | Máscara, dígitos do CNPJ, busca na BrasilAPI |
| `src/lib/extrato.js` | Ler OFX/CSV, corte do período, impressão digital |
| `src/lib/categorias.js` | O que conta como faturamento; categorias de gasto |
| `src/lib/vencimentoDas.js` | Vencimento do DAS com feriados nacionais |
| `src/lib/conciliacao.js` | Total do ano x extrato x lançamento à mão; selo |
| `src/lib/importarExtrato.js` | Leva o extrato para o banco; lança o que foi confirmado |
| `src/lib/lucro.js` | Contas do Meu lucro; anexar nota de gasto |
| `src/components/FluxoCnpj.jsx` | "Qual o CNPJ" e "Achei você" |
| `src/components/FolhaLancarGasto.jsx` | Folha "Lançar gasto" do Meu lucro (10/10, tarde) |
| `src/pages/PerfilCnpj.jsx`, `ConferirSaidas.jsx`, `GastosDoLucro.jsx`, `NotasFiscais.jsx`, `Simulador.jsx` | Telas novas |
| `docs/SQL-PENDENTE-08-10.sql` | O SQL de 08-10 (rodado) explicado |
| `docs/PLANO-AUTOMACAO-DAS.md` | Plano do DAS no automático (estados, mensagens, Serpro, 3 fases) |

---

## 9. Pendente / para o Fernando decidir

1. ~~`git push`~~: feito em 10/10.
2. **Testar no iPhone** (seção 5), principalmente com um extrato real.
3. Antes de gente real: **desligar o modo teste** (`MODO_TESTE_LOGIN`),
   ligar o login por WhatsApp no painel, religar o "Require Log In" da
   Vercel, conferir textos de IR e da DASN com o contador, revisar Termos
   e Privacidade com advogado (falta razão social e CNPJ do TaCerto).
4. Antigos: slide 1 das boas-vindas com o Início antigo; `/regra-vinte`
   aberto direto; trocar a chave anon do Supabase; `excluir-conta` deve
   apagar os arquivos dos baldes (agora também extratos e notas de gasto).
5. Leitura do **PDF do extrato** (por IA) e o aviso "está pronto": não
   construído (pedido). Os pendentes estão em `extratos_enviados`.
6. DAS no automático: seguir `docs/PLANO-AUTOMACAO-DAS.md` (falta CNPJ do
   TaCerto, e-CNPJ A1, contrato Serpro e WhatsApp oficial da Meta).
7. **SQL de 10-10 AINDA NÃO RODOU** (a sessão de 12/10 foi na nuvem, sem
   acesso ao Supabase): **`docs/SQL-PENDENTE-10-10.sql`**, explicado em
   português simples no topo. Precisa do "pode" do Fernando e da rotina
   do CLAUDE.md (cópia antes, conferir depois, logs e advisors). Depois
   de rodar, registrar no `src/supabase/migrations.sql` (PARTE 4E). Até
   lá o app funciona: o que for desses campos fica no aparelho e sobe
   sozinho depois (testado em 12/10 num banco de mentira sem as colunas).
   O arquivo cresce a cada bloco da tarefa de 10-10 que precisar de banco.
8. **Função `ler-comprovante` (IA do comprovante) ESCRITA, NÃO
   PUBLICADA** (Bloco J). Falta: o Fernando criar a chave da Anthropic e
   pôr como segredo `ANTHROPIC_API_KEY` no Supabase, e dar o "pode" para
   publicar. Passo a passo e custo: **`docs/IA-COMPROVANTE.md`**. Até lá o
   "+" segue no lançamento à mão com o arquivo guardado.

---

## Perguntas para o Fernando

**Respondidas em 10/10 (tarde):** 1 sim · 2 ok · 3 ok · 4 manter · 5 ok ·
6 ok · 7 ok (com a linha de aviso) · 8 "Leva poucos minutos" · 9 sim
(gasto à mão, dinheiro vivo) · 10 ok · 11 não descartar sozinho:
"pode ser repetido" e a pessoa confirma · 12 sim (lista Gastos
pessoais). Tudo feito (ver seção 4). O texto original fica abaixo para
consulta. **Ainda aberta: a 13.**

1. **Extrato mostra MENOS do que o total do ano que você digitou:** hoje
   o app mantém o total digitado (pode ter outra conta ou dinheiro vivo)
   e o selo fica "Estimado". Quer que o extrato substitua o total?
2. **CNPJ pelo Perfil sugerindo outro tipo de MEI:** o app só avisa ("Para
   trocar, use Tipo de MEI"), não troca sozinho (tipo é travado). Ok?
3. **Horário padrão do lembrete do DAS:** deixei **9:00**. Ok?
4. **Portão das entradas:** se a pessoa manda o extrato e toca em
   "Depois", na próxima vez que abrir o Início o app leva direto para a
   conferência (regra de 27/09). Manter, ou deixar conferir quando quiser?
5. **Gastos reconhecidos** (posto, Sem Parar, pneu, oficina, DAS, seguro,
   financiamento) entram direto como "gasto do caminhão" para o
   caminhoneiro, sem perguntar (dá para mudar no Meu lucro). Para o MEI
   comum, pergunta sempre. Ok? (Posto pode ser do carro pessoal.)
6. **DAS com CNAE municipal E intermunicipal:** usei **R$ 200,52** (ICMS +
   ISS, da pesquisa). O pedido falava só em 199,52 e 195,52. Ok?
7. **"Meu lucro" no ano:** o total digitado (sem mês) entra no Recebido
   do ano e uma linha avisa. Ok, ou deixar de fora?
8. A notificação do sininho "Atualize seu velocímetro" ainda diz **"Leva
   menos de 1 minuto"** (com extrato pode levar mais). Trocar o texto?
9. **Lançar gasto à mão** (dinheiro vivo) no Meu lucro? Hoje os gastos só
   vêm do extrato.
10. **No painel do DAS** coloquei uma linha "Vence 20/10 · R$ 195,52" (no
    Início F a data não aparece em outro lugar). Ok?
11. **Extrato de duas contas diferentes** com o mesmo valor no mesmo dia:
    o segundo fica de fora (é o jeito de não contar duas vezes quando o
    mesmo período vem em outro formato). Ok? (Dá para lançar à mão.)
12. Gastos marcados como pessoais ("Não é do negócio", "O resto é
    pessoal") não aparecem no Meu lucro, então não dá para desfazer pelo
    app. Quer uma lista "Gastos pessoais" para poder corrigir?
13. Antigas: atualizar o slide 1 das boas-vindas? A notificação "Atualize
    seu velocímetro" volta todo mês? Ajustar `/regra-vinte` aberto direto?

---

## Perguntas para o Fernando — tarefa de 10-10 (`docs/PROMPT-CODE-10-10.md`)

> Decisões que não estavam no pedido. Segui o padrão de cada uma (entre
> parênteses) e anotei aqui. Responda pelo número.

**Bloco A (Isa)**

A1. No piloto quem responde o WhatsApp é você, à mão. A Apresentação diz
    "Fale comigo no WhatsApp, a qualquer hora" e o slide 4 diz "Isa,
    assistente virtual 24h". Manter as promessas de "a qualquer hora" e
    "24h"? (mantive)
A2. O suporte humano usa o mesmo número; a mensagem pronta agora começa
    com "Oi Isa! Preciso de suporte...". Ok, ou começar com "Oi! Preciso
    de suporte"? (mantive "Oi Isa!", como pedido)
A3. Os slides 3 e 5 dizem que a Isa **emite** a nota; os Termos dizem que
    quem emite é você (o MEI). Trocar para "a Isa **monta** sua nota"?
    (mantive "emite"; só troquei o nome)
A4. A bolinha verde de "online" na foto ficou; o texto "online" virou
    "assistente virtual" (slide 5 e cabeçalho do chat). Ok? (assim)
A5. A frase "Oi, sou a Isa, a assistente com IA do TaCerto." entrou na
    Apresentação e no chat do app. No desenho do WhatsApp do slide 5 não
    entrou (mudaria a escala dos 5 slides). No WhatsApp de verdade, ela é
    a saudação do WhatsApp Business, que você configura. Ok? (assim)
A6. Foto: os avatares usam o recorte do rosto (`isa-whatsapp.jpg`). A
    foto de blazer (`isa.png`) não aparece no app (pode lembrar
    contadora). Ok? (assim)
A7. Os Termos dizem que a Isa "não é uma pessoa nem contadora". Escrever
    também que "a foto da Isa foi criada por IA"? (não escrevi)

**Bloco B (Início de antes)**

B1. "Visual de antes" = o **"atual"** (cartão de vidro com o carrossel,
    card "Próximo DAS", "Como emitir nota" no topo) + o **chat da Isa
    embaixo** (foto 96 + barra 48, igual ao slide 1; commits `ed94504` e
    `ce6128a`). O F continua no código (`VISUAL_INICIO_PADRAO = "f"`
    volta). Os atalhos pedidos nos blocos D e E ficaram: **DAS** = botão
    "Emitir boleto" do card Próximo DAS; **NF** = "Como emitir nota" no
    topo. Ok? Outras opções: barra fina DAS | NF entre o velocímetro e o
    chat; ou dois botões "DAS" e "NF" no topo, ao lado do sininho.
B2. Rodapé: voltou o "+" dentro do círculo verde (como era no Início de
    antes). Prefere o "+" sem círculo que você escolheu em 05/10?
    (deixei o de antes)
B3. A luz verde girando na barra do chat e a bolinha verde na foto
    voltaram iguais (mesmas dimensões). Deixar mais discreto? (iguais)
B4. Os botões de foto, galeria, documento, extrato e microfone do chat
    nunca fizeram nada: **escondi** (`MOSTRAR_ANEXOS_CHAT = false`). Ok?
B5. Quando a Isa não sabe: "Essa eu ainda não sei responder por aqui. Me
    chama no WhatsApp que eu te ajudo." + botão "Falar com a Isa no
    WhatsApp" (a mensagem leva a pergunta). Ok o texto?
B6. O chat do app responde com respostas prontas (não é IA de verdade),
    mas a primeira fala diz "assistente com IA" (como pedido). Pela lei
    do consumidor pode ser lido como exagero. Manter, ou no app usar
    "assistente virtual do TaCerto"? (mantive o pedido)
B7. As conversas do chat ficam guardadas no aparelho e na tabela
    `conversas` do Supabase (já existia). Ok? (a Privacidade ganhou a
    linha no Bloco M)
B8. O botão "Como emitir nota" do topo agora abre a página **Notas
    fiscais**. Trocar o texto para "Notas fiscais"? (mantive)
B9. O "?" ao lado do % (Tirar dúvidas) voltou junto com o Início de
    antes, agora com perguntas que têm resposta no chat. Ok?

**Bloco C (CNPJ)**

C1. Quem confirmou o CNPJ **antes** de 10/10 não tem o resumo guardado:
    a página mostra só CNPJ, MEI desde e os códigos das atividades (sem
    situação nem município) até tocar em "Atualizar dados do CNPJ".
    Buscar sozinho na primeira vez que abrir a página? (deixei manual)
C2. Se o CNPJ diz "MEI desde 2021" mas no app está "abriu este ano"
    (limite proporcional), o limite continua proporcional (regra de
    08-10: CNPJ de outro ano não mexe na abertura). A linha Abertura do
    Perfil, travada, mostra a data do CNPJ. Trocar para o limite cheio
    sozinho nesse caso? (não troquei)
C3. "Remover CNPJ": Tipo de MEI e Abertura ficam como estão, só voltam a
    ser editáveis. Ok? (assim)
C4. O Tipo de MEI só fica travado quando bate com o CNPJ. Se a pessoa
    trocou pela folha "O que mudou?", continua editável. Ok? (assim)
C5. Dois aparelhos: se a pessoa remove o CNPJ num celular e abre o app
    em OUTRO celular que ainda tinha o CNPJ guardado, ele pode voltar
    (o app sobe para o banco o que só estava no aparelho; regra de
    08-10). No piloto cada um usa um iPhone; deixei assim e anotei.

**Bloco D (DAS)**

D1. O botão do card do Início continua escrito **"Emitir boleto"**, mas
    agora abre a página do DAS (e não a folha). Trocar o texto para
    "Ver DAS" ou "Pagar DAS"? (mantive)
D2. Escolher "A Isa me manda o boleto" **religa** os lembretes (se a
    pessoa tinha desligado, voltam 7 e 2 dias antes e no dia) e os
    avisos no WhatsApp. Ok? (assim: escolher a Isa é aceitar a mensagem)
D3. A escolha fica marcada (✓) e dá para trocar a qualquer hora.
    Escolher "Pago sozinho" **não** desliga os lembretes do DAS. Ok?
D4. "A Isa me ajuda agora" e "Histórico do DAS" ficaram embaixo, em
    "Mais". O "Abrir o site do governo" da folha antiga virou "Abrir o
    Portal do Simples" dentro do "Pago sozinho". Ok?
D5. Os nomes dos botões do Portal do Simples/App MEI ("Emitir Guia de
    Pagamento (DAS)") foram escritos de memória, como no passo a passo
    antigo: conferir no site real.
D6. O Histórico do DAS (12 janelinhas) existia escondido desde 28/09
    (`MOSTRAR_HISTORICO_DAS = false`); agora abre pela página do DAS.
    Tirei o verde (mês pago = borda clara e ✓). Ok?

**Bloco E (Notas fiscais)**

E1. A pergunta "Posso somar no velocímetro?" só aparece para nota **deste
    ano** (o velocímetro é do ano). Nota de ano passado só fica guardada.
    Ok?
E2. **Apagar uma nota** que foi somada **não** tira o lançamento do
    velocímetro (o dinheiro continua recebido). Tirar junto? (não tira)
E3. "Guardar uma nota" é para nota que **você emitiu** (recebimento).
    Nota de **gasto** (compra) continua no Meu lucro > gasto > anexar
    nota. Ok?
E4. O lançamento criado pela nota se chama "Nota fiscal nº 77 ·
    Cliente". Esse começo "Nota fiscal" é o que faz o extrato que chegar
    depois casar com ele com folga maior (±1%, ±15 dias); lançamento à
    mão comum continua com a regra antiga (mesmo valor, até 3 dias).
E5. Com o certificado ativo, "Emitir nota" abre o WhatsApp da Isa (não
    tem provedor de nota ligado, como pedido). Antes, com o certificado
    ativo, a página virava só "Minhas notas"; agora a página continua e
    "Minhas notas" é uma das opções. Ok?
E6. A ligação nota ↔ lançamento vai para `notas_fiscais.lancamento_id`
    (SQL de 10-10, ainda não rodado). Até lá fica guardada no aparelho
    (`tacerto_notas_ligadas`) e NÃO sobe sozinha depois do SQL (só as
    novas vão para o banco). No piloto ninguém guardou nota ainda, então
    não perde nada.

**Bloco F (Calcular)**

F1. Com CNPJ, a calculadora do IR **não pergunta** a atividade (usa o
    CNAE principal). Se o CNPJ tem atividades com percentuais diferentes
    (ex.: comércio 8% + serviço 32%), usa o da principal e avisa. Ok?
F2. O DAS que sai da parte isenta é o DAS **devido** no ano (valor do mês
    pela atividade × meses em que era MEI), com os valores de 2026 para
    qualquer ano. A lei fala em "valor devido"; a pesquisa de 08/10 notou
    que o exemplo da própria Receita não desconta. Conferir com o
    contador.
F3. "Calculado com seus dados até dd/mm" usa a data da última
    atualização do velocímetro (o mesmo "Atualizado em" do Início).
F4. **DAS do ano** mostra "Já venceram" e "Falta vencer", e "Pagos que
    você guardou" só com o que está no Histórico do DAS. Nunca diz que um
    DAS está em aberto (fica a frase "Quem confirma o que já foi pago é
    a Receita."). Ok?
F5. O "Quanto ainda posso faturar" (antigo Simulador) perdeu o campo
    "quanto gasta" e as linhas de DAS e IR (têm conta própria). Ok?
F6. A isenção nova (até R$ 5 mil por mês) só vale para a renda de 2026
    em diante (declaração de 2027). Hoje o app já calcula 2026, então
    aparece "Imposto: provavelmente zero" quando cabe.
F7. Na Declaração anual saíram "Parte do faturamento é isenta",
    "Declarar não é pagar" e "Faturado no ano" (estão na conta do IR).
    "Se atrasar" virou uma frase no prazo. O passo a passo da DASN ficou
    (fechado). Ok?

**Bloco G (datas da declaração)**

G1. Textos novos (constantes em `src/lib/declaracao.js`, para atualizar
    todo ano): a do MEI "Pode ser feita desde o começo do ano até 31 de
    maio."; o IR "Abre em março e vai até o fim de maio (a Receita
    divulga as datas todo ano)."; e "Quando você quiser, dentro do
    prazo, a Isa faz com você." Saiu o "em maio" da Declaração anual e
    do Suporte. Em 2026 o IR foi de 23/03 a 29/05 (guardado em
    `PERIODO_IRPF`, sem aparecer na tela).

**Bloco H (histórico por ano)**

H1. No "Histórico de entradas", o seletor ganhou **"Ano todo"**, e tocar
    no **ano** já escolhe o ano inteiro. No ano todo: "Total de 2026" +
    "Por mês" (só os meses com entrada; tocar abre o mês) + a lista de
    sempre. No mês, a linha "No ano de 2026: R$ X ›" também leva ao ano
    todo. Mostrar também os meses sem entrada (R$ 0,00)? (não mostrei)

**Bloco I (selo Recomendado)**

I1. Um componente só (`src/components/SeloRecomendado.jsx`), pendurado
    no canto de cima: folha "Atualize seu velocímetro", "Meu lucro"
    (sem gastos), a barra do Calcular e "A Isa me manda o boleto" (DAS).
    A tela antiga "Adicionar movimentações" (escondida no piloto) ficou
    sem o selo: ela ainda fala em "A IA lê" o extrato, o que não é
    verdade hoje.

**Bloco J ("+" com foto ou PDF)**

J1. A linha **"Foto ou PDF do comprovante"** fica no topo do "+"
    (Recebimento). A IA preenche valor, data e o nome de quem pagou (na
    Descrição, só se estiver vazia), com "Li do comprovante: confira e
    corrija se precisar."; leitura incerta mostra "A leitura ficou
    incerta: confira com atenção." Ok?
J2. Modelo da IA: deixei o **`claude-opus-5-5`** (o mais preciso), com o
    "fallback" automático da Anthropic ligado (se recusar, outro modelo
    tenta). Custa ≈ US$ 0,02 por leitura (≈ R$ 0,11); o
    **`claude-haiku-5-5`** custa ≈ US$ 0,0005. A troca é só o segredo
    `MODELO_COMPROVANTE`. Qual usar no piloto? (detalhes em
    `docs/IA-COMPROVANTE.md`)
J3. Parece **gasto**: aparece "Lançar como gasto" (vai para o Meu lucro,
    "com nota", meio "Comprovante", categoria "Outros" para a pessoa
    trocar). Ok, ou perguntar a categoria na hora?
J4. Se a pessoa escolhe a foto e desiste (sai sem salvar), o arquivo fica
    no balde sem registro. É pouco espaço; limpar depois? (deixei)
J5. Lançar sem comprovante continua igual (sem a pergunta "É o mesmo?").
    Com comprovante, a pergunta aparece quando há recebimento parecido
    (±1%, ±15 dias). Ok?

**Bloco K (Permissões e integrações)**

K1. Página nova **Perfil > Conta > "Permissões e integrações"**
    (`/perfil/permissoes`). WhatsApp "Conectado" (sem remover) + chave
    **"Lembretes e avisos no WhatsApp"** (desligada: "a Isa só responde
    quando você chamar"). ⚠️ No piloto quem manda os lembretes é você:
    antes de mandar, olhe `perfis.avisos_whatsapp` (depois do SQL de
    10-10; antes dele a escolha fica só no celular da pessoa).
K2. "Extratos enviados → Ver e apagar": apagar tira o **arquivo e o
    registro**, mas o que a pessoa já confirmou **continua no velocímetro**
    (as entradas não guardam de qual extrato vieram). Ok, ou apagar também
    as entradas daquele período? (deixei assim)
K3. "Notificações do celular" só mostra o status (Ligadas / Bloqueadas /
    Não pedidas): o app ainda não manda notificação no celular. Pedir a
    permissão quando existir notificação de verdade.

**Bloco L (tutorial do primeiro acesso)**

L1. Na **primeira vez no Início** abre o "Como funciona" (4 telas, o
    mesmo celular da Apresentação): 1) o velocímetro e o limite; 2)
    "Conecte e o app faz sozinho" (CNPJ, extrato, boleto do DAS no
    WhatsApp); 3) "Tudo isso também pelo WhatsApp"; 4) "Comece pelo
    extrato" com **Enviar extrato** (Recomendado) e "Agora não". "Pular
    tutorial" no topo. Fica guardado (`tutorial_visto`; antes do SQL, no
    aparelho). Rever: **Perfil > Ajuda > Tutorial do app**.
L2. Quem **já usa** o app vai ver o tutorial **uma vez** ao abrir esta
    versão (ninguém tem `tutorial_visto` ainda). Ok? (assim)
L3. ⚠️ O celular de exemplo (da Apresentação e do tutorial) ainda mostra
    o **Início F** (barra DAS | Isa | NF), mas o Início de verdade voltou
    ao de antes (Bloco B). Redesenhar o exemplo igual ao Início de
    agora? (não mexi: é o mesmo desenho dos slides)

**Bloco M (slides, FAQ, Termos e Privacidade)**

M1. Termos e Privacidade novos (12/10): seção "Leitura do comprovante
    por IA", "Mensagens no WhatsApp" (como parar: Perfil → Permissões e
    integrações → Lembretes e avisos, ou pedir para a Isa), a página
    Permissões, as conversas do chat (no celular e no servidor; era a
    B7) e a empresa da IA (Anthropic) só para ler o comprovante.
M2. ⚠️ Os textos dizem "a Isa é baseada em IA", mas no piloto quem
    responde o WhatsApp é **você** e o chat do app usa **respostas
    prontas** (ver A1 e B6). Para ficar 100% honesto (CDC), escrever
    "quem responde pode ser a IA ou a equipe do TaCerto"? (não troquei)
M3. Quando alguém pedir no WhatsApp para parar as mensagens, é você quem
    desliga (o app não lê o WhatsApp). Depois do SQL de 10-10, o campo é
    `perfis.avisos_whatsapp = false`.
M4. Slide da nota: "Pode ser automática." virou **"Automática com o
    A1."** (o certificado é pago; mesmo tamanho, 2 linhas). O slide
    "Tudo isso, grátis" ainda lista "Emissão de nota fiscal": acrescentar
    "(certificado à parte)"? (não mexi; mudaria a altura do slide)
M5. "Pelos termos da Anthropic, o arquivo não é usado para treinar a IA":
    conferir no contrato da Anthropic quando criar a conta (e com o
    advogado, junto com o resto dos Termos).
M6. A FAQ do chat (`src/lib/faqFisco.js`) já estava em dia (o "Perfil >
    Calcular" entrou no Bloco B); a FAQ antiga (`/faq`) está escondida
    e só teve a data da DASN corrigida (Bloco G).
