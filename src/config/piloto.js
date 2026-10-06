/* PILOTO v13 — seletor do Inicio religado: A (F, a de hoje) x B (G, F invertido) (v12: chave MOSTRAR_NOTIFICACOES (sininho do Inicio + Apresentacao do Fisco.ia) (v11: Inicio escolhido: visual F (barra unica); seletor de teste desligado (v10: seletor de teste do Inicio religado para as variacoes novas (C, D, E, F); padrao continua C (v9: Inicio escolhido: visual C (atalhos); seletor de teste desligado (v8: variacoes do Inicio (MOSTRAR_SELETOR_VISUAL_INICIO, VISUAL_INICIO_PADRAO) (v7: testes sem limite: ehTelefoneTeste (37 00000-0001 a 9999, qualquer codigo) (v6: ponte do modo teste; v5: Privacidade sem "Fale com a gente"; v4: MODO_TESTE_LOGIN + TELEFONES_TESTE e MOSTRAR_WHATSAPP_DOCUMENTOS; v3: chaves de login e trocarNumero; v2: MENSAGENS_WHATSAPP) */
import { LABEL_TIPO } from "@/lib/fiscal";

/* ===================================================================
   POR QUE ESTE ARQUIVO EXISTE (04/10/2026)

   No piloto o canal principal e o WhatsApp: todo dia as 21h o Fisco
   pergunta o que a pessoa recebeu, e as respostas sao lancadas pela
   equipe no Supabase. O app serve para ver o velocimetro e os
   lancamentos. Por isso ele fica SIMPLES, so com o basico.

   NADA FOI APAGADO. O que nao e usado no piloto foi ESCONDIDO por
   estas chaves. Para religar qualquer coisa: troque false por true,
   salve e pronto. Cada chave diz o que ela religa.

   Rota escondida aberta direto pela URL volta para o /dashboard (ver
   RotaComChave em src/App.jsx) — nunca fica tela branca.
   =================================================================== */

/* -------------------------------------------------------------------
   OPEN FINANCE (Pluggy)
   false esconde: o botao do banco no canto do Dashboard (e a
   sincronizacao que ele faz ao abrir o app), as telas /conectar-banco,
   /conectar-banco/escolher e /conectar-banco/retorno, e o slide do
   banco nas boas-vindas.
   A conferencia "E faturamento?" (/conferir-entradas) CONTINUA: ela so
   le a tabela `entradas`, nao chama a Pluggy.
   ⚠️ AO RELIGAR: troque tambem PLUGGY_ATIVO para true em
   src/lib/openfinance.js. Com PLUGGY_ATIVO = false o arquivo devolve
   DADOS FALSOS de teste se alguem sincronizar.
   ------------------------------------------------------------------- */
export const MOSTRAR_OPEN_FINANCE = false;

/* -------------------------------------------------------------------
   CHAT DO FISCO DENTRO DO APP
   false esconde: a pagina /fisco (ChatFiscoUI, historico de conversas,
   menu de anexos), a barra "Pergunte ao Fisco..." do Dashboard, o
   painel "Tirar duvidas" (o balao "?" do velocimetro do ano) e o botao
   "Nao entendi, falar com o Fisco" da media limite.
   No lugar entra o botao "Falar com o Fisco no WhatsApp".
   Com false, o balao do velocimetro do ano so aparece quando passa do
   limite (+N%) e abre a tela da regra dos 20%.
   ------------------------------------------------------------------- */
export const MOSTRAR_CHAT_FISCO = false;

/* -------------------------------------------------------------------
   NOTAS FISCAIS (historico e lancar nota)
   false esconde: a tela /notas-fiscais e o item "Historico de notas
   fiscais" do Perfil.
   ------------------------------------------------------------------- */
export const MOSTRAR_NOTAS_FISCAIS = false;

/* -------------------------------------------------------------------
   SAIDAS
   false esconde: a tela /saidas e o item "Historico de saidas" do
   Perfil. (Sem Open Finance a lista ficaria vazia.)
   ------------------------------------------------------------------- */
export const MOSTRAR_SAIDAS = false;

/* -------------------------------------------------------------------
   HISTORICO DE DAS (grade de 12 meses com comprovantes)
   false esconde: a tela /das e o item "Historico de DAS" do Perfil.
   (O card "Proximo DAS" do Dashboard tem chave propria, abaixo.)
   ------------------------------------------------------------------- */
