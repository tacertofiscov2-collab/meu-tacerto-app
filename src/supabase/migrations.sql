-- MIGRATIONS v5 — + PARTE 4D: SQL de 08-10 (CNPJ e lembrete do DAS no
--   perfil, categoria/chave_unica em entradas e saidas, tabela
--   extratos_enviados). RODADO em 10/10/2026 pelo conector, com o "pode"
--   do Fernando; conferido (colunas, RLS, politicas, GRANT, logs, advisors).
-- MIGRATIONS v4 — + PARTE 4C: tira o EXECUTE de handle_new_user e
--   rls_auto_enable para o app (advisors de segurança). Rodado em 03/10.
-- MIGRATIONS v3 — GRANT das 4 tabelas de 28/09 RODADO no banco real em
--   03/10/2026 (pelo conector, com o "pode" do Fernando). Conferido: as 4
--   leem e gravam para quem está logado; deslogado continua sem acesso.
-- MIGRATIONS v2 — + PARTE 4B: tabelas de 28/09 (saidas, das_pagamentos,
--   notas_fiscais, comprovantes), perfis.segmento_ir, balde "comprovantes"
--   e as regras de acesso, copiados do banco real em 03/10/2026 (antes só
--   existiam no banco, não no Git).
-- ===================================================================
-- TaCerto! — MIGRAÇÃO DO BANCO
--
-- Este arquivo monta o banco INTEIRO do zero. Rode no Supabase:
--   painel do projeto → SQL Editor → New query → cole tudo → Run
--
-- É seguro rodar mais de uma vez: tudo usa "if not exists" e as
-- policies são recriadas.
--
-- ⚠️ POR QUE ESTE ARQUIVO EXISTE
-- Em 30/08/2026 o app passou horas dando 403 Forbidden nas tabelas do
-- Open Finance. Três tentativas mexeram nas policies RLS e nenhuma
-- resolveu, porque o problema era OUTRO: faltava GRANT.
--
-- A distinção que custou uma sessão inteira:
--   • RLS negando um SELECT   → devolve 200 com LISTA VAZIA
--   • Falta de GRANT          → devolve 403 Forbidden (código 42501,
--                               "permission denied for table")
--
-- Criar tabela pelo SQL Editor NÃO concede SELECT/INSERT/UPDATE/DELETE
-- ao role `authenticated` automaticamente. Sem o GRANT, o app não lê
-- nada — por mais correta que a policy esteja.
--
-- GRANT abre a porta. POLICY diz quem passa. Precisa dos dois.
-- ===================================================================


-- ===================================================================
-- PARTE 1 — TABELAS QUE JÁ EXISTIAM (colunas adicionadas depois)
-- ===================================================================

-- WhatsApp: é o canal de atendimento do TaCerto, por isso o número é
-- obrigatório no cadastro.
alter table perfis add column if not exists whatsapp text;

-- ⚠️ NÃO usar `mes_abertura` nem `tipo_mei` para decidir se a pessoa
-- já fez o onboarding:
--   • mes_abertura é NULL para quem responde "já faz tempo"
--   • tipo_mei o trigger já preenche com "MEI"
-- Esta coluna é a única fonte confiável. Marcada como true só quando o
-- Onboarding conclui de verdade.
alter table perfis add column if not exists onboarding_ok boolean default false;


-- ===================================================================
-- PARTE 2 — TABELAS DO OPEN FINANCE
-- ===================================================================

-- -------------------------------------------------------------------
-- CONEXOES BANCARIAS
-- Cada conta que o usuário autorizou pelo Open Finance.
-- O Pluggy chama isso de "item" — guardamos o id dele para pedir as
-- transações depois.
-- -------------------------------------------------------------------
create table if not exists conexoes_bancarias (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,

  pluggy_item_id  text not null,
  instituicao     text,
  numero_conta    text,

  status          text not null default 'ativa',
                  -- ativa | erro | desconectada
                  -- 'erro' quando o banco pede nova autorização

  ultima_sync     timestamptz,
  criado_em       timestamptz not null default now(),

  unique (user_id, pluggy_item_id)
);

create index if not exists idx_conexoes_user
  on conexoes_bancarias (user_id);


