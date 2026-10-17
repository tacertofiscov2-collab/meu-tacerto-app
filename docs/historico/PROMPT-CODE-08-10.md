Tarefa grande, para trabalhar sozinho por etapas. Leia ANTES de mexer em qualquer coisa:
1) CLAUDE.md  2) docs/HANDOFF.md  3) docs/HANDOFF-08-10-PESQUISAS.md (decisões novas, OBRIGATÓRIO)  4) docs/DECISOES-PILOTO.md
Os relatórios de pesquisa estão em docs/pesquisas/ (consulte quando precisar de regra fiscal).

REGRAS DESTA TAREFA
- Branch piloto-simplificado. Commit a cada etapa (mensagem curta, sem acento). NÃO dar git push.
- Marca de versão na 1ª linha de cada arquivo alterado (padrão do CLAUDE.md). UTF-8.
- Visual no padrão atual: minimalista, fundo preto, pouco texto, verde só no botão de confirmar, lista simples (ListaSimples), TopoRolavel. Conferir cada tela no navegador embutido em 390x844, Console sem erro. Build no final de cada etapa (npx vite build --outDir <pasta temporária>).
- PRINCÍPIO NOVO: "aparece só quando precisa". Nada de encher o usuário de pedidos e textos. Cada pedido de dado vem com UMA frase dizendo o benefício. Tudo opcional.
- SUPABASE: junte TODO o SQL necessário desta tarefa num ÚNICO bloco (if not exists / idempotente), salve em docs/SQL-PENDENTE-08-10.sql, mostre ao Fernando e ESPERE o "pode" antes de rodar. Enquanto não tiver o "pode", siga com o que não depende do banco e faça o código funcionar mesmo sem as colunas novas (ler com cuidado, sem quebrar se a coluna não existir). Depois de rodar: ler de novo, logs, advisors, registrar em src/supabase/migrations.sql. Nunca DROP/DELETE.
- Não mexer em: slides de boas-vindas (exceto se listado), login/modo teste, Open Finance (PLUGGY_ATIVO continua false), visuais antigos do Início.
- Se travar numa decisão de produto, NÃO invente: anote em "Perguntas para o Fernando" (fim do HANDOFF) e siga para o próximo item.

ETAPA 1 — CNPJ (cadastro e perfil)
- Onboarding: nova etapa depois de "Como posso te chamar?": "Qual o CNPJ do seu MEI?" (opcional). Subtítulo curto: "Com ele eu preencho o resto pra você." Máscara 00.000.000/0000-00, teclado numérico, 16px, validar dígitos verificadores. Botões: "Buscar" (verde) e "Preencher depois" (texto). Ajuda pequena: "Está no boleto do DAS ou no app MEI do governo."
- Buscar: GET https://brasilapi.com.br/api/cnpj/v1/{cnpj}, timeout 8s. Falhou → "Não consegui buscar agora" e segue para as perguntas normais.
- Achou: tela "Achei você": nome (razao_social sem o número do começo), "Parece MEI Caminhoneiro" (CNAE principal ou secundário começando com 4930-2) ou "MEI", "MEI desde MM/AAAA" (data_opcao_pelo_mei). Botões "Está certo" / "Não sou eu". Tipo errado: 1 toque troca na própria tela. Se opcao_pelo_mei = false: aviso curto amarelo "Esse CNPJ não aparece como MEI na Receita" + segue.
- "Está certo": grava cnpj, cnae, data_opcao_mei, cnpj_confirmado, tipo_mei e mês/ano de abertura (pela data_opcao_pelo_mei, só se for do ano atual, mesma regra de hoje), conclui o onboarding e vai pro Início (pula tipo e abertura).
- TIRAR a etapa "Quanto você já faturou em <ano>?" (faixas + digitar). O onboarding termina depois de "Abriu este ano?" ou da confirmação do CNPJ.
- Perfil > MEU MEI: linha "CNPJ" (mascarado 12.345.•••/••01-90). Sem CNPJ: "Não preenchido" com um pontinho de aviso discreto; tocar abre o mesmo fluxo de busca/confirmação.
- Usar o CNPJ: dadosParaWhatsApp passa a receber o cnpj do perfil. Valor do DAS pelo CNAE: 4930-2/01 = municipal (R$ 199,52); outros 4930-2/0x = intermunicipal (R$ 195,52); MEI comum: usar CNAE para comércio/serviço quando der; sem CNAE = como hoje.

