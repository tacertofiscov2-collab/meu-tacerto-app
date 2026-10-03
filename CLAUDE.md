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
  Edge Function `supabase/functions/pluggy/index.ts` (v9). **Funções do
  Supabase são publicadas pelo Fernando no painel** (função → Code →
  colar → Deploy updates): depois de alterar uma, passe o passo a passo.
- **SQL** também é rodado pelo Fernando no SQL Editor do Supabase:
  entregue o comando pronto e peça o print antes do Run.
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
- Comandos de criar/resetar as entradas de teste: HANDOFF, Parte 7.

---

## Onde estamos (atualizar ao fim de cada sessão)

- `main` em `0d812ec`, **17 commits sem push** (o Fernando decide quando
  publicar).
- Próximo passo: o Fernando testar no iPhone o que foi feito em 28-29/09
  (lista no HANDOFF, Parte 12 → "Conferir no iPhone") e corrigir em lote.
- Pendências rápidas: religar "Require Log In" na Vercel; guardar os
  SQLs de 28/09 em `src/supabase/migrations.sql`.