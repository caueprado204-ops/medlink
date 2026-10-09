"use client";
import { useState } from "react";
import { decideRequest } from "@/lib/actions/shifts";
import { CATEGORIES, REQUEST_KIND, REQUEST_STATUS, type Category, type RequestKind, type RequestStatus } from "@/lib/labels";
import type { Checks } from "@/lib/errors";
import type { ProfessionalLite } from "@/lib/queries";
import { fmt, localTime } from "@/lib/time";
import { Badge, Button } from "@/components/ui/primitives";
import { useAction } from "@/components/ui/use-action";
import { OverridePrompt } from "@/components/escalas/checks";

export type RequestRow = {
  id: string; kind: RequestKind; status: RequestStatus; reason: string | null; created_at: string;
  decided_at: string | null; decision_note: string | null; suggested_professional_id: string | null;
  professional: { id: string; full_name: string; category: Category } | null;
  shift: { id: string; starts_at: string; ends_at: string; category: Category | null; unit: { name: string } | null; service: { name: string } | null } | null;
};

export function RequestList({ rows, tz, professionals, decidable }: { rows: RequestRow[]; tz: string; professionals: ProfessionalLite[]; decidable?: boolean }) {
  return (
    <ul className="divide-y divide-line">
      {rows.map((r) => <RequestItem key={r.id} r={r} tz={tz} professionals={professionals} decidable={decidable} />)}
    </ul>
  );
}

function RequestItem({ r, tz, professionals, decidable }: { r: RequestRow; tz: string; professionals: ProfessionalLite[]; decidable?: boolean }) {
  const [mode, setMode] = useState<null | "aprovar" | "recusar">(null);
  const [note, setNote] = useState("");
  const [substitute, setSubstitute] = useState(r.suggested_professional_id ?? "");
  const [checks, setChecks] = useState<Checks | null>(null);
  const [blocking, setBlocking] = useState(false);
  const [reason, setReason] = useState("");
  const { run, pending } = useAction();
  const st = REQUEST_STATUS[r.status];
  const candidates = professionals.filter((p) => p.active && p.id !== r.professional?.id && (!r.shift?.category || p.category === r.shift.category));

  function decide(approve: boolean) {
    run(() => decideRequest(r.id, approve, note.trim() || null, approve && substitute ? substitute : null, reason.trim() || null), {
      onError: (res) => {
        if ((res.kind === "warning" || res.kind === "blocking") && res.checks) { setChecks(res.checks); setBlocking(res.kind === "blocking"); return true; }
        return false;
      },
    });
  }

  return (
    <li className="px-4 py-4">
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-medium">
            {r.professional?.full_name ?? "Profissional"} <span className="font-normal text-ink-soft">pediu {REQUEST_KIND[r.kind].toLowerCase()}</span>
          </p>
          {r.shift && (
            <p className="mt-0.5 text-sm text-ink-soft first-letter:uppercase">
              {fmt(r.shift.starts_at, "EEEE, dd/MM", tz)}, {localTime(r.shift.starts_at, tz)}–{localTime(r.shift.ends_at, tz)}, {r.shift.unit?.name}{r.shift.service ? ` / ${r.shift.service.name}` : ""}
            </p>
          )}
          {r.reason && <p className="mt-1.5 rounded bg-canvas px-2.5 py-1.5 text-sm">“{r.reason}”</p>}
          {r.decision_note && <p className="mt-1.5 text-sm text-ink-soft">Resposta: {r.decision_note}</p>}
          <p className="mt-1 text-xs text-ink-faint">Enviada em {fmt(r.created_at, "dd/MM 'às' HH:mm", tz)}{r.decided_at ? `; analisada em ${fmt(r.decided_at, "dd/MM 'às' HH:mm", tz)}` : ""}</p>
        </div>
        <Badge tone={st.tone}>{st.label}</Badge>
      </div>

      {decidable && !mode && (
        <div className="mt-3 flex gap-2">
          <Button size="sm" variant="primary" onClick={() => setMode("aprovar")}>Aprovar</Button>
          <Button size="sm" onClick={() => setMode("recusar")}>Recusar</Button>
        </div>
      )}

      {decidable && mode && (
        <div className="mt-3 space-y-3 rounded-md border border-line bg-canvas/50 p-3">
          {mode === "aprovar" && (r.kind === "substituicao" || r.kind === "cancelamento") && (
            <label className="block">
              <span className="label">Substituto</span>
              <select className="input" value={substitute} onChange={(e) => { setSubstitute(e.target.value); setChecks(null); setReason(""); }}>
                <option value="">Sem substituto agora (a vaga fica descoberta)</option>
                {candidates.map((p) => <option key={p.id} value={p.id}>{p.full_name} ({CATEGORIES[p.category]})</option>)}
              </select>
              <span className="hint block">O substituto é validado pelas mesmas regras da escala.</span>
            </label>
          )}
          {mode === "aprovar" && r.kind === "alteracao" && (
            <p className="text-sm text-ink-soft">Aprovar registra a decisão. Faça a alteração do plantão na tela de Escalas.</p>
          )}
          <label className="block">
            <span className="label">{mode === "recusar" ? "Motivo da recusa" : "Mensagem ao profissional (opcional)"}</span>
            <textarea className="input min-h-[60px]" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />
          </label>
          {checks && <OverridePrompt checks={checks} reason={reason} setReason={setReason} blocking={blocking} />}
          <div className="flex justify-end gap-2">
            <Button size="sm" onClick={() => { setMode(null); setChecks(null); }}>Voltar</Button>
            {mode === "aprovar" ? (
              <Button size="sm" variant="primary" loading={pending} disabled={blocking || (!!checks && !reason.trim())} onClick={() => decide(true)}>
                {checks ? "Autorizar exceção e aprovar" : "Confirmar aprovação"}
              </Button>
            ) : (
              <Button size="sm" variant="danger" loading={pending} disabled={!note.trim()} onClick={() => decide(false)}>Confirmar recusa</Button>
            )}
          </div>
        </div>
      )}
    </li>
  );
}
