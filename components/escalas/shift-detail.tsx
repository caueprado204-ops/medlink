"use client";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Copy, Pencil, Send, XCircle, Search, AlertTriangle } from "lucide-react";
import type { ProfessionalLite, ShiftRow } from "@/lib/queries";
import { isActiveAssignment } from "@/lib/queries-shared";
import {
  assignProfessional, cancelShift, checkCandidates, duplicateShift, publishShifts, removeAssignment, shiftHistory,
  type HistoryEntry,
} from "@/lib/actions/shifts";
import { ASSIGNMENT_STATUS, AUDIT_ACTIONS, AUDIT_ENTITIES, CATEGORIES, SHIFT_STATUS, WEEKDAYS_SHORT } from "@/lib/labels";
import type { Checks } from "@/lib/errors";
import { addDays, fmt, formatHours, hoursBetween, localDate, localTime, weekday } from "@/lib/time";
import { Modal } from "@/components/ui/overlay";
import { Badge, Button, DemoBadge, cx } from "@/components/ui/primitives";
import { useAction } from "@/components/ui/use-action";
import { ChecksList, OverridePrompt } from "./checks";

type Panel = null | "duplicar" | "cancelar";

export function ShiftDetail({
  shift, tz, professionals, can, onClose, onEdit,
}: {
  shift: ShiftRow; tz: string; professionals: ProfessionalLite[];
  can: { manage: boolean; publish: boolean; audit: boolean };
  onClose: () => void; onEdit: () => void;
}) {
  const [tab, setTab] = useState<"detalhes" | "historico">("detalhes");
  const [panel, setPanel] = useState<Panel>(null);
  const status = SHIFT_STATUS[shift.status];
  const active = shift.assignments.filter((a) => isActiveAssignment(a.status));
  const past = shift.assignments.filter((a) => !isActiveAssignment(a.status));
  const cancelled = shift.status === "cancelado";
  const hours = hoursBetween(shift.starts_at, shift.ends_at, shift.break_minutes);
  const { run, pending } = useAction();

  return (
    <Modal
      open onClose={onClose} size="lg"
      title={`${fmt(shift.starts_at, "EEEE, d 'de' MMMM", tz)}`}
      description={`${localTime(shift.starts_at, tz)}–${localTime(shift.ends_at, tz)}${localDate(shift.ends_at, tz) !== localDate(shift.starts_at, tz) ? " (dia seguinte)" : ""}, ${shift.unit?.name ?? ""}${shift.service ? ` / ${shift.service.name}` : ""}`}
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Badge tone={status.tone}>{status.label}</Badge>
        {shift.is_demo && <DemoBadge />}
        <span className="text-sm text-ink-soft">{formatHours(hours)} de trabalho{shift.break_minutes ? `, ${shift.break_minutes} min de intervalo` : ""}</span>
      </div>

      {can.audit && (
        <div role="tablist" className="mb-4 flex gap-4 border-b border-line text-sm">
          {(["detalhes", "historico"] as const).map((t) => (
            <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
              className={cx("-mb-px border-b-2 px-0.5 pb-2", tab === t ? "border-teal font-medium text-navy" : "border-transparent text-ink-soft hover:text-navy")}>
              {t === "detalhes" ? "Detalhes" : "Histórico"}
            </button>
          ))}
        </div>
      )}

      {tab === "historico" ? <History shiftId={shift.id} tz={tz} /> : (
        <div className="space-y-5">
          <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            <div><dt className="text-ink-faint">Categoria</dt><dd>{shift.category ? CATEGORIES[shift.category] : "Qualquer categoria"}</dd></div>
            <div><dt className="text-ink-faint">Vagas</dt><dd>{active.length} de {shift.slots} preenchidas</dd></div>
            {shift.required_competencies.length > 0 && (
              <div className="sm:col-span-2"><dt className="text-ink-faint">Competências exigidas</dt><dd>{shift.required_competencies.join(", ")}</dd></div>
            )}
            {shift.notes && <div className="sm:col-span-2"><dt className="text-ink-faint">Observações</dt><dd className="whitespace-pre-line">{shift.notes}</dd></div>}
            {cancelled && shift.cancel_reason && <div className="sm:col-span-2"><dt className="text-ink-faint">Motivo do cancelamento</dt><dd>{shift.cancel_reason}</dd></div>}
          </dl>

          <section>
            <h3 className="mb-2 text-sm">Profissionais escalados</h3>
            {active.length === 0 ? (
              <p className="text-sm text-ink-soft">{cancelled ? "Nenhum." : "Nenhum profissional escalado ainda."}</p>
            ) : (
              <ul className="divide-y divide-line rounded border border-line">
                {active.map((a) => (
                  <AssignedRow key={a.id} a={a} canManage={can.manage && !cancelled} published={shift.status !== "rascunho"} />
                ))}
              </ul>
            )}
            {past.length > 0 && (
              <p className="mt-2 text-xs text-ink-faint">
                Saíram da escala: {past.map((a) => `${a.professional?.full_name ?? "Profissional"} (${ASSIGNMENT_STATUS[a.status].label.toLowerCase()})`).join(", ")}
              </p>
            )}
          </section>

          {can.manage && !cancelled && active.length < shift.slots && (
            <CandidatePicker shift={shift} professionals={professionals} />
          )}

          {can.manage && !cancelled && (
            <div className="flex flex-wrap gap-2 border-t border-line pt-4">
              <Button size="sm" icon={<Pencil className="h-4 w-4" />} onClick={onEdit}>Editar</Button>
              <Button size="sm" icon={<Copy className="h-4 w-4" />} onClick={() => setPanel(panel === "duplicar" ? null : "duplicar")} aria-expanded={panel === "duplicar"}>Duplicar ou repetir</Button>
              {shift.status === "rascunho" && can.publish && (
                <Button size="sm" variant="primary" icon={<Send className="h-4 w-4" />} loading={pending}
                  onClick={() => run(() => publishShifts([shift.id]))}>Publicar</Button>
              )}
              <Button size="sm" variant="danger" icon={<XCircle className="h-4 w-4" />} className="ml-auto" onClick={() => setPanel(panel === "cancelar" ? null : "cancelar")} aria-expanded={panel === "cancelar"}>Cancelar plantão</Button>
            </div>
          )}
          {panel === "duplicar" && <DuplicatePanel shift={shift} tz={tz} onDone={() => setPanel(null)} />}
          {panel === "cancelar" && <CancelPanel shift={shift} onDone={onClose} />}
        </div>
      )}
    </Modal>
  );
}

