/* ===================================================================
   SwipeBack — DESATIVADO DE PROPÓSITO

   O gesto de "arrastar da borda para voltar" foi desligado. Não é bug
   esquecido: a decisão está documentada em PENDENCIAS_FUTURAS.md, na
   raiz do projeto.

   Resumo: dentro do navegador o gesto nunca ficou 100% liso, e cada
   tela nova herdava os mesmos problemas. A solução correta é empacotar
   o app com Capacitor antes do lançamento — aí o gesto vem nativo, com
   a física do próprio sistema operacional, sem código de física à mão.

   O componente continua sendo importado pelo App.jsx e simplesmente
   não faz nada. Para reativar no futuro, basta recuperar a versão
   anterior deste arquivo no histórico do Git.

   IMPORTANTE: isto NÃO afeta os deslizes internos que funcionam bem —
   os slides do Welcome e o carrossel A/B do velocímetro no Dashboard
   têm lógica própria e seguem ativos.
   =================================================================== */

   export default function SwipeBack() {
    return null;
  }