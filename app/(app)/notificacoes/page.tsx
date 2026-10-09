import Link from "next/link";
import { requireContext } from "@/lib/session";
import { getServerClient } from "@/lib/supabase/server";
import { fmt } from "@/lib/time";
import { EmptyState, PageHeader, cx } from "@/components/ui/primitives";
import { MarkAllRead } from "./mark";

export const metadata = { title: "Notificações" };

export default async function Notificacoes() {
  const ctx = await requireContext();
  const { data } = await getServerClient().from("notifications").select("id,kind,title,body,link,read_at,created_at")
    .eq("user_id", ctx.userId).order("created_at", { ascending: false }).limit(100);
  const items = data ?? [];
  const unread = items.filter((n) => !n.read_at).length;
  return (
    <div>
      <PageHeader title="Notificações" description="Alterações de escala, solicitações e pendências." actions={unread ? <MarkAllRead /> : undefined} />
      <div className="panel">
        {items.length === 0 ? <EmptyState title="Nenhuma notificação">Avisos sobre escalas e solicitações aparecem aqui.</EmptyState> : (
          <ul className="divide-y divide-line">
            {items.map((n) => {
              const body = (
                <div className="flex gap-3">
                  <span className={cx("mt-1.5 h-2 w-2 shrink-0 rounded-full", n.read_at ? "bg-transparent" : "bg-teal")} aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className={cx("text-sm", !n.read_at && "font-medium")}>{n.title}{!n.read_at && <span className="sr-only"> (não lida)</span>}</p>
                    {n.body && <p className="text-sm text-ink-soft">{n.body}</p>}
                    <p className="mt-0.5 text-xs text-ink-faint">{fmt(n.created_at, "dd/MM 'às' HH:mm", ctx.tz)}</p>
                  </div>
                </div>
              );
              return <li key={n.id}>{n.link ? <Link href={n.link} className="block px-4 py-3 hover:bg-canvas">{body}</Link> : <div className="px-4 py-3">{body}</div>}</li>;
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
