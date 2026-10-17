/* SQL-PENDENTE-BLOCO4 v1 — coluna opcional da nota fiscal no recebimento; NAO executado */
-- Pendente de autorizacao do Fernando. Sem valor padrao: antigos ficam sem selo.
alter table public.lancamentos add column if not exists tem_nota boolean;
