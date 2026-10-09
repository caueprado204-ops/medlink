-- MedLink — 0002: escalas, atribuições, solicitações e oportunidades
-- Plantões e atribuições só são alterados por funções que aplicam as regras:
--   bloqueio  = restrição obrigatória (não pode ser ignorada)
--   alerta    = exige justificativa explícita para ser autorizado (exceção registrada)

create type public.shift_status as enum (
  'rascunho','publicado','aguardando_confirmacao','confirmado','descoberto','substituicao_solicitada','cancelado'
);
create type public.assignment_status as enum (
  'aguardando_confirmacao','confirmado','substituicao_solicitada','recusado','removido'
);
create type public.request_kind as enum ('substituicao','cancelamento','alteracao','candidatura');
create type public.request_status as enum ('pendente','aprovada','recusada','cancelada');

create table public.shifts (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  unit_id uuid not null,
  service_id uuid references public.services(id) on delete set null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  break_minutes int not null default 0 check (break_minutes between 0 and 240),
  category public.professional_category,
  slots int not null default 1 check (slots between 1 and 50),
  required_competencies text[] not null default '{}',
  notes text check (notes is null or length(notes) <= 2000),
  status public.shift_status not null default 'rascunho',
  series_id uuid,
  created_by uuid references auth.users(id) on delete set null,
  published_at timestamptz,
  cancelled_at timestamptz,
  cancel_reason text,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at),
  check (ends_at - starts_at <= interval '36 hours'),
  foreign key (unit_id, institution_id) references public.units(id, institution_id) on delete cascade
);
create index shifts_inst_time_idx on public.shifts(institution_id, starts_at);
create index shifts_series_idx on public.shifts(series_id) where series_id is not null;

create table public.shift_assignments (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null,
  shift_id uuid not null references public.shifts(id) on delete cascade,
  professional_id uuid not null,
  status public.assignment_status not null default 'aguardando_confirmacao',
  assigned_by uuid references auth.users(id) on delete set null,
  confirmed_at timestamptz,
  exception_reason text,         -- justificativa quando alertas foram autorizados
  warnings jsonb not null default '[]',
  ended_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (professional_id, institution_id) references public.professionals(id, institution_id) on delete cascade
);
create unique index assignments_active_uniq on public.shift_assignments(shift_id, professional_id)
  where status in ('aguardando_confirmacao','confirmado','substituicao_solicitada');
create index assignments_prof_idx on public.shift_assignments(professional_id, status);

create table public.change_requests (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  shift_id uuid not null references public.shifts(id) on delete cascade,
  assignment_id uuid references public.shift_assignments(id) on delete set null,
  professional_id uuid not null,
  kind public.request_kind not null,
  reason text check (reason is null or length(reason) <= 1000),
  suggested_professional_id uuid references public.professionals(id) on delete set null,
  previous_assignment_status public.assignment_status,
  status public.request_status not null default 'pendente',
  decided_by uuid references auth.users(id) on delete set null,
  decided_at timestamptz,
  decision_note text,
  created_at timestamptz not null default now(),
  foreign key (professional_id, institution_id) references public.professionals(id, institution_id) on delete cascade
);
create unique index requests_pending_uniq on public.change_requests(shift_id, professional_id, kind) where status = 'pendente';
create index requests_inst_idx on public.change_requests(institution_id, status);

create trigger shifts_updated before update on public.shifts for each row execute function public.set_updated_at();
create trigger assignments_updated before update on public.shift_assignments for each row execute function public.set_updated_at();
create trigger shifts_inst_guard before update on public.shifts for each row execute function public.guard_institution_change();
create trigger assignments_inst_guard before update on public.shift_assignments for each row execute function public.guard_institution_change();
create trigger requests_inst_guard before update on public.change_requests for each row execute function public.guard_institution_change();
create trigger shifts_audit after insert or update or delete on public.shifts for each row execute function public.audit_trigger();
create trigger assignments_audit after insert or update or delete on public.shift_assignments for each row execute function public.audit_trigger();
create trigger requests_audit after insert or update or delete on public.change_requests for each row execute function public.audit_trigger();

-- ---------------------------------------------------------------------------
-- Rótulos e utilitários
-- ---------------------------------------------------------------------------
create or replace function public.category_label(c public.professional_category) returns text
language sql immutable as $$
  select case c
    when 'medico' then 'Médico(a)' when 'enfermeiro' then 'Enfermeiro(a)'
    when 'tecnico_enfermagem' then 'Técnico(a) de enfermagem' when 'auxiliar_enfermagem' then 'Auxiliar de enfermagem'
    when 'fisioterapeuta' then 'Fisioterapeuta' when 'farmaceutico' then 'Farmacêutico(a)'
    when 'nutricionista' then 'Nutricionista' when 'psicologo' then 'Psicólogo(a)'
    when 'fonoaudiologo' then 'Fonoaudiólogo(a)' when 'biomedico' then 'Biomédico(a)' else 'Outro' end
$$;

create or replace function public.issue(p_code text, p_message text) returns jsonb
language sql immutable as $$ select jsonb_build_object('code', p_code, 'message', p_message) $$;

create or replace function public.active_assignment(s public.assignment_status) returns boolean
language sql immutable as $$ select s in ('aguardando_confirmacao','confirmado','substituicao_solicitada') $$;

create or replace function public.shift_hours(p_start timestamptz, p_end timestamptz, p_break int) returns numeric
language sql immutable as $$ select round((extract(epoch from (p_end - p_start)) / 3600.0 - coalesce(p_break, 0) / 60.0)::numeric, 2) $$;