export const MOSTRAR_HISTORICO_DAS = false;

/* -------------------------------------------------------------------
   ADICIONAR MOVIMENTACOES
   false esconde: /adicionar-faturamento (e /digitar, /enviar, /colar)
   e o item "Adicionar movimentacoes" do Perfil. Lancar a mao continua
   pelo botao "+" da barra de baixo.
   ------------------------------------------------------------------- */
export const MOSTRAR_ADICIONAR_MOVIMENTACOES = false;

/* -------------------------------------------------------------------
   RESUMO DO ANO (com saidas e Imposto de Renda)
   false esconde: /perfil/resumo e o item "Resumo de <ano>" do Perfil.
   Com false, tocar em "Faturado"/"Limite" no velocimetro abre o
   Historico de entradas (a lista dos lancamentos).
   ------------------------------------------------------------------- */
export const MOSTRAR_RESUMO_ANO = false;

/* -------------------------------------------------------------------
   PREFERENCIAS
   false esconde: /preferencias e o item do Perfil. A tela tem chaves
   de "Alertas do Fisco" e "Lembrete do DAS" que ainda nao fazem nada.
   ------------------------------------------------------------------- */
export const MOSTRAR_PREFERENCIAS = false;

/* -------------------------------------------------------------------
   SOBRE O TACERTO
   false esconde: /sobre e o item do Perfil. O texto ainda fala em
   "educacao fiscal" e lista "calculadoras e calendario fiscal", que o
   app nao tem.
   ------------------------------------------------------------------- */
export const MOSTRAR_SOBRE = false;

/* -------------------------------------------------------------------
   TELAS E TEXTOS INACABADOS (orfaos, de teste ou que prometem algo
   que o app ainda nao faz)
   false esconde: /faq, /alertas, /velocimetro, /dev/simulador,
   /perfil/informacoes-fiscais, /cadastro-obrigatorio; a tela "Em
   construcao" de endereco desconhecido (vira /dashboard); o cartao
   "Comece com o velocimetro certo" do Historico de entradas (o botao
   dele nao salvava nada); e o aviso da Excluir conta que manda usar
   "Excluir todos os lancamentos" (opcao que nao existe).
   ------------------------------------------------------------------- */
export const MOSTRAR_INACABADOS = false;

/* -------------------------------------------------------------------
   AVATAR (bola redonda com a foto ou a inicial do nome) — v2
   false esconde a bola no topo do Perfil e do Editar perfil. A logica
   da foto continua no codigo, pronta para voltar.
   ------------------------------------------------------------------- */
export const MOSTRAR_AVATAR = false;

/* -------------------------------------------------------------------
   LOGIN (v3 — 05/10/2026): ENTRA SO PELO WHATSAPP
   A pessoa digita o numero, recebe um codigo de 6 digitos no WhatsApp e
   entra (tela EntrarWhatsApp, em /login e /cadastro). Ver
   docs/LOGIN-WHATSAPP-PASSO-A-PASSO.md.

   MOSTRAR_LOGIN_EMAIL = false esconde: login e cadastro por e-mail e
   senha (/login e /cadastro passam a abrir a tela do WhatsApp),
   "Esqueci a senha" (/esqueci-senha), "Alterar senha" (/alterar-senha),
   a troca de WhatsApp com senha (/alterar-whatsapp) e os campos antigos
   de e-mail/WhatsApp do Editar perfil.
   ⚠️ Plano B: /entrar-email (sem link em lugar nenhum) continua abrindo
   o login por e-mail e senha — e por ele que o Fernando entra nos testes
   e se a Z-API cair.

   MOSTRAR_LOGIN_GOOGLE = false esconde o botao "Continuar com Google".
   ------------------------------------------------------------------- */
export const MOSTRAR_LOGIN_EMAIL = false;
export const MOSTRAR_LOGIN_GOOGLE = false;

/* -------------------------------------------------------------------
   MODO TESTE DO LOGIN (v4 — 05/10/2026)
   ⚠️ DESLIGAR (false) ANTES DO PILOTO COM USUARIOS REAIS.

   Com true, a tela de entrada (EntrarWhatsApp):
   - aceita os numeros de TELEFONES_TESTE, mesmo sem cara de celular
     real (DDD + 9 + 8 digitos). Numeros reais continuam funcionando;
   - mostra no rodape: "Modo teste: use 37 00000-0001 a 0005, codigo
     123456".
   Os numeros so funcionam se estiverem cadastrados no painel do
   Supabase (Authentication -> Providers -> Phone -> "Test Phone Numbers
   and OTPs"), com o codigo CODIGO_TESTE_LOGIN. Numero de teste NAO
   manda mensagem nenhuma (nem SMS, nem WhatsApp): o Supabase so aceita
   o codigo fixo. Ver docs/LOGIN-WHATSAPP-PASSO-A-PASSO.md.
   ------------------------------------------------------------------- */
