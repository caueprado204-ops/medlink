"use server";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase/server";
import { fromPgError, invalid, ok, type ActionResult, type Checks } from "@/lib/errors";
import { toInstant } from "@/lib/time";
import { rpc } from "./_rpc";

const shiftInput = z.object({
  id: z.string().uuid().nullable(),
  institution_id: z.string().uuid(),
  unit_id: z.string().uuid({ message: "Selecione a unidade." }),
  service_id: z.string().uuid().nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe a data."),
  start: z.string().regex(/^\d{2}:\d{2}$/, "Informe o horário de início."),
  end: z.string().regex(/^\d{2}:\d{2}$/, "Informe o horário de término."),
  break_minutes: z.coerce.number().int().min(0, "Intervalo inválido.").max(240, "Intervalo de no máximo 240 min."),
  category: z.string().nullable(),
  slots: z.coerce.number().int().min(1, "Pelo menos 1 vaga.").max(50, "No máximo 50 vagas."),
  required_competencies: z.array(z.string()),
  notes: z.string().max(2000).nullable(),
  override_reason: z.string().max(500).nullable(),
  tz: z.string(),
});
export type ShiftInput = z.input<typeof shiftInput>;

export async function saveShift(input: ShiftInput): Promise<ActionResult<string>> {
  const parsed = shiftInput.safeParse(input);
  if (!parsed.success) return invalid(parsed.error.issues[0].message);
  const v = parsed.data;
  const startsAt = toInstant(v.date, v.start, v.tz);
  // término menor ou igual ao início = atravessa a meia-noite
  const endDate = v.end <= v.start ? new Date(Date.parse(`${v.date}T00:00:00Z`) + 86_400_000).toISOString().slice(0, 10) : v.date;
  const endsAt = toInstant(endDate, v.end, v.tz);
  return rpc<string>("save_shift", {
    p: {
      id: v.id, institution_id: v.institution_id, unit_id: v.unit_id, service_id: v.service_id ?? "",
      starts_at: startsAt, ends_at: endsAt, break_minutes: v.break_minutes, category: v.category ?? "",
      slots: v.slots, required_competencies: v.required_competencies, notes: v.notes ?? "",
      override_reason: v.override_reason ?? "",
    },
  }, { message: v.id ? "Plantão atualizado." : "Plantão criado como rascunho." });
}

export async function moveShift(id: string, newStartIso: string, reason?: string | null) {
  if (Number.isNaN(Date.parse(newStartIso))) return invalid("Data inválida.");
  return rpc<string>("move_shift", { p_id: id, p_new_start: newStartIso, p_override_reason: reason ?? null }, { message: "Plantão movido." });
}

export async function duplicateShift(id: string, dates: string[]) {
  if (!dates.length) return invalid("Selecione pelo menos uma data.");
  if (dates.some((d) => !/^\d{4}-\d{2}-\d{2}$/.test(d))) return invalid("Data inválida.");
  const res = await rpc<number>("duplicate_shift", { p_id: id, p_dates: dates });
  if (!res.ok) return res;
  return ok(res.data, `${res.data} ${res.data === 1 ? "cópia criada" : "cópias criadas"} como rascunho.`);
}

export async function publishShifts(ids: string[]) {
  if (!ids.length) return invalid("Não há rascunhos para publicar neste período.");
  const res = await rpc<number>("publish_shifts", { p_ids: ids });
  if (!res.ok) return res;
  return ok(res.data, res.data ? `${res.data} ${res.data === 1 ? "plantão publicado" : "plantões publicados"}. Profissionais escalados foram notificados.` : "Nenhum plantão futuro para publicar.");
}

export async function cancelShift(id: string, reason: string) {
  if (!reason.trim()) return invalid("Informe o motivo do cancelamento.");
  return rpc("cancel_shift", { p_id: id, p_reason: reason }, { message: "Plantão cancelado." });
}

export async function assignProfessional(shiftId: string, professionalId: string, reason?: string | null, confirmed = false) {
  return rpc<string>("assign_professional", {
    p_shift: shiftId, p_professional: professionalId, p_override_reason: reason ?? null, p_confirmed: confirmed,
  }, { message: "Profissional escalado." });
}

export async function removeAssignment(assignmentId: string, reason: string | null) {
  return rpc("remove_assignment", { p_assignment: assignmentId, p_reason: reason }, { message: "Profissional removido do plantão." });
}

export async function checkCandidates(shiftId: string, professionalIds: string[]): Promise<ActionResult<Record<string, Checks>>> {
  const supabase = getServerClient();
  const out: Record<string, Checks> = {};
  const results = await Promise.all(
    professionalIds.slice(0, 60).map((pid) => supabase.rpc("assignment_checks", { p_shift: shiftId, p_professional: pid })),
  );
  for (let i = 0; i < results.length; i++) {
    const { data, error } = results[i];
    if (error) return fromPgError(error);
    out[professionalIds[i]] = data as Checks;
  }
  return ok(out);
}

export type HistoryEntry = { id: number; action: string; entity: string; created_at: string; reason: string | null; actor: string | null; changes: Record<string, unknown> | null };

export async function shiftHistory(shiftId: string): Promise<ActionResult<HistoryEntry[]>> {
  const supabase = getServerClient();
  const { data: asg } = await supabase.from("shift_assignments").select("id").eq("shift_id", shiftId);
  const ids = [shiftId, ...(asg ?? []).map((a) => a.id as string)];
  const { data, error } = await supabase
    .from("audit_log")
    .select("id, action, entity, created_at, reason, actor_id, changes")
    .in("entity_id", ids)
    .order("created_at", { ascending: false })
    .limit(60);
  if (error) return fromPgError(error);
  const actorIds = Array.from(new Set((data ?? []).map((d) => d.actor_id).filter(Boolean))) as string[];
  const { data: people } = actorIds.length
    ? await supabase.from("profiles").select("id, full_name, email").in("id", actorIds)
    : { data: [] as { id: string; full_name: string | null; email: string }[] };
  const names = new Map((people ?? []).map((p) => [p.id, p.full_name || p.email]));
  return ok((data ?? []).map((d) => ({
    id: d.id, action: d.action, entity: d.entity, created_at: d.created_at, reason: d.reason,
    actor: d.actor_id ? names.get(d.actor_id) ?? "Usuário" : "Sistema", changes: d.changes,
  })));
}

export async function decideRequest(requestId: string, approve: boolean, note: string | null, substitute: string | null, overrideReason: string | null) {
  return rpc("decide_request", {
    p_request: requestId, p_approve: approve, p_note: note, p_substitute: substitute, p_override_reason: overrideReason,
  }, { message: approve ? "Solicitação aprovada." : "Solicitação recusada." });
}
