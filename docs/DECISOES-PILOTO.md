# TaCerto! — Decisões do piloto

> Piloto com 30 MEI Caminhoneiros (agregados de um empresário parceiro),
> por 6 semanas. Canal principal: o WhatsApp do Fisco. Na validação, as
> ajudas pelo WhatsApp (boleto do DAS, nota fiscal, dúvidas) são feitas
> **à mão pelo Fernando**.
>
> Branch: `piloto-simplificado`. Atualizado em 05/10/2026.

---

## 1. Login só pelo WhatsApp — FEITO no app em 05/10 (falta ligar no painel)

- A pessoa digita o número, recebe um **código de 6 números no WhatsApp**
  e entra. Sem e-mail, senha ou Google na tela. Tela `EntrarWhatsApp`, em
  `/login` e `/cadastro` (os dois botões dos slides levam para ela).
- Por baixo: **login por telefone do Supabase** (phone OTP). O código vai
  pelo **Send SMS Hook** → Edge Function **`enviar-otp-whatsapp`** →
  **Z-API**. Os dados continuam presos ao **ID do usuário**.
- Conta nova → Onboarding (o nome já vem preenchido se existir) → Início.
  Conta antiga → direto para o Início. O número é gravado em
  `perfis.whatsapp`.
- **Plano B:** o login por e-mail e senha está **escondido por chave**
  (`MOSTRAR_LOGIN_EMAIL = false`) e continua no endereço **`/entrar-email`**,
  sem link em lugar nenhum. É por ele que o Fernando entra nos testes e se
  a Z-API cair. O provider Email do Supabase **não** foi desligado.
- **Sessão longa:** o cliente do Supabase já guarda a sessão e a renova
  sozinho (`persistSession` e `autoRefreshToken` ligados).
- **Troca de número:** o número é o login, então não se troca no app. O
  Editar perfil mostra o aviso "Para trocar, fale com a gente" e abre o
  WhatsApp (mensagem `trocarNumero`). A troca é feita à mão no Supabase.
- ⚠️ **Conta de e-mail ≠ conta de telefone.** Quem entrar com o número
  ganha uma conta nova, vazia.
- **Falta ligar no painel do Supabase:** passo a passo clique por clique em
  **`docs/LOGIN-WHATSAPP-PASSO-A-PASSO.md`** (publicar a função, ligar o
  Phone, números de teste, hook, segredo, limite de envios).

---

## 1B. Nome do assistente: **Fisco.ia** (05/10)

- Em **todo texto que aparece dentro do app** (slides, Início, botões,
  painel do DAS, Como emitir nota, Como pagar o DAS, Perfil, Termos,
  Privacidade, textos de imagem): **"Fisco.ia"** (F maiúsculo, ".ia"
  minúsculo, sem espaço). Telas escondidas também já foram trocadas.
- **Exceção — o que aparece DENTRO do WhatsApp continua "Fisco":** as
  mensagens prontas de `MENSAGENS_WHATSAPP` ("Oi Fisco! ...") e a mensagem
  do código de login ("Seu código do TaCerto é...").
- Nomes de arquivos, componentes e funções **não** mudaram (`Fisco.jsx`,
  `ChatFiscoUI`, `abrirWhatsAppFisco`...).

---

## 2. Escopo do piloto

**O app PODE prometer:**

- Velocímetro que mostra quanto já faturou e quanto falta para o limite do
  ano (MEI Caminhoneiro: R$ 251.600; MEI: R$ 81.000).
- Aviso do DAS todo mês, inclusive o boleto no WhatsApp.
- Ajuda do Fisco.ia pelo WhatsApp para emitir nota e pagar o DAS.
- É grátis durante o piloto.

**O app NÃO PODE prometer:**

- Conexão automática com o banco (Open Finance).
- Nota fiscal emitida automaticamente (o Certificado A1 aparece só como
  "Em breve", para medir interesse).
- Chat com IA dentro do app (o Fisco atende pelo WhatsApp).

Os textos dos slides de boas-vindas seguem esta lista. Antes de a pessoa
escolher o tipo de MEI, a linguagem é neutra (serve para MEI e MEI
Caminhoneiro).

---

## 3. O que foi escondido por chave (nada foi apagado)

Todas as chaves ficam em **`src/config/piloto.js`**. Para religar: trocar
`false` por `true`. Endereço escondido aberto direto pela URL volta para o
Início (`/dashboard`).