ETAPA 2 — Velocímetro: atualizar e mostrar quando foi atualizado
- Início (visual F): abaixo do velocímetro, linha discreta "Atualizado em 08/10 às 14:32" + botão "Atualizar velocímetro" (pequeno, contorno). A data/hora = último lançamento/importação gravado (guardar em perfis.velocimetro_atualizado_em; sem a coluna, usar o criado_em mais recente dos lançamentos).
- Velocímetro com faturamento 0 no ano: a palavra da faixa vira "Falta informar" (nunca "Tá tranquilo") e o botão "Atualizar velocímetro" fica em destaque.
- O botão abre a folha de atualizar (evoluir src/components/FolhaAtualizarVelocimetro.jsx, a mesma do sininho), com 3 opções, cada uma com UMA frase:
  1) "Enviar extrato" (recomendado): "Eu separo tudo por mês e guardo seus gastos."
  2) "Digitar": leva ao "+" (Recebimento ou Total do ano). Frase: "Rápido, mas sem histórico nem gastos."
  3) "Mandar pro Fisco no WhatsApp" (mensagem pronta atualizarVelocimetro).
- Selo pequeno no velocímetro: "Estimado" (só total digitado) / "Conferido" (veio de extrato e foi confirmado). Discreto, não poluir.

ETAPA 3 — Enviar extrato dentro do app
- Tela "Enviar extrato" (pode evoluir AdicionarFaturamentoEnviar.jsx, que hoje só guarda no aparelho): aceita OFX, CSV e PDF.
- OFX e CSV: ler no próprio app (sem IA). Para cada transação: data, valor, descrição, documento/nome do pagador quando houver.
  - Cortar ANTES de guardar: só 1º/jan a 31/dez do ano atual e, se o MEI abriu no ano, só da abertura em diante. O resto é descartado.
  - Créditos → tabela entradas (sala de espera, já existe) para a conferência "É faturamento?". Débitos → tabela saidas (origem 'extrato').
  - NÃO DUPLICAR: chave única por transação (FITID do OFX; no CSV, hash de data+valor+descrição). Mandar o mesmo arquivo 2x não pode contar 2x.
  - Ao terminar: "Encontrei 37 entradas e 52 saídas de jan a out. Vamos conferir?" → abre a conferência.
- PDF: guardar o arquivo no Storage (balde privado, pasta do usuário) e registrar como "em análise" (tabela nova extratos_enviados: id, user_id, arquivo_path, tipo, status, criado_em). Mensagem: "Recebi! Vou ler e te aviso quando estiver pronto." (A leitura por IA fica para depois; o Fernando acompanha os pendentes.)
- Conferência "É faturamento?" (ConferirEntradas.jsx já existe e lê a tabela entradas): religar para este fluxo e trocar o Sim/Não por opções curtas: "É frete/serviço ✅" · "Reembolso de despesa ✅" · "Vale-pedágio ❌" · "Empréstimo ❌" · "Estorno/devolução ❌" · "Dinheiro meu/família ❌". Manter a regra por pagador (regras_pagador): confirmou uma vez, o próximo do mesmo pagador já vem sugerido.
- Saídas: conferência parecida, só quando houver dúvida: "É gasto do caminhão?" com categoria. Sem resposta = pessoal (não entra no lucro nem no IR).

ETAPA 4 — "Meu lucro" (gastos x recebido)
- Religar e evoluir a tela do Resumo do ano (ResumoPerfil.jsx, hoje escondida) como "Meu lucro". Topo do mês: Recebido · Gastos · Sobrou (e %). "Ano" com o gráfico por mês (recebido x gastos). Tocar em Gastos abre por categoria: Diesel e Arla · Pedágio · Manutenção e peças · Pneus · DAS e impostos · Seguro e rastreador · Parcela do caminhão · Outros (MEI comum: Material/mercadoria · Ferramentas · Transporte · Outros).
- Categoria sugerida pela descrição (POSTO/COMBUST → Diesel; SEM PARAR/CONECTCAR/VELOE/PEDAGIO → Pedágio; AUTO PECAS/OFICINA → Manutenção; PNEU → Pneus; DAS/SIMPLES → DAS) e lembrada por fornecedor.
- Cada gasto pode ter selo "com nota 🧾" (anexou foto/PDF) ou "sem nota". A calculadora do IR (CalcularDeclaracao) passa a puxar os gastos COM nota do ano automaticamente (a pessoa ainda pode ajustar).
- Onde entra no app: Perfil > MEU MEI > "Meu lucro". Sem dados de gastos: mostrar só Recebido + convite curto "Envie o extrato para ver quanto sobrou."

