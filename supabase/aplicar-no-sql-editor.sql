-- Partes que o Supabase só aplica com aprovação manual (contêm DELETE).
-- Cole este arquivo inteiro no SQL Editor do projeto e clique em Run.
-- Habilita: salvar permissões por perfil, remover dados de demonstração,
-- cancelar convites e excluir documentos enviados.

create or replace function public.set_role_permissions(p_inst uuid, p_role public.app_role, p_perms text[]) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform public.require_perm(p_inst, 'settings.manage');
  perform set_action('settings.permissions');
  delete from role_permissions where institution_id = p_inst and role = p_role and not (permission = any(p_perms));
  insert into role_permissions(institution_id, role, permission)
  select p_inst, p_role, unnest(p_perms) on conflict do nothing;
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

revoke execute on function public.set_role_permissions(uuid, public.app_role, text[]) from anon, public;
revoke execute on function public.clear_demo_data(uuid) from anon, public;
grant execute on function public.set_role_permissions(uuid, public.app_role, text[]) to authenticated;
grant execute on function public.clear_demo_data(uuid) to authenticated;

create policy invitations_delete on public.invitations for delete using (public.has_perm(institution_id, 'members.manage'));
create policy "docs_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'documentos-profissionais' and public.storage_doc_access(name, true));