-- -------------------------------------------------------------------
-- ENTRADAS
-- A "sala de espera": tudo que caiu na conta e ainda não virou (ou não
-- vai virar) lançamento.
--
-- ⚠️ NADA ENTRA NO VELOCÍMETRO SEM O USUÁRIO CONFIRMAR.
-- Presente não é receita. Transferência entre contas próprias não é.
-- Empréstimo devolvido não é. Conta misturada PF/PJ é a regra no
-- público do app — se somar tudo, o velocímetro mente, e faz a pessoa
-- emitir nota de dinheiro que não é serviço prestado.
-- -------------------------------------------------------------------
create table if not exists entradas (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null references auth.users(id) on delete cascade,
  conexao_id             uuid references conexoes_bancarias(id) on delete set null,

  pluggy_transaction_id  text not null,

  descricao              text,          -- como veio do banco (bagunçado)
  valor                  numeric(14,2) not null,
  data                   timestamptz not null,

  -- Quem mandou o dinheiro. É com isso que o Fisco aprende.
  pagador_nome           text,
  pagador_documento      text,          -- CPF ou CNPJ, só dígitos
  pagador_tipo           text,          -- 'CPF' | 'CNPJ' | null
  meio                   text,          -- 'PIX' | 'TED' | 'DOC'...

  status                 text not null default 'pendente',
                         -- pendente    → o Fisco ainda vai perguntar
                         -- faturamento → virou lançamento
                         -- ignorada    → não é receita

  lancamento_id          uuid,
  classificada_por       text,          -- 'usuario' | 'regra' | 'auto'
  classificada_em        timestamptz,

  criado_em              timestamptz not null default now(),

  -- ⚠️ TRAVA CONTRA DUPLICATA — a mais importante desta tabela.
  -- Sem ela, cada sincronização traria as mesmas transações de novo e
  -- o velocímetro contaria dobrado.
  unique (user_id, pluggy_transaction_id)
);

create index if not exists idx_entradas_user_status
  on entradas (user_id, status);

create index if not exists idx_entradas_user_data
  on entradas (user_id, data desc);

create index if not exists idx_entradas_pagador
  on entradas (user_id, pagador_documento);


-- -------------------------------------------------------------------
-- REGRAS DE PAGADOR
-- O aprendizado do Fisco. Na primeira vez ele pergunta; a partir da
-- segunda, já sabe.
--
-- ⚠️ A chave é o DOCUMENTO, não o nome. O mesmo pagador aparece como
-- "TRANSPORTES ALMEIDA LTDA" e "TRANSP ALMEIDA", mas o CNPJ é sempre o
-- mesmo.
-- -------------------------------------------------------------------
create table if not exists regras_pagador (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users(id) on delete cascade,

  pagador_documento  text not null,     -- só dígitos
  pagador_nome       text,              -- último nome visto, pra exibir

  acao               text not null,
                     -- faturamento → entra no velocímetro sozinho
                     -- ignorar     → nunca entra
                     -- perguntar   → sempre pergunta (o padrão)

  emitir_nota        boolean default false,

  vezes_aplicada     integer not null default 0,
  criado_em          timestamptz not null default now(),
  atualizado_em      timestamptz not null default now(),

  unique (user_id, pagador_documento)
);

create index if not exists idx_regras_user
  on regras_pagador (user_id);


-- -------------------------------------------------------------------
-- PREFERENCIAS DO FISCO
-- Como cada usuário quer que o Fisco trabalhe. Uma linha por usuário.
--
-- ⚠️ Estas preferências NÃO são perguntadas no cadastro. Nascem da
-- conversa: no primeiro Pix o Fisco pergunta, e depois oferece "quer
-- que eu faça sempre assim?".
-- -------------------------------------------------------------------
create table if not exists preferencias_fisco (
  user_id              uuid primary key references auth.users(id) on delete cascade,

  modo_classificacao   text not null default 'perguntar',
                       -- perguntar  → pergunta tudo (padrão, mais seguro)
                       -- por_regra  → usa as regras; pergunta só se o
                       --              pagador for novo
                       -- automatico → tudo que entra é faturamento

  -- ⚠️ CUIDADO: muito cliente de caminhoneiro é pessoa física — frete
  -- de mudança, entrega para quem não tem empresa. Quando ligado, as
  -- entradas de CPF NÃO somem caladas: vão para um resumo no fim do mês
  -- ("ignorei 4 entradas de CPF, quer conferir?").
  ignorar_cpf          boolean not null default false,

  modo_nota            text not null default 'perguntar',
                       -- perguntar | automatico | nunca

  horario_resumo       time not null default '20:30',
                       -- 20:30 porque o Open Finance não atualiza em
                       -- tempo real
  frequencia_resumo    text not null default 'diario',
                       -- diario | semanal | mensal | nunca

  lembrete_das         boolean not null default true,
  dias_antes_das       integer not null default 3,

  criado_em            timestamptz not null default now(),
  atualizado_em        timestamptz not null default now()
);


