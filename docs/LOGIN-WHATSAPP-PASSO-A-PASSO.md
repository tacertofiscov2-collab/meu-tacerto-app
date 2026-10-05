# Login pelo WhatsApp — passo a passo do painel (05/10/2026)

O app já está pronto para entrar só pelo WhatsApp (tela `EntrarWhatsApp`,
em `/login` e `/cadastro`). Falta **ligar no Supabase**. São 6 etapas,
nesta ordem. Faça uma de cada vez e mande print se algo estiver diferente
do que está escrito aqui.

> **Como funciona, em uma frase:** a pessoa digita o número → o Supabase
> cria um código de 6 números → em vez de mandar SMS, ele chama a função
> `enviar-otp-whatsapp` → a função manda o código pelo WhatsApp (Z-API).

> ⚠️ **A Z-API está pausada.** Até reativar, números **reais** não recebem
> o código. Os **números de teste** (etapa 3) funcionam mesmo assim,
> porque não mandam mensagem nenhuma.

---

## Etapa 1 — Publicar a função `enviar-otp-whatsapp`

**Jeito mais fácil:** peça ao Claude Code: *"pode publicar a
enviar-otp-whatsapp"*. Ele publica pelo conector do Supabase (o app pede
a sua aprovação na hora) com o **Verify JWT desligado**.

**Pelo painel (se preferir):**
1. Painel do Supabase → menu da esquerda → **Edge Functions**.
2. **Deploy a new function** → **Via Editor**.
3. Nome: `enviar-otp-whatsapp` (exatamente assim).
4. Apague o código de exemplo e cole todo o conteúdo do arquivo
   `supabase/functions/enviar-otp-whatsapp/index.ts`.
5. Toque em **Deploy function**.
6. Abra a função → aba **Details** (ou **Settings**) → **desligue
   "Verify JWT with legacy secret"** (ou "Enforce JWT Verification") →
   **Save**. Quem chama essa função é o próprio Supabase, não o app; com
   isso ligado, ele seria barrado.

**Pela linha de comando (CLI)** — a CLI não está instalada no PC; o `npx`
baixa na hora. No terminal do Cursor, um comando por vez:

```bash
npx supabase login
```

```bash
npx supabase link --project-ref txejrqynagsfhteaofai
```

```bash
npx supabase functions deploy enviar-otp-whatsapp --no-verify-jwt
```

---

## Etapa 2 — Ligar o login por telefone

1. Menu da esquerda → **Authentication** → **Sign In / Providers**.
2. Na lista, abra **Phone**.
3. Ligue **Enable Phone provider** (e **Enable phone signup**, se aparecer).
4. **SMS provider:** se o painel exigir escolher um, escolha qualquer um
   (ex.: Twilio) e deixe os campos como estão. O **hook da etapa 4
   substitui o envio**: nada vai por SMS. Se ele não deixar salvar com
   campos vazios, mande print.
5. **SMS OTP Expiry:** `600` (10 minutos — é o que a mensagem do WhatsApp
   promete; o padrão é 60 segundos).
6. **SMS OTP Length:** `6`.
7. Ainda não salve: siga para a etapa 3 na mesma tela.

> **Não desligue o login por e-mail** (provider **Email**). É por ele que
> você entra pelo `/entrar-email` (plano B).

---

## Etapa 3 — Números de teste (não gastam mensagem)

Na mesma tela do **Phone**:

1. Campo **Test Phone Numbers and OTPs**: escreva
   ```
   5537900000001=123456
   ```
   (para mais de um, separe por vírgula:
   `5537900000001=123456,5537900000002=654321`)
2. **Test OTPs Valid Until:** escolha uma data depois do fim do piloto
   (ex.: 31/12/2026). Depois dessa data o número de teste para de funcionar.
3. Toque em **Save**.

> No app, o número de teste se digita assim: **(37) 90000-0001**, e o
> código é **123456**. Ele cria uma conta nova de verdade (vazia).

---

## Etapa 4 — Ligar o "Send SMS Hook"

