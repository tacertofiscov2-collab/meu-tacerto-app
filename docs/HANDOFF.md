# HANDOFF — TaCerto! (estado em 17/10/2026)

Resumo de onde o projeto está. Curto: só o que vale hoje. O passado
(telas antigas, tarefas de 08-10 e 10-10, decisões) está em
`docs/historico/` — comentários antigos no código que citam "HANDOFF
Parte N" ou "seção N" se referem a esses arquivos.

## 1. O produto em uma frase

App de gestão para **MEI** (foco no **MEI Caminhoneiro**): velocímetro do
limite anual, lançamentos com e sem nota, extrato do banco, DAS, notas,
Calcular (IR, lucro, quanto ainda pode faturar) e a **Isa** (assistente
com IA). Piloto: **30 MEI Caminhoneiros**, 6 semanas.

## 2. Onde está o código

- GitHub: `tacertofiscov2-collab/meu-tacerto-app` (⚠️ **público** — deixar
  privado antes do piloto). Branch do piloto: `piloto-simplificado`.
  `main` = produção antiga, não mexida.
- Vercel: projeto `meu-tacerto-app` (conta GitHub tacertofiscov2-collab).
- Supabase: projeto `tacerto-fiscov2`.
- PC do Fernando: `C:\Users\ferna\Documents\meu-tacerto-app` (VS Code +
  extensão Codex). PC fraco (4 GB): não rodar servidor local nele.

## 3. Blocos da reta final (plano de 10 dias, começou em 15/10)

| Bloco | O que é | Situação |
|---|---|---|
| 1 | Arrumação, AGENTS.md, conserto do migrations.sql | Na piloto-simplificado |
| 2 | Respostas N1 a N9 | Na piloto-simplificado |
| 3 | Rodapé de 5 itens (Início, Notas, +, Isa, Mais); Isa sai do Início; Últimos lançamentos | Na piloto-simplificado |
| 4 | "+" pergunta se tem nota; selo com/sem nota; campo "Quem pagou?" | Na piloto-simplificado (SQL pendente) |
| 5 | WhatsApp só como aviso (slides, tutorial, Suporte, Termos) | Na piloto-simplificado |
| 6 | Isa com IA (função `isa-chat` + apostila), **desligada**; microfone por ditado; teclado do iPhone; Mais sem título | Branch `codex/bloco-6`, **esperando teste no iPhone** |
| 7 | Excluir conta apaga arquivos; comprovante no Haiku; checklist | Na piloto-simplificado |

## 4. Chaves importantes (`src/config/piloto.js`)

- `ISA_IA_ATIVA = false` — a Isa responde com respostas prontas até ligar.
- `MODO_TESTE_LOGIN = true` — ⚠️ desligar antes de gente real
  (números de teste 37 00000-0001 a 9999, qualquer código).
- `MOSTRAR_ANEXOS_CHAT = true`; demais chaves e o que cada uma esconde:
  ver o próprio `piloto.js` e `docs/DECISOES-PILOTO.md`.
- Fora do piloto.js: `PLUGGY_ATIVO = false` (`src/lib/openfinance.js`).

## 5. Supabase — o que já rodou e o que falta

| Item | Situação |
|---|---|
| SQL de 08-10 | Rodado em 10/10 (`docs/historico/SQL-08-10-JA-RODADO.sql`) |
| `docs/SQL-PENDENTE-10-10.sql` | **Não rodado** |
| `docs/SQL-PENDENTE-NOTIFICACOES.sql` | **Não rodado** |
| `docs/SQL-PENDENTE-BLOCO4.sql` (coluna `tem_nota`) | **Não rodado** |
| `docs/SQL-PENDENTE-BLOCO6.sql` (tabelas da Isa) | **Não rodado** (está na branch do Bloco 6) |
| Funções `isa-chat`, `ler-comprovante`, `aviso-semanal`, `excluir-conta` (nova) | **Escritas, não publicadas** |
| Segredo `ANTHROPIC_API_KEY` | Criado (US$ 5 de crédito na conta Anthropic do Fernando; conferir o limite mensal no Console) |
| Login por WhatsApp (provider Phone) | Não ligado (`docs/LOGIN-WHATSAPP-PASSO-A-PASSO.md`) |

O app funciona sem nada disso: campo que falta no banco fica guardado no
aparelho e sobe depois.

## 6. Antes do piloto

Lista completa e em ordem: **`docs/LANCAMENTO-CHECKLIST.md`**.

## 7. Custos combinados

- Isa no app: Claude **Haiku 5.5**, apostila fixa (`supabase/functions/
  isa-chat/base-mei.md`), sem busca na web. ~R$ 0,002 a 0,005 por pergunta;
  30 perguntas por pessoa por dia.
- WhatsApp (Meta, desde 01/10/2026): só mensagens de serviço/utilidade
  (~R$ 0,035 cada; mil de serviço grátis por mês por número). Nunca
  marketing. Lembretes do DAS no máximo 2 por mês.

## 8. Contas de teste

- `piloto2@gmail.com` / `teste12345` — banco de teste conectado + 17 entradas.
- `piloto3@gmail.com` / `teste12345` — para ver a "primeira vez".
- `piloto4@gmail.com` / `teste12345` — onboarding feito, MEI.
- ⚠️ Trocar essas senhas antes de qualquer dado real (o repositório é público).

## 9. Para testar no iPhone agora (Bloco 6)

Prévia: `https://meu-tacerto-app-git-codex-bloco-6-tacertofiscov2-collab.vercel.app`
1. Aba Isa: tocar no campo → o rodapé some e a barra fica logo acima do teclado.
2. Microfone: com o Ditado do iPhone ligado (Ajustes > Geral > Teclado),
   fica verde, escreve o que a pessoa fala; ela confere e envia.
3. Pergunta sem resposta pronta → "Vou passar sua dúvida para a equipe...".
4. Aba Mais: sem o título no topo.

Se estiver bom: juntar `codex/bloco-6` na `piloto-simplificado`.
