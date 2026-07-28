-- Painel Ayres V2
-- Banco normalizado, autenticação via Supabase Auth e isolamento por filial.

create extension if not exists pgcrypto;

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create table public.filiais (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique check (codigo ~ '^[a-z0-9-]+$'),
  nome text not null,
  cidade text not null,
  estado char(2) not null,
  ativa boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null check (char_length(nome) between 2 and 120),
  role text not null default 'visualizador'
    check (role in ('admin', 'gestor', 'operador', 'visualizador')),
  filial_id uuid references public.filiais(id) on delete restrict,
  ativo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function private.current_filial_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select p.filial_id
  from public.profiles p
  where p.id = (select auth.uid())
    and p.ativo = true
$$;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (
      select p.role = 'admin' and p.ativo = true
      from public.profiles p
      where p.id = (select auth.uid())
    ),
    false
  )
$$;

revoke all on function private.current_filial_id() from public, anon;
revoke all on function private.is_admin() from public, anon;
grant execute on function private.current_filial_id() to authenticated;
grant execute on function private.is_admin() to authenticated;

create or replace function private.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, nome)
  values (
    new.id,
    coalesce(nullif(split_part(new.email, '@', 1), ''), 'Novo usuário')
  );
  return new;
end;
$$;

revoke all on function private.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

create table public.estadias (
  id uuid primary key default gen_random_uuid(),
  filial_id uuid not null references public.filiais(id) on delete restrict,
  placa varchar(7) not null check (placa ~ '^[A-Z0-9]{7}$'),
  tipo text not null default 'a_lancar'
    check (tipo in ('a_lancar', 'lancada')),
  status text not null default 'pendente'
    check (status in ('pendente', 'nao_saiu', 'saiu', 'finalizado')),
  prioridade text not null default 'normal'
    check (prioridade in ('normal', 'alta', 'urgente')),
  controle text,
  lote text,
  nf text,
  cte text,
  emissao_cte timestamptz,
  descarga_em timestamptz,
  valor_diaria numeric(12, 2) check (valor_diaria is null or valor_diaria >= 0),
  fator numeric(8, 4) check (fator is null or fator >= 0),
  observacao text,
  created_by uuid not null references public.profiles(id) on delete restrict,
  updated_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint estadia_descarga_valida
    check (descarga_em is null or emissao_cte is null or descarga_em >= emissao_cte)
);

create index estadias_filial_status_idx
  on public.estadias (filial_id, status)
  where deleted_at is null;
create index estadias_filial_placa_idx
  on public.estadias (filial_id, placa)
  where deleted_at is null;
create index estadias_updated_at_idx
  on public.estadias (updated_at desc);