1. Menu da esquerda → **Authentication** → **Hooks** (pode estar como
   "Auth Hooks").
2. **Add hook** → **Send SMS hook**.
3. **Hook type:** **HTTPS**.
4. **URL:**
   ```
   https://txejrqynagsfhteaofai.supabase.co/functions/v1/enviar-otp-whatsapp
   ```
5. **Secret:** toque em **Generate secret**. Aparece um texto que começa
   com `v1,whsec_`. **Copie e guarde** (vai ser usado na etapa 5). Não
   mande esse texto para ninguém, nem no chat.
6. Ligue o hook (**Enable**) e toque em **Create** (ou **Save**).

---

## Etapa 5 — Guardar o segredo na função

1. Menu da esquerda → **Edge Functions** → **Secrets**.
2. **Add new secret**:
   - Name: `SEND_SMS_HOOK_SECRET`
   - Value: o texto inteiro copiado na etapa 4 (com o `v1,whsec_` no começo)
3. **Save**.

Os secrets da Z-API (`ZAPI_INSTANCE_ID`, `ZAPI_TOKEN`, `ZAPI_CLIENT_TOKEN`)
**já existem** (são os da função `enviar-codigo`). Não precisa mexer.

---

## Etapa 6 — Limite de envios

1. **Authentication** → **Rate Limits**.
2. **Rate limit for sending SMS messages** (por hora, para o projeto
   todo): o padrão é baixo. Para o piloto de 30 pessoas, coloque **100**.
3. **Save**.

---

## Conferir o gatilho que cria o perfil (só leitura)

Quando alguém entra pela primeira vez, o gatilho `handle_new_user` cria a
linha da pessoa na tabela `perfis`. Ele foi feito para contas de e-mail;
**ainda não foi conferido se funciona para conta de telefone**. Para ler
o gatilho (não muda nada), o Claude Code roda pelo conector, com o seu
"pode":

```sql
select pg_get_functiondef('public.handle_new_user'::regproc);
```

Se ele usar o e-mail de um jeito que quebra sem e-mail, o login dá erro na
hora do código ("Não foi possível entrar"). **O gatilho não foi alterado
nesta tarefa.**

---

## Teste no iPhone

**A) Com o número de teste (não depende da Z-API)**
1. Abra o app → **Criar conta** (ou **Entrar**).
2. Tela "Entre com seu WhatsApp": digite **(37) 90000-0001** → **Receber
   código**.
3. Digite **123456**. Ele entra sozinho ao completar o 6º número.
4. Conta nova → abre o **Onboarding** (nome, tipo de MEI...) → Início.
5. Saia (Perfil → Sair da conta) e entre de novo com o mesmo número e
   código → deve ir **direto para o Início**.
6. Teste também: código errado (ex.: 111111) → "Código errado"; tocar em
   "Trocar número"; esperar os 60 s do "Reenviar código".

**B) Com número real (só depois de reativar a Z-API)**
1. Digite o seu número → **Receber código**.
2. Chega no WhatsApp: *"Seu código do TaCerto é: XXXXXX..."*.
3. Digite o código → entra.
4. Se não chegar: Edge Functions → `enviar-otp-whatsapp` → **Logs**. Os
   logs mostram o número mascarado (`5537*****88`) e o motivo.

---

## Se a Z-API cair

- Números reais **não recebem** o código; a tela mostra "Não conseguimos
  enviar agora. Tente de novo em alguns minutos."
- Quem **já está dentro** do app continua dentro (a sessão fica salva no
  celular e se renova sozinha).
- **Você** entra pelo endereço **`/entrar-email`** (ex.:
  `192.168.1.224:8080/entrar-email` ou na prévia da Vercel), com o e-mail e
  a senha de sempre. Não tem link para ele no app, de propósito.
- Os números de teste continuam funcionando.

> **Atenção:** a sua conta de e-mail e uma conta de telefone são contas
> **diferentes**. Entrar com o seu número cria uma conta nova, vazia; os
> lançamentos da conta de e-mail não aparecem nela.
