"use client";
import { useState } from "react";
import { applyToShift, confirmAssignment, declineAssignment, requestChange, withdrawRequest } from "@/lib/actions/me";
import type { AssignmentStatus } from "@/lib/labels";
import { Button } from "@/components/ui/primitives";
import { useAction } from "@/components/ui/use-action";

type Mode = null | "recusar" | "substituicao" | "cancelamento" | "alteracao";

export function AssignmentActions({ id, status, compact }: { id: string; status: AssignmentStatus; compact?: boolean }) {
  const [mode, setMode] = useState<Mode>(null);
  const [reason, setReason] = useState("");
  const { run, pending } = useAction();
  const reset = () => { setMode(null); setReason(""); };

  if (status === "substituicao_solicitada") {
    return <p className="mt-2 text-sm text-ink-soft">Seu pedido de substituição está com a gestão. Até a aprovação, o plantão continua sob sua responsabilidade.</p>;
  }
  return (
    <div className={compact ? "mt-2" : "mt-4"}>
      {!mode && (
        <div className="flex flex-wrap gap-2">
          {status === "aguardando_confirmacao" && (
            <>
              <Button size="sm" variant="primary" loading={pending} onClick={() => run(() => confirmAssignment(id))}>Confirmar presença</Button>
              <Button size="sm" onClick={() => setMode("recusar")}>Não posso</Button>
            </>
          )}
          {status === "confirmado" && (
            <>
              <Button size="sm" onClick={() => setMode("substituicao")}>Pedir substituição</Button>
              <Button size="sm" variant="ghost" onClick={() => setMode("alteracao")}>Pedir alteração</Button>
            </>
          )}
        </div>
      )}
      {mode && (
        <div className="space-y-2 rounded-md border border-line bg-canvas/60 p-3">
          <p className="text-sm">
            {mode === "recusar" ? "Recusar este plantão. A gestão será avisada para buscar outra pessoa."
              : mode === "substituicao" ? "Plantões confirmados só mudam com aprovação. Explique o motivo; você continua escalado até a resposta."
              : "Descreva a alteração desejada (horário, unidade). A gestão analisa e responde."}
          </p>
          <textarea className="input min-h-[60px]" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} aria-label="Motivo" placeholder="Motivo" />
          <div className="flex justify-end gap-2">
            <Button size="sm" onClick={reset}>Voltar</Button>
            <Button size="sm" variant={mode === "recusar" ? "danger" : "primary"} loading={pending} disabled={!reason.trim()}
              onClick={() => run(() => (mode === "recusar" ? declineAssignment(id, reason.trim()) : requestChange(id, mode, reason.trim())), { onOk: reset })}>
              {mode === "recusar" ? "Recusar plantão" : "Enviar solicitação"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function ApplyButton({ shiftId }: { shiftId: string }) {
  const { run, pending } = useAction();
  return <Button size="sm" loading={pending} onClick={() => run(() => applyToShift(shiftId, null))}>Candidatar-me</Button>;
}

export function WithdrawButton({ id }: { id: string }) {
  const { run, pending } = useAction();
  return <Button size="sm" variant="ghost" loading={pending} onClick={() => run(() => withdrawRequest(id))}>Retirar</Button>;
}
