-- MedLink — 0001: base multi-instituição, perfis, permissões, profissionais e auditoria
-- Princípios: todo dado institucional carrega institution_id; leitura via RLS;
-- escritas sensíveis apenas por funções (RPC) que validam permissão no banco.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------------
create type public.institution_type as enum (
  'clinica_vacinacao','clinica_medica','clinica_multiprofissional','home_care',
  'servico_enfermagem','centro_ambulatorial','outra'
);
create type public.app_role as enum (
  'institution_admin','operations_manager','technical_lead','professional','viewer'
);
create type public.professional_category as enum (
  'medico','enfermeiro','tecnico_enfermagem','auxiliar_enfermagem','fisioterapeuta',
  'farmaceutico','nutricionista','psicologo','fonoaudiologo','biomedico','outro'
);
create type public.validation_status as enum ('pendente','em_analise','validado','rejeitado');
create type public.document_status as enum ('enviado','verificado','rejeitado');
create type public.absence_kind as enum ('indisponivel','ferias','afastamento','licenca');

-- ---------------------------------------------------------------------------
-- Utilitários
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin new.updated_at := now(); return new; end $$;

-- Validação de CNPJ (dígitos verificadores)
create or replace function public.valid_cnpj(p text) returns boolean
language plpgsql immutable as $$
declare
  d int[]; w1 int[] := array[5,4,3,2,9,8,7,6,5,4,3,2];
  w2 int[] := array[6,5,4,3,2,9,8,7,6,5,4,3,2];
  s int; r int; i int;
begin
  if p is null or p !~ '^\d{14}$' or p ~ '^(\d)\1{13}$' then return false; end if;
  select array_agg(substr(p, g, 1)::int order by g) into d from generate_series(1,14) g;
  s := 0; for i in 1..12 loop s := s + d[i]*w1[i]; end loop;
  r := s % 11; r := case when r < 2 then 0 else 11 - r end;
  if r <> d[13] then return false; end if;
  s := 0; for i in 1..13 loop s := s + d[i]*w2[i]; end loop;
  r := s % 11; r := case when r < 2 then 0 else 11 - r end;
  return r = d[14];
end $$;

-- ---------------------------------------------------------------------------
-- Tabelas
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.institutions (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) between 2 and 160),
  legal_name text,
  cnpj text unique check (cnpj is null or public.valid_cnpj(cnpj)),
  type public.institution_type not null,
  modules text[] not null default array['escalas']::text[],
  settings jsonb not null default jsonb_build_object(
    'timezone','America/Sao_Paulo','min_rest_hours',11,'max_weekly_hours',44,'max_shift_hours',24),
  phone text,
  email text,
  is_demo boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint modules_known check (modules <@ array['escalas','profissionais','banco_talentos','estoque','vacinas','home_care','financeiro']::text[])
);

create table public.units (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  name text not null check (length(btrim(name)) between 2 and 120),
  address text,
  city text,
  uf char(2) check (uf is null or uf ~ '^[A-Z]{2}$'),
  phone text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (institution_id, name),
  unique (id, institution_id)
);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  unit_id uuid not null,
  name text not null check (length(btrim(name)) between 2 and 120),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (unit_id, name),
  foreign key (unit_id, institution_id) references public.units(id, institution_id) on delete cascade
);

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  unit_ids uuid[],               -- null = todas as unidades
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (institution_id, user_id, role)
);
create index memberships_user_idx on public.memberships(user_id) where active;

create table public.role_permissions (
  institution_id uuid not null references public.institutions(id) on delete cascade,
  role public.app_role not null,
  permission text not null,
  primary key (institution_id, role, permission)
);

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  email text not null check (email = lower(btrim(email)) and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  role public.app_role not null,
  unit_ids uuid[],
  professional_id uuid,
  invited_by uuid references auth.users(id) on delete set null,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  unique (institution_id, email, role)
);

