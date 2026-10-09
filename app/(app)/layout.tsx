import { requireContext } from "@/lib/session";
import { getServerClient } from "@/lib/supabase/server";
import { Sidebar, type NavItem } from "@/components/shell/sidebar";
import { Header } from "@/components/shell/header";
import { ROLES } from "@/lib/labels";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireContext();
  const supabase = getServerClient();
  const p = ctx.perms;

  const [{ count: unread }, pendingReq] = await Promise.all([
    supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", ctx.userId).is("read_at", null),
    p.has("requests.decide")
      ? supabase.from("change_requests").select("id", { count: "exact", head: true }).eq("institution_id", ctx.current.id).eq("status", "pendente")
      : Promise.resolve({ count: 0 }),
  ]);

  const operation: NavItem[] = [];
  if (p.has("shifts.view") || p.has("professionals.view")) operation.push({ href: "/painel", label: "Painel", icon: "LayoutDashboard" });
  if (p.has("shifts.view")) operation.push({ href: "/escalas", label: "Escalas", icon: "CalendarDays" });
  if (p.has("requests.decide")) operation.push({ href: "/solicitacoes", label: "Solicitações", icon: "Inbox", badge: pendingReq.count ?? 0 });
  if (p.has("professionals.view")) operation.push({ href: "/profissionais", label: "Profissionais", icon: "Users" });

  const personal: NavItem[] = ctx.professional ? [{ href: "/meu", label: "Minha área", icon: "UserRound" }] : [];

  const admin: NavItem[] = [];
  if (p.has("units.manage")) admin.push({ href: "/unidades", label: "Unidades", icon: "Building2" });
  if (p.has("members.manage")) admin.push({ href: "/equipe", label: "Equipe e acessos", icon: "ShieldCheck" });
  if (p.has("audit.view")) admin.push({ href: "/auditoria", label: "Auditoria", icon: "History" });
  if (p.has("institution.manage")) admin.push({ href: "/configuracoes", label: "Configurações", icon: "Settings" });

  const groups = [
    { items: operation },
    ...(personal.length ? [{ title: "Profissional", items: personal }] : []),
    ...(admin.length ? [{ title: "Administração", items: admin }] : []),
  ].filter((g) => g.items.length);

  const roleLabel = ctx.current.roles.map((r) => ROLES[r]).join(", ");

  return (
    <div className="min-h-screen">
      <Sidebar groups={groups} institutionName={ctx.current.name} />
      <div className="lg:pl-64">
        <Header
          institutions={ctx.institutions.map((i) => ({ id: i.id, name: i.name }))}
          currentId={ctx.current.id}
          unread={unread ?? 0}
          userName={ctx.name}
          roleLabel={roleLabel}
          canSearch={p.has("professionals.view")}
        />
        {ctx.current.is_demo && (
          <div className="border-b border-[#BAE0F7] bg-sky px-4 py-2 text-sm text-[#075985] lg:px-8">Ambiente de demonstração: os dados não são reais.</div>
        )}
        <main className="mx-auto max-w-[1400px] px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
