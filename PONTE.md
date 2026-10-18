# PONTE — fila de prompts do Claude (patrão) para o Codex (operário)

NUMERO: 3
BRANCH: codex/site
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
