/* SQL-PENDENTE-NOTIFICACOES v2 — aviso no FIM DA PARTE 1: no passo 2, rodar só até ali (o arquivo inteiro para na trava da PARTE 2) (v1: notificação da semana no celular: tabela inscricoes_push, função faturado_ano_para_aviso e (PARTE 2) o despertador de toda segunda). AINDA NÃO RODADO: espera o "pode" do Fernando. */
--   Escrito em 12/10/2026 (sessão na nuvem, sem acesso ao Supabase).
--   Passo a passo completo (ordem, segredos, teste no iPhone):
--   docs/NOTIFICACOES.md
--   Antes de rodar: conferir no banco (só leitura) se algo já existe e
--   guardar a cópia (rotina do CLAUDE.md).
--   Depois de rodar: copiar o que rodou para src/supabase/migrations.sql
--   (uma PARTE nova, com a data) — SEM a senha de verdade (deixar os
--   marcadores <URL_DO_PROJETO> e <SEGREDO>).
--
-- ===================================================================
-- O QUE ESTE ARQUIVO FAZ (em português simples)
--
-- Tem DUAS partes, rodadas em momentos diferentes.
--
-- PARTE 1 (passo 2 do docs/NOTIFICACOES.md):
--   1) Cria a tabela "inscricoes_push": cada linha é UM CELULAR que
--      aceitou receber a notificação da semana. Guarda o "endereço" do
--      celular no serviço de entrega da Apple/Google (endpoint) e duas
--      chaves que trancam a mensagem (p256dh e auth) — como o endereço e
--      a chave de uma caixa de correio. NÃO guarda faturamento.
--      - Cada pessoa só vê e mexe nas próprias linhas (RLS).
--      - O app pode ler, criar e atualizar (GRANT), mas NÃO pode apagar:
--        para desligar, o app marca "ativa = não".
--      - Se a pessoa excluir a conta, as linhas dela saem junto (como os
--        lançamentos).
--   2) Cria a função "faturado_ano_para_aviso": soma o faturamento do ano
--      de quem ligou a notificação, do mesmo jeito que o velocímetro do
--      app. SÓ o servidor (a função aviso-semanal) pode usar; o app e
--      quem não está logado, não.
--
-- PARTE 2 (passo 5 — rodar SÓ DEPOIS de colocar os segredos e publicar a
--   função aviso-semanal): liga o "despertador" (pg_cron) que, toda
--   segunda às 9h de Brasília, chama a função aviso-semanal (pelo
--   pg_net, o "carteiro" do banco).
--
-- Pode rodar mais de uma vez sem estragar nada (tudo é "se ainda não
-- existir"). Nada aqui apaga, troca ou mexe em dado que já existe.
--
-- PARA VOLTAR ATRÁS: pausar o despertador (fim da PARTE 2; volta fácil).
-- Tirar a função e a tabela de vez: só com "pode apagar" do Fernando.
-- Nenhum dado antigo muda.
-- Cópia de antes: não há dado antigo afetado (só coisas novas); guardar
-- mesmo assim as contagens em backups/<data>_antes_sql_notificacoes.json
-- ===================================================================


-- ===================================================================
-- PARTE 1 — TABELA E FUNÇÃO (rodar no passo 2)
-- ===================================================================

-- -------------------------------------------------------------------
-- 1) TABELA inscricoes_push (um celular por linha)
--    O app grava com "upsert" (cria ou atualiza) pela dupla
--    user_id + endpoint, e desliga com ativa = false.
-- -------------------------------------------------------------------
create table if not exists public.inscricoes_push (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  endpoint        text not null,      -- "endereço" do celular na Apple/Google
  p256dh          text not null,      -- chave do celular que tranca a mensagem
  auth            text not null,      -- segredo do celular que tranca a mensagem
  ativa           boolean not null default true,
  criado_em       timestamptz not null default now(),
  atualizado_em   timestamptz not null default now(),
  ultimo_envio_em timestamptz,        -- quando a última da semana saiu
  unique (user_id, endpoint)
);

-- Índice por pessoa, só dos celulares ativos (é o que a função lê).
-- (A trava "unique" acima já ajuda nas buscas por pessoa em geral.)
create index if not exists inscricoes_push_user_ativa
  on public.inscricoes_push (user_id)
  where ativa;

