# TaCerto! — Resumo de passagem (sessão de 05 a 06/10/2026)

> **Para o Claude do chat novo:** leia este arquivo primeiro. Depois:
> **`CLAUDE.md`** (regras de trabalho e quem é o Fernando),
> **`docs/DECISOES-PILOTO.md`** (decisões e pendências do piloto),
> **`docs/AUTOMACAO-PILOTO.md`** (até onde dá para automatizar DAS, nota
> e declaração) e, se precisar, o **`HANDOFF.md` da raiz** (referência
> completa: Partes 0, 1, 3, 6 e 12). Login no painel do Supabase, clique
> por clique: **`docs/LOGIN-WHATSAPP-PASSO-A-PASSO.md`**.

---

## 0. Como o Fernando trabalha (resumo do CLAUDE.md)

- Não é programador; testa tudo no **iPhone (Safari)**. Português simples,
  respostas curtas, **tudo de uma vez** para testar em lote.
- Telas **minimalistas**: pouco texto, **menos cor**, fundo preto, verde
  só no botão de confirmar/continuar (contorno). Quando um visual não
  agradar: mostrar **2-3 variações**.
- Antes de mexer: dizer em poucas linhas o que muda. Marca de versão na
  1ª linha de cada arquivo alterado (`/* ARQUIVO vN — o que mudou (vN-1: ...) */`).
  Commit a cada etapa. **`git push` só quando ele pedir.**
- Na madrugada de 06/10 ele pediu "trabalhe direto, não peça permissão";
  isso **não** vale para o Supabase (SQL/funções continuam pedindo "pode").

---

## 1. Onde está o código

- Branch **`piloto-simplificado`**. **16 commits SEM PUSH** (de `0ca66d1`
  até o deste resumo): a prévia da Vercel ainda mostra o `353c036` (05/10).
  Quando o Fernando pedir: `git push` (nunca `--force`).
- A **`main` não foi mexida**; produção continua em `f1832bb`.
- Servidor local: o `npm run dev` costuma rodar no terminal do Cursor
  (`localhost:8080`; iPhone em `192.168.1.224:8080`). Em 06/10 de manhã
  ele estava **desligado**: o Claude ligou pelo app (configuração
  `tacerto-dev` em `.claude/launch.json`), testou e **desligou** de novo.
  Para o iPhone, o Fernando precisa ligar o `npm run dev` no Cursor.
- Commits da sessão (antigo → novo): `0ca66d1`, `c74f0dc`, `1505643`,
  `abcadd3`, `bedf4f7`, `092d098`, `2b5169f`, `73cdd09`, `f85ab92`,
  `8669660`, `b09a99c`, `a066198`, `b0ba45e`, `0e4c80b`, `b69c4c2` e o
  deste resumo.

---

## 2. O app hoje, tela por tela

### Antes de entrar (sempre no tema preto)

| Tela | Endereço | Como está |
|---|---|---|
| **Boas-vindas** (slides) | `/` | 5 slides (limite 24h, DAS no automático, nota do seu jeito, grátis, tudo pelo WhatsApp). Escala comum (`useEscalaComum`). Textos com "Fisco" (não mais "Fisco.ia"). ⚠️ O **slide 1 ainda mostra o Início antigo** (cartão de vidro). Fernando pediu para **manter os slides** como estão. |
| **Entrar pelo WhatsApp** | `/login`, `/cadastro` | Número com DDD (+55) → "Receber código" → 6 quadradinhos. Botões maiores, quadradinhos sem verde (só mais claros), links dos Termos sublinhados sem verde, aviso do modo teste no rodapé. |
| **Plano B** | `/entrar-email` | Login antigo por e-mail e senha, sem link em lugar nenhum. |
| **Onboarding** | `/onboarding` | Nome → tipo de MEI → abriu este ano? → quanto já faturou. **Opção escolhida sem verde e sem fundo cinza (só mais clara)**, barra de progresso branca, verde só no "Continuar", letras maiores, campos com 16px. Gesto de voltar do iPhone volta uma etapa. Conta já feita → vai para o Início. |

### Dentro do app

