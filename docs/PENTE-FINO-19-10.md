<!-- PENTE-FINO-19-10 v1 — varredura, correções e limites de validação -->
# Pente fino do app — 19/10/2026

Branch: `codex/pente-fino`, criada de `codex/bloco-8` em `1592ffa`.

## Como foi testado

- App servido com `npx vite --host 127.0.0.1`, em `http://127.0.0.1:8080`.
- Playwright/WebKit com toque, tamanhos **375 × 635** e **390 × 664**, idioma pt-BR e fuso America/Sao_Paulo. As três correções também foram verificadas em 390 × 844.
- As **62 declarações de rota de src/App.jsx**, incluindo aliases, rotas escondidas e endereço desconhecido, foram abertas em cada tamanho: **124 capturas de rota**, além de capturas dos fluxos, folhas e 29 finais de rolagem.
- Login pela interface, com `MODO_TESTE_LOGIN` e o número **37 00000-0001**, código 123456. Cadastro descartável com **37 00000-9991**, código 987654. O número novo foi criado e excluído somente no ambiente local de teste.
- **Nenhum acesso ao Supabase real:** o Playwright interceptou as chamadas do SDK e respondeu com um servidor de dados simulado em memória. O código normal de navegação, login, estado, importação, salvamento e interface executou no navegador. Isso valida os fluxos locais, mas **não comprova** permissões, disponibilidade, estrutura do banco, envio de código nem exclusão no servidor real.
- `ISA_IA_ATIVA` permaneceu **false**. Nenhuma função ou SQL foi publicado ou executado. Nenhuma chave do piloto foi alterada. Slides, textos de produto e contas fiscais foram preservados.
- Lidas AGENTS.md, CLAUDE.md e docs/HANDOFF.md. `docs/CUIDADOS-TECNICOS.md` não estava nesta branch; foi lido com `git show origin/ponte:docs/CUIDADOS-TECNICOS.md`.

## Correções

| Assunto | O que mudou | Commit |
|---|---|---|
| Toque no login | Impede que o mousedown do botão desfoque o campo e desloque o formulário antes do clique; toque e navegação por teclado continuam disponíveis. | `94633c8` |
| Zoom no login alternativo | Somente os dois campos receberam fonte fixa de 16px. | `3cd4d80` |
| Largura do recebimento | `min-w-0` nos campos flexíveis de valor e data, sem redesenhar o formulário. | `7160a74` |

## Tela por tela

“Sem bug” significa que não foi encontrado defeito claro no estado exercitado. Rotas escondidas foram verificadas quanto ao redirecionamento; suas chaves não foram ligadas para testar conteúdo fora do piloto.