-- GRANT abre a porta. POLICY diz quem passa. Precisa dos dois.
-- Primeiro tira tudo desta tabela NOVA (para garantir que ninguém ficou
-- com mais do que devia) e depois dá só o necessário:
--   app (authenticated): ler, criar e atualizar — SEM apagar;
--   quem não está logado (anon): nada;
--   servidor (service_role): ler e atualizar (a função aviso-semanal).
revoke all on public.inscricoes_push from anon, authenticated;
grant select, insert, update on public.inscricoes_push to authenticated;
grant select, update on public.inscricoes_push to service_role;

alter table public.inscricoes_push enable row level security;

-- Políticas "só as próprias linhas" (criadas só se ainda não existirem;
-- sem DROP). "(select auth.uid())" é o mesmo que auth.uid(), no jeito
-- que o Supabase recomenda (mais rápido: calcula uma vez só).
-- Sem política de apagar: o app não apaga, só desliga.
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public'
                 and tablename = 'inscricoes_push' and policyname = 'inscricoes_push: ver as proprias') then
    create policy "inscricoes_push: ver as proprias" on public.inscricoes_push
      for select to authenticated using ((select auth.uid()) = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public'
                 and tablename = 'inscricoes_push' and policyname = 'inscricoes_push: inserir as proprias') then
    create policy "inscricoes_push: inserir as proprias" on public.inscricoes_push
      for insert to authenticated with check ((select auth.uid()) = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public'
                 and tablename = 'inscricoes_push' and policyname = 'inscricoes_push: atualizar as proprias') then
    create policy "inscricoes_push: atualizar as proprias" on public.inscricoes_push
      for update to authenticated
      using ((select auth.uid()) = user_id)
      with check ((select auth.uid()) = user_id);
  end if;
end $$;


-- -------------------------------------------------------------------
-- 2) FUNÇÃO faturado_ano_para_aviso(ano)
--    Devolve, para cada pessoa com celular ATIVO, quanto ela faturou no
--    ano (soma dos lançamentos). Quem não lançou nada vem com 0.
--
--    Igual ao app (src/context/AppStateContext.jsx, faturamentoAtual):
--    o velocímetro soma o "valor" de TODOS os lançamentos da pessoa
--    (tabela lancamentos: user_id, valor, data) cuja data cai no ano
--    corrente. O app usa o relógio do celular; aqui usamos o horário de
--    Brasília (America/Sao_Paulo). Só muda algo para quem lançar perto
--    da meia-noite do dia 31/12 e morar em outro fuso.
--
--    ⚠️ SUPOSIÇÕES A CONFERIR NO BANCO (só leitura) antes de rodar —
--    a tabela lancamentos não está no migrations.sql:
--      - lancamentos tem as colunas user_id (uuid), valor (número) e
--        data. O app grava "data" como data e hora (ex.:
--        2026-10-12T15:00:00.000Z) e às vezes só a data (2026-10-12).
--        A conta abaixo funciona se "data" for timestamptz, timestamp,
--        date ou texto nesse formato (ela converte tudo para data e
--        hora, no horário de Brasília).
--      - a service_role (chave do servidor) pode ler lancamentos e
--        perfis (o GRANT logo abaixo garante; repetir não muda nada).
--      Conferir com:
--        select column_name, data_type from information_schema.columns
--         where table_schema = 'public' and table_name = 'lancamentos'
--         order by ordinal_position;
--
--    POR QUE SEM "security definer": a função roda com as permissões de
--    QUEM CHAMA. Quem chama é o servidor (service_role), que já pode ler
--    tudo. Se um dia alguém liberasse a função para o app por engano, o
--    RLS continuaria valendo e cada pessoa só veria a própria soma.
--    Com "security definer" ela rodaria como dona do banco, e o mesmo
--    engano mostraria o faturamento de TODO MUNDO. Por isso: sem.
--    "search_path = ''" trava os nomes (public.lancamentos etc.) e tira
--    o aviso dos advisors de segurança.
-- -------------------------------------------------------------------
create or replace function public.faturado_ano_para_aviso(p_ano int)
returns table (user_id uuid, faturado numeric)
language sql
stable
set search_path = ''
set timezone = 'America/Sao_Paulo'
as $$
  select i.user_id,
         coalesce(sum(l.valor), 0)::numeric as faturado
    from (select distinct ip.user_id
            from public.inscricoes_push ip
           where ip.ativa) as i
    left join public.lancamentos l
      on l.user_id = i.user_id
     and l.data::timestamptz >= make_timestamptz(p_ano,     1, 1, 0, 0, 0, 'America/Sao_Paulo')
     and l.data::timestamptz <  make_timestamptz(p_ano + 1, 1, 1, 0, 0, 0, 'America/Sao_Paulo')
   group by i.user_id;
$$;

