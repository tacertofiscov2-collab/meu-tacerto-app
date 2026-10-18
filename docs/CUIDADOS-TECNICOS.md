# Cuidados técnicos — erros que já aconteceram (não repetir)

Leia antes de mexer na parte citada. Atualizado em 17/10/2026.

## iPhone / Safari

- **Teclado no iPhone:** ao abrir o teclado, o Safari ROLA a página
  (`visualViewport.offsetTop` cresce). Para saber se o teclado está aberto,
  use `innerHeight - visualViewport.height`, nunca descontando o
  `offsetTop` (bug do chat da Isa, 17/10). Folhas com campo usam a técnica
  do `visualViewport` (ver `FolhaLancarSaida` em `src/pages/Saidas.jsx`).
- **`100dvh` mente em alguns iPhones** (não encolhe com o teclado). Histórico
  das 8 tentativas: `src/components/TecladoVisivel.jsx`.
- **Campos com fonte < 16px** fazem o Safari dar zoom.
- **Gesto de voltar do iPhone = voltar do navegador.**
- **Ditado (microfone da Isa)** usa o reconhecimento de voz do Safari, que
  só funciona com o **Ditado do iPhone ligado** (Ajustes > Geral > Teclado).
- Simulação no PC ≠ altura do iPhone: sobra/falta de espaço vertical quem
  decide é o print do iPhone.

## React / app

- **A tela inteira remonta quando muda o endereço, inclusive o `?`**
  (`TransicaoTela`). Estado entre etapas com `?passo=` vai para o
  `sessionStorage` (ver `CalcularDeclaracao.jsx`).
- **`adicionarLancamento` monta o lançamento ANTES do `setState`**: dentro
  do `setState` o React 18 pode adiar e a gravação saía vazia.
- **Campos novos do banco** que podem ainda não existir: ler numa consulta
  separada e gravar de forma tolerante (erro `42703` na leitura,
  `PGRST204` na gravação) — ver `src/lib/perfil.js` e `tem_nota` no
  `AppStateContext.jsx`.
- **Extrato:** a trava contra repetido é `pluggy_transaction_id =
  "extrato-<chave>"`. Mesmo dia e valor de outro extrato entra como
  `categoria = "repetido"` e a pessoa confirma. Datas como
  `AAAA-MM-DDT12:00:00-03:00` (o dia nunca muda com o fuso).
- **Conferência:** o que conta é lançado por `lancarEntradasConfirmadas`
  (`src/lib/importarExtrato.js`), nunca por `criarLancamento` direto.
- **HMR** às vezes carrega duas cópias do AppStateContext (tela branca com
  "useAppState precisa estar dentro de <AppStateProvider>"): recarregar.

## Build / ferramentas

- **Tailwind lê os comentários:** "[-3:BRT]" num comentário virou classe
  quebrada. Evitar colchetes com dois-pontos em comentários.
- **ESLint não está instalado.** Conferir com `npx vite build`.
- **Fim de linha do Windows (CRLF):** o PC do Fernando é Windows; arquivo
  gerado lá pode vir com `\r`. O `base-mei.ts` deve ser gerado com
  `node scripts/gerar-base-mei.mjs` (editar só o `base-mei.md`).
- **`package-lock.json` tem endereços antigos do Lovable**: na nuvem, os
  pacotes vêm do `registry.npmjs.org` (o Codex já resolve sozinho).
- **Codex na nuvem:** ao criar a tarefa, escolher a branch
  **`piloto-simplificado`** (antes ele só via a `main`). Se o PR sair com
  destino `main`, a Central mostra "destino errado" e troca para a
  `piloto-simplificado` com um toque. Nunca juntar PR do Codex na `main`.

## Testar sem login

- O Claude não faz login no Supabase. Para ver telas com login: "banco de
  mentira" só no navegador de teste (`node_modules/.tacerto-teste/mock.js`,
  fora do Git). Detalhes em `docs/historico/HANDOFF-05-a-12-10.md`, seção 7.

## IA (Claude API)

- A conversa mandada para a IA precisa **começar pela pessoa** e alternar
  os lados (a fala de abertura da Isa não entra) — ver `isa-chat`.
- Modelo padrão das funções: `claude-haiku-5-5` (troca por segredo:
  `MODELO_ISA`, `MODELO_COMPROVANTE`). O `ler-comprovante` usa
  `output_config.effort`: conferir na primeira publicação se o Haiku aceita.
