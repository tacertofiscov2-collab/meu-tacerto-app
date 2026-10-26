/* PILOTO v34 — remove mensagem pronta de interesse no certificado (v33: versão anterior) */
import { LABEL_TIPO } from "@/lib/fiscal";
import { formatarCnpj, soDigitosCnpj } from "@/lib/cnpj";

export const ISA_IA_ATIVA = true;
export const FRASE_ISA_NAO_SEI = "Boa pergunta! Ainda não tenho essa resposta certinha. Vou passar sua dúvida para a equipe e te aviso aqui no app.";

/* ===================================================================
   POR QUE ESTE ARQUIVO EXISTE (04/10/2026)

   No piloto o canal principal e o WhatsApp: todo dia as 21h a Isa
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
   menu de anexos), a barra "Pergunte a Isa..." do Dashboard, o
   painel "Tirar duvidas" (o balao "?" do velocimetro do ano) e o botao
   "Nao entendi, falar com a Isa" da media limite.
   No lugar entra o botao "Falar com a Isa no WhatsApp".
   Com false, o balao do velocimetro do ano so aparece quando passa do
   limite (+N%) e abre a tela da regra dos 20%.

   v24 (10/10/2026, tarefa de 10-10, Bloco B): LIGADO. O Inicio voltou
   ao visual de antes (o "atual", com o chat da Isa embaixo, igual ao
   slide 1 das boas-vindas). O chat responde com o MESMO motor de
   respostas prontas que ja existia (src/lib/faqFisco.js, sem IA nova);
   o que ele nao souber responder mostra o botao "Falar com a Isa no
   WhatsApp" (mensagem pronta duvidaDoChat, com a pergunta). O "?" do
   ano e o "Tirar duvidas" so aparecem no visual "atual" (o F fica
   como era).
   ------------------------------------------------------------------- */
export const MOSTRAR_CHAT_FISCO = true;

/* -------------------------------------------------------------------
   ANEXOS E AUDIO NO CHAT (v24 — 10/10/2026)
   Os botoes de foto, galeria, documento, extrato ("+") e microfone do
   chat e da caixinha do Inicio NUNCA fizeram nada. false esconde (o app
   nao promete o que nao faz).
   v31 (12/10/2026, pedido do Fernando: "o chat ta sem a opcao de mandar
   foto, audio, anexar doc... corrija"): LIGADO, agora com funcao:
     - camera, galeria e documento: o arquivo vai para o "+" (Lancar) ja
       como "Foto ou PDF do comprovante" (lido pela IA quando a funcao
       ler-comprovante estiver no ar; sem ela, a pessoa preenche e o
       arquivo fica guardado). Precisa de MOSTRAR_COMPROVANTE_FOTO.
       Passa pela memoria (src/lib/arquivoPendente.js), nao pela URL.
     - extrato (so no "+" da pagina /fisco): abre o Enviar extrato.
     - microfone: abre o WhatsApp da Isa (mensagem pronta "audio"); o
       audio e gravado la. O app nao grava nem transcreve audio.
   ------------------------------------------------------------------- */
export const MOSTRAR_ANEXOS_CHAT = true;

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
   ENVIAR EXTRATO (v18 — 10/10/2026, tarefa de 08-10)
   true libera /enviar-extrato (OFX e CSV lidos no app, PDF guardado
   "em analise") e a conferencia dos gastos (/conferir-saidas). Abre
   pela folha "Atualize seu velocímetro" (Enviar extrato). false: a
   opcao continua na folha, mas a rota volta para o Inicio.
   ------------------------------------------------------------------- */
export const MOSTRAR_ENVIAR_EXTRATO = true;

/* -------------------------------------------------------------------
   MEU LUCRO (v19 — 10/10/2026, tarefa de 08-10)
   true mostra "Meu lucro" no Perfil > Meu MEI e libera /meu-lucro
   (Recebido · Gastos · Sobrou, por mes e no ano, gastos por categoria,
   selo com nota) e /meu-lucro/gastos. E o antigo Resumo do ano
   (ResumoPerfil.jsx) evoluido. MOSTRAR_RESUMO_ANO continua false (o
   endereco antigo /perfil/resumo).
   ------------------------------------------------------------------- */
export const MOSTRAR_MEU_LUCRO = true;

