<!-- NOTIFICACOES v3 — na tela a linha agora é só "Permitir notificações" com a chave (pedido do Fernando: sem texto explicando) (v2: o nome da linha no app era "Notificação da semana"; o script das chaves usa o webcrypto do node:crypto (funciona também no Node 18) (v1: passo a passo da notificação da semana no celular (chaves, SQL, segredos, função aviso-semanal, despertador, teste no iPhone, como desligar, custos e riscos). Escrito em 12/10/2026.)) -->
# Notificação da semana no celular — passo a passo (12/10/2026)

> **Uma notificação por semana**, toda **segunda às 9h**, para cada pessoa
> que ativou. Ela diz como está o velocímetro, por exemplo:
>
> **TaCerto!**
> Você já usou 42% do limite do ano. Continua no seu ritmo.
>
> Sem valor em reais e sem CNPJ (ela aparece na tela bloqueada, que
> qualquer um vê). Tocar abre o Início do app.
>
> **Hoje:** a parte do celular está pronta no app; a parte do servidor está
> **escrita, mas NADA foi rodado nem publicado**. Faltam os 6 passos abaixo,
> cada um com o seu **"pode"**.

---

## O que já está pronto

**No app (celular):**
- Em **Perfil → Permissões e integrações**, a linha **"Notificação da
  semana"**. A pessoa toca em **Ativar** e aceita o pedido do celular.
- **No iPhone só funciona com o TaCerto na Tela de Início** (o ícone do
  app, como se fosse um aplicativo da loja) e com **iOS 16.4 ou mais novo**.
  Pelo Safari aberto normal, o iPhone não deixa.

**No servidor (escrito, ainda NÃO rodado / NÃO publicado):**
- **`docs/SQL-PENDENTE-NOTIFICACOES.sql`**, em duas partes:
  - **PARTE 1:** a tabela onde ficam os celulares que ativaram
    (`inscricoes_push`) e a conta do faturamento do ano de cada pessoa
    (igual à do velocímetro).
  - **PARTE 2:** o **"despertador"** de toda segunda, 9h de Brasília.
- **Função `aviso-semanal`** (`supabase/functions/aviso-semanal/index.ts`):
  monta a frase de cada pessoa e entrega pela Apple/Google.
  - Não manda 2 vezes na mesma semana.
  - Celular que cancelou (ou trocou de aparelho) é **desligado sozinho**
    (nada é apagado).
  - Celular usado por 2 contas: só a conta mais recente nele recebe.
  - O log mostra **só contagens** (quantas foram, quantas falharam), nunca
    o endereço do celular nem valores.

### O que aparece em cada situação

Título sempre **"TaCerto!"**. O texto muda conforme o velocímetro:

| Velocímetro | Texto |
|---|---|
| Sem valores no ano | Seu velocímetro está sem valores. Leva poucos minutos para atualizar. |
| Até 50% | Você já usou 32% do limite do ano. Continua no seu ritmo. |
| 50% a 75% | Você já usou 60% do limite do ano. Vale começar a acompanhar de perto. |
| 75% a 90% | Você já usou 80% do limite do ano. Bora planejar os próximos meses. |
| 90% a 100% | Você já usou 94% do limite do ano. Muito próximo do teto. |
| 100% a 120% | Você já usou 108% do limite do ano. Passou do limite, mas dá pra ajustar. Abra o app para ver. |
| Mais de 120% | Você já usou 130% do limite do ano. Abra o app para ver os próximos passos. |

O limite é o mesmo do app: R$ 81 mil (MEI) ou R$ 251,6 mil (MEI
Caminhoneiro), proporcional aos meses no ano em que o MEI abriu.

---

## Passo a passo do Fernando (um passo por vez, nesta ordem)

### 1. Gerar as chaves do TaCerto (precisa do "pode")

**O que é:** um **par de chaves** que anda junto. A **pública** é como o
nome do remetente no envelope: pode aparecer no app. A **privada** é a
assinatura: só o servidor tem. A Apple e o Google só entregam a
notificação se a assinatura bater.