| Tela | Endereço | Como está |
|---|---|---|
| **Início** | `/dashboard` | **Visual F.** Logo + saudação; **sininho** discreto à direita. **Velocímetro grande** (arco até 250, número 48, valores 19; o "MEI · anual" ficou igual), encolhe sozinho em tela baixa; arrastar mostra a média do mês (o "?" da média abre a explicação **uma vez só**). Barra **DAS \| Fisco \| NF** (Fisco com o símbolo do WhatsApp em contorno) **centrada** entre as bolinhas e o rodapé. Rodapé: casinha e Perfil cinza (sem destaque de página atual), **"+" verde grande sem círculo** no centro. |
| **Notificações** | (sininho) | Folha com 2 itens: **"Apresentação do Fisco.ia"** (tutorial em 8 slides com um celular de exemplo e um círculo verde passando por cada função) e **"Atualize seu velocímetro"** (folha com "Digitar o total do ano" ou "Mandar pro Fisco"). Pontinho verde = não lida (guardado no aparelho, por conta). |
| **Painel do DAS** | (DAS no Início) | "Como você quer pagar seu DAS?": boleto todo mês no WhatsApp, Fisco me ajuda agora, fazer sozinho, site do governo. |
| **Lançar (+)** | `/lancar` | **"Recebimento \| Total do ano"** (alternador sem cinza: o escolhido só tem borda clara). Total do ano (`/lancar?modo=total`): digita só o faturamento do ano e o velocímetro fica igual — vira UM lançamento "Ajuste do total do ano" (substituído a cada vez; não deixa total menor que os recebimentos). |
| **Histórico de entradas** | `/historico` | Busca, mês, "Lançar entrada", total, lista por mês; descrição em até 2 linhas. |
| **Passou do limite** | `/regra-vinte` | Lista simples. ⚠️ Aberta direto pelo endereço sem ter passado do limite, mostra "Passei R$ 0,00" (pelo app só abre acima de 100%). |
| **Perfil** | `/perfil` | CONTA: Nome (digita na linha + "Salvar nome"), WhatsApp (aviso "fale com a gente"), Tema Preto/Branco, **Excluir conta** (logo abaixo do Tema). MEU MEI: Tipo de MEI (folha "O que mudou?"), Abertura (calendário, só quem abriu este ano), limite, já faturado, **limite restante**, **Histórico de lançamentos**. AJUDA: **Falar com o suporte**, Como emitir nota, Como pagar o DAS, **Declaração anual**. SOBRE: Termos, Privacidade. Sair da conta. |
| **Suporte** | `/suporte` | Chat do **suporte humano** dentro do app: assuntos → perguntas prontas → resposta + "Isso resolveu?" → se não, a pessoa escreve e toca em "Abrir o WhatsApp do suporte" (mensagem pronta "Oi Fisco! Preciso de suporte no app TaCerto..." com nome, tipo, assunto, dúvida e o que escreveu). |
| **Declaração anual** | `/declaracao-anual` | Prazo 31/05 (sobre o ano anterior), "Calcular meu Imposto de Renda", "Como o TaCerto ajuda hoje", Entenda (2 declarações, parte isenta, declarar ≠ pagar, atraso), faturamento do ano, passo a passo da DASN-SIMEI (abre e fecha). |
| **Calcular IR** | `/declaracao-anual/calcular?passo=1..6` | Uma pergunta por tela: atividade, faturamento (já vem do app), gastos, outras rendas, funcionário → resultado (parte isenta, se precisa declarar, imposto provável, o que vai na DASN). |
| **Como emitir nota** | `/como-emitir-nota` | Aviso NFS-e x CT-e; Fisco no WhatsApp, Fazer sozinho, **Nota automática (A1) — sem "Em breve"**; "Como o TaCerto ajuda hoje"; A1 explicado: ICP-Brasil, certificadora parceira credenciada, videochamada, R$ 99,90/ano, segurança, "Quero agendar meu certificado". |
| **Como pagar o DAS** | `/como-pagar-das` | Vence dia 20; "Como o TaCerto ajuda hoje"; 7 passos; PGMEI; "Prefiro que o Fisco me ajude". |
| **Excluir conta**, **Termos**, **Privacidade**, **Editar perfil** (sem link) | | Lista simples; fundo preto. |

**Em todas as telas:** setinha de voltar maior (bolinha 46, seta 24;
sem bolinha: seta 26). **"Fisco.ia" virou "Fisco"** em todo texto; o
nome "Fisco.ia" ficou só na Apresentação. Janelas (calendário, mês,
Tipo de MEI, confirmações) com fundo preto, sem cinza, escolhido só
mais claro, verde só no "Confirmar".

### Escondido por chave (nada foi apagado)

Ver `docs/DECISOES-PILOTO.md`, seção 3. Endereço escondido aberto
direto volta para o Início. Visuais antigos do Início (Atual, A–E e
`g` = "tela B" invertida) continuam no `Dashboard.jsx`.

---

## 3. Chaves (`src/config/piloto.js`)

