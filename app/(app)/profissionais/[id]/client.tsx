"use client";
import { useState } from "react";
import { FileText, Upload } from "lucide-react";
import {
  documentLink, inviteProfessional, setDocumentStatus, setProfessionalActive, setValidationStatus, uploadDocument,
} from "@/lib/actions/professionals";
import { VALIDATION_STATUS, type ValidationStatus } from "@/lib/labels";
import type { UnitRow } from "@/lib/queries";
import { addDays, fmt, today } from "@/lib/time";
import { Badge, Button } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/overlay";
import { useAction } from "@/components/ui/use-action";
import { ProfessionalForm, type ProfessionalFull } from "@/components/forms/professional-form";

export function ProfileActions({
  id, active, validation, hasEmail, linked, invited, canManage, canVerify,
}: { id: string; active: boolean; validation: ValidationStatus; hasEmail: boolean; linked: boolean; invited: boolean; canManage: boolean; canVerify: boolean }) {
  const { run, pending } = useAction();
  return (
    <div className="flex flex-wrap items-center gap-2">
      {canVerify && (
        <label className="flex items-center gap-2 text-sm">
          <span className="text-ink-soft">Validação</span>
          <select className="input h-9 w-48 py-1" value={validation} disabled={pending}
            onChange={(e) => run(() => setValidationStatus(id, e.target.value))}>
            {Object.entries(VALIDATION_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </label>
      )}
      {canManage && !linked && (
        <Button loading={pending} disabled={!hasEmail} title={hasEmail ? undefined : "Informe o e-mail no cadastro"}
          onClick={() => run(() => inviteProfessional(id))}>
          {invited ? "Reenviar convite" : "Convidar para a Minha área"}
        </Button>
      )}
      {canManage && (
        <Button variant={active ? "danger" : "secondary"} loading={pending}
          onClick={() => { if (!active || confirm("Desativar este profissional? Ele deixa de aparecer para novas escalas; plantões já publicados não mudam.")) run(() => setProfessionalActive(id, !active)); }}>
          {active ? "Desativar" : "Reativar"}
        </Button>
      )}
    </div>
  );
}

export function EditProfile(props: { institutionId: string; units: UnitRow[]; professional: ProfessionalFull; unitIds: string[] }) {
  return <ProfessionalForm {...props} />;
}

export type DocRow = { id: string; kind: string; file_path: string | null; expires_on: string | null; status: "enviado" | "verificado" | "rejeitado"; verified_at: string | null; note: string | null; created_at: string };

const DOC_TONE = { enviado: "sky", verificado: "teal", rejeitado: "danger" } as const;
const DOC_LABEL = { enviado: "Enviado, aguardando verificação", verificado: "Verificado", rejeitado: "Rejeitado" };
const DOC_KINDS = ["Documento de identidade", "Carteira do conselho profissional", "Diploma", "Certificado de especialização", "Comprovante de vacinação", "Certidão de regularidade no conselho", "Currículo", "Outro"];

export function Documents({
  institutionId, professionalId, docs, canUpload, canVerify, tz,
}: { institutionId: string; professionalId: string; docs: DocRow[]; canUpload: boolean; canVerify: boolean; tz: string }) {
  const { run, pending } = useAction();
  const toast = useToast();
  const [formKey, setFormKey] = useState(0);
  const soon = addDays(today(tz), 30);
  const now = today(tz);

  async function open(path: string) {
    const res = await documentLink(path);
    if (res.ok) window.open(res.data, "_blank", "noopener,noreferrer");
    else toast({ tone: "error", message: res.message });
  }

  return (
    <div className="space-y-4">
      {docs.length === 0 ? <p className="text-sm text-ink-soft">Nenhum documento enviado.</p> : (
        <ul className="divide-y divide-line rounded border border-line">
          {docs.map((d) => {
            const expired = d.expires_on && d.expires_on < now;
            const expiring = !expired && d.expires_on && d.expires_on <= soon;
            return (
              <li key={d.id} className="flex flex-wrap items-center gap-3 px-3 py-2.5 text-sm">
                <FileText className="h-4 w-4 text-ink-faint" aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{d.kind}</span>
                  <span className="text-xs text-ink-faint">
                    Enviado em {fmt(d.created_at, "dd/MM/yyyy", tz)}
                    {d.expires_on && <>; validade {fmt(`${d.expires_on}T12:00:00Z`, "dd/MM/yyyy", "UTC")}</>}
                  </span>
                </span>
                {expired && <Badge tone="danger">Vencido</Badge>}
                {expiring && <Badge tone="amber">Vence em breve</Badge>}
                <Badge tone={DOC_TONE[d.status]}>{DOC_LABEL[d.status]}</Badge>
                {d.file_path && <Button size="sm" variant="ghost" onClick={() => open(d.file_path!)}>Abrir</Button>}
                {canVerify && d.status !== "verificado" && <Button size="sm" loading={pending} onClick={() => run(() => setDocumentStatus(d.id, "verificado"))}>Marcar verificado</Button>}
                {canVerify && d.status === "enviado" && <Button size="sm" variant="danger" loading={pending} onClick={() => run(() => setDocumentStatus(d.id, "rejeitado"))}>Rejeitar</Button>}
                {canVerify && d.status === "verificado" && <Button size="sm" variant="ghost" loading={pending} onClick={() => run(() => setDocumentStatus(d.id, "enviado"))}>Desfazer</Button>}
              </li>
            );
          })}
        </ul>
      )}
      {canUpload && (
        <form key={formKey} className="grid gap-3 rounded border border-line bg-canvas/50 p-3 sm:grid-cols-[1.4fr_1fr_1.4fr_auto] sm:items-end"
          action={(f) => run(() => uploadDocument(institutionId, professionalId, f), { onOk: () => setFormKey((k) => k + 1) })}>
          <label><span className="label">Tipo</span>
            <select name="kind" className="input" required defaultValue="">
              <option value="" disabled>Selecione</option>
              {DOC_KINDS.map((k) => <option key={k}>{k}</option>)}
            </select>
          </label>
          <label><span className="label">Validade</span><input type="date" name="expires_on" className="input" /></label>
          <label><span className="label">Arquivo (PDF ou imagem, até 10 MB)</span><input type="file" name="file" accept="application/pdf,image/jpeg,image/png,image/webp" className="block w-full text-sm" /></label>
          <Button type="submit" icon={<Upload className="h-4 w-4" />} loading={pending}>Enviar</Button>
        </form>
      )}
      <p className="hint">Arquivos ficam em armazenamento privado. Links de visualização expiram em 60 segundos.</p>
    </div>
  );
}
