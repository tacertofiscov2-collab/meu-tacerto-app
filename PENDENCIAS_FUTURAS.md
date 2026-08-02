# PENDÊNCIAS PARA O FIM DO PROJETO — TaCerto!

> Guardar este arquivo na raiz do projeto. Serve de lembrete para o dono
> e para qualquer chat/assistente que pegar o projeto no meio.

---

## 1. GESTO DE DESLIZE ENTRE TELAS — adiado de propósito

**Status: DESATIVADO conscientemente. Não é bug esquecido.**

### O que aconteceu
Tentamos implementar o gesto de "arrastar da borda para voltar" (estilo
iOS) dentro do navegador, com framer-motion. Foram vários dias de
tentativas. O resultado ficou funcional, mas com problemas persistentes:

- Travamentos e engasgos no deslize (não 100% liso).
- A tela pulava sozinha para o Dashboard segundos após voltar — porque o
  app remontava Dashboard + Perfil por trás de cada tela, o que é caro.
- No Onboarding, o gesto voltava para os slides em vez da pergunta anterior
  (as perguntas são estado interno, não rotas — o gesto não sabe disso).
- Deslizar rápido ou soltar de uma vez dava comportamento errático.
- O gesto só iniciava numa faixa de 24px na borda (limitação proposital,
  mas que incomoda).

### Por que foi adiado
O gesto que se quer (padrão Instagram / TikTok / iOS) é **nativo**. Dentro
do Safari existe um teto técnico: dá para chegar em "aceitável", não em
"idêntico". Além disso, manter o mecanismo agora fazia cada tela nova
herdar os mesmos bugs, aumentando o problema junto com o app.

### Como resolver DE VERDADE, no momento certo
Empacotar o app com **Capacitor** antes do lançamento:

- É gratuito e open source.
- **NÃO exige reescrever nada** — pega o app React como está e empacota.
- Um código só, três destinos: Web (como hoje), iOS (App Store) e
  Android (Play Store).
- Com plugins de transição nativa, o gesto vem com a física do próprio
  sistema operacional — melhor que qualquer coisa feita à mão no Safari.
- De brinde: notificações push, câmera nativa (útil para os anexos do
  chat do Fisco), acesso a arquivos, ícone na tela de início.

### Custos e obstáculos conhecidos
- **Capacitor:** grátis.
- **Apple Developer:** US$ 99/ano (obrigatório para publicar na App Store).
- **Google Play:** US$ 25, pagamento único.
- **O dono NÃO tem Mac.** O build de iOS normalmente exige Mac com Xcode.
  Solução: **build na nuvem** — Ionic Appflow, Codemagic ou GitHub Actions
  rodam o build de iOS em máquinas Apple deles; envia-se só o código.
  Alguns têm plano gratuito limitado. O build de Android roda no Windows
  normalmente.

### Quando fazer
Na etapa de **empacotamento**, depois que o app estiver pronto. Adicionar
Capacitor no meio do desenvolvimento só deixa cada ciclo de teste mais
lento, sem trazer benefício imediato.

### Sobre o efeito de toque nos botões (já implementado)
O efeito de "botão afundando" ao tocar é CSS puro e **continua
funcionando normalmente** dentro do Capacitor — não se perde nada.
De brinde, o Capacitor traz o plugin **Haptics**, que faz o aparelho
vibrar levemente ao tocar (aquele "tec" do iPhone). Vale ativar junto
com o gesto: feedback visual + tátil é o que dá a sensação de app
profissional.

### Onde está o código do gesto
Continua salvo no histórico do Git. Componentes envolvidos:
`src/components/TelaComVoltarReal.jsx`, `src/components/SwipeBack.jsx`,
`src/components/AbasDeslizantes.jsx`, `src/components/VoltarAnimadoContext.js`.
Se um dia quiser retomar no navegador, está tudo lá.

---

## 2. OUTRAS PENDÊNCIAS DO PROJETO

- **Back-end Supabase do zero.** Depois migrar `src/lib/chatHistorico.js`
  de localStorage para lá (o arquivo já tem o aviso de migração no topo).
- **Fisco responder de verdade.** Hoje devolve sempre a mesma frase fixa.
- **Ligar as ações dos anexos** do chat (foto, galeria, documento,
  extrato) — hoje só a interface existe.
- **Otimizar o tamanho do pacote.** O build avisa que o JS passou de
  835 KB (acima dos 500 KB recomendados). Resolve-se com code-splitting
  (`dynamic import`) ou `manualChunks`. Não é urgente, mas deixa a
  primeira abertura do app mais lenta.