-- ===================================================================
-- PARTE 3 — GRANTS
--
-- ⚠️ ESTA É A PARTE QUE FALTAVA E CUSTOU UMA SESSÃO INTEIRA.
--
-- Sem isto o app devolve 403 Forbidden em toda leitura, mesmo com as
-- policies corretas. O role `authenticated` fica com TRUNCATE, TRIGGER
-- e REFERENCES, mas sem SELECT — ou seja, pode apagar a tabela inteira
-- e não pode ler uma linha.
--
-- `anon` fica de fora de propósito: usuário deslogado não tem por que
-- ler entrada bancária de ninguém.
-- ===================================================================

grant usage on schema public to anon, authenticated;

grant select, insert, update, delete
  on entradas, regras_pagador, preferencias_fisco, conexoes_bancarias
  to authenticated;


-- ===================================================================
-- PARTE 4 — RLS
--
-- O app usa a chave anon, que é pública. Sem RLS, qualquer pessoa com
-- a chave leria os dados de todos os usuários.
--
-- GRANT abre a porta. POLICY diz quem passa. Precisa dos dois.
-- ===================================================================

alter table conexoes_bancarias enable row level security;
alter table entradas           enable row level security;
alter table regras_pagador     enable row level security;
alter table preferencias_fisco enable row level security;

