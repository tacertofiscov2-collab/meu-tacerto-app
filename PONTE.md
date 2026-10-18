# PONTE — fila de prompts do Claude (patrão) para o Codex (operário)

NUMERO: 2
BRANCH: codex/site
STATUS: novo

## PROMPT 2 — SITE v4: REDESENHO COMPLETO (o v3 foi reprovado pelo Fernando: "design ruim, mal feito")

O problema do v3: parece modelo pronto. Muito texto pequeno, cartões cinza iguais, quase nenhuma tela do
produto, tudo à esquerda, seções monótonas, velocímetro do simulador esquisito em 0%.
Referências aprovadas pelo Fernando: pierre.finance, meuassessor.com, organizze.com.br.

### 0. Estude as referências ANTES de codar
- Com Playwright (já usado antes), tire print de página inteira de https://pierre.finance e
  https://meuassessor.com em 1440x900 e 390x844. Salve em C:\Users\ferna\AppData\Local\Temp\tacerto-ref\
  (fora do repositório). Olhe com atenção: o que faz eles parecerem caros.
- O que eles têm e nós não (copie a LINGUAGEM, nunca textos, marcas, imagens ou ícones deles):
  a) Menu em "pílula" flutuante, centralizado, com fundo translúcido (backdrop-filter: blur) e borda fina.
  b) Hero CENTRALIZADO: título grande e leve (peso 500, letter-spacing -0.04em), subtítulo curto, UM botão
     em pílula. Embaixo, o celular no centro com CARTÕES FLUTUANDO em volta (transações, gráfico, avisos).
  c) O produto aparece o tempo todo: cada recurso tem uma mini-tela do app desenhada em HTML/CSS.
  d) Grade "bento" de recursos com tamanhos diferentes (2 grandes + 4 pequenos), não 4 colunas iguais.
  e) Ritmo: seções escuras alternando com 1-2 seções claras (fundo #F4F4F0, texto #0A0A0A), como o Meu Assessor.
  f) Seção narrativa "um dia normal" com horários e notificações do celular.
  g) Cartão de plano bem desenhado. Perguntas em 2 colunas no PC. CTA final grande com brilho verde.
  h) Botões em pílula (border-radius 999px). Muito espaço. Título sempre maior que tudo.

### Regras (as mesmas de sempre)
- HTML/CSS/JS puro na pasta site/, sem framework, sem biblioteca nova. Fonte Geist (já usada).
- Proibido: link/botão para WhatsApp (pode CITAR que a Isa avisa no WhatsApp, sem link); "Receita Federal";
  certificado A1; depoimento, nota, número de usuários, logo de imprensa ou parceiro inventados.
- Valores nas mini-telas são ilustrativos e coerentes entre si (limite do Caminhoneiro R$ 251.600; 58% = R$ 145.928).
  Escreva "Valores ilustrativos." discretamente perto do hero.
- APP_URL continua em main.js. Mantenha o simulador (lógica do v3 está certa — NÃO mude as contas),
  JSON-LD, og.png, robots, sitemap, 404, acessibilidade (labels, foco visível, contraste AA, alt).
- Cores: fundo #0A0A0A; superfícies #121212/#171717; bordas rgba(255,255,255,.08); texto #FAFAFA;
  texto secundário #A1A1AA; verde do app (var(--green) atual) só em destaque, números positivos e CTA.

### 1. Estrutura nova (nesta ordem) e os textos EXATOS

**Menu (pílula flutuante):** logo TaCerto! · Recursos · Simulador · A Isa · Perguntas · [Entrar] (link) · [Começar grátis] (pílula verde).
No celular: logo + botão "Começar grátis" pequeno + menu.

