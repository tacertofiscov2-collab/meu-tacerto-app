# TaCerto! — Resumo de passagem (sessão de 05/10/2026)

> Este arquivo é o **resumo desta sessão**, para começar um chat novo.
> A referência completa do projeto continua no **`HANDOFF.md` da raiz**
> (Partes 0, 1, 6 e 12) e no **`CLAUDE.md`**. As decisões do piloto
> ficam em **`docs/DECISOES-PILOTO.md`**; o passo a passo do login no
> painel, em **`docs/LOGIN-WHATSAPP-PASSO-A-PASSO.md`**.

---

## 0. Onde está o código

- Branch **`piloto-simplificado`**, enviado para o GitHub (a prévia da
  Vercel usa este branch). A **`main` não foi mexida**; a produção
  continua em `f1832bb`.
- Servidor local: `npm run dev` (ou pelo app Claude, configuração
  `tacerto-dev` em `.claude/launch.json`). PC: `localhost:8080`;
  iPhone: `192.168.1.224:8080`.
- Commits desta sessão (do mais antigo ao mais novo): `79fd601`,
  `60be7a7`, `e498411`, `ce6128a`, `1bf9774`, `48f5102`, `0d6a1cf`,
  `2d3551f`, `99243a5`, `582cbab`, `1cbf36d`, `417638c`, `b194db2`,
  `1ad76ff` e o deste resumo.

---

## 1. O app hoje, tela por tela

### Antes de entrar (sempre no tema preto)

| Tela | Endereço | Como está |
|---|---|---|
| **Boas-vindas** (slides) | `/` | 5 slides: 1 "Limite sob controle 24h", 2 "DAS no automático", 3 "Nota fiscal do seu jeito", 4 "Tudo isso, grátis", 5 "Tudo pelo WhatsApp". Letras 10% maiores (zoom igual em todos), celular de exemplo ocupa o espaço até o card de baixo, destaques verdes discretos, WhatsApp do slide 5 no tema claro. Botões "Criar conta" e "Entrar" levam para a entrada pelo WhatsApp. |
| **Entrar pelo WhatsApp** | `/login` e `/cadastro` | Tela `EntrarWhatsApp`: número com DDD (+55 fixo) → "Receber código" → 6 quadradinhos (confere sozinho). Erros amigáveis. Rodapé com o aviso do modo teste e os links dos Termos/Privacidade. |
| **Plano B: e-mail e senha** | `/entrar-email` | Login antigo, sem link em lugar nenhum. Só e-mail e senha (sem "esqueci", sem Google, sem cadastro). |
| **Onboarding** | `/onboarding` | Nome (vem preenchido se o perfil já tiver), tipo de MEI, abertura, faturamento estimado. O **gesto de voltar do iPhone volta uma etapa** e não sai da tela; a setinha da 1ª etapa vai para as boas-vindas; cadastro já feito → vai para o Início. Botão "Começar a usar" em contorno. |

### Dentro do app

