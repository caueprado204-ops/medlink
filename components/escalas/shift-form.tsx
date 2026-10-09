"use client";
import { useMemo, useState } from "react";
import type { ShiftRow, ServiceRow, UnitRow } from "@/lib/queries";
import { saveShift } from "@/lib/actions/shifts";
import { CATEGORIES } from "@/lib/labels";
import type { Checks } from "@/lib/errors";
import { localDate, localTime } from "@/lib/time";
import { Modal } from "@/components/ui/overlay";
import { Button, Field } from "@/components/ui/primitives";
import { useAction } from "@/components/ui/use-action";
import { OverridePrompt } from "./checks";

export function ShiftForm({
  open, onClose, institutionId, tz, units, services, shift, defaultDate, onSaved,
}: {
  open: boolean; onClose: () => void; institutionId: string; tz: string;
  units: UnitRow[]; services: ServiceRow[]; shift?: ShiftRow | null; defaultDate?: string;
  onSaved?: (id: string) => void;
}) {
  const activeUnits = units.filter((u) => u.active || u.id === shift?.unit_id);
  const [unitId, setUnitId] = useState(shift?.unit_id ?? activeUnits[0]?.id ?? "");
  const [checks, setChecks] = useState<Checks | null>(null);
  const [blocking, setBlocking] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { run, pending } = useAction();
  const unitServices = useMemo(() => services.filter((s) => s.unit_id === unitId && (s.active || s.id === shift?.service_id)), [services, unitId, shift]);

  function submit(form: FormData) {
    setError(null);
    run(() => saveShift({
      id: shift?.id ?? null,
      institution_id: institutionId,
      unit_id: String(form.get("unit_id") || ""),
      service_id: String(form.get("service_id") || "") || null,
      date: String(form.get("date") || ""),
      start: String(form.get("start") || ""),
      end: String(form.get("end") || ""),
      break_minutes: Number(form.get("break_minutes") || 0),
      category: String(form.get("category") || "") || null,
      slots: Number(form.get("slots") || 1),
      required_competencies: String(form.get("competencies") || "").split(",").map((s) => s.trim()).filter(Boolean),
      notes: String(form.get("notes") || "") || null,
      override_reason: reason.trim() || null,
      tz,
    }), {
      onOk: (id) => { onSaved?.(id); onClose(); },
      onError: (res) => {
        if ((res.kind === "warning" || res.kind === "blocking") && res.checks) {
          setChecks(res.checks); setBlocking(res.kind === "blocking"); return true;
        }
        setError(res.message); return true;
      },
    });
  }

  const start = shift ? localTime(shift.starts_at, tz) : "07:00";
  const end = shift ? localTime(shift.ends_at, tz) : "13:00";

  return (
    <Modal
      open={open} onClose={onClose} size="lg"
      title={shift ? "Editar plantão" : "Novo plantão"}
      description={shift ? "Ao mudar horário, unidade ou categoria, os profissionais escalados são revalidados." : "O plantão é criado como rascunho. Publique quando a escala estiver pronta."}
      footer={
        <>
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="submit" form="shift-form" variant="primary" loading={pending} disabled={blocking}>
            {checks && !blocking ? "Autorizar exceção e salvar" : shift ? "Salvar alterações" : "Criar plantão"}
          </Button>
        </>
      }
    >
      <form id="shift-form" action={submit} className="grid gap-4 sm:grid-cols-6" onChange={() => { if (blocking) { setBlocking(false); setChecks(null); } }}>
        <Field label="Unidade" htmlFor="unit_id" required className="sm:col-span-3">
          <select id="unit_id" name="unit_id" className="input" value={unitId} onChange={(e) => setUnitId(e.target.value)} required>
            {activeUnits.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </Field>
        <Field label="Serviço ou setor" htmlFor="service_id" className="sm:col-span-3" hint={unitServices.length ? undefined : "Cadastre serviços em Unidades."}>
          <select id="service_id" name="service_id" className="input" defaultValue={shift?.service_id ?? ""} key={unitId}>
            <option value="">Sem serviço específico</option>
            {unitServices.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </Field>
        <Field label="Data" htmlFor="date" required className="sm:col-span-2">
          <input id="date" name="date" type="date" className="input" required defaultValue={shift ? localDate(shift.starts_at, tz) : defaultDate} />
        </Field>
        <Field label="Início" htmlFor="start" required className="sm:col-span-1">
          <input id="start" name="start" type="time" className="input" required defaultValue={start} />
        </Field>
        <Field label="Término" htmlFor="end" required className="sm:col-span-1" hint="Antes do início = dia seguinte">
          <input id="end" name="end" type="time" className="input" required defaultValue={end} />
        </Field>
        <Field label="Intervalo (min)" htmlFor="break_minutes" className="sm:col-span-2">
          <input id="break_minutes" name="break_minutes" type="number" min={0} max={240} step={5} className="input" defaultValue={shift?.break_minutes ?? 0} />
        </Field>
        <Field label="Categoria profissional" htmlFor="category" className="sm:col-span-4">
          <select id="category" name="category" className="input" defaultValue={shift?.category ?? ""}>
            <option value="">Qualquer categoria</option>
            {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </Field>
        <Field label="Vagas" htmlFor="slots" required className="sm:col-span-2">
          <input id="slots" name="slots" type="number" min={1} max={50} className="input" required defaultValue={shift?.slots ?? 1} />
        </Field>
        <Field label="Competências exigidas" htmlFor="competencies" hint="Separe por vírgula. Ex.: Sala de vacinação, Coleta" className="sm:col-span-6">
          <input id="competencies" name="competencies" className="input" defaultValue={shift?.required_competencies.join(", ") ?? ""} />
        </Field>
        <Field label="Observações" htmlFor="notes" className="sm:col-span-6">
          <textarea id="notes" name="notes" className="input min-h-[72px]" maxLength={2000} defaultValue={shift?.notes ?? ""} />
        </Field>
        {checks && (
          <div className="sm:col-span-6">
            <OverridePrompt checks={checks} reason={reason} setReason={setReason} blocking={blocking} />
          </div>
        )}
        {error && <p role="alert" className="rounded border border-danger-line bg-danger-bg px-3 py-2 text-sm text-danger sm:col-span-6">{error}</p>}
      </form>
    </Modal>
  );
}
