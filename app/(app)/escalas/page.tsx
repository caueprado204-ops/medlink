import { requirePerm } from "@/lib/session";
import { loadProfessionalsLite, loadShifts, loadUnits } from "@/lib/queries";
import { localDate, toInstant, today, viewRange, type CalendarView } from "@/lib/time";
import { getServerClient } from "@/lib/supabase/server";
import { ScheduleBoard } from "@/components/escalas/board";

export const metadata = { title: "Escalas" };

const VIEWS: CalendarView[] = ["dia", "semana", "mes", "lista"];

export default async function EscalasPage({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const ctx = await requirePerm("shifts.view");
  const view = (VIEWS.includes(searchParams.v as CalendarView) ? searchParams.v : "semana") as CalendarView;
  let anchor = /^\d{4}-\d{2}-\d{2}$/.test(searchParams.d ?? "") ? searchParams.d! : today(ctx.tz);
  // Link de notificação (?plantao=) abre a semana do plantão
  if (searchParams.plantao && !searchParams.d) {
    const { data } = await getServerClient().from("shifts").select("starts_at").eq("id", searchParams.plantao).maybeSingle();
    if (data) anchor = localDate(data.starts_at, ctx.tz);
  }
  const range = viewRange(view, anchor);
  const [shifts, { units, services }, professionals] = await Promise.all([
    loadShifts(ctx.current.id, toInstant(range.start, "00:00", ctx.tz), toInstant(range.end, "00:00", ctx.tz)),
    loadUnits(ctx.current.id),
    loadProfessionalsLite(ctx.current.id),
  ]);

  return (
    <ScheduleBoard
      institutionId={ctx.current.id}
      tz={ctx.tz}
      view={view}
      anchor={anchor}
      days={range.days}
      shifts={shifts}
      units={units}
      services={services}
      professionals={professionals}
      openShiftId={searchParams.plantao ?? null}
      filters={{
        unit: searchParams.u ?? "", service: searchParams.s ?? "", category: searchParams.c ?? "",
        status: searchParams.st ?? "", professional: searchParams.p ?? "",
      }}
      can={{
        manage: ctx.perms.has("shifts.manage"),
        publish: ctx.perms.has("shifts.publish"),
        audit: ctx.perms.has("audit.view"),
      }}
    />
  );
}