| Tela | Endereço | Como está |
|---|---|---|
| **Início** | `/dashboard` | **Visual F** (escolhido em 05/10): velocímetro solto + os 3 atalhos (DAS 20/10, Fisco.ia, Emitir nota) numa barra só, em contorno. Barra de baixo lisa com o **"+" sem círculo** (só o + verde, 56px, no centro da tela e no meio da barra). **Sininho** discreto no canto de cima (Notificações → "Apresentação do Fisco.ia", tutorial em slides). Seletor desligado; Atual, A, B, C, D e E continuam no código. A explicação da média limite (o "?" do 2º velocímetro) tem só texto + "Entendi" e aparece **uma vez só**. Letras do Início **mantidas** no tamanho de antes. |
| **Painel do DAS** | (abre no Início) | "Como você quer pagar seu DAS?": boleto automático no WhatsApp, Fisco.ia me ajuda agora, fazer sozinho, site do governo. |
| **Lançar (+)** | `/lancar` | Rótulos em cinza maiúsculo, campos com 16px (sem zoom), "Último lançamento" em linha simples, "Salvar lançamento" em contorno. |
| **Histórico de entradas** | `/historico` | Busca, linha do mês, "Lançar entrada", total do mês, lista por mês com risca fina (editar/excluir em cada linha). |
| **Passou do limite** | `/regra-vinte` | Lista simples: aviso, como estou hoje, como a lei enxerga, o que fazer agora. Vermelho só no ícone e no valor que passou. |
| **Perfil** | `/perfil` | **Sem o nome grande e sem a barra de baixo.** Ordem: CONTA (Editar perfil, Tema Preto/Branco), MEU MEI (tipo, abertura, limite, já faturado, **limite restante**, **Histórico de lançamentos** → `/historico`), AJUDA (Fisco.ia no WhatsApp, Como emitir nota, Como pagar o DAS), SOBRE (Termos, Privacidade), Sair da conta, versão. Setinha volta ao Início. |
| **Editar perfil** | `/editar-perfil` | Nome editável, WhatsApp (toque = aviso "fale com a gente" + botão do WhatsApp), Tipo de MEI (folha "O que mudou?"), Data de abertura (só quem abriu este ano), "Excluir conta" em vermelho no fim. **Sem a linha do e-mail.** |
| **Excluir conta** | `/excluir-conta` | Confirmações em linhas, campo "EXCLUIR" com 16px, botões em contorno vermelho. |
| **Como emitir nota** | `/como-emitir-nota` | Aviso em linha; 3 formas em lista (Fisco.ia no WhatsApp, Fazer sozinho, Certificado A1 "Em breve" — custa a partir de R$ 99,90); os passos e o A1 abrem logo abaixo. |
| **Como pagar o DAS** | `/como-pagar-das` | Lembrete "vence todo dia 20", 7 passos numerados, linhas "Abrir o PGMEI" e "Prefiro que o Fisco.ia me ajude". |
| **Termos de uso / Privacidade** | `/termos-de-uso`, `/privacidade` | Letras maiores, risca fina entre seções. Sem a seção "Fale com a gente". |

### Escondido por chave (nada foi apagado)

Chaves em `src/config/piloto.js` (tabela completa em
`docs/DECISOES-PILOTO.md`, seção 3). Endereço escondido aberto direto
volta para o Início.

- Open Finance / banco (`MOSTRAR_OPEN_FINANCE`), chat do Fisco no app
  (`MOSTRAR_CHAT_FISCO`), notas fiscais (`MOSTRAR_NOTAS_FISCAIS`), saídas
  (`MOSTRAR_SAIDAS`), histórico de DAS (`MOSTRAR_HISTORICO_DAS`),
  adicionar movimentações (`MOSTRAR_ADICIONAR_MOVIMENTACOES`), resumo do
  ano (`MOSTRAR_RESUMO_ANO`), preferências (`MOSTRAR_PREFERENCIAS`),
  sobre (`MOSTRAR_SOBRE`), telas inacabadas (`MOSTRAR_INACABADOS`),
  avatar (`MOSTRAR_AVATAR`).
- Login por e-mail/senha, esqueci a senha, alterar senha, alterar
  WhatsApp, layout antigo do Editar perfil (`MOSTRAR_LOGIN_EMAIL`).
- Botão do Google (`MOSTRAR_LOGIN_GOOGLE`).
- "Fale com a gente" dos Termos e da Privacidade
  (`MOSTRAR_WHATSAPP_DOCUMENTOS`).
- Dentro das telas: `MOSTRAR_NOME_NO_TOPO` e `MOSTRAR_BARRA_NO_PERFIL`
  (Perfil), `MOSTRAR_EMAIL_NO_EDITAR` (Editar perfil).

---

## 2. Valor atual das chaves

**`src/config/piloto.js`**

| Chave | Valor |
|---|---|
| `MOSTRAR_OPEN_FINANCE` | `false` |
| `MOSTRAR_CHAT_FISCO` | `false` |
| `MOSTRAR_NOTAS_FISCAIS` | `false` |
| `MOSTRAR_SAIDAS` | `false` |
| `MOSTRAR_HISTORICO_DAS` | `false` |
| `MOSTRAR_ADICIONAR_MOVIMENTACOES` | `false` |
| `MOSTRAR_RESUMO_ANO` | `false` |
| `MOSTRAR_PREFERENCIAS` | `false` |
| `MOSTRAR_SOBRE` | `false` |
| `MOSTRAR_INACABADOS` | `false` |
| `MOSTRAR_AVATAR` | `false` |
| `MOSTRAR_LOGIN_EMAIL` | `false` |
| `MOSTRAR_LOGIN_GOOGLE` | `false` |
| **`MODO_TESTE_LOGIN`** | **`true`** ⚠️ desligar antes do piloto real |
| `TELEFONES_TESTE` | 5537000000001 a …0005 (a faixa de teste hoje é 0001–9999, ver `ehTelefoneTeste`) |
| `CODIGO_TESTE_LOGIN` | `"123456"` (usado na senha das contas de teste; qualquer código é aceito) |
| `MOSTRAR_CARD_DAS` | `true` |
| **`MOSTRAR_SELETOR_VISUAL_INICIO`** | **`true`** (seletor "A / B": A = F, B = `g`, F invertido) |
| `MOSTRAR_NOTIFICACOES` | `true` (sininho + Apresentação do Fisco.ia) |
| `VISUAL_INICIO_PADRAO` | `"f"` (escolhido em 05/10) |
| `MOSTRAR_TUTORIAL_DAS` | `true` |
| `MOSTRAR_TUTORIAL_NOTA` | `true` |
| `WHATSAPP_FISCO` | `"5537999999999"` ⚠️ provisório, trocar pelo real |
| `MOSTRAR_WHATSAPP_DOCUMENTOS` | `false` |

