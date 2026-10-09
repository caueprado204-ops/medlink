"use client";
import { useState } from "react";
import { updateInstitution } from "@/lib/actions/institution";
import { INSTITUTION_TYPES, MODULES, type InstitutionType } from "@/lib/labels";
import { formatCnpj, isValidCnpj } from "@/lib/cnpj";
import { Button, Field, SectionTitle } from "@/components/ui/primitives";
import { useAction } from "@/components/ui/use-action";

export type InstitutionFull = {
  id: string; name: string; legal_name: string | null; cnpj: string | null; type: InstitutionType; modules: string[];
  settings: { min_rest_hours?: number; max_weekly_hours?: number; max_shift_hours?: number; timezone?: string };
  phone: string | null; email: string | null;
};

export function InstitutionSettings({ inst }: { inst: InstitutionFull }) {
  const [cnpj, setCnpj] = useState(inst.cnpj ? formatCnpj(inst.cnpj) : "");
  const [error, setError] = useState<string | null>(null);
  const { run, pending } = useAction();
  const cnpjError = cnpj.replace(/\D/g, "").length === 14 && !isValidCnpj(cnpj) ? "CNPJ inválido." : undefined;

  return (
    <form className="space-y-6" action={(f) => { setError(null); run(() => updateInstitution(inst.id, f), { onError: (r) => { setError(r.message); return false; } }); }}>
      <section className="panel">
        <SectionTitle>Dados da instituição</SectionTitle>
        <div className="grid gap-4 p-4 sm:grid-cols-2">
          <Field label="Nome" htmlFor="name" required><input id="name" name="name" className="input" required defaultValue={inst.name} /></Field>
          <Field label="Tipo" htmlFor="type" hint="Definido no cadastro."><input id="type" className="input" disabled value={INSTITUTION_TYPES[inst.type]} /></Field>
          <Field label="Razão social" htmlFor="legal_name"><input id="legal_name" name="legal_name" className="input" defaultValue={inst.legal_name ?? ""} /></Field>
          <Field label="CNPJ" htmlFor="cnpj" error={cnpjError}><input id="cnpj" name="cnpj" className="input" value={cnpj} onChange={(e) => setCnpj(formatCnpj(e.target.value))} aria-invalid={!!cnpjError} /></Field>
          <Field label="Telefone" htmlFor="phone"><input id="phone" name="phone" className="input" defaultValue={inst.phone ?? ""} /></Field>
          <Field label="E-mail" htmlFor="email"><input id="email" name="email" type="email" className="input" defaultValue={inst.email ?? ""} /></Field>
        </div>
      </section>

      <section className="panel">
        <SectionTitle>Regras de escala</SectionTitle>
        <div className="grid gap-4 p-4 sm:grid-cols-3">
          <Field label="Descanso mínimo entre plantões (h)" htmlFor="min_rest_hours" hint="Abaixo disso, a escala gera alerta e exige justificativa.">
            <input id="min_rest_hours" name="min_rest_hours" type="number" min={0} max={48} className="input" defaultValue={inst.settings.min_rest_hours ?? 11} />
          </Field>
          <Field label="Carga semanal de referência (h)" htmlFor="max_weekly_hours" hint="O profissional pode informar um limite menor.">
            <input id="max_weekly_hours" name="max_weekly_hours" type="number" min={1} max={168} className="input" defaultValue={inst.settings.max_weekly_hours ?? 44} />
          </Field>
          <Field label="Duração máxima de um plantão (h)" htmlFor="max_shift_hours" hint="Restrição obrigatória.">
            <input id="max_shift_hours" name="max_shift_hours" type="number" min={1} max={36} className="input" defaultValue={inst.settings.max_shift_hours ?? 24} />
          </Field>
        </div>
        <p className="px-4 pb-4 text-xs text-ink-faint">
          Os valores padrão são pontos de partida configuráveis, não um parecer jurídico. Confirme as regras de jornada aplicáveis aos seus contratos e acordos coletivos.
        </p>
      </section>

      <section className="panel">
        <SectionTitle>Módulos</SectionTitle>
        <div className="grid gap-2 p-4 sm:grid-cols-2">
          {MODULES.map((m) => (
            <label key={m.id} className={`flex items-start gap-2.5 rounded border border-line px-3 py-2.5 ${m.available ? "" : "opacity-60"}`}>
              <input type="checkbox" name="modules" value={m.id} defaultChecked={inst.modules.includes(m.id)} disabled={!m.available || m.id === "escalas" || m.id === "profissionais"} className="mt-1 accent-teal" />
              <span><span className="block text-sm font-medium">{m.label}{!m.available && " (em breve)"}</span><span className="block text-xs text-ink-faint">{m.description}</span></span>
            </label>
          ))}
        </div>
      </section>

      {error && <p role="alert" className="rounded border border-danger-line bg-danger-bg px-3 py-2 text-sm text-danger">{error}</p>}
      <div className="flex justify-end"><Button type="submit" variant="primary" loading={pending}>Salvar configurações</Button></div>
    </form>
  );
}
