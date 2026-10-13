-- MedLink — 0004: ajustes apontados pelo assistente de segurança do Supabase
alter function public.shift_hours(timestamptz, timestamptz, int) set search_path = public;
alter function public.set_action(text, text) set search_path = public;
alter function public.guard_institution_change() set search_path = public;
alter function public.set_updated_at() set search_path = public;
alter function public.valid_cnpj(text) set search_path = public;
alter function public.all_permissions() set search_path = public;
alter function public.default_permissions(public.app_role) set search_path = public;
alter function public.guard_role_permissions() set search_path = public;
alter function public.category_label(public.professional_category) set search_path = public;
alter function public.issue(text, text) set search_path = public;
alter function public.active_assignment(public.assignment_status) set search_path = public;
alter function public.enforce_checks(jsonb, text) set search_path = public;

-- funções de gatilho não devem ser chamadas pela API
revoke execute on function public.guard_document() from authenticated;
revoke execute on function public.guard_professional() from authenticated;
revoke execute on function public.handle_new_user() from authenticated;
revoke execute on function public.handle_user_confirmed() from authenticated;
revoke execute on function public.guard_institution_change() from authenticated;
revoke execute on function public.guard_role_permissions() from authenticated;
revoke execute on function public.set_updated_at() from authenticated;
alter default privileges in schema public revoke all on tables from anon;
alter default privileges in schema public revoke execute on functions from anon, public;
