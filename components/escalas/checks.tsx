"use client";
import { Ban, AlertTriangle } from "lucide-react";
import type { Checks } from "@/lib/errors";

/** Mostra bloqueios (restrições obrigatórias) e alertas (exceções que exigem justificativa). */
export function ChecksList({ checks, compact }: { checks: Checks; compact?: boolean }) {
  if (!checks.blocking.length && !checks.warnings.length) return null;
  return (
    <ul className={compact ? "mt-1 space-y-0.5" : "space-y-1.5"}>
      {checks.blocking.map((b, i) => (
        <li key={`b${i}`} className="flex items-start gap-1.5 text-sm text-danger">
          <Ban className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          <span><span className="sr-only">Bloqueio: </span>{b.message}</span>
        </li>
      ))}
      {checks.warnings.map((w, i) => (
        <li key={`w${i}`} className="flex items-start gap-1.5 text-sm text-amber">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          <span><span className="sr-only">Alerta: </span>{w.message}</span>
        </li>
      ))}
    </ul>
  );
}

/** Bloco exibido quando o banco devolve alertas: pede justificativa para autorizar a exceção. */
export function OverridePrompt({
  checks, reason, setReason, blocking,
}: { checks: Checks; reason: string; setReason: (v: string) => void; blocking?: boolean }) {
  return (
    <div className={`rounded-md border px-3.5 py-3 ${blocking ? "border-danger-line bg-danger-bg/50" : "border-amber-line bg-amber-bg/60"}`}>
      <p className="mb-2 text-sm font-medium text-ink">
        {blocking ? "Não é possível salvar: há restrições obrigatórias." : "Esta alteração gera alertas."}
      </p>
      <ChecksList checks={checks} />
      {!blocking && (
        <div className="mt-3">
          <label className="label" htmlFor="override-reason">Justificativa para autorizar a exceção</label>
          <textarea
            id="override-reason" className="input min-h-[64px]" maxLength={500} value={reason}
            onChange={(e) => setReason(e.target.value)} placeholder="Ex.: cobertura emergencial autorizada pela coordenação"
          />
          <p className="hint">A justificativa fica registrada no histórico de auditoria.</p>
        </div>
      )}
    </div>
  );
}
