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