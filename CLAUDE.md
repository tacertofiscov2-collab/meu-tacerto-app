# CLAUDE.md — TaCerto!

Este arquivo é lido pelo Claude Code no começo de cada sessão. A
referência completa do projeto é o **`HANDOFF.md`** (na mesma pasta):
leia as Partes 0, 1, 6 e 12 antes de começar qualquer tarefa.

---

## Quem é o Fernando (o dono do projeto)

- **Não é programador.** Conhece o produto a fundo, tem olho para detalhe
  visual e testa tudo no **iPhone** (Safari). Não lê código.
- Fale **português do Brasil, simples**, sem jargão. Quando precisar de
  um termo técnico, explique em uma frase com um exemplo do dia a dia.
- Respostas curtas e diretas. **Um passo por vez** quando ele tiver que
  fazer algo (Supabase, Vercel, iPhone).
- Ele manda **prints** do iPhone. Leia com atenção: muitas vezes o
  problema é visual e sutil (alinhamento, espaçamento, texto cortado).
- Ele quer telas **básicas e minimalistas, sem texto explicando** nos
  fluxos do dia a dia; explicação só onde é a primeira vez.
- Quando uma mudança visual não agradar, mostre **2-3 variações** (pode
  ser descrevendo ou num HTML de prévia) para ele escolher, em vez de
  tentar versão atrás de versão.
- Ele prefere receber **tudo de uma vez** (lista completa do que precisa)
  e testar em lote.

---

## Como trabalhar no código

1. **Antes de mexer, diga em poucas linhas o que vai mudar** e em quais
   arquivos. Depois mude só o necessário.
2. **Marca de versão no topo de cada arquivo alterado**, na primeira
   linha, assim: `/* NOMEDOARQUIVO vN — o que mudou */` (ex.:
   `/* SAIDAS v3 — ... */`). Aumente o número a cada mudança e registre
   no comentário de cabeçalho do arquivo o que mudou e por quê. É assim
   que o Fernando e o HANDOFF acompanham as versões.
3. **Arquivos sempre em UTF-8.** Acentos quebrados ("Ã©", "├") são
   problema real no app; o terminal do Windows mostra errado, mas o
   arquivo tem que estar certo.
4. Depois de mudar, **confira**: rode o build ou ao menos verifique a
   sintaxe; procure imports sem uso.
   - **Mudança visual:** abra a tela no **navegador embutido** do app
     Claude (`localhost:8080`, o `npm run dev` do Cursor — não iniciar
     outro) na **largura do iPhone: 390 × 844**. Confira o visual
     (alinhamento, espaçamento, texto cortado) e o **Console** (sem
     erros). Corrija o que estiver errado e **só então** diga ao
     Fernando que terminou. Telas que pedem login: conta **piloto2**
     (ver "Contas de teste"). Ao terminar, volte o navegador ao tamanho
     normal.
   - ⚠️ A simulação no PC **não reproduz a altura útil do iPhone**
     (03/10: o Dashboard parecia ter espaço sobrando no PC e no iPhone
     estava ótimo). Sobra ou falta de espaço na **altura** não é motivo
     para mudar sozinho: aponte como dúvida e deixe o print do iPhone
     decidir. Alinhamento, texto cortado e Console continuam valendo.
5. **Commit a cada etapa concluída**, com mensagem curta em português
   sem acento (padrão: `feat: ...`, `ui: ...`, `fix: ...`). Mostre ao
   Fernando o resultado do commit.
6. **`git push` só quando o Fernando pedir** (o projeto é só dele; o
   push manda tudo para a produção na Vercel). Nunca `push --force`,
   nunca `git reset --hard` sem ele pedir.
7. **Windows / PowerShell:** `&&` não funciona; um comando por vez.
8. Não rode `npm audit fix --force`.
9. O `npm run dev` normalmente fica rodando no terminal do Cursor. Se
   precisar dele, pergunte antes de iniciar outro.

---

## O produto

