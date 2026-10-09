"use client";
import { useState } from "react";
import { Plus } from "lucide-react";
import type { ServiceRow, UnitRow } from "@/lib/queries";
import { saveService, saveUnit, setServiceActive, setUnitActive } from "@/lib/actions/org";
import { Badge, Button, Field, cx } from "@/components/ui/primitives";
import { Modal } from "@/components/ui/overlay";
import { useAction } from "@/components/ui/use-action";

export function UnitsManager({ institutionId, units, services }: { institutionId: string; units: UnitRow[]; services: ServiceRow[] }) {
  const [editing, setEditing] = useState<UnitRow | "new" | null>(null);
  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => setEditing("new")}>Nova unidade</Button>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {units.map((u) => (
          <UnitCard key={u.id} unit={u} services={services.filter((s) => s.unit_id === u.id)} institutionId={institutionId} onEdit={() => setEditing(u)} />
        ))}
      </div>
      {editing && <UnitForm institutionId={institutionId} unit={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
    </>
  );
}

function UnitCard({ unit, services, institutionId, onEdit }: { unit: UnitRow; services: ServiceRow[]; institutionId: string; onEdit: () => void }) {
  const [name, setName] = useState("");
  const { run, pending } = useAction();
  return (
    <section className={cx("panel", !unit.active && "opacity-70")}>
      <div className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
        <div>
          <h2 className="text-base">{unit.name} {!unit.active && <Badge className="ml-1">Inativa</Badge>}</h2>
          <p className="text-sm text-ink-soft">{[unit.address, unit.city && `${unit.city}${unit.uf ? `/${unit.uf}` : ""}`, unit.phone].filter(Boolean).join(", ") || "Endereço não informado"}</p>
        </div>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={onEdit}>Editar</Button>
          <Button size="sm" variant="ghost" loading={pending} onClick={() => run(() => setUnitActive(unit.id, !unit.active))}>{unit.active ? "Desativar" : "Reativar"}</Button>
        </div>
      </div>
      <div className="px-4 py-3">
        <p className="mb-2 text-sm font-medium">Serviços e setores</p>
        {services.length === 0 ? <p className="text-sm text-ink-faint">Nenhum serviço cadastrado.</p> : (
          <ul className="mb-3 flex flex-wrap gap-1.5">
            {services.map((s) => (
              <li key={s.id} className={cx("inline-flex items-center gap-1.5 rounded border border-line px-2 py-1 text-sm", !s.active && "text-ink-faint line-through")}>
                {s.name}
                <button className="text-xs text-ink-faint hover:text-navy" onClick={() => run(() => setServiceActive(s.id, !s.active))} aria-label={s.active ? `Desativar ${s.name}` : `Reativar ${s.name}`}>
                  {s.active ? "desativar" : "reativar"}
                </button>
              </li>
            ))}
          </ul>
        )}
        {unit.active && (
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); run(() => saveService(institutionId, unit.id, name), { onOk: () => setName("") }); }}>
            <input className="input h-9 py-1" placeholder="Novo serviço (ex.: Sala de vacinação)" value={name} onChange={(e) => setName(e.target.value)} aria-label="Nome do serviço" maxLength={120} />
            <Button type="submit" size="sm" loading={pending} disabled={name.trim().length < 2}>Adicionar</Button>
          </form>
        )}
      </div>
    </section>
  );
}

function UnitForm({ institutionId, unit, onClose }: { institutionId: string; unit: UnitRow | null; onClose: () => void }) {
  const { run, pending } = useAction();
  const [error, setError] = useState<string | null>(null);
  return (
    <Modal open onClose={onClose} title={unit ? "Editar unidade" : "Nova unidade"}
      footer={<><Button onClick={onClose}>Cancelar</Button><Button type="submit" form="unit-form" variant="primary" loading={pending}>{unit ? "Salvar" : "Criar unidade"}</Button></>}>
      <form id="unit-form" className="grid gap-4 sm:grid-cols-4"
        action={(f) => run(() => saveUnit(institutionId, unit?.id ?? null, f), { onOk: onClose, onError: (r) => { setError(r.message); return true; } })}>
        <Field label="Nome" htmlFor="u-name" required className="sm:col-span-4"><input id="u-name" name="name" className="input" required defaultValue={unit?.name} maxLength={120} /></Field>
        <Field label="Endereço" htmlFor="u-addr" className="sm:col-span-4"><input id="u-addr" name="address" className="input" defaultValue={unit?.address ?? ""} maxLength={240} /></Field>
        <Field label="Cidade" htmlFor="u-city" className="sm:col-span-2"><input id="u-city" name="city" className="input" defaultValue={unit?.city ?? ""} /></Field>
        <Field label="UF" htmlFor="u-uf"><input id="u-uf" name="uf" className="input uppercase" maxLength={2} defaultValue={unit?.uf ?? ""} /></Field>
        <Field label="Telefone" htmlFor="u-phone"><input id="u-phone" name="phone" className="input" defaultValue={unit?.phone ?? ""} /></Field>
        {error && <p role="alert" className="text-sm text-danger sm:col-span-4">{error}</p>}
      </form>
    </Modal>
  );
}
