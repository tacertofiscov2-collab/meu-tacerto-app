# TaCerto! — Decisões do piloto

> Piloto com 30 MEI Caminhoneiros (agregados de um empresário parceiro),
> por 6 semanas. Canal principal: o WhatsApp do Fisco. Na validação, as
> ajudas pelo WhatsApp (boleto do DAS, nota fiscal, dúvidas) são feitas
> **à mão pelo Fernando**.
>
> Branch: `piloto-simplificado`. Atualizado em 05/10/2026 (fim do dia).
> Resumo de passagem da sessão: **`docs/HANDOFF.md`**.

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
  Phone, números de teste, hook, segredo, limite de envios). Conferido ao
  vivo em 05/10: o Phone continua **desligado** e a função
  `enviar-otp-whatsapp` **não foi publicada**.
- **Modo teste (`MODO_TESTE_LOGIN = true`):** funciona SEM o painel.
  Qualquer número de **37 00000-0001 a 37 00000-9999**, com **qualquer
  código de 6 números**, entra numa conta de teste de e-mail ligada ao
  número (`contaDoNumeroTeste` / `ehTelefoneTeste` em `piloto.js`; e-mail
  `tacerto.teste.55...@gmail.com`). Cada número novo = conta nova (para
  passar pelo onboarding quantas vezes quiser). Testado de verdade em
  05/10 (contas criadas e login de novo OK). O rodapé da tela de entrada
  avisa o modo teste.
- **Gesto de voltar do iPhone no Onboarding:** volta uma etapa; na
  primeira etapa não sai da tela (antes levava ao Início com o cadastro
  pela metade).

---

## 1B. Nome do assistente: **Fisco** (06/10 — antes Fisco.ia)

- **06/10 (pedido do Fernando): "Fisco.ia" saiu de tudo e virou "Fisco".**
  O nome "Fisco.ia" ficou **só na Apresentação do Fisco.ia** (o tutorial
  e a notificação dele). O suporte humano (Perfil > Ajuda) **não** é o
  Fisco: é "o suporte do TaCerto".
- (Como era em 05/10:) Em **todo texto que aparece dentro do app** (slides, Início, botões,
  painel do DAS, Como emitir nota, Como pagar o DAS, Perfil, Termos,
  Privacidade, textos de imagem): **"Fisco.ia"** (F maiúsculo, ".ia"
  minúsculo, sem espaço). Telas escondidas também já foram trocadas.
- **Exceção — o que aparece DENTRO do WhatsApp continua "Fisco":** as
  mensagens prontas de `MENSAGENS_WHATSAPP` ("Oi Fisco! ...") e a mensagem
  do código de login ("Seu código do TaCerto é...").
- Nomes de arquivos, componentes e funções **não** mudaram (`Fisco.jsx`,
  `ChatFiscoUI`, `abrirWhatsAppFisco`...).

---

## 1C. Padrão visual (05/10; 06/10 em negrito)

- **06/10 — MENOS COR, MAIS MINIMALISMO:** fundo preto em tudo (sem
  barras e janelas cinza); opção ESCOLHIDA sem verde e sem fundo, só
  "mais acesa" (borda e texto mais claros); **verde só no botão de
  continuar/confirmar** (contorno). Vale para o onboarding, a entrada
  pelo WhatsApp, o calendário, o seletor de mês, as janelas de
  confirmar, o Tipo de MEI e os alternadores (Preto|Branco,
  Recebimento|Total do ano). Os slides de boas-vindas ficaram como
  estavam (pedido).
- **06/10 — SETINHA DE VOLTAR MAIOR em todas as telas:** bolinha 46
  com seta 24; sem bolinha (entrada, onboarding) seta 26.
- **06/10 — campos com 16px também no onboarding** (nome e WhatsApp
  estavam com 14 e o iPhone dava zoom).

- **Lista simples estilo Pierre Finance** (`src/components/ListaSimples.jsx`:
  `SecaoLista`, `LinhaLista`, `numeroDoPasso`): Perfil, Editar perfil e as
  páginas internas (Como emitir nota, Como pagar o DAS, Lançar,
  Histórico, Passou do limite, Excluir conta, Termos, Privacidade). Sem
  cartões; títulos de seção em cinza maiúsculo; letras maiores (rótulo
  16,5). O **Início mantém** o tamanho de letra dele.
- **Destaque verde discreto:** só a borda verde fina, sem fundo verde e
  sem selo, sem mudar o tamanho do card.
- **Botões de confirmar/salvar em contorno verde** (classe
  `botao-confirmar` no `index.css`); apagar/sair em contorno vermelho
  (`botao-perigo`). O "+" da barra e o "Criar conta" dos slides ficaram
  como estavam. As telas escondidas ainda têm o verde cheio.
- **Tema Preto | Branco** no Perfil (sem "automático"). Telas antes de
  entrar (slides, login, onboarding) são sempre pretas.
- **06/10 — Início:** velocímetro MAIOR (arco até 250, número 48,
  valores 19, rótulos 14, bolinhas maiores; o "MEI · anual" ficou do
  mesmo tamanho), encolhendo sozinho em tela baixa; a barra DAS | Fisco |
  NF fica CENTRADA entre as bolinhas e o rodapé (respiros iguais).