**TaCerto!** — app de gestão para **MEI** (foco em **MEI
Caminhoneiro**): "entradas e saídas, sempre". O coração é um
**velocímetro** do quanto do limite anual de faturamento já foi usado.

- Stack: **React + Vite + Tailwind + Supabase**, npm. Pasta:
  `C:\Users\ferna\Documents\meu-tacerto-app`.
- Dev: PC em `localhost:8080`; iPhone (mesmo Wi-Fi) em
  `192.168.1.224:8080`.
- Open Finance pela **Pluggy** (caminho B, sem widget, no sandbox).
  Edge Function `supabase/functions/pluggy/index.ts` (v9, no ar).
- **Funções e SQL do Supabase:** o Claude Code usa o **conector do
  Supabase** (cada uso pede aprovação), seguindo a seção "Supabase"
  abaixo. Sem o conector, o caminho antigo continua: Fernando publica no
  painel (função → Code → colar → Deploy updates) e roda SQL no SQL
  Editor, com o comando pronto e print antes do Run.
- O app segue as regras da **reforma tributária de 2027** (ver HANDOFF
  Parte 3).

---

## Supabase

- Antes de rodar **qualquer SQL** ou publicar **qualquer função**, mostrar
  o que vai fazer, explicar em português simples e **esperar o "pode"**
  do Fernando.
- **Nunca** usar `DROP`, `TRUNCATE` ou `DELETE` sem o Fernando escrever
  **"pode apagar"**.
- Preferir comandos que podem rodar de novo sem estragar nada
  (`if not exists`, `create or replace`, `on conflict do nothing`).
- Registrar **todo SQL rodado** em `src/supabase/migrations.sql`.
- Quando a validação com usuários reais começar, trocar o conector do
  Supabase para **somente leitura** (`read_only`).
- **Permissões do conector** (`.claude/settings.json`): as ferramentas
  que só LEEM rodam sem perguntar (listar tabelas, migrations, extensões
  e funções; ver função; logs; advisors; documentação). As que podem
  mudar algo (`execute_sql`, `apply_migration`, `deploy_edge_function`
  e afins) sempre pedem aprovação. Ferramenta nova do Supabase: na
  dúvida, colocar em "ask".

### Rotina de toda mudança no Supabase

O projeto **não tem backup automático**. Por isso:

1. **ANTES de mudar:** dizer o que vai mudar e **guardar uma cópia dos
   dados afetados** na pasta `backups/` (fica fora do Git, no
   `.gitignore`), com a data no nome do arquivo (ex.:
   `backups/2026-10-03_saidas.json`; para função, o código publicado).
2. **DEPOIS de mudar:** **ler de novo** para confirmar que ficou como
   planejado, **olhar os logs** e **rodar os advisors de segurança**.
3. **Se algo der errado:** **parar**, avisar o Fernando em português
   simples e **propor como voltar atrás** (usando a cópia do passo 1).

---

## Regras de produto que não podem ser quebradas

- **Regra dos anos:** históricos, calendários e datas ficam limitados ao
  **ano em que a pessoa começou a usar o app** (`useAnoInicio`). Antes
  disso não interessa.
- **Nada entra no faturamento sem a pessoa confirmar** (conferência de
  entradas: "É faturamento?" Sim/Não; Sim vira regra, Não não vira).
- **Saídas** são guardadas sozinhas, sem perguntar nada; a tela de saídas
  é igual à de entradas.
- O app **nunca diz que uma DAS está "em aberto"** (só o governo sabe).
- **Tipo de MEI** é travado (só muda pela folha "O que mudou?").
- **Contador parceiro: é a ÚLTIMA coisa a construir** (pedido explícito).

---

## Padrões técnicos (não reintroduzir bugs)

- **Rolagem:** raiz `.tela-rolavel` + `.conteudo-rolavel` como **filho
  DIRETO**. Tela sem rolagem: `.tela-fixa`.
