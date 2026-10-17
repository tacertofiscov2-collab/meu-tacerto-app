<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

<!-- AGENTS v3 — fluxo por blocos (codex/bloco-N), mapa de pastas com docs/
     e docs/historico/, leitura mínima (v2: regras de código e mapa de pastas) -->

# TaCerto! — regras para agentes de código

App de gestão para MEI (foco em MEI Caminhoneiro). O dono, Fernando, não é
programador: fale com ele em português do Brasil simples. Leia antes o
`CLAUDE.md` (curto) e o `docs/HANDOFF.md` (estado atual). Antes de mexer
numa área, veja `docs/CUIDADOS-TECNICOS.md`. **Não leia `docs/historico/`**
a não ser que a tarefa peça: é passado e só gasta tempo.

## Como cada tarefa roda

- Uma tarefa = um bloco = uma branch `codex/bloco-N`, criada a partir da
  `piloto-simplificado` atualizada (`git checkout piloto-simplificado &&
  git pull` antes).
- No fim: build, checagem do WhatsApp, commit e push **só da sua branch**.
  Quem junta na `piloto-simplificado` é o Claude/Fernando, depois de revisar.
- Não inicie servidor no PC do Fernando (4 GB de RAM). Não rode SQL nem
  publique funções. Não mexa no `.env`.

## Regras de código

1. Antes de mexer, diga em poucas linhas o que vai mudar e em quais arquivos.
   Mude só o necessário.
2. Marca de versão na **primeira linha** de cada arquivo alterado:
   `/* NOMEDOARQUIVO vN — o que mudou (vN-1: ...) */`. Aumente a cada mudança.
3. Arquivos sempre em **UTF-8** (acentos quebrados são bug real).
4. Depois de mudar: `npx vite build` sem erro; procure imports sem uso.
   Mudança visual: conferir na largura do iPhone (390 × 844) e o Console.
5. Um commit por etapa, mensagem curta em português sem acento
   (`feat: ...`, `ui: ...`, `fix: ...`, `docs: ...`).
6. **Nunca** `push --force`, rebase, amend ou squash de commit já enviado
   (projeto ligado ao Lovable). `git push` só quando o Fernando pedir.
7. **Supabase:** SQL e funções só com o "pode" do Fernando. Nunca `DROP`,
   `TRUNCATE` ou `DELETE` sem "pode apagar". Preferir `if not exists`,
   `create or replace`. Registrar todo SQL rodado em
   `src/supabase/migrations.sql`. SQL ainda não rodado vai para
   `docs/SQL-PENDENTE-*.sql`.
8. **O app nunca manda a pessoa para o WhatsApp** (nenhum `wa.me` ou
   `api.whatsapp.com` em `src/`; `node scripts/checar-whatsapp.mjs` falha se
   aparecer). O WhatsApp é só a Isa avisando (lembrete e boleto do DAS,
   check-up do CNPJ).
9. Escopo congelado: ideia nova vai para `PENDENCIAS_FUTURAS.md`.

## Regras de produto

- Datas e históricos só a partir do ano em que a pessoa começou (`useAnoInicio`).
- Nada entra no faturamento sem a pessoa confirmar.
- O app nunca diz que uma DAS está "em aberto".
- Tipo de MEI é travado. Nada no app cita "Receita Federal".
- A assistente se chama **Isa** (IA). Nomes internos continuam "Fisco"
  (`Fisco.jsx`, `ChatFiscoUI`, `faqFisco`, rota `/fisco`): não renomear.

## Padrões técnicos

- Rolagem: raiz `.tela-rolavel` + `.conteudo-rolavel` como filho direto;
  tela sem rolagem: `.tela-fixa`.
- Topo das telas com rolagem: `<TopoRolavel titulo="..." onVoltar={...} />`.
- Campos com fonte ≥ 16px (o Safari do iPhone dá zoom abaixo disso).
- Cards: `.card-tacerto`; cores por variáveis CSS (`var(--primary)`,
  `var(--text)`, `var(--surface)`, `var(--field)`, `var(--border)`).
- Cabeçalho: setinha à esquerda, título ao lado. Toasts: `sonner`.
- Chaves do piloto (mostrar/esconder): `src/config/piloto.js`.
- Regras fiscais num lugar só: `src/lib/fiscal.js`.
- Tailwind lê comentários: evite colchetes com dois-pontos em comentários.

## Mapa de pastas

| Pasta | O que tem |
|---|---|
| `src/pages/` | Uma tela por arquivo (Dashboard = Início, Perfil = Mais, Notas, Isa...) |
| `src/components/` | Peças das telas (rodapé `BottomNav`, chat `ChatFiscoUI`, folhas) |
| `src/lib/` | Contas e regras (fiscal, DAS, extrato, lucro, notas, perfil, supabase) |
| `src/config/piloto.js` | Chaves do piloto e textos prontos |
| `src/context/AppStateContext.jsx` | Estado do app (lançamentos, perfil) |
| `src/hooks/` | `useAnoInicio` e outros |
| `src/supabase/migrations.sql` | Registro de todo SQL já rodado |
| `supabase/functions/` | Funções do servidor (Edge Functions do Supabase) |
| `docs/` | `HANDOFF.md` (estado), `LANCAMENTO-CHECKLIST.md`, `CUIDADOS-TECNICOS.md`, SQL pendente, passo a passo (índice: `docs/README.md`) |
| `docs/historico/` | Resumos e prompts antigos — não ler no dia a dia |
| `supabase/functions/isa-chat/` | Isa com IA: `index.ts`, apostila `base-mei.md` (editar esta) e `base-mei.ts` (gerado por `scripts/gerar-base-mei.mjs`) |
| `scripts/` | Checagens simples (ex.: nada de link do WhatsApp em `src/`) |
| `public/` | Ícones, fotos da Isa, manifesto do app |
