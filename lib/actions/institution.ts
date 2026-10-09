"use server";
import { cookies } from "next/headers";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase/server";
import { INST_COOKIE, getContext } from "@/lib/session";
import { fromPgError, invalid, ok, type ActionResult } from "@/lib/errors";
import { isValidCnpj, onlyDigits } from "@/lib/cnpj";
import { rpc, revalidateAll, str } from "./_rpc";

const COOKIE_OPTS = { path: "/", sameSite: "lax" as const, httpOnly: true, secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 365 };

const institutionTypes = [
  "clinica_vacinacao", "clinica_medica", "clinica_multiprofissional", "home_care",
  "servico_enfermagem", "centro_ambulatorial", "outra",
] as const;

const createSchema = z.object({
  name: z.string().min(2, "Informe o nome da instituição.").max(160),
  type: z.enum(institutionTypes, { errorMap: () => ({ message: "Selecione o tipo de instituição." }) }),
  cnpj: z.string().nullable().refine((v) => !v || isValidCnpj(v), "CNPJ inválido. Confira os 14 dígitos."),
  legal_name: z.string().max(200).nullable(),
  unit_name: z.string().max(120).nullable(),
  unit_city: z.string().max(120).nullable(),
  unit_uf: z.string().regex(/^[A-Za-z]{2}$/, "UF com 2 letras.").nullable(),
  modules: z.array(z.string()),
});

export async function createInstitution(form: FormData): Promise<ActionResult<string>> {
  const parsed = createSchema.safeParse({
    name: str(form.get("name")) ?? "",
    type: form.get("type"),
    cnpj: str(form.get("cnpj")),
    legal_name: str(form.get("legal_name")),
    unit_name: str(form.get("unit_name")),
    unit_city: str(form.get("unit_city")),
    unit_uf: str(form.get("unit_uf")),
    modules: form.getAll("modules").map(String),
  });
  if (!parsed.success) return invalid(parsed.error.issues[0].message);
  const v = parsed.data;
  const res = await rpc<string>("create_institution", {
    p_name: v.name, p_type: v.type, p_cnpj: v.cnpj ? onlyDigits(v.cnpj) : null, p_legal_name: v.legal_name,
    p_modules: v.modules, p_unit_name: v.unit_name, p_unit_city: v.unit_city, p_unit_uf: v.unit_uf?.toUpperCase() ?? null,
  });
  if (res.ok) cookies().set(INST_COOKIE, res.data, COOKIE_OPTS);
  return res;
}

export async function switchInstitution(id: string): Promise<ActionResult> {
  const ctx = await getContext();
  if (!ctx?.institutions.some((i) => i.id === id)) return invalid("Instituição não encontrada.");
  cookies().set(INST_COOKIE, id, COOKIE_OPTS);
  revalidateAll();
  return ok(null);
}

const updateSchema = z.object({
  name: z.string().min(2, "Informe o nome.").max(160),
  legal_name: z.string().max(200).nullable(),
  cnpj: z.string().nullable().refine((v) => !v || isValidCnpj(v), "CNPJ inválido."),
  phone: z.string().max(40).nullable(),
  email: z.string().email("E-mail inválido.").nullable(),
  modules: z.array(z.string()),
  min_rest_hours: z.coerce.number().int().min(0).max(48),
  max_weekly_hours: z.coerce.number().min(1).max(168),
  max_shift_hours: z.coerce.number().min(1).max(36),
});

export async function updateInstitution(id: string, form: FormData): Promise<ActionResult> {
  const parsed = updateSchema.safeParse({
    name: str(form.get("name")) ?? "",
    legal_name: str(form.get("legal_name")),
    cnpj: str(form.get("cnpj")),
    phone: str(form.get("phone")),
    email: str(form.get("email")),
    modules: form.getAll("modules").map(String),
    min_rest_hours: form.get("min_rest_hours"),
    max_weekly_hours: form.get("max_weekly_hours"),
    max_shift_hours: form.get("max_shift_hours"),
  });
  if (!parsed.success) return invalid(parsed.error.issues[0].message);
  const v = parsed.data;
  const supabase = getServerClient();
  const { data: current, error: readErr } = await supabase.from("institutions").select("settings").eq("id", id).single();
  if (readErr) return fromPgError(readErr);
  const { data, error } = await supabase
    .from("institutions")
    .update({
      name: v.name, legal_name: v.legal_name, cnpj: v.cnpj ? onlyDigits(v.cnpj) : null, phone: v.phone, email: v.email,
      modules: Array.from(new Set([...v.modules, "escalas", "profissionais"])),
      settings: { ...(current?.settings ?? {}), min_rest_hours: v.min_rest_hours, max_weekly_hours: v.max_weekly_hours, max_shift_hours: v.max_shift_hours },
    })
    .eq("id", id)
    .select("id");
  if (error) return fromPgError(error);
  if (!data?.length) return { ok: false, kind: "permission", message: "Você não tem permissão para editar esta instituição." };
  revalidateAll();
  return ok(null, "Dados salvos.");
}

export async function seedDemo(id: string) {
  return rpc("seed_demo_data", { p_inst: id }, { message: "Dados de demonstração criados." });
}
export async function clearDemo(id: string) {
  return rpc("clear_demo_data", { p_inst: id }, { message: "Dados de demonstração removidos." });
}

export async function markNotificationsRead(ids: string[] | null) {
  return rpc<number>("mark_notifications_read", { p_ids: ids });
}