- **Topo das telas com rolagem:** `<TopoRolavel titulo="..." onVoltar={...} />`
  como primeiro item DENTRO da área que rola (o título sobe; a setinha
  fica parada e transparente). `recuo={20}` sem padding lateral;
  `titulo=""` quando o título é outro; `simples` nas telas de entrada.
  Exceção de propósito: "Escolha seu banco".
- **Campos no iPhone: fonte ≥ 16px** (abaixo disso o Safari dá zoom).
- **Teclado do iPhone:** folhas com campo usam a técnica do
  `visualViewport` (ver `FolhaLancarSaida` em `src/pages/Saidas.jsx`).
- **Cards:** `.card-tacerto`; cores por variáveis (`var(--primary)`,
  `var(--text)`, `var(--surface)`, `var(--field)`, `var(--border)`).
- **Cabeçalho:** setinha à esquerda, título ao lado (nunca centralizado).
- **Toasts:** `import { toast } from "sonner"`.
- Documento mascarado: CNPJ `12.345.•••/••01-90`, CPF `•••.654.321-••`.

---

## Contas de teste

- `piloto2@gmail.com` / `teste12345` — banco de teste conectado + 17
  entradas de teste.
- `piloto3@gmail.com` / `teste12345` — para ver a "primeira vez".
- `piloto4@gmail.com` / `teste12345` — criada em 03/10 (teste do
  cadastro depois do conserto de segurança); onboarding feito, MEI.
- Comandos de criar/resetar as entradas de teste: HANDOFF, Parte 7.

---

## Onde estamos (atualizar ao fim de cada sessão)

- **04/10: branch `piloto-simplificado`** (piloto com 30 MEI
  Caminhoneiros, 6 semanas, canal principal = WhatsApp). O que não é do
  piloto foi ESCONDIDO (nada apagado) pelas chaves de
  **`src/config/piloto.js`**; rota escondida volta para o `/dashboard`.
  Novos: pergunta "Quanto você já faturou" no Onboarding (vira
  lançamento "Faturamento estimado até hoje"), card "Próximo DAS",
  `/termos-de-uso`, `/privacidade`, `/como-emitir-nota`, botão "Falar com
  o Fisco no WhatsApp" (`WHATSAPP_FISCO` provisório — trocar).
  `PLUGGY_ATIVO = false`. "Sair da conta" agora desloga de verdade.
  A `main` não foi mexida.
- **04-05/10 (2ª rodada do piloto):** 5 slides com a mesma escala e
  altura (bug do slide 2), mensagens prontas em `MENSAGENS_WHATSAPP`
  (`piloto.js`), card do DAS com "Emitir boleto" + painel de pagamento,
  `/como-pagar-das`, `/como-emitir-nota` com 3 caminhos, Perfil em
  cartões sem a bola da inicial. Decisões e pendências em
  **`docs/DECISOES-PILOTO.md`**.
- `main` com **33 commits sem push** (o Fernando decide quando
  publicar). Produção ainda em `f1832bb`.
- 03/10 (fim): advisors de segurança rodados; as funções-gatilho
  `handle_new_user` e `rls_auto_enable` saíram do alcance do app
  (`migrations.sql` Parte 4C; cadastro testado com piloto4 e OK).
  Restam 2 avisos aceitos (ver HANDOFF Parte 12 → Segurança).
- 03/10: `pluggy` **v9 publicada** (estava a v8) e conferida; **GRANT**
  das tabelas `saidas`, `das_pagamentos`, `notas_fiscais` e
  `comprovantes` rodado e conferido (as telas Saídas, DAS e Notas não
  tinham acesso); SQL de 28/09 guardado no `migrations.sql` (Parte 4B);
  código da `excluir-conta` no repositório.
- Próximo passo: o Fernando testar no iPhone o que foi feito em 28-29/09
  (lista no HANDOFF, Parte 12 → "Conferir no iPhone") e corrigir em lote.
- Pendências rápidas: religar "Require Log In" na Vercel; conferir/apagar
  a conta do amigo na prévia. Segurança: `excluir-conta` deve desconectar
  a Pluggy e apagar os arquivos dos baldes `comprovantes` e `avatares`.