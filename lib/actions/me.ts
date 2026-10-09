"use server";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase/server";
import { getContext } from "@/lib/session";
import { fromPgError, invalid, ok, type ActionResult } from "@/lib/errors";
import { rpc, revalidateAll } from "./_rpc";

export async function confirmAssignment(id: string) {
  return rpc("confirm_assignment", { p_assignment: id }, { message: "Presença confirmada." });
}
export async function declineAssignment(id: string, reason: string) {
  if (!reason.trim()) return invalid("Informe o motivo.");
  return rpc("decline_assignment", { p_assignment: id, p_reason: reason }, { message: "Plantão recusado. A gestão foi avisada." });
}
export async function requestChange(id: string, kind: "substituicao" | "cancelamento" | "alteracao", reason: string) {
  if (!reason.trim()) return invalid("Explique o motivo da solicitação.");
  return rpc("request_change", { p_assignment: id, p_kind: kind, p_reason: reason }, { message: "Solicitação enviada para aprovação." });
}
export async function applyToShift(shiftId: string, message: string | null) {
  return rpc("apply_to_shift", { p_shift: shiftId, p_message: message }, { message: "Candidatura enviada." });
}
export async function withdrawRequest(id: string) {
  return rpc("cancel_my_request", { p_request: id }, { message: "Solicitação retirada." });
}

/* ---------------------------------------------- Disponibilidade e ausências */
const slot = z.object({
  weekday: z.number().int().min(0).max(6),
  start_time: z.string().regex(/^\d{2}:\d{2}$/),
  end_time: z.string().regex(/^\d{2}:\d{2}$/),
}).refine((s) => s.start_time !== s.end_time, "Início e término não podem ser iguais.");

async function targetProfessional(professionalId?: string) {
  const ctx = await getContext();
  if (!ctx?.current) return null;
  const id = professionalId ?? ctx.professional?.id;
  return id ? { id, institutionId: ctx.current.id } : null;
}

export async function saveAvailability(
  slots: { weekday: number; start_time: string; end_time: string }[],
  prefs: { preferred_turns: string[]; max_weekly_hours: number | null; notes: string | null },
  professionalId?: string,
): Promise<ActionResult> {
  const t = await targetProfessional(professionalId);
  if (!t) return invalid("Seu cadastro profissional não está vinculado a esta instituição.");
  const parsed = z.array(slot).max(50).safeParse(slots);
  if (!parsed.success) return invalid(parsed.error.issues[0].message);
  if (prefs.max_weekly_hours != null && (prefs.max_weekly_hours < 1 || prefs.max_weekly_hours > 168)) return invalid("Carga semanal entre 1 e 168 horas.");
  const supabase = getServerClient();
  // A disponibilidade é independente dos plantões: alterá-la nunca muda escalas publicadas.
  const { error: delErr } = await supabase.from("availability_slots").delete().eq("professional_id", t.id);
  if (delErr) return fromPgError(delErr);
  if (parsed.data.length) {
    const { error } = await supabase.from("availability_slots")
      .insert(parsed.data.map((s) => ({ ...s, professional_id: t.id, institution_id: t.institutionId })));
    if (error) return fromPgError(error);
  }
  const { error: pErr } = await supabase.from("shift_preferences").upsert({
    professional_id: t.id, institution_id: t.institutionId, preferred_turns: prefs.preferred_turns,
    max_weekly_hours: prefs.max_weekly_hours, notes: prefs.notes, updated_at: new Date().toISOString(),
  });
  if (pErr) return fromPgError(pErr);
  revalidateAll();
  return ok(null, "Disponibilidade salva. Plantões já publicados não foram alterados.");
}

export async function addAbsence(kind: string, startsOn: string, endsOn: string, note: string | null, professionalId?: string): Promise<ActionResult> {
  const t = await targetProfessional(professionalId);
  if (!t) return invalid("Seu cadastro profissional não está vinculado a esta instituição.");
  if (!["indisponivel", "ferias", "afastamento", "licenca"].includes(kind)) return invalid("Tipo inválido.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startsOn) || !/^\d{4}-\d{2}-\d{2}$/.test(endsOn)) return invalid("Informe as datas.");
  if (endsOn < startsOn) return invalid("A data final deve ser igual ou posterior à inicial.");
  const { error } = await getServerClient().from("absences").insert({
    institution_id: t.institutionId, professional_id: t.id, kind, starts_on: startsOn, ends_on: endsOn, note,
  });
  if (error) return fromPgError(error);
  revalidateAll();
  return ok(null, "Período registrado. Plantões já publicados não foram alterados — fale com a gestão se precisar de substituição.");
}

export async function removeAbsence(id: string): Promise<ActionResult> {
  const { data, error } = await getServerClient().from("absences").delete().eq("id", id).select("id");
  if (error) return fromPgError(error);
  if (!data?.length) return { ok: false, kind: "permission", message: "Registro não encontrado." };
  revalidateAll();
  return ok(null, "Período removido.");
}
