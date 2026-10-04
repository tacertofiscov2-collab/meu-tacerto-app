# TaCerto! — Decisões do piloto

> Piloto com 30 MEI Caminhoneiros (agregados de um empresário parceiro),
> por 6 semanas. Canal principal: o WhatsApp do Fisco. Na validação, as
> ajudas pelo WhatsApp (boleto do DAS, nota fiscal, dúvidas) são feitas
> **à mão pelo Fernando**.
>
> Branch: `piloto-simplificado`. Atualizado em 04/10/2026.

---

## 1. Login só pelo WhatsApp — decidido NÃO fazer agora

Fica para uma **tarefa separada**, depois que esta limpeza for testada no
iPhone.

**Plano para quando for feito:**

- Ligar o **login por telefone do Supabase** (phone OTP), usando o
  **Send SMS Hook** para mandar o código pela **Z-API no WhatsApp** (em vez
  de SMS).
- Os dados continuam presos ao **ID do usuário** (nada muda nas tabelas).
- Manter o **login por e-mail e senha ESCONDIDO por chave**, como plano B:
  se a Z-API cair, ninguém entra só com o WhatsApp.
- **Sessão longa**, para a pessoa quase nunca precisar entrar de novo.
- **Troca de número** durante o piloto: resolvida à mão no painel do
  Supabase.

---

## 2. Escopo do piloto

**O app PODE prometer:**

- Velocímetro que mostra quanto já faturou e quanto falta para o limite do
  ano (MEI Caminhoneiro: R$ 251.600; MEI: R$ 81.000).
- Aviso do DAS todo mês, inclusive o boleto no WhatsApp.
- Ajuda do Fisco pelo WhatsApp para emitir nota e pagar o DAS.
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

- [ ] **Número real do WhatsApp do Fisco:** trocar `WHATSAPP_FISCO` em
      `src/config/piloto.js` (hoje é o provisório `5537999999999`).
- [ ] **Decidir o `MODO_PREVIA`:** hoje ele se chama `WHATSAPP_ATIVO`, em
      `src/lib/flags.js`, e está `false` (= modo prévia ligado: o código do
      WhatsApp não é enviado e qualquer código de 6 números é aceito).
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
      do Certificado A1 (custo, validade, como tira).
- [ ] Revisar com advogado os **Termos de uso** e a **Política de
      privacidade** (versão provisória; falta a razão social e o CNPJ do
      TaCerto!).
- [ ] **DAS de novembro:** 20/11 é feriado (Consciência Negra). O card
      mostra "20/11"; o app não calcula feriado.
- [ ] Religar o **"Require Log In"** da prévia na Vercel antes de mandar o
      link para fora.
