"use client";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { addAbsence, removeAbsence, saveAvailability } from "@/lib/actions/me";
import { ABSENCE_KIND, WEEKDAYS, type AbsenceKind } from "@/lib/labels";
import { fmt } from "@/lib/time";
import { Button, cx } from "@/components/ui/primitives";
import { useAction } from "@/components/ui/use-action";

export type Slot = { weekday: number; start_time: string; end_time: string };
export type Prefs = { preferred_turns: string[]; max_weekly_hours: number | null; notes: string | null };
export type Absence = { id: string; kind: AbsenceKind; starts_on: string; ends_on: string; note: string | null };

const TURNS: [string, string][] = [
  ["manha", "Manhã"], ["tarde", "Tarde"], ["noite", "Noite"], ["diurno_12h", "Diurno 12h"], ["noturno_12h", "Noturno 12h"],
];

export function AvailabilityEditor({
  slots: initial, prefs: initialPrefs, professionalId, readOnly,
}: { slots: Slot[]; prefs: Prefs; professionalId?: string; readOnly?: boolean }) {
  const [slots, setSlots] = useState<Slot[]>(initial.map((s) => ({ ...s, start_time: s.start_time.slice(0, 5), end_time: s.end_time.slice(0, 5) })));
  const [prefs, setPrefs] = useState<Prefs>(initialPrefs);
  const [dirty, setDirty] = useState(false);
  const { run, pending } = useAction();
  const order = [1, 2, 3, 4, 5, 6, 0];

  function update(fn: (s: Slot[]) => Slot[]) { setSlots(fn); setDirty(true); }

  return (
    <div className="space-y-5">
      <p className="text-sm text-ink-soft">
        Informe quando pode trabalhar. Disponibilidade não é escala: alterar aqui não muda plantões já publicados ou confirmados.
      </p>
      <div className="divide-y divide-line rounded border border-line">
        {order.map((wd) => {
          const daySlots = slots.map((s, i) => ({ s, i })).filter((x) => x.s.weekday === wd);
          return (
            <div key={wd} className="flex flex-wrap items-center gap-2 px-3 py-2.5">
              <span className="w-20 text-sm font-medium">{WEEKDAYS[wd]}</span>
              {daySlots.length === 0 && <span className="text-sm text-ink-faint">Indisponível</span>}
              {daySlots.map(({ s, i }) => (
                <span key={i} className="inline-flex items-center gap-1 rounded border border-line bg-canvas px-1.5 py-1">
                  <input type="time" aria-label={`Início ${WEEKDAYS[wd]}`} className="w-[5.5rem] bg-transparent text-sm tabular-nums" value={s.start_time} disabled={readOnly}
                    onChange={(e) => update((xs) => xs.map((x, j) => (j === i ? { ...x, start_time: e.target.value } : x)))} />
                  <span className="text-ink-faint">às</span>
                  <input type="time" aria-label={`Término ${WEEKDAYS[wd]}`} className="w-[5.5rem] bg-transparent text-sm tabular-nums" value={s.end_time} disabled={readOnly}
                    onChange={(e) => update((xs) => xs.map((x, j) => (j === i ? { ...x, end_time: e.target.value } : x)))} />
                  {!readOnly && (
                    <button className="p-0.5 text-ink-faint hover:text-danger" aria-label="Remover faixa" onClick={() => update((xs) => xs.filter((_, j) => j !== i))}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </span>
              ))}
              {!readOnly && (
                <button className="ml-auto inline-flex items-center gap-1 text-sm text-teal hover:underline"
                  onClick={() => update((xs) => [...xs, { weekday: wd, start_time: "07:00", end_time: "19:00" }])}>
                  <Plus className="h-3.5 w-3.5" /> Faixa
                </button>
              )}
            </div>
          );
        })}
      </div>

      <fieldset>
        <legend className="label">Turnos preferidos</legend>
        <div className="flex flex-wrap gap-1.5">
          {TURNS.map(([k, v]) => {
            const on = prefs.preferred_turns.includes(k);
            return (
              <label key={k} className={cx("rounded border px-2.5 py-1 text-sm", on ? "border-teal bg-teal-50 text-teal-700" : "border-line bg-white", readOnly ? "" : "cursor-pointer")}>
                <input type="checkbox" className="sr-only" checked={on} disabled={readOnly}
                  onChange={(e) => { setPrefs({ ...prefs, preferred_turns: e.target.checked ? [...prefs.preferred_turns, k] : prefs.preferred_turns.filter((x) => x !== k) }); setDirty(true); }} />
                {v}
              </label>
            );
          })}
        </div>
        <p className="hint">Preferência é considerada na distribuição, mas não impede escalas.</p>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
        <label><span className="label">Carga semanal máxima (h)</span>
          <input type="number" className="input" min={1} max={168} disabled={readOnly} value={prefs.max_weekly_hours ?? ""}
            onChange={(e) => { setPrefs({ ...prefs, max_weekly_hours: e.target.value ? Number(e.target.value) : null }); setDirty(true); }} />
        </label>
        <label><span className="label">Observações</span>
          <input className="input" maxLength={500} disabled={readOnly} value={prefs.notes ?? ""}
            onChange={(e) => { setPrefs({ ...prefs, notes: e.target.value || null }); setDirty(true); }} />
        </label>
      </div>

      {!readOnly && (
        <div className="flex items-center justify-end gap-3">
          {dirty && <span className="text-sm text-ink-faint">Alterações não salvas</span>}
          <Button variant="primary" loading={pending} disabled={!dirty}
            onClick={() => run(() => saveAvailability(slots, prefs, professionalId), { onOk: () => setDirty(false) })}>
            Salvar disponibilidade
          </Button>
        </div>
      )}
    </div>
  );
}

export function AbsenceManager({ absences, professionalId, readOnly, tz }: { absences: Absence[]; professionalId?: string; readOnly?: boolean; tz: string }) {
  const [kind, setKind] = useState<AbsenceKind>("ferias");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [note, setNote] = useState("");
  const { run, pending } = useAction();
  return (
    <div className="space-y-4">
      {absences.length === 0 ? (
        <p className="text-sm text-ink-soft">Nenhum período de férias, afastamento ou indisponibilidade registrado.</p>
      ) : (
        <ul className="divide-y divide-line rounded border border-line">
          {absences.map((a) => (
            <li key={a.id} className="flex items-center gap-3 px-3 py-2.5 text-sm">
              <span className="w-28 font-medium">{ABSENCE_KIND[a.kind]}</span>
              <span className="tabular-nums">{fmt(`${a.starts_on}T12:00:00Z`, "dd/MM/yyyy", "UTC")} a {fmt(`${a.ends_on}T12:00:00Z`, "dd/MM/yyyy", "UTC")}</span>
              {a.note && <span className="truncate text-ink-faint">{a.note}</span>}
              {!readOnly && (
                <button className="ml-auto p-1 text-ink-faint hover:text-danger" aria-label="Remover período" disabled={pending}
                  onClick={() => run(() => removeAbsence(a.id))}><Trash2 className="h-4 w-4" /></button>
              )}
            </li>
          ))}
        </ul>
      )}
      {!readOnly && (
        <div className="grid gap-3 rounded border border-line bg-canvas/50 p-3 sm:grid-cols-3 sm:items-end">
          <label><span className="label">Tipo</span>
            <select className="input" value={kind} onChange={(e) => setKind(e.target.value as AbsenceKind)}>
              {Object.entries(ABSENCE_KIND).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          <label><span className="label">De</span><input type="date" className="input" value={from} onChange={(e) => { setFrom(e.target.value); if (!to) setTo(e.target.value); }} /></label>
          <label><span className="label">Até</span><input type="date" className="input" value={to} min={from} onChange={(e) => setTo(e.target.value)} /></label>
          <label className="sm:col-span-2"><span className="label">Observação</span><input className="input" value={note} maxLength={300} onChange={(e) => setNote(e.target.value)} /></label>
          <Button variant="primary" loading={pending} disabled={!from || !to}
            onClick={() => run(() => addAbsence(kind, from, to, note.trim() || null, professionalId), { onOk: () => { setFrom(""); setTo(""); setNote(""); } })}>
            Registrar
          </Button>
        </div>
      )}
      <p className="hint">Férias, licenças e afastamentos impedem novas escalas no período. “Indisponível” gera apenas um alerta para a gestão. {tz !== "America/Sao_Paulo" ? `Fuso: ${tz}.` : ""}</p>
    </div>
  );
}