| Chave | Valor |
|---|---|
| `MOSTRAR_OPEN_FINANCE`, `MOSTRAR_CHAT_FISCO`, `MOSTRAR_NOTAS_FISCAIS`, `MOSTRAR_SAIDAS`, `MOSTRAR_HISTORICO_DAS`, `MOSTRAR_ADICIONAR_MOVIMENTACOES`, `MOSTRAR_RESUMO_ANO`, `MOSTRAR_PREFERENCIAS`, `MOSTRAR_SOBRE`, `MOSTRAR_INACABADOS`, `MOSTRAR_AVATAR`, `MOSTRAR_LOGIN_EMAIL`, `MOSTRAR_LOGIN_GOOGLE`, `MOSTRAR_WHATSAPP_DOCUMENTOS` | `false` |
| **`MODO_TESTE_LOGIN`** | **`true`** ⚠️ desligar antes de gente real |
| `MOSTRAR_CARD_DAS`, `MOSTRAR_TUTORIAL_DAS`, `MOSTRAR_TUTORIAL_NOTA` | `true` |
| `MOSTRAR_NOTIFICACOES` | `true` (sininho, Apresentação, Atualize seu velocímetro) |
| `MOSTRAR_SUPORTE` | `true` (`/suporte`) |
| `MOSTRAR_DECLARACAO_ANUAL` | `true` (`/declaracao-anual` + calculadora) |
| `MOSTRAR_SELETOR_VISUAL_INICIO` | `false` |
| `VISUAL_INICIO_PADRAO` | `"f"` |
| **`WHATSAPP_FISCO`** | **`"5537991999373"`** — número real **(37) 99199-9373**, o mesmo do Fisco e do suporte (cada botão manda a sua mensagem pronta de `MENSAGENS_WHATSAPP`) |

Fora do `piloto.js`: `PLUGGY_ATIVO = false` (`src/lib/openfinance.js`).
Regras e números da declaração: `src/lib/declaracao.js`
(`LIMITE_DECLARAR_IR = 35584`, do ano de 2025 — **atualizar quando sair o de 2027**).

---

## 4. O que foi feito nesta sessão (05–06/10)

- **Início:** escolhido o visual F depois de C, D, E e a "tela B"; DAS /
  Fisco / NF; casinha cinza; "+" grande sem círculo; velocímetro maior e
  barra centrada; sininho de notificações.
- **Apresentação do Fisco.ia** (tutorial) e **Atualize seu velocímetro**
  (+ modo "Total do ano" no "+").
- **Explicação da média limite:** só texto + "Entendi", uma vez só.
- **Perfil:** itens do Editar perfil vieram para fora (tocáveis); Limite
  restante; Histórico de lançamentos; Excluir conta abaixo do Tema;
  Suporte e Declaração anual na Ajuda.
- **Suporte** (chat com perguntas prontas → WhatsApp) e **Declaração
  anual** (página + calculadora do IR), com pesquisa das regras de 2026
  (DASN até 31/05, multa mínima R$ 50; IR: 8% isento no transporte de
  cargas, limite R$ 35.584; Lei 15.270/2025: isento até R$ 5 mil/mês
  desde 2026).
- **"Como o TaCerto ajuda hoje"** nas páginas de DAS, nota e declaração
  (só o que dá para cumprir à mão no piloto) + **`docs/AUTOMACAO-PILOTO.md`**.
- **Menos cor:** onboarding, entrada, calendário, seletor de mês,
  janelas e alternadores sem verde nem cinza.
- **Setinha de voltar maior** em todas as telas; "Fisco.ia" → "Fisco".
- **Número real do WhatsApp** (37) 99199-9373.
- Revisão completa do app 2 vezes (temas Preto e Branco, alturas 664 e
  844): achados corrigidos (Histórico cortava nomes; calculadora perdia as
  respostas; import sem uso); nenhum erro no Console; build OK.

---

## 5. Pendente / para o Fernando decidir

1. **Enviar para o GitHub** (`git push`) quando ele quiser que a prévia
   da Vercel mostre tudo isto (16 commits).
2. **Testar no iPhone:** Início (tamanho do velocímetro, barra no meio),
   sininho (Apresentação e Atualize seu velocímetro), "+" Total do ano,
   Perfil (Suporte, Declaração anual, calculadora, Tipo de MEI, Excluir
   conta), Como emitir nota (A1) e o onboarding com uma conta de teste.
3. **Conferir com o contador** os textos de Imposto de Renda (página,
   calculadora e respostas do suporte) e os passos da DASN-SIMEI (escritos
   de memória).
4. **Perguntas sem resposta:** atualizar o slide 1 das boas-vindas para o
   Início novo? (ele disse para manter os slides) · A notificação
   "Atualize seu velocímetro" volta todo mês? · Ajustar `/regra-vinte`
   aberto direto?