**Fora do `piloto.js`:** `PLUGGY_ATIVO = false` (`src/lib/openfinance.js`),
`WHATSAPP_ATIVO = false` e `EMAIL_VERIFICACAO_ATIVA = false`
(`src/lib/flags.js` — só valiam para o cadastro antigo por e-mail, hoje
escondido).

---

## 3. O que foi feito nesta sessão

**Login por WhatsApp**
- Edge Function `supabase/functions/enviar-otp-whatsapp` (Send SMS Hook →
  Z-API, confere a assinatura, não grava o código inteiro nos logs).
  **Não publicada.**
- Tela `EntrarWhatsApp` em `/login` e `/cadastro`; plano B `/entrar-email`;
  rotas de senha escondidas.
- Passo a passo do painel: `docs/LOGIN-WHATSAPP-PASSO-A-PASSO.md`.
- **Modo teste** (o Phone do Supabase está desligado): números 37
  00000-0001 a 9999 + qualquer código de 6 números entram por uma
  "ponte" (conta de e-mail de teste por número, criada sozinha). Testado
  de verdade (conta 0001 criada às 18:44 de 05/10 e entrou de novo).
- Onboarding: nome preenchido; gesto de voltar do iPhone corrigido.

**Fisco.ia**
- "Fisco" virou **"Fisco.ia"** em todo texto da tela (inclusive telas
  escondidas). Dentro do WhatsApp continua "Fisco" (mensagens prontas e
  mensagem do código).

**Perfil e Editar perfil**
- Lista simples estilo Pierre Finance (`ListaSimples.jsx`), letras maiores,
  sem cartões, chip, selo, bola ou nome grande; "Conta" primeiro; Tema
  Preto/Branco; sem barra de baixo no Perfil; "Excluir conta" foi para o
  fim do Editar perfil; aviso de troca de número (mensagem
  `trocarNumero`); e-mail escondido.

**Slides de boas-vindas**
- Textos novos com foco em facilidades; slide 2 "Boleto automático no
  WhatsApp" e "te lembra"; slide 3 nota por áudio, mensagem, automática ou
  sozinho; slide 4 itens "Limite anual acompanhado 24h", "Boleto do DAS no
  WhatsApp", "Emissão de nota fiscal", "Fisco.ia 24h para te ajudar"; slide
  5 WhatsApp claro com "Pronto! Já somei no seu velocímetro." e "Devo
  emitir a nota pro cliente?" (Sim/Não).
- Escala comum dos desenhos com zoom de 10%; slide 3 fica **fora** da
  conta da escala (para não encolher os outros); moldura ocupa o espaço
  até o card de baixo; destaques verdes discretos (`DESTAQUE_BORDA`).

**Padrão do app**
- Páginas internas no padrão do Perfil (lista, letras maiores): Como
  emitir nota, Como pagar o DAS, Lançar, Histórico, Passou do limite,
  Excluir conta, Termos, Privacidade.
- Botões de confirmar em contorno verde (`botao-confirmar`), apagar/sair
  em contorno vermelho (`botao-perigo`), seletores de mês/dia sem verde
  cheio.
- Campos com 16px no Lançar e no Excluir conta (o iPhone dava zoom).
- Como emitir nota: Certificado A1 "a partir de R$ 99,90".
- Termos e Privacidade sem "Fale com a gente".

**Início**
- Variações em teste (Atual / A / B / C), sem bordas de vidro nas novas;
  seletor no topo; barra de baixo com versões lisas (`BottomNav visual`).

