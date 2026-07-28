-- Painel Ayres V2
-- Verificação somente leitura para executar depois das migrações.

with expected_tables(table_name) as (
  values
    ('filiais'),
    ('profiles'),
    ('estadias'),
    ('embarques'),
    ('captacoes'),
    ('anexos'),
    ('audit_logs')
),
table_checks as (
  select
    'tabela:' || expected_tables.table_name as item,
    to_regclass('public.' || expected_tables.table_name) is not null as ok
  from expected_tables
),
rls_checks as (
  select
    'rls:' || c.relname as item,
    c.relrowsecurity as ok
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname in (
      'filiais',
      'profiles',
      'estadias',
      'embarques',
      'captacoes',
      'anexos',
      'audit_logs'
    )
),
anon_checks as (
  select
    'anon_sem_acesso:' || expected_tables.table_name as item,
    not (
      has_table_privilege('anon', 'public.' || expected_tables.table_name, 'SELECT')
      or has_table_privilege('anon', 'public.' || expected_tables.table_name, 'INSERT')
      or has_table_privilege('anon', 'public.' || expected_tables.table_name, 'UPDATE')
      or has_table_privilege('anon', 'public.' || expected_tables.table_name, 'DELETE')
    ) as ok
  from expected_tables
),
bucket_check as (
  select
    'bucket:ayres-anexos-privado' as item,
    exists (
      select 1
      from storage.buckets
      where id = 'ayres-anexos'
        and public = false
    ) as ok
),
seed_check as (
  select
    'filiais_iniciais:5' as item,
    count(*) = 5 as ok
  from public.filiais
  where codigo in (
    'jatai-go',
    'mineiros-go',
    'chapadao-do-ceu-go',
    'sao-simao-go',
    'rio-verde-go'
  )
)
select item, ok
from (
  select * from table_checks
  union all
  select * from rls_checks
  union all
  select * from anon_checks
  union all
  select * from bucket_check
  union all
  select * from seed_check
) checks
order by ok, item;

