"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, CalendarDays, Inbox, Users, UserRound, Building2, ShieldCheck, History, Settings, Menu, X,
} from "lucide-react";
import { Logo } from "./logo";
import { cx } from "@/components/ui/primitives";

export type NavItem = { href: string; label: string; icon: keyof typeof ICONS; badge?: number };
const ICONS = { LayoutDashboard, CalendarDays, Inbox, Users, UserRound, Building2, ShieldCheck, History, Settings };

export function Sidebar({ groups, institutionName }: { groups: { title?: string; items: NavItem[] }[]; institutionName: string }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);

  const nav = (
    <nav aria-label="Navegação principal" className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-4">
      {groups.map((g, i) => (
        <div key={i}>
          {g.title && <p className="mb-1.5 px-2.5 text-xs text-[#8FA6BF]">{g.title}</p>}
          <ul className="space-y-0.5">
            {g.items.map((it) => {
              const Icon = ICONS[it.icon];
              const active = path === it.href || path.startsWith(it.href + "/");
              return (
                <li key={it.href}>
                  <Link
                    href={it.href}
                    aria-current={active ? "page" : undefined}
                    className={cx(
                      "flex items-center gap-2.5 rounded px-2.5 py-2 text-sm transition-colors",
                      active ? "bg-white/10 font-medium text-white" : "text-[#C9D7E6] hover:bg-white/5 hover:text-white",
                    )}
                  >
                    <Icon className={cx("h-4 w-4", active ? "text-mint" : "")} aria-hidden />
                    <span className="flex-1">{it.label}</span>
                    {!!it.badge && <span className="rounded-sm bg-mint px-1.5 text-xs font-semibold text-navy">{it.badge}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <>
      <button
        className="fixed left-3 top-3 z-40 rounded border border-line bg-white p-2 text-navy lg:hidden"
        onClick={() => setOpen(true)} aria-label="Abrir menu"
      >
        <Menu className="h-5 w-5" />
      </button>
      {open && <div className="fixed inset-0 z-40 bg-navy/40 lg:hidden" onClick={() => setOpen(false)} aria-hidden />}
      <aside
        className={cx(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-navy transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <Logo light />
          <button className="text-[#C9D7E6] lg:hidden" onClick={() => setOpen(false)} aria-label="Fechar menu"><X className="h-5 w-5" /></button>
        </div>
        <p className="mx-5 truncate border-b border-white/10 pb-4 text-sm text-[#C9D7E6]" title={institutionName}>{institutionName}</p>
        {nav}
      </aside>
    </>
  );
}
