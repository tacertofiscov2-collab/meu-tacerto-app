<!-- /* RESPONDER-DUVIDAS v1 — como acompanhar e responder dúvidas pendentes da Isa */ -->
# Dúvidas que a Isa não soube responder

A IA continua desligada (`ISA_IA_ATIVA = false`). Nessa fase, as perguntas
sem resposta ficam **só no aparelho**, sem envio à equipe. Elas não aparecem
no Supabase. Depois de ligar a IA, uma pergunta encaminhada pela função
`isa-chat` aparece na tabela abaixo.

## Ver as dúvidas

1. Entre no painel do Supabase e abra o projeto TaCerto!
2. Abra **Table Editor** e procure **isa_duvidas_pendentes**.
3. Filtre **respondida = false**. Ordene por **criado_em**, das mais antigas
   para as mais novas, se quiser atender na ordem de chegada.
4. Leia **pergunta**. O **user_id** identifica a conta; não compartilhe essa
   informação nem a pergunta fora da equipe.

Se a tabela não aparecer, o SQL do Bloco 6 ainda precisa ser autorizado e
executado. Não rode SQL só para seguir este guia.

## Marcar uma dúvida como respondida

1. Confira a orientação antes de responder. Se houver dúvida fiscal,
   confirme com o contador; não invente uma resposta.
2. Na linha da pergunta, preencha **resposta**, com português simples.
3. Mude **respondida** para **true** e salve no painel.
4. Confira novamente se a resposta e a marca ficaram guardadas.

Não altere **id**, **user_id**, **pergunta** ou **criado_em**. Para corrigir
uma resposta, edite apenas **resposta** e salve de novo. Não apague linhas.

**Limitação deste bloco:** preencher a resposta na tabela ainda não cria uma
mensagem nem uma notificação no app. A entrega automática dessa resposta precisa
de uma etapa posterior; não marque como entregue só por ter preenchido a tabela.
Se o assunto se repetir, a equipe pode revisar a apostila em `base-mei.md`,
gerar `base-mei.ts` e publicar de novo, sempre com autorização do Fernando.

As pessoas podem ler só as próprias linhas e não podem criar ou alterar
pendências pelo app. A função grava depois de conferir o login. Fernando
responde pelo Table Editor, com acesso de equipe ao painel.

Referências técnicas usadas na implementação: [cache da Anthropic](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
e [reconhecimento de voz do navegador](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition/result_event).
