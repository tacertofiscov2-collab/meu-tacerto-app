# Leitura do comprovante por IA — passo a passo (12/10/2026)

> Bloco J da tarefa de 10-10. O "+" ganhou **"Foto ou PDF do comprovante"**:
> a pessoa tira a foto (ou escolhe o PDF), a IA lê **valor, data, quem
> pagou/recebeu e se é recebimento ou gasto**, e a tela mostra tudo para a
> pessoa **conferir e corrigir antes de salvar**. Nada entra no velocímetro
> sozinho.
>
> **Hoje (antes da chave):** a opção já aparece e funciona. Sem a chave (ou
> sem a função publicada), o app avisa *"Não consegui ler sozinho. Preencha
> você: o comprovante fica guardado junto."* e a pessoa digita. O arquivo
> fica guardado do mesmo jeito.

---

## O que já está pronto (no código)

- **Função do Supabase** `ler-comprovante`
  (`supabase/functions/ler-comprovante/index.ts`). **Ainda NÃO publicada.**
  - Só abre arquivo da pasta da própria pessoa (confere o login).
  - Manda para a IA (Claude, da Anthropic) a foto/PDF + o nome e o CNPJ da
    pessoa (para saber se ela recebeu ou pagou).
  - Devolve só o que leu. O conteúdo do arquivo **não vai para o log** (só
    o consumo, para acompanhar o custo).
  - Se a IA recusar, outro modelo tenta sozinho (recurso "fallback" da
    Anthropic, ligado).
- **No app:** `src/pages/Lancar.jsx` (o "+"), `src/lib/comprovantes.js`.
  Chave `MOSTRAR_COMPROVANTE_FOTO` em `src/config/piloto.js`.
- **Não contar duas vezes:** antes de somar, o app procura no velocímetro um
  recebimento parecido (mesmo valor ±1%, até 15 dias). Achou: pergunta *"É
  o mesmo?"* e só liga o comprovante a ele.
- **Parece um gasto** (a pessoa pagou): botão **"Lançar como gasto"** → vai
  para o Meu lucro, já marcado "com nota".

---

## Passo a passo do Fernando (um passo por vez)

### 1. Criar a chave da IA (Anthropic)

1. Entre em **https://platform.claude.com** (console da Anthropic) e crie a
   conta da empresa (pode ser com o e-mail do TaCerto).
2. Em **Billing** (cobrança), coloque um crédito pequeno para começar (ex.:
   **US$ 10**). Dá para ligar um limite de gasto por mês no mesmo lugar.
3. Em **API Keys**, toque em **Create Key**, dê o nome
   `tacerto-comprovante` e **copie a chave** (ela só aparece uma vez).

> ⚠️ A chave é como uma senha: **nunca** mande no WhatsApp, não cole no app
> e não mande print. Se vazar, apague no console e crie outra.

### 2. Guardar a chave no Supabase (segredo)

1. No painel do Supabase, abra **Edge Functions** → **Secrets**.
2. **Add new secret**: nome **`ANTHROPIC_API_KEY`**, valor = a chave
   copiada → **Save**.
3. (Opcional) Para gastar menos, outro segredo: nome
   **`MODELO_COMPROVANTE`**, valor **`claude-haiku-5-5`** (ver custo
   abaixo). Sem ele, a função usa o `claude-opus-5-5` (o mais preciso).

### 3. Publicar a função (só com o seu "pode")

O Claude Code mostra o código e espera o **"pode"**. Depois:
- pelo **conector do Supabase** (o Claude Code publica e confere), **ou**
- pelo painel: **Edge Functions** → **Deploy a new function** → nome
  **`ler-comprovante`** → colar o arquivo
  `supabase/functions/ler-comprovante/index.ts` → **Deploy**. Deixe ligado
  o "Verify JWT" (o padrão): só quem está logado no app pode chamar.

### 4. Testar no iPhone

1. No app, toque no **"+"** → **Foto ou PDF do comprovante** → tire a foto
   de um comprovante de Pix.
2. Em poucos segundos o valor, a data e o nome aparecem preenchidos, com
   *"Li do comprovante: confira e corrija se precisar."*
3. Os **Logs** da função (Edge Functions → ler-comprovante → Logs) mostram
   só o consumo de cada leitura, nunca o comprovante.

---

## Quanto custa cada leitura (estimativa)

Preço da API (outubro/2026, por milhão de "tokens", que são pedacinhos de
texto/imagem):

| Modelo | Entrada | Saída |
|---|---|---|
| `claude-opus-5-5` (padrão, mais preciso) | US$ 4 | US$ 20 |
| `claude-haiku-5-5` (mais barato) | US$ 0,10 | US$ 0,50 |

Uma leitura gasta mais ou menos:
- **Entrada:** foto reduzida pelo app (até 1600 px) ≈ 1.600 tokens + as
  instruções ≈ 400 → **≈ 2.000 tokens**. PDF de 1 página: ≈ 1.500 a 3.000.
- **Saída:** a resposta curta (com o "pensar" no nível baixo) → **≈ 300 a
  800 tokens**.

| | Por leitura | Piloto (30 pessoas × 20 leituras/mês = 600) |
|---|---|---|
| **Opus 5.5** (padrão) | ≈ **US$ 0,02** (≈ R$ 0,11) | ≈ **US$ 12/mês** (≈ R$ 66) |
| **Haiku 5.5** | ≈ **US$ 0,0005** (≈ R$ 0,003) | ≈ **US$ 0,30/mês** (≈ R$ 1,65) |

(Dólar a R$ 5,50 — conferir. A leitura de verdade aparece no console da
Anthropic, em **Usage**.)

**A escolha do modelo é sua.** O Opus é o mais preciso para comprovante
torto, amassado ou com letra pequena; o Haiku custa ~40 vezes menos e, para
comprovante de Pix (que é bem padronizado), costuma ler bem. Dá para começar
com um e trocar só mudando o segredo `MODELO_COMPROVANTE` (sem mexer no
código). O Haiku não tem o "fallback" (se recusar, a pessoa digita).

---

## Privacidade (já vai nos Termos e na Privacidade — Bloco M)

- A foto/PDF fica no balde privado `comprovantes`, na pasta da pessoa.
- Para ler, o arquivo vai para a Anthropic (empresa da IA) pela API. Pelos
  termos comerciais da Anthropic, o que vai pela API não é usado para
  treinar a IA (conferir os termos atuais no contrato).
- A IA só sugere: quem confirma é a pessoa, sempre.
