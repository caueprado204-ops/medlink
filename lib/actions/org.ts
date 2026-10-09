"use server";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase/server";
import { fromPgError, invalid, ok, type ActionResult } from "@/lib/errors";
import { rpc, revalidateAll, str } from "./_rpc";

const unitSchema = z.object({
  name: z.string().min(2, "Informe o nome da unidade.").max(120),
  address: z.string().max(240).nullable(),
  city: z.string().max(120).nullable(),
  uf: z.string().regex(/^[A-Za-z]{2}$/, "UF com 2 letras.").nullable(),
  phone: z.string().max(40).nullable(),
});

export async function saveUnit(institutionId: string, unitId: string | null, form: FormData): Promise<ActionResult> {
  const parsed = unitSchema.safeParse({
    name: str(form.get("name")) ?? "", address: str(form.get("address")), city: str(form.get("city")),
    uf: str(form.get("uf")), phone: str(form.get("phone")),
  });
  if (!parsed.success) return invalid(parsed.error.issues[0].message);
  const row = { ...parsed.data, uf: parsed.data.uf?.toUpperCase() ?? null };
  const supabase = getServerClient();
  const q = unitId
    ? supabase.from("units").update(row).eq("id", unitId).eq("institution_id", institutionId).select("id")
    : supabase.from("units").insert({ ...row, institution_id: institutionId }).select("id");
  const { data, error } = await q;
  if (error) return fromPgError(error.code === "23505" ? { ...error, message: "Já existe uma unidade com este nome." } : error);
  if (!data?.length) return { ok: false, kind: "permission", message: "Você não tem permissão para gerenciar unidades." };
  revalidateAll();
  return ok(null, unitId ? "Unidade atualizada." : "Unidade criada.");
}

export async function setUnitActive(unitId: string, active: boolean): Promise<ActionResult> {
  const { data, error } = await getServerClient().from("units").update({ active }).eq("id", unitId).select("id");
  if (error) return fromPgError(error);
  if (!data?.length) return { ok: false, kind: "permission", message: "Você não tem permissão para gerenciar unidades." };
  revalidateAll();
  return ok(null, active ? "Unidade reativada." : "Unidade desativada.");
}

export async function saveService(institutionId: string, unitId: string, name: string): Promise<ActionResult> {
  const n = name.trim();
  if (n.length < 2) return invalid("Informe o nome do serviço ou setor.");
  const { data, error } = await getServerClient()
    .from("services").insert({ institution_id: institutionId, unit_id: unitId, name: n }).select("id");
  if (error) return fromPgError(error.code === "23505" ? { ...error, message: "Este serviço já existe na unidade." } : error);
  if (!data?.length) return { ok: false, kind: "permission", message: "Você não tem permissão para gerenciar serviços." };
  revalidateAll();
  return ok(null, "Serviço criado.");
}

export async function setServiceActive(serviceId: string, active: boolean): Promise<ActionResult> {
  const { data, error } = await getServerClient().from("services").update({ active }).eq("id", serviceId).select("id");
  if (error) return fromPgError(error);
  if (!data?.length) return { ok: false, kind: "permission", message: "Você não tem permissão para gerenciar serviços." };
  revalidateAll();
  return ok(null, active ? "Serviço reativado." : "Serviço desativado.");
}

const roles = ["institution_admin", "operations_manager", "technical_lead", "viewer"] as const;

export async function inviteMember(institutionId: string, form: FormData): Promise<ActionResult<string>> {
  const parsed = z.object({
    email: z.string().email("Informe um e-mail válido."),
    role: z.enum(roles, { errorMap: () => ({ message: "Selecione o perfil de acesso." }) }),
    units: z.array(z.string().uuid()),
  }).safeParse({ email: str(form.get("email")) ?? "", role: form.get("role"), units: form.getAll("units").map(String) });
  if (!parsed.success) return invalid(parsed.error.issues[0].message);
  const res = await rpc<string>("invite_member", {
    p_inst: institutionId, p_email: parsed.data.email, p_role: parsed.data.role,
    p_unit_ids: parsed.data.units.length ? parsed.data.units : null,
  });
  if (!res.ok) return res;
  return ok(res.data, res.data === "adicionado"
    ? "Acesso concedido. A pessoa já pode entrar."
    : "Convite registrado. O acesso é liberado quando a pessoa criar a conta com este e-mail e confirmá-lo.");
}

export async function setMemberActive(membershipId: string, active: boolean) {
  return rpc("set_member_active", { p_membership: membershipId, p_active: active }, { message: active ? "Acesso reativado." : "Acesso desativado." });
}

export async function revokeInvitation(invitationId: string): Promise<ActionResult> {
  const { data, error } = await getServerClient().from("invitations").delete().eq("id", invitationId).select("id");
  if (error) return fromPgError(error);
  if (!data?.length) return { ok: false, kind: "permission", message: "Você não tem permissão para cancelar convites." };
  revalidateAll();
  return ok(null, "Convite cancelado.");
}

export async function setRolePermissions(institutionId: string, role: string, perms: string[]) {
  return rpc("set_role_permissions", { p_inst: institutionId, p_role: role, p_perms: perms }, { message: "Permissões atualizadas." });
}
