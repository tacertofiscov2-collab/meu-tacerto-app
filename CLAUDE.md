# CLAUDE.md — TaCerto! (v3, 18/10/2026)

Lido no começo de cada sessão. Curto de propósito: cada linha aqui é
relida o tempo todo e gasta crédito. Regras de código e mapa de pastas:
**`AGENTS.md`**. Estado atual e pendências: **`docs/HANDOFF.md`**.
Histórico antigo (só quando precisar): `docs/historico/`.

## Quem é o Fernando

- Dono do projeto. **Não é programador**; testa tudo no **iPhone (Safari)**.
- Português do Brasil simples, respostas curtas, **um passo por vez**
  quando ele tiver que fazer algo (Supabase, Vercel, iPhone).
- Quer **arquivo completo** já com a mudança, nunca trecho para colar.
- Telas **minimalistas**: pouco texto, fundo preto, verde só no
  confirmar. Visual que não agradou: mostrar **2-3 variações**.
- Sem contador nem advogado: dúvida fiscal/legal se resolve pesquisando
  em fonte oficial, nunca com "confirme com o contador".
- Handoff só quando ele pedir ("crie o hand off").

## Como o trabalho é dividido

- **Claude (aqui) = patrão:** planeja, escreve o prompt do bloco,
  revisa o que voltou, corrige detalhe pequeno, junta as branches.
- **Codex (VS Code, conta ChatGPT Plus) = operário:** executa cada
  bloco numa branch própria `codex/bloco-N`, criada da
  `piloto-simplificado`, com push só dessa branch.
- Branch do piloto: **`piloto-simplificado`**. A `main` é produção: só
  recebe merge normal quando o Fernando autorizar.
- Juntar: PR `codex/bloco-N` → `piloto-simplificado`, **merge normal**
  (nunca squash, rebase, amend ou `--force`: o projeto é ligado ao Lovable).
- Prévia de cada branch na Vercel:
  `https://meu-tacerto-app-git-<branch-com-hifen>-tacertofiscov2-collab.vercel.app`
  (login com a conta GitHub **tacertofiscov2-collab**).

- **Papéis de cada ferramenta:** `docs/PAPEIS.md`. O Claude é chamado
  só em caso grave: leia primeiro as últimas linhas do `docs/DIARIO.md`.
- **Central** (PWA no iPhone, pasta `central/` na branch `central`):
  pedidos são issues com a etiqueta `pedido`; aprovar = merge normal
  para a `piloto-simplificado` (nunca `main`). Prints: `prints.yml`.

## Supabase (projeto `tacerto-fiscov2`)

- SQL ou função: mostrar o que vai fazer, explicar e **esperar o "pode"**.
- **Nunca** `DROP`, `TRUNCATE` ou `DELETE` sem **"pode apagar"**.
- Sem backup automático: antes de mudar, copiar os dados afetados para
  `backups/` (fora do Git); depois, ler de novo, ver logs e advisors.
- Todo SQL rodado vai para `src/supabase/migrations.sql`; o que não rodou
  fica em `docs/SQL-PENDENTE-*.sql`.
- Segredo `ANTHROPIC_API_KEY` já está no Supabase (créditos na conta
  Anthropic do Fernando). Nenhuma função de IA publicada ainda.

## Regras de produto (não quebrar)

- **O app nunca manda a pessoa para o WhatsApp.** WhatsApp é só a Isa
  avisando (DAS e check-up do CNPJ). Exceção: código de login.
- Nada entra no faturamento sem a pessoa confirmar.
- O app nunca diz que um DAS está "em aberto". Nada cita "Receita Federal".
- Tipo de MEI travado. Datas só a partir do ano em que a pessoa começou.
- A assistente é a **Isa** (IA, nunca pessoa nem contadora). Nomes
  internos continuam "Fisco" (`Fisco.jsx`, `ChatFiscoUI`, `/fisco`).
- Escopo congelado até o piloto: ideia nova vai para `PENDENCIAS_FUTURAS.md`.
- Contador parceiro: a última coisa a construir.

## Conferir antes de dizer que terminou

- `npx vite build` sem erro e `node scripts/checar-whatsapp.mjs` passando.
- Mudança visual: largura do iPhone (390 × 844) e Console sem erro.
  Altura sobrando/faltando no PC não decide nada: o print do iPhone decide.
- Erros já vistos e como evitar: **`docs/CUIDADOS-TECNICOS.md`**.
