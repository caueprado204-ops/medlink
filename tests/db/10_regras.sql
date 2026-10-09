-- Testes de regras de negócio e isolamento (executar com tests/db/run.sh)
\set ON_ERROR_STOP on
\set QUIET on

create schema tests;
grant usage on schema tests to authenticated;

-- Executa SQL e exige erro com SQLSTATE/mensagem esperados
create function tests.expect_error(p_sql text, p_state text, p_label text) returns void language plpgsql as $$
begin
  begin
    execute p_sql;
  exception when others then
    if p_state is not null and sqlstate <> p_state then
      raise exception 'FALHOU [%]: esperado SQLSTATE %, veio % (%)', p_label, p_state, sqlstate, sqlerrm;
    end if;
    raise notice 'ok  %', p_label;
    return;
  end;
  raise exception 'FALHOU [%]: deveria ter gerado erro', p_label;
end $$;

create function tests.ok(p_cond boolean, p_label text) returns void language plpgsql as $$
begin
  if p_cond is not true then raise exception 'FALHOU [%]', p_label; end if;
  raise notice 'ok  %', p_label;
end $$;
grant execute on all functions in schema tests to authenticated;

-- Usuários
insert into auth.users(id, email, email_confirmed_at) values
  ('a0000000-0000-0000-0000-00000000000a', 'alice@clinica-a.com', now()),
  ('b0000000-0000-0000-0000-00000000000b', 'bruno@clinica-b.com', now()),
  ('c0000000-0000-0000-0000-00000000000c', 'carla@email.com', now()),
  ('d0000000-0000-0000-0000-00000000000d', 'diego@clinica-a.com', now()),
  ('e0000000-0000-0000-0000-00000000000e', 'eva@email.com', null);

select tests.ok((select count(*) from public.profiles) = 5, 'perfil criado automaticamente para cada conta');

set role authenticated;

-- ---------------------------------------------------------------------------
-- Instituições
-- ---------------------------------------------------------------------------
set request.jwt.claim.sub = 'a0000000-0000-0000-0000-00000000000a';
select tests.expect_error($$select public.create_institution('Clínica X', 'clinica_vacinacao', '11.222.333/0001-80')$$, '22023', 'CNPJ com dígito errado é rejeitado');
select public.create_institution('Clínica Vacina A', 'clinica_vacinacao', '11.222.333/0001-81', null, array['escalas','vacinas'], 'Matriz', 'Campinas', 'SP') as inst_a \gset
select tests.ok((select count(*) from public.role_permissions where institution_id = :'inst_a') > 0, 'permissões padrão semeadas');
select tests.ok(public.has_perm(:'inst_a', 'shifts.manage'), 'criador é administrador');
insert into public.units(institution_id, name) values (:'inst_a', 'Filial Norte') returning id as unit_a2 \gset
select id as unit_a1 from public.units where institution_id = :'inst_a' and name = 'Matriz' \gset

set request.jwt.claim.sub = 'b0000000-0000-0000-0000-00000000000b';
select public.create_institution('Home Care B', 'home_care') as inst_b \gset
select tests.expect_error(format($$select public.create_institution('Outra', 'outra', %L)$$, '11222333000181'), '23505', 'CNPJ duplicado é rejeitado');

-- ---------------------------------------------------------------------------
-- Isolamento entre instituições (Bruno tentando acessar A)
-- ---------------------------------------------------------------------------
select tests.ok((select count(*) from public.institutions where id = :'inst_a') = 0, 'B não lê a instituição A');
select tests.ok((select count(*) from public.units where institution_id = :'inst_a') = 0, 'B não lê unidades de A');
select tests.expect_error(format($$insert into public.professionals(institution_id, full_name, category) values (%L, 'Intruso Teste', 'medico')$$, :'inst_a'), '42501', 'B não cadastra profissional em A');
select tests.expect_error(format($$select public.save_shift(jsonb_build_object('institution_id', %L, 'unit_id', %L, 'starts_at', now() + interval '1 day', 'ends_at', now() + interval '1 day 6 hours'))$$, :'inst_a', :'unit_a1'), '42501', 'B não cria plantão em A');
select tests.expect_error(format($$select public.save_shift(jsonb_build_object('institution_id', %L, 'unit_id', %L, 'starts_at', now() + interval '1 day', 'ends_at', now() + interval '1 day 6 hours'))$$, :'inst_b', :'unit_a1'), '22023', 'B não usa unidade de A no próprio plantão');
update public.institutions set name = 'Hackeada' where id = :'inst_a';
select tests.expect_error(format($$select public.invite_member(%L, 'x@y.com', 'viewer')$$, :'inst_a'), '42501', 'B não convida membros para A');
select tests.expect_error($$insert into public.audit_log(action, entity) values ('x','y')$$, '42501', 'ninguém insere auditoria manualmente');
select tests.expect_error($$insert into public.memberships(institution_id, user_id, role) select id, auth.uid(), 'institution_admin' from public.institutions limit 1$$, '42501', 'ninguém concede papel a si mesmo');