create table public.embarques (
  id uuid primary key default gen_random_uuid(),
  filial_id uuid not null references public.filiais(id) on delete restrict,
  placa varchar(7) not null check (placa ~ '^[A-Z0-9]{7}$'),
  motorista text not null check (char_length(motorista) between 2 and 120),
  carregado boolean not null default false,
  fabrica text not null,
  lote text,
  agendado_para timestamptz,
  status text not null default 'aguardando'
    check (status in ('aguardando', 'agendado', 'carregado', 'cancelado')),
  telefone text,
  data_solicitada date,
  observacao text,
  created_by uuid not null references public.profiles(id) on delete restrict,
  updated_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index embarques_filial_status_idx
  on public.embarques (filial_id, status)
  where deleted_at is null;
create index embarques_agendamento_idx
  on public.embarques (agendado_para)
  where deleted_at is null and agendado_para is not null;
create index embarques_placa_idx
  on public.embarques (filial_id, placa)
  where deleted_at is null;

create table public.captacoes (
  id uuid primary key default gen_random_uuid(),
  filial_id uuid not null references public.filiais(id) on delete restrict,
  captador_id uuid not null references public.profiles(id) on delete restrict,
  motorista text not null check (char_length(motorista) between 2 and 120),
  cpf text,
  telefone text,
  placa varchar(7) check (placa is null or placa ~ '^[A-Z0-9]{7}$'),
  eixos text check (
    eixos is null
    or eixos in ('4x2', 'LS', 'Bitrem', '4º eixo', '9 eixos')
  ),
  destino text,
  empresa text,
  status text not null default 'captado'
    check (status in ('captado', 'sem_retorno', 'agendado', 'carregou', 'nao_carregou')),
  quantidade_cargas integer not null default 1 check (quantidade_cargas > 0),
  lembrete_em timestamptz,
  observacao text,
  created_by uuid not null references public.profiles(id) on delete restrict,
  updated_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index captacoes_filial_status_idx
  on public.captacoes (filial_id, status)
  where deleted_at is null;
create index captacoes_captador_idx
  on public.captacoes (captador_id, created_at desc)
  where deleted_at is null;
create index captacoes_lembrete_idx
  on public.captacoes (lembrete_em)
  where deleted_at is null and lembrete_em is not null;

create table public.anexos (
  id uuid primary key default gen_random_uuid(),
  filial_id uuid not null references public.filiais(id) on delete restrict,
  modulo text not null check (modulo in ('estadia', 'embarque', 'captacao')),
  registro_id uuid not null,
  nome_arquivo text not null,
  storage_path text not null unique,
  mime_type text,
  tamanho_bytes bigint check (tamanho_bytes is null or tamanho_bytes >= 0),
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index anexos_registro_idx
  on public.anexos (modulo, registro_id)
  where deleted_at is null;

create table public.audit_logs (
  id bigint generated always as identity primary key,
  filial_id uuid references public.filiais(id) on delete restrict,
  tabela text not null,
  registro_id uuid not null,
  acao text not null check (acao in ('INSERT', 'UPDATE', 'DELETE')),
  usuario_id uuid references auth.users(id) on delete set null,
  dados_anteriores jsonb,
  dados_novos jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_registro_idx
  on public.audit_logs (tabela, registro_id, created_at desc);
create index audit_logs_filial_idx
  on public.audit_logs (filial_id, created_at desc);

create or replace function private.write_audit_log()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  old_row jsonb;
  new_row jsonb;
  row_id uuid;
  branch_id uuid;
begin
  old_row := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end;
  new_row := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end;
  row_id := coalesce((new_row ->> 'id')::uuid, (old_row ->> 'id')::uuid);
  branch_id := coalesce((new_row ->> 'filial_id')::uuid, (old_row ->> 'filial_id')::uuid);

  insert into public.audit_logs (
    filial_id,
    tabela,
    registro_id,
    acao,
    usuario_id,
    dados_anteriores,
    dados_novos
  )
  values (
    branch_id,
    tg_table_name,
    row_id,
    tg_op,
    (select auth.uid()),
    old_row,
    new_row
  );

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

revoke all on function private.write_audit_log() from public, anon, authenticated;

create trigger estadias_touch_updated_at
  before update on public.estadias
  for each row execute function private.touch_updated_at();
create trigger embarques_touch_updated_at
  before update on public.embarques
  for each row execute function private.touch_updated_at();
create trigger captacoes_touch_updated_at
  before update on public.captacoes
  for each row execute function private.touch_updated_at();
create trigger filiais_touch_updated_at
  before update on public.filiais
  for each row execute function private.touch_updated_at();
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function private.touch_updated_at();

create trigger estadias_audit
  after insert or update or delete on public.estadias
  for each row execute function private.write_audit_log();
create trigger embarques_audit
  after insert or update or delete on public.embarques
  for each row execute function private.write_audit_log();
create trigger captacoes_audit
  after insert or update or delete on public.captacoes
  for each row execute function private.write_audit_log();

alter table public.filiais enable row level security;
alter table public.profiles enable row level security;
alter table public.estadias enable row level security;
alter table public.embarques enable row level security;
alter table public.captacoes enable row level security;
alter table public.anexos enable row level security;
alter table public.audit_logs enable row level security;

create policy filiais_select
  on public.filiais for select
  to authenticated
  using (ativa = true or (select private.is_admin()));

create policy filiais_admin_insert
  on public.filiais for insert
  to authenticated
  with check ((select private.is_admin()));

create policy filiais_admin_update
  on public.filiais for update
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy profiles_select
  on public.profiles for select
  to authenticated
  using (
    id = (select auth.uid())
    or (select private.is_admin())
  );

create policy profiles_admin_insert
  on public.profiles for insert
  to authenticated
  with check ((select private.is_admin()));

create policy profiles_admin_update
  on public.profiles for update
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy estadias_branch_select
  on public.estadias for select
  to authenticated
  using (
    filial_id = (select private.current_filial_id())
    or (select private.is_admin())
  );

create policy estadias_branch_insert
  on public.estadias for insert
  to authenticated
  with check (
    (
      filial_id = (select private.current_filial_id())
      or (select private.is_admin())
    )
    and created_by = (select auth.uid())
    and updated_by = (select auth.uid())
  );

create policy estadias_branch_update
  on public.estadias for update
  to authenticated
  using (
    filial_id = (select private.current_filial_id())
    or (select private.is_admin())
  )
  with check (
    (
      filial_id = (select private.current_filial_id())
      or (select private.is_admin())
    )
    and updated_by = (select auth.uid())
  );

create policy embarques_branch_select
  on public.embarques for select
  to authenticated
  using (
    filial_id = (select private.current_filial_id())
    or (select private.is_admin())
  );

create policy embarques_branch_insert
  on public.embarques for insert
  to authenticated
  with check (
    (
      filial_id = (select private.current_filial_id())
      or (select private.is_admin())
    )
    and created_by = (select auth.uid())
    and updated_by = (select auth.uid())
  );

create policy embarques_branch_update
  on public.embarques for update
  to authenticated
  using (
    filial_id = (select private.current_filial_id())
    or (select private.is_admin())
  )
  with check (
    (
      filial_id = (select private.current_filial_id())
      or (select private.is_admin())
    )
    and updated_by = (select auth.uid())
  );

create policy captacoes_branch_select
  on public.captacoes for select
  to authenticated
  using (
    filial_id = (select private.current_filial_id())
    or (select private.is_admin())
  );

create policy captacoes_branch_insert
  on public.captacoes for insert
  to authenticated
  with check (
    (
      filial_id = (select private.current_filial_id())
      or (select private.is_admin())
    )
    and captador_id = (select auth.uid())
    and created_by = (select auth.uid())
    and updated_by = (select auth.uid())
  );

create policy captacoes_branch_update
  on public.captacoes for update
  to authenticated
  using (
    filial_id = (select private.current_filial_id())
    or (select private.is_admin())
  )
  with check (
    (
      filial_id = (select private.current_filial_id())
      or (select private.is_admin())
    )
    and updated_by = (select auth.uid())
  );

create policy anexos_branch_select
  on public.anexos for select
  to authenticated
  using (
    filial_id = (select private.current_filial_id())
    or (select private.is_admin())
  );

create policy anexos_branch_insert
  on public.anexos for insert
  to authenticated
  with check (
    (
      filial_id = (select private.current_filial_id())
      or (select private.is_admin())
    )
    and created_by = (select auth.uid())
  );

create policy anexos_branch_update
  on public.anexos for update
  to authenticated
  using (
    filial_id = (select private.current_filial_id())
    or (select private.is_admin())
  )
  with check (
    filial_id = (select private.current_filial_id())
    or (select private.is_admin())
  );

create policy audit_logs_branch_select
  on public.audit_logs for select
  to authenticated
  using (
    filial_id = (select private.current_filial_id())
    or (select private.is_admin())
  );

revoke all on public.filiais from anon;
revoke all on public.profiles from anon;
revoke all on public.estadias from anon;
revoke all on public.embarques from anon;
revoke all on public.captacoes from anon;
revoke all on public.anexos from anon;
revoke all on public.audit_logs from anon;

grant select, insert, update on public.filiais to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update on public.estadias to authenticated;
grant select, insert, update on public.embarques to authenticated;
grant select, insert, update on public.captacoes to authenticated;
grant select, insert, update on public.anexos to authenticated;
grant select on public.audit_logs to authenticated;

insert into public.filiais (codigo, nome, cidade, estado)
values
  ('jatai-go', 'Jataí - GO', 'Jataí', 'GO'),
  ('mineiros-go', 'Mineiros - GO', 'Mineiros', 'GO'),
  ('chapadao-do-ceu-go', 'Chapadão do Céu - GO', 'Chapadão do Céu', 'GO'),
  ('sao-simao-go', 'São Simão - GO', 'São Simão', 'GO'),
  ('rio-verde-go', 'Rio Verde - GO', 'Rio Verde', 'GO')
on conflict (codigo) do nothing;

insert into storage.buckets (id, name, public, file_size_limit)
values ('ayres-anexos', 'ayres-anexos', false, 10485760)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit;

create policy storage_branch_select
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'ayres-anexos'
    and (
      (storage.foldername(name))[1] = (select private.current_filial_id())::text
      or (select private.is_admin())
    )
  );

create policy storage_branch_insert
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'ayres-anexos'
    and (
      (storage.foldername(name))[1] = (select private.current_filial_id())::text
      or (select private.is_admin())
    )
  );

create policy storage_branch_update
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'ayres-anexos'
    and (
      (storage.foldername(name))[1] = (select private.current_filial_id())::text
      or (select private.is_admin())
    )
  )
  with check (
    bucket_id = 'ayres-anexos'
    and (
      (storage.foldername(name))[1] = (select private.current_filial_id())::text
      or (select private.is_admin())
    )
  );

create policy storage_branch_delete
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'ayres-anexos'
    and (
      (storage.foldername(name))[1] = (select private.current_filial_id())::text
      or (select private.is_admin())
    )
  );