-- Só o servidor pode usar (o app e quem não está logado, não)
revoke execute on function public.faturado_ano_para_aviso(int) from public, anon, authenticated;
grant  execute on function public.faturado_ano_para_aviso(int) to service_role;

-- A função lê lancamentos e inscricoes_push; a aviso-semanal lê perfis.
-- A service_role provavelmente já pode ler as duas primeiras; repetir
-- não muda nada (o app continua igual).
grant select on public.lancamentos to service_role;
grant select on public.perfis      to service_role;


-- -------------------------------------------------------------------
-- 3) O app (PostgREST) enxergar a tabela e a função novas na hora
-- -------------------------------------------------------------------
notify pgrst, 'reload schema';

-- ======================= FIM DA PARTE 1 ============================
-- ⚠️ No passo 2, rodar SÓ até aqui. Se rodar o arquivo inteiro, a trava
-- da PARTE 2 para com erro e o SQL Editor pode desfazer a PARTE 1 junto
-- (nada fica gravado). Não estraga nada: é só rodar de novo só a PARTE 1.


-- ===================================================================
-- CONFERÊNCIA DA PARTE 1 (rodar depois; só leitura)
-- ===================================================================
-- a) A tabela com RLS ligado (rowsecurity = true):
-- select tablename, rowsecurity from pg_tables
--  where schemaname = 'public' and tablename = 'inscricoes_push';
--
-- b) As 3 políticas:
-- select policyname, cmd from pg_policies
--  where schemaname = 'public' and tablename = 'inscricoes_push'
--  order by policyname;
--
-- c) As permissões: authenticated com SELECT, INSERT e UPDATE (sem
--    DELETE); service_role com SELECT e UPDATE; anon sem nada.
-- select grantee, privilege_type from information_schema.role_table_grants
--  where table_schema = 'public' and table_name = 'inscricoes_push'
--    and grantee in ('anon', 'authenticated', 'service_role')
--  order by grantee, privilege_type;
--
-- d) A função: só a service_role pode usar (true, false, false):
-- select has_function_privilege('service_role',  'public.faturado_ano_para_aviso(int)', 'execute') as servidor,
--        has_function_privilege('authenticated', 'public.faturado_ano_para_aviso(int)', 'execute') as app,
--        has_function_privilege('anon',          'public.faturado_ano_para_aviso(int)', 'execute') as sem_login;
--
-- e) A função funciona (no começo vem vazia: ninguém ativou ainda):
-- select * from public.faturado_ano_para_aviso(2026);


-- ===================================================================
-- PARTE 2 — O DESPERTADOR DE TODA SEGUNDA (rodar no passo 5)
--
-- ⚠️ SÓ DEPOIS de: segredos no Supabase (passo 3) e função aviso-semanal
-- publicada (passo 4).
--
-- Antes de rodar, trocar os 2 marcadores (só aqui, na hora de rodar):
--   <URL_DO_PROJETO>  o endereço do projeto, sem a barra no fim, ex.:
--                     https://abcdefghijkl.supabase.co
--                     (Supabase > Project Settings > Data API > Project URL)
--   <SEGREDO>         o MESMO valor do segredo AVISO_SEMANAL_SEGREDO
--                     (passo 3)
-- Se esquecer de trocar, o bloco PARA com um aviso e não grava nada.
--
-- O que acontece:
--   1) Liga o pg_cron (despertador) e o pg_net (carteiro do banco), que
--      já vêm no Supabase (grátis).
--   2) Guarda o endereço e a senha no Vault (o "cofre" do Supabase: fica
--      guardado trancado, não aparece em lugar nenhum do app).
--   3) Cria o despertador "aviso-semanal": toda segunda às 12:00 no
--      horário universal (= 9h de Brasília), chama a função mandando a
--      senha no cabeçalho x-aviso-segredo.
-- Tudo só se ainda não existir.
-- ===================================================================

do $$
declare
  v_url     text := rtrim('<URL_DO_PROJETO>', '/');
  v_segredo text := '<SEGREDO>';
