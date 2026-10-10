-- SQL-PENDENTE-08-10 v1 — bloco UNICO do banco para a tarefa de 08-10
--   (CNPJ, velocimetro, extrato, "Meu lucro", notas, lembrete do DAS).
--   Escrito em 10/10/2026. ESPERANDO O "PODE" DO FERNANDO.
--
-- ===================================================================
-- O QUE ESTE BLOCO FAZ (em portugues simples)
--
-- So ACRESCENTA coisas. Nao apaga, nao troca e nao mexe em nenhum dado
-- que ja existe. Pode rodar mais de uma vez sem estragar nada (tudo e
-- "se ainda nao existir").
--
-- 1) PERFIS (a ficha de cada pessoa) ganha 10 campos novos, todos
--    opcionais:
--      cnpj, cnae (atividade principal), cnaes_secundarios (as outras
--      atividades), data_opcao_mei (desde quando e MEI),
--      cnpj_confirmado (a pessoa disse "Esta certo"),
--      velocimetro_atualizado_em (data e hora da ultima atualizacao),
--      lembrete_das_dias (padrao: 7 dias antes, 2 dias antes e no dia),
--      lembrete_das_hora (horario do lembrete),
--      nota_automatica_ativa (o Fernando liga a mao quando o
--      certificado A1 da pessoa estiver pronto).
-- 2) ENTRADAS (o que caiu na conta) ganha "categoria" (frete,
--    reembolso, vale-pedagio, emprestimo, estorno, pessoal...) e
--    "chave_unica" (a "impressao digital" de cada transacao do extrato:
--    mandar o mesmo extrato 2 vezes nao conta 2 vezes).
-- 3) SAIDAS (o que saiu da conta) ganha "categoria" (diesel, pedagio,
--    pneus...), "com_nota" (tem nota/comprovante), "do_negocio" (e
--    gasto do caminhao; vazio = pessoal) e "chave_unica".
-- 4) TABELA NOVA "extratos_enviados": um registro por extrato enviado
--    pelo app (tipo, situacao "em analise"/"lido", periodo). Cada
--    pessoa so ve e mexe nas proprias linhas (RLS) e o app tem
--    permissao de ler e gravar (GRANT) — sem o GRANT o app daria 403.
-- 5) ARQUIVOS: o PDF do extrato vai para a pasta
--    comprovantes/<id da pessoa>/extratos/ no balde "comprovantes" que
--    JA EXISTE (privado, so PDF/foto, ate 10 MB, cada um so na propria
--    pasta). Por isso nao precisa de balde novo nem de regra nova.
--
-- O app ja foi escrito para funcionar ANTES deste SQL rodar (le e grava
-- com cuidado; se a coluna nao existir, segue sem ela). Depois de rodar,
-- os dados novos passam a ficar guardados no banco.
--
-- PARA VOLTAR ATRAS (so com "pode apagar" do Fernando): tirar as
-- colunas novas e a tabela extratos_enviados. Nenhum dado antigo muda.
-- Copia dos dados de antes: backups/2026-10-10_antes_sql_08-10.json
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
do $$
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
end $$;


-- -------------------------------------------------------------------
-- 5) O app (PostgREST) enxergar as colunas novas na hora
-- -------------------------------------------------------------------
notify pgrst, 'reload schema';


-- ===================================================================
-- CONFERENCIA (rodar depois; so leitura)
-- ===================================================================
-- a) colunas novas (tem que vir 18 linhas)
-- select table_name, column_name, data_type, column_default
-- from information_schema.columns
-- where table_schema = 'public'
--   and ((table_name = 'perfis' and column_name in ('cnpj','cnae','cnaes_secundarios','data_opcao_mei',
--          'cnpj_confirmado','velocimetro_atualizado_em','lembrete_das_dias','lembrete_das_hora','nota_automatica_ativa'))
--     or (table_name = 'entradas' and column_name in ('categoria','chave_unica'))
--     or (table_name = 'saidas' and column_name in ('categoria','com_nota','do_negocio','chave_unica'))
--     or (table_name = 'extratos_enviados' and column_name in ('id','user_id','status')))
-- order by table_name, column_name;
--
-- b) extratos_enviados: RLS ligado, 4 politicas e as 4 permissoes
-- select rowsecurity from pg_tables where schemaname = 'public' and tablename = 'extratos_enviados';
-- select policyname, cmd from pg_policies where tablename = 'extratos_enviados' order by 1;
-- select has_table_privilege('authenticated','public.extratos_enviados','SELECT') as ler,
--        has_table_privilege('authenticated','public.extratos_enviados','INSERT') as inserir,
--        has_table_privilege('anon','public.extratos_enviados','SELECT') as anon_ler;  -- anon_ler = false