1. Você diz ao Claude Code: **"pode gerar as chaves da notificação"**.
2. O Claude Code gera no PC (com o Node, que já está instalado; nada novo
   é instalado) e guarda **3 arquivos na pasta `backups/`** (fica fora do
   Git, nunca vai para o GitHub):
   - `..._vapid_keys.json` — o par de chaves (para o Supabase, passo 3);
   - `..._vapid_publica.txt` — só a chave pública (para a Vercel, logo
     abaixo);
   - `..._aviso_semanal_segredo.txt` — a **senha do despertador** (para o
     passo 3 e o passo 5).
3. Ele mostra **só a chave pública** na conversa.

> ⚠️ A chave privada e a senha são como senhas de banco: **nunca** no
> WhatsApp, nunca em print, nunca no app, nunca na Vercel. Se vazar ou se
> perder: gerar outro par — e aí **todo mundo precisa ativar de novo**.

#### 1b. Colocar a chave PÚBLICA na Vercel

1. Entre em **vercel.com** e abra o projeto do TaCerto.
2. No alto, toque em **Settings** (Configurações).
3. No menu do lado, **Environment Variables**.
4. Preencha:
   - **Key:** `VITE_VAPID_PUBLIC_KEY`
   - **Value:** a chave pública (o Claude Code manda o texto)
   - **Environments:** marque **Production** e **Preview** (o piloto
     roda na prévia).
5. Toque em **Save**.
6. A chave só entra no app quando ele é montado de novo: vá em
   **Deployments**, no primeiro da lista da branch `piloto-simplificado`
   toque nos **três pontinhos (…)** → **Redeploy** → **Redeploy**. (É o
   mesmo código de antes; só passa a ter a chave.)

O Claude Code também coloca a mesma linha no `.env` do PC (para testar em
`localhost:8080`; pede antes de reiniciar o `npm run dev`).

### 2. Rodar o SQL — PARTE 1 (precisa do "pode")

1. O Claude Code mostra a PARTE 1 de `docs/SQL-PENDENTE-NOTIFICACOES.sql`,
   explica e espera o **"pode"**.
2. Antes, ele confere no banco (só lendo) a tabela `lancamentos` (o nome
   das colunas) e guarda a cópia de segurança em `backups/`.
3. Roda pelo conector do Supabase **ou** você cola no **SQL Editor** só a
   PARTE 1 (até a linha `FIM DA PARTE 1`) → print → **Run**.
4. Depois ele confere (consultas "CONFERÊNCIA DA PARTE 1"), olha os logs,
   roda os advisors de segurança e copia o que rodou para
   `src/supabase/migrations.sql` (regra do projeto).

Nada muda para quem usa o app: só aparece um lugar novo, vazio.

### 3. Guardar os 3 segredos no Supabase

1. No painel do Supabase, abra **Edge Functions** → **Secrets**.
2. **Add new secret**, um de cada vez:
   - **`VAPID_KEYS`** = o conteúdo inteiro do arquivo
     `backups/..._vapid_keys.json` (abra no Bloco de Notas, **Ctrl+A**,
     **Ctrl+C**, cole).
   - **`VAPID_CONTATO`** = um e-mail do TaCerto (a Apple e o Google usam
     se houver problema com os envios).
   - **`AVISO_SEMANAL_SEGREDO`** = o texto do arquivo
     `backups/..._aviso_semanal_segredo.txt`.
3. **Save**.

### 4. Publicar a função `aviso-semanal` (precisa do "pode")

O Claude Code mostra o código e espera o **"pode"**. Depois:
- pelo **conector do Supabase** (ele publica e confere), **ou**
- pelo painel: **Edge Functions** → **Deploy a new function** → **Via
  Editor** → nome **`aviso-semanal`** → colar o arquivo
  `supabase/functions/aviso-semanal/index.ts` → **Deploy**.