begin
  -- Trava: marcador não trocado = para aqui, antes de qualquer coisa
  if v_url like '%<%' or v_segredo like '%<%' or v_url not like 'https://%' then
    raise exception 'Troque <URL_DO_PROJETO> e <SEGREDO> antes de rodar a PARTE 2 (nada foi gravado).';
  end if;

  -- Despertador (pg_cron) e carteiro (pg_net), se ainda não estiverem ligados
  create extension if not exists pg_cron with schema pg_catalog;
  create extension if not exists pg_net  with schema extensions;
  grant usage on schema cron to postgres;

  -- Cofre (Vault): o endereço do projeto e a senha do despertador
  if not exists (select 1 from vault.secrets where name = 'project_url') then
    perform vault.create_secret(v_url, 'project_url', 'Endereco do projeto TaCerto (despertador aviso-semanal)');
  end if;
  if not exists (select 1 from vault.secrets where name = 'aviso_semanal_segredo') then
    perform vault.create_secret(v_segredo, 'aviso_semanal_segredo', 'Senha que o despertador manda para a funcao aviso-semanal');
  end if;

  -- O despertador: toda segunda, 12:00 UTC = 9h de Brasília
  if not exists (select 1 from cron.job where jobname = 'aviso-semanal') then
    perform cron.schedule(
      'aviso-semanal',
      '0 12 * * 1',
      $cmd$
      select net.http_post(
        url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url')
               || '/functions/v1/aviso-semanal',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-aviso-segredo', (select decrypted_secret from vault.decrypted_secrets where name = 'aviso_semanal_segredo')
        ),
        body := '{}'::jsonb,
        timeout_milliseconds := 60000
      ) as request_id;
      $cmd$
    );
  end if;
end $$;

-- ======================= FIM DA PARTE 2 ============================


-- ===================================================================
-- CONFERÊNCIA DA PARTE 2 (só leitura)
-- ===================================================================
-- a) O despertador existe e está ligado (schedule = 0 12 * * 1,
--    active = true):
-- select jobid, jobname, schedule, active from cron.job
--  where jobname = 'aviso-semanal';
--
-- b) As últimas vezes que ele tocou (depois da primeira segunda):
-- select status, return_message, start_time from cron.job_run_details
--  where jobid = (select jobid from cron.job where jobname = 'aviso-semanal')
--  order by start_time desc limit 5;
--
-- c) O que a função respondeu (fica guardado 6 horas). Esperado:
--    status_code 200 e {"ok":true,"enviados":...,"desativados":...,"erros":...}
-- select id, status_code, content, error_msg, created from net._http_response
--  order by created desc limit 5;
--
-- d) Os nomes guardados no cofre (sem mostrar a senha):
-- select name, description, created_at from vault.secrets
--  where name in ('project_url', 'aviso_semanal_segredo');


-- ===================================================================
-- ENVIO DE TESTE (passo 6; só para UMA pessoa, sem esperar segunda)
-- Manda para os celulares ativos dessa pessoa, mesmo que ela já tenha
-- recebido na semana, e NÃO conta como "a da semana" (a de segunda
-- chega normal). Precisa da PARTE 2 rodada (usa o cofre).
-- ===================================================================
-- 1) Achar o id da pessoa (não mostra o endereço do celular):
-- select i.user_id, u.email, i.ativa, i.criado_em, i.ultimo_envio_em
--   from public.inscricoes_push i
--   join auth.users u on u.id = i.user_id
--  order by i.criado_em desc;
--
-- 2) Mandar o teste (trocar <ID_DA_PESSOA> pelo user_id do passo 1;
--    com o id errado, a função não manda para ninguém):
-- select net.http_post(
--   url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url')
--          || '/functions/v1/aviso-semanal',
--   headers := jsonb_build_object(
--     'Content-Type', 'application/json',
--     'x-aviso-segredo', (select decrypted_secret from vault.decrypted_secrets where name = 'aviso_semanal_segredo')
--   ),
--   body := jsonb_build_object('teste_user_id', '<ID_DA_PESSOA>'),
--   timeout_milliseconds := 60000
-- ) as request_id;
--
-- 3) Ver a resposta (alguns segundos depois): consulta "c" acima.


-- ===================================================================
-- COMO PARAR
-- ===================================================================
-- PAUSAR o despertador (ninguém recebe mais; volta fácil):
-- select cron.alter_job(
--   job_id := (select jobid from cron.job where jobname = 'aviso-semanal'),
--   active := false
-- );
--
-- LIGAR de novo:
-- select cron.alter_job(
--   job_id := (select jobid from cron.job where jobname = 'aviso-semanal'),
--   active := true
-- );
--
-- TIRAR o despertador de vez (só com o "pode" do Fernando; para voltar,
-- rodar a PARTE 2 de novo):
-- select cron.unschedule('aviso-semanal');
--
-- TROCAR a senha guardada no cofre (se mudar o AVISO_SEMANAL_SEGREDO):
-- select vault.update_secret(
--   (select id from vault.secrets where name = 'aviso_semanal_segredo'),
--   '<SEGREDO_NOVO>'
-- );