drop policy if exists "conexoes_proprias" on conexoes_bancarias;
create policy "conexoes_proprias" on conexoes_bancarias
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "entradas_proprias" on entradas;
create policy "entradas_proprias" on entradas
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "regras_proprias" on regras_pagador;
create policy "regras_proprias" on regras_pagador
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "preferencias_proprias" on preferencias_fisco;
create policy "preferencias_proprias" on preferencias_fisco
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- ===================================================================
-- PARTE 4B — SAÍDAS, DAS, NOTAS E COMPROVANTES (28/09/2026)
--
-- Rodado direto no SQL Editor em 28/09. Copiado do banco real em
-- 03/10 (colunas, chaves, índices, policies e balde conferidos um a um).
--
-- ⚠️ Até 03/10 o banco real NÃO tinha os GRANTs destas 4 tabelas (o
-- mesmo erro de 30/08, ver topo do arquivo): o role `authenticated`
-- não podia ler nem gravar nelas, e as telas Saídas, DAS e Notas
-- falhavam. O bloco de GRANT abaixo foi RODADO em 03/10 (antes, foi
-- conferido que as 4 tabelas tinham RLS ligado e as policies "só as
-- próprias linhas").
-- ===================================================================

-- Segmento para o cálculo do IR (presunção de lucro):
--   comercio_carga 8% | passageiros 16% | servicos 32%
alter table public.perfis add column if not exists segmento_ir text;

-- -------------------------------------------------------------------
-- SAIDAS
-- Saídas do banco (origem 'banco') e lançadas à mão (origem 'manual',
-- pluggy_transaction_id = 'manual-<código>'). Guardadas sem perguntar.
-- -------------------------------------------------------------------
create table if not exists public.saidas (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references auth.users(id) on delete cascade,
  conexao_id            uuid,
  pluggy_transaction_id text not null,
  origem                text not null default 'banco',
  descricao             text,
  valor                 numeric not null default 0,
  data                  timestamptz not null,
  recebedor_nome        text,
  recebedor_documento   text,
  recebedor_tipo        text,
  meio                  text,
  criado_em             timestamptz not null default now(),
  unique (user_id, pluggy_transaction_id)
);
create index if not exists saidas_user_data on public.saidas (user_id, data desc);

-- -------------------------------------------------------------------
-- DAS_PAGAMENTOS
-- Um registro por mês ("AAAA-MM"). O app NUNCA diz que uma DAS está
-- "em aberto": só registra o que a pessoa informou ou achou nas saídas.
-- -------------------------------------------------------------------
create table if not exists public.das_pagamentos (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  competencia   text not null,
  valor         numeric,
  pago_em       timestamptz,
  origem        text not null default 'manual',
  arquivo_path  text,
  arquivo_tipo  text,
  nome_arquivo  text,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (user_id, competencia)
);

-- -------------------------------------------------------------------
-- NOTAS_FISCAIS
-- origem 'manual' (lançada à mão) | 'app'. Arquivo no balde
-- "comprovantes", pasta <user_id>/notas/.
-- -------------------------------------------------------------------
create table if not exists public.notas_fiscais (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  origem            text not null default 'manual',
  numero            text,
  data              timestamptz not null,
  valor             numeric not null default 0,
  tomador_nome      text,
  tomador_documento text,
  descricao         text,
  arquivo_path      text,
  arquivo_tipo      text,
  nome_arquivo      text,
  criado_em         timestamptz not null default now()
);
create index if not exists notas_fiscais_user_data on public.notas_fiscais (user_id, data desc);

-- -------------------------------------------------------------------
-- COMPROVANTES
-- Comprovante de despesa (foto/PDF), opcionalmente ligado a uma saída.
-- ⚠️ Em 03/10 o app ainda NÃO usa esta tabela (nenhum código lê ou
-- grava nela). Existe no banco, vazia. `saida_id` não tem chave
-- estrangeira de propósito? Não se sabe — ficou como estava.
-- -------------------------------------------------------------------
create table if not exists public.comprovantes (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  saida_id     uuid,
  origem       text not null default 'manual',
  arquivo_path text not null,
  arquivo_tipo text,
  nome_arquivo text,
  descricao    text,
  valor        numeric,
  data         timestamptz not null default now(),
  criado_em    timestamptz not null default now()
);
create index if not exists comprovantes_user_data on public.comprovantes (user_id, data desc);

-- -------------------------------------------------------------------
-- GRANTS (ver ⚠️ no começo desta parte) — rodado em 03/10/2026
-- -------------------------------------------------------------------
grant select, insert, update, delete
  on public.saidas, public.das_pagamentos, public.notas_fiscais, public.comprovantes
  to authenticated;

-- -------------------------------------------------------------------
-- RLS — cada pessoa só vê e mexe nas próprias linhas
-- (no banco real as policies estão "to public"; quem não está logado
-- tem auth.uid() vazio e não passa em nenhuma)
-- -------------------------------------------------------------------
alter table public.saidas         enable row level security;
alter table public.das_pagamentos enable row level security;
alter table public.notas_fiscais  enable row level security;
alter table public.comprovantes   enable row level security;

drop policy if exists "saidas: ver as proprias"       on public.saidas;
drop policy if exists "saidas: inserir as proprias"   on public.saidas;
drop policy if exists "saidas: atualizar as proprias" on public.saidas;
drop policy if exists "saidas: apagar as proprias"    on public.saidas;
create policy "saidas: ver as proprias"       on public.saidas for select using (auth.uid() = user_id);
create policy "saidas: inserir as proprias"   on public.saidas for insert with check (auth.uid() = user_id);
create policy "saidas: atualizar as proprias" on public.saidas for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "saidas: apagar as proprias"    on public.saidas for delete using (auth.uid() = user_id);

drop policy if exists "das: ver as proprias"       on public.das_pagamentos;
drop policy if exists "das: inserir as proprias"   on public.das_pagamentos;
drop policy if exists "das: atualizar as proprias" on public.das_pagamentos;
drop policy if exists "das: apagar as proprias"    on public.das_pagamentos;
create policy "das: ver as proprias"       on public.das_pagamentos for select using (auth.uid() = user_id);
create policy "das: inserir as proprias"   on public.das_pagamentos for insert with check (auth.uid() = user_id);
create policy "das: atualizar as proprias" on public.das_pagamentos for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "das: apagar as proprias"    on public.das_pagamentos for delete using (auth.uid() = user_id);

drop policy if exists "notas: ver as proprias"       on public.notas_fiscais;
drop policy if exists "notas: inserir as proprias"   on public.notas_fiscais;
drop policy if exists "notas: atualizar as proprias" on public.notas_fiscais;
drop policy if exists "notas: apagar as proprias"    on public.notas_fiscais;
create policy "notas: ver as proprias"       on public.notas_fiscais for select using (auth.uid() = user_id);
create policy "notas: inserir as proprias"   on public.notas_fiscais for insert with check (auth.uid() = user_id);
create policy "notas: atualizar as proprias" on public.notas_fiscais for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "notas: apagar as proprias"    on public.notas_fiscais for delete using (auth.uid() = user_id);

drop policy if exists "comprovantes: ver os proprios"       on public.comprovantes;
drop policy if exists "comprovantes: inserir os proprios"   on public.comprovantes;
drop policy if exists "comprovantes: atualizar os proprios" on public.comprovantes;
drop policy if exists "comprovantes: apagar os proprios"    on public.comprovantes;
create policy "comprovantes: ver os proprios"       on public.comprovantes for select using (auth.uid() = user_id);
create policy "comprovantes: inserir os proprios"   on public.comprovantes for insert with check (auth.uid() = user_id);
create policy "comprovantes: atualizar os proprios" on public.comprovantes for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "comprovantes: apagar os proprios"    on public.comprovantes for delete using (auth.uid() = user_id);

-- -------------------------------------------------------------------
-- BALDE "comprovantes" (Storage) — privado, só foto/PDF, até 10 MB.
-- Cada pessoa só mexe na própria pasta: comprovantes/<user_id>/...
-- (DAS em <user_id>/..., notas em <user_id>/notas/...)
-- -------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('comprovantes', 'comprovantes', false, 10485760,
        array['image/jpeg','image/png','image/webp','image/heic','image/heif','application/pdf'])
on conflict (id) do nothing;

drop policy if exists "comprovantes: ver arquivos proprios"    on storage.objects;
drop policy if exists "comprovantes: enviar arquivos proprios" on storage.objects;
drop policy if exists "comprovantes: apagar arquivos proprios" on storage.objects;
create policy "comprovantes: ver arquivos proprios" on storage.objects
  for select to authenticated
  using (bucket_id = 'comprovantes' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "comprovantes: enviar arquivos proprios" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'comprovantes' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "comprovantes: apagar arquivos proprios" on storage.objects
  for delete to authenticated
  using (bucket_id = 'comprovantes' and (storage.foldername(name))[1] = auth.uid()::text);


-- ===================================================================
-- PARTE 4C — FUNÇÕES-GATILHO FORA DO ALCANCE DO APP (03/10/2026)
--
-- Os advisors de segurança apontavam que qualquer um (logado ou não)
-- podia "chamar" estas funções pelo endereço /rest/v1/rpc/...
--   • handle_new_user  → gatilho que cria o perfil no cadastro
--                        (on_auth_user_created em auth.users)
--   • rls_auto_enable  → gatilho que liga o RLS em toda tabela nova
--                        (event trigger ensure_rls)
-- Por serem gatilhos, o banco já recusava a chamada direta — o risco
-- era nulo, mas o certo é não deixar a porta aberta. Os gatilhos
-- continuam funcionando: o Postgres não confere EXECUTE quando o
-- gatilho dispara. O grant para supabase_auth_admin (quem faz o
-- cadastro) é precaução.
-- Conferido em 03/10: anon/authenticated sem EXECUTE, gatilhos
-- ligados, os 2 avisos sumiram, logs sem erro.
-- Para voltar atrás: grant execute on function ... to public;
-- ===================================================================

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
grant  execute on function public.handle_new_user() to supabase_auth_admin;


-- ===================================================================
-- PARTE 4D — CNPJ, EXTRATO, "MEU LUCRO" E LEMBRETE DO DAS (08-10)
--
-- RODADO em 10/10/2026 (migration "tacerto_08_10_cnpj_extrato_lucro_lembrete").
-- Copia de antes: backups/2026-10-10_antes_sql_08-10.json.
-- So ACRESCENTA (nada apagado). O texto explicado em portugues simples
-- esta em docs/SQL-PENDENTE-08-10.sql.
-- Conferido depois: 18 colunas novas; extratos_enviados com RLS, 4
-- politicas "so as proprias linhas" e GRANT para authenticated (anon sem
-- acesso); perfis/entradas/saidas/lancamentos com as mesmas quantidades
-- de antes (21/34/200/29); logs sem erro; advisors sem aviso novo.
-- O PDF do extrato vai para o balde "comprovantes" que ja existia
-- (pasta <user_id>/extratos/), com as politicas da PARTE 4B.
-- ===================================================================

-- -------------------------------------------------------------------
-- 1) PERFIS
-- -------------------------------------------------------------------
alter table public.perfis add column if not exists cnpj                      text;
alter table public.perfis add column if not exists cnae                      text;
alter table public.perfis add column if not exists cnaes_secundarios         text[];
alter table public.perfis add column if not exists data_opcao_mei            date;
alter table public.perfis add column if not exists cnpj_confirmado           boolean default false;
alter table public.perfis add column if not exists velocimetro_atualizado_em timestamptz;
alter table public.perfis add column if not exists lembrete_das_dias         integer[] default '{7,2,0}';
alter table public.perfis add column if not exists lembrete_das_hora         text;
alter table public.perfis add column if not exists nota_automatica_ativa     boolean default false;


-- -------------------------------------------------------------------
-- 2) ENTRADAS
-- A trava contra duplicata de sempre continua (user_id +
-- pluggy_transaction_id). O extrato grava "extrato-<chave_unica>" nela.
-- O indice abaixo e uma segunda trava, so para as linhas com chave.
-- -------------------------------------------------------------------
alter table public.entradas add column if not exists categoria   text;
alter table public.entradas add column if not exists chave_unica text;
create unique index if not exists entradas_user_chave_unica
  on public.entradas (user_id, chave_unica)
  where chave_unica is not null;