ETAPA 5 — Janela "Notas fiscais"
- Uma janela (Perfil > AJUDA e o atalho "NF" do Início) com 2 estados:
  A) Sem certificado ativo: explicação curta e organizada (sem textão): quando você precisa emitir (frete na mesma cidade = nota de serviço NFS-e; frete entre cidades contratado direto = CT-e; agregado de transportadora em MG sem inscrição estadual = hoje não emite, a transportadora emite; a partir de 2027 o MEI terá que emitir em todo serviço); como o TaCerto ajuda; o que é o Certificado A1, vantagens (nota automática), preço "R$ 100,34 — preço de custo da certificadora, o TaCerto não ganha nada", como é a videochamada (parado, boa internet e luz, CNH original na mão). Botão "Tenho interesse no certificado" → WhatsApp com mensagem pronta (atualizar MENSAGENS_WHATSAPP.certificadoA1). Reaproveitar o conteúdo de ComoEmitirNota.jsx.
  B) Com certificado ativo (perfis.nota_automatica_ativa = true; por enquanto o Fernando liga à mão no banco): vira "Minhas notas" (reaproveitar HistoricoNotas.jsx: lista por mês, ver PDF, lançar nota).
- Corrigir em todo o app: A1 "R$ 99,90" → "R$ 100,34". NFS-e só para frete na mesma cidade (nunca dizer que agregado emite NFS-e).

ETAPA 6 — DAS: textos certos e preferências de lembrete
- Corrigir o texto do vencimento em todo o app: "Dia 20. Se cair em fim de semana ou feriado, vence no próximo dia útil." (hoje está "antecipa", errado). Card "Próximo DAS": calcular a data real com feriados nacionais (ex.: 20/11/2026 é feriado nacional, sexta → vence 23/11).
- Religar a tela Preferências (MOSTRAR_PREFERENCIAS) só com o que funciona: "Lembrete do DAS" — escolher os dias (7, 5, 3, 2, 1, no dia; vários) e horário; padrão 7, 2 e no dia; "Não quero lembretes". Gravar no perfil (perfis.lembrete_das_dias int[], lembrete_das_hora). Tirar dessa tela o que não faz nada.
- NÃO construir ainda o envio automático (Serpro/WhatsApp): escrever o plano em docs/PLANO-AUTOMACAO-DAS.md (estados do mês por usuário: aguardando → perguntado 7d → 2d → dia → boleto enviado → pago confirmado → check-up enviado; botões Sim/Lembrar depois/Já paguei; check-up mensal; supervisão em 3 fases), usando as informações do Serpro que estão no HANDOFF-08-10.

ETAPA 7 — Simulador do MEI
- Janela "Simulador" (Perfil > MEU MEI): a pessoa informa quanto recebe por mês (já vem preenchido com a média real) e, opcional, quanto gasta. Mostra: faturamento previsto no ano, % do limite (R$ 251.600 caminhoneiro / R$ 81.000 comum, proporcional se abriu no ano), mês em que passaria do limite (se passar), quanto ainda pode faturar por mês até dezembro, DAS do ano e IR estimado (regras de src/lib/declaracao.js). Telas curtas, uma informação por linha. Usar só fiscal.js/declaracao.js (nada de regra nova solta no componente).

ETAPA 8 — Termos de uso e Privacidade
- Atualizar os textos: o app usa o CNPJ para buscar dados públicos e (futuramente) gerar o DAS; lê o extrato enviado pela pessoa, descarta o que é de fora do período e só guarda o necessário; gastos e notas ficam guardados para a gestão dela; a pessoa confirma o que é faturamento. Não usar "contabilidade" nem "contador" para descrever o TaCerto. Não colocar "não nos responsabilizamos por nada".

ETAPA 9 — Fechamento
- Revisão completa (Preto e Branco, 390x844 e altura 664), Console limpo, build OK.
- Atualizar docs/HANDOFF.md (telas novas, chaves, o que falta) e CLAUDE.md ("Onde estamos").
- No fim, me diga em poucas linhas: o que fez, o SQL que ficou esperando "pode" (se ainda não rodou), o que testar no iPhone e a lista "Perguntas para o Fernando".

NÃO FAZER NESTA TAREFA: religar o chat do Fisco no app (design será decidido com o Fernando), CT-e/MDF-e, Open Finance, integração real com Serpro ou envio automático de WhatsApp, leitura de PDF por IA, mexer nos slides de boas-vindas, desligar o modo teste do login.
