/* FLAGS v1 — as chaves de liga/desliga do app, num lugar so */

/* ===================================================================
   POR QUE ESTE ARQUIVO EXISTE

   Antes cada tela tinha a sua propria chave para a mesma coisa:
     - Cadastro.jsx       -> MODO_PREVIA
     - EditarPerfil.jsx   -> VERIFICACAO_WHATSAPP_ATIVA
   Sao o MESMO assunto (a Z-API esta no ar ou nao?), em dois lugares.
   Na hora de religar, e facil trocar uma e esquecer a outra — e ai o
   cadastro funciona e o perfil nao, ou o contrario.

   Agora e uma chave so. Muda aqui, vale no app inteiro.
   =================================================================== */

/* -------------------------------------------------------------------
   WHATSAPP — envio e conferencia do codigo de 6 numeros

   false  = MODO PREVIA
            As telas aparecem iguais, mas nada e enviado pela Z-API e
            qualquer codigo de 6 numeros e aceito. Serve para mostrar o
            app sem depender do provedor e sem gastar mensagem.

   true   = MODO REAL
            O codigo vai de verdade pela Edge Function "enviar-codigo"
            e e conferido pela "verificar-codigo". So funciona com a
            Z-API conectada e o plano ativo.

   COMO LIGAR: troque false por true, salve, pronto.
   ------------------------------------------------------------------- */
   export const WHATSAPP_ATIVO = false;

   /* -------------------------------------------------------------------
      E-MAIL — link de confirmacao do endereco
   
      false  = a tela mostra o botao de verificar, mas avisa que a funcao
               ainda nao esta disponivel.
   
      true   = envia o link de verdade.
   
      SO LIGUE depois de ATIVAR "Confirm email" no painel do Supabase
      (Authentication -> Providers -> Email). Com aquilo desligado nao
      existe link para enviar e o botao vai falhar sempre.
   
      AO LIGAR, REVISAR TAMBEM: com a confirmacao ativa, o campo
      `email_confirmed_at` do Supabase volta a ser confiavel e passa a ser
      o criterio correto do selo verde — hoje o EditarPerfil usa a origem
      da conta (Google ou senha) justamente porque aquele campo mente
      enquanto a confirmacao esta desligada.
      ------------------------------------------------------------------- */
   export const EMAIL_VERIFICACAO_ATIVA = false;