| tela | problema | consertado? | commit |
|---|---|---|---|
| `/` | Sem bug claro no estado testado; captura, Console e rede registrados. | Sem bug encontrado | — |
| `/onboarding` | Inicio quando o cadastro já foi concluído; cadastro novo exercitado no fluxo. | Comportamento conferido | — |
| `/login` | Toque no botão podia perder o alvo quando o campo perdia o foco. | Sim | `94633c8` |
| `/cadastro` | Mesma tela de entrada e mesmo defeito de toque. | Sim | `94633c8` |
| `/entrar-email` | Campos de e-mail e senha tinham 14px, provocando zoom no Safari. | Sim | `3cd4d80` |
| `/auth/callback` | Retorna ao Inicio com sessão local. Provedor externo não validado. | Comportamento conferido | — |
| `/esqueci-senha` | Oculta pela chave do piloto: retorna ao Inicio. | Comportamento conferido | — |
| `/cadastro-obrigatorio` | Oculta pela chave do piloto: retorna ao Inicio. | Comportamento conferido | — |
| `/dashboard` | Sem bug claro no estado testado; captura, Console e rede registrados. | Sem bug encontrado | — |
| `/perfil` | Aviso de troca de número ainda diz “Falar no WhatsApp”, mas abre a Isa no app. | Decisão de produto; não alterado | — |
| `/mais` | Mesmo aviso da rota /perfil; texto mantido para decisão do Fernando. | Decisão de produto; não alterado | — |
| `/notas` | Sem bug claro no estado testado; captura, Console e rede registrados. | Sem bug encontrado | — |
| `/isa` | Sem bug claro no estado testado; captura, Console e rede registrados. | Sem bug encontrado | — |
| `/perfil/cnpj` | Sem bug claro no estado testado; captura, Console e rede registrados. | Sem bug encontrado | — |
| `/perfil/permissoes` | Sem bug claro no estado testado; captura, Console e rede registrados. | Sem bug encontrado | — |
| `/editar-perfil` | Mesmo aviso de troca de número. Salvamento do nome passou. | Decisão de produto; não alterado | — |
| `/preferencias` | Sem bug claro no estado testado; captura, Console e rede registrados. | Sem bug encontrado | — |
| `/alterar-senha` | Oculta pela chave do piloto: retorna ao Inicio. | Comportamento conferido | — |
| `/alterar-whatsapp` | Oculta pela chave do piloto: retorna ao Inicio. | Comportamento conferido | — |
| `/conectar-banco` | Oculta pela chave do piloto: retorna ao Inicio. | Comportamento conferido | — |
| `/conectar-banco/escolher` | Oculta pela chave do piloto: retorna ao Inicio. | Comportamento conferido | — |
| `/conectar-banco/retorno` | Oculta pela chave do piloto: retorna ao Inicio. | Comportamento conferido | — |
| `/conferir-entradas` | Sem pendências retorna ao Inicio; com extrato, confirmação completa testada. | Comportamento conferido | — |
| `/enviar-extrato` | Sem bug claro no estado testado; captura, Console e rede registrados. | Sem bug encontrado | — |
| `/conferir-saidas` | Sem pendências retorna ao Inicio; diesel foi classificado pelo importador. | Comportamento conferido | — |
| `/saidas` | Oculta pela chave do piloto: retorna ao Inicio. | Comportamento conferido | — |
| `/das` | Sem bug claro no estado testado; captura, Console e rede registrados. | Sem bug encontrado | — |
| `/das/historico` | Sem bug claro no estado testado; captura, Console e rede registrados. | Sem bug encontrado | — |
| `/faq` | Oculta pela chave do piloto: retorna ao Inicio. | Comportamento conferido | — |
| `/sobre` | Oculta pela chave do piloto: retorna ao Inicio. | Comportamento conferido | — |
| `/termos` | Resumo antigo mostra “atualizado em breve” e posicionamento de educação fiscal. | Decisão de produto; não alterado | — |
| `/termos-de-uso` | Texto sobre IA precisa ser conciliado com ISA_IA_ATIVA=false; sem alteração jurídica. | Decisão de produto; não alterado | — |
| `/privacidade` | Texto ainda menciona dados contados à Isa pelo WhatsApp; revisar coerência com o canal só de avisos. | Decisão de produto; não alterado | — |
| `/como-emitir-nota` | Diz que a Isa monta a nota em poucos minutos; ajuda atual usa respostas prontas. | Decisão de produto; não alterado | — |
| `/como-pagar-das` | Endereço antigo abre /das. | Comportamento conferido | — |
| `/suporte` | Sem bug claro no estado testado; captura, Console e rede registrados. | Sem bug encontrado | — |
| `/declaracao-anual` | Sem bug claro no estado testado; captura, Console e rede registrados. | Sem bug encontrado | — |
| `/declaracao-anual/calcular` | Endereço antigo abre /calcular/imposto-de-renda. | Comportamento conferido | — |
| `/calcular` | Sem bug claro no estado testado; captura, Console e rede registrados. | Sem bug encontrado | — |
| `/calcular/imposto-de-renda` | Sem bug claro no estado testado; captura, Console e rede registrados. | Sem bug encontrado | — |
| `/calcular/das-do-ano` | Sem bug claro no estado testado; captura, Console e rede registrados. | Sem bug encontrado | — |
| `/excluir-conta` | Sem bug claro no estado testado; captura, Console e rede registrados. | Sem bug encontrado | — |
| `/perfil/informacoes-fiscais` | Oculta pela chave do piloto: retorna ao Inicio. | Comportamento conferido | — |
| `/historico` | Sem bug claro no estado testado; captura, Console e rede registrados. | Sem bug encontrado | — |
| `/notas-fiscais` | Endereço antigo abre a aba /notas. | Comportamento conferido | — |
| `/notas-fiscais/minhas` | Sem bug claro no estado testado; captura, Console e rede registrados. | Sem bug encontrado | — |
| `/perfil/resumo` | Oculta pela chave do piloto: retorna ao Inicio. | Comportamento conferido | — |
| `/meu-lucro` | Sem bug claro no estado testado; captura, Console e rede registrados. | Sem bug encontrado | — |
| `/simulador` | Sem bug claro no estado testado; captura, Console e rede registrados. | Sem bug encontrado | — |
| `/meu-lucro/gastos` | Sem bug claro no estado testado; captura, Console e rede registrados. | Sem bug encontrado | — |
| `/alertas` | Oculta pela chave do piloto: retorna ao Inicio. | Comportamento conferido | — |
| `/regra-vinte` | Acesso direto mostra “passei” mesmo com faturamento zero; entrada normal é contextual. | Decisão de produto; não alterado | — |
| `/fisco` | Nome interno preservado; abre a aba /isa. | Comportamento conferido | — |
| `/lancar` | Campo de valor ultrapassava a largura da linha; data também recebeu min-width 0. | Sim | `7160a74` |
| `/lancar/limite-atingido` | Acesso direto mostra 8 lançamentos, mesmo logado; tela é destinada ao limite de visitante. | Decisão de produto; não alterado | — |
| `/velocimetro` | Oculta pela chave do piloto: retorna ao Inicio. | Comportamento conferido | — |
| `/dev/simulador` | Oculta pela chave do piloto: retorna ao Inicio. | Comportamento conferido | — |
| `/adicionar-faturamento` | Oculta pela chave do piloto: retorna ao Inicio. | Comportamento conferido | — |
| `/adicionar-faturamento/digitar` | Oculta pela chave do piloto: retorna ao Inicio. | Comportamento conferido | — |
| `/adicionar-faturamento/enviar` | Oculta pela chave do piloto: retorna ao Inicio. | Comportamento conferido | — |
| `/adicionar-faturamento/colar` | Oculta pela chave do piloto: retorna ao Inicio. | Comportamento conferido | — |
| `*` | Endereço desconhecido retorna ao Inicio, conforme a chave do piloto. | Comportamento conferido | — |

