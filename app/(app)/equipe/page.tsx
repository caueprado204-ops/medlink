import { requirePerm } from "@/lib/session";
import { getServerClient } from "@/lib/supabase/server";
import { loadUnits } from "@/lib/queries";
import { PageHeader } from "@/components/ui/primitives";
import type { Permission, Role } from "@/lib/labels";
import { TeamManager, PermissionMatrix, type Member, type Invite } from "./manager";

export const metadata = { title: "Equipe e acessos" };

export default async function Equipe() {
  const ctx = await requirePerm("members.manage");
  const supabase = getServerClient();
  const inst = ctx.current.id;
  const [{ data: ms }, { data: inv }, { data: rp }, { units }] = await Promise.all([
    supabase.from("memberships").select("id,user_id,role,unit_ids,active,created_at").eq("institution_id", inst).order("created_at"),
    supabase.from("invitations").select("id,email,role,unit_ids,created_at,accepted_at,professional_id").eq("institution_id", inst).is("accepted_at", null).order("created_at", { ascending: false }),
    supabase.from("role_permissions").select("role,permission").eq("institution_id", inst),
    loadUnits(inst),
  ]);
  const ids = Array.from(new Set((ms ?? []).map((m) => m.user_id as string)));
  const { data: people } = ids.length ? await supabase.from("profiles").select("id,full_name,email").in("id", ids) : { data: [] };
  const byId = new Map((people ?? []).map((p) => [p.id, p]));
  const members: Member[] = (ms ?? []).map((m) => ({
    id: m.id, role: m.role as Role, unit_ids: m.unit_ids, active: m.active, self: m.user_id === ctx.userId,
    name: byId.get(m.user_id)?.full_name ?? null, email: byId.get(m.user_id)?.email ?? "",
  }));
  const matrix: Record<string, Permission[]> = {};
  (rp ?? []).forEach((r) => { (matrix[r.role] ??= []).push(r.permission as Permission); });

  return (
    <div className="space-y-8">
      <PageHeader title="Equipe e acessos" description="Quem acessa a MedLink nesta instituição e o que cada perfil pode fazer. Profissionais de saúde recebem acesso pelo convite no cadastro profissional." />
      <TeamManager institutionId={inst} members={members} invites={(inv ?? []) as Invite[]} units={units.filter((u) => u.active)} canGrantAdmin={ctx.perms.has("institution.manage")} />
      <PermissionMatrix institutionId={inst} matrix={matrix} editable={ctx.perms.has("settings.manage")} />
    </div>
  );
}
