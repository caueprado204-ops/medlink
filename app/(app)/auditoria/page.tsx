import Link from "next/link";
import { requirePerm } from "@/lib/session";
import { getServerClient } from "@/lib/supabase/server";
import { AUDIT_ACTIONS, AUDIT_ENTITIES } from "@/lib/labels";
import { fmt, toInstant, addDays } from "@/lib/time";
import { EmptyState, PageHeader } from "@/components/ui/primitives";

export const metadata = { title: "Auditoria" };
const PAGE = 50;

const HIDDEN_KEYS = new Set(["id", "institution_id", "created_at", "updated_at", "created_by", "assigned_by", "decided_by", "verified_by", "series_id", "shift_id", "professional_id", "unit_id", "service_id", "user_id", "warnings"]);

function summarize(changes: Record<string, unknown> | null, action: string) {
  if (!changes) return "";
  const entries = Object.entries(changes).filter(([k]) => !HIDDEN_KEYS.has(k));
  if (action === "update" || entries.every(([, v]) => v && typeof v === "object" && "de" in (v as object))) {
    return entries.slice(0, 4).map(([k, v]) => {
      const d = v as { de: unknown; para: unknown };
      return `${k}: ${short(d.de)} → ${short(d.para)}`;
    }).join("; ");
  }
  return "";
}
function short(v: unknown) {
  if (v === null || v === undefined) return "vazio";
  const s = typeof v === "string" ? v : JSON.stringify(v);
  return s.length > 40 ? s.slice(0, 40) + "…" : s;
}

export default async function Auditoria({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const ctx = await requirePerm("audit.view");
  const supabase = getServerClient();
  const page = Math.max(0, Number(searchParams.pagina ?? 0) || 0);
  let q = supabase.from("audit_log").select("id,action,entity,entity_id,actor_id,changes,reason,result,created_at", { count: "exact" })
    .eq("institution_id", ctx.current.id).order("created_at", { ascending: false }).order("id", { ascending: false }).range(page * PAGE, page * PAGE + PAGE - 1);
  if (searchParams.entidade) q = q.eq("entity", searchParams.entidade);
  if (searchParams.de && /^\d{4}-\d{2}-\d{2}$/.test(searchParams.de)) q = q.gte("created_at", toInstant(searchParams.de, "00:00", ctx.tz));
  if (searchParams.ate && /^\d{4}-\d{2}-\d{2}$/.test(searchParams.ate)) q = q.lt("created_at", toInstant(addDays(searchParams.ate, 1), "00:00", ctx.tz));
  const { data, count, error } = await q;
  if (error) throw new Error("Não foi possível carregar a auditoria.");
  const ids = Array.from(new Set((data ?? []).map((d) => d.actor_id).filter(Boolean))) as string[];
  const { data: people } = ids.length ? await supabase.from("profiles").select("id,full_name,email").in("id", ids) : { data: [] };
  const names = new Map((people ?? []).map((p) => [p.id, p.full_name || p.email]));
  const total = count ?? 0;
  const qs = (p: number) => { const sp = new URLSearchParams(searchParams as Record<string, string>); sp.set("pagina", String(p)); return `?${sp}`; };

  return (
    <div>
      <PageHeader title="Auditoria" description="Registro permanente das ações relevantes: quem fez, quando, o que mudou e o motivo informado. Ninguém pode editar ou apagar este histórico pela aplicação." />
      <form className="panel mb-4 grid gap-3 p-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
        <select name="entidade" defaultValue={searchParams.entidade ?? ""} className="input" aria-label="Tipo de registro">
          <option value="">Todos os registros</option>
          {Object.entries(AUDIT_ENTITIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <input type="date" name="de" defaultValue={searchParams.de} className="input" aria-label="De" />
        <input type="date" name="ate" defaultValue={searchParams.ate} className="input" aria-label="Até" />
        <button className="h-10 rounded border border-line bg-white px-4 text-sm font-medium hover:bg-canvas">Filtrar</button>
      </form>
      <div className="panel overflow-x-auto">
        {(data ?? []).length === 0 ? <EmptyState title="Nenhum registro no período" /> : (
          <table className="w-full min-w-[820px] text-sm">
            <thead><tr><th className="table-head">Quando</th><th className="table-head">Quem</th><th className="table-head">Ação</th><th className="table-head">Registro</th><th className="table-head">Detalhes</th></tr></thead>
            <tbody>
              {(data ?? []).map((d) => (
                <tr key={d.id} className="align-top">
                  <td className="table-cell whitespace-nowrap tabular-nums">{fmt(d.created_at, "dd/MM/yy HH:mm:ss", ctx.tz)}</td>
                  <td className="table-cell">{d.actor_id ? names.get(d.actor_id) ?? "Usuário" : "Sistema"}</td>
                  <td className="table-cell">{AUDIT_ACTIONS[d.action] ?? d.action}</td>
                  <td className="table-cell">
                    {d.entity === "shifts" && d.entity_id ? <Link className="text-teal hover:underline" href={`/escalas?plantao=${d.entity_id}`}>Plantão</Link> : AUDIT_ENTITIES[d.entity] ?? d.entity}
                  </td>
                  <td className="table-cell max-w-md text-ink-soft">
                    {d.reason && <span className="block text-ink">Motivo: {d.reason}</span>}
                    <span className="break-words text-xs">{summarize(d.changes as Record<string, unknown> | null, d.action)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {total > PAGE && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-ink-soft">{page * PAGE + 1}–{Math.min(total, (page + 1) * PAGE)} de {total}</span>
          <span className="flex gap-2">
            {page > 0 && <Link href={qs(page - 1)} className="rounded border border-line bg-white px-3 py-1.5 hover:bg-canvas">Anteriores</Link>}
            {(page + 1) * PAGE < total && <Link href={qs(page + 1)} className="rounded border border-line bg-white px-3 py-1.5 hover:bg-canvas">Próximos</Link>}
          </span>
        </div>
      )}
    </div>
  );
}