**Importante:** nesta função o **"Verify JWT" fica DESLIGADO** (na página
da função, em **Details**/**Settings**; pode aparecer como "Enforce JWT
verification"). Por quê: quem chama não é uma pessoa logada no app, é o
despertador do banco. A segurança vem da **senha do despertador**: sem ela
(ou com ela errada), a função responde "sem permissão" e não manda nada.

Conferência segura: o Claude Code chama a função **sem a senha** e ela
tem que responder **401 (sem permissão)**. Não manda nada para ninguém.

### 5. Rodar o SQL — PARTE 2, o despertador (precisa do "pode")

1. O Claude Code troca os 2 marcadores só na hora de rodar:
   `<URL_DO_PROJETO>` (o endereço do projeto no Supabase) e `<SEGREDO>` (a
   mesma senha do passo 3). Se esquecer de trocar, o SQL **para sozinho**
   e não grava nada.
2. **"Pode"** → roda → confere que o despertador `aviso-semanal` está
   ligado ("CONFERÊNCIA DA PARTE 2").
3. No `migrations.sql` ele registra **com os marcadores**, nunca com a
   senha de verdade.

A partir daí, toda **segunda às 9h** sai a notificação, sozinha.

### 6. Testar no iPhone

1. Abra o TaCerto no **Safari** (o endereço da prévia da Vercel).
2. Toque em **Compartilhar** (o quadrado com a setinha para cima) →
   **Adicionar à Tela de Início** → **Adicionar**.
3. Feche o Safari e abra o TaCerto **pelo ícone novo** na Tela de Início.
4. **Entre na conta** (o app instalado pede o login de novo; é normal).
5. **Perfil** → **Permissões e integrações** → ligar **Permitir
   notificações** → no aviso do iPhone, **Permitir**.
6. Avise o Claude Code. Ele manda um **envio de teste só para você** (o
   comando "ENVIO DE TESTE" do fim do arquivo SQL; pede o "pode"). O teste
   não conta como "a da semana": a de segunda chega normal.
7. Em alguns segundos chega: **TaCerto!** + a frase do seu velocímetro.
   Toque nela: tem que abrir o **Início**.
8. Na segunda seguinte, 9h, chega a da semana.

Se não chegar: **Ajustes do iPhone** → **Notificações** → **TaCerto** →
"Permitir Notificações" ligado.

---

## Como desligar

- **Uma pessoa:** no app, **Permitir notificações** → desligar. Ou no iPhone:
  **Ajustes** → **Notificações** → **TaCerto** → desligar.
- **Todo mundo, por um tempo (volta fácil):** o comando **"PAUSAR"** do fim
  do arquivo SQL (precisa do "pode"). Para voltar: **"LIGAR de novo"**.
- **Emergência, sem SQL:** no Supabase, **Edge Functions** → **Secrets** →
  trocar o valor do **`AVISO_SEMANAL_SEGREDO`**. A senha do despertador
  deixa de bater e a função não manda nada. (Para voltar, o Claude Code
  acerta a senha guardada no banco.)
- **De vez:** tirar o despertador, a função e a tabela — só com o seu
  **"pode apagar"**.

---

## Quanto custa

**Nada.**
- A **Apple** e o **Google** entregam as notificações de graça.
- O **despertador (pg_cron)** e o **carteiro (pg_net)** já vêm no Supabase,
  sem custo extra.
- A função roda **1 vez por semana** (umas 5 por mês); o plano grátis do
  Supabase dá 500 mil por mês.
- Na Vercel, nada muda.

---

## Riscos (o que pode dar errado)

- **No iPhone, pouca gente instala.** Só funciona com o TaCerto na Tela de
  Início e iOS 16.4+. Muita gente não faz esse passo; o WhatsApp continua
  sendo o canal principal do piloto.
- **O app instalado pede login de novo.** Para o iPhone, o ícone na Tela
  de Início é separado do Safari. Quem entra pelo WhatsApp precisa receber
  o código outra vez.
- **A Apple cancela a inscrição se a notificação não aparecer.** Por isso
  o app tem que mostrar sempre tudo o que chega (está na parte técnica,
  abaixo). Se a Apple cancelar, a função percebe e desliga aquele celular
  sozinha; a pessoa precisa ativar de novo.
- **Celular desligado o dia todo** perde a da semana (a notificação vale 1
  dia) e recebe só na outra segunda.
- **A conta é a mesma do velocímetro**, com o que está guardado no banco.
  Se a pessoa lançou algo sem internet e o app ainda não mandou para o
  banco, a notificação pode vir com um percentual um pouco menor.

---

## Para o Claude Code (parte técnica)

- **Tabela** `public.inscricoes_push`: `id`, `user_id`, `endpoint`,
  `p256dh`, `auth`, `ativa`, `criado_em`, `atualizado_em`,
  `ultimo_envio_em`; `unique (user_id, endpoint)`. O app grava com
  `upsert` `onConflict: "user_id,endpoint"` (`user_id`, `endpoint`,
  `p256dh`, `auth`, `ativa`, `atualizado_em`) e desliga com
  `update ativa = false`. O app NÃO tem DELETE (nem GRANT, nem política).
- **O que chega no service worker** (`public/sw.js`; texto JSON da
  mensagem): `{ "title", "body", "url": "/dashboard", "tag": "aviso-semanal" }`.
  O `sw.js` lê `title`/`body`/`url` (ou `titulo`/`texto`) e usa a própria
  tag. Ele precisa **sempre** chamar `showNotification` (senão a Apple
  cancela a inscrição) e, no `notificationclick`, abrir/focar `url`.
- **Chave pública no app:** `VITE_VAPID_PUBLIC_KEY` (base64url do ponto
  "raw" de 65 bytes; é o `applicationServerKey` do `pushManager.subscribe`).
- **Função `aviso-semanal`:** `verify_jwt = false` ao publicar (pelo
  conector: `deploy_edge_function` com `verify_jwt: false`). Se for usar o
  `supabase/config.toml`, acrescentar:
  `[functions.aviso-semanal]` / `enabled = true` / `verify_jwt = false`.
  Cabeçalho `x-aviso-segredo` = `AVISO_SEMANAL_SEGREDO`. Corpo `{}` (envio
  da semana) ou `{ "teste_user_id": "<uuid>" }` (teste de uma pessoa, não
  grava `ultimo_envio_em`). Resposta `{ ok, enviados, desativados, erros }`.
  Biblioteca: `jsr:@negrel/webpush@0.5.0`.
- **Gerar as chaves no PC (passo 1)**, sem instalar nada: salvar como
  `backups/gerar-chaves-notificacao.mjs` e rodar
  `node backups/gerar-chaves-notificacao.mjs` na pasta do projeto (não
  escreve por cima de arquivo que já existe). O formato é o mesmo do
  `generate-vapid-keys` da biblioteca (`VAPID_KEYS` = par JWK).

```js
import { writeFileSync } from "node:fs";
import { webcrypto as crypto } from "node:crypto"; // assim funciona tambem no Node 18
const s = crypto.subtle;
const hoje = new Date().toISOString().slice(0, 10);
const par = await s.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
const chaves = {
  publicKey: await s.exportKey("jwk", par.publicKey),
  privateKey: await s.exportKey("jwk", par.privateKey),
};
const publica = Buffer.from(await s.exportKey("raw", par.publicKey)).toString("base64url");
const segredo = Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString("base64url");
const so = { flag: "wx" }; // nunca escreve por cima de um arquivo que ja existe
writeFileSync(`backups/${hoje}_vapid_keys.json`, JSON.stringify(chaves), so);
writeFileSync(`backups/${hoje}_vapid_publica.txt`, publica, so);
writeFileSync(`backups/${hoje}_aviso_semanal_segredo.txt`, segredo, so);
console.log("Pronto. Chave PUBLICA (vai para a Vercel):", publica);
```

- **Depois de rodar cada parte do SQL:** registrar em
  `src/supabase/migrations.sql` (PARTE nova, com a data; marcadores no
  lugar da URL e da senha), conferir, logs e advisors de segurança
  (rotina do CLAUDE.md).