-- -------------------------------------------------------------------
-- 3) SAIDAS
-- -------------------------------------------------------------------
alter table public.saidas add column if not exists categoria   text;
alter table public.saidas add column if not exists com_nota    boolean default false;
alter table public.saidas add column if not exists do_negocio  boolean;
alter table public.saidas add column if not exists chave_unica text;
create unique index if not exists saidas_user_chave_unica
  on public.saidas (user_id, chave_unica)
  where chave_unica is not null;


-- -------------------------------------------------------------------
-- 4) EXTRATOS_ENVIADOS
-- -------------------------------------------------------------------
create table if not exists public.extratos_enviados (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  arquivo_path   text,              -- so o PDF (comprovantes/<user_id>/extratos/...)
  nome_arquivo   text,
  tipo           text not null,     -- ofx | csv | pdf
  status         text not null default 'em_analise',
                                    -- em_analise | lido | erro
  periodo_inicio date,
  periodo_fim    date,
  qtd_entradas   integer,
  qtd_saidas     integer,
  criado_em      timestamptz not null default now()
);
create index if not exists extratos_enviados_user
  on public.extratos_enviados (user_id, criado_em desc);

-- GRANT abre a porta. POLICY diz quem passa. Precisa dos dois.
grant select, insert, update, delete on public.extratos_enviados to authenticated;
alter table public.extratos_enviados enable row level security;

