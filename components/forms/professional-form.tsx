"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveProfessional } from "@/lib/actions/professionals";
import { CATEGORIES, COUNCIL_BY_CATEGORY, type Category } from "@/lib/labels";
import type { UnitRow } from "@/lib/queries";
import { Button, Field } from "@/components/ui/primitives";
import { useAction } from "@/components/ui/use-action";

export type ProfessionalFull = {
  id: string; full_name: string; email: string | null; phone: string | null; category: Category;
  council: string | null; council_number: string | null; council_uf: string | null;
  education: string | null; experience: string | null; region: string | null; notes: string | null;
  competencies: string[]; certifications: string[];
};

export function ProfessionalForm({
  institutionId, units, professional, unitIds = [], onDone,
}: { institutionId: string; units: UnitRow[]; professional?: ProfessionalFull; unitIds?: string[]; onDone?: () => void }) {
  const router = useRouter();
  const [category, setCategory] = useState<Category | "">(professional?.category ?? "");
  const [council, setCouncil] = useState(professional?.council ?? "");
  const [error, setError] = useState<string | null>(null);
  const { run, pending } = useAction();

  function submit(form: FormData) {
    setError(null);
    run(() => saveProfessional(institutionId, professional?.id ?? null, form), {
      onOk: (id) => { onDone?.(); if (!professional) router.push(`/profissionais/${id}`); },
      onError: (res) => { setError(res.message); return true; },
    });
  }

  return (
    <form action={submit} className="space-y-5">
      <input type="hidden" name="units_present" value="1" />
      <div className="grid gap-4 sm:grid-cols-6">
        <Field label="Nome completo" htmlFor="full_name" required className="sm:col-span-4">
          <input id="full_name" name="full_name" className="input" required minLength={3} maxLength={160} defaultValue={professional?.full_name} />
        </Field>
        <Field label="Categoria" htmlFor="category" required className="sm:col-span-2">
          <select id="category" name="category" className="input" required value={category}
            onChange={(e) => { const c = e.target.value as Category; setCategory(c); if (!council || Object.values(COUNCIL_BY_CATEGORY).includes(council)) setCouncil(COUNCIL_BY_CATEGORY[c] ?? ""); }}>
            <option value="" disabled>Selecione</option>
            {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </Field>
        <Field label="E-mail" htmlFor="email" hint="Usado para o convite de acesso." className="sm:col-span-3">
          <input id="email" name="email" type="email" className="input" defaultValue={professional?.email ?? ""} />
        </Field>
        <Field label="Telefone" htmlFor="phone" className="sm:col-span-3">
          <input id="phone" name="phone" type="tel" className="input" defaultValue={professional?.phone ?? ""} />
        </Field>
        <Field label="Conselho" htmlFor="council" className="sm:col-span-2">
          <input id="council" name="council" className="input uppercase" maxLength={20} value={council} onChange={(e) => setCouncil(e.target.value)} placeholder="COREN" />
        </Field>
        <Field label="Número do registro" htmlFor="council_number" className="sm:col-span-3">
          <input id="council_number" name="council_number" className="input" maxLength={30} defaultValue={professional?.council_number ?? ""} />
        </Field>
        <Field label="UF" htmlFor="council_uf" className="sm:col-span-1">
          <input id="council_uf" name="council_uf" className="input uppercase" maxLength={2} defaultValue={professional?.council_uf ?? ""} />
        </Field>
        <Field label="Competências" htmlFor="competencies" hint="Separe por vírgula. Usadas para validar plantões que exigem competências." className="sm:col-span-6">
          <input id="competencies" name="competencies" className="input" defaultValue={professional?.competencies.join(", ") ?? ""} placeholder="Sala de vacinação, Coleta, Curativos" />
        </Field>
        <Field label="Certificações" htmlFor="certifications" hint="Separe por vírgula." className="sm:col-span-6">
          <input id="certifications" name="certifications" className="input" defaultValue={professional?.certifications.join(", ") ?? ""} />
        </Field>
        <Field label="Formação" htmlFor="education" className="sm:col-span-3">
          <textarea id="education" name="education" className="input min-h-[64px]" maxLength={1000} defaultValue={professional?.education ?? ""} />
        </Field>
        <Field label="Experiência" htmlFor="experience" className="sm:col-span-3">
          <textarea id="experience" name="experience" className="input min-h-[64px]" maxLength={2000} defaultValue={professional?.experience ?? ""} />
        </Field>
        <Field label="Região de atuação" htmlFor="region" className="sm:col-span-3">
          <input id="region" name="region" className="input" maxLength={160} defaultValue={professional?.region ?? ""} />
        </Field>
        <Field label="Observações internas" htmlFor="notes" className="sm:col-span-3">
          <input id="notes" name="notes" className="input" maxLength={2000} defaultValue={professional?.notes ?? ""} />
        </Field>
      </div>
      {units.length > 1 && (
        <fieldset>
          <legend className="label">Unidades em que atua</legend>
          <p className="hint mb-2 mt-0">Sem seleção = qualquer unidade. Escalar fora das unidades marcadas gera um alerta.</p>
          <div className="flex flex-wrap gap-2">
            {units.filter((u) => u.active).map((u) => (
              <label key={u.id} className="flex items-center gap-2 rounded border border-line px-2.5 py-1.5 text-sm">
                <input type="checkbox" name="units" value={u.id} defaultChecked={unitIds.includes(u.id)} className="accent-teal" />{u.name}
              </label>
            ))}
          </div>
        </fieldset>
      )}
      {error && <p role="alert" className="rounded border border-danger-line bg-danger-bg px-3 py-2 text-sm text-danger">{error}</p>}
      <div className="flex justify-end gap-2">
        {onDone && <Button onClick={onDone}>Cancelar</Button>}
        <Button type="submit" variant="primary" loading={pending}>{professional ? "Salvar alterações" : "Cadastrar profissional"}</Button>
      </div>
    </form>
  );
}
