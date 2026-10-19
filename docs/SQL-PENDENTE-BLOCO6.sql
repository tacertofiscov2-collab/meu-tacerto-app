/* SQL-PENDENTE-BLOCO6 v1 — uso diário e dúvidas da Isa; NÃO executado */
-- Executar somente após autorização do Fernando, com a rotina do CLAUDE.md.
-- A função isa-chat grava com service_role. O app só lê os próprios dados.
begin;

create table if not exists public.isa_uso (
  user_id uuid not null references auth.users(id) on delete cascade,
  dia date not null,
  perguntas integer not null default 0 check (perguntas between 0 and 30),
  primary key (user_id, dia)
);

create table if not exists public.isa_duvidas_pendentes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  pergunta text not null check (char_length(pergunta) between 1 and 300),
  criado_em timestamptz not null default now(),
  respondida boolean not null default false,
  resposta text default null
);
create index if not exists isa_duvidas_pendentes_pessoa_data
  on public.isa_duvidas_pendentes (user_id, criado_em desc);

alter table public.isa_uso enable row level security;
alter table public.isa_duvidas_pendentes enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public'
    and tablename = 'isa_uso' and policyname = 'isa_uso_leitura_propria') then
    create policy isa_uso_leitura_propria on public.isa_uso
      for select to authenticated using ((select auth.uid()) = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public'
    and tablename = 'isa_duvidas_pendentes' and policyname = 'isa_duvidas_leitura_propria') then
    create policy isa_duvidas_leitura_propria on public.isa_duvidas_pendentes
      for select to authenticated using ((select auth.uid()) = user_id);
  end if;
end $$;

revoke all on public.isa_uso, public.isa_duvidas_pendentes from public, anon, authenticated;
grant select on public.isa_uso, public.isa_duvidas_pendentes to authenticated;
grant all on public.isa_uso, public.isa_duvidas_pendentes to service_role;
commit;
