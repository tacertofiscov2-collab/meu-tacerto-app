Tarefa grande (10/10). Trabalhe SOZINHO, do comeco ao fim, sem me pedir confirmacao para editar, criar arquivos, build, testar no navegador embutido ou commit. So pedem o meu "pode": SQL e publicar funcao no Supabase. Enquanto espera, siga com o resto. Nunca fique parado.

Leia antes: CLAUDE.md, docs/HANDOFF.md, docs/HANDOFF-08-10-PESQUISAS.md, docs/DECISOES-PILOTO.md.

REGRAS
- Branch piloto-simplificado. Commit por bloco (mensagem curta, sem acento). NAO dar push.
- Marca de versao na 1a linha de cada arquivo alterado. UTF-8.
- Visual atual: minimalista, fundo preto, pouco texto, verde so no botao de confirmar, ListaSimples, TopoRolavel. Conferir cada tela em 390x844 e altura 664, Console sem erro, build no fim de cada bloco.
- Principio: "aparece so quando precisa". Cada pedido de dado com UMA frase de beneficio.
- Decisao que nao esta aqui: NAO invente e NAO me pergunte no meio. Anote em "Perguntas para o Fernando" (fim do docs/HANDOFF.md) e siga.
- Ordem = prioridade. Se o limite de uso acabar, a proxima conversa continua pelo git log.

BLOCO A — FISCO VIRA ISA (nome e foto)
- Trocar "Fisco" e "Fisco.ia" por "Isa" em TODO texto que o usuario ve: telas, slides de boas-vindas, tutorial, Suporte, FAQ, notificacoes, mensagens prontas do WhatsApp (MENSAGENS_WHATSAPP: "Oi Fisco" -> "Oi Isa"), Termos e Privacidade.
- Ao lado do nome, quando couber: "assistente virtual". Primeira mensagem do chat/WhatsApp: "Oi, sou a Isa, a assistente com IA do TaCerto." A Isa nunca diz que e pessoa nem contadora.
- Foto: public/isa/isa.png (app) e public/isa/isa-whatsapp.jpg (recorte do rosto). Gerar versoes leves (96px e 256px, webp) e usar como avatar redondo onde hoje aparece o icone do Fisco (inclusive o botao "Fisco" da barra DAS | Fisco | NF, que vira "Isa").
- NAO renomear arquivos nem variaveis internas (Fisco.jsx, ChatFiscoUI.jsx...). Anotar no HANDOFF.
- CLAUDE.md e HANDOFF: "Fisco morreu; o nome e Isa, assistente virtual com IA; foto gerada por IA de pessoa que nao existe".

BLOCO B — INICIO (Dashboard)
- Voltar o Inicio para o visual de ANTES (o que tinha o chat da assistente embaixo, igual aos slides de boas-vindas), com as MESMAS dimensoes. Ache no git log (commits antes das "variacoes do Inicio" de 05/10) e nos slides. Se houver duvida de qual e, deixe o antigo como padrao e o visual F atras de uma chave em piloto.js, e anote.
- Chat da Isa embaixo: religar com o MESMO motor que ja existia (faqFisco/ChatFiscoUI), so com nome e foto novos. O que ele nao souber responder: botao "Falar com a Isa no WhatsApp". Nao criar IA nova no chat.
- "Atualizar velocimetro" vai para CIMA do velocimetro, junto com "Atualizado em dd/mm as hh:mm". Manter "Falta informar" quando zerado e o selo Estimado/Conferido.

BLOCO C — CNPJ
- Dados que vieram do CNPJ (BrasilAPI) ficam TRAVADOS para edicao manual: tipo de MEI, CNAE e atividades, data de opcao pelo MEI, razao social, municipio/UF. No lugar de editar: botao "Atualizar dados do CNPJ" (busca de novo) e "Remover CNPJ" (apaga o CNPJ e esses dados; tudo volta a ser editavel). Mostrar um cadeado pequeno nos campos travados com a frase "Veio do seu CNPJ".
- Perfil: a linha mostra "CNPJ" ao lado da setinha (com o numero mascarado ou "Nao preenchido").
- Pagina do CNPJ:
  - Sem CNPJ: vantagens curtas em lista (preencho seus dados sozinho; DAS com o valor certo da sua atividade; calculo do Imposto de Renda pela sua atividade; aviso se o CNPJ tiver problema; no futuro, boleto do DAS automatico) + campo de busca.
  - Com CNPJ: situacao cadastral (Ativa/...), "MEI desde", atividades, municipio, "Consultado em dd/mm hh:mm" e "Atualizar dados do CNPJ". Guardar o JSON da ultima consulta e a data (coluna nova, ver SQL).
  - Botao de destaque: "Pedir pra Isa conferir meu CNPJ" (frase: "Ela confere se tem DAS atrasado ou pendencia na Receita e te avisa.") -> WhatsApp com mensagem pronta contendo o CNPJ. Hoje isso e feito pela equipe; NAO prometer consulta automatica na tela.