/* -------------------------------------------------------------------
   JANELA "NOTAS FISCAIS" (v20 — 10/10/2026, tarefa de 08-10)
   true: /notas-fiscais abre a janela nova (NotasFiscais.jsx): sem
   certificado ativo, a explicacao curta + Certificado A1; com
   perfis.nota_automatica_ativa = true (o Fernando liga a mao no banco),
   vira "Minhas notas". Abre pelo Perfil > Ajuda ("Notas fiscais") e pelo
   atalho NF do Inicio. false: volta a ser o Historico de notas antigo,
   escondido por MOSTRAR_NOTAS_FISCAIS.
   v27 (12/10/2026, tarefa de 10-10, Bloco E): a pagina fica no Perfil >
   Meu MEI (junto do DAS; saiu da Ajuda): destaque "Emita suas notas
   gratis" + aviso do A1 pago, Emitir nota, Guardar uma nota (pergunta se
   soma no velocimetro, sem contar duas vezes) e Minhas notas
   (/notas-fiscais/minhas). Com o certificado ativo a pagina continua.
   ------------------------------------------------------------------- */
export const MOSTRAR_JANELA_NOTAS = true;

/* -------------------------------------------------------------------
   SIMULADOR DO MEI (v22 — 10/10/2026, tarefa de 08-10)
   true mostra "Simulador" no Perfil > Meu MEI e libera /simulador
   (quanto recebe por mes -> previsto no ano, % do limite, mes em que
   passaria, quanto ainda pode por mes, DAS do ano e IR estimado).
   ------------------------------------------------------------------- */
export const MOSTRAR_SIMULADOR = true;

/* -------------------------------------------------------------------
   CALCULAR (v28 — 12/10/2026, tarefa de 10-10, Bloco F)
   true: Perfil > Meu MEI mostra "Calcular" (no lugar do "Simulador") e
   libera /calcular ("O que voce quer calcular?": Quanto ainda posso
   faturar = /simulador, Imposto de Renda = /calcular/imposto-de-renda,
   DAS do ano = /calcular/das-do-ano, Meu lucro). A calculadora do IR
   saiu da Declaracao anual (que ficou so com a explicacao e o botao).
   false: volta a linha "Simulador" (MOSTRAR_SIMULADOR).
   ------------------------------------------------------------------- */
export const MOSTRAR_CALCULAR = true;

/* -------------------------------------------------------------------
   COMPROVANTE PELA FOTO (v29 — 12/10/2026, tarefa de 10-10, Bloco J)
   true mostra no "+" (Recebimento) a linha "Foto ou PDF do comprovante":
   o arquivo vai para o balde "comprovantes" e a funcao ler-comprovante
   (IA, supabase/functions/ler-comprovante) le valor, data e quem pagou
   para a pessoa conferir. Sem a funcao publicada ou sem a chave da IA, o
   app avisa "Nao consegui ler sozinho" e segue no lancamento a mao com o
   arquivo anexado. Passo a passo da chave: docs/IA-COMPROVANTE.md.
   false esconde a linha.
   ------------------------------------------------------------------- */
export const MOSTRAR_COMPROVANTE_FOTO = true;

/* -------------------------------------------------------------------
   PERMISSOES E INTEGRACOES (v30 — 12/10/2026, tarefa de 10-10, Bloco K)
   true mostra no Perfil > Conta a linha "Permissões e integrações"
   (/perfil/permissoes): WhatsApp (e liga/desliga "Lembretes e avisos no
   WhatsApp"), CNPJ e a notificacao da semana no celular.
   v31 (12/10/2026, pedido do Fernando: "so o que tem no app hoje"): sairam
   extratos enviados, os "Em breve" (governo e banco), o Certificado A1
   (ele fica com a plataforma de notas, nao com o TaCerto) e o rodape.
   ------------------------------------------------------------------- */
export const MOSTRAR_PERMISSOES = true;

/* -------------------------------------------------------------------
   RESUMO DO ANO (com saidas e Imposto de Renda)
   false esconde: /perfil/resumo e o item "Resumo de <ano>" do Perfil.
   Com false, tocar em "Faturado"/"Limite" no velocimetro abre o
   Historico de entradas (a lista dos lancamentos).
   ------------------------------------------------------------------- */
export const MOSTRAR_RESUMO_ANO = false;

/* -------------------------------------------------------------------
   PREFERENCIAS
   v21 (10/10/2026): LIGADA de novo, so com o "Lembrete do DAS" (dias
   antes, horario, "Nao quero lembretes"), gravado no perfil. As chaves
   antigas que nao faziam nada sairam da tela. false esconde /preferencias
   e o item do Perfil.
   ------------------------------------------------------------------- */
export const MOSTRAR_PREFERENCIAS = true;

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
   (DAS_2026 de src/lib/fiscal.js) + botao "Emitir boleto", que abre a
   pagina do DAS (v26, MOSTRAR_PAGINA_DAS; antes a folha FolhaPagarDas). Tambem
   controla o slide do DAS nas boas-vindas. Nao grava nada no banco.
   ------------------------------------------------------------------- */