create table public.professionals (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  full_name text not null check (length(btrim(full_name)) between 3 and 160),
  email text check (email is null or email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone text,
  category public.professional_category not null,
  council text,                  -- CRM, COREN, CREFITO...
  council_number text,
  council_uf char(2) check (council_uf is null or council_uf ~ '^[A-Z]{2}$'),
  education text,
  certifications text[] not null default '{}',
  competencies text[] not null default '{}',
  experience text,
  region text,
  notes text,
  validation_status public.validation_status not null default 'pendente',
  active boolean not null default true,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (institution_id, user_id),
  unique (institution_id, council, council_number, council_uf),
  unique (id, institution_id)
);
create index professionals_inst_idx on public.professionals(institution_id, active);

alter table public.invitations
  add foreign key (professional_id) references public.professionals(id) on delete cascade;

create table public.professional_units (
  professional_id uuid not null,
  unit_id uuid not null,
  institution_id uuid not null,
  primary key (professional_id, unit_id),
  foreign key (professional_id, institution_id) references public.professionals(id, institution_id) on delete cascade,
  foreign key (unit_id, institution_id) references public.units(id, institution_id) on delete cascade
);

create table public.professional_documents (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null,
  professional_id uuid not null,
  kind text not null check (length(btrim(kind)) between 2 and 80),
  file_path text,                -- caminho no bucket privado
  expires_on date,
  status public.document_status not null default 'enviado',
  verified_by uuid references auth.users(id) on delete set null,
  verified_at timestamptz,
  note text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (professional_id, institution_id) references public.professionals(id, institution_id) on delete cascade
);

-- Disponibilidade, preferências e ausências: conceitos separados de plantões.
create table public.availability_slots (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null,
  professional_id uuid not null,
  weekday smallint not null check (weekday between 0 and 6),   -- 0 = domingo
  start_time time not null,
  end_time time not null,        -- end <= start significa que atravessa a meia-noite
  created_at timestamptz not null default now(),
  check (start_time <> end_time),
  foreign key (professional_id, institution_id) references public.professionals(id, institution_id) on delete cascade
);

create table public.shift_preferences (
  professional_id uuid primary key,
  institution_id uuid not null,
  preferred_turns text[] not null default '{}' check (preferred_turns <@ array['manha','tarde','noite','diurno_12h','noturno_12h']::text[]),
  max_weekly_hours numeric(5,1) check (max_weekly_hours is null or max_weekly_hours between 1 and 168),
  notes text,
  updated_at timestamptz not null default now(),
  foreign key (professional_id, institution_id) references public.professionals(id, institution_id) on delete cascade
);

create table public.absences (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null,
  professional_id uuid not null,
  kind public.absence_kind not null,
  starts_on date not null,
  ends_on date not null,
  note text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  check (ends_on >= starts_on),
  foreign key (professional_id, institution_id) references public.professionals(id, institution_id) on delete cascade
);

create table public.audit_log (
  id bigint generated always as identity primary key,
  institution_id uuid,           -- sem FK: o histórico sobrevive à exclusão
  unit_id uuid,
  actor_id uuid,
  action text not null,
  entity text not null,
  entity_id uuid,
  changes jsonb,
  reason text,
  result text not null default 'sucesso',
  created_at timestamptz not null default now()
);
create index audit_inst_time_idx on public.audit_log(institution_id, created_at desc);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid references public.institutions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,
  title text not null,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications(user_id, created_at desc);

-- updated_at
do $$ declare t text; begin
  foreach t in array array['profiles','institutions','units','services','memberships','professionals','professional_documents'] loop
    execute format('create trigger %I_updated before update on public.%I for each row execute function public.set_updated_at()', t, t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Permissões
-- ---------------------------------------------------------------------------
create or replace function public.all_permissions() returns text[]
language sql immutable as $$
  select array[
    'institution.manage','units.manage','members.manage','settings.manage',
    'professionals.view','professionals.manage','documents.verify',
    'shifts.view','shifts.manage','shifts.publish','requests.decide',
    'reports.view','audit.view'
  ]::text[]
$$;

create or replace function public.default_permissions(p_role public.app_role) returns text[]
language sql immutable as $$
  select case p_role
    when 'institution_admin' then public.all_permissions()
    when 'operations_manager' then array['professionals.view','professionals.manage','shifts.view','shifts.manage','shifts.publish','requests.decide','reports.view','audit.view']
    when 'technical_lead' then array['professionals.view','documents.verify','shifts.view','reports.view','audit.view']
    when 'viewer' then array['shifts.view','reports.view']
    else array[]::text[]
  end
$$;

create or replace function public.is_platform_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from platform_admins where user_id = auth.uid())
$$;

create or replace function public.is_member(p_inst uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from memberships m
    where m.institution_id = p_inst and m.user_id = auth.uid() and m.active)
$$;

create or replace function public.has_perm(p_inst uuid, p_perm text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists(
    select 1 from memberships m
    join role_permissions rp on rp.institution_id = m.institution_id and rp.role = m.role
    where m.institution_id = p_inst and m.user_id = auth.uid() and m.active and rp.permission = p_perm)
$$;

-- Permissão com escopo de unidade (unit_ids nulo = todas)
create or replace function public.has_unit_perm(p_inst uuid, p_unit uuid, p_perm text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists(
    select 1 from memberships m
    join role_permissions rp on rp.institution_id = m.institution_id and rp.role = m.role
    where m.institution_id = p_inst and m.user_id = auth.uid() and m.active
      and rp.permission = p_perm and (m.unit_ids is null or p_unit = any(m.unit_ids)))
$$;

create or replace function public.require_perm(p_inst uuid, p_perm text, p_unit uuid default null) returns void
language plpgsql stable security definer set search_path = public as $$
begin
  if auth.uid() is null then
    raise exception 'Sessão expirada. Entre novamente.' using errcode = '42501';
  end if;
  if (p_unit is null and not public.has_perm(p_inst, p_perm))
     or (p_unit is not null and not public.has_unit_perm(p_inst, p_unit, p_perm)) then
    raise exception 'Você não tem permissão para esta ação.' using errcode = '42501', hint = p_perm;
  end if;
end $$;

create or replace function public.my_professional_id(p_inst uuid) returns uuid
language sql stable security definer set search_path = public as $$
  select id from professionals where institution_id = p_inst and user_id = auth.uid() and active limit 1
$$;

-- ---------------------------------------------------------------------------
-- Auditoria (gatilho genérico). Ação semântica e motivo vêm de set_config local.
-- ---------------------------------------------------------------------------
create or replace function public.audit_trigger() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_old jsonb; v_new jsonb; v_changes jsonb; v_inst uuid; v_unit uuid; v_id uuid; v_action text;
begin
  if tg_op = 'INSERT' then v_new := to_jsonb(new);
  elsif tg_op = 'DELETE' then v_old := to_jsonb(old);
  else v_old := to_jsonb(old); v_new := to_jsonb(new); end if;

  if tg_op = 'UPDATE' then
    select coalesce(jsonb_object_agg(e.key, jsonb_build_object('de', v_old -> e.key, 'para', e.value)), '{}'::jsonb)
      into v_changes
      from jsonb_each(v_new) e
     where e.key not in ('updated_at') and (v_old -> e.key) is distinct from e.value;
    if v_changes = '{}'::jsonb then return new; end if;
  elsif tg_op = 'INSERT' then
    v_changes := v_new - 'created_at' - 'updated_at';
  else
    v_changes := v_old;
  end if;

  if tg_table_name = 'institutions' then
    v_inst := coalesce(v_new ->> 'id', v_old ->> 'id')::uuid;
  else
    v_inst := coalesce(v_new ->> 'institution_id', v_old ->> 'institution_id')::uuid;
  end if;
  v_unit := coalesce(v_new ->> 'unit_id', v_old ->> 'unit_id')::uuid;
  v_id := case when coalesce(v_new, v_old) ? 'id' then coalesce(v_new ->> 'id', v_old ->> 'id')::uuid end;
  v_action := coalesce(nullif(current_setting('medlink.action', true), ''), lower(tg_op));

  insert into audit_log(institution_id, unit_id, actor_id, action, entity, entity_id, changes, reason)
  values (v_inst, v_unit, auth.uid(), v_action, tg_table_name, v_id, v_changes,
          nullif(current_setting('medlink.reason', true), ''));
  return coalesce(new, old);
end $$;

do $$ declare t text; begin
  foreach t in array array['institutions','units','services','memberships','role_permissions','invitations',
                           'professionals','professional_units','professional_documents','absences'] loop
    execute format('create trigger %I_audit after insert or update or delete on public.%I for each row execute function public.audit_trigger()', t, t);
  end loop;
end $$;

create or replace function public.set_action(p_action text, p_reason text default null) returns void
language sql as $$
  select set_config('medlink.action', coalesce(p_action, ''), true),
         set_config('medlink.reason', coalesce(p_reason, ''), true);
$$;

-- ---------------------------------------------------------------------------
-- Guardas de integridade
-- ---------------------------------------------------------------------------
create or replace function public.guard_institution_change() returns trigger
language plpgsql as $$
begin
  if new.institution_id is distinct from old.institution_id then
    raise exception 'Não é permitido mover registros entre instituições.' using errcode = '42501';
  end if;
  return new;
end $$;

do $$ declare t text; begin
  foreach t in array array['units','services','memberships','invitations','professionals','professional_documents',
                           'availability_slots','shift_preferences','absences'] loop
    execute format('create trigger %I_inst_guard before update on public.%I for each row execute function public.guard_institution_change()', t, t);
  end loop;
end $$;

-- Situação de validação só muda por quem pode verificar; vínculo de usuário só por RPC.
create or replace function public.guard_professional() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    if new.validation_status <> 'pendente' and not public.has_perm(new.institution_id, 'documents.verify') then
      new.validation_status := 'pendente';
    end if;
    if new.user_id is not null and coalesce(current_setting('medlink.allow_link', true), '') <> 'on' then
      new.user_id := null;
    end if;
    return new;
  end if;
  if new.validation_status is distinct from old.validation_status
     and not public.has_perm(new.institution_id, 'documents.verify') then
    raise exception 'Somente quem verifica documentos pode alterar a situação de validação.' using errcode = '42501';
  end if;
  if new.user_id is distinct from old.user_id and coalesce(current_setting('medlink.allow_link', true), '') <> 'on' then
    raise exception 'O vínculo com a conta do profissional é feito por convite.' using errcode = '42501';
  end if;
  return new;
end $$;
create trigger professionals_guard before insert or update on public.professionals
  for each row execute function public.guard_professional();

create or replace function public.guard_document() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    new.status := 'enviado'; new.verified_by := null; new.verified_at := null;
    new.created_by := auth.uid();
    return new;
  end if;
  if new.status is distinct from old.status then
    if not public.has_perm(new.institution_id, 'documents.verify') then
      raise exception 'Somente quem verifica documentos pode alterar a situação do documento.' using errcode = '42501';
    end if;
    new.verified_by := case when new.status = 'enviado' then null else auth.uid() end;
    new.verified_at := case when new.status = 'enviado' then null else now() end;
  elsif new.file_path is distinct from old.file_path or new.expires_on is distinct from old.expires_on then
    -- documento substituído volta a "enviado": precisa de nova verificação
    new.status := 'enviado'; new.verified_by := null; new.verified_at := null;
  end if;
  return new;
end $$;
create trigger documents_guard before insert or update on public.professional_documents
  for each row execute function public.guard_document();

-- Perfis de administração institucional não podem perder permissões.
create or replace function public.guard_role_permissions() returns trigger
language plpgsql as $$
begin
  if coalesce(new.role, old.role) = 'institution_admin' and coalesce(current_setting('medlink.seeding', true), '') <> 'on' then
    raise exception 'As permissões do administrador institucional não podem ser alteradas.' using errcode = '42501';
  end if;
  if tg_op <> 'DELETE' and not (new.permission = any(public.all_permissions())) then
    raise exception 'Permissão desconhecida: %', new.permission using errcode = '22023';
  end if;
  return coalesce(new, old);
end $$;
create trigger role_permissions_guard before insert or update or delete on public.role_permissions
  for each row execute function public.guard_role_permissions();

-- ---------------------------------------------------------------------------
-- Notificações (inseridas apenas por funções)
-- ---------------------------------------------------------------------------
create or replace function public.notify_user(p_user uuid, p_inst uuid, p_kind text, p_title text, p_body text, p_link text)
returns void language sql security definer set search_path = public as $$
  insert into notifications(user_id, institution_id, kind, title, body, link)
  select p_user, p_inst, p_kind, p_title, p_body, p_link where p_user is not null;
$$;

create or replace function public.notify_perm(p_inst uuid, p_unit uuid, p_perm text, p_kind text, p_title text, p_body text, p_link text)
returns void language sql security definer set search_path = public as $$
  insert into notifications(user_id, institution_id, kind, title, body, link)
  select distinct m.user_id, p_inst, p_kind, p_title, p_body, p_link
    from memberships m
    join role_permissions rp on rp.institution_id = m.institution_id and rp.role = m.role
   where m.institution_id = p_inst and m.active and rp.permission = p_perm
     and (p_unit is null or m.unit_ids is null or p_unit = any(m.unit_ids))
     and m.user_id is distinct from auth.uid();
$$;

create or replace function public.notify_professional(p_prof uuid, p_kind text, p_title text, p_body text, p_link text)
returns void language sql security definer set search_path = public as $$
  insert into notifications(user_id, institution_id, kind, title, body, link)
  select p.user_id, p.institution_id, p_kind, p_title, p_body, p_link
    from professionals p where p.id = p_prof and p.user_id is not null and p.user_id is distinct from auth.uid();
$$;

create or replace function public.mark_notifications_read(p_ids uuid[] default null) returns int
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  update notifications set read_at = now()
   where user_id = auth.uid() and read_at is null and (p_ids is null or id = any(p_ids));
  get diagnostics n = row_count;
  return n;
end $$;

-- ---------------------------------------------------------------------------
-- Contas: perfil automático e aceite de convites (somente e-mail confirmado)
-- ---------------------------------------------------------------------------
create or replace function public.claim_invitations(p_user uuid) returns int
language plpgsql security definer set search_path = public as $$
declare inv record; v_email text; n int := 0;
begin
  select lower(email) into v_email from auth.users where id = p_user and email_confirmed_at is not null;
  if v_email is null then return 0; end if;
  perform set_config('medlink.allow_link', 'on', true);
  perform set_action('member.accept_invite');
  for inv in select * from invitations where email = v_email and accepted_at is null loop
    insert into memberships(institution_id, user_id, role, unit_ids)
    values (inv.institution_id, p_user, inv.role, inv.unit_ids)
    on conflict (institution_id, user_id, role) do update set active = true;
    if inv.professional_id is not null then
      update professionals set user_id = p_user
       where id = inv.professional_id and (user_id is null or user_id = p_user)
         and not exists (select 1 from professionals p2 where p2.institution_id = inv.institution_id and p2.user_id = p_user and p2.id <> inv.professional_id);
    end if;
    update invitations set accepted_at = now() where id = inv.id;
    n := n + 1;
  end loop;
  perform set_config('medlink.allow_link', '', true);
  return n;
end $$;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles(id, email, full_name)
  values (new.id, lower(new.email), nullif(btrim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), ''))
  on conflict (id) do nothing;
  if new.email_confirmed_at is not null then perform public.claim_invitations(new.id); end if;
  return new;
end $$;

create or replace function public.handle_user_confirmed() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if old.email_confirmed_at is null and new.email_confirmed_at is not null then
    perform public.claim_invitations(new.id);
  end if;
  if new.email is distinct from old.email then
    update profiles set email = lower(new.email) where id = new.id;
  end if;
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
create trigger on_auth_user_updated after update on auth.users
  for each row execute function public.handle_user_confirmed();

-- ---------------------------------------------------------------------------
-- RPC: instituições, membros e permissões
-- ---------------------------------------------------------------------------
create or replace function public.create_institution(
  p_name text, p_type public.institution_type, p_cnpj text default null, p_legal_name text default null,
  p_modules text[] default array['escalas','profissionais'], p_unit_name text default null,
  p_unit_city text default null, p_unit_uf text default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_cnpj text; r public.app_role;
begin
  if auth.uid() is null then raise exception 'Sessão expirada. Entre novamente.' using errcode = '42501'; end if;
  v_cnpj := nullif(regexp_replace(coalesce(p_cnpj, ''), '\D', '', 'g'), '');
  if v_cnpj is not null and not public.valid_cnpj(v_cnpj) then
    raise exception 'CNPJ inválido. Confira os 14 dígitos.' using errcode = '22023';
  end if;
  if v_cnpj is not null and exists (select 1 from institutions where cnpj = v_cnpj) then
    raise exception 'Já existe uma instituição cadastrada com este CNPJ.' using errcode = '23505';
  end if;
  if (select count(*) from memberships where user_id = auth.uid() and role = 'institution_admin') >= 10 then
    raise exception 'Limite de instituições por conta atingido.' using errcode = '54000';
  end if;

  perform set_action('institution.create');
  insert into institutions(name, legal_name, cnpj, type, modules, created_by)
  values (btrim(p_name), nullif(btrim(coalesce(p_legal_name, '')), ''), v_cnpj, p_type,
          (select array(select distinct unnest(coalesce(p_modules, '{}') || array['escalas','profissionais']))), auth.uid())
  returning id into v_id;

  perform set_config('medlink.seeding', 'on', true);
  foreach r in array enum_range(null::public.app_role) loop
    insert into role_permissions(institution_id, role, permission)
    select v_id, r, unnest(public.default_permissions(r));
  end loop;
  perform set_config('medlink.seeding', '', true);

  insert into memberships(institution_id, user_id, role) values (v_id, auth.uid(), 'institution_admin');
  insert into units(institution_id, name, city, uf)
  values (v_id, coalesce(nullif(btrim(coalesce(p_unit_name, '')), ''), 'Unidade principal'),
          nullif(btrim(coalesce(p_unit_city, '')), ''), nullif(upper(btrim(coalesce(p_unit_uf, ''))), ''));
  return v_id;
end $$;

create or replace function public.invite_member(p_inst uuid, p_email text, p_role public.app_role, p_unit_ids uuid[] default null)
returns text language plpgsql security definer set search_path = public as $$
declare v_email text := lower(btrim(p_email)); v_user uuid;
begin
  perform public.require_perm(p_inst, 'members.manage');
  if p_role = 'institution_admin' and not public.has_perm(p_inst, 'institution.manage') then
    raise exception 'Somente administradores podem conceder o perfil de administrador.' using errcode = '42501';
  end if;
  if p_role = 'professional' then
    raise exception 'Profissionais são convidados a partir do cadastro profissional.' using errcode = '22023';
  end if;
  if p_unit_ids is not null and exists (select 1 from unnest(p_unit_ids) u where not exists (select 1 from units where id = u and institution_id = p_inst)) then
    raise exception 'Unidade inválida para esta instituição.' using errcode = '22023';
  end if;
  perform set_action('member.invite');
  select u.id into v_user from auth.users u where lower(u.email) = v_email and u.email_confirmed_at is not null;
  if v_user is not null then
    insert into memberships(institution_id, user_id, role, unit_ids) values (p_inst, v_user, p_role, p_unit_ids)
    on conflict (institution_id, user_id, role) do update set active = true, unit_ids = excluded.unit_ids;
    perform public.notify_user(v_user, p_inst, 'equipe', 'Você foi adicionado a uma instituição', null, '/painel');
    return 'adicionado';
  end if;
  insert into invitations(institution_id, email, role, unit_ids, invited_by)
  values (p_inst, v_email, p_role, p_unit_ids, auth.uid())
  on conflict (institution_id, email, role) do update set unit_ids = excluded.unit_ids, accepted_at = null;
  return 'convidado';
end $$;

create or replace function public.set_member_active(p_membership uuid, p_active boolean) returns void
language plpgsql security definer set search_path = public as $$
declare m memberships;
begin
  select * into m from memberships where id = p_membership for update;
  if not found then raise exception 'Vínculo não encontrado.' using errcode = 'P0002'; end if;
  perform public.require_perm(m.institution_id, 'members.manage');
  if m.role = 'institution_admin' and not public.has_perm(m.institution_id, 'institution.manage') then
    raise exception 'Somente administradores podem alterar outro administrador.' using errcode = '42501';
  end if;
  if not p_active and m.role = 'institution_admin'
     and (select count(*) from memberships where institution_id = m.institution_id and role = 'institution_admin' and active) <= 1 then
    raise exception 'A instituição precisa de pelo menos um administrador ativo.' using errcode = '23514';
  end if;
  perform set_action(case when p_active then 'member.activate' else 'member.deactivate' end);
  update memberships set active = p_active where id = p_membership;
end $$;

create or replace function public.set_role_permissions(p_inst uuid, p_role public.app_role, p_perms text[]) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform public.require_perm(p_inst, 'settings.manage');
  perform set_action('settings.permissions');
  delete from role_permissions where institution_id = p_inst and role = p_role and not (permission = any(p_perms));
  insert into role_permissions(institution_id, role, permission)
  select p_inst, p_role, unnest(p_perms) on conflict do nothing;
end $$;

create or replace function public.invite_professional(p_professional uuid) returns text
language plpgsql security definer set search_path = public as $$
declare p professionals; v_user uuid;
begin
  select * into p from professionals where id = p_professional;
  if not found then raise exception 'Profissional não encontrado.' using errcode = 'P0002'; end if;
  perform public.require_perm(p.institution_id, 'professionals.manage');
  if p.email is null then raise exception 'Informe o e-mail do profissional antes de convidar.' using errcode = '22023'; end if;
  if p.user_id is not null then return 'ja_vinculado'; end if;
  perform set_action('professional.invite');
  insert into invitations(institution_id, email, role, professional_id, invited_by)
  values (p.institution_id, lower(p.email), 'professional', p.id, auth.uid())
  on conflict (institution_id, email, role) do update set professional_id = excluded.professional_id, accepted_at = null;
  select u.id into v_user from auth.users u where lower(u.email) = lower(p.email) and u.email_confirmed_at is not null;
  if v_user is not null then
    perform public.claim_invitations(v_user);
    perform public.notify_user(v_user, p.institution_id, 'equipe', 'Seu cadastro profissional foi vinculado', 'Acesse a Minha área para ver plantões e informar disponibilidade.', '/meu');
    return 'vinculado';
  end if;
  return 'convidado';
end $$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.platform_admins enable row level security;
alter table public.institutions enable row level security;
alter table public.units enable row level security;
alter table public.services enable row level security;
alter table public.memberships enable row level security;
alter table public.role_permissions enable row level security;
alter table public.invitations enable row level security;
alter table public.professionals enable row level security;
alter table public.professional_units enable row level security;
alter table public.professional_documents enable row level security;
alter table public.availability_slots enable row level security;
alter table public.shift_preferences enable row level security;
alter table public.absences enable row level security;
alter table public.audit_log enable row level security;
alter table public.notifications enable row level security;

-- perfis: o próprio, ou colegas para quem gerencia equipe / lê auditoria
create policy profiles_self on public.profiles for select using (id = auth.uid());
create policy profiles_colleagues on public.profiles for select using (
  exists (select 1 from memberships m where m.user_id = profiles.id
          and (public.has_perm(m.institution_id, 'members.manage') or public.has_perm(m.institution_id, 'audit.view'))));
create policy profiles_update_self on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

create policy platform_admins_self on public.platform_admins for select using (user_id = auth.uid());

create policy institutions_read on public.institutions for select using (public.is_member(id) or public.is_platform_admin());
create policy institutions_update on public.institutions for update
  using (public.has_perm(id, 'institution.manage')) with check (public.has_perm(id, 'institution.manage'));

create policy units_read on public.units for select using (public.is_member(institution_id));
create policy units_insert on public.units for insert with check (public.has_perm(institution_id, 'units.manage'));
create policy units_update on public.units for update
  using (public.has_perm(institution_id, 'units.manage')) with check (public.has_perm(institution_id, 'units.manage'));

create policy services_read on public.services for select using (public.is_member(institution_id));
create policy services_insert on public.services for insert with check (public.has_perm(institution_id, 'units.manage'));
create policy services_update on public.services for update
  using (public.has_perm(institution_id, 'units.manage')) with check (public.has_perm(institution_id, 'units.manage'));

create policy memberships_read on public.memberships for select
  using (user_id = auth.uid() or public.has_perm(institution_id, 'members.manage'));

create policy role_permissions_read on public.role_permissions for select using (public.is_member(institution_id));

create policy invitations_read on public.invitations for select using (public.has_perm(institution_id, 'members.manage') or public.has_perm(institution_id, 'professionals.manage'));
create policy invitations_delete on public.invitations for delete using (public.has_perm(institution_id, 'members.manage'));

create policy professionals_read on public.professionals for select
  using (public.has_perm(institution_id, 'professionals.view') or user_id = auth.uid());
create policy professionals_insert on public.professionals for insert
  with check (public.has_perm(institution_id, 'professionals.manage'));
create policy professionals_update on public.professionals for update
  using (public.has_perm(institution_id, 'professionals.manage') or public.has_perm(institution_id, 'documents.verify'))
  with check (public.has_perm(institution_id, 'professionals.manage') or public.has_perm(institution_id, 'documents.verify'));

create policy prof_units_read on public.professional_units for select
  using (public.has_perm(institution_id, 'professionals.view') or professional_id = public.my_professional_id(institution_id));
create policy prof_units_write on public.professional_units for all
  using (public.has_perm(institution_id, 'professionals.manage')) with check (public.has_perm(institution_id, 'professionals.manage'));

create policy documents_read on public.professional_documents for select
  using (public.has_perm(institution_id, 'professionals.view') or professional_id = public.my_professional_id(institution_id));
create policy documents_insert on public.professional_documents for insert
  with check (public.has_perm(institution_id, 'professionals.manage') or professional_id = public.my_professional_id(institution_id));
create policy documents_update on public.professional_documents for update
  using (public.has_perm(institution_id, 'professionals.manage') or public.has_perm(institution_id, 'documents.verify'))
  with check (public.has_perm(institution_id, 'professionals.manage') or public.has_perm(institution_id, 'documents.verify'));

-- disponibilidade/preferências/ausências: o próprio profissional ou gestão de profissionais
create policy avail_read on public.availability_slots for select
  using (public.has_perm(institution_id, 'professionals.view') or professional_id = public.my_professional_id(institution_id));
create policy avail_write on public.availability_slots for all
  using (public.has_perm(institution_id, 'professionals.manage') or professional_id = public.my_professional_id(institution_id))
  with check (public.has_perm(institution_id, 'professionals.manage') or professional_id = public.my_professional_id(institution_id));
create policy prefs_read on public.shift_preferences for select
  using (public.has_perm(institution_id, 'professionals.view') or professional_id = public.my_professional_id(institution_id));
create policy prefs_write on public.shift_preferences for all
  using (public.has_perm(institution_id, 'professionals.manage') or professional_id = public.my_professional_id(institution_id))
  with check (public.has_perm(institution_id, 'professionals.manage') or professional_id = public.my_professional_id(institution_id));
create policy absences_read on public.absences for select
  using (public.has_perm(institution_id, 'professionals.view') or professional_id = public.my_professional_id(institution_id));
create policy absences_write on public.absences for all
  using (public.has_perm(institution_id, 'professionals.manage') or professional_id = public.my_professional_id(institution_id))
  with check (public.has_perm(institution_id, 'professionals.manage') or professional_id = public.my_professional_id(institution_id));

create policy audit_read on public.audit_log for select using (public.has_perm(institution_id, 'audit.view'));

create policy notifications_read on public.notifications for select using (user_id = auth.uid());

-- Privilégios: anônimo não acessa nada; histórico de auditoria é somente leitura.
revoke all on all tables in schema public from anon;
revoke all on all functions in schema public from anon, public;
grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
revoke insert, update, delete on public.audit_log from authenticated;
revoke insert, update, delete on public.notifications from authenticated;
revoke insert, update, delete on public.memberships, public.role_permissions from authenticated;
revoke insert, update on public.invitations from authenticated;
revoke insert, delete on public.institutions from authenticated;
grant execute on all functions in schema public to authenticated;
-- funções internas não devem ser chamadas diretamente
revoke execute on function public.claim_invitations(uuid) from authenticated;
revoke execute on function public.notify_user(uuid, uuid, text, text, text, text) from authenticated;
revoke execute on function public.notify_perm(uuid, uuid, text, text, text, text, text) from authenticated;
revoke execute on function public.notify_professional(uuid, text, text, text, text) from authenticated;
revoke execute on function public.audit_trigger() from authenticated;