BLOCO D — DAS (pagina propria, dentro do Perfil e no atalho DAS do Inicio)
- Titulo: "DAS" com subtitulo "o imposto mensal do MEI". Trocar "Como pagar o DAS" por isso em todo lugar.
- Topo: proximo vencimento real (feriados, prorroga) e valor pela atividade.
- "Como voce quer pagar seu DAS?" com 2 opcoes, cada uma com 1 frase:
  1) "A Isa me manda o boleto" (recomendado): "Todo mes, antes do dia 20, no seu WhatsApp." -> ativa os lembretes (Preferencias: dias e horario) e abre WhatsApp com mensagem pronta pedindo o boleto. Exige CNPJ (se nao tiver, abre o fluxo do CNPJ).
  2) "Pago sozinho": passo a passo curto (App MEI ou Portal do Simples, so com o CNPJ).
- Trazer para ca as opcoes que hoje estao na folha do DAS do Inicio (FolhaPagarDas) e o historico do DAS. NUNCA sugerir debito automatico.

BLOCO E — NOTAS FISCAIS (pagina dentro do Perfil, igual ao DAS; atalho NF do Inicio abre ela)
- Topo de destaque: "Emita suas notas gratis pelo TaCerto" e, logo abaixo, em letra menor mas legivel: "Para emitir e preciso o Certificado Digital A1 (R$ 100,34, pago a certificadora; o TaCerto nao ganha nada)." (obrigatorio pelo CDC: o certificado nao e gratis.)
- Opcoes: "Emitir nota" (sem A1: explica em 3 linhas o que e o A1, por que e obrigatorio, videochamada; botao "Tenho interesse no certificado" -> WhatsApp pronto) · "Guardar uma nota" (foto ou PDF) · "Minhas notas" (historico por mes: emitidas por nos + guardadas pelo usuario, ver PDF).
- Explicacao curta de quando emitir (ja existe em NotasFiscais.jsx/ComoEmitirNota.jsx: frete na mesma cidade = NFS-e; entre cidades contratado direto = CT-e; agregado de transportadora em MG sem IE = hoje nao emite; 2027 MEI emite em tudo).
- Guardou uma nota de RECEBIMENTO: perguntar "Essa nota e de um frete que voce recebeu? Posso somar R$ X no velocimetro?" [Sim] [Nao]. NAO DUPLICAR: antes de somar, procurar entrada/lancamento de mesmo valor (+-1%) em +-15 dias; se achar, perguntar "E o mesmo de [data, valor]?" e so ligar a nota a ele (nota vira comprovante do lancamento, nao lancamento novo). Mesma regra quando o extrato chegar depois.
- Tirar a pagina de Notas do menu AJUDA (fica em MEU MEI, junto do DAS).

BLOCO F — "CALCULAR" (substitui "Simulador")
- Perfil > MEU MEI > "Calcular". Topo: "O que voce quer calcular?" Lista:
  1) "Quanto ainda posso faturar" (o simulador atual: previsto no ano, % do limite, mes que passa, quanto pode por mes).
  2) "Imposto de Renda: quanto e isento e se preciso declarar" (MOVER a calculadora que hoje esta na Declaracao anual para ca). Explicacao curta de como funciona a isencao (ver REGRAS DA ISENCAO abaixo). Usar o CNAE do CNPJ para escolher o percentual sozinho; sem CNPJ, perguntar a atividade.
  3) "DAS do ano" (quanto pagou e quanto falta).
  4) "Meu lucro" (atalho para a tela Meu lucro).
- Barra no topo de todas as contas: "Calculado com seus dados ate dd/mm (ha X dias/meses)." + botao "Enviar extrato" com selo "Recomendado" para atualizar. Sem dados: o botao vira o primeiro passo.
- Declaracao anual: fica SO a explicacao (o que e, prazo, como o TaCerto ajuda) + botao "Calcular meu Imposto de Renda" que leva ao item 2.
- REGRAS DA ISENCAO (conferir src/lib/declaracao.js e ajustar; tudo em lib, nada solto no componente):
  - Parte isenta = receita bruta do ano x percentual da atividade (Lei 9.249/95 art. 15: transporte de carga 8%, comercio/industria 8%, transporte de passageiros 16%, servicos 32%) MENOS o valor do DAS devido no ano (LC 123/2006 art. 14 §1o). Atividade mista: percentual por atividade sobre a receita de cada uma (se nao souber dividir, usar o percentual da atividade principal e avisar).
  - Lucro maior que esse limite so pode ser isento com escrituracao contabil (art. 14 §2o): o app NAO usa essa via; mostrar uma linha: "Pode ser maior com contabilidade completa."
  - Tributavel = (receita - gastos com comprovante) - parte isenta (minimo 0).
  - "Precisa declarar?" depende tambem de outras rendas da pessoa (salario, aluguel, aposentadoria), bens acima do limite e outros criterios: perguntar so "Voce teve outra renda no ano?" (sim/nao + valor) e mostrar os limites oficiais do ano em constantes (LIMITE_DECLARAR_IR etc.), com a fonte.

