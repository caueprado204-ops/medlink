import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getServerClient } from "./supabase/server";
import type { InstitutionType, Permission, Role, Category } from "./labels";
import { DEFAULT_TZ } from "./time";

export const INST_COOKIE = "ml_inst";

export type InstitutionSummary = {
  id: string;
  name: string;
  type: InstitutionType;
  modules: string[];
  is_demo: boolean;
  settings: { timezone?: string; min_rest_hours?: number; max_weekly_hours?: number; max_shift_hours?: number };
  roles: Role[];
};

export type Ctx = {
  userId: string;
  email: string;
  name: string;
  institutions: InstitutionSummary[];
  current: InstitutionSummary | null;
  perms: Set<Permission>;
  professional: { id: string; full_name: string; category: Category } | null;
  tz: string;
};

type MembershipRow = {
  role: Role;
  institution: Omit<InstitutionSummary, "roles"> | null;
};

/** Contexto da requisição. A interface usa as permissões só para exibir/ocultar;
 *  o banco valida tudo novamente em cada leitura e escrita. */
export const getContext = cache(async (): Promise<Ctx | null> => {
  const supabase = getServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: profile }, { data: rows }] = await Promise.all([
    supabase.from("profiles").select("full_name,email").eq("id", user.id).maybeSingle(),
    supabase
      .from("memberships")
      .select("role, institution:institutions(id,name,type,modules,is_demo,settings)")
      .eq("user_id", user.id)
      .eq("active", true),
  ]);

  const byId = new Map<string, InstitutionSummary>();
  for (const r of (rows ?? []) as unknown as MembershipRow[]) {
    if (!r.institution) continue;
    const existing = byId.get(r.institution.id);
    if (existing) existing.roles.push(r.role);
    else byId.set(r.institution.id, { ...r.institution, roles: [r.role] });
  }
  const institutions = [...byId.values()].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  const chosen = cookies().get(INST_COOKIE)?.value;
  const current = institutions.find((i) => i.id === chosen) ?? institutions[0] ?? null;

  let perms = new Set<Permission>();
  let professional: Ctx["professional"] = null;
  if (current) {
    const [{ data: rp }, { data: prof }] = await Promise.all([
      supabase.from("role_permissions").select("permission").eq("institution_id", current.id).in("role", current.roles),
      supabase
        .from("professionals")
        .select("id, full_name, category")
        .eq("institution_id", current.id)
        .eq("user_id", user.id)
        .eq("active", true)
        .maybeSingle(),
    ]);
    perms = new Set((rp ?? []).map((r) => r.permission as Permission));
    professional = (prof as Ctx["professional"]) ?? null;
  }

  return {
    userId: user.id,
    email: user.email ?? profile?.email ?? "",
    name: profile?.full_name || user.email?.split("@")[0] || "Usuário",
    institutions,
    current,
    perms,
    professional,
    tz: current?.settings?.timezone || DEFAULT_TZ,
  };
});

/** Exige sessão e instituição; redireciona quando faltam. */
export async function requireContext(): Promise<Ctx & { current: InstitutionSummary }> {
  const ctx = await getContext();
  if (!ctx) redirect("/login");
  if (!ctx.current) redirect("/bem-vindo");
  return ctx as Ctx & { current: InstitutionSummary };
}

/** Exige uma permissão para abrir a página. */
export async function requirePerm(perm: Permission) {
  const ctx = await requireContext();
  if (!ctx.perms.has(perm)) redirect(ctx.professional ? "/meu" : "/painel");
  return ctx;
}

export function homeFor(ctx: Ctx) {
  if (!ctx.current) return "/bem-vindo";
  const isManager = ctx.perms.has("shifts.view") || ctx.perms.has("professionals.view");
  return isManager ? "/painel" : "/meu";
}
