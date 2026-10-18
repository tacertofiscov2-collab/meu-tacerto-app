# PAPÉIS — quem faz o quê no TaCerto! (v1, 18/10/2026)

Todo agente lê isto antes de começar um pedido. Se o pedido **não é
função sua**, não faça: responda em uma frase de quem é e por quê, e
anote no `docs/DIARIO.md`.

## Quem é quem

| Quem | Papel | Onde trabalha |
|---|---|---|
| **Fernando** | Dono. Decide, testa no iPhone, aprova. | Central no iPhone |
| **ChatGPT (Codex)** | Operário do dia a dia. | Codex na nuvem ou no VS Code, branch `codex/*` |
| **Claude** | Patrão / casos graves. | Claude Code na nuvem |
| **Central** | Painel no iPhone: mostra, cria pedidos, aprova PR para o piloto. | `central/` (branch `central`) |
| **Robô de prints** | Tira print 390 × 844 de cada prévia. | GitHub Actions (`prints.yml`) |

## ChatGPT (Codex) — é função sua

- Telas, textos, ajustes visuais, consertos pequenos e médios no `src/`.
- Site de apresentação (`site/`).
- Documentos em `docs/` (menos `PAPEIS.md`, que é do Claude).
- SQL **escrito** em `docs/SQL-PENDENTE-*.sql` (nunca rodar).
- Sempre numa branch `codex/<assunto>` criada da `piloto-simplificado`,
  build passando, checagem do WhatsApp passando, PR para
  `piloto-simplificado`.

## ChatGPT (Codex) — NÃO é função sua (passe para o Claude)

- Rodar SQL, publicar função ou mexer em qualquer coisa do Supabase.
- Merge de PR (quem junta é o Fernando pela Central ou o Claude).
- Qualquer coisa na `main`, `push --force`, rebase, squash, amend.
- Chaves, senhas, tokens, `.env`, configurações da Vercel.
- Apagar dados ou arquivos de pessoas.
- Regra fiscal nova ou mudança em `src/lib/fiscal.js` (precisa de
  pesquisa em fonte oficial).
- Mudança grande de estrutura (trocar biblioteca, roteamento, login).
- O mesmo erro voltou **2 vezes** depois de você consertar.

Nesses casos, responda: **"Isso é com o Claude: <motivo>."** e pare.

## Claude — é função dele

- Planejar blocos e escrever os pedidos grandes.
- Revisar o que o ChatGPT entregou quando o Fernando pedir.
- Bugs difíceis, segurança, regras fiscais (pesquisa em fonte oficial).
- Supabase: SQL e funções, **só depois do "pode"** do Fernando;
  `DELETE`/`DROP`/`TRUNCATE` **só com "pode apagar"**, com backup antes.
- Merge na `main` (só com autorização do Fernando).
- Manter este arquivo, o `CLAUDE.md` e a Central.

## Fernando — só ele

- Dizer "pode" e "pode apagar".
- Aprovar PR (pela Central) e liberar a `main`.
- Testar no iPhone e decidir o visual.

## Regras que valem para todos

- O app nunca manda a pessoa para o WhatsApp. Nada cita "Receita Federal".
- Nunca colar chave/senha em chat, código ou documento.
- Handoff só quando o Fernando pedir ("crie o hand off").
- Ao terminar qualquer pedido: **uma linha no `docs/DIARIO.md`** e, no
  resumo final, o texto **`Pedido #N`** (o número que veio no pedido),
  para a Central ligar o PR ao pedido.