export const MOSTRAR_CARD_DAS = true;

/* v31 (12/10/2026, pedido do Fernando): o card "Proximo DAS" SAI do
   Inicio ("pro usuario ver vai ser somente no Perfil, onde ja esta o
   DAS": Perfil > Meu MEI > DAS). true volta com ele. MOSTRAR_CARD_DAS
   continua valendo para o resto (slide do DAS nas boas-vindas, folha
   do DAS). */
export const MOSTRAR_DAS_NO_INICIO = false;

/* -------------------------------------------------------------------
   VARIACOES DO INICIO (v8 — 05/10/2026, para o Fernando escolher)
   MOSTRAR_SELETOR_VISUAL_INICIO = true mostra, no topo do Inicio, o
   seletor de teste "Atual | A | B | C". A escolha fica guardada no
   aparelho (localStorage "tacerto_visual_inicio").
     atual  o visual de antes (cartoes de vidro, borda luminosa)
     a      LISTA: velocimetro solto + linhas finas (DAS, Isa, nota)
     b      BLOCOS: fundos suaves sem borda (DAS e Isa lado a lado)
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
   v14 (05/10/2026): ficou a A (F). Seletor desligado de novo; o G
     continua no codigo.
   v24 (10/10/2026, tarefa de 10-10, Bloco B): o Fernando pediu o Inicio
     de ANTES de volta (o que tinha o chat da assistente embaixo, igual
     ao slide 1 das boas-vindas), com as mesmas dimensoes: e o "atual"
     (cartao de vidro com o carrossel A/B, card "Proximo DAS", botao
     "Como emitir nota" no topo e a barra "Pergunte a Isa..." com a
     foto de 96px; commits ed94504 e ce6128a). Novo nele: "Atualizado em"
     + "Atualizar velocimetro" EM CIMA do velocimetro e o selo
     Estimado/Conferido. Para voltar ao F: troque "atual" por "f".
   v31 (12/10/2026, print do Fernando: "muito mal enquadrado"): o
     "atual" ficou mais limpo: so o sininho no topo, o card do
     velocimetro MAIOR com "Atualizar velocimetro" pequeno no canto de
     cima (e "Atualizado em" embaixo dele), sem "Falta informar", sem o
     card Proximo DAS (MOSTRAR_DAS_NO_INICIO) e o chat da Isa menor (foto
     68, barra 44) com camera, clipe e microfone.
   ------------------------------------------------------------------- */
export const MOSTRAR_SELETOR_VISUAL_INICIO = false;
export const VISUAL_INICIO_PADRAO = "atual";

/* -------------------------------------------------------------------
   NOTIFICACOES (v12 — 05/10/2026)
   true mostra o sininho discreto no canto de cima do Inicio e a folha
   "Notificacoes" (src/components/Notificacoes.jsx). A primeira
   notificacao, desde o primeiro login, e a "Apresentacao da Isa"
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

/* -------------------------------------------------------------------
   PAGINA DO DAS (v26 — 12/10/2026, tarefa de 10-10, Bloco D)
   true libera /das ("DAS, o imposto mensal do MEI": proximo vencimento,
   "Como voce quer pagar seu DAS?", "A Isa me ajuda agora") e
   /das/historico (o Historico de DAS, comprovante de cada mes). Abre
   pelo Perfil (Meu MEI > DAS) e pelo "Emitir boleto" do card Proximo
   DAS do Inicio (antes abria a folha FolhaPagarDas, que nao e mais
   usada). /como-pagar-das tambem abre /das. false: o card do Inicio
   volta a abrir a folha e o Perfil volta ao "Como pagar o DAS".
   ------------------------------------------------------------------- */
export const MOSTRAR_PAGINA_DAS = true;

/* Site do governo para gerar o boleto do DAS (PGMEI) */
export const LINK_PGMEI =
  "https://www8.receita.fazenda.gov.br/SimplesNacional/Aplicacoes/ATSPO/pgmei.app/Identificacao";

/* -------------------------------------------------------------------
   EXTRA C — TUTORIAL "COMO EMITIR SUA NOTA"
   true mostra o botao pequeno "Como emitir nota" no Dashboard e libera
   a pagina /como-emitir-nota.
   ------------------------------------------------------------------- */
export const MOSTRAR_TUTORIAL_NOTA = true;