- **Início: visual F** (escolhido em 05/10, depois de C, D, E e da
  "tela B" invertida): os 3 atalhos numa barra só, em contorno, com
  risca fina entre eles, com rótulos curtos **DAS**, **Fisco** (símbolo
  do WhatsApp só em contorno verde, `IconeWhatsApp.jsx`) e **NF**. O
  velocímetro fica mais alto: um respiro proporcional à tela entre as
  bolinhas e a barra (`RESPIRO_ACIMA_DA_BARRA`). Na barra de baixo, o
  **"+" sem círculo** (só o + verde, 56px, no centro da tela) e a
  **casinha cinza**, sem o verde de "página atual" (era o "contorno
  verde" que o Fernando via). Seletor desligado; as variações (inclusive
  a `g`, "tela B") continuam no código; ver seção 3.
- **Notificações** (`MOSTRAR_NOTIFICACOES`): sininho discreto no canto
  de cima do Início (só o ícone cinza; pontinho verde = nova). Abre a
  folha "Notificações". A primeira, desde o primeiro login, é a
  **"Apresentação do Fisco.ia"**: tutorial em 8 slides com um celular de
  exemplo do Início (sem nome, "R$ •••") e um círculo verde passando por
  cada função (velocímetro, +, DAS, Fisco, NF, Perfil, sininho); o
  Fisco.ia explica embaixo. Só abre se a pessoa tocar; dá para rever.
  A segunda é **"Atualize seu velocímetro"** ("Leva menos de 1 minuto"):
  abre uma folha com 2 jeitos fáceis — **digitar o total do ano** (abre
  o "+" no modo "Total do ano") ou **mandar pro Fisco.ia** valores ou a
  foto do extrato no WhatsApp (mensagem `atualizarVelocimetro`).
  "Lida" fica guardado no aparelho, por conta.
- **"+" (Lançar) com "Recebimento | Total do ano"**: no total do ano a
  pessoa digita só o faturamento do ano e o velocímetro fica igual a
  ele. Vira UM lançamento "Ajuste do total do ano" (= total menos a soma
  dos recebimentos), substituído a cada atualização (o "Faturamento
  estimado até hoje" do onboarding entra nessa conta). Total menor que
  os recebimentos já lançados não deixa salvar e avisa.
- **Explicação da média limite** (o "?" do 2º velocímetro): só o texto e
  o "Entendi" (sem "Falar com o Fisco.ia" e sem "X"). Aparece **uma vez
  só**: ao fechar, o "?" some para sempre naquela conta, naquele
  aparelho (guardado no aparelho, não no banco).
- **06/10 — Perfil:** "Excluir conta" logo **abaixo do Tema** (longe do
  "Sair da conta"). AJUDA: **"Falar com o suporte"** (chat dentro do
  app, `/suporte`) no lugar do "Falar com o Fisco no WhatsApp"; Como
  emitir nota; Como pagar o DAS; **"Declaração anual"**.
- **06/10 — Suporte (`/suporte`, `MOSTRAR_SUPORTE`):** atendimento
  HUMANO. Chat com perguntas prontas por assunto (Velocímetro, DAS, Nota,
  Declaração anual, Minha conta, Outro) para afunilar; resposta curta e
  "Isso resolveu?"; se não, a pessoa escreve e toca em "Abrir o WhatsApp
  do suporte" — a mensagem vai com assunto, pergunta e o texto dela
  (`MENSAGENS_WHATSAPP.suporte`).
- **06/10 — Declaração anual (`/declaracao-anual`,
  `MOSTRAR_DECLARACAO_ANUAL`):** prazo (31/05), "Calcular meu Imposto de
  Renda" (`/declaracao-anual/calcular`: atividade, faturamento, gastos,
  outras rendas, funcionário → parte isenta, se precisa declarar, o que
  vai na DASN), "Como o TaCerto ajuda hoje", explicação sem
  juridiquês, faturamento do ano e o passo a passo da DASN-SIMEI.
  Regras e números em `src/lib/declaracao.js`. Até onde dá para
  automatizar: **`docs/AUTOMACAO-PILOTO.md`**.
- **06/10 — Como emitir nota:** sem o "Em breve" no Certificado A1;
  explicação nova (identidade digital oficial ICP-Brasil, agendado com a
  certificadora parceira credenciada, videochamada, a partir de R$ 99,90,
  segurança) e "Quero agendar meu certificado". Como emitir nota e Como
  pagar o DAS ganharam "Como o TaCerto ajuda hoje".
- **Perfil:** "Falta" virou **"Limite restante"**; linha nova
  **"Histórico de lançamentos"** no Meu MEI (abre o `/historico`, que
  tem o título "Histórico de entradas"). Os itens do **Editar perfil
  vieram para o Perfil**, tocáveis: Nome (digita na linha; "Salvar nome"
  aparece embaixo), WhatsApp (aviso "fale com a gente"), Tipo de MEI
  (folha "O que mudou?"), Abertura (calendário, só quem abriu este ano).
  "Excluir conta" no fim, tamanho normal. Sem a linha "Editar perfil"
  (a tela `/editar-perfil` continua existindo, sem link).
