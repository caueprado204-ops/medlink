"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createInstitution } from "@/lib/actions/institution";
import { INSTITUTION_TYPES, MODULES } from "@/lib/labels";
import { formatCnpj, isValidCnpj } from "@/lib/cnpj";
import { Button, Field } from "@/components/ui/primitives";

export function OnboardingForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [cnpj, setCnpj] = useState("");
  const [loading, setLoading] = useState(false);
  const cnpjError = cnpj.replace(/\D/g, "").length === 14 && !isValidCnpj(cnpj) ? "CNPJ inválido. Confira os dígitos." : undefined;

  async function submit(form: FormData) {
    setLoading(true); setError(null);
    const res = await createInstitution(form);
    setLoading(false);
    if (!res.ok) return setError(res.message);
    router.replace("/painel");
    router.refresh();
  }

  return (
    <form action={submit} className="panel mt-6 space-y-5 p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nome da instituição" htmlFor="name" required className="sm:col-span-2">
          <input id="name" name="name" className="input" required maxLength={160} placeholder="Ex.: Clínica Vida Vacinas" />
        </Field>
        <Field label="Tipo" htmlFor="type" required>
          <select id="type" name="type" className="input" required defaultValue="">
            <option value="" disabled>Selecione</option>
            {Object.entries(INSTITUTION_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </Field>
        <Field label="CNPJ" htmlFor="cnpj" hint="Opcional agora; pode ser informado depois." error={cnpjError}>
          <input id="cnpj" name="cnpj" className="input" inputMode="numeric" value={cnpj} onChange={(e) => setCnpj(formatCnpj(e.target.value))} aria-invalid={!!cnpjError} placeholder="00.000.000/0000-00" />
        </Field>
        <Field label="Razão social" htmlFor="legal_name" className="sm:col-span-2">
          <input id="legal_name" name="legal_name" className="input" maxLength={200} />
        </Field>
      </div>

      <fieldset>
        <legend className="label">Primeira unidade</legend>
        <div className="grid gap-4 sm:grid-cols-[1fr_1fr_80px]">
          <input name="unit_name" className="input" placeholder="Nome (ex.: Matriz)" aria-label="Nome da unidade" maxLength={120} />
          <input name="unit_city" className="input" placeholder="Cidade" aria-label="Cidade" maxLength={120} />
          <input name="unit_uf" className="input uppercase" placeholder="UF" aria-label="UF" maxLength={2} />
        </div>
      </fieldset>

      <fieldset>
        <legend className="label">Módulos</legend>
        <p className="hint mb-2 mt-0">Escalas e Profissionais fazem parte da primeira versão. Os demais ficam reservados e serão liberados nas próximas etapas.</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {MODULES.map((m) => (
            <label key={m.id} className={`flex items-start gap-2.5 rounded border border-line px-3 py-2.5 ${m.available ? "" : "opacity-60"}`}>
              <input type="checkbox" name="modules" value={m.id} defaultChecked={m.available} disabled={!m.available} className="mt-1 accent-teal" />
              <span>
                <span className="block text-sm font-medium">{m.label}{!m.available && " (em breve)"}</span>
                <span className="block text-xs text-ink-faint">{m.description}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {error && <p role="alert" className="rounded border border-danger-line bg-danger-bg px-3 py-2 text-sm text-danger">{error}</p>}
      <div className="flex justify-end">
        <Button type="submit" variant="primary" loading={loading}>Cadastrar instituição</Button>
      </div>
    </form>
  );
}