**1. Hero (centralizado)**
- Selo pequeno em pílula: "Feito para o MEI Caminhoneiro"
- H1: "Um app que cuida do seu MEI enquanto você cuida da estrada."
- Sub: "Veja quanto já faturou, quanto ainda pode faturar e nunca mais perca o DAS. A Isa te avisa antes de virar problema."
- Botão: "Começar grátis" → cadastro. Abaixo, linha pequena: "Grátis · Sem senha do banco · Funciona no celular"
- Celular centralizado com a tela Início (a que já existe: velocímetro 58%, Últimos lançamentos, rodapé).
- Cartões flutuando em volta (no PC 4 cartões; no celular só 2, menores, sem cobrir o velocímetro):
  esquerda alto: "Frete recebido" · "Pix · hoje, 10:32" · "+ R$ 3.200,00" (verde)
  esquerda baixo: "Nota guardada" · "Frete BH → SP" · selo "com nota"
  direita alto: "DAS de outubro" · "Vence dia 20" · "R$ 195,52"
  direita baixo: avatar da Isa (círculo verde com "I") + balão "Você já usou 58% do limite do ano. Tudo certo."
  Animação: flutuar 6px pra cima e pra baixo, devagar (6-8s), cada um num tempo diferente. Desligar com reduced-motion.
- Faixa de 3 números logo abaixo (centralizada, números grandes): "R$ 251.600" limite do Caminhoneiro ·
  "Dia 20" vencimento do DAS · "31 de maio" declaração anual.

**2. Recursos — grade bento (id="recursos")** Título: "Tudo do seu MEI em um lugar só."
Cada cartão tem título, 1 frase e uma MINI-TELA desenhada:
  - GRANDE: "Velocímetro do limite" — "Quanto já usou e quanto ainda pode faturar no ano." (velocímetro animando de 0 a 58% ao aparecer)
  - GRANDE: "É faturamento?" — "Mande o extrato do banco. Você confirma o que entra na conta." (mini-lista de 3 entradas,
    a primeira com dois botões "Sim" / "Não", a segunda já confirmada com ✓)
  - "DAS no automático" — "Valor certo da sua atividade e lembrete antes do dia 20." (cartão DAS R$ 195,52, vence 20/11)
  - "Notas organizadas" — "Foto ou PDF, com selo com nota ou sem nota." (2 linhas com selos)
  - "Quem pagou?" — "Saiba de qual cliente veio cada frete." (linha com nome de cliente fictício genérico, ex.: "Transportes Silva")
  - "Isa, sua assistente" — "Tira dúvida de MEI na hora, aqui no app." (2 balões curtos)

