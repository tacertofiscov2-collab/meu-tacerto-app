# TaCerto! — Handoff para novo chat com o Claude (10/10/2026)

## Quem e como trabalhar
- Fernando (Divinopolis-MG), fundador do TaCerto!, nao programador. Portugues simples, respostas curtas e diretas.
- Eu (Claude, chat) = pesquisa, decisoes, leis, prompts para o Claude Code. O Code programa no notebook (C:\Users\ferna\Documents\meu-tacerto-app).
- Prompts para o Code: salvar em docs/PROMPT-CODE-<data>.md no notebook (via ponte do computador) e mandar so o comando curto "Leia e execute o arquivo docs/...". Sempre em bloco copiavel.
- Duvida fiscal/legal: pesquisar em fonte oficial e responder fundamentado (ele nao tem contador nem advogado).
- So criar handoff quando ele pedir. Nao fazer coisas sem ele pedir. Economizar tokens: nao vasculhar o projeto sem necessidade; pedir print da tela do Code para saber status.
- Eu NAO consigo aprovar permissoes do Code nem mudar as permissoes dele (bloqueado). Ele aprova pelo celular com /remote-control.

## Regras fixas do projeto
- SQL/funcao no Supabase so com "pode" do Fernando; nunca DROP/DELETE sem "pode apagar". Git push so quando ele pedir; nunca --force.
- Nunca pedir senha gov.br/banco; senha do certificado nunca no WhatsApp; nada de robo em site da Receita (IN RFB 2.320/2026 art. 13).
- TaCerto nunca se chama "contabilidade/contador". Nunca sugerir debito automatico do DAS (se perguntarem, nao negar).
- Publico: so MEI (Caminhoneiro primeiro, MEI comum junto). Principio: "aparece so quando precisa".
- Modo teste do login (MODO_TESTE_LOGIN) ligado: desligar antes de gente real.

## Estado em 10/10 (tarde)
- Branch piloto-simplificado, GitHub em dia (ultimo push 7ee8227). Tarefa 08-10 CONCLUIDA: CNPJ (BrasilAPI, "Achei voce"), velocimetro (Atualizado em, Falta informar, selo), enviar extrato OFX/CSV/PDF com conferencia e sem duplicar, Meu lucro, Notas fiscais, DAS com vencimento real (prorroga), Preferencias (lembrete), Simulador, Termos/Privacidade. SQL de 08-10 rodado.
- Respostas do Fernando as perguntas do Code: ja enviadas (11: nao descartar valores iguais de contas diferentes, perguntar; 12: lista "Gastos pessoais").
- EM ANDAMENTO: docs/PROMPT-CODE-10-10.md (nova conversa no Code). Blocos: A Fisco vira Isa · B Inicio volta ao visual antigo com chat da Isa embaixo e "Atualizar velocimetro" em cima · C CNPJ travado + pagina com vantagens e "Pedir pra Isa conferir meu CNPJ" · D pagina DAS ("Como voce quer pagar?") · E Notas fiscais no Perfil ("emissao gratis" + aviso do A1 pago; guardar nota soma no velocimetro com pergunta e sem duplicar) · F "Calcular" (substitui Simulador; isencao do IR movida pra ca) · G datas da declaracao · H historico por ano · I selo "Recomendado" no Enviar extrato · J "+" com foto/PDF lido por IA (edge function ler-comprovante; chave da IA o Fernando poe no Supabase) · K pagina Permissoes e integracoes · L tutorial no 1o acesso · M slides/FAQ/Termos. Bloco "Linguagem e lei" no topo.
- Limite semanal do plano ~78% (reinicia qua 14/10 18:00). Tarefa pode parar no meio; continuar pelo git log.

## Isa (ex-Fisco)
- Nome "Isa", sempre "assistente virtual"/"assistente com IA"; nunca diz que e pessoa nem contadora (CDC art. 6 III, 31, 37; PL 2338/2023 de IA ainda em tramitacao).
- Foto gerada por IA (pessoa que nao existe), estilo profissional: public/isa/isa.png e public/isa/isa-whatsapp.jpg (recorte). Fernando troca nome/foto do WhatsApp Business para "Isa · TaCerto".

## Decisoes e fatos chave (detalhes em docs/HANDOFF-08-10-PESQUISAS.md e docs/pesquisas/)
- Faturamento: conta frete, adiantamento, reembolso (Cosit 72/2020); nao conta vale-pedagio (Lei 10.209 art. 2), emprestimo, estorno, transferencia propria, Pix de familia.
- DAS 2026: caminhoneiro 195,52 (ICMS) / 199,52 (ISS) / 200,52 (ambos); comum 82,05/86,05/87,05. Vence dia 20; fim de semana/feriado PRORROGA.
- Isencao IR do MEI: receita x % (carga/comercio 8%, passageiros 16%, servicos 32%) menos DAS devido (LC 123 art. 14 §1); acima disso so com escrituracao contabil (§2).
- Prazos: DASN-SIMEI ate 31/05 (pode desde o comeco do ano); IRPF abre em marco e vai ate fim de maio.
- Nota: NFS-e so frete municipal; entre cidades contratado direto = CT-e; agregado sem IE em MG nao emite hoje; 2027 MEI emite em tudo (LC 214 art. 517). A1 pela Tecnosign R$ 100,34 a preco de custo (link). Emissao real exige provedor (Focus NFe ~R$ 39,90/CNPJ/mes no Start) — "notas gratis" tem custo pro TaCerto.
- Serpro Integra Contador: gerar DAS sem procuracao; consultas exigem Autorizacao de Acesso; DASN ainda nao contratavel. Falta: CNPJ do TaCerto, e-CNPJ A1, contrato, WhatsApp oficial Meta.

## Pendentes do Fernando
- Quem responde a Isa (WhatsApp) no piloto.
- Testar no iPhone a tarefa 08-10 (extrato real OFX/CSV).
- Decidir CNPJ do TaCerto; WhatsApp oficial; custo de nota gratis.
- Antes de gente real: desligar modo teste, login WhatsApp no painel, revisar Termos.
