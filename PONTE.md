# PONTE — fila de prompts do Claude (patrão) para o Codex (operário)

NUMERO: 4
BRANCH: codex/bloco-8 (prompt 4) / codex/site (prompt 3)
STATUS: novo

## PROMPT 3 — SITE v4.1: acabamento (o v4 ficou bom; são só detalhes)

Branch codex/site (git fetch; git checkout codex/site; git pull). Mesmas regras do PROMPT 2. Não mude textos, cores,
ordem das seções nem as contas do simulador.

1. Velocímetro do SIMULADOR em 0% parece quebrado (agulha grossa deitada com uma bola branca grande).
   Use exatamente o mesmo desenho do velocímetro do hero/bento (agulha fina afinando na ponta, pivô pequeno com anel),
   só que maior. Em 0% a agulha fica deitada à esquerda e o arco verde não aparece — tem que parecer intencional.
   A agulha anima suave (transition 600ms) quando o valor muda.
2. Celular (390x844 e 375x667), hero: o cartão "Frete recebido" está cobrindo os "Últimos lançamentos" do celular.
   No celular, deixe só 2 cartões flutuantes menores (largura máx. 150px), posicionados FORA da tela do celular
   ou na borda, sem cobrir nenhum texto do app: "DAS de outubro" em cima à direita e "Frete recebido" em cima à esquerda.
3. Seção Instalar: o link "Abrir o app" fica sozinho e solto. Troque por botão em pílula com contorno, centralizado,
   com 32px de espaço acima.
4. Confira o menu fixo do celular: o selo "Feito para o MEI Caminhoneiro" não pode ficar escondido atrás do menu
   ao carregar a página (dê espaço suficiente no topo do hero).
5. Conferir: prints em 1440x900, 390x844 e 375x667 (role a página até o fim antes de tirar o print de página inteira,
   para as animações de entrada rodarem). Console sem erro.
6. Commit "fix: acabamento do site v4" e push. Publique de novo SÓ no projeto de teste, igual ao PROMPT 2
   (cópia em C:\Users\ferna\AppData\Local\Temp\tacerto-site-teste\, link --project tacerto-site-teste, deploy --prod).
   NÃO publique no tacerto-site oficial.
7. Resposta curta aqui no chat: commit e "teste atualizado".


## PROMPT 4 — SLIDES DO APP: celulares menores, sem espaço sobrando (branch codex/bloco-8)

Arquivo: src/pages/Welcome.jsx. O Fernando viu no iPhone: os celulares (molduras) dos slides de boas-vindas
estão grandes demais e ainda sobra muito espaço vazio dentro deles.

1. Diminua o celular: MOLDURA_MAX de 390 para 340 e ZOOM_SLIDES de 1.1 para 1.0. A largura da moldura
   acompanha a altura na mesma proporção (o celular fica menor por inteiro, não mais estreito).
2. A moldura tem que ter a altura do CONTEÚDO, não a altura disponível: a altura final da moldura =
   altura natural do slide mais alto (já medida em useEscalaComum) × escala, nunca maior que MOLDURA_MAX.
   Assim não sobra faixa vazia embaixo do conteúdo dentro do celular.
3. O espaço que sobrar na tela vai para fora do celular (acima e abaixo da moldura, dividido por igual),
   nunca para dentro dele. O card de baixo (título, texto, bolinhas, Criar conta) não muda.
4. Não mude textos, a ordem dos slides nem o conteúdo das mini-telas. foraDaEscala (slide da nota) continua.
   Comentário do topo: WELCOME v22.
5. Conferir: prints de todos os slides em 390x844 (iPhone 13), 375x667 (iPhone SE) e 375x812 (iPhone XS).
   Em cada slide: nada cortado, nenhuma faixa vazia grande dentro do celular, itens juntos.
   npx vite build sem erro; node scripts/checar-whatsapp.mjs passando.
6. Commit "ui: celulares dos slides menores e sem espaço sobrando" e git push origin codex/bloco-8.
   Resposta curta aqui no chat com o commit.
