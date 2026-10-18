# Central — painel do projeto no iPhone (PWA)

Um app de tela inicial por projeto. Daqui o Fernando:

- **Pede** ao ChatGPT (Codex) ou ao Claude: o pedido vira uma issue
  com a etiqueta `pedido` e o texto pronto para colar (com o papel de
  cada um, ver `docs/PAPEIS.md`);
- **Aprova** PRs: merge normal só para a branch do piloto; nunca `main`;
- **Confere** os prints 390 × 844 de cada prévia (robô `prints.yml`).

Sem build: HTML/CSS/JS puros + funções da Vercel em `api/`.

## Variáveis na Vercel (Settings → Environment Variables)

| Nome | O que é |
|---|---|
| `GITHUB_TOKEN` | Token *fine-grained* do GitHub, só deste repositório: Contents, Issues, Pull requests e Actions = Read and write; Deployments = Read. |
| `CENTRAL_SENHA` | A senha para entrar na Central. |
| `PROJETO` | (opcional) qual bloco de `projetos/index.js`. Padrão: `tacerto`. |

O token nunca vai para o celular: só as funções em `api/` usam.

## Projeto na Vercel

- Root Directory: `central` · Framework: Other · sem comando de build.
- Production Branch: `central` (o `vercel.json` ignora as outras branches).

## Projeto novo (depois)

1. Copiar o bloco `tacerto` em `projetos/index.js` e trocar os dados.
2. Ícones em `icones/<id>-180.png`, `-192.png`, `-512.png`.
3. No repositório do projeto: `docs/PAPEIS.md`, `docs/DIARIO.md`,
   `.github/workflows/prints.yml` e `scripts/prints.mjs` (copiar do TaCerto).
4. Novo projeto na Vercel com `PROJETO=<id>`.

## Arquivos

| Arquivo | Para quê |
|---|---|
| `index.html`, `style.css`, `app.js` | As 4 telas (Início, Pedir, Aprovar, Conferir) |
| `sw.js` | Guarda a casca para abrir rápido (nunca guarda dados) |
| `api/estado.js` | PRs, pedidos, prévias, diário e robô numa chamada |
| `api/pedido.js` | Cria o pedido (issue) e o texto para colar |
| `api/aprovar.js` | Juntar no piloto, corrigir destino, marcar pedido feito |
| `api/prints.js` | Lista/mostra os prints e pede um novo |
| `api/entrar.js` | Senha e sessão (cookie de 90 dias) |
| `api/_lib.js`, `api/_prompts.js` | Peças comuns e o texto dos pedidos |
| `projetos/index.js` | Dados de cada projeto |