- **Campos de digitar com 16px** (abaixo disso o iPhone dá zoom).

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
- ~~Nota fiscal emitida automaticamente~~ — **mudou em 05/10:** a pedido
  do Fernando, o slide da nota diz que o Fisco.ia emite a nota por áudio,
  por mensagem ou de forma automática (no piloto, quem faz é a equipe,
  pelo WhatsApp). A página `/como-emitir-nota` ainda mostra o Certificado
  A1 como "Em breve".
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
| `MOSTRAR_WHATSAPP_DOCUMENTOS` | Seção "Fale com a gente" (botão do WhatsApp) nos Termos e na Privacidade | `false` |

**Chaves de TESTE (ligadas agora, desligar antes do piloto real):**

| Chave | O que faz | Valor |
|---|---|---|
| `MODO_TESTE_LOGIN` | Números 37 00000-0001 a 9999 + qualquer código entram sem o painel; aviso no rodapé do login | `true` |
| `MOSTRAR_SELETOR_VISUAL_INICIO` | Seletor de teste do Início | `false` (ficou a A = F, 05/10) |
| `VISUAL_INICIO_PADRAO` | Visual do Início (com o seletor desligado, é sempre este) | `"f"` |

**Chaves dentro das próprias telas:** `MOSTRAR_NOME_NO_TOPO = false` e
`MOSTRAR_BARRA_NO_PERFIL = false` (`Perfil.jsx`: sem o nome grande e sem a
barra de baixo); `MOSTRAR_EMAIL_NO_EDITAR = false` (`EditarPerfil.jsx`).

**Ligadas no piloto:** `MOSTRAR_SUPORTE` (chat de suporte),
`MOSTRAR_DECLARACAO_ANUAL` (página + calculadora do IR),
`MOSTRAR_NOTIFICACOES` (sininho + Apresentação
do Fisco.ia), `MOSTRAR_CARD_DAS` (card "Próximo DAS" + painel
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

- [x] ~~Início: A ou B~~: ficou a **A (F)** (05/10).
- [x] ~~"Contorno verde na casinha"~~: era o verde de "página atual";
      a casinha agora fica cinza (05/10).
- [ ] **Conferir com o contador** os textos novos do Imposto de Renda
      (Declaração anual, calculadora e respostas do Suporte) e atualizar
      `LIMITE_DECLARAR_IR` (`src/lib/declaracao.js`) quando sair o de 2027.
- [ ] Conferir no site real os passos da **DASN-SIMEI** (escritos de memória).
- [x] ~~Número do WhatsApp do suporte~~: é o mesmo do Fisco,
      **(37) 99199-9373** (06/10). A mensagem pronta do suporte começa com
      "Oi Fisco! Preciso de suporte no app TaCerto...".
- [ ] **Notificação "Atualize seu velocímetro" voltar todo mês?** Hoje
      ela some depois de aberta uma vez (decidir com o Fernando).
- [ ] **Slide 1 das boas-vindas** ainda mostra o Início antigo (cartão de
      vidro e a barra "Fisco.ia no WhatsApp"). Atualizar para o visual F
      com cuidado: os slides usam UMA escala comum (`useEscalaComum`).
- [ ] `/regra-vinte` aberto direto pelo endereço, sem ter passado do
      limite, diz "Passei do limite" com "Passei R$ 0,00". No app ela só
      abre pelo velocímetro acima de 100%, então ninguém chega lá assim.
- [ ] **Ligar o login pelo WhatsApp no painel do Supabase:** seguir
      `docs/LOGIN-WHATSAPP-PASSO-A-PASSO.md`. Antes: publicar a função
      `enviar-otp-whatsapp` (ainda não publicada).
- [ ] **Alinhar "Como emitir nota" com o slide da nota:** o slide promete
      nota por áudio/mensagem/automática; a página ainda mostra o
      Certificado A1 como "Em breve".
- [ ] ⚠️ **Antes de entrar gente real: desligar o modo teste.** Trocar
      `MODO_TESTE_LOGIN` para `false` (`src/config/piloto.js`) e apagar os
      5 números de teste (37 00000-0001 a 0005) no painel do Supabase, se
      tiverem sido cadastrados lá. Com a chave desligada, a faixa de teste
      (37 00000-0001 a 9999, qualquer código) para de funcionar. As
      contas `tacerto.teste.55...@gmail.com` podem ser apagadas depois.
- [ ] **Conferir o gatilho `handle_new_user`** com conta de telefone (só
      leitura; o comando está no passo a passo). Não foi alterado.
- [ ] **Reativar a Z-API** (pausada): sem ela, números reais não recebem o
      código. Os números de teste funcionam.
- [x] ~~Número real do WhatsApp do Fisco~~: `WHATSAPP_FISCO =
      "5537991999373"` em `src/config/piloto.js` (06/10).
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