## Fluxos e resultados

| Fluxo | Resultado observado |
|---|---|
| Criar conta → onboarding | Nome, pular CNPJ, MEI Caminhoneiro, abertura anterior ao ano, tutorial e Inicio. Exercitado nos dois tamanhos. |
| Recebimento com nota | R$ 3.200; selo com nota e velocímetro atualizado. |
| Recebimento sem nota | Mais R$ 2.100; selo sem nota; total R$ 5.300. |
| Gasto manual | R$ 450 em diesel, aparece no Meu lucro. |
| Importar CSV | Não havia extrato de exemplo em docs/ ou public/. Foi usado CSV sintético local: crédito de R$ 850 e débito de R$ 180, em 18/10/2026. |
| Confirmação do extrato | Total continuou R$ 5.300 antes da resposta. Após “É frete/serviço”, passou a R$ 6.150. O débito de diesel foi classificado pelo importador. |
| Extrato repetido | Segundo envio identificou o mesmo arquivo e não duplicou o faturamento. |
| DAS | Pago sozinho, URL do Portal, opção Isa sem CNPJ (abre CNPJ), histórico e folha de outubro. Sistemas externos não foram operados. |
| Notas | Emitir nota → gov.br e Emitir nota → ajuda da Isa abriram os destinos corretos. Passo a passo e URL do Emissor Nacional conferidos. |
| Guardar nota | Nota local de R$ 500 guardada; apareceu em outubro. Responder “Não” à soma manteve o total R$ 6.150. Arquivo é opcional neste fluxo. |
| Isa | Seis perguntas prontas respondidas; histórico e nova conversa funcionaram; sem chamada a isa-chat. |
| Mais | CNPJ, DAS, Calcular, Declaração, Histórico, nome, tipo, WhatsApp, permissões, temas, suporte, tutorial, documentos, sair e excluir. |
| Tutorial | Quatro passos abertos, com os textos e desenhos existentes. Nenhum slide modificado. |
| Editar perfil | Nome alterado e confirmação de salvamento exibida. |
| IR | Cinco perguntas e resultado exercitados; valores e respostas sobreviveram à mudança de parâmetro da rota. Regras fiscais não foram alteradas nem auditadas juridicamente. |
| Sair → entrar novamente | Sessão saiu; mesmo número descartável entrou de novo com os R$ 6.150 preservados. |
| Excluir conta | Duas confirmações, palavra EXCLUIR e retorno às boas-vindas; só a conta descartável foi removida do simulador local. Conta 0001 permaneceu. |

## Console, rede e limitações