export const MODO_TESTE_LOGIN = true;

/* So numeros: 55 + DDD 37 + 00000-000X */
export const TELEFONES_TESTE = [
  "5537000000001",
  "5537000000002",
  "5537000000003",
  "5537000000004",
  "5537000000005",
];

/* Codigo fixo dos numeros de teste (o mesmo para os 5) */
export const CODIGO_TESTE_LOGIN = "123456";

/* v7 — TESTES SEM LIMITE (05/10/2026), pedido do Fernando para criar
   quantas contas novas quiser e passar pelo onboarding inteiro:
   com MODO_TESTE_LOGIN = true, QUALQUER numero de 37 00000-0001 ate
   37 00000-9999 e numero de teste (cada um vira uma conta nova, do
   zero), e QUALQUER codigo de 6 numeros e aceito para eles. Os 5 de
   TELEFONES_TESTE continuam valendo (estao dentro dessa faixa).
   Numeros reais nao mudam. */
export function ehTelefoneTeste(numero) {
  const d = String(numero || "").replace(/\D/g, "");
  return MODO_TESTE_LOGIN && /^553700000\d{4}$/.test(d) && !d.endsWith("0000");
}

/* v6 — PONTE DO MODO TESTE (05/10/2026)
   O login por telefone ainda esta DESLIGADO no painel do Supabase, e
   sem ele nenhum numero (nem o de teste) recebe codigo. Para o teste
   funcionar ja, com MODO_TESTE_LOGIN = true os numeros de
   TELEFONES_TESTE NAO pedem codigo ao Supabase: a tela confere o
   CODIGO_TESTE_LOGIN e entra numa conta de e-mail de teste ligada
   aquele numero (criada sozinha no primeiro acesso; o Supabase confirma
   e-mail automaticamente neste projeto). O resto e igual: numero
   gravado no perfil, Onboarding na primeira vez, Inicio depois.
   Numeros reais continuam pelo login por telefone de verdade.
   ⚠️ A senha fica no codigo: so serve para estas contas de teste. Com
   MODO_TESTE_LOGIN = false, a ponte some. */
export function contaDoNumeroTeste(numero) {
  return {
    email: `tacerto.teste.${numero}@gmail.com`,
    senha: `teste-${numero}-${CODIGO_TESTE_LOGIN}`,
  };
}

/* -------------------------------------------------------------------
   EXTRA A — CARD "PROXIMO DAS" NO DASHBOARD
   true mostra, abaixo do velocimetro: "Proximo DAS: 20/MM" + valor
   (DAS_2026 de src/lib/fiscal.js) + botao "Emitir boleto", que abre o
   painel "Como voce quer pagar seu DAS?" (FolhaPagarDas). Tambem
   controla o slide do DAS nas boas-vindas. Nao grava nada no banco.
   ------------------------------------------------------------------- */
export const MOSTRAR_CARD_DAS = true;

/* -------------------------------------------------------------------
   VARIACOES DO INICIO (v8 — 05/10/2026, para o Fernando escolher)
   MOSTRAR_SELETOR_VISUAL_INICIO = true mostra, no topo do Inicio, o
   seletor de teste "Atual | A | B | C". A escolha fica guardada no
   aparelho (localStorage "tacerto_visual_inicio").
     atual  o visual de antes (cartoes de vidro, borda luminosa)
     a      LISTA: velocimetro solto + linhas finas (DAS, Fisco.ia, nota)
     b      BLOCOS: fundos suaves sem borda (DAS e Fisco.ia lado a lado)
     c      ATALHOS: velocimetro solto + 3 atalhos redondos
   Depois da escolha: VISUAL_INICIO_PADRAO = a escolhida e o seletor
   desligado (false).
   v9 (05/10/2026): o Fernando escolheu o C. Seletor desligado; A, B e
   "atual" continuam no Dashboard.jsx (para voltar, trocar a letra).
   v10 (05/10/2026): o C ainda nao agradou. Seletor religado com as
     variacoes novas D (cartoes), E (DAS em destaque) e F (barra unica),
     mais o C para comparar. Depois da escolha: desligar de novo.
   v11 (05/10/2026): o Fernando escolheu o F. Seletor desligado; o "+"
     da barra de baixo fica sem circulo (BottomNav visual "simples").
   v13 (05/10/2026): seletor religado para comparar "A" (F) com "B"
     (G = F invertido: os 3 atalhos em cima, velocimetro embaixo).
     Depois da escolha: VISUAL_INICIO_PADRAO = "f" ou "g" e false aqui.
   ------------------------------------------------------------------- */