set request.jwt.claim.sub = 'a0000000-0000-0000-0000-00000000000a';
select tests.ok((select name from public.institutions where id = :'inst_a') = 'Clínica Vacina A', 'atualização cruzada não teve efeito');

-- ---------------------------------------------------------------------------
-- Profissionais e convite
-- ---------------------------------------------------------------------------
insert into public.professionals(institution_id, full_name, email, category, council, council_number, council_uf, competencies)
values (:'inst_a', 'Carla Mendes', 'carla@email.com', 'tecnico_enfermagem', 'COREN', '123456', 'SP', array['Sala de vacinação'])
returning id as prof_carla \gset
insert into public.professionals(institution_id, full_name, category, competencies, validation_status)
values (:'inst_a', 'Paulo Enfermeiro', 'enfermeiro', '{}', 'validado') returning id as prof_paulo \gset
insert into public.professionals(institution_id, full_name, category, validation_status)
values (:'inst_a', 'Tânia Técnica', 'tecnico_enfermagem', 'validado') returning id as prof_tania \gset
select tests.ok((select validation_status from public.professionals where id = :'prof_paulo') = 'validado', 'admin com documents.verify pode validar');
select tests.expect_error(format($$update public.professionals set user_id = auth.uid() where id = %L$$, :'prof_carla'), '42501', 'vínculo de conta só por convite');
select tests.ok(public.invite_professional(:'prof_carla') = 'vinculado', 'convite vincula conta existente confirmada');

-- ---------------------------------------------------------------------------
-- Plantões e regras
-- ---------------------------------------------------------------------------
select ((current_date + 2) + time '07:00') at time zone 'America/Sao_Paulo' as t0 \gset
select public.save_shift(jsonb_build_object('institution_id', :'inst_a', 'unit_id', :'unit_a1',
  'starts_at', :'t0'::timestamptz, 'ends_at', :'t0'::timestamptz + interval '6 hours', 'category', 'tecnico_enfermagem',
  'required_competencies', jsonb_build_array('Sala de vacinação'))) as s1 \gset
select tests.ok((select status from public.shifts where id = :'s1') = 'rascunho', 'plantão nasce como rascunho');
select tests.expect_error(format($$select public.save_shift(jsonb_build_object('institution_id', %L, 'unit_id', %L, 'starts_at', %L::timestamptz, 'ends_at', %L::timestamptz))$$, :'inst_a', :'unit_a1', :'t0', :'t0'), '22023', 'término antes do início é rejeitado');
select tests.expect_error(format($$select public.save_shift(jsonb_build_object('institution_id', %L, 'unit_id', %L, 'starts_at', %L::timestamptz, 'ends_at', %L::timestamptz + interval '30 hours'))$$, :'inst_a', :'unit_a1', :'t0', :'t0'), '23514', 'duração acima do máximo é rejeitada');
select tests.expect_error(format($$insert into public.shifts(institution_id, unit_id, starts_at, ends_at) values (%L, %L, now(), now() + interval '1 hour')$$, :'inst_a', :'unit_a1'), '42501', 'plantão não é gravado por fora das regras');

-- Carla: cadastro pendente => alerta exige justificativa
select tests.expect_error(format($$select public.assign_professional(%L, %L)$$, :'s1', :'prof_carla'), 'ML001', 'alerta sem justificativa é barrado');
select public.assign_professional(:'s1', :'prof_carla', 'Documentação em análise; RT autorizou') as a1 \gset
select tests.ok((select exception_reason from public.shift_assignments where id = :'a1') is not null, 'exceção autorizada fica registrada');
select tests.expect_error(format($$select public.assign_professional(%L, %L, 'x')$$, :'s1', :'prof_tania'), 'ML002', 'vaga cheia bloqueia');

-- Sobreposição: bloqueio obrigatório, nem com justificativa
select public.save_shift(jsonb_build_object('institution_id', :'inst_a', 'unit_id', :'unit_a2',
  'starts_at', :'t0'::timestamptz + interval '2 hours', 'ends_at', :'t0'::timestamptz + interval '5 hours')) as s2 \gset
select tests.expect_error(format($$select public.assign_professional(%L, %L, 'preciso muito')$$, :'s2', :'prof_carla'), 'ML002', 'sobreposição é bloqueio obrigatório');
-- Categoria
select public.save_shift(jsonb_build_object('institution_id', :'inst_a', 'unit_id', :'unit_a1', 'category', 'enfermeiro',
  'starts_at', :'t0'::timestamptz + interval '1 day', 'ends_at', :'t0'::timestamptz + interval '1 day 6 hours')) as s3 \gset