- Conferidos erros JavaScript, respostas HTTP, requisições canceladas, nomes visíveis, links externos, campos menores que 16px e excesso lateral. O conteúdo lateral do carrossel do velocímetro foi tratado como carrossel intencional, não como rolagem lateral da página.
- Houve cancelamentos ao trocar a página enquanto leituras do carregamento anterior ainda terminavam, avisos de service worker bloqueado na primeira configuração do teste e um recarregamento HMR interrompido enquanto o arquivo era corrigido. Esses eventos foram mantidos nos registros e rechecados com carregamento estável; não foram tratados como defeitos do produto.
- O HTTP 400 simulado de credenciais inexistentes no primeiro login da conta nova é esperado: a ponte cria a conta e prossegue. Cancelamentos causados pela troca de documento são separados de falhas da tela atual; os registros brutos anteriores à rechecagem ficam em `routes-before-retake.json`.
- Não foram encontrados links externos de WhatsApp nas telas verificadas; a checagem de código também passou. Nomes internos antigos da assistente foram preservados, sem aparecer como nome da assistente na interface testada.
- WebKit de desktop não abre teclado nativo do iPhone. A folha de nota foi exercitada com visualViewport reduzido para 315px e offsetTop de 100px; o campo ficou entre 271,5 e 321,5px, dentro da área visível até 415px. Isso não substitui conferir no Safari físico.
- Leitura de comprovante por IA, envio de OTP, consulta real de CNPJ, notificações push, ditado, câmera, armazenamento de arquivos no servidor e exclusão remota não foram validados contra serviços reais.
- `npx vite build` passou sem erro. Permaneceu o aviso já existente de pacote JavaScript maior que 500kB; não foi feito trabalho de otimização fora do escopo.
- `node scripts/checar-whatsapp.mjs` passou. Imports das alterações revisados; nenhuma dependência adicionada.
- Consolidação final: 124 registros de rota, 62 caminhos, nenhuma captura vazia, nenhum erro de JavaScript/Console, nenhum campo ativo abaixo de 16px e nenhum nome ou link proibido encontrado na interface. Permaneceram três requisições canceladas ao trocar de documento na captura de boas-vindas de 375px; não foram falhas de resposta da tela. Ao todo ficaram 303 PNG de rotas, fluxos e verificações. Detalhes em `summary.json`.

## O que precisa do Fernando decidir

1. Autorizar depois um teste integrado separado de OTP, CNPJ, arquivos, notificações e exclusão real. O pente fino atual deliberadamente não tocou no Supabase.
2. Conferir teclado físico em login, Editar perfil, Excluir conta, recebimento e chat; e ditado/notificações no iPhone. Há histórico de diferenças de visualViewport documentado no projeto; não repeti mudanças de layout já rejeitadas.
3. Aprovar a troca do rótulo “Falar no WhatsApp” no aviso de alteração do número. A ação já abre a Isa no app; nenhum link externo foi adicionado.
4. Conciliar textos que prometem IA, preparo de nota ou atendimento pelo WhatsApp com o funcionamento atual de respostas prontas e canal só de avisos. Mantive ISA_IA_ATIVA=false e não reescrevi textos de produto ou jurídicos.
5. Atualizar o resumo antigo em /termos (“atualizado em breve”, educação fiscal) ou decidir se ele deve continuar acessível por endereço direto.
6. Decidir se /regra-vinte e /lancar/limite-atingido devem redirecionar quando acessadas fora de contexto. Hoje o acesso direto pode mostrar “passei” com zero e o limite fixo de oito lançamentos, respectivamente; não alterei regras de entrada.
7. Antes do piloto real, decidir quando desligar MODO_TESTE_LOGIN. Ficou ligado como pedido para esta revisão.

## Evidências locais

Capturas e logs JSON por tela, incluindo chamadas simuladas e recursos de rede:

`C:\Users\ferna\AppData\Local\Temp\tacerto-pente-fino-19-10\`

Arquivos principais: `routes-all.json`, `routes-375.json`, `routes-390.json`, `flow-375.json`, `flow-390.json` e `scroll-all.json`. Os PNG usam o tamanho e a rota/etapa no nome. São dados sintéticos locais; não incluem credenciais. Os arquivos de imagem ficam fora do Git. Os scripts temporários estão em `node_modules/.tacerto-teste/pente-*.cjs`.

Push autorizado exclusivamente para `codex/pente-fino`. Nenhuma alteração em main, piloto-simplificado, slides, Supabase ou projeto de site.