**3. "Um dia na estrada" (SEÇÃO CLARA, fundo #F4F4F0)** Título: "Você dirige. O TaCerto faz o resto."
Linha do tempo vertical à esquerda + celular à direita mostrando a notificação do horário ativo (troca ao rolar;
no celular, cada horário tem sua notificação embaixo):
  - "6h — Pé na estrada." / "O app fica quietinho no seu bolso."
  - "11h — Caiu o Pix do frete." / "O TaCerto pergunta: é faturamento? Um toque e pronto."
  - "15h — Lembrete do DAS." / "A Isa avisa que vence dia 20. O boleto já está no app."
  - "21h — Tudo no lugar." / "Você abre o app e vê: 58% do limite usado. Pode dormir tranquilo."

**4. Simulador (id="simulador")** Título: "Quanto você ainda pode faturar?" Sub: "Faça a conta em segundos. Nada sai do seu celular."
Mesma lógica do v3, dentro de UM cartão grande e bonito (campos à esquerda, resultado à direita no PC; empilhado no celular).
O velocímetro tem que ser IGUAL ao do app: arco cinza de fundo + arco verde preenchido + agulha com pivô; em 0% fica
bonito (agulha deitada à esquerda, sem bolinhas soltas). Valor "Ainda pode faturar" bem grande. Botão "Acompanhar no app".

**5. A Isa (id="isa")** Título: "Dúvida de MEI? A Isa responde na hora."
Celular (ou cartão alto) com conversa que vai aparecendo balão por balão ao rolar (com "digitando..." de 600ms):
  - Você: "Se eu passar do limite, perco o CNPJ?"
    Isa: "Não. Até 20% acima você continua MEI até dezembro e paga uma guia extra. Em janeiro vira Microempresa."
  - Você: "Frete pago em dinheiro conta no faturamento?"
    Isa: "Conta. Tudo que entra pelo CNPJ conta, com ou sem nota: Pix, dinheiro, cartão ou transferência."
  - Você: "Quando vence o DAS?"
    Isa: "Todo dia 20. Se cair em fim de semana ou feriado, vence no próximo dia útil."
Ao lado: 3 tópicos curtos ("Responde em segundos", "Fala a sua língua", "Conhece as regras do MEI de 2026") e
"A Isa é uma assistente virtual com IA, não é contadora."

**6. Segurança (SEÇÃO CLARA)** Título: "Você confirma. Você tem o controle."
3 colunas com ícone: "Sem senha do banco" (nem do cartão, nem do gov.br) · "Nada entra sem você confirmar"
(o faturamento só soma o que você aprovar) · "Apague quando quiser" (sua conta e seus arquivos, direto no app).

**7. Plano** Título: "Grátis. Sem pegadinha." Um cartão central destacado (borda verde fina e brilho suave):
"TaCerto" · "R$ 0" grande · "/mês" · lista com ✓: Velocímetro do limite · Extrato organizado · Lembrete do DAS ·
Notas em um lugar · Isa, assistente com IA · Instala no celular. Botão "Começar grátis". Linha: "Sem cartão de crédito."

**8. Instalar** (compacto, como no v3, mas com o visual novo): "Instale em 10 segundos." iPhone / Android, destacando o aparelho certo.

**9. Perguntas (id="perguntas")** Título: "Dúvidas? A gente responde." 2 colunas no PC, 1 no celular. As mesmas 9 do v3.

**10. CTA final** fundo com brilho verde radial suave atrás: "Pronto pra deixar seu MEI no controle?" /
"Leva poucos minutos e é grátis." / botão "Começar grátis".

**11. Rodapé** com 3 colunas (Produto: Recursos, Simulador, A Isa · Ajuda: Perguntas, Instalar · Legal: Termos,
Privacidade) + logo e "© 2026 TaCerto!". No celular, a barra fixa "Começar grátis" do v3 continua.

### 2. Movimento (discreto e caprichado)
Revelar seções (fade + 16px) ao rolar; números da faixa contam do 0 ao valor; cartões do hero flutuam; velocímetros
animam; balões da Isa aparecem em sequência. Tudo desligado com prefers-reduced-motion. Sem travar: só transform/opacity.

### 3. Conferir (obrigatório)
- Prints de página inteira em 1440x900, 390x844 e 375x667. Coloque lado a lado com os prints do Pierre e do Meu Assessor
  e se pergunte com honestidade: "parece do mesmo nível?". Se não, ajuste antes de publicar (espaço, tamanho de título,
  alinhamento, mini-telas). Faça pelo menos 2 rodadas dessa comparação.
- Nada cortado, sem rolagem lateral, cartões do hero não cobrem o velocímetro no celular.
- Simulador: os mesmos testes do v3 com as mesmas contas.
- Busca no site/: "WhatsApp" só como texto (nenhum href), nada de "wa.me", "Receita", "A1", "[".
- Console sem erro. Lighthouse mobile uma vez (diga as 4 notas).
- Commit: "feat: site v4 redesenhado (hero central, bento, um dia na estrada, plano)" e push na codex/site.

### 4. Publicar para o Fernando ver SEM pedir login (a prévia da Vercel pede verificação de e-mail)
- NÃO use a prévia normal. Copie a pasta site\ para C:\Users\ferna\AppData\Local\Temp\tacerto-site-teste\
  (sem a subpasta .vercel), e nessa cópia:
  npx vercel@latest link --yes --project tacerto-site-teste
  npx vercel@latest deploy --prod --yes
- Abra o endereço em aba anônima e confirme que abre sem login. Isso NÃO mexe no site oficial (tacerto-site).
- NÃO publique no tacerto-site oficial: só depois que o Fernando aprovar.

### 5. Resposta (aqui no chat, curta)
Endereço do site de teste · commit · notas do Lighthouse · o que ficou de fora.
