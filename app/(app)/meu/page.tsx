import { requireContext } from "@/lib/session";
import { getServerClient } from "@/lib/supabase/server";
import { ASSIGNMENT_STATUS, CATEGORIES, REQUEST_KIND, REQUEST_STATUS, type AssignmentStatus, type Category, type RequestKind, type RequestStatus } from "@/lib/labels";
import { addDays, fmt, formatHours, hoursBetween, localDate, localTime, relativeDay, startOfWeek, toInstant, today } from "@/lib/time";
import { Badge, EmptyState, PageHeader, SectionTitle } from "@/components/ui/primitives";
import { AvailabilityEditor, AbsenceManager, type Absence, type Prefs, type Slot } from "@/components/forms/availability-editor";
import { AssignmentActions, ApplyButton, WithdrawButton } from "./actions";

export const metadata = { title: "Minha área" };

type MyAssignment = {
  id: string; status: AssignmentStatus;
  shift: { id: string; starts_at: string; ends_at: string; break_minutes: number; status: string; notes: string | null; unit: { name: string; address: string | null } | null; service: { name: string } | null } | null;
};

export default async function MinhaArea() {
  const ctx = await requireContext();
  if (!ctx.professional) {
    return (
      <div>
        <PageHeader title="Minha área" />
        <div className="panel"><EmptyState title="Seu acesso ainda não está ligado a um cadastro profissional">
          Peça à gestão de {ctx.current.name} para cadastrar seu e-mail ({ctx.email}) no seu perfil profissional e enviar o convite.
        </EmptyState></div>
      </div>
    );
  }
  const me = ctx.professional;
  const supabase = getServerClient();
  const t0 = today(ctx.tz);
  const nowIso = new Date().toISOString();

  const [{ data: asg }, { data: open }, { data: reqs }, { data: slots }, { data: prefs }, { data: absences }] = await Promise.all([
    supabase.from("shift_assignments")
      .select("id,status,shift:shifts(id,starts_at,ends_at,break_minutes,status,notes,unit:units(name,address),service:services(name))")
      .eq("professional_id", me.id).order("created_at", { ascending: false }).limit(200),
    supabase.from("shifts")
      .select("id,starts_at,ends_at,category,slots,status,unit:units(name),service:services(name),assignments:shift_assignments(professional_id,status)")
      .eq("institution_id", ctx.current.id).in("status", ["descoberto", "publicado"]).gt("starts_at", nowIso)
      .lt("starts_at", toInstant(addDays(t0, 30), "00:00", ctx.tz)).order("starts_at").limit(30),
    supabase.from("change_requests").select("id,kind,status,reason,decision_note,created_at,shift:shifts(starts_at)")
      .eq("professional_id", me.id).order("created_at", { ascending: false }).limit(15),
    supabase.from("availability_slots").select("weekday,start_time,end_time").eq("professional_id", me.id),
    supabase.from("shift_preferences").select("preferred_turns,max_weekly_hours,notes").eq("professional_id", me.id).maybeSingle(),
    supabase.from("absences").select("id,kind,starts_on,ends_on,note").eq("professional_id", me.id).order("starts_on", { ascending: false }),
  ]);

  const mine = ((asg ?? []) as unknown as MyAssignment[]).filter((a) => a.shift && a.shift.status !== "rascunho");
  const activeMine = mine.filter((a) => ["aguardando_confirmacao", "confirmado", "substituicao_solicitada"].includes(a.status) && a.shift!.status !== "cancelado");
  const upcoming = activeMine.filter((a) => a.shift!.ends_at > nowIso).sort((a, b) => a.shift!.starts_at.localeCompare(b.shift!.starts_at));
  const pendingConfirm = upcoming.filter((a) => a.status === "aguardando_confirmacao");
  const next = upcoming[0];
  const history = mine.filter((a) => a.shift!.ends_at <= nowIso || !["aguardando_confirmacao", "confirmado", "substituicao_solicitada"].includes(a.status) || a.shift!.status === "cancelado")
    .sort((a, b) => b.shift!.starts_at.localeCompare(a.shift!.starts_at)).slice(0, 15);

  const ws = startOfWeek(t0);
  const week = Array.from({ length: 7 }, (_, i) => addDays(ws, i));
  const weekHours = upcoming.concat(activeMine.filter((a) => a.shift!.ends_at <= nowIso))
    .filter((a) => { const d = localDate(a.shift!.starts_at, ctx.tz); return d >= ws && d < addDays(ws, 7); })
    .reduce((acc, a) => acc + hoursBetween(a.shift!.starts_at, a.shift!.ends_at, a.shift!.break_minutes), 0);

  const myShiftIds = new Set(activeMine.map((a) => a.shift!.id));
  const appliedShiftIds = new Set<string>();
  const { data: myApps } = await supabase.from("change_requests").select("shift_id").eq("professional_id", me.id).eq("kind", "candidatura").eq("status", "pendente");
  (myApps ?? []).forEach((r) => appliedShiftIds.add(r.shift_id as string));
  const opportunities = ((open ?? []) as unknown as { id: string; starts_at: string; ends_at: string; category: Category | null; slots: number; unit: { name: string } | null; service: { name: string } | null; assignments: { professional_id: string; status: string }[] }[])
    .filter((s) => !myShiftIds.has(s.id) && (!s.category || s.category === me.category))
    .map((s) => ({ ...s, openSlots: s.slots - s.assignments.filter((a) => ["aguardando_confirmacao", "confirmado", "substituicao_solicitada"].includes(a.status)).length }))
    .filter((s) => s.openSlots > 0);

  return (
    <div className="space-y-6">
      <PageHeader title={`Olá, ${me.full_name.split(" ")[0]}`} description={`${CATEGORIES[me.category]} em ${ctx.current.name}.`} />

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <section className="panel overflow-hidden">
          <SectionTitle>Próximo plantão</SectionTitle>
          {next ? (
            <div className="p-4">
              <p className="text-sm text-ink-soft first-letter:uppercase">{relativeDay(localDate(next.shift!.starts_at, ctx.tz), ctx.tz)}</p>
              <p className="mt-0.5 text-2xl font-semibold tabular-nums text-navy">{localTime(next.shift!.starts_at, ctx.tz)}–{localTime(next.shift!.ends_at, ctx.tz)}</p>
              <p className="mt-1">{next.shift!.unit?.name}{next.shift!.service ? ` / ${next.shift!.service.name}` : ""}</p>
              {next.shift!.unit?.address && <p className="text-sm text-ink-faint">{next.shift!.unit.address}</p>}
              {next.shift!.notes && <p className="mt-2 rounded bg-canvas px-2.5 py-1.5 text-sm">{next.shift!.notes}</p>}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge tone={ASSIGNMENT_STATUS[next.status].tone}>{ASSIGNMENT_STATUS[next.status].label}</Badge>
              </div>
              <AssignmentActions id={next.id} status={next.status} />
            </div>
          ) : <EmptyState title="Nenhum plantão agendado">Quando a gestão publicar uma escala com você, ela aparece aqui.</EmptyState>}
        </section>

        <section className="panel">
          <SectionTitle action={<span className="text-sm text-ink-soft">{formatHours(weekHours)} na semana</span>}>Esta semana</SectionTitle>
          <ul className="divide-y divide-line">
            {week.map((d) => {
              const items = activeMine.filter((a) => localDate(a.shift!.starts_at, ctx.tz) === d);
              return (
                <li key={d} className={`flex items-start gap-3 px-4 py-2 text-sm ${d === t0 ? "bg-teal-50/60" : ""}`}>
                  <span className={`w-16 shrink-0 capitalize ${d === t0 ? "font-semibold text-teal" : "text-ink-soft"}`}>{fmt(`${d}T12:00:00Z`, "EEE dd", "UTC")}</span>
                  <span className="flex-1">
                    {items.length === 0 ? <span className="text-ink-faint">Folga</span> : items.map((a) => (
                      <span key={a.id} className="block tabular-nums">
                        {localTime(a.shift!.starts_at, ctx.tz)}–{localTime(a.shift!.ends_at, ctx.tz)} <span className="text-ink-soft">{a.shift!.unit?.name}</span>
                        {a.status !== "confirmado" && <span className="ml-1.5 text-xs text-amber">{ASSIGNMENT_STATUS[a.status].label.toLowerCase()}</span>}
                      </span>
                    ))}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      {upcoming.length > 0 && (
        <section className="panel">
          <SectionTitle action={pendingConfirm.length ? <Badge tone="amber">{pendingConfirm.length} para confirmar</Badge> : undefined}>Minha escala</SectionTitle>
          <ul className="divide-y divide-line">
            {upcoming.map((a) => (
              <li key={a.id} className="px-4 py-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="w-full text-sm font-medium first-letter:uppercase sm:w-36">{fmt(a.shift!.starts_at, "EEE dd/MM", ctx.tz)}, {localTime(a.shift!.starts_at, ctx.tz)}–{localTime(a.shift!.ends_at, ctx.tz)}</span>
                  <span className="min-w-0 flex-1 truncate text-sm text-ink-soft">{a.shift!.unit?.name}{a.shift!.service ? ` / ${a.shift!.service.name}` : ""}</span>
                  <Badge tone={ASSIGNMENT_STATUS[a.status].tone}>{ASSIGNMENT_STATUS[a.status].label}</Badge>
                </div>
                <AssignmentActions id={a.id} status={a.status} compact />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="panel">
        <SectionTitle>Oportunidades nos próximos 30 dias</SectionTitle>
        {opportunities.length === 0 ? <EmptyState title="Nenhuma vaga aberta para a sua categoria" /> : (
          <ul className="divide-y divide-line">
            {opportunities.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
                <span className="w-full font-medium first-letter:uppercase sm:w-36">{fmt(s.starts_at, "EEE dd/MM", ctx.tz)}, {localTime(s.starts_at, ctx.tz)}–{localTime(s.ends_at, ctx.tz)}</span>
                <span className="min-w-0 flex-1 truncate text-ink-soft">{s.unit?.name}{s.service ? ` / ${s.service.name}` : ""}</span>
                <span className="text-xs text-ink-faint">{s.openSlots} {s.openSlots === 1 ? "vaga" : "vagas"}</span>
                {appliedShiftIds.has(s.id) ? <Badge tone="sky">Candidatura enviada</Badge> : <ApplyButton shiftId={s.id} />}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="panel">
        <SectionTitle>Minhas solicitações</SectionTitle>
        {(reqs ?? []).length === 0 ? <EmptyState title="Nenhuma solicitação">Pedidos de substituição, cancelamento e candidaturas aparecem aqui com a resposta da gestão.</EmptyState> : (
          <ul className="divide-y divide-line">
            {((reqs ?? []) as unknown as { id: string; kind: RequestKind; status: RequestStatus; reason: string | null; decision_note: string | null; created_at: string; shift: { starts_at: string } | null }[]).map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
                <span className="w-28 font-medium">{REQUEST_KIND[r.kind]}</span>
                <span className="min-w-0 flex-1 text-ink-soft">
                  {r.shift ? `Plantão de ${fmt(r.shift.starts_at, "dd/MM HH:mm", ctx.tz)}` : ""}
                  {r.decision_note && <span className="block text-xs">Resposta: {r.decision_note}</span>}
                </span>
                <Badge tone={REQUEST_STATUS[r.status].tone}>{REQUEST_STATUS[r.status].label}</Badge>
                {r.status === "pendente" && <WithdrawButton id={r.id} />}
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="panel">
          <SectionTitle>Minha disponibilidade</SectionTitle>
          <div className="p-4">
            <AvailabilityEditor slots={(slots ?? []) as Slot[]} prefs={(prefs as Prefs | null) ?? { preferred_turns: [], max_weekly_hours: null, notes: null }} />
          </div>
        </section>
        <div className="space-y-6">
          <section className="panel">
            <SectionTitle>Férias e afastamentos</SectionTitle>
            <div className="p-4"><AbsenceManager absences={(absences ?? []) as Absence[]} tz={ctx.tz} /></div>
          </section>
          <section className="panel">
            <SectionTitle>Histórico</SectionTitle>
            {history.length === 0 ? <p className="px-4 py-6 text-sm text-ink-soft">Sem plantões anteriores.</p> : (
              <ul className="divide-y divide-line">
                {history.map((a) => (
                  <li key={a.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                    <span className="w-28 first-letter:uppercase">{fmt(a.shift!.starts_at, "EEE dd/MM", ctx.tz)}</span>
                    <span className="min-w-0 flex-1 truncate text-ink-soft">{a.shift!.unit?.name}</span>
                    <span className="text-xs text-ink-faint">{a.shift!.status === "cancelado" ? "Cancelado" : a.shift!.ends_at <= nowIso && a.status === "confirmado" ? "Realizado" : ASSIGNMENT_STATUS[a.status].label}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