function AssignedRow({ a, canManage, published }: { a: ShiftRow["assignments"][number]; canManage: boolean; published: boolean }) {
  const [removing, setRemoving] = useState(false);
  const [reason, setReason] = useState("");
  const { run, pending } = useAction();
  const st = ASSIGNMENT_STATUS[a.status];
  return (
    <li className="px-3 py-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium">{a.professional?.full_name ?? "Profissional"}</span>
        {a.professional && <span className="text-xs text-ink-faint">{CATEGORIES[a.professional.category]}</span>}
        <Badge tone={st.tone}>{st.label}</Badge>
        {canManage && !removing && (
          <button className="ml-auto text-sm text-ink-soft underline-offset-2 hover:text-danger hover:underline" onClick={() => setRemoving(true)}>Remover</button>
        )}
      </div>
      {a.exception_reason && (
        <div className="mt-1.5 text-xs text-amber">
          <p className="flex items-center gap-1"><AlertTriangle className="h-3 w-3" aria-hidden /> Exceção autorizada: {a.exception_reason}</p>
          {a.warnings?.length > 0 && <p className="ml-4 text-ink-faint">{a.warnings.map((w) => w.message).join(" ")}</p>}
        </div>
      )}
      {removing && (
        <div className="mt-2 flex flex-wrap items-end gap-2">
          {published && (
            <input className="input h-9 flex-1 py-1" placeholder="Motivo (obrigatório em escala publicada)" value={reason}
              onChange={(e) => setReason(e.target.value)} aria-label="Motivo da remoção" />
          )}
          <Button size="sm" onClick={() => setRemoving(false)}>Voltar</Button>
          <Button size="sm" variant="danger" loading={pending} disabled={published && !reason.trim()}
            onClick={() => run(() => removeAssignment(a.id, reason.trim() || null), { onOk: () => setRemoving(false) })}>
            Remover do plantão
          </Button>
        </div>
      )}
    </li>
  );
}

