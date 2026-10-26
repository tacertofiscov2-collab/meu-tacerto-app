<!-- /* LANCAMENTO-CHECKLIST v2 — passos para ligar a Isa com IA (v1: pendências do piloto) */ -->
# Antes de começar o piloto

Esta lista registra o que falta. Não autoriza executar SQL, publicar funções,
alterar chaves ou juntar branches. As funções do Bloco 7 foram alteradas só
no repositório e precisam ser publicadas depois da revisão.

- [ ] Revisar os arquivos `docs/SQL-PENDENTE-*.sql` e executar somente o que
  ainda faltar, com autorização do Fernando e cópia de segurança. O SQL de
  08-10 já consta como executado no HANDOFF; conferir antes de repetir.
  O `SQL-PENDENTE-BLOCO4.sql` ainda não foi executado.
- [ ] Revisar o Bloco 6 e seguir os passos de ativação da Isa abaixo.
- [ ] Publicar `ler-comprovante`, com padrão `claude-haiku-5-5`. Conferir se
  `MODELO_COMPROVANTE` já está definido: esse segredo prevalece sobre o padrão.
- [ ] Publicar `aviso-semanal` e conferir o agendamento e a entrega dos avisos.
- [ ] Publicar `excluir-conta` com a limpeza de `comprovantes` e `avatares`
  antes da exclusão. Validar depois com conta e arquivos de teste, incluindo
  subpastas e mais de uma página de arquivos. Nenhum dado real foi apagado.
- [x] `ANTHROPIC_API_KEY` criada no Supabase, conforme informado pelo Fernando.
  O valor não foi consultado nem copiado para o repositório.
- [ ] Criar/configurar as chaves VAPID da notificação no celular e conferir
  a correspondência entre chave pública do app e chave privada do servidor.
- [ ] Desligar `MODO_TESTE_LOGIN` em `src/config/piloto.js` antes do piloto real.
- [ ] Ligar/configurar o login por WhatsApp no painel do Supabase e conferir
  o fluxo de código, incluindo as funções necessárias ao envio.
- [ ] Trocar a chave `anon` e atualizar os ambientes necessários. A chave
  `service_role` deve continuar somente no servidor. O `.env` não foi alterado.
- [ ] Religar o **Require Log In** da Vercel.
- [ ] Deixar o repositório do GitHub **PRIVADO**: há senhas de teste no
  `CLAUDE.md`. Trocar essas senhas antes de usar contas com dados reais.
- [ ] Revisar os Blocos 4, 5, 6 e 7. O chat do Bloco 6 já foi preparado,
  com IA desligada, sem saída para WhatsApp e com ditado para conferir.
- [ ] Conferir as telas no iPhone (390 × 844) e o Console. Essa conferência
  foi adiada a pedido do Fernando; nenhum servidor foi iniciado nesta sessão.
- [ ] Levar as alterações aprovadas das branches `codex/bloco-*` para
  `piloto-simplificado` por merge normal, sem reescrever histórico.
- [ ] Abrir PR de `piloto-simplificado` para `main` e fazer **merge normal**,
  somente quando autorizado. Não usar squash, rebase, amend ou force push.

Cuidados da exclusão: erro na limpeza preserva a conta para nova tentativa;
arquivos que já tiverem sido apagados não são restaurados automaticamente.
A integração Pluggy continua desligada; antes de religá-la, concluir também
a desconexão dos bancos ao excluir a conta.

## Para ligar a Isa com IA

Tudo abaixo continua pendente. Fazer somente com autorização do Fernando.

1. Rodar `docs/SQL-PENDENTE-BLOCO6.sql`, seguindo a rotina de cópia e
   conferência do `CLAUDE.md`. Registrar depois em `src/supabase/migrations.sql`.
2. Rodar `node scripts/gerar-base-mei.mjs` antes de publicar, especialmente se
   a apostila tiver mudado. Publicar a função `isa-chat` com `index.ts` e
   `base-mei.ts`. A apostila `base-mei.md` não precisa ser lida pelo servidor.
3. Conferir `ANTHROPIC_API_KEY` (já criada) nos segredos; `MODELO_ISA` é
   opcional e substitui o padrão `claude-haiku-5-5`. Nunca usar a chave
   `service_role` no app; ela é usada somente na função, após conferir o login.
4. Testar uma pergunta com token de uma conta de teste. Conferir a resposta,
   o contador em `isa_uso` e uma dúvida fora da apostila em
   `isa_duvidas_pendentes`. Conferir também falha de chave/tabela e limite diário.
5. Só depois mudar `ISA_IA_ATIVA` de `false` para `true` em
   `src/config/piloto.js`, fazer build, checar WhatsApp e enviar a mudança
   quando autorizado. Para desligar, voltar a chave para `false`.

O limite é de 30 tentativas de IA por pessoa por dia de Brasília. A tentativa
é reservada antes da chamada: falha da IA também consome uma posição, evitando
gastos repetidos. Sem a chave ou as tabelas, a IA não é chamada. Erro na IA
faz o app usar a resposta pronta; se não houver, guarda a dúvida no aparelho.
Com a chave desligada, as conversas novas e dúvidas ficam somente no aparelho,
sem envio automático à equipe. Não há importação automática dessas dúvidas.
Reconhecimento de voz depende do navegador; ele apenas escreve no campo e
nunca envia a pergunta sozinho. A conferência no iPhone e o teste real da função
continuam pendentes; nenhum servidor foi iniciado nem função publicada.