| Chave | O que esconde | Valor |
|---|---|---|
| `MOSTRAR_OPEN_FINANCE` | Botão do banco no Início, telas `/conectar-banco` (3), slide do banco | `false` |
| `MOSTRAR_CHAT_FISCO` | Chat do Fisco no app (`/fisco`), "Pergunte ao Fisco", painel "Tirar dúvidas", balão "?" do velocímetro do ano | `false` |
| `MOSTRAR_NOTAS_FISCAIS` | `/notas-fiscais` e o item do Perfil | `false` |
| `MOSTRAR_SAIDAS` | `/saidas` e o item do Perfil | `false` |
| `MOSTRAR_HISTORICO_DAS` | `/das` (grade dos 12 meses) e o item do Perfil | `false` |
| `MOSTRAR_ADICIONAR_MOVIMENTACOES` | `/adicionar-faturamento` (4 telas) e o item do Perfil | `false` |
| `MOSTRAR_RESUMO_ANO` | `/perfil/resumo` e o item do Perfil | `false` |
| `MOSTRAR_PREFERENCIAS` | `/preferencias` (tinha chaves que não faziam nada) | `false` |
| `MOSTRAR_SOBRE` | `/sobre` (texto antigo, prometia o que o app não tem) | `false` |
| `MOSTRAR_INACABADOS` | `/faq`, `/alertas`, `/velocimetro`, `/dev/simulador`, `/perfil/informacoes-fiscais`, `/cadastro-obrigatorio`, tela "Em construção", cartão "Comece com o velocímetro certo" do Histórico, aviso "Excluir todos os lançamentos" da Excluir conta | `false` |
| `MOSTRAR_AVATAR` | Bola com a foto/inicial no Perfil e no Editar perfil | `false` |
| `MOSTRAR_LOGIN_EMAIL` | Login e cadastro por e-mail e senha (`/login` e `/cadastro` abrem o WhatsApp), `/esqueci-senha`, `/alterar-senha`, `/alterar-whatsapp`, "Alterar senha" do Perfil e o layout antigo do Editar perfil. Plano B: `/entrar-email` | `false` |
| `MOSTRAR_LOGIN_GOOGLE` | Botão "Continuar com Google" | `false` |

**Ligadas no piloto:** `MOSTRAR_CARD_DAS` (card "Próximo DAS" + painel
"Emitir boleto" + slide do DAS), `MOSTRAR_TUTORIAL_DAS` (`/como-pagar-das`),
`MOSTRAR_TUTORIAL_NOTA` (`/como-emitir-nota` + slide da nota).

**Fora do `piloto.js`:**

- `PLUGGY_ATIVO = false` em `src/lib/openfinance.js` (estava `true`). Ao
  religar o Open Finance, trocar as duas chaves juntas.
- Slide "O Fisco organiza pra você" (conferência "É faturamento?"):
  `mostrar: false` na lista `SLIDES` de `src/pages/Welcome.jsx`.
- Várias contas no mesmo aparelho: já estava escondido antes do piloto
  (`temMultiplas = false` em `src/pages/Perfil.jsx`).

**Mensagens prontas do WhatsApp:** todas em `MENSAGENS_WHATSAPP`
(`src/config/piloto.js`), uma por botão, para medir o interesse em cada
ajuda.

---

## 4. Pendências antes do piloto

- [ ] **Ligar o login pelo WhatsApp no painel do Supabase:** seguir
      `docs/LOGIN-WHATSAPP-PASSO-A-PASSO.md`.
- [ ] **Conferir o gatilho `handle_new_user`** com conta de telefone (só
      leitura; o comando está no passo a passo). Não foi alterado.
- [ ] **Reativar a Z-API** (pausada): sem ela, números reais não recebem o
      código. Os números de teste funcionam.
- [ ] **Número real do WhatsApp do Fisco:** trocar `WHATSAPP_FISCO` em
      `src/config/piloto.js` (hoje é o provisório `5537999999999`).
- [x] ~~Decidir o `MODO_PREVIA`~~ (`WHATSAPP_ATIVO` em `src/lib/flags.js`):
      ele só valia para a verificação antiga do Cadastro por e-mail, que
      agora está escondida. O login novo não usa essa chave.
- [ ] **Apagar os lançamentos de teste** da conta que for usada no piloto
      (e as entradas de teste "teste-", se houver).
- [ ] **Mensagem automática das 21h** (Z-API + agendamento no Supabase):
      tarefa separada.
- [ ] **Trocar a chave anon do Supabase.** ⚠️ O HANDOFF avisa que a chave
      anon atual (legada) não é mais "rotacionável": o caminho é migrar para
      a chave nova (`sb_publishable_...`) e trocar no `.env` e na Vercel.
      Não clicar em "Rotate" na `VITE_SUPABASE_KEY`.
- [ ] **CNPJ no perfil:** o perfil não guarda CNPJ (não existe a coluna).
      Por isso as mensagens do DAS terminam em "Meu CNPJ: " para a pessoa
      completar. Guardar o CNPJ exige mudar o banco (tarefa separada).
- [ ] Conferir no site real os nomes dos botões do **PGMEI** e do
      **Emissor Nacional** usados nos passo a passo (escritos de memória).
- [ ] Conferir com o contador: o aviso NFS-e x CT-e do agregado, e o texto
      do Certificado A1 (agora "a partir de R$ 99,90", vale 1 ano).
- [ ] Revisar com advogado os **Termos de uso** e a **Política de
      privacidade** (versão provisória; falta a razão social e o CNPJ do
      TaCerto!).
- [ ] **DAS de novembro:** 20/11 é feriado (Consciência Negra). O card
      mostra "20/11"; o app não calcula feriado.
- [ ] Religar o **"Require Log In"** da prévia na Vercel antes de mandar o
      link para fora.