/* v31 (12/10/2026, pedido do Fernando): o botao "Como emitir nota" SAI
   do topo do Inicio (fica so o sininho). As notas ficam no Perfil >
   Meu MEI > Notas fiscais. true volta com ele. */
export const MOSTRAR_NOTA_NO_INICIO = false;

/* -------------------------------------------------------------------
   SUPORTE E DECLARACAO ANUAL (v15 — 06/10/2026)
   MOSTRAR_SUPORTE: "Falar com o suporte" no Perfil > Ajuda abre o chat
   de suporte dentro do app (/suporte): perguntas prontas para afunilar
   e, se nao resolver, o WhatsApp do suporte com tudo anotado.
   MOSTRAR_DECLARACAO_ANUAL: "Declaracao anual" no Perfil > Ajuda
   (/declaracao-anual) com a calculadora do Imposto de Renda
   (/declaracao-anual/calcular). false esconde (rota volta ao Inicio).
   ------------------------------------------------------------------- */
export const MOSTRAR_SUPORTE = true;
export const MOSTRAR_DECLARACAO_ANUAL = true;

/* -------------------------------------------------------------------
   WHATSAPP DA ISA (antes "Fisco"; o nome interno WHATSAPP_FISCO ficou)
   So numeros: 55 + DDD + numero.
   v16 (06/10/2026): numero real, passado pelo Fernando: (37) 99199-9373.
   E o MESMO para a Isa e para o suporte (Perfil > Ajuda): o que muda
   e a mensagem pronta de cada botao (MENSAGENS_WHATSAPP).
   ------------------------------------------------------------------- */
export const WHATSAPP_FISCO = "5537991999373";

/* -------------------------------------------------------------------
   v23 (10/10/2026) — O FISCO MORREU: O NOME E ISA
   A assistente do TaCerto agora e a "Isa", assistente virtual com IA
   (foto gerada por IA, de uma pessoa que nao existe: public/isa/).
   - Em todo texto que a pessoa ve: "Isa" (e, quando couber ao lado do
     nome, "assistente virtual").
   - A Isa NUNCA diz que e pessoa nem contadora.
   - Nomes internos NAO mudaram (arquivos Fisco.jsx, ChatFiscoUI.jsx,
     ApresentacaoFisco.jsx, faqFisco.js; WHATSAPP_FISCO,
     abrirWhatsAppFisco, MOSTRAR_CHAT_FISCO, rota /fisco, autor "fisco"
     das mensagens salvas): trocar quebraria conversas e links salvos.
   ------------------------------------------------------------------- */
export const NOME_ASSISTENTE = "Isa";
export const DESCRICAO_ASSISTENTE = "assistente virtual";
/* Primeira fala da Isa (chat do app e WhatsApp) */
export const FRASE_APRESENTACAO_ISA = "Oi, sou a Isa, a assistente com IA do TaCerto.";

/* -------------------------------------------------------------------
   BOTAO DO WHATSAPP NOS DOCUMENTOS (v4 — 05/10/2026)
   false esconde a secao "Fale com a gente" (com o botao "Falar com o
   Isa no WhatsApp") do fim dos Termos de uso (/termos-de-uso) e
   da Politica de privacidade (/privacidade — ali, junto, some a frase
   "Duvida sobre seus dados? Chame a Isa no WhatsApp.", pedido do
   Fernando em 05/10). O resto do texto dos documentos nao muda.
   ------------------------------------------------------------------- */
export const MOSTRAR_WHATSAPP_DOCUMENTOS = false;

/* Compatibilidade com atalhos antigos: toda ajuda abre a Isa NO APP.
   Nomes internos preservados para nao alterar o chat antes do Bloco 6. */
export function linkWhatsAppFisco() {
  return "/fisco";
}

