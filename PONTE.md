# PONTE — fila de prompts do Claude (patrão) para o Codex (operário)

NUMERO: 1
BRANCH: codex/site
STATUS: novo

## PROMPT

SITE v3 — deixar o site de apresentação (pasta site/) muito bom.
Você trabalha sozinho; o Fernando não está no PC. Trabalhe até o fim.

### Regras
- Leia AGENTS.md. Nunca force-push/rebase/squash/amend; push só da codex/site.
- HTML/CSS/JS puro, sem build, sem framework, sem biblioteca externa (só a fonte Geist que já usa).
- Mantenha a identidade aprovada: fundo preto, branco, verde só em destaque/CTA, fonte Geist,
  muito espaço, poucas palavras. Inspiração: Pierre Finance, Linear, Mercury, Cora — minimalista, premium.
- Proibido: link ou botão para WhatsApp; "Receita Federal"; certificado A1; depoimento,
  nota de avaliação, número de usuários ou logo de parceiro inventados; promessa de "zero imposto".
- A Isa é "assistente virtual com IA", nunca contadora nem pessoa.
- Português do Brasil simples, frases curtas, falando com caminhoneiro ("você").
- Todos os links do app num lugar só: em main.js, const APP_URL = "https://meu-tacerto-app.vercel.app";
  os links /cadastro, /login, /termos-de-uso, /privacidade são montados a partir dele.

### Dados oficiais (use exatamente estes; 2026)
- Limite anual: MEI comum R$ 81.000; MEI Caminhoneiro R$ 251.600.
- Ano em que abriu: proporcional aos meses, contando o mês da abertura inteiro:
  R$ 6.750/mês (comum) e R$ 20.966,67/mês (Caminhoneiro).
- Conta no faturamento: tudo que entra pelo CNPJ (Pix, dinheiro, cartão, transferência), com ou sem nota,
  pela data em que recebeu. Não conta: salário de carteira, aposentadoria, aluguel, ganho da pessoa física.
- Até 20% acima (até R$ 97.200 comum; até R$ 301.920 Caminhoneiro): continua MEI até 31/12, paga uma guia
  extra (DAS complementar) sobre o que passou; em 1º de janeiro vira Microempresa.
- Mais de 20% acima: deixa de ser MEI desde 1º de janeiro do mesmo ano (no ano da abertura, desde a
  abertura), impostos recalculados com multa e juros — procurar um contador o quanto antes.
- DAS vence dia 20 (fim de semana/feriado: próximo dia útil). Valores 2026:
  Caminhoneiro: frete entre cidades/estados R$ 195,52; só na mesma cidade R$ 199,52; os dois R$ 200,52.
  MEI comum: comércio/indústria R$ 82,05; serviços R$ 86,05; comércio e serviços R$ 87,05.
- Declaração anual (DASN-SIMEI): até 31 de maio.
- Rodapé de dados: "Valores de 2026. Fonte: regras do MEI e salário mínimo de 2026."

### O que fazer (em ordem)
1. CONSERTO URGENTE: a pergunta "Quanto custa?" mostra "[PREÇO A DEFINIR]" no site no ar.
   Troque por: "Nada. O TaCerto é grátis." (o app já diz "Tudo isso, grátis").

2. NOVA SEÇÃO — SIMULADOR DO LIMITE (a estrela do site; logo depois dos 3 números do hero, id="simulador").
   - Título: "Quanto você ainda pode faturar?" Subtítulo curto.
   - Campos: tipo (botões "Caminhoneiro" [padrão] / "MEI comum"); "Abriu o MEI este ano?" (Não [padrão] /
     Sim + mês de abertura em <select>); "Quanto já recebeu este ano?" (campo em reais, máscara R$ 1.234,56,
     inputmode="decimal", fonte ≥ 16px para o iPhone não dar zoom).
   - Resultado ao vivo (sem botão): velocímetro igual ao do hero (SVG) com a agulha animando até a %,
     "Você já usou X% do limite", "Ainda pode faturar R$ Y", e "Dá uma média de R$ Z por mês até dezembro"
     (meses restantes contando o mês atual; use a data do aparelho).
   - Faixas: até 79% verde; 80–100% aviso "Fique de olho"; 100–120% "Passou, mas até 20%: continua MEI até
     dezembro e paga uma guia extra. Em janeiro vira Microempresa."; >120% "Passou mais de 20%: procure um
     contador o quanto antes." (sem vermelho gritante; use tons discretos).
   - Abaixo: "Simulação. Nada do que você digita sai do seu celular." e CTA "Acompanhar no app".
   - Nada é salvo nem enviado (nem localStorage). Acessível: labels, aria-live="polite" no resultado.