-- Situação derivada da cobertura (rascunho e cancelado são definidos explicitamente)
create or replace function public.recompute_shift_status(p_shift uuid) returns public.shift_status
language plpgsql security definer set search_path = public as $$
declare s shifts; v_active int; v_pending int; v_sub int; v_new public.shift_status;
begin
  select * into s from shifts where id = p_shift;
  if s.status in ('rascunho','cancelado') then return s.status; end if;
  select count(*) filter (where public.active_assignment(status)),
         count(*) filter (where status = 'aguardando_confirmacao'),
         count(*) filter (where status = 'substituicao_solicitada')
    into v_active, v_pending, v_sub
    from shift_assignments where shift_id = p_shift;
  v_new := case
    when v_sub > 0 then 'substituicao_solicitada'
    when v_active < s.slots then 'descoberto'
    when v_pending > 0 then 'aguardando_confirmacao'
    else 'confirmado' end;
  if v_new is distinct from s.status then update shifts set status = v_new where id = p_shift; end if;
  return v_new;
end $$;

-- ---------------------------------------------------------------------------
-- Regras de atribuição. Usado pela UI (pré-visualização), pela atribuição e,
-- na Etapa 2, pelo motor de escalonamento — uma única fonte de verdade.
-- ---------------------------------------------------------------------------
create or replace function public.assignment_checks(
  p_shift uuid, p_professional uuid, p_ignore_assignment uuid default null,
  p_starts_at timestamptz default null, p_ends_at timestamptz default null
) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  s shifts; p professionals; inst institutions; pref shift_preferences;
  tz text; v_rest int; v_max_week numeric; v_start timestamptz; v_end timestamptz;
  ls timestamp; le timestamp; v_ws timestamp; v_week numeric; v_missing text[];
  blocking jsonb := '[]'; warnings jsonb := '[]'; r record; v_count int; v_covered boolean;
begin
  select * into s from shifts where id = p_shift;
  if not found then raise exception 'Plantão não encontrado.' using errcode = 'P0002'; end if;
  if auth.uid() is not null and current_setting('medlink.internal', true) is distinct from 'on'
     and not public.has_unit_perm(s.institution_id, s.unit_id, 'shifts.view') then
    raise exception 'Você não tem permissão para esta ação.' using errcode = '42501';
  end if;

  select * into p from professionals where id = p_professional;
  if not found or p.institution_id <> s.institution_id then
    return jsonb_build_object('blocking', jsonb_build_array(public.issue('profissional_invalido', 'Profissional não pertence a esta instituição.')), 'warnings', '[]'::jsonb);
  end if;
  select * into inst from institutions where id = s.institution_id;
  select * into pref from shift_preferences where professional_id = p.id;
  tz := coalesce(inst.settings ->> 'timezone', 'America/Sao_Paulo');
  v_rest := coalesce((inst.settings ->> 'min_rest_hours')::int, 11);
  v_max_week := coalesce(pref.max_weekly_hours, (inst.settings ->> 'max_weekly_hours')::numeric, 44);
  v_start := coalesce(p_starts_at, s.starts_at);
  v_end := coalesce(p_ends_at, s.ends_at);
  ls := v_start at time zone tz; le := v_end at time zone tz;

  -- Restrições obrigatórias
  if s.status = 'cancelado' then
    blocking := blocking || public.issue('cancelado', 'Plantão cancelado.');
  end if;
  if not p.active then
    blocking := blocking || public.issue('inativo', 'Profissional inativo.');
  end if;
  if p.validation_status = 'rejeitado' then
    blocking := blocking || public.issue('cadastro_rejeitado', 'Cadastro do profissional foi rejeitado na validação.');
  end if;
  if s.category is not null and s.category <> p.category then
    blocking := blocking || public.issue('categoria', format('Este plantão exige a categoria %s.', public.category_label(s.category)));
  end if;
  if exists (select 1 from shift_assignments a where a.shift_id = s.id and a.professional_id = p.id
             and public.active_assignment(a.status) and a.id is distinct from p_ignore_assignment) then
    blocking := blocking || public.issue('ja_escalado', 'Profissional já está neste plantão.');
  end if;
  if p_ignore_assignment is null then
    select count(*) into v_count from shift_assignments a where a.shift_id = s.id and public.active_assignment(a.status);
    if v_count >= s.slots then
      blocking := blocking || public.issue('vagas', 'Todas as vagas deste plantão já estão preenchidas.');
    end if;
  end if;
  for r in
    select s2.starts_at, s2.ends_at, u.name as unit_name
      from shift_assignments a join shifts s2 on s2.id = a.shift_id join units u on u.id = s2.unit_id
     where a.professional_id = p.id and public.active_assignment(a.status) and s2.status <> 'cancelado'
       and s2.id <> s.id and s2.starts_at < v_end and s2.ends_at > v_start
  loop
    blocking := blocking || public.issue('sobreposicao', format('Sobrepõe outro plantão em %s (%s–%s).',
      r.unit_name, to_char(r.starts_at at time zone tz, 'DD/MM HH24:MI'), to_char(r.ends_at at time zone tz, 'HH24:MI')));
  end loop;
  for r in
    select kind, starts_on, ends_on from absences
     where professional_id = p.id and starts_on <= le::date and ends_on >= ls::date
  loop
    if r.kind = 'indisponivel' then
      warnings := warnings || public.issue('indisponivel', format('Marcou indisponibilidade entre %s e %s.', to_char(r.starts_on, 'DD/MM'), to_char(r.ends_on, 'DD/MM')));
    else
      blocking := blocking || public.issue('ausencia', format('Em %s entre %s e %s.',
        case r.kind when 'ferias' then 'férias' when 'licenca' then 'licença' else 'afastamento' end,
        to_char(r.starts_on, 'DD/MM'), to_char(r.ends_on, 'DD/MM')));
    end if;
  end loop;

  -- Alertas (exigem justificativa)
  for r in
    select s2.starts_at, s2.ends_at
      from shift_assignments a join shifts s2 on s2.id = a.shift_id
     where a.professional_id = p.id and public.active_assignment(a.status) and s2.status <> 'cancelado'
       and s2.id <> s.id and not (s2.starts_at < v_end and s2.ends_at > v_start)
       and s2.ends_at > v_start - make_interval(hours => v_rest)
       and s2.starts_at < v_end + make_interval(hours => v_rest)
  loop
    warnings := warnings || public.issue('descanso', format('Descanso menor que %sh em relação ao plantão de %s.',
      v_rest, to_char(r.starts_at at time zone tz, 'DD/MM HH24:MI')));
  end loop;

  select array(select unnest(s.required_competencies) except select unnest(p.competencies)) into v_missing;
  if cardinality(v_missing) > 0 then
    warnings := warnings || public.issue('competencias', 'Competências não registradas: ' || array_to_string(v_missing, ', ') || '.');
  end if;

  if p.validation_status in ('pendente','em_analise') then
    warnings := warnings || public.issue('validacao', 'Cadastro profissional ainda não validado.');
  end if;

  if exists (select 1 from professional_units where professional_id = p.id)
     and not exists (select 1 from professional_units where professional_id = p.id and unit_id = s.unit_id) then
    warnings := warnings || public.issue('unidade', 'Unidade fora das informadas pelo profissional.');
  end if;

  if exists (select 1 from availability_slots where professional_id = p.id) then
    select exists (
      select 1 from availability_slots a
       where a.professional_id = p.id and a.weekday = extract(dow from ls)::int and a.start_time <= ls::time
         and (
           (a.end_time > a.start_time and le::date = ls::date and a.end_time >= le::time)
           or (a.end_time <= a.start_time and (le::date = ls::date or (le::date = ls::date + 1 and a.end_time >= le::time)))
         )
    ) into v_covered;
    if not v_covered then
      warnings := warnings || public.issue('disponibilidade', 'Fora da disponibilidade informada pelo profissional.');
    end if;
  end if;

  v_ws := date_trunc('week', ls);
  select coalesce(sum(public.shift_hours(s2.starts_at, s2.ends_at, s2.break_minutes)), 0) into v_week
    from shift_assignments a join shifts s2 on s2.id = a.shift_id
   where a.professional_id = p.id and public.active_assignment(a.status) and s2.status <> 'cancelado' and s2.id <> s.id
     and (s2.starts_at at time zone tz) >= v_ws and (s2.starts_at at time zone tz) < v_ws + interval '7 days';
  v_week := v_week + public.shift_hours(v_start, v_end, s.break_minutes);
  if v_week > v_max_week then
    warnings := warnings || public.issue('carga_semanal', format('Carga na semana chegaria a %sh (limite configurado: %sh).',
      trim(to_char(v_week, 'FM990.9')), trim(to_char(v_max_week, 'FM990.9'))));
  end if;

  return jsonb_build_object('blocking', blocking, 'warnings', warnings);
