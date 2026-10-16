<!-- /* LANCAMENTO-CHECKLIST v1 — pendências antes do piloto; nenhuma mudança remota executada */ -->
# Antes de começar o piloto

Esta lista registra o que falta. Não autoriza executar SQL, publicar funções,
alterar chaves ou juntar branches. As funções do Bloco 7 foram alteradas só
no repositório e precisam ser publicadas depois da revisão.

- [ ] Revisar os arquivos `docs/SQL-PENDENTE-*.sql` e executar somente o que
  ainda faltar, com autorização do Fernando e cópia de segurança. O SQL de
  08-10 já consta como executado no HANDOFF; conferir antes de repetir.
  O `SQL-PENDENTE-BLOCO4.sql` ainda não foi executado.
- [ ] Preparar/revisar o Bloco 6 e publicar a função `isa-chat`. Se o código
  ainda não existir nesta branch, ele precisa ser concluído antes de publicar.
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
- [ ] Revisar os Blocos 4, 5, 6 e 7, incluindo os textos e ações do chat
  (`ChatFiscoPagina.jsx` e `ChatFiscoUI.jsx` ficaram para o Bloco 6).
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