5. **Login de verdade** (seção 6) e **desligar o modo teste** antes de
   gente real; apagar as contas `tacerto.teste.55...@gmail.com`.
6. Pendências antigas: `docs/DECISOES-PILOTO.md`, seção 4 (CNPJ no
   perfil, mensagem das 21h, chave anon, Termos com advogado, feriado de
   20/11, "Require Log In" da Vercel etc.).

---

## 6. Supabase — o que falta no painel (sem mudança desde 05/10)

| Item | Situação |
|---|---|
| Provider **Phone** | **Desligado** — falta ligar |
| Função **`enviar-otp-whatsapp`** | **Não publicada** (publicadas: `excluir-conta`, `enviar-codigo`, `verificar-codigo`, `pluggy`) |
| **Send SMS Hook** + secret `SEND_SMS_HOOK_SECRET` | **Não feito** |
| Rate limit de SMS (sugestão 100/h) | **Não feito** |
| Provider **Email** | Ligado (a ponte do modo teste usa) |
| Gatilho `handle_new_user` com conta de telefone | **Não conferido** |
| **Z-API** | Pausada |

Nada novo nesta sessão foi gravado no banco: notificações lidas e
"explicação da média lida" ficam no **aparelho** (localStorage, por
conta — `src/lib/marcasDaConta.js`); o "Total do ano" usa a tabela
`lancamentos` que já existe.

---

## 7. Cuidados técnicos aprendidos (não repetir os erros)

- **A tela inteira remonta quando muda o endereço, inclusive o `?`**
  (`TransicaoTela` usa `pathname + search` como chave — é o que faz a
  tela nova deslizar). Estado que precisa passar de uma etapa para a
  outra com `?passo=` vai para o `sessionStorage` (ver
  `CalcularDeclaracao.jsx`).
- **Gesto de voltar do iPhone = voltar do navegador.** Telas por cima
  (Apresentação) põem uma "marca" no histórico; etapas usam o endereço
  (`?passo=`) para o voltar funcionar sozinho.
- **Marcas por pessoa sem banco:** `useMarcaDaConta(nome, inicial)`
  (localStorage com o id do usuário).
- **Navegador embutido do Claude congela animações** enquanto não
  desenha: print pode sair "atrasado" (meio da animação) e medidas podem
  pegar a posição antiga. Medir pelo estilo final ou tirar o print de novo.
- **HMR** (atualização ao salvar) às vezes remonta a tela e fecha
  janelas/reinicia etapas durante o teste — não é bug do app.
- **ESLint não está instalado** no projeto (falta `@eslint/js`): para
  conferir sintaxe usar `npx esbuild arquivo.jsx --loader:.jsx=jsx`; o
  build completo: `npx vite build --outDir <pasta temporária>`.
- **Arquivos com fim de linha do Windows (CRLF):** scripts de troca de
  texto precisam normalizar `\r\n` antes de procurar e devolver depois.
  No PC não há Python; usar Node.
- **Tema:** para testar o Branco use o alternador do Perfil (a classe
  `theme-light` posta à mão some na navegação). Volte para Preto depois.
- O Claude **não cria contas nem faz login** no Supabase (serviço de
  fora). Para ver o onboarding sem conta nova, segurou-se a busca do
  perfil no navegador de teste (sem salvar nada).
- Simulação no PC ≠ altura do iPhone: sobra/falta de espaço vertical
  quem decide é o print do iPhone.

---

## 8. Arquivos novos desta sessão

| Arquivo | Para quê |
|---|---|
| `src/components/Notificacoes.jsx` | Sininho + folha "Notificações" |
| `src/components/ApresentacaoFisco.jsx` | Tutorial "Apresentação do Fisco.ia" |
| `src/components/FolhaAtualizarVelocimetro.jsx` | Folha "Atualize seu velocímetro" |
| `src/components/IconeWhatsApp.jsx` | Símbolo do WhatsApp em contorno |
| `src/components/PerfilFolhas.jsx` | Linha do Nome, aviso "fale com a gente", folha "Seu tipo de MEI" (Perfil e Editar perfil) |
| `src/lib/perfil.js` | Nomes do tipo de MEI, telefone formatado, gravar perfil |
| `src/lib/marcasDaConta.js` | Marcas por conta no aparelho |
| `src/lib/declaracao.js` | Regras e contas da declaração anual / IR |
| `src/pages/Suporte.jsx` | Chat do suporte |
| `src/pages/DeclaracaoAnual.jsx` | Página da declaração anual |
| `src/pages/CalcularDeclaracao.jsx` | Calculadora do IR |
| `docs/AUTOMACAO-PILOTO.md` | Até onde dá para automatizar, com fontes |