---

## 4. Pendente ou pela metade

1. **Início: A ou B?** Visual F escolhido; agora o seletor compara
   "A" (F) com "B" (`g`: os 3 atalhos em cima, velocímetro embaixo).
   Depois: `VISUAL_INICIO_PADRAO` = escolhida e seletor desligado. Para
   mexer: `Dashboard.jsx` (`InicioBarra`, `visualBarra`) e
   `BottomNav.jsx`. **Círculo na casinha** (só no iPhone): não existe
   no código; suspeita do botão redondo do Safari — pedir print.
2. **Login por telefone de verdade**: publicar `enviar-otp-whatsapp` e
   fazer o painel (seção 5). Até lá, só o modo teste funciona.
3. **Desligar o modo teste** antes de gente real (`MODO_TESTE_LOGIN =
   false`) e apagar as contas `tacerto.teste.55...@gmail.com`.
4. **Como emitir nota x slide 3**: o slide promete nota por áudio,
   mensagem e automática; a página ainda mostra o A1 como "Em breve".
5. **Telas escondidas** ainda com o botão verde cheio (chat, banco,
   saídas, etc.) — aplicar `botao-confirmar` quando forem religadas.
6. Tema **Branco**: conferido no Início e no Perfil; as outras telas não
   foram revisadas uma a uma no branco.
7. As demais pendências antigas continuam em `docs/DECISOES-PILOTO.md`,
   seção 4 (número real do WhatsApp, CNPJ no perfil, mensagem das 21h,
   chave anon, Termos com advogado, feriado de 20/11, "Require Log In" da
   Vercel, etc.).

---

## 5. Supabase — o que falta no painel

Conferido ao vivo em 05/10 (fim do dia):

| Item | Situação |
|---|---|
| Provider **Phone** (Authentication → Sign In / Providers) | **Desligado** — falta ligar |
| Números de teste no painel (`5537000000001=123456`…) | **Não feito** (o modo teste do app não precisa deles) |
| Função **`enviar-otp-whatsapp`** | **Não publicada** (as publicadas são `excluir-conta`, `enviar-codigo`, `verificar-codigo`, `pluggy`) |
| **Send SMS Hook** + secret `SEND_SMS_HOOK_SECRET` | **Não feito** |
| Rate limit de SMS (sugestão: 100/h) | **Não feito** |
| Provider **Email** | Ligado, com confirmação automática (é o que a ponte do modo teste usa) |
| Provider **Google** | Ligado no painel (botão escondido no app) |
| Gatilho `handle_new_user` com conta de telefone | **Não conferido** (com e-mail funciona: as contas de teste foram criadas) |
| **Z-API** | Pausada (sem ela, número real não recebe código) |

Passo a passo clique por clique: `docs/LOGIN-WHATSAPP-PASSO-A-PASSO.md`.
O Claude publica a função pelo conector do Supabase se o Fernando disser
**"pode publicar"** (cada uso pede aprovação).

---

## 6. Bugs conhecidos e decisões importantes

- **Simulação no PC ≠ altura do iPhone.** Sobra ou falta de espaço na
  altura não é motivo para mudar sozinho; o print do iPhone decide.
- **Carrossel dos slides usa UMA escala para todos** (`useEscalaComum`).
  Se um desenho ficar mais alto, os 5 encolhem. O slide 3 (nota) fica fora
  da conta (`foraDaEscala`). Mudança em um slide não pode mudar os outros.
- **Gesto de voltar do iPhone** é o "voltar" do navegador: telas com
  etapas na mesma página (como o Onboarding) precisam tratar isso
  (feito com uma "marca" no histórico).
- **Conta de e-mail ≠ conta de telefone** (e as contas de teste são de
  e-mail). Entrar com outro número cria outra conta.
- **Supabase devolve a mesma mensagem** para código errado e vencido; a
  tela decide pelo tempo (mais de 10 min = vencido).
- **Campos de digitar com 16px** ou mais (senão o Safari dá zoom).
- Destaques: só borda verde fina; botões de confirmar em contorno. O
  Fernando prefere telas minimalistas, sem texto explicando, e quer ver
  2–3 variações quando um visual não agrada.
- O Claude **não cria contas** nem faz login em serviços de fora (regra
  de segurança): os testes de login foram feitos com o Supabase
  "imitado" dentro da página, e a criação real foi conferida nos logs.
- No PC não há Python; scripts de ajuste foram feitos com Node.
