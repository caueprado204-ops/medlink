-- MedLink — 0003: armazenamento privado de documentos profissionais (Supabase Storage)
-- Caminho obrigatório: {institution_id}/{professional_id}/{arquivo}
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('documentos-profissionais', 'documentos-profissionais', false, 10485760,
        array['application/pdf','image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.storage_doc_access(p_name text, p_write boolean) returns boolean
language plpgsql stable security definer set search_path = public as $$
declare v_inst uuid; v_prof uuid; parts text[] := string_to_array(p_name, '/');
begin
  if cardinality(parts) < 3 then return false; end if;
  begin v_inst := parts[1]::uuid; v_prof := parts[2]::uuid; exception when others then return false; end;
  if not exists (select 1 from professionals where id = v_prof and institution_id = v_inst) then return false; end if;
  if v_prof = public.my_professional_id(v_inst) then return true; end if;
  if p_write then return public.has_perm(v_inst, 'professionals.manage'); end if;
  return public.has_perm(v_inst, 'professionals.view');
end $$;
revoke execute on function public.storage_doc_access(text, boolean) from public, anon;
grant execute on function public.storage_doc_access(text, boolean) to authenticated;

create policy "docs_select" on storage.objects for select to authenticated
  using (bucket_id = 'documentos-profissionais' and public.storage_doc_access(name, false));
create policy "docs_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'documentos-profissionais' and public.storage_doc_access(name, true));
create policy "docs_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'documentos-profissionais' and public.storage_doc_access(name, true));