end $$;

-- Aplica as regras e levanta erro estruturado (detail = JSON com bloqueios/alertas)
create or replace function public.enforce_checks(p_checks jsonb, p_override_reason text) returns void
language plpgsql as $$
begin
  if jsonb_array_length(p_checks -> 'blocking') > 0 then
    raise exception '%', p_checks -> 'blocking' -> 0 ->> 'message' using errcode = 'ML002', detail = p_checks::text;
  end if;
  if jsonb_array_length(p_checks -> 'warnings') > 0 and nullif(btrim(coalesce(p_override_reason, '')), '') is null then
    raise exception 'Esta alteração gera alertas. Revise e informe uma justificativa para autorizar a exceção.'
      using errcode = 'ML001', detail = p_checks::text;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Plantões
-- ---------------------------------------------------------------------------
create or replace function public.save_shift(p jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid := nullif(p ->> 'id', '')::uuid;
  old_s shifts; v_inst uuid; v_unit uuid; v_service uuid; v_start timestamptz; v_end timestamptz;
  v_break int; v_slots int; v_max numeric; v_active int; v_reason text := nullif(btrim(coalesce(p ->> 'override_reason', '')), '');
  r record; chk jsonb; v_all_warn jsonb := '[]'; v_times_changed boolean := false; v_cat public.professional_category;
begin
  if v_id is not null then
    select * into old_s from shifts where id = v_id for update;
    if not found then raise exception 'Plantão não encontrado.' using errcode = 'P0002'; end if;
    perform public.require_perm(old_s.institution_id, 'shifts.manage', old_s.unit_id);
    if old_s.status = 'cancelado' then raise exception 'Plantão cancelado não pode ser editado.' using errcode = '23514'; end if;
    v_inst := old_s.institution_id;
  else
    v_inst := (p ->> 'institution_id')::uuid;
  end if;

  v_unit := coalesce(nullif(p ->> 'unit_id', '')::uuid, old_s.unit_id);
  v_service := case when p ? 'service_id' then nullif(p ->> 'service_id', '')::uuid else old_s.service_id end;
  v_start := coalesce(nullif(p ->> 'starts_at', '')::timestamptz, old_s.starts_at);
  v_end := coalesce(nullif(p ->> 'ends_at', '')::timestamptz, old_s.ends_at);
  v_break := coalesce(nullif(p ->> 'break_minutes', '')::int, old_s.break_minutes, 0);
  v_slots := coalesce(nullif(p ->> 'slots', '')::int, old_s.slots, 1);
  v_cat := case when p ? 'category' then nullif(p ->> 'category', '')::public.professional_category else old_s.category end;

  if v_inst is null or v_unit is null or v_start is null or v_end is null then
    raise exception 'Informe unidade, data e horários.' using errcode = '22023';
  end if;
  perform public.require_perm(v_inst, 'shifts.manage', v_unit);
  if not exists (select 1 from units where id = v_unit and institution_id = v_inst and active) then
    raise exception 'Unidade inválida ou inativa.' using errcode = '22023';
  end if;
  if v_service is not null and not exists (select 1 from services where id = v_service and unit_id = v_unit and active) then
    raise exception 'O serviço não pertence à unidade selecionada.' using errcode = '22023';
  end if;
  if v_end <= v_start then raise exception 'O término deve ser depois do início.' using errcode = '22023'; end if;
  select coalesce((settings ->> 'max_shift_hours')::numeric, 24) into v_max from institutions where id = v_inst;
  if extract(epoch from (v_end - v_start)) / 3600.0 > v_max then
    raise exception 'Duração acima do máximo configurado (%h).', v_max using errcode = '23514';
  end if;
  if v_break * 60 >= extract(epoch from (v_end - v_start)) then
    raise exception 'O intervalo não pode ser maior que o plantão.' using errcode = '22023';
  end if;

  if v_id is null then
    perform set_action('shift.create');
    insert into shifts(institution_id, unit_id, service_id, starts_at, ends_at, break_minutes, category, slots,
                       required_competencies, notes, created_by, series_id)
    values (v_inst, v_unit, v_service, v_start, v_end, v_break, v_cat, v_slots,
            coalesce((select array_agg(btrim(x)) from jsonb_array_elements_text(p -> 'required_competencies') x where btrim(x) <> ''), '{}'),
            nullif(btrim(coalesce(p ->> 'notes', '')), ''), auth.uid(), nullif(p ->> 'series_id', '')::uuid)
    returning id into v_id;
    return v_id;
  end if;

  select count(*) into v_active from shift_assignments where shift_id = v_id and public.active_assignment(status);
  if v_slots < v_active then
    raise exception 'Há % profissionais escalados; remova atribuições antes de reduzir as vagas.', v_active using errcode = '23514';
  end if;
  v_times_changed := v_start <> old_s.starts_at or v_end <> old_s.ends_at;

  -- Revalida cada profissional escalado com os novos horários/unidade/categoria
  if v_times_changed or v_unit <> old_s.unit_id or v_cat is distinct from old_s.category then
    for r in select id, professional_id from shift_assignments where shift_id = v_id and public.active_assignment(status) loop
      perform set_config('medlink.internal', 'on', true);
      chk := public.assignment_checks(v_id, r.professional_id, r.id, v_start, v_end);
      perform set_config('medlink.internal', '', true);
      if v_cat is not null and v_cat <> (select category from professionals where id = r.professional_id) then
        chk := jsonb_set(chk, '{blocking}', (chk -> 'blocking') || public.issue('categoria', 'Há profissional escalado de outra categoria.'));
      end if;
      if jsonb_array_length(chk -> 'blocking') > 0 then perform public.enforce_checks(chk, v_reason); end if;
      v_all_warn := v_all_warn || (chk -> 'warnings');
    end loop;
    perform public.enforce_checks(jsonb_build_object('blocking', '[]'::jsonb, 'warnings', v_all_warn), v_reason);
  end if;

  perform set_action(case when v_times_changed and p ? 'moved' then 'shift.move' else 'shift.update' end, v_reason);
  update shifts set unit_id = v_unit, service_id = v_service, starts_at = v_start, ends_at = v_end,
         break_minutes = v_break, category = v_cat, slots = v_slots,
         required_competencies = case when p ? 'required_competencies'
           then coalesce((select array_agg(btrim(x)) from jsonb_array_elements_text(p -> 'required_competencies') x where btrim(x) <> ''), '{}')
           else required_competencies end,
         notes = case when p ? 'notes' then nullif(btrim(coalesce(p ->> 'notes', '')), '') else notes end
   where id = v_id;
  perform public.recompute_shift_status(v_id);

  if old_s.status <> 'rascunho' and v_times_changed then
    for r in select professional_id from shift_assignments where shift_id = v_id and public.active_assignment(status) loop
      perform public.notify_professional(r.professional_id, 'escala', 'Plantão alterado',
        'Novo horário: ' || to_char(v_start at time zone 'America/Sao_Paulo', 'DD/MM HH24:MI') || '–' || to_char(v_end at time zone 'America/Sao_Paulo', 'HH24:MI'), '/meu');
    end loop;
  end if;
  return v_id;
end $$;

create or replace function public.move_shift(p_id uuid, p_new_start timestamptz, p_override_reason text default null) returns uuid
language plpgsql security definer set search_path = public as $$
declare s shifts;
begin
  select * into s from shifts where id = p_id;
  if not found then raise exception 'Plantão não encontrado.' using errcode = 'P0002'; end if;
  return public.save_shift(jsonb_build_object('id', p_id, 'starts_at', p_new_start, 'ends_at', p_new_start + (s.ends_at - s.starts_at),
                                              'moved', true, 'override_reason', p_override_reason));
end $$;

-- Duplica/recorre: cria cópias em rascunho nas datas informadas, no mesmo horário local.
create or replace function public.duplicate_shift(p_id uuid, p_dates date[]) returns int
language plpgsql security definer set search_path = public as $$
declare s shifts; tz text; d date; v_series uuid; n int := 0; v_start timestamptz;
begin
  select * into s from shifts where id = p_id;
  if not found then raise exception 'Plantão não encontrado.' using errcode = 'P0002'; end if;
  perform public.require_perm(s.institution_id, 'shifts.manage', s.unit_id);
  if cardinality(p_dates) = 0 or cardinality(p_dates) > 120 then
    raise exception 'Selecione entre 1 e 120 datas.' using errcode = '22023';
  end if;
  select coalesce(settings ->> 'timezone', 'America/Sao_Paulo') into tz from institutions where id = s.institution_id;
  v_series := coalesce(s.series_id, gen_random_uuid());
  if s.series_id is null then
    perform set_action('shift.series');
    update shifts set series_id = v_series where id = p_id;
  end if;
  perform set_action('shift.duplicate');
  foreach d in array p_dates loop
    v_start := (d + (s.starts_at at time zone tz)::time) at time zone tz;
    if v_start = s.starts_at then continue; end if;
    insert into shifts(institution_id, unit_id, service_id, starts_at, ends_at, break_minutes, category, slots,
                       required_competencies, notes, created_by, series_id, is_demo)
    values (s.institution_id, s.unit_id, s.service_id, v_start, v_start + (s.ends_at - s.starts_at), s.break_minutes,
            s.category, s.slots, s.required_competencies, s.notes, auth.uid(), v_series, s.is_demo);
    n := n + 1;
  end loop;
  return n;
end $$;

create or replace function public.publish_shifts(p_ids uuid[]) returns int
language plpgsql security definer set search_path = public as $$
declare s shifts; r record; n int := 0;
begin
  perform set_action('shift.publish');
  for s in select * from shifts where id = any(p_ids) and status = 'rascunho' for update loop
    perform public.require_perm(s.institution_id, 'shifts.publish', s.unit_id);
    if s.ends_at <= now() then continue; end if;
    update shifts set status = 'publicado', published_at = now() where id = s.id;
    perform public.recompute_shift_status(s.id);
    for r in select professional_id from shift_assignments where shift_id = s.id and public.active_assignment(status) loop
      perform public.notify_professional(r.professional_id, 'escala', 'Novo plantão na sua escala',
        to_char(s.starts_at at time zone 'America/Sao_Paulo', 'DD/MM HH24:MI') || ' — confirme sua presença.', '/meu');
    end loop;
    n := n + 1;
  end loop;
  return n;
end $$;

create or replace function public.cancel_shift(p_id uuid, p_reason text) returns void
language plpgsql security definer set search_path = public as $$
declare s shifts; r record;
begin
  select * into s from shifts where id = p_id for update;
  if not found then raise exception 'Plantão não encontrado.' using errcode = 'P0002'; end if;
  perform public.require_perm(s.institution_id, 'shifts.manage', s.unit_id);
  if s.status = 'cancelado' then return; end if;
  if nullif(btrim(coalesce(p_reason, '')), '') is null then
    raise exception 'Informe o motivo do cancelamento.' using errcode = '22023';
  end if;
  perform set_action('shift.cancel', p_reason);
  update shifts set status = 'cancelado', cancelled_at = now(), cancel_reason = btrim(p_reason) where id = p_id;
  for r in select id, professional_id from shift_assignments where shift_id = p_id and public.active_assignment(status) loop
    update shift_assignments set status = 'removido', ended_reason = 'Plantão cancelado' where id = r.id;
    if s.status <> 'rascunho' then
      perform public.notify_professional(r.professional_id, 'escala', 'Plantão cancelado',
        to_char(s.starts_at at time zone 'America/Sao_Paulo', 'DD/MM HH24:MI') || ' — ' || btrim(p_reason), '/meu');
    end if;
  end loop;
  update change_requests set status = 'cancelada', decision_note = 'Plantão cancelado', decided_at = now()
   where shift_id = p_id and status = 'pendente';
end $$;

-- ---------------------------------------------------------------------------
-- Atribuições
-- ---------------------------------------------------------------------------
create or replace function public.do_assign(p_shift uuid, p_professional uuid, p_override_reason text, p_confirmed boolean)
returns uuid language plpgsql security definer set search_path = public as $$
declare s shifts; chk jsonb; v_id uuid;
begin
  select * into s from shifts where id = p_shift for update;
  perform pg_advisory_xact_lock(hashtextextended(p_professional::text, 0));
  perform set_config('medlink.internal', 'on', true);
  chk := public.assignment_checks(p_shift, p_professional);
  perform set_config('medlink.internal', '', true);
  perform public.enforce_checks(chk, p_override_reason);
  perform set_action('shift.assign', case when jsonb_array_length(chk -> 'warnings') > 0 then btrim(p_override_reason) end);
  insert into shift_assignments(institution_id, shift_id, professional_id, status, assigned_by, confirmed_at, exception_reason, warnings)
  values (s.institution_id, s.id, p_professional,
          case when p_confirmed then 'confirmado'::assignment_status else 'aguardando_confirmacao'::assignment_status end,
          auth.uid(), case when p_confirmed then now() end,
          case when jsonb_array_length(chk -> 'warnings') > 0 then btrim(p_override_reason) end, chk -> 'warnings')
  returning id into v_id;
  perform public.recompute_shift_status(s.id);
  if s.status <> 'rascunho' then
    perform public.notify_professional(p_professional, 'escala', 'Novo plantão na sua escala',
      to_char(s.starts_at at time zone 'America/Sao_Paulo', 'DD/MM HH24:MI') ||
      case when p_confirmed then '' else ' — confirme sua presença.' end, '/meu');
  end if;
  return v_id;
end $$;
revoke execute on function public.do_assign(uuid, uuid, text, boolean) from public, anon, authenticated;

create or replace function public.assign_professional(p_shift uuid, p_professional uuid, p_override_reason text default null, p_confirmed boolean default false)
returns uuid language plpgsql security definer set search_path = public as $$
declare s shifts;
begin
  select * into s from shifts where id = p_shift;
  if not found then raise exception 'Plantão não encontrado.' using errcode = 'P0002'; end if;
  perform public.require_perm(s.institution_id, 'shifts.manage', s.unit_id);
  return public.do_assign(p_shift, p_professional, p_override_reason, p_confirmed);
end $$;

create or replace function public.remove_assignment(p_assignment uuid, p_reason text) returns void
language plpgsql security definer set search_path = public as $$
declare a shift_assignments; s shifts;
begin
  select * into a from shift_assignments where id = p_assignment for update;
  if not found then raise exception 'Atribuição não encontrada.' using errcode = 'P0002'; end if;
  select * into s from shifts where id = a.shift_id;
  perform public.require_perm(s.institution_id, 'shifts.manage', s.unit_id);
  if not public.active_assignment(a.status) then return; end if;
  if s.status <> 'rascunho' and nullif(btrim(coalesce(p_reason, '')), '') is null then
    raise exception 'Informe o motivo para remover um profissional de uma escala publicada.' using errcode = '22023';
  end if;
  perform set_action('shift.unassign', p_reason);
  update shift_assignments set status = 'removido', ended_reason = nullif(btrim(coalesce(p_reason, '')), '') where id = p_assignment;
  update change_requests set status = 'cancelada', decided_at = now(), decision_note = 'Profissional removido do plantão'
   where assignment_id = p_assignment and status = 'pendente';
  perform public.recompute_shift_status(s.id);
  if s.status <> 'rascunho' then
    perform public.notify_professional(a.professional_id, 'escala', 'Você foi removido de um plantão',
      to_char(s.starts_at at time zone 'America/Sao_Paulo', 'DD/MM HH24:MI'), '/meu');
  end if;
end $$;

-- Ações do próprio profissional -------------------------------------------------
create or replace function public.my_assignment(p_assignment uuid) returns shift_assignments
language plpgsql security definer set search_path = public as $$
declare a shift_assignments;
begin
  select * into a from shift_assignments where id = p_assignment for update;
  if not found or a.professional_id is distinct from public.my_professional_id(a.institution_id) then
    raise exception 'Atribuição não encontrada.' using errcode = 'P0002';
  end if;
  return a;
end $$;
revoke execute on function public.my_assignment(uuid) from public, anon, authenticated;

create or replace function public.confirm_assignment(p_assignment uuid) returns void
language plpgsql security definer set search_path = public as $$
declare a shift_assignments; s shifts;
begin
  a := public.my_assignment(p_assignment);
  select * into s from shifts where id = a.shift_id;
  if s.status in ('rascunho','cancelado') or a.status <> 'aguardando_confirmacao' then
    raise exception 'Esta atribuição não está aguardando confirmação.' using errcode = '23514';
  end if;
  perform set_action('shift.confirm');
  update shift_assignments set status = 'confirmado', confirmed_at = now() where id = a.id;
  perform public.recompute_shift_status(s.id);
end $$;

create or replace function public.decline_assignment(p_assignment uuid, p_reason text) returns void
language plpgsql security definer set search_path = public as $$
declare a shift_assignments; s shifts;
begin
  a := public.my_assignment(p_assignment);
  select * into s from shifts where id = a.shift_id;
  if a.status <> 'aguardando_confirmacao' then
    raise exception 'Plantões confirmados só podem ser alterados por solicitação ao gestor.' using errcode = '23514';
  end if;
  if nullif(btrim(coalesce(p_reason, '')), '') is null then raise exception 'Informe o motivo.' using errcode = '22023'; end if;
  perform set_action('shift.decline', p_reason);
  update shift_assignments set status = 'recusado', ended_reason = btrim(p_reason) where id = a.id;
  perform public.recompute_shift_status(s.id);
  perform public.notify_perm(s.institution_id, s.unit_id, 'shifts.manage', 'escala', 'Plantão recusado — vaga descoberta',
    to_char(s.starts_at at time zone 'America/Sao_Paulo', 'DD/MM HH24:MI') || ' — ' || btrim(p_reason), '/escalas?plantao=' || s.id);
end $$;

create or replace function public.request_change(p_assignment uuid, p_kind public.request_kind, p_reason text, p_suggested uuid default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare a shift_assignments; s shifts; v_id uuid;
begin
  a := public.my_assignment(p_assignment);
  select * into s from shifts where id = a.shift_id;
  if p_kind = 'candidatura' then raise exception 'Tipo de solicitação inválido.' using errcode = '22023'; end if;
  if not public.active_assignment(a.status) or s.status in ('rascunho','cancelado') then
    raise exception 'Não é possível solicitar alteração para esta atribuição.' using errcode = '23514';
  end if;
  if s.ends_at <= now() then raise exception 'Este plantão já terminou.' using errcode = '23514'; end if;
  if nullif(btrim(coalesce(p_reason, '')), '') is null then raise exception 'Explique o motivo da solicitação.' using errcode = '22023'; end if;
  if p_suggested is not null and not exists (select 1 from professionals where id = p_suggested and institution_id = a.institution_id and active) then
    raise exception 'Substituto sugerido inválido.' using errcode = '22023';
  end if;
  if exists (select 1 from change_requests where assignment_id = a.id and status = 'pendente') then
    raise exception 'Já existe uma solicitação pendente para este plantão.' using errcode = '23505';
  end if;
  perform set_action('request.create', p_reason);
  insert into change_requests(institution_id, shift_id, assignment_id, professional_id, kind, reason, suggested_professional_id, previous_assignment_status)
  values (a.institution_id, a.shift_id, a.id, a.professional_id, p_kind, btrim(p_reason), p_suggested, a.status)
  returning id into v_id;
  if p_kind = 'substituicao' then
    update shift_assignments set status = 'substituicao_solicitada' where id = a.id;
    perform public.recompute_shift_status(s.id);
  end if;
  perform public.notify_perm(s.institution_id, s.unit_id, 'requests.decide', 'solicitacao',
    case p_kind when 'substituicao' then 'Solicitação de substituição' when 'cancelamento' then 'Solicitação de cancelamento' else 'Solicitação de alteração' end,
    to_char(s.starts_at at time zone 'America/Sao_Paulo', 'DD/MM HH24:MI') || ' — ' || btrim(p_reason), '/solicitacoes');
  return v_id;
end $$;

-- Oportunidades: plantões publicados com vagas, visíveis a profissionais ativos da instituição
create or replace function public.apply_to_shift(p_shift uuid, p_message text default null) returns uuid
language plpgsql security definer set search_path = public as $$
declare s shifts; v_prof uuid; v_id uuid; v_cat public.professional_category;
begin
  select * into s from shifts where id = p_shift;
  if not found then raise exception 'Plantão não encontrado.' using errcode = 'P0002'; end if;
  v_prof := public.my_professional_id(s.institution_id);
  if v_prof is null then raise exception 'Seu cadastro profissional não está vinculado a esta instituição.' using errcode = '42501'; end if;
  select category into v_cat from professionals where id = v_prof;
  if s.status not in ('descoberto','publicado') or s.starts_at <= now() then
    raise exception 'Este plantão não está aberto para candidaturas.' using errcode = '23514';
  end if;
  if s.category is not null and s.category <> v_cat then
    raise exception 'Este plantão exige outra categoria profissional.' using errcode = '23514';
  end if;
  perform set_action('request.apply');
  insert into change_requests(institution_id, shift_id, professional_id, kind, reason)
  values (s.institution_id, s.id, v_prof, 'candidatura', nullif(btrim(coalesce(p_message, '')), ''))
  returning id into v_id;
  perform public.notify_perm(s.institution_id, s.unit_id, 'requests.decide', 'solicitacao', 'Nova candidatura a plantão',
    to_char(s.starts_at at time zone 'America/Sao_Paulo', 'DD/MM HH24:MI'), '/solicitacoes');
  return v_id;
exception when unique_violation then
  raise exception 'Você já se candidatou a este plantão.' using errcode = '23505';
end $$;

create or replace function public.cancel_my_request(p_request uuid) returns void
language plpgsql security definer set search_path = public as $$
declare rq change_requests;
begin
  select * into rq from change_requests where id = p_request for update;
  if not found or rq.professional_id is distinct from public.my_professional_id(rq.institution_id) then
    raise exception 'Solicitação não encontrada.' using errcode = 'P0002';
  end if;
  if rq.status <> 'pendente' then raise exception 'A solicitação já foi analisada.' using errcode = '23514'; end if;
  perform set_action('request.withdraw');
  update change_requests set status = 'cancelada', decided_at = now() where id = rq.id;
  if rq.kind = 'substituicao' and rq.assignment_id is not null then
    update shift_assignments set status = coalesce(rq.previous_assignment_status, 'confirmado')
     where id = rq.assignment_id and status = 'substituicao_solicitada';
    perform public.recompute_shift_status(rq.shift_id);
  end if;
end $$;

create or replace function public.decide_request(
  p_request uuid, p_approve boolean, p_note text default null,
  p_substitute uuid default null, p_override_reason text default null
) returns void language plpgsql security definer set search_path = public as $$
declare rq change_requests; s shifts; v_prof_name text;
begin
  select * into rq from change_requests where id = p_request for update;
  if not found then raise exception 'Solicitação não encontrada.' using errcode = 'P0002'; end if;
  select * into s from shifts where id = rq.shift_id;
  perform public.require_perm(rq.institution_id, 'requests.decide', s.unit_id);
  if rq.status <> 'pendente' then raise exception 'A solicitação já foi analisada.' using errcode = '23514'; end if;
  if not p_approve and nullif(btrim(coalesce(p_note, '')), '') is null then
    raise exception 'Informe o motivo da recusa.' using errcode = '22023';
  end if;

  if p_approve then
    if rq.kind = 'candidatura' then
      perform public.do_assign(rq.shift_id, rq.professional_id, p_override_reason, true);
    elsif rq.kind in ('substituicao','cancelamento') then
      if p_substitute is not null then
        -- libera a vaga do solicitante antes de validar o substituto
        perform set_action('request.approve', p_note);
        update shift_assignments set status = 'removido', ended_reason = 'Substituição aprovada' where id = rq.assignment_id;
        perform public.do_assign(rq.shift_id, p_substitute, p_override_reason, false);
      else
        perform set_action('request.approve', p_note);
        update shift_assignments set status = 'removido',
               ended_reason = case rq.kind when 'substituicao' then 'Substituição aprovada' else 'Cancelamento aprovado' end
         where id = rq.assignment_id;
      end if;
      perform public.recompute_shift_status(rq.shift_id);
      if s.status not in ('rascunho','cancelado') and public.recompute_shift_status(rq.shift_id) = 'descoberto' then
        perform public.notify_perm(s.institution_id, s.unit_id, 'shifts.manage', 'escala', 'Plantão descoberto',
          to_char(s.starts_at at time zone 'America/Sao_Paulo', 'DD/MM HH24:MI'), '/escalas?plantao=' || s.id);
      end if;
    end if;
  else
    if rq.kind = 'substituicao' and rq.assignment_id is not null then
      perform set_action('request.reject', p_note);
      update shift_assignments set status = coalesce(rq.previous_assignment_status, 'confirmado')
       where id = rq.assignment_id and status = 'substituicao_solicitada';
      perform public.recompute_shift_status(rq.shift_id);
    end if;
  end if;

  perform set_action(case when p_approve then 'request.approve' else 'request.reject' end, p_note);
  update change_requests set status = case when p_approve then 'aprovada'::request_status else 'recusada'::request_status end,
         decided_by = auth.uid(), decided_at = now(), decision_note = nullif(btrim(coalesce(p_note, '')), '')
   where id = rq.id;
  perform public.notify_professional(rq.professional_id, 'solicitacao',
    case when p_approve then 'Solicitação aprovada' else 'Solicitação recusada' end,
    coalesce(nullif(btrim(coalesce(p_note, '')), ''), to_char(s.starts_at at time zone 'America/Sao_Paulo', 'DD/MM HH24:MI')), '/meu');
end $$;

-- ---------------------------------------------------------------------------
-- Dados de demonstração (sempre marcados is_demo)
-- ---------------------------------------------------------------------------
create or replace function public.seed_demo_data(p_inst uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_unit uuid; v_s1 uuid; v_s2 uuid; tz text := 'America/Sao_Paulo';
  v_monday date := date_trunc('week', (now() at time zone 'America/Sao_Paulo'))::date;
  profs uuid[] := '{}'; v_id uuid; d int; v_shift uuid; i int := 0;
  names text[] := array['Ana Beatriz Lima','Carlos Eduardo Souza','Fernanda Ribeiro','João Pedro Alves','Mariana Costa','Rafael Nogueira'];
  cats public.professional_category[] := array['enfermeiro','tecnico_enfermagem','tecnico_enfermagem','enfermeiro','tecnico_enfermagem','medico']::public.professional_category[];
  councils text[] := array['COREN','COREN','COREN','COREN','COREN','CRM'];
begin
  perform public.require_perm(p_inst, 'institution.manage');
  if exists (select 1 from professionals where institution_id = p_inst and is_demo) then
    raise exception 'Os dados de demonstração já foram criados.' using errcode = '23505';
  end if;
  perform set_action('demo.seed');
  select id into v_unit from units where institution_id = p_inst order by created_at limit 1;
  insert into services(institution_id, unit_id, name) values (p_inst, v_unit, 'Sala de vacinação (demo)') returning id into v_s1;
  insert into services(institution_id, unit_id, name) values (p_inst, v_unit, 'Atendimento de enfermagem (demo)') returning id into v_s2;
  for i in 1..6 loop
    insert into professionals(institution_id, full_name, email, category, council, council_number, council_uf, competencies, validation_status, is_demo)
    values (p_inst, names[i] || ' (demo)', null, cats[i], councils[i], 'DEMO-' || lpad(i::text, 4, '0'), 'SP',
            case when cats[i] in ('enfermeiro','tecnico_enfermagem') then array['Sala de vacinação','Coleta'] else array['Clínica geral'] end,
            'validado', true)
    returning id into v_id;
    profs := profs || v_id;
    insert into availability_slots(institution_id, professional_id, weekday, start_time, end_time)
    select p_inst, v_id, wd, '07:00', '19:00' from generate_series(1, 6) wd;
  end loop;
  for d in 0..11 loop
    continue when extract(dow from v_monday + d) = 0;
    insert into shifts(institution_id, unit_id, service_id, starts_at, ends_at, break_minutes, category, slots,
                       required_competencies, status, published_at, created_by, is_demo, notes)
    values (p_inst, v_unit, v_s1, ((v_monday + d) + time '07:00') at time zone tz, ((v_monday + d) + time '13:00') at time zone tz,
            15, 'tecnico_enfermagem', 1, array['Sala de vacinação'], 'publicado', now(), auth.uid(), true, 'Dado de demonstração')
    returning id into v_shift;
    if d % 4 <> 3 then
      insert into shift_assignments(institution_id, shift_id, professional_id, status, assigned_by, confirmed_at)
      values (p_inst, v_shift, profs[2 + (d % 2) * 3], case when d % 3 = 0 then 'aguardando_confirmacao' else 'confirmado' end::assignment_status,
              auth.uid(), now());
    end if;
    perform public.recompute_shift_status(v_shift);
    insert into shifts(institution_id, unit_id, service_id, starts_at, ends_at, break_minutes, category, slots,
                       status, published_at, created_by, is_demo, notes)
    values (p_inst, v_unit, v_s2, ((v_monday + d) + time '13:00') at time zone tz, ((v_monday + d) + time '19:00') at time zone tz,
            15, 'enfermeiro', 1, case when d >= 7 then 'rascunho' else 'publicado' end::shift_status,
            case when d < 7 then now() end, auth.uid(), true, 'Dado de demonstração')
    returning id into v_shift;
    insert into shift_assignments(institution_id, shift_id, professional_id, status, assigned_by, confirmed_at)
    values (p_inst, v_shift, profs[1 + (d % 2) * 3], 'confirmado', auth.uid(), now());
    perform public.recompute_shift_status(v_shift);
  end loop;
end $$;

create or replace function public.clear_demo_data(p_inst uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform public.require_perm(p_inst, 'institution.manage');
  perform set_action('demo.clear');
  delete from shifts where institution_id = p_inst and is_demo;
  delete from professionals where institution_id = p_inst and is_demo;
  delete from services where institution_id = p_inst and name like '%(demo)';
end $$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.shifts enable row level security;
alter table public.shift_assignments enable row level security;
alter table public.change_requests enable row level security;

-- Gestão vê pela permissão (com escopo de unidade). Profissional vê os próprios
-- plantões publicados e as oportunidades abertas compatíveis com sua categoria.
-- Funções auxiliares (security definer) evitam recursão entre as políticas.
create or replace function public.shift_assigned_to_me(p_shift uuid, p_inst uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from shift_assignments a
    where a.shift_id = p_shift and a.professional_id = public.my_professional_id(p_inst))
$$;
create or replace function public.my_category(p_inst uuid) returns public.professional_category
language sql stable security definer set search_path = public as $$
  select category from professionals where id = public.my_professional_id(p_inst)
$$;
create or replace function public.shift_manager_view(p_shift uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from shifts s where s.id = p_shift and public.has_unit_perm(s.institution_id, s.unit_id, 'shifts.view'))
$$;
create or replace function public.shift_is_published(p_shift uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from shifts s where s.id = p_shift and s.status <> 'rascunho')
$$;

create policy shifts_read_manage on public.shifts for select
  using (public.has_unit_perm(institution_id, unit_id, 'shifts.view'));
create policy shifts_read_own on public.shifts for select
  using (status <> 'rascunho' and public.shift_assigned_to_me(id, institution_id));
create policy shifts_read_open on public.shifts for select
  using (status in ('descoberto','publicado') and starts_at > now()
         and public.my_category(institution_id) is not null
         and (category is null or category = public.my_category(institution_id)));

create policy assignments_read_manage on public.shift_assignments for select
  using (public.shift_manager_view(shift_id));
create policy assignments_read_own on public.shift_assignments for select
  using (professional_id = public.my_professional_id(institution_id) and public.shift_is_published(shift_id));

create policy requests_read on public.change_requests for select
  using (public.has_perm(institution_id, 'requests.decide') or professional_id = public.my_professional_id(institution_id));

revoke insert, update, delete on public.shifts, public.shift_assignments, public.change_requests from authenticated;
grant select on public.shifts, public.shift_assignments, public.change_requests to authenticated;
revoke all on public.shifts, public.shift_assignments, public.change_requests from anon;

revoke execute on all functions in schema public from public, anon;
grant execute on all functions in schema public to authenticated;
revoke execute on function public.do_assign(uuid, uuid, text, boolean) from authenticated;
revoke execute on function public.my_assignment(uuid) from authenticated;
revoke execute on function public.claim_invitations(uuid) from authenticated;
revoke execute on function public.notify_user(uuid, uuid, text, text, text, text) from authenticated;
revoke execute on function public.notify_perm(uuid, uuid, text, text, text, text, text) from authenticated;
revoke execute on function public.notify_professional(uuid, text, text, text, text) from authenticated;
revoke execute on function public.recompute_shift_status(uuid) from authenticated;
revoke execute on function public.enforce_checks(jsonb, text) from authenticated;
