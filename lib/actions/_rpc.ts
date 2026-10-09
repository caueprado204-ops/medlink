import "server-only";
import { revalidatePath } from "next/cache";
import { getServerClient } from "@/lib/supabase/server";
import { fromPgError, ok, type ActionResult } from "@/lib/errors";

/** Chama uma função do banco com a sessão do usuário e traduz o resultado. */
export async function rpc<T = unknown>(
  fn: string,
  args: Record<string, unknown>,
  opts: { revalidate?: string[]; message?: string } = {},
): Promise<ActionResult<T>> {
  try {
    const supabase = getServerClient();
    const { data, error } = await supabase.rpc(fn, args);
    if (error) return fromPgError(error);
    (opts.revalidate ?? ["/", "layout"]).forEach((p) => (p === "layout" ? revalidatePath("/", "layout") : revalidatePath(p)));
    return ok(data as T, opts.message);
  } catch (e) {
    return fromPgError({ message: e instanceof Error ? e.message : String(e) });
  }
}

export function revalidateAll() {
  revalidatePath("/", "layout");
}

export function str(v: FormDataEntryValue | null | undefined) {
  const s = typeof v === "string" ? v.trim() : "";
  return s.length ? s : null;
}

export function list(v: string | null) {
  return (v ?? "").split(/[,;\n]/).map((x) => x.trim()).filter(Boolean);
}
