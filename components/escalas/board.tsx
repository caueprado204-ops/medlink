"use client";
import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus, Send, SlidersHorizontal } from "lucide-react";
import type { ProfessionalLite, ServiceRow, ShiftRow, UnitRow } from "@/lib/queries";
import { isActiveAssignment } from "@/lib/queries-shared";
import { moveShift, publishShifts } from "@/lib/actions/shifts";
import { CATEGORIES, SHIFT_STATUS, WEEKDAYS_SHORT, type ShiftStatus } from "@/lib/labels";
import type { Checks } from "@/lib/errors";
import { fmt, localDate, localTime, shiftView, today, toInstant, type CalendarView } from "@/lib/time";
import { Badge, Button, cx } from "@/components/ui/primitives";
import { Modal, useToast } from "@/components/ui/overlay";
import { useAction } from "@/components/ui/use-action";
import { ShiftCard, SlotPips } from "./shift-card";
import { ShiftForm } from "./shift-form";
import { ShiftDetail } from "./shift-detail";
import { OverridePrompt } from "./checks";

type Filters = { unit: string; service: string; category: string; status: string; professional: string };

export function ScheduleBoard(props: {
  institutionId: string; tz: string; view: CalendarView; anchor: string; days: string[];
  shifts: ShiftRow[]; units: UnitRow[]; services: ServiceRow[]; professionals: ProfessionalLite[];
  openShiftId: string | null; filters: Filters;
  can: { manage: boolean; publish: boolean; audit: boolean };
}) {
  const { institutionId, tz, view, anchor, days, shifts, units, services, professionals, can, filters } = props;
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const toast = useToast();
  const { run, pending } = useAction();

  const [openId, setOpenId] = useState<string | null>(props.openShiftId);
  const [editing, setEditing] = useState<ShiftRow | null>(null);
  const [creatingOn, setCreatingOn] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [pendingMove, setPendingMove] = useState<{ shift: ShiftRow; date: string; checks: Checks; blocking: boolean } | null>(null);
  const [moveReason, setMoveReason] = useState("");

  function nav(next: Record<string, string | null>) {
    const sp = new URLSearchParams(params.toString());
    sp.delete("plantao");
    for (const [k, v] of Object.entries(next)) v ? sp.set(k, v) : sp.delete(k);
    router.push(`${pathname}?${sp.toString()}`);
  }

  const visible = useMemo(() => shifts.filter((s) =>
    (!filters.unit || s.unit_id === filters.unit) &&
    (!filters.service || s.service_id === filters.service) &&
    (!filters.category || s.category === filters.category) &&
    (!filters.status || s.status === filters.status) &&
    (!filters.professional || s.assignments.some((a) => a.professional_id === filters.professional && isActiveAssignment(a.status))),
  ), [shifts, filters]);

  const byDay = useMemo(() => {
    const m = new Map<string, ShiftRow[]>();
    for (const s of visible) {
      const d = localDate(s.starts_at, tz);
      m.set(d, [...(m.get(d) ?? []), s]);
    }
    return m;
  }, [visible, tz]);

  const drafts = visible.filter((s) => s.status === "rascunho" && new Date(s.ends_at) > new Date());
  const summary = {
    total: visible.filter((s) => s.status !== "cancelado").length,
    open: visible.filter((s) => s.status === "descoberto").length,
    waiting: visible.filter((s) => s.status === "aguardando_confirmacao" || s.status === "substituicao_solicitada").length,
  };
  const opened = openId ? shifts.find((s) => s.id === openId) ?? null : null;
  const activeFilterCount = Object.values(filters).filter(Boolean).length;
  const todayStr = today(tz);

  function doMove(shift: ShiftRow, date: string, reason?: string) {
    if (localDate(shift.starts_at, tz) === date) return;
    const newStart = toInstant(date, localTime(shift.starts_at, tz), tz);
    run(() => moveShift(shift.id, newStart, reason ?? null), {
      onOk: () => { setPendingMove(null); setMoveReason(""); },
      onError: (res) => {
        if ((res.kind === "warning" || res.kind === "blocking") && res.checks) {
          setPendingMove({ shift, date, checks: res.checks, blocking: res.kind === "blocking" });
          return true;
        }
        return false;
      },
    });
  }

  const dndProps = (date: string) => can.manage ? {
    onDragOver: (e: React.DragEvent) => { if (e.dataTransfer.types.includes("text/shift")) { e.preventDefault(); setDragOver(date); } },
    onDragLeave: () => setDragOver((d) => (d === date ? null : d)),
    onDrop: (e: React.DragEvent) => {
      e.preventDefault(); setDragOver(null);
      const id = e.dataTransfer.getData("text/shift");
      const s = shifts.find((x) => x.id === id);
      if (!s) return;
      if (s.status === "cancelado") return toast({ tone: "error", message: "Plantão cancelado não pode ser movido." });
      doMove(s, date);
    },
  } : {};
  const dragStart = (s: ShiftRow) => (e: React.DragEvent) => {
    e.dataTransfer.setData("text/shift", s.id);
    e.dataTransfer.effectAllowed = "move";
  };
  const canDrag = (s: ShiftRow) => can.manage && s.status !== "cancelado";

  const title =
    view === "dia" ? fmt(`${anchor}T12:00:00Z`, "EEEE, d 'de' MMMM 'de' yyyy", "UTC")
    : view === "mes" ? fmt(`${anchor}T12:00:00Z`, "MMMM 'de' yyyy", "UTC")
    : `${fmt(`${days[0]}T12:00:00Z`, "d MMM", "UTC")} a ${fmt(`${days[days.length - 1]}T12:00:00Z`, "d MMM yyyy", "UTC")}`;

  return (
    <div>
      {/* Cabeçalho e ferramentas */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <h1 className="mr-auto text-2xl first-letter:uppercase">{title}</h1>
        {can.publish && drafts.length > 0 && (
          <Button variant="navy" icon={<Send className="h-4 w-4" />} loading={pending}
            onClick={() => run(() => publishShifts(drafts.map((d) => d.id)))}>
            Publicar {drafts.length} {drafts.length === 1 ? "rascunho" : "rascunhos"}
          </Button>
        )}
        {can.manage && (
          <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => setCreatingOn(view === "dia" ? anchor : todayStr > days[0] && todayStr < days[days.length - 1] ? todayStr : days[0])}
            disabled={!units.some((u) => u.active)} title={units.some((u) => u.active) ? undefined : "Cadastre uma unidade ativa primeiro"}>
            Novo plantão
          </Button>
        )}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded border border-line bg-white p-0.5" role="group" aria-label="Visualização">
          {(["dia", "semana", "mes", "lista"] as CalendarView[]).map((v) => (
            <button key={v} onClick={() => nav({ v })} aria-pressed={view === v}
              className={cx("rounded-sm px-3 py-1.5 text-sm", view === v ? "bg-navy text-white" : "text-ink-soft hover:text-navy")}>
              {v === "dia" ? "Dia" : v === "semana" ? "Semana" : v === "mes" ? "Mês" : "Lista"}
            </button>
          ))}
        </div>
        <div className="inline-flex items-center gap-1">
          <Button size="sm" variant="ghost" aria-label="Período anterior" onClick={() => nav({ d: shiftView(view, anchor, -1) })}><ChevronLeft className="h-4 w-4" /></Button>
          <Button size="sm" onClick={() => nav({ d: todayStr })}>Hoje</Button>
          <Button size="sm" variant="ghost" aria-label="Próximo período" onClick={() => nav({ d: shiftView(view, anchor, 1) })}><ChevronRight className="h-4 w-4" /></Button>
          <input type="date" aria-label="Ir para data" className="input h-8 w-auto py-0 text-sm" value={anchor} onChange={(e) => e.target.value && nav({ d: e.target.value })} />
        </div>
        <Button size="sm" icon={<SlidersHorizontal className="h-4 w-4" />} onClick={() => setShowFilters((v) => !v)} aria-expanded={showFilters} className="ml-auto">
          Filtros{activeFilterCount ? ` (${activeFilterCount})` : ""}
        </Button>
      </div>

      {showFilters && (
        <div className="panel mb-4 grid gap-3 p-3 sm:grid-cols-2 lg:grid-cols-5">
          <FilterSelect label="Unidade" value={filters.unit} onChange={(v) => nav({ u: v, s: null })} options={units.map((u) => [u.id, u.name])} />
          <FilterSelect label="Serviço" value={filters.service} onChange={(v) => nav({ s: v })}
            options={services.filter((s) => !filters.unit || s.unit_id === filters.unit).map((s) => [s.id, s.name])} />
          <FilterSelect label="Categoria" value={filters.category} onChange={(v) => nav({ c: v })} options={Object.entries(CATEGORIES)} />
          <FilterSelect label="Situação" value={filters.status} onChange={(v) => nav({ st: v })} options={Object.entries(SHIFT_STATUS).map(([k, v]) => [k, v.label])} />
          <FilterSelect label="Profissional" value={filters.professional} onChange={(v) => nav({ p: v })} options={professionals.map((p) => [p.id, p.full_name])} />
          {activeFilterCount > 0 && (
            <button className="text-left text-sm text-teal hover:underline sm:col-span-2 lg:col-span-5" onClick={() => nav({ u: null, s: null, c: null, st: null, p: null })}>Limpar filtros</button>
          )}
        </div>
      )}

      <p className="mb-3 text-sm text-ink-soft" aria-live="polite">
        {summary.total} {summary.total === 1 ? "plantão" : "plantões"} no período
        {summary.open > 0 && <>, <span className="font-medium text-danger">{summary.open} {summary.open === 1 ? "descoberto" : "descobertos"}</span></>}
        {summary.waiting > 0 && <>, <span className="font-medium text-amber">{summary.waiting} com pendência</span></>}
        {can.manage && view !== "lista" && <span className="hidden text-ink-faint md:inline">. Arraste um plantão para outro dia para movê-lo.</span>}
      </p>

      <Legend />

      {/* Visualizações */}
      {view === "semana" && (
        <div className="grid gap-2 md:grid-cols-7">
          {days.map((d) => (
            <DayColumn key={d} date={d} isToday={d === todayStr} shifts={byDay.get(d) ?? []} tz={tz}
              highlighted={dragOver === d} dnd={dndProps(d)} onOpen={setOpenId} dragStart={dragStart} canDrag={canDrag}
              onCreate={can.manage ? () => setCreatingOn(d) : undefined} />
          ))}
        </div>
      )}

      {view === "dia" && (
        <DayColumn date={anchor} isToday={anchor === todayStr} shifts={byDay.get(anchor) ?? []} tz={tz} wide
          highlighted={false} dnd={{}} onOpen={setOpenId} dragStart={dragStart} canDrag={() => false}
          onCreate={can.manage ? () => setCreatingOn(anchor) : undefined} />
      )}

      {view === "mes" && (
        <div className="overflow-x-auto">
          <div className="grid min-w-[720px] grid-cols-7 border-l border-t border-line bg-white">
            {[1, 2, 3, 4, 5, 6, 0].map((d) => (
              <div key={d} className="border-b border-r border-line px-2 py-1.5 text-xs text-ink-soft">{WEEKDAYS_SHORT[d]}</div>
            ))}
            {days.map((d) => {
              const list = byDay.get(d) ?? [];
              const inMonth = d.slice(0, 7) === anchor.slice(0, 7);
              return (
                <div key={d} {...dndProps(d)}
                  className={cx("min-h-[112px] border-b border-r border-line p-1.5", !inMonth && "bg-canvas/70", dragOver === d && "bg-teal-50 ring-2 ring-inset ring-teal")}>
                  <div className="mb-1 flex items-center justify-between">
                    <button onClick={() => nav({ v: "dia", d })}
                      className={cx("rounded-sm px-1 text-xs tabular-nums hover:bg-navy-100", d === todayStr ? "bg-navy font-semibold text-white hover:bg-navy" : inMonth ? "text-ink" : "text-ink-faint")}
                      aria-label={`Abrir ${d}`}>
                      {Number(d.slice(8))}
                    </button>
                  </div>
                  <div className="space-y-1">
                    {list.slice(0, 4).map((s) => (
                      <ShiftCard key={s.id} shift={s} tz={tz} compact onOpen={() => setOpenId(s.id)} draggable={canDrag(s)} onDragStart={dragStart(s)} />
                    ))}
                    {list.length > 4 && (
                      <button className="text-xs text-teal hover:underline" onClick={() => nav({ v: "dia", d })}>+{list.length - 4} plantões</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {view === "lista" && (
        <div className="panel overflow-x-auto">
          {visible.length === 0 ? (
            <EmptyPeriod canManage={can.manage} onCreate={() => setCreatingOn(anchor)} />
          ) : (
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr>
                  <th className="table-head">Data</th><th className="table-head">Horário</th><th className="table-head">Local</th>
                  <th className="table-head">Categoria</th><th className="table-head">Escalados</th><th className="table-head">Situação</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((s) => {
                  const st = SHIFT_STATUS[s.status];
                  const act = s.assignments.filter((a) => isActiveAssignment(a.status));
                  return (
                    <tr key={s.id} className="cursor-pointer hover:bg-canvas" onClick={() => setOpenId(s.id)}>
                      <td className="table-cell whitespace-nowrap first-letter:uppercase">{fmt(s.starts_at, "EEE, dd/MM", tz)}</td>
                      <td className="table-cell whitespace-nowrap tabular-nums">
                        <button className="font-medium text-navy hover:underline" onClick={(e) => { e.stopPropagation(); setOpenId(s.id); }}>
                          {localTime(s.starts_at, tz)}–{localTime(s.ends_at, tz)}
                        </button>
                      </td>
                      <td className="table-cell">{s.unit?.name}{s.service ? <span className="text-ink-faint"> / {s.service.name}</span> : null}</td>
                      <td className="table-cell">{s.category ? CATEGORIES[s.category] : "Qualquer"}</td>
                      <td className="table-cell">
                        <div className="flex items-center gap-2"><SlotPips shift={s} />
                          <span className="truncate text-ink-soft">{act.map((a) => a.professional?.full_name?.split(" ")[0]).join(", ") || "—"}</span>
                        </div>
                      </td>
                      <td className="table-cell"><Badge tone={st.tone}>{st.label}</Badge></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {visible.length === 0 && view !== "lista" && (
        <div className="panel mt-4"><EmptyPeriod canManage={can.manage} onCreate={() => setCreatingOn(view === "dia" ? anchor : days[0])} filtered={activeFilterCount > 0} /></div>
      )}

      {/* Diálogos */}
      {opened && (
        <ShiftDetail
          key={opened.id + opened.status + opened.assignments.length}
          shift={opened} tz={tz} professionals={professionals} can={can}
          onClose={() => setOpenId(null)} onEdit={() => { setEditing(opened); setOpenId(null); }}
        />
      )}
      {(creatingOn || editing) && (
        <ShiftForm
          open institutionId={institutionId} tz={tz} units={units} services={services}
          shift={editing} defaultDate={creatingOn ?? undefined}
          onClose={() => { setCreatingOn(null); setEditing(null); }}
          onSaved={(id) => setOpenId(id)}
        />
      )}
      {pendingMove && (
        <Modal open onClose={() => { setPendingMove(null); setMoveReason(""); }}
          title={pendingMove.blocking ? "Não foi possível mover" : "Confirmar mudança de data"}
          description={`Mover plantão das ${localTime(pendingMove.shift.starts_at, tz)} para ${fmt(`${pendingMove.date}T12:00:00Z`, "EEEE, d 'de' MMMM", "UTC")}.`}
          footer={<>
            <Button onClick={() => { setPendingMove(null); setMoveReason(""); }}>{pendingMove.blocking ? "Fechar" : "Cancelar"}</Button>
            {!pendingMove.blocking && (
              <Button variant="primary" loading={pending} disabled={!moveReason.trim()}
                onClick={() => doMove(pendingMove.shift, pendingMove.date, moveReason.trim())}>Autorizar exceção e mover</Button>
            )}
          </>}>
          <OverridePrompt checks={pendingMove.checks} reason={moveReason} setReason={setMoveReason} blocking={pendingMove.blocking} />
        </Modal>
      )}
    </div>
  );
}

function DayColumn({
  date, isToday, shifts, tz, highlighted, dnd, onOpen, dragStart, canDrag, onCreate, wide,
}: {
  date: string; isToday: boolean; shifts: ShiftRow[]; tz: string; highlighted: boolean;
  dnd: Record<string, unknown>; onOpen: (id: string) => void; dragStart: (s: ShiftRow) => (e: React.DragEvent) => void;
  canDrag: (s: ShiftRow) => boolean; onCreate?: () => void; wide?: boolean;
}) {
  return (
    <section {...dnd} aria-label={fmt(`${date}T12:00:00Z`, "EEEE, d 'de' MMMM", "UTC")}
      className={cx("flex min-h-[180px] flex-col rounded-md border bg-white", isToday ? "border-teal" : "border-line", highlighted && "bg-teal-50 ring-2 ring-teal")}>
      <header className={cx("flex items-center justify-between border-b px-2.5 py-2", isToday ? "border-teal/40" : "border-line")}>
        <span className="text-sm">
          <span className="capitalize text-ink-soft">{fmt(`${date}T12:00:00Z`, "EEE", "UTC")}</span>{" "}
          <span className={cx("font-semibold tabular-nums", isToday ? "text-teal" : "text-navy")}>{fmt(`${date}T12:00:00Z`, "dd/MM", "UTC")}</span>
        </span>
        {onCreate && (
          <button onClick={onCreate} className="rounded p-1 text-ink-faint hover:bg-canvas hover:text-teal" aria-label={`Novo plantão em ${date}`}>
            <Plus className="h-4 w-4" />
          </button>
        )}
      </header>
      <div className={cx("flex-1 space-y-1.5 p-1.5", wide && "grid gap-2 space-y-0 sm:grid-cols-2 lg:grid-cols-3")}>
        {shifts.map((s) => (
          <ShiftCard key={s.id} shift={s} tz={tz} onOpen={() => onOpen(s.id)} draggable={canDrag(s)} onDragStart={dragStart(s)} />
        ))}
      </div>
    </section>
  );
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string | null) => void; options: [string, string][] }) {
  return (
    <label className="text-sm">
      <span className="label">{label}</span>
      <select className="input h-9 py-1" value={value} onChange={(e) => onChange(e.target.value || null)}>
        <option value="">Todos</option>
        {options.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
      </select>
    </label>
  );
}

function Legend() {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-soft" aria-label="Legenda das vagas">
      <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-teal" />Confirmado</span>
      <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber" />Aguardando</span>
      <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full border-[1.5px] border-danger" />Vaga aberta</span>
      <span className="inline-flex items-center gap-1.5"><span className="h-3 w-5 rounded-sm border border-dashed border-ink-faint" />Rascunho</span>
    </div>
  );
}

function EmptyPeriod({ canManage, onCreate, filtered }: { canManage: boolean; onCreate: () => void; filtered?: boolean }) {
  return (
    <div className="px-4 py-8">
      <p className="font-medium text-navy">{filtered ? "Nenhum plantão com estes filtros" : "Nenhum plantão neste período"}</p>
      <p className="mt-1 text-sm text-ink-soft">
        {filtered ? "Ajuste ou limpe os filtros para ver outros plantões." : canManage ? "Crie o primeiro plantão e use “Duplicar ou repetir” para montar a escala." : "Quando a gestão criar plantões, eles aparecem aqui."}
      </p>
      {canManage && !filtered && <Button variant="primary" size="sm" className="mt-3" icon={<Plus className="h-4 w-4" />} onClick={onCreate}>Novo plantão</Button>}
    </div>
  );
}

export type { ShiftStatus };
