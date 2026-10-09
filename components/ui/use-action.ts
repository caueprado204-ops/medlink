"use client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { ActionResult } from "@/lib/errors";
import { useToast } from "./overlay";

/** Executa uma server action com feedback consistente (toast + atualização da página). */
export function useAction() {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();

  function run<T>(
    action: () => Promise<ActionResult<T>>,
    opts: { onOk?: (data: T) => void; onError?: (res: Extract<ActionResult<T>, { ok: false }>) => boolean | void; successMessage?: string } = {},
  ) {
    start(async () => {
      let res: ActionResult<T>;
      try {
        res = await action();
      } catch {
        toast({ tone: "error", message: "Sem conexão com o servidor. Verifique a internet e tente novamente." });
        return;
      }
      if (res.ok) {
        const msg = opts.successMessage ?? res.message;
        if (msg) toast({ tone: "success", message: msg });
        opts.onOk?.(res.data);
        router.refresh();
      } else {
        const handled = opts.onError?.(res);
        if (!handled) toast({ tone: res.kind === "warning" ? "warning" : "error", message: res.message });
      }
    });
  }
  return { run, pending };
}