3. NOVA SEÇÃO — "O que conta no faturamento" (curta, 2 colunas: "Conta" / "Não conta", ícones simples),
   com a frase "Com ou sem nota, o que vale é a data em que o dinheiro entrou."

4. NOVA SEÇÃO — "DAS de 2026" (id="das"): os valores acima em lista limpa, Caminhoneiro em destaque,
   "Vence todo dia 20" e "O app te lembra antes do vencimento."

5. NOVA SEÇÃO — "Instale em 10 segundos" (o app é PWA, não está em loja): dois cartões
   iPhone (Safari → Compartilhar → Adicionar à Tela de Início) e Android (Chrome → menu → Instalar app),
   com ícones desenhados em SVG simples. Detecte o aparelho e destaque o cartão certo.

6. PERGUNTAS: mantenha as 4 e acrescente (respostas curtas e corretas pelos dados acima):
   "Preciso de contador para usar?", "Funciona no Android e no iPhone?", "Passei do limite. E agora?",
   "O app emite nota fiscal?" (resposta: "Por enquanto, o app mostra o passo a passo no gov.br e guarda
   suas notas. A Isa tira suas dúvidas."), "O que é a Isa?".
   Gere JSON-LD FAQPage com as mesmas perguntas e respostas.

7. NAVEGAÇÃO: links "Simulador", "Como funciona", "A Isa", "Perguntas". No celular, depois que o hero sai da
   tela, mostre uma barra fixa embaixo com "Criar conta" (some quando o CTA final aparece; respeita a
   área segura do iPhone: env(safe-area-inset-bottom)).

8. MOVIMENTO (discreto): agulha do velocímetro do hero anima de 0 a 58% ao carregar; seções aparecem com
   fade+subida de 12px ao rolar (IntersectionObserver); tudo desligado com prefers-reduced-motion.

9. COMPARTILHAMENTO (importante: o link vai ser mandado no WhatsApp):
   - Crie site/og.png 1200x630: fundo preto, "Seu MEI no controle." grande em branco, velocímetro verde,
     "TaCerto!" e "Feito para o MEI Caminhoneiro". Gere com um script (ex.: Playwright tirando print de
     um HTML temporário fora da pasta site/), sem dependência nova no projeto. PNG < 200 KB.
   - og:image e twitter:image apontando para https://tacerto-site.vercel.app/og.png (1200x630),
     twitter:card summary_large_image.

10. SEO e técnico: canonical, JSON-LD SoftwareApplication (name TaCerto!, applicationCategory
    FinanceApplication, operatingSystem "iOS, Android, Web", offers price 0 BRL), robots.txt, sitemap.xml,
    404.html no mesmo estilo, title/description revisados com "MEI Caminhoneiro" e "limite do MEI".

### Conferir (obrigatório, antes de publicar)
- Prints em 390x844, 375x667 e 1440x900 de cada seção nova. Nada cortado, sem rolagem lateral.
- Simulador: teste 0, 125.800 (50%), 230.000 (~91%), 270.000 (~107%), 320.000 (~127%), MEI comum 81.000
  (100%), e abertura em julho (limite proporcional Caminhoneiro = 6 × 20.966,67 = R$ 125.800,02).
  Confira as contas à mão no relatório.
- Console sem erro; página principal < 400 KB sem a fonte; Lighthouse (npx lighthouse, uma vez só,
  mobile) ≥ 95 em Performance, Acessibilidade, Boas práticas e SEO — se não der, diga quanto deu.
- Procure no site/ por "WhatsApp", "wa.me", "Receita", "A1", "[": nenhuma ocorrência indevida.
- Commit(s) em português ("feat: site v3 com simulador do limite, DAS 2026 e instalação") e push.

### Publicar
- PRÉVIA primeiro (não produção): cd site; npx vercel@latest deploy --yes  → anote o endereço da prévia.
- NÃO rode --prod. O Claude revisa a prévia e manda o próximo prompt para publicar.

### Resposta (no fim deste arquivo, como "## RESPOSTA 1")
- Endereço da prévia; hashes dos commits; resultado dos testes do simulador (com as contas);
  notas do Lighthouse; o que ficou de fora e por quê.
