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
| **Simulador** | `/simulador` | **Novo.** Quanto recebe por mês (já vem a média) e gasta (opcional) → previsto no ano, % do limite, mês em que passa, quanto ainda pode por mês, DAS do ano, Imposto de Renda estimado. |
| **Notas fiscais** | `/notas-fiscais` | **Novo.** Sem certificado: quando emitir (NFS-e só frete na mesma cidade; CT-e entre cidades contratado direto; agregado sem IE em MG hoje não emite; 2027 em todo serviço), como o TaCerto ajuda, Certificado A1 (**R$ 100,34**, preço de custo; videochamada) e "Tenho interesse no certificado" (WhatsApp). Com `perfis.nota_automatica_ativa = true` (o Fernando liga à mão): vira **"Minhas notas"**. |
| **Preferências** | `/preferencias` | **Religada, só com o Lembrete do DAS:** dias antes (7, 5, 3, 2, 1, no dia; padrão 7, 2 e no dia), horário (padrão 9:00), "Não quero lembretes". Grava no perfil. |
| **Painel do DAS** | (DAS no Início) | Agora mostra no topo "Vence 20/10 · R$ 195,52" (data real com feriados; valor pelo CNAE). |
| **Perfil** | `/perfil` | Meu MEI: **CNPJ** (12.345.•••/••01-90 ou "Não preenchido" + pontinho amarelo; abre `/perfil/cnpj`), Tipo, Abertura, Limite, Já faturado, Limite restante, **Meu lucro**, **Simulador**, Histórico. Conta: **Preferências** (Lembrete do DAS). Ajuda: Suporte, **Notas fiscais**, Como pagar o DAS, Declaração anual. |
| **CNPJ pelo Perfil** | `/perfil/cnpj` | O mesmo fluxo do cadastro. Não muda o tipo de MEI (travado; só avisa se o CNPJ sugere outro). Se virou MEI este ano, acerta a abertura. |
| **Calcular IR** | `/declaracao-anual/calcular` | Os gastos já vêm com a soma dos **gastos com nota** guardados no app (dá para ajustar). |
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