-- Politicas "so as proprias linhas" (criadas so se ainda nao existirem;
-- sem DROP)
do $
begin
  if not exists (select 1 from pg_policies where schemaname = 'public'
                 and tablename = 'extratos_enviados' and policyname = 'extratos: ver os proprios') then
    create policy "extratos: ver os proprios" on public.extratos_enviados
      for select to authenticated using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public'
                 and tablename = 'extratos_enviados' and policyname = 'extratos: inserir os proprios') then
    create policy "extratos: inserir os proprios" on public.extratos_enviados
      for insert to authenticated with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public'
                 and tablename = 'extratos_enviados' and policyname = 'extratos: atualizar os proprios') then
    create policy "extratos: atualizar os proprios" on public.extratos_enviados
      for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public'
                 and tablename = 'extratos_enviados' and policyname = 'extratos: apagar os proprios') then
    create policy "extratos: apagar os proprios" on public.extratos_enviados
      for delete to authenticated using (auth.uid() = user_id);
  end if;
end $;


-- -------------------------------------------------------------------
-- 5) O app (PostgREST) enxergar as colunas novas na hora
-- -------------------------------------------------------------------
notify pgrst, 'reload schema';


-- ===================================================================
-- PARTE 5 — CONFERÊNCIA
-- Rode depois de tudo. As duas consultas precisam vir certas.
-- ===================================================================