function CandidatePicker({ shift, professionals }: { shift: ShiftRow; professionals: ProfessionalLite[] }) {
  const [q, setQ] = useState("");
  const [checks, setChecks] = useState<Record<string, Checks> | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const { run, pending } = useAction();

  const assignedIds = new Set(shift.assignments.filter((a) => isActiveAssignment(a.status)).map((a) => a.professional_id));
  const pool = useMemo(
    () => professionals.filter((p) => p.active && !assignedIds.has(p.id) && (!shift.category || p.category === shift.category)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [professionals, shift.id, shift.category, shift.assignments.length],
  );
  const poolKey = pool.map((p) => p.id).join(",");

  useEffect(() => {
    let alive = true;
    setChecks(null); setLoadError(null);
    if (!pool.length) return;
    checkCandidates(shift.id, pool.map((p) => p.id))
      .then((res) => { if (alive) res.ok ? setChecks(res.data) : setLoadError(res.message); })
      .catch(() => alive && setLoadError("Sem conexão com o servidor."));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shift.id, poolKey]);

  const ranked = pool
    .filter((p) => p.full_name.toLowerCase().includes(q.trim().toLowerCase()))
    .map((p) => ({ p, c: checks?.[p.id] }))
    .sort((a, b) => score(a.c) - score(b.c) || a.p.full_name.localeCompare(b.p.full_name, "pt-BR"));

  const sel = selected ? checks?.[selected] : undefined;

  return (
    <section className="rounded-md border border-line">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-3 py-2.5">
        <h3 className="text-sm">Escalar profissional</h3>
        <label className="relative">
          <span className="sr-only">Buscar profissional</span>
          <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" aria-hidden />
          <input className="input h-8 w-52 py-1 pl-7 text-sm" placeholder="Buscar" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
      </div>
      {!pool.length ? (
        <p className="px-3 py-4 text-sm text-ink-soft">
          Nenhum profissional ativo {shift.category ? `da categoria ${CATEGORIES[shift.category]}` : ""} disponível para escalar. Cadastre em Profissionais.
        </p>
      ) : loadError ? (
        <p className="px-3 py-4 text-sm text-danger">{loadError}</p>
      ) : (
        <ul className="max-h-72 divide-y divide-line overflow-y-auto" aria-busy={!checks}>
          {ranked.map(({ p, c }) => {
            const blocked = !!c?.blocking.length;
            const isSel = selected === p.id;
            return (
              <li key={p.id} className={cx("px-3 py-2", isSel && "bg-canvas")}>
                <div className="flex items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{p.full_name}{p.is_demo && !p.full_name.includes("(demo)") && <span className="ml-1.5 text-xs font-normal text-[#075985]">demo</span>}</p>
                    <p className="text-xs text-ink-faint">{CATEGORIES[p.category]}</p>
                  </div>
                  {!c ? <span className="text-xs text-ink-faint">verificando…</span>
                    : blocked ? <span className="text-xs text-danger">Indisponível</span>
                    : c.warnings.length ? <span className="text-xs text-amber">{c.warnings.length} {c.warnings.length === 1 ? "alerta" : "alertas"}</span>
                    : <span className="inline-flex items-center gap-1 text-xs text-teal"><CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> Sem restrições</span>}
                  <Button size="sm" variant={isSel ? "navy" : "secondary"} disabled={!c || blocked}
                    onClick={() => { setSelected(isSel ? null : p.id); setReason(""); }}>
                    {isSel ? "Selecionado" : "Selecionar"}
                  </Button>
                </div>
                {c && (blocked || isSel) && <ChecksList checks={c} compact />}
              </li>
            );
          })}
          {!ranked.length && <li className="px-3 py-4 text-sm text-ink-soft">Nenhum nome encontrado.</li>}
        </ul>
      )}
      {selected && sel && (
        <div className="space-y-3 border-t border-line px-3 py-3">
          {sel.warnings.length > 0 && <OverridePrompt checks={{ blocking: [], warnings: sel.warnings }} reason={reason} setReason={setReason} />}
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="accent-teal" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
            Presença já combinada com o profissional (registrar como confirmado)
          </label>
          <div className="flex justify-end">
            <Button variant="primary" size="sm" loading={pending} disabled={sel.warnings.length > 0 && !reason.trim()}
              onClick={() => run(() => assignProfessional(shift.id, selected, reason.trim() || null, confirmed), { onOk: () => { setSelected(null); setReason(""); } })}>
              {sel.warnings.length ? "Autorizar exceção e escalar" : "Escalar"}
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}

function score(c?: Checks) {
  if (!c) return 1;
  if (c.blocking.length) return 3;
  return c.warnings.length ? 2 : 0;
}

function DuplicatePanel({ shift, tz, onDone }: { shift: ShiftRow; tz: string; onDone: () => void }) {
  const base = localDate(shift.starts_at, tz);
  const [from, setFrom] = useState(addDays(base, 1));
  const [to, setTo] = useState(addDays(base, 7));
  const [days, setDays] = useState<number[]>([weekday(base)]);
  const { run, pending } = useAction();
  const dates = useMemo(() => {
    const out: string[] = [];
    if (!from || !to || to < from) return out;
    for (let d = from; d <= to && out.length < 121; d = addDays(d, 1)) if (days.includes(weekday(d)) && d !== base) out.push(d);
    return out;
  }, [from, to, days, base]);

  return (
    <div className="rounded-md border border-line bg-canvas/60 p-3">
      <p className="mb-3 text-sm text-ink-soft">Cria cópias em rascunho, no mesmo horário, sem profissionais escalados.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm"><span className="label">De</span><input type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
        <label className="text-sm"><span className="label">Até</span><input type="date" className="input" value={to} onChange={(e) => setTo(e.target.value)} /></label>
      </div>
      <fieldset className="mt-3">
        <legend className="label">Dias da semana</legend>
        <div className="flex flex-wrap gap-1.5">
          {[1, 2, 3, 4, 5, 6, 0].map((d) => (
            <label key={d} className={cx("cursor-pointer rounded border px-2.5 py-1 text-sm", days.includes(d) ? "border-teal bg-teal-50 text-teal-700" : "border-line bg-white")}>
              <input type="checkbox" className="sr-only" checked={days.includes(d)} onChange={(e) => setDays(e.target.checked ? [...days, d] : days.filter((x) => x !== d))} />
              {WEEKDAYS_SHORT[d]}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="mt-3 flex items-center justify-between gap-2">
        <span className={cx("text-sm", dates.length > 120 ? "text-danger" : "text-ink-soft")}>
          {dates.length > 120 ? "Máximo de 120 cópias por vez." : `${dates.length} ${dates.length === 1 ? "cópia" : "cópias"}`}
        </span>
        <Button size="sm" variant="primary" loading={pending} disabled={!dates.length || dates.length > 120}
          onClick={() => run(() => duplicateShift(shift.id, dates), { onOk: onDone })}>Criar cópias</Button>
      </div>
    </div>
  );
}

function CancelPanel({ shift, onDone }: { shift: ShiftRow; onDone: () => void }) {
  const [reason, setReason] = useState("");
  const { run, pending } = useAction();
  const n = shift.assignments.filter((a) => isActiveAssignment(a.status)).length;
  return (
    <div className="rounded-md border border-danger-line bg-danger-bg/40 p-3">
      <p className="text-sm">
        O plantão fica no histórico como cancelado{n ? ` e ${n === 1 ? "o profissional escalado é liberado e avisado" : `os ${n} profissionais escalados são liberados e avisados`}` : ""}. Esta ação não pode ser desfeita.
      </p>
      <label className="mt-3 block"><span className="label">Motivo do cancelamento</span>
        <textarea className="input min-h-[60px]" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} />
      </label>
      <div className="mt-3 flex justify-end">
        <Button variant="danger" size="sm" loading={pending} disabled={!reason.trim()}
          onClick={() => run(() => cancelShift(shift.id, reason.trim()), { onOk: onDone })}>Confirmar cancelamento</Button>
      </div>
    </div>
  );
}

function History({ shiftId, tz }: { shiftId: string; tz: string }) {
  const [items, setItems] = useState<HistoryEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    shiftHistory(shiftId).then((r) => (r.ok ? setItems(r.data) : setError(r.message))).catch(() => setError("Sem conexão com o servidor."));
  }, [shiftId]);
  if (error) return <p className="text-sm text-danger">{error}</p>;
  if (!items) return <p className="text-sm text-ink-faint">Carregando histórico…</p>;
  if (!items.length) return <p className="text-sm text-ink-soft">Nenhum registro.</p>;
  return (
    <ol className="space-y-3">
      {items.map((h) => (
        <li key={h.id} className="border-l-2 border-line pl-3">
          <p className="text-sm">
            <span className="font-medium">{h.actor}</span>{" "}
            <span className="text-ink-soft">{(AUDIT_ACTIONS[h.action] ?? h.action).toLowerCase()}</span>
            {h.entity !== "shifts" && <span className="text-ink-faint"> ({AUDIT_ENTITIES[h.entity] ?? h.entity})</span>}
          </p>
          <p className="text-xs text-ink-faint">{fmt(h.created_at, "dd/MM/yyyy HH:mm", tz)}{h.reason ? `. Motivo: ${h.reason}` : ""}</p>
        </li>
      ))}
    </ol>
  );
}
