import Link from "next/link";
import { redirect } from "next/navigation";
import { requireContext } from "@/lib/session";
import { getServerClient } from "@/lib/supabase/server";
import { loadShifts } from "@/lib/queries";
import { isActiveAssignment } from "@/lib/queries-shared";
import { CATEGORIES, REQUEST_KIND, type RequestKind } from "@/lib/labels";
import { addDays, fmt, localTime, toInstant, today } from "@/lib/time";
import { Badge, EmptyState, PageHeader, SectionTitle, Stat } from "@/components/ui/primitives";
import { DemoControls } from "./demo-controls";

export const metadata = { title: "Painel" };

export default async function Painel() {
  const ctx = await requireContext();
  if (!ctx.perms.has("shifts.view") && !ctx.perms.has("professionals.view")) redirect("/meu");
  const supabase = getServerClient();
  const t0 = today(ctx.tz);
  const now = new Date().toISOString();
  const inst = ctx.current.id;

  const canShifts = ctx.perms.has("shifts.view");
  const [shifts, reqs, profs, docs, units] = await Promise.all([
    canShifts ? loadShifts(inst, toInstant(t0, "00:00", ctx.tz), toInstant(addDays(t0, 7), "00:00", ctx.tz)) : Promise.resolve([]),
    ctx.perms.has("requests.decide")
      ? supabase.from("change_requests").select("id, kind, created_at, professional:professionals!change_requests_professional_id_institution_id_fkey(full_name), shift:shifts(starts_at)")
          .eq("institution_id", inst).eq("status", "pendente").order("created_at").limit(5)
      : Promise.resolve({ data: [] }),
    ctx.perms.has("professionals.view")
      ? supabase.from("professionals").select("id, validation_status, is_demo").eq("institution_id", inst).eq("active", true)
      : Promise.resolve({ data: [] }),
    ctx.perms.has("professionals.view")
      ? supabase.from("professional_documents").select("id", { count: "exact", head: true }).eq("institution_id", inst)
          .lte("expires_on", addDays(t0, 30)).neq("status", "rejeitado")
      : Promise.resolve({ count: 0 }),
    supabase.from("units").select("id", { count: "exact", head: true }).eq("institution_id", inst),
  ]);

  const upcoming = shifts.filter((s) => s.status !== "cancelado" && s.ends_at > now);
  const uncovered = upcoming.filter((s) => s.status === "descoberto");
  const waiting = upcoming.filter((s) => s.status === "aguardando_confirmacao" || s.status === "substituicao_solicitada");
  const drafts = upcoming.filter((s) => s.status === "rascunho");
  const profList = (profs.data ?? []) as { id: string; validation_status: string; is_demo: boolean }[];
  const pendingValidation = profList.filter((p) => p.validation_status === "pendente" || p.validation_status === "em_analise").length;
  const hasDemo = profList.some((p) => p.is_demo);
  const requests = (reqs.data ?? []) as unknown as { id: string; kind: RequestKind; professional: { full_name: string } | null; shift: { starts_at: string } | null }[];
  const isEmpty = profList.length === 0 && shifts.length === 0;

  return (
    <div>
      <PageHeader
        title="Painel"
        description={`Próximos 7 dias em ${ctx.current.name}.`}
        actions={canShifts ? <Link href="/escalas" className="inline-flex h-10 items-center rounded bg-teal px-4 text-sm font-medium text-white hover:bg-teal-700">Abrir escalas</Link> : undefined}
      />

      {isEmpty && ctx.perms.has("institution.manage") && (
        <div className="panel mb-6 p-5">
          <h2 className="text-lg">Primeiros passos</h2>
          <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-ink-soft">
            <li><Link className="text-teal hover:underline" href="/unidades">Revise as unidades</Link> e cadastre os serviços ou setores ({units.count ?? 0} {units.count === 1 ? "unidade" : "unidades"} cadastradas).</li>
            <li><Link className="text-teal hover:underline" href="/profissionais">Cadastre os profissionais</Link> e envie o convite para cada um acessar a Minha área.</li>
            <li><Link className="text-teal hover:underline" href="/escalas">Monte a escala</Link> em rascunho e publique quando estiver pronta.</li>
            <li><Link className="text-teal hover:underline" href="/equipe">Dê acesso à equipe de gestão</Link> com o perfil adequado.</li>
          </ol>
          <DemoControls institutionId={inst} hasDemo={false} />
        </div>
      )}

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {canShifts && <Stat label="Plantões descobertos" value={uncovered.length} tone={uncovered.length ? "danger" : undefined} href="/escalas?st=descoberto" />}
        {canShifts && <Stat label="Aguardando confirmação" value={waiting.length} tone={waiting.length ? "amber" : undefined} href="/escalas?st=aguardando_confirmacao" />}
        {canShifts && <Stat label="Rascunhos não publicados" value={drafts.length} href="/escalas?st=rascunho" />}
        {ctx.perms.has("professionals.view") && <Stat label="Cadastros a validar" value={pendingValidation} tone={pendingValidation ? "amber" : undefined} href="/profissionais?validacao=pendente" />}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {canShifts && (
          <section className="panel">
            <SectionTitle>Vagas em aberto</SectionTitle>
            {uncovered.length === 0 ? (
              <EmptyState title="Nenhuma vaga descoberta nos próximos 7 dias">Plantões publicados sem profissional suficiente aparecem aqui.</EmptyState>
            ) : (
              <ul className="divide-y divide-line">
                {uncovered.slice(0, 8).map((s) => {
                  const filled = s.assignments.filter((a) => isActiveAssignment(a.status)).length;
                  return (
                    <li key={s.id}>
                      <Link href={`/escalas?plantao=${s.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-canvas">
                        <div className="w-24 shrink-0">
                          <p className="text-sm font-medium first-letter:uppercase">{fmt(s.starts_at, "EEE dd/MM", ctx.tz)}</p>
                          <p className="text-xs tabular-nums text-ink-soft">{localTime(s.starts_at, ctx.tz)}–{localTime(s.ends_at, ctx.tz)}</p>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm">{s.unit?.name}{s.service ? ` / ${s.service.name}` : ""}</p>
                          <p className="text-xs text-ink-faint">{s.category ? CATEGORIES[s.category] : "Qualquer categoria"}</p>
                        </div>
                        <Badge tone="danger">{s.slots - filled} {s.slots - filled === 1 ? "vaga" : "vagas"}</Badge>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        )}

        <div className="space-y-6">
          {ctx.perms.has("requests.decide") && (
            <section className="panel">
              <SectionTitle action={<Link href="/solicitacoes" className="text-sm text-teal hover:underline">Ver todas</Link>}>Solicitações pendentes</SectionTitle>
              {requests.length === 0 ? (
                <EmptyState title="Nada para aprovar">Pedidos de substituição e candidaturas aparecem aqui.</EmptyState>
              ) : (
                <ul className="divide-y divide-line">
                  {requests.map((r) => (
                    <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{r.professional?.full_name}</span>
                        <span className="text-xs text-ink-soft">{REQUEST_KIND[r.kind]}{r.shift ? `, plantão de ${fmt(r.shift.starts_at, "dd/MM HH:mm", ctx.tz)}` : ""}</span>
                      </span>
                      <Link href="/solicitacoes" className="shrink-0 text-teal hover:underline">Analisar</Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
          {ctx.perms.has("professionals.view") && (docs.count ?? 0) > 0 && (
            <div className="rounded-md border border-amber-line bg-amber-bg px-4 py-3 text-sm text-amber">
              {docs.count} {docs.count === 1 ? "documento vence" : "documentos vencem"} nos próximos 30 dias ou já {docs.count === 1 ? "venceu" : "venceram"}.{" "}
              <Link href="/profissionais?documentos=vencendo" className="font-medium underline">Ver profissionais</Link>
            </div>
          )}
          {hasDemo && ctx.perms.has("institution.manage") && (
            <div className="panel p-4"><DemoControls institutionId={inst} hasDemo /></div>
          )}
        </div>
      </div>
    </div>
  );
}
