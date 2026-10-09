import "server-only";
import { getServerClient } from "./supabase/server";
import type { AssignmentStatus, Category, ShiftStatus } from "./labels";

export type AssignmentLite = {
  id: string;
  status: AssignmentStatus;
  professional_id: string;
  exception_reason: string | null;
  warnings: { code: string; message: string }[];
  professional: { full_name: string; category: Category } | null;
};

export type ShiftRow = {
  id: string;
  institution_id: string;
  unit_id: string;
  service_id: string | null;
  starts_at: string;
  ends_at: string;
  break_minutes: number;
  category: Category | null;
  slots: number;
  required_competencies: string[];
  notes: string | null;
  status: ShiftStatus;
  series_id: string | null;
  is_demo: boolean;
  cancel_reason: string | null;
  unit: { name: string } | null;
  service: { name: string } | null;
  assignments: AssignmentLite[];
};

export const SHIFT_SELECT =
  "id,institution_id,unit_id,service_id,starts_at,ends_at,break_minutes,category,slots,required_competencies,notes,status,series_id,is_demo,cancel_reason," +
  "unit:units(name),service:services(name)," +
  "assignments:shift_assignments(id,status,professional_id,exception_reason,warnings,professional:professionals(full_name,category))";

export async function loadShifts(institutionId: string, fromIso: string, toIso: string) {
  const { data, error } = await getServerClient()
    .from("shifts")
    .select(SHIFT_SELECT)
    .eq("institution_id", institutionId)
    .gte("starts_at", fromIso)
    .lt("starts_at", toIso)
    .order("starts_at")
    .limit(2000);
  if (error) throw new Error("Não foi possível carregar as escalas.");
  return (data ?? []) as unknown as ShiftRow[];
}

export type UnitRow = { id: string; name: string; city: string | null; uf: string | null; address: string | null; phone: string | null; active: boolean };
export type ServiceRow = { id: string; unit_id: string; name: string; active: boolean };

export async function loadUnits(institutionId: string) {
  const supabase = getServerClient();
  const [{ data: units }, { data: services }] = await Promise.all([
    supabase.from("units").select("id,name,city,uf,address,phone,active").eq("institution_id", institutionId).order("name"),
    supabase.from("services").select("id,unit_id,name,active").eq("institution_id", institutionId).order("name"),
  ]);
  return { units: (units ?? []) as UnitRow[], services: (services ?? []) as ServiceRow[] };
}

export type ProfessionalLite = {
  id: string; full_name: string; category: Category; validation_status: string; active: boolean; is_demo: boolean; competencies: string[];
};

export async function loadProfessionalsLite(institutionId: string) {
  const { data } = await getServerClient()
    .from("professionals")
    .select("id,full_name,category,validation_status,active,is_demo,competencies")
    .eq("institution_id", institutionId)
    .order("full_name");
  return (data ?? []) as ProfessionalLite[];
}

export { isActiveAssignment } from "./queries-shared";