export function abrirWhatsAppFisco() {
  window.location.assign(linkWhatsAppFisco());
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
     - Meu CNPJ: v17 (10/10/2026) — o perfil agora guarda o CNPJ
       (Onboarding ou Perfil > CNPJ). Com CNPJ, vai formatado
       ("12.345.678/0001-90"); sem CNPJ, "Meu CNPJ: " fica em branco, no
       FIM da mensagem, para a pessoa completar antes de enviar.
   Os textos ficam sem acento de proposito (padrao do WhatsApp e evita
   letra quebrada no codigo).
   =================================================================== */

/* Os dados da pessoa que vao nas mensagens. Recebe o estado do app
   (useAppState) e devolve so o que as mensagens usam. */
export function dadosParaWhatsApp({ nome, tipoMEI, cnpj } = {}) {
  const digitos = soDigitosCnpj(cnpj);
  return {
    nome: String(nome || "").trim(),
    tipo: tipoMEI ? LABEL_TIPO[tipoMEI] || "" : "",
    cnpj: digitos.length === 14 ? formatarCnpj(digitos) : "",
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
  /* Botao "Falar com a Isa no WhatsApp" (Inicio, Perfil, termos) */
  falarComFisco: (d) =>
    `Oi Isa! Vim pelo app e quero tirar uma duvida. ${quemSou(d)}`,

  /* Painel do DAS, opcao a) "Receber meu boleto todo mes no WhatsApp" */
  dasAutomatico: (d) =>
    `Oi Isa! Quero receber meu boleto do DAS automaticamente todo mes. ${quemSouComCnpj(d)}`,

  /* Painel do DAS, opcao b) "A Isa me ajuda agora" e o botao
     "Prefiro que a Isa me ajude" da tela /como-pagar-das */
  dasAjudaAgora: (d) =>
    `Oi Isa! Quero ajuda pra emitir meu boleto do DAS deste mes. ${quemSouComCnpj(d)}`,

  /* /como-emitir-nota, card "Emitir com a Isa pelo WhatsApp".
     Caminhoneiro fala em frete; MEI comum, em servico. */
  notaAjuda: (d, caminhoneiro = true) =>
    caminhoneiro
      ? `Oi Isa! Quero ajuda pra emitir uma nota fiscal. ${quemSou(d)}. Valor do frete: R$ ___. Para quem (empresa/CNPJ): ___`
      : `Oi Isa! Quero ajuda pra emitir uma nota fiscal. ${quemSou(d)}. Valor do servico: R$ ___. Para quem (empresa/CNPJ ou CPF): ___`,

  /* Inicio, painel da media limite: "Falar com a Isa no WhatsApp" */
  mediaLimite: (d) =>
    `Oi Isa! Nao entendi a media limite do app. Me explica de um jeito mais facil, com um exemplo do dia a dia? ${quemSou(d)}`,

  /* v3: Editar perfil, aviso "Seu numero e usado para entrar no app".
     O numero e o login da pessoa, entao quem troca e a equipe. */
  trocarNumero: (d) =>
    `Oi Isa! Quero trocar o numero do meu WhatsApp no TaCerto. Nome: ${d?.nome || "___"}`,

  /* v14: notificacao "Atualize seu velocimetro", opcao "Mandar pro
     Isa no WhatsApp". A pessoa manda os valores ou o extrato depois. */
  /* v15: chat de suporte (/suporte), quando a pergunta pronta nao resolveu.
     Vai com o assunto, a pergunta escolhida e o que a pessoa escreveu. */
  suporte: (d, { assunto, pergunta, detalhe } = {}) =>
    `Oi Isa! Preciso de suporte no app TaCerto. ${quemSou(d)}.` +
    (assunto ? ` Assunto: ${assunto}.` : "") +
    (pergunta ? ` Duvida: ${pergunta}${/[.!?]$/.test(pergunta) ? "" : "."}` : "") +
    (detalhe ? ` O que aconteceu: ${detalhe}` : ""),

  /* v15: Declaracao anual (pagina e resultado da calculadora) */
  declaracaoAjuda: (d) =>
    `Oi Isa! Quero ajuda com a minha declaracao anual do MEI e o Imposto de Renda. ${quemSouComCnpj(d)}`,

  /* v25: pagina do CNPJ, botao "Pedir pra Isa conferir meu CNPJ".
     Hoje a equipe confere a mao (DAS atrasado, pendencia no CNPJ).
     v31: sem citar o orgao (regra do Fernando: o app nao fala o nome). */
  conferirCnpj: (d) =>
    `Oi Isa! Quero que voce confira meu CNPJ: se tem DAS atrasado ou alguma pendencia no meu CNPJ. ${quemSouComCnpj(d)}`,

  /* v24: chat da Isa no app, quando a resposta pronta nao existe.
     Vai com a pergunta que a pessoa fez. */
  duvidaDoChat: (d, pergunta) =>
    `Oi Isa! Perguntei no app e nao achei a resposta: "${String(pergunta || "").trim()}". ${quemSou(d)}`,

  atualizarVelocimetro: (d) =>
    `Oi Isa! Quero atualizar meu velocimetro. Vou te mandar os valores que recebi (ou o extrato do banco). ${quemSou(d)}`,

  /* v31: microfone do chat da Isa (Inicio e /fisco). O app nao grava
     audio: abre o WhatsApp e a pessoa grava la. */
  audio: (d) =>
    `Oi Isa! Vou te mandar um audio. ${quemSou(d)}`,
};
