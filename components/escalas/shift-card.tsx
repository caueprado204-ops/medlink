"use client";
import { AlertTriangle } from "lucide-react";
import type { ShiftRow } from "@/lib/queries";
import { isActiveAssignment } from "@/lib/queries-shared";
import { CATEGORIES, SHIFT_STATUS } from "@/lib/labels";
import { localTime } from "@/lib/time";
import { cx } from "@/components/ui/primitives";

/** Vagas do plantão: cheio = confirmado, meio = aguardando, contorno = vaga aberta. */
export function SlotPips({ shift, size = "md" }: { shift: ShiftRow; size?: "sm" | "md" }) {
  const active = shift.assignments.filter((a) => isActiveAssignment(a.status));
  const confirmed = active.filter((a) => a.status === "confirmado").length;
  const pending = active.length - confirmed;
  const open = Math.max(shift.slots - active.length, 0);
  const dot = size === "sm" ? "h-1.5 w-1.5" : "h-2 w-2";
  const shown = Math.min(shift.slots, 8);
  const pips = [
    ...Array(Math.min(confirmed, shown)).fill("c"),
    ...Array(Math.min(pending, Math.max(shown - confirmed, 0))).fill("p"),
  ];
  while (pips.length < shown) pips.push("o");
  const label = `${active.length} de ${shift.slots} ${shift.slots === 1 ? "vaga preenchida" : "vagas preenchidas"}` +
    (pending ? `, ${pending} aguardando confirmação` : "") + (open ? `, ${open} em aberto` : "");
  return (
    <span className="inline-flex items-center gap-[3px]" role="img" aria-label={label} title={label}>
      {pips.map((k, i) => (
        <span
          key={i}
          className={cx(
            "rounded-full",
            dot,
            k === "c" && "bg-teal",
            k === "p" && "bg-amber",
            k === "o" && (shift.status === "rascunho" ? "border border-ink-faint" : "border-[1.5px] border-danger"),
          )}
        />
      ))}
      {shift.slots > 8 && <span className="ml-0.5 text-[0.65rem] text-ink-faint">+{shift.slots - 8}</span>}
    </span>
  );
}

export function ShiftCard({
  shift, tz, onOpen, draggable, onDragStart, compact,
}: {
  shift: ShiftRow; tz: string; onOpen: () => void; draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void; compact?: boolean;
}) {
  const active = shift.assignments.filter((a) => isActiveAssignment(a.status));
  const flagged = active.some((a) => a.exception_reason);
  const cancelled = shift.status === "cancelado";
  const draft = shift.status === "rascunho";
  const status = SHIFT_STATUS[shift.status];
  const edge =
    cancelled ? "border-l-line" :
    draft ? "border-l-ink-faint" :
    shift.status === "confirmado" ? "border-l-teal" :
    shift.status === "descoberto" ? "border-l-danger" : "border-l-amber";

  if (compact) {
    return (
      <button
        type="button" onClick={onOpen} draggable={draggable} onDragStart={onDragStart}
        className={cx(
          "flex w-full items-center gap-1.5 rounded-sm border border-l-[3px] border-line bg-white px-1.5 py-0.5 text-left text-xs hover:border-[#C9D2DD]",
          edge, draft && "border-dashed", cancelled && "opacity-50 line-through",
        )}
        aria-label={`${localTime(shift.starts_at, tz)} ${shift.unit?.name ?? ""}, ${status.label}`}
      >
        <span className="font-medium tabular-nums">{localTime(shift.starts_at, tz)}</span>
        <span className="min-w-0 flex-1 truncate text-ink-soft">{shift.service?.name ?? shift.unit?.name}</span>
        <SlotPips shift={shift} size="sm" />
      </button>
    );
  }

  return (
    <button
      type="button" onClick={onOpen} draggable={draggable} onDragStart={onDragStart}
      className={cx(
        "group w-full rounded border border-l-[3px] border-line bg-white px-2.5 py-2 text-left transition-colors hover:border-[#C9D2DD] hover:bg-[#FBFCFD]",
        edge, draft && "border-dashed bg-canvas/50", cancelled && "opacity-55", draggable && "cursor-grab active:cursor-grabbing",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className={cx("text-sm font-semibold tabular-nums text-navy", cancelled && "line-through")}>
          {localTime(shift.starts_at, tz)}–{localTime(shift.ends_at, tz)}
        </span>
        <SlotPips shift={shift} />
      </div>
      <p className="mt-0.5 truncate text-xs text-ink-soft">
        {shift.unit?.name}{shift.service ? ` / ${shift.service.name}` : ""}
      </p>
      {shift.category && <p className="truncate text-xs text-ink-faint">{CATEGORIES[shift.category]}</p>}
      {active.length > 0 && (
        <ul className="mt-1.5 space-y-0.5">
          {active.slice(0, 3).map((a) => (
            <li key={a.id} className="flex items-center gap-1.5 truncate text-xs">
              <span className={cx("h-1.5 w-1.5 shrink-0 rounded-full", a.status === "confirmado" ? "bg-teal" : "bg-amber")} aria-hidden />
              <span className="truncate">{a.professional?.full_name ?? "Profissional"}</span>
            </li>
          ))}
          {active.length > 3 && <li className="text-xs text-ink-faint">+{active.length - 3}</li>}
        </ul>
      )}
      {(draft || cancelled || shift.status === "substituicao_solicitada" || flagged) && (
        <div className="mt-1.5 flex flex-wrap items-center gap-1">
          {(draft || cancelled || shift.status === "substituicao_solicitada") && (
            <span className="text-[0.7rem] font-medium text-ink-soft">{status.label}</span>
          )}
          {flagged && (
            <span className="inline-flex items-center gap-0.5 text-[0.7rem] text-amber" title="Escala com exceção autorizada">
              <AlertTriangle className="h-3 w-3" aria-hidden /> exceção
            </span>
          )}
        </div>
      )}
    </button>
  );
}