export const MOSTRAR_SELETOR_VISUAL_INICIO = true;
export const VISUAL_INICIO_PADRAO = "f";

/* -------------------------------------------------------------------
   NOTIFICACOES (v12 — 05/10/2026)
   true mostra o sininho discreto no canto de cima do Inicio e a folha
   "Notificacoes" (src/components/Notificacoes.jsx). A primeira
   notificacao, desde o primeiro login, e a "Apresentacao do Fisco.ia"
   (tutorial em slides, src/components/ApresentacaoFisco.jsx). So abre
   se a pessoa tocar. false esconde tudo.
   ------------------------------------------------------------------- */
export const MOSTRAR_NOTIFICACOES = true;

/* -------------------------------------------------------------------
   TUTORIAL "COMO PAGAR O DAS" (v2)
   true libera a pagina /como-pagar-das (passo a passo do PGMEI), a
   opcao "Quero fazer sozinho" do painel do DAS e o item "Como pagar o
   DAS" do Perfil.
   ------------------------------------------------------------------- */
export const MOSTRAR_TUTORIAL_DAS = true;

/* Site do governo para gerar o boleto do DAS (PGMEI) */
export const LINK_PGMEI =
  "https://www8.receita.fazenda.gov.br/SimplesNacional/Aplicacoes/ATSPO/pgmei.app/Identificacao";

/* -------------------------------------------------------------------
   EXTRA C — TUTORIAL "COMO EMITIR SUA NOTA"
   true mostra o botao pequeno "Como emitir nota" no Dashboard e libera
   a pagina /como-emitir-nota.
   ------------------------------------------------------------------- */
export const MOSTRAR_TUTORIAL_NOTA = true;

/* -------------------------------------------------------------------
   WHATSAPP DO FISCO
   So numeros: 55 + DDD + numero.
   ⚠️ TROCAR PELO NUMERO REAL (este e provisorio).
   ------------------------------------------------------------------- */
export const WHATSAPP_FISCO = "5537999999999";

/* -------------------------------------------------------------------
   BOTAO DO WHATSAPP NOS DOCUMENTOS (v4 — 05/10/2026)
   false esconde a secao "Fale com a gente" (com o botao "Falar com o
   Fisco.ia no WhatsApp") do fim dos Termos de uso (/termos-de-uso) e
   da Politica de privacidade (/privacidade — ali, junto, some a frase
   "Duvida sobre seus dados? Chame o Fisco.ia no WhatsApp.", pedido do
   Fernando em 05/10). O resto do texto dos documentos nao muda.
   ------------------------------------------------------------------- */
export const MOSTRAR_WHATSAPP_DOCUMENTOS = false;

/* Link que abre a conversa com o Fisco no WhatsApp. Com `texto`, a
   mensagem ja chega escrita (a pessoa so toca em enviar). */
export function linkWhatsAppFisco(texto) {
  const base = `https://wa.me/${WHATSAPP_FISCO}`;
  return texto ? `${base}?text=${encodeURIComponent(texto)}` : base;
}

/* Abre o WhatsApp do Fisco com a mensagem pronta. Usar DENTRO do toque
   (onClick): o iPhone so deixa abrir outra janela a partir de um toque.
   Se o navegador bloquear a janela nova, abre na mesma aba. */
export function abrirWhatsAppFisco(texto) {
  const link = linkWhatsAppFisco(texto);
  // Sem "noopener" no window.open: com ele o navegador devolve null
  // mesmo abrindo, e o plano B abriria o WhatsApp duas vezes.
  const janela = window.open(link, "_blank");
  if (janela) {
    try { janela.opener = null; } catch { /* ignora */ }
  } else {
    window.location.href = link;
  }
}