-- 1) As 4 tabelas com RLS ligado
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in ('conexoes_bancarias','entradas','regras_pagador','preferencias_fisco')
order by tablename;

-- 2) As 16 permissões (4 tabelas × SELECT/INSERT/UPDATE/DELETE)
--    ⚠️ Se esta vier vazia ou incompleta, o app vai dar 403.
select grantee, table_name, privilege_type
from information_schema.role_table_grants
where table_name in ('entradas','regras_pagador','preferencias_fisco','conexoes_bancarias')
  and grantee = 'authenticated'
  and privilege_type in ('SELECT','INSERT','UPDATE','DELETE')
order by table_name, privilege_type;

-- 3) Tabelas de 28/09: as 4 colunas precisam vir "true".
--    ⚠️ Em 03/10 vieram todas "false" (faltava o GRANT da Parte 4B);
--    depois do GRANT, todas "true".
select t as tabela,
  has_table_privilege('authenticated', 'public.'||t, 'SELECT') as pode_ler,
  has_table_privilege('authenticated', 'public.'||t, 'INSERT') as pode_inserir,
  has_table_privilege('authenticated', 'public.'||t, 'UPDATE') as pode_atualizar,
  has_table_privilege('authenticated', 'public.'||t, 'DELETE') as pode_apagar
from unnest(array['saidas','das_pagamentos','notas_fiscais','comprovantes']) as t;


-- ===================================================================
-- PARTE 6 — DADOS DE TESTE (opcional)
--
-- Só para desenvolver enquanto o Pluggy não está ativo.
-- Troque o e-mail pelo usuário que você usa para testar.
--
-- Os dados são PIORES que os de um sandbox de propósito: nome em caixa
-- alta com abreviação, código do banco no meio da descrição, valor
-- quebrado. Se a classificação funcionar com isto, aguenta extrato
-- real.
--
-- ⚠️ tx-001 e tx-003 têm o MESMO CNPJ com nomes diferentes — é o teste
-- do aprendizado por documento.
-- ===================================================================

insert into entradas (
  user_id, pluggy_transaction_id, descricao, valor, data,
  pagador_nome, pagador_documento, pagador_tipo, meio, status
)
select
  u.id, v.tx, v.descricao, v.valor, v.data,
  v.nome, v.doc, v.tipo, v.meio, 'pendente'
from auth.users u
cross join (values
  ('tx-001','PIX RECEBIDO TRANSPORTES ALMEIDA LTDA', 1850.00, now() - interval '2 hours',  'TRANSPORTES ALMEIDA LTDA','12345678000190','CNPJ','PIX'),
  ('tx-002','PIX REC MARIA S FARIA',                  200.00, now() - interval '5 hours',  'MARIA S FARIA','98765432100','CPF','PIX'),
  ('tx-003','TED 341 TRANSP ALMEIDA',                2400.50, now() - interval '1 day',    'TRANSP ALMEIDA','12345678000190','CNPJ','TED'),
  ('tx-004','PIX RECEBIDO FERNANDO FARIA',            500.00, now() - interval '2 days',   'FERNANDO FARIA','11122233344','CPF','PIX'),
  ('tx-005','PIX RECEBIDO COOPERATIVA DE CARGAS SUL',3120.75, now() - interval '3 days',   'COOPERATIVA DE CARGAS SUL','45678912000133','CNPJ','PIX')
) as v(tx, descricao, valor, data, nome, doc, tipo, meio)
where u.email = 'fernandofaria1346@gmail.com'
on conflict (user_id, pluggy_transaction_id) do nothing;

-- Total esperado na faixa: R$ 8.071,25 em 5 entradas

-- Para limpar e testar de novo:
-- delete from entradas where pluggy_transaction_id like 'tx-00%';