select tests.expect_error(format($$select public.assign_professional(%L, %L, 'x')$$, :'s3', :'prof_carla'), 'ML002', 'categoria incompatível bloqueia');
select public.assign_professional(:'s3', :'prof_paulo') as a3 \gset
select tests.ok(:'a3' is not null, 'atribuição sem alertas não pede justificativa');
-- Descanso
select public.save_shift(jsonb_build_object('institution_id', :'inst_a', 'unit_id', :'unit_a1',
  'starts_at', :'t0'::timestamptz + interval '9 hours', 'ends_at', :'t0'::timestamptz + interval '12 hours')) as s4 \gset
select tests.ok(exists (select 1 from jsonb_array_elements(public.assignment_checks(:'s4', :'prof_carla') -> 'warnings') w where w ->> 'code' = 'descanso'), 'descanso mínimo gera alerta');
-- Férias
insert into public.absences(institution_id, professional_id, kind, starts_on, ends_on) values (:'inst_a', :'prof_tania', 'ferias', current_date + 2, current_date + 10);
select tests.ok(exists (select 1 from jsonb_array_elements(public.assignment_checks(:'s2', :'prof_tania') -> 'blocking') w where w ->> 'code' = 'ausencia'), 'férias bloqueiam a atribuição');

-- Mover para horário que sobrepõe outro plantão confirmado de Carla é bloqueado
select public.save_shift(jsonb_build_object('institution_id', :'inst_a', 'unit_id', :'unit_a1', 'category', 'tecnico_enfermagem',
  'starts_at', :'t0'::timestamptz + interval '3 days', 'ends_at', :'t0'::timestamptz + interval '3 days 6 hours')) as s5 \gset
select public.assign_professional(:'s5', :'prof_carla', 'ok') as a5 \gset
select tests.expect_error(format($$select public.move_shift(%L, %L::timestamptz + interval '1 hour', 'x')$$, :'s5', :'t0'), 'ML002', 'mover para sobreposição é bloqueado');

-- Publicação
select tests.ok(public.publish_shifts(array[:'s1', :'s3', :'s5']::uuid[]) = 3, 'publicação de escalas');
select tests.ok((select status from public.shifts where id = :'s1') = 'aguardando_confirmacao', 'situação derivada após publicar');

-- ---------------------------------------------------------------------------
-- Área do profissional
-- ---------------------------------------------------------------------------
set request.jwt.claim.sub = 'c0000000-0000-0000-0000-00000000000c';
select tests.ok((select count(*) from public.professionals) = 1, 'profissional vê apenas o próprio cadastro');
select tests.ok((select count(*) from public.shifts where id = :'s2') = 0, 'profissional não vê rascunhos');
select tests.ok((select count(*) from public.shifts where id = :'s1') = 1, 'profissional vê o próprio plantão publicado');
select tests.ok((select count(*) from public.shifts where id = :'s3') = 0, 'profissional não vê vaga de outra categoria');
select tests.ok((select count(*) from public.notifications) >= 1, 'profissional notificado');
select tests.expect_error(format($$update public.shift_assignments set status = 'confirmado' where id = %L$$, :'a1'), '42501', 'profissional não altera atribuição diretamente');
select tests.ok((select count(*) from public.audit_log) = 0, 'profissional não lê auditoria');
select public.confirm_assignment(:'a1');
select tests.expect_error(format($$select public.decline_assignment(%L, 'mudei de ideia')$$, :'a1'), '23514', 'confirmado não pode ser recusado unilateralmente');
select tests.expect_error(format($$select public.confirm_assignment(%L)$$, :'a3'), 'P0002', 'não confirma plantão de outra pessoa');
insert into public.availability_slots(institution_id, professional_id, weekday, start_time, end_time) values (:'inst_a', :'prof_carla', 1, '07:00', '13:00');
select tests.expect_error(format($$insert into public.availability_slots(institution_id, professional_id, weekday, start_time, end_time) values (%L, %L, 1, '07:00', '13:00')$$, :'inst_a', :'prof_tania'), '42501', 'profissional não altera disponibilidade alheia');
select public.request_change(:'a1', 'substituicao', 'Consulta médica') as rq1 \gset

set request.jwt.claim.sub = 'a0000000-0000-0000-0000-00000000000a';
select tests.ok((select status from public.shifts where id = :'s1') = 'substituicao_solicitada', 'situação reflete pedido de substituição');
select tests.expect_error(format($$select public.decide_request(%L, false)$$, :'rq1'), '22023', 'recusa exige motivo');
select public.decide_request(:'rq1', true, 'Aprovado');
select tests.ok((select status from public.shifts where id = :'s1') = 'descoberto', 'aprovação sem substituto deixa plantão descoberto');
select tests.ok(exists (select 1 from public.audit_log where entity = 'shift_assignments' and action = 'shift.assign' and reason is not null), 'auditoria registra justificativa');
select tests.ok(exists (select 1 from public.audit_log where entity = 'change_requests' and action = 'request.approve'), 'auditoria registra decisão');

-- candidatura
set request.jwt.claim.sub = 'c0000000-0000-0000-0000-00000000000c';
select tests.ok((select count(*) from public.shifts where id = :'s1') = 1, 'vaga descoberta aparece como oportunidade');
select public.apply_to_shift(:'s1', 'Consegui remarcar') as rq2 \gset
select tests.expect_error(format($$select public.apply_to_shift(%L)$$, :'s1'), '23505', 'candidatura duplicada é barrada');
set request.jwt.claim.sub = 'a0000000-0000-0000-0000-00000000000a';
select public.decide_request(:'rq2', true, null, null, 'Exceção mantida');
select tests.ok((select status from public.shifts where id = :'s1') = 'confirmado', 'candidatura aprovada confirma o plantão');

-- Cancelamento exige motivo e notifica
select tests.expect_error(format($$select public.cancel_shift(%L, '')$$, :'s5'), '22023', 'cancelar exige motivo');
select public.cancel_shift(:'s5', 'Ação de vacinação adiada');
select tests.ok((select status from public.shift_assignments where id = :'a5') = 'removido', 'cancelamento libera o profissional');

-- ---------------------------------------------------------------------------
-- Membros, escopo por unidade e permissões
-- ---------------------------------------------------------------------------
select tests.ok(public.invite_member(:'inst_a', 'diego@clinica-a.com', 'operations_manager', array[:'unit_a2']::uuid[]) = 'adicionado', 'gestor adicionado');
select tests.ok(public.invite_member(:'inst_a', 'eva@email.com', 'viewer') = 'convidado', 'conta não confirmada recebe convite');
select tests.expect_error(format($$select public.set_member_active(id, false) from public.memberships where institution_id = %L and role = 'institution_admin'$$, :'inst_a'), '23514', 'último administrador não pode ser desativado');
select tests.expect_error(format($$select public.set_role_permissions(%L, 'institution_admin', array['shifts.view'])$$, :'inst_a'), '42501', 'permissões do admin são protegidas');
select public.set_role_permissions(:'inst_a', 'viewer', array['shifts.view']);

set request.jwt.claim.sub = 'd0000000-0000-0000-0000-00000000000d';
select tests.expect_error(format($$select public.save_shift(jsonb_build_object('institution_id', %L, 'unit_id', %L, 'starts_at', now() + interval '3 day', 'ends_at', now() + interval '3 day 6 hours'))$$, :'inst_a', :'unit_a1'), '42501', 'gestor restrito não atua em outra unidade');
select tests.ok(public.save_shift(jsonb_build_object('institution_id', :'inst_a', 'unit_id', :'unit_a2', 'starts_at', now() + interval '3 day', 'ends_at', now() + interval '3 day 6 hours')) is not null, 'gestor atua na própria unidade');
select tests.ok((select count(*) from public.shifts where unit_id = :'unit_a1') = 0, 'gestor restrito não lê plantões de outra unidade');

reset role;
update auth.users set email_confirmed_at = now() where id = 'e0000000-0000-0000-0000-00000000000e';
select tests.ok(exists (select 1 from public.memberships where user_id = 'e0000000-0000-0000-0000-00000000000e'), 'convite aceito ao confirmar e-mail');
set role authenticated;

-- ---------------------------------------------------------------------------
-- Duplicação e demonstração
-- ---------------------------------------------------------------------------
set request.jwt.claim.sub = 'a0000000-0000-0000-0000-00000000000a';
select tests.ok(public.duplicate_shift(:'s3', array[current_date + 10, current_date + 11]) = 2, 'duplicação cria cópias');
select tests.ok((select count(*) from public.shifts where series_id = (select series_id from public.shifts where id = :'s3')) = 3, 'cópias ficam na mesma série');
select public.seed_demo_data(:'inst_a');
select tests.ok((select count(*) from public.professionals where is_demo) = 6, 'dados de demonstração marcados');
select public.clear_demo_data(:'inst_a');
select tests.ok((select count(*) from public.professionals where is_demo) = 0, 'dados de demonstração removíveis');

reset role;
select tests.ok((select count(*) from public.audit_log where institution_id = :'inst_a') > 20, 'histórico de auditoria preenchido');
\echo 'TODOS OS TESTES PASSARAM'