/* ===================================================================
   MENSAGENS PRONTAS DO WHATSAPP (v2 — 04/10/2026)

   No piloto, quem responde e o Fernando, na mao. Cada botao manda uma
   mensagem DIFERENTE, que deixa claro o que a pessoa escolheu — assim
   da para MEDIR o interesse em cada ajuda (DAS automatico, nota, A1...).

   PARA EDITAR UM TEXTO: mude so a frase entre as crases (`...`). O que
   esta dentro de ${...} e preenchido sozinho:
     - Nome: o nome do perfil.
     - Tipo: "MEI" ou "MEI Caminhoneiro", se o perfil tiver.
     - Meu CNPJ: o perfil AINDA NAO GUARDA CNPJ (nao existe a coluna no
       banco). Por isso "Meu CNPJ: " fica em branco, no FIM da mensagem,
       para a pessoa completar antes de enviar.
   Os textos ficam sem acento de proposito (padrao do WhatsApp e evita
   letra quebrada no codigo).
   =================================================================== */

/* Os dados da pessoa que vao nas mensagens. Recebe o estado do app
   (useAppState) e devolve so o que as mensagens usam. */
export function dadosParaWhatsApp({ nome, tipoMEI, cnpj } = {}) {
  return {
    nome: String(nome || "").trim(),
    tipo: tipoMEI ? LABEL_TIPO[tipoMEI] || "" : "",
    cnpj: String(cnpj || "").trim(),
  };
}

/* "Nome: Ana. Tipo: MEI Caminhoneiro" (o tipo so se existir; sem nome,
   "Nome: ___" para a pessoa completar) */
function quemSou({ nome, tipo } = {}) {
  return `Nome: ${nome || "___"}` + (tipo ? `. Tipo: ${tipo}` : "");
}

/* Igual ao quemSou, com "Meu CNPJ: ..." no fim (em branco se nao tiver) */
function quemSouComCnpj(dados = {}) {
  return `${quemSou(dados)}. Meu CNPJ: ${dados.cnpj || ""}`;
}

export const MENSAGENS_WHATSAPP = {
  /* Botao "Falar com o Fisco no WhatsApp" (Inicio, Perfil, termos) */
  falarComFisco: (d) =>
    `Oi Fisco! Vim pelo app e quero tirar uma duvida. ${quemSou(d)}`,

  /* Painel do DAS, opcao a) "Receber meu boleto todo mes no WhatsApp" */
  dasAutomatico: (d) =>
    `Oi Fisco! Quero receber meu boleto do DAS automaticamente todo mes. ${quemSouComCnpj(d)}`,

  /* Painel do DAS, opcao b) "Fisco me ajuda agora" e o botao
     "Prefiro que o Fisco me ajude" da tela /como-pagar-das */
  dasAjudaAgora: (d) =>
    `Oi Fisco! Quero ajuda pra emitir meu boleto do DAS deste mes. ${quemSouComCnpj(d)}`,

  /* /como-emitir-nota, card "Emitir com o Fisco pelo WhatsApp".
     Caminhoneiro fala em frete; MEI comum, em servico. */
  notaAjuda: (d, caminhoneiro = true) =>
    caminhoneiro
      ? `Oi Fisco! Quero ajuda pra emitir uma nota fiscal. ${quemSou(d)}. Valor do frete: R$ ___. Para quem (empresa/CNPJ): ___`
      : `Oi Fisco! Quero ajuda pra emitir uma nota fiscal. ${quemSou(d)}. Valor do servico: R$ ___. Para quem (empresa/CNPJ ou CPF): ___`,

  /* /como-emitir-nota, botao "Tenho interesse no certificado" */
  certificadoA1: (d) =>
    `Oi Fisco! Tenho interesse no Certificado Digital A1 pra emitir nota automatica. ${quemSou(d)}`,

  /* Inicio, painel da media limite: "Falar com o Fisco no WhatsApp" */
  mediaLimite: (d) =>
    `Oi Fisco! Nao entendi a media limite do app. Me explica de um jeito mais facil, com um exemplo do dia a dia? ${quemSou(d)}`,

  /* v3: Editar perfil, aviso "Seu numero e usado para entrar no app".
     O numero e o login da pessoa, entao quem troca e a equipe. */
  trocarNumero: (d) =>
    `Oi Fisco! Quero trocar o numero do meu WhatsApp no TaCerto. Nome: ${d?.nome || "___"}`,
};