BLOCO G — DATAS DA DECLARACAO (textos)
- Corrigir "em maio" em toda a Declaracao anual. Texto certo:
  - Declaracao do MEI (DASN-SIMEI): "Pode ser feita desde o comeco do ano ate 31 de maio."
  - Imposto de Renda (pessoa fisica): "Abre em marco e vai ate o fim de maio (a Receita divulga as datas todo ano)."
  - "Como o TaCerto ajuda": "Quando voce quiser, dentro do prazo, a Isa faz com voce."
- Datas em constantes (PRAZO_DASN, PERIODO_IRPF) em lib, com comentario da fonte, para atualizar todo ano.

BLOCO H — HISTORICO DE ENTRADAS
- No calendario/seletor: tocar no ANO mostra o ano todo (total e lista por mes), alem do mes a mes que ja existe.

BLOCO I — "ENVIAR EXTRATO" SEMPRE RECOMENDADO
- Em TODO lugar onde aparece "Enviar extrato": selo pequeno "Recomendado" no canto superior do botao/cartao. Um componente so, reaproveitado.

BLOCO J — "+" COM FOTO / PDF (lancar lendo o comprovante)
- No "+": opcao "Foto ou PDF do comprovante" (camera ou arquivo). Serve para Pix, comprovante, recibo, nota.
- A leitura usa IA numa funcao do Supabase (edge function nova "ler-comprovante") que devolve: valor, data, quem pagou/recebeu, tipo (recebimento ou gasto). A tela SEMPRE mostra o que leu para a pessoa confirmar/corrigir antes de salvar. Arquivo vai para o balde "comprovantes" (pasta do usuario).
- Mesma regra de NAO DUPLICAR do Bloco E (procurar mesmo valor +-15 dias; se achar, ligar o comprovante ao lancamento existente).
- A chave da IA: eu configuro como segredo no Supabase. Escreva a funcao e o passo a passo para eu colocar a chave em docs/IA-COMPROVANTE.md; publicar a funcao so com o meu "pode". Sem a chave/funcao: a opcao abre o lancamento manual com a foto anexada (sem quebrar).
- Estimar no HANDOFF o custo por leitura.

BLOCO K — PAGINA "PERMISSOES E INTEGRACOES" (Perfil)
- Lista do que o TaCerto usa, com status e acao:
  - WhatsApp: "Conectado" (sem botao de remover: e o login e a Isa). Abaixo: "Lembretes e avisos no WhatsApp" liga/desliga (obrigatorio pela LGPD e pelas regras do WhatsApp poder parar mensagens).
  - CNPJ: conectado/nao + Remover CNPJ.
  - Extratos enviados: quantos, "Ver e apagar".
  - Receita Federal (boleto e consultas automaticas): "Em breve".
  - Certificado A1 / nota automatica: status (perfis.nota_automatica_ativa).
  - Banco (Open Finance): "Em breve" (PLUGGY_ATIVO continua false).
  - Notificacoes do celular: status.
- Rodape: links para Privacidade e Excluir conta.

BLOCO L — TUTORIAL NO PRIMEIRO ACESSO
- Na primeira vez que entra no Inicio: tutorial curto (no maximo 4 telas) com "Proximo" e "Pular tutorial". Guardar que ja viu (perfil ou localStorage). Pode rever em Perfil > Ajuda.
- Conteudo: 1) o velocimetro e o limite; 2) integracoes valem a pena (CNPJ, extrato, boleto do DAS no WhatsApp) e o que cada uma automatiza; 3) "Tudo isso tambem pelo WhatsApp: fale com a Isa quando quiser, sem abrir o app"; 4) comece por: enviar extrato (Recomendado).
- Reaproveitar o tutorial com celular que ja existe (ApresentacaoFisco).

BLOCO M — SLIDES, TUTORIAL, FAQ, TERMOS
- Atualizar slides de boas-vindas (so nome, foto e textos que mudaram), FAQ, Termos e Privacidade (Isa = assistente virtual com IA; leitura de comprovante por IA; pagina de permissoes; como parar mensagens no WhatsApp).

SQL (juntar num bloco so, idempotente, sem DROP/DELETE; salvar em docs/SQL-PENDENTE-10-10.sql, backup, explicar em portugues simples e pedir o "pode" UMA vez):
- perfis: cnpj_dados jsonb, cnpj_consultado_em timestamptz, tutorial_visto boolean default false, avisos_whatsapp boolean default true, das_forma text ('isa' | 'sozinho').
- tabela de vinculo comprovante/nota <-> lancamento (ou coluna lancamento_id nas notas/comprovantes), o que for mais simples com o que ja existe.
- O que mais for preciso. Conferir antes o que ja existe (so leitura). Codigo funciona antes do SQL rodar.

FECHAMENTO
- Revisao completa (Preto e Branco, 390x844 e 664), Console limpo, build OK.
- Atualizar docs/HANDOFF.md (telas novas, o que testar, "Perguntas para o Fernando") e CLAUDE.md.
- No fim, em poucas linhas: o que fez por bloco (com commits), SQL rodou ou espera o "pode", o que testar no iPhone, perguntas.

NAO FAZER: integracao real com Serpro ou envio automatico de WhatsApp, provedor de nota fiscal real (Focus NFe etc.), Open Finance, leitura de extrato PDF por IA, desligar o modo teste do login, git push.
