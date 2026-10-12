-- SQL-PENDENTE-10-10 v1 — bloco UNICO do banco para a tarefa de 10-10 (CNPJ guardado, tutorial, avisos no WhatsApp, forma de pagar o DAS, nota/comprovante ligado ao lancamento). AINDA NAO RODADO: espera o "pode" do Fernando.
--   Escrito em 12/10/2026 (sessao na nuvem, sem acesso ao Supabase).
--   Antes de rodar: conferir no banco (so leitura) se alguma coluna ja
--   existe e guardar a copia dos dados (rotina do CLAUDE.md).
--
-- ===================================================================
-- O QUE ESTE BLOCO FAZ (em portugues simples)
--
-- So ACRESCENTA coisas. Nao apaga, nao troca e nao mexe em nenhum dado
-- que ja existe. Pode rodar mais de uma vez sem estragar nada (tudo e
-- "se ainda nao existir").
--
-- 1) PERFIS (a ficha de cada pessoa) ganha 5 campos, todos opcionais:
--      cnpj_dados          o resumo da ultima consulta do CNPJ (nome,
--                          situacao "Ativa", atividades, municipio),
--                          para a pagina do CNPJ no Perfil;
--      cnpj_consultado_em  quando foi essa consulta ("Consultado em");
--      tutorial_visto      ja viu o tutorial do primeiro acesso
--                          (padrao: nao);
--      avisos_whatsapp     aceita lembretes e avisos no WhatsApp
--                          (padrao: sim; a pessoa pode desligar — LGPD
--                          e regras do WhatsApp);
--      das_forma           como quer pagar o DAS: 'isa' (a Isa manda o
--                          boleto) ou 'sozinho'. Vazio = ainda nao
--                          escolheu.
-- 2) NOTAS_FISCAIS e COMPROVANTES ganham "lancamento_id": a nota ou o
--    comprovante que a pessoa guardou fica LIGADO ao lancamento do
--    velocimetro (vira o comprovante dele). Assim o mesmo dinheiro
--    nunca conta duas vezes.
--
-- O app ja foi escrito para funcionar ANTES deste SQL rodar: o que a
-- pessoa escolher fica guardado no aparelho e, depois do SQL, sobe
-- sozinho para o banco na proxima vez que ela abrir o app. Testado em
-- 12/10 num "banco de mentira" sem estas colunas: nada quebra.
--
-- PARA VOLTAR ATRAS (so com "pode apagar" do Fernando): tirar as
-- colunas novas. Nenhum dado antigo muda.
-- Copia dos dados de antes: backups/<data>_antes_sql_10-10.json
-- ===================================================================


-- -------------------------------------------------------------------
-- 1) PERFIS (Blocos C, D, K e L)
-- -------------------------------------------------------------------
alter table public.perfis add column if not exists cnpj_dados         jsonb;
alter table public.perfis add column if not exists cnpj_consultado_em timestamptz;
alter table public.perfis add column if not exists tutorial_visto     boolean default false;
alter table public.perfis add column if not exists avisos_whatsapp    boolean default true;
alter table public.perfis add column if not exists das_forma          text;

-- das_forma so aceita 'isa' ou 'sozinho' (ou vazio). Criada so se ainda
-- nao existir (sem DROP).
do $$
begin
  if not exists (select 1 from pg_constraint
                 where conname = 'perfis_das_forma_valida'
                   and conrelid = 'public.perfis'::regclass) then
    alter table public.perfis
      add constraint perfis_das_forma_valida
      check (das_forma is null or das_forma in ('isa', 'sozinho'));
  end if;
end $$;


-- -------------------------------------------------------------------
-- 2) NOTA / COMPROVANTE LIGADO AO LANCAMENTO (Blocos E e J)
-- Igual ao entradas.lancamento_id que ja existe: so o id, sem chave
-- estrangeira (apagar um lancamento nunca apaga a nota).
-- -------------------------------------------------------------------
alter table public.notas_fiscais add column if not exists lancamento_id uuid;
alter table public.comprovantes  add column if not exists lancamento_id uuid;
create index if not exists notas_fiscais_lancamento on public.notas_fiscais (lancamento_id) where lancamento_id is not null;
create index if not exists comprovantes_lancamento  on public.comprovantes  (lancamento_id) where lancamento_id is not null;


-- -------------------------------------------------------------------
-- 3) O app (PostgREST) enxergar as colunas novas na hora
-- -------------------------------------------------------------------
notify pgrst, 'reload schema';


-- ===================================================================
-- CONFERENCIA (rodar depois; so leitura)
-- Tem que listar as 7 colunas novas.
-- ===================================================================
-- select table_name, column_name, data_type, column_default
--   from information_schema.columns
--  where table_schema = 'public'
--    and ((table_name = 'perfis' and column_name in
--          ('cnpj_dados','cnpj_consultado_em','tutorial_visto','avisos_whatsapp','das_forma'))
--      or (table_name in ('notas_fiscais','comprovantes') and column_name = 'lancamento_id'))
--  order by table_name, column_name;
