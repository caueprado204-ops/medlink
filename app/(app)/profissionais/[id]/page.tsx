import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePerm } from "@/lib/session";
import { getServerClient } from "@/lib/supabase/server";
import { loadUnits } from "@/lib/queries";
import { ASSIGNMENT_STATUS, CATEGORIES, VALIDATION_STATUS, type AssignmentStatus, type Category, type ValidationStatus } from "@/lib/labels";
import { fmt, localTime } from "@/lib/time";
import { Badge, DemoBadge, SectionTitle } from "@/components/ui/primitives";
import { AvailabilityEditor, AbsenceManager, type Absence, type Prefs, type Slot } from "@/components/forms/availability-editor";
import type { ProfessionalFull } from "@/components/forms/professional-form";
import { ProfileActions, EditProfile, Documents, type DocRow } from "./client";

export const metadata = { title: "Profissional" };

type Prof = ProfessionalFull & {
  validation_status: ValidationStatus; active: boolean; is_demo: boolean; user_id: string | null; created_at: string;
};

export default async function ProfissionalPage({ params }: { params: { id: string } }) {
  const ctx = await requirePerm("professionals.view");
  if (!/^[0-9a-f-]{36}$/.test(params.id)) notFound();
  const supabase = getServerClient();
  const { data: prof } = await supabase.from("professionals").select("*").eq("id", params.id).eq("institution_id", ctx.current.id).maybeSingle();
  if (!prof) notFound();
  const p = prof as unknown as Prof;

  const [{ data: units_ }, { data: slots }, { data: prefs }, { data: absences }, { data: docs }, { data: asg }, { data: invite }, { units }] = await Promise.all([
    supabase.from("professional_units").select("unit_id").eq("professional_id", p.id),
    supabase.from("availability_slots").select("weekday,start_time,end_time").eq("professional_id", p.id).order("weekday").order("start_time"),
    supabase.from("shift_preferences").select("preferred_turns,max_weekly_hours,notes").eq("professional_id", p.id).maybeSingle(),
    supabase.from("absences").select("id,kind,starts_on,ends_on,note").eq("professional_id", p.id).order("starts_on", { ascending: false }),
    supabase.from("professional_documents").select("id,kind,file_path,expires_on,status,verified_at,note,created_at").eq("professional_id", p.id).order("created_at", { ascending: false }),
    supabase.from("shift_assignments").select("id,status,shift:shifts(id,starts_at,ends_at,status,unit:units(name))").eq("professional_id", p.id).order("created_at", { ascending: false }).limit(30),
    supabase.from("invitations").select("created_at,accepted_at").eq("professional_id", p.id).maybeSingle(),
    loadUnits(ctx.current.id),
  ]);
  const canManage = ctx.perms.has("professionals.manage");
  const canVerify = ctx.perms.has("documents.verify");
  const v = VALIDATION_STATUS[p.validation_status];
  const assignments = ((asg ?? []) as unknown as { id: string; status: AssignmentStatus; shift: { id: string; starts_at: string; ends_at: string; status: string; unit: { name: string } | null } | null }[])
    .filter((a) => a.shift)
    .sort((a, b) => b.shift!.starts_at.localeCompare(a.shift!.starts_at));

  return (
    <div className="space-y-6">
      <div>
        <Link href="/profissionais" className="text-sm text-ink-soft hover:text-navy">Profissionais</Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl">{p.full_name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-ink-soft">
              <span>{CATEGORIES[p.category as Category]}</span>
              {p.council_number && <span className="tabular-nums">{p.council} {p.council_number}/{p.council_uf}</span>}
              <Badge tone={v.tone}>{v.label}</Badge>
              {!p.active && <Badge>Inativo</Badge>}
              {p.is_demo && <DemoBadge />}
              {p.user_id ? <Badge tone="teal">Conta vinculada</Badge> : invite ? <Badge tone="sky">Convite pendente</Badge> : null}
            </div>
          </div>
          <ProfileActions
            id={p.id} active={p.active} validation={p.validation_status} hasEmail={!!p.email} linked={!!p.user_id}
            invited={!!invite} canManage={canManage} canVerify={canVerify}
          />
        </div>
      </div>

      <section className="panel">
        <SectionTitle>Dados profissionais</SectionTitle>
        <div className="p-4">
          {canManage ? (
            <EditProfile institutionId={ctx.current.id} units={units} professional={p} unitIds={(units_ ?? []).map((u) => u.unit_id as string)} />
          ) : (
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div><dt className="text-ink-faint">E-mail</dt><dd>{p.email ?? "Não informado"}</dd></div>
              <div><dt className="text-ink-faint">Telefone</dt><dd>{p.phone ?? "Não informado"}</dd></div>
              <div><dt className="text-ink-faint">Competências</dt><dd>{p.competencies.join(", ") || "Não informadas"}</dd></div>
              <div><dt className="text-ink-faint">Certificações</dt><dd>{p.certifications.join(", ") || "Não informadas"}</dd></div>
              <div><dt className="text-ink-faint">Formação</dt><dd className="whitespace-pre-line">{p.education ?? "Não informada"}</dd></div>
              <div><dt className="text-ink-faint">Região</dt><dd>{p.region ?? "Não informada"}</dd></div>
            </dl>
          )}
        </div>
      </section>

      <section className="panel">
        <SectionTitle>Documentos</SectionTitle>
        <div className="p-4">
          <Documents institutionId={ctx.current.id} professionalId={p.id} docs={(docs ?? []) as DocRow[]} canUpload={canManage} canVerify={canVerify} tz={ctx.tz} />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="panel">
          <SectionTitle>Disponibilidade</SectionTitle>
          <div className="p-4">
            <AvailabilityEditor
              slots={(slots ?? []) as Slot[]}
              prefs={(prefs as Prefs | null) ?? { preferred_turns: [], max_weekly_hours: null, notes: null }}
              professionalId={p.id} readOnly={!canManage}
            />
          </div>
        </section>
        <div className="space-y-6">
          <section className="panel">
            <SectionTitle>Férias e afastamentos</SectionTitle>
            <div className="p-4"><AbsenceManager absences={(absences ?? []) as Absence[]} professionalId={p.id} readOnly={!canManage} tz={ctx.tz} /></div>
          </section>
          <section className="panel">
            <SectionTitle>Plantões recentes</SectionTitle>
            {assignments.length === 0 ? <p className="px-4 py-6 text-sm text-ink-soft">Nenhum plantão atribuído.</p> : (
              <ul className="divide-y divide-line">
                {assignments.map((a) => (
                  <li key={a.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                    <Link href={`/escalas?plantao=${a.shift!.id}`} className="w-40 shrink-0 font-medium text-navy hover:underline first-letter:uppercase">
                      {fmt(a.shift!.starts_at, "EEE dd/MM", ctx.tz)} {localTime(a.shift!.starts_at, ctx.tz)}
                    </Link>
                    <span className="min-w-0 flex-1 truncate text-ink-soft">{a.shift!.unit?.name}</span>
                    <Badge tone={ASSIGNMENT_STATUS[a.status].tone}>{ASSIGNMENT_STATUS[a.status].label}</Badge>
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
