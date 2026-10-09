"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { X, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { cx } from "./primitives";

/* ----------------------------------------------------------------- Modal */
export function Modal({
  open, onClose, title, description, children, footer, size = "md",
}: {
  open: boolean; onClose: () => void; title: string; description?: ReactNode;
  children: ReactNode; footer?: ReactNode; size?: "md" | "lg";
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={(e) => { e.preventDefault(); onClose(); }}
      onClick={(e) => { if (e.target === ref.current) onClose(); }}
      aria-labelledby="modal-title"
      className={cx(
        "m-auto w-[calc(100%-2rem)] rounded-lg border border-line bg-white p-0 text-ink shadow-pop backdrop:bg-navy/35",
        "open:animate-slide-in",
        size === "lg" ? "max-w-3xl" : "max-w-lg",
      )}
    >
      {open && (
        <div className="flex max-h-[85vh] flex-col">
          <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
            <div>
              <h2 id="modal-title" className="text-lg">{title}</h2>
              {description && <p className="mt-0.5 text-sm text-ink-soft">{description}</p>}
            </div>
            <button onClick={onClose} className="rounded p-1 text-ink-faint hover:bg-canvas hover:text-ink" aria-label="Fechar">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="overflow-y-auto px-5 py-4">{children}</div>
          {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-line bg-canvas/60 px-5 py-3">{footer}</div>}
        </div>
      )}
    </dialog>
  );
}

/* ----------------------------------------------------------------- Toast */
type ToastItem = { id: number; tone: "success" | "error" | "warning"; message: string };
const ToastCtx = createContext<(t: Omit<ToastItem, "id">) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const push = useCallback((t: Omit<ToastItem, "id">) => {
    const id = Date.now() + Math.random();
    setItems((xs) => [...xs, { ...t, id }]);
    setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== id)), t.tone === "error" ? 7000 : 4000);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[min(24rem,calc(100%-2rem))] flex-col gap-2">
        {items.map((t) => {
          const Icon = t.tone === "success" ? CheckCircle2 : t.tone === "warning" ? AlertTriangle : XCircle;
          return (
            <div
              key={t.id}
              role={t.tone === "error" ? "alert" : "status"}
              className={cx(
                "pointer-events-auto flex animate-slide-in items-start gap-2.5 rounded-md border bg-white px-3.5 py-3 text-sm shadow-pop",
                t.tone === "success" ? "border-[#BFE5DF]" : t.tone === "warning" ? "border-amber-line" : "border-danger-line",
              )}
            >
              <Icon className={cx("mt-0.5 h-4 w-4 shrink-0", t.tone === "success" ? "text-teal" : t.tone === "warning" ? "text-amber" : "text-danger")} />
              <span>{t.message}</span>
            </div>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  return useContext(ToastCtx);
}
