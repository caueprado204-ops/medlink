"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Bell, Search, ChevronDown, LogOut } from "lucide-react";
import { switchInstitution } from "@/lib/actions/institution";
import { useToast } from "@/components/ui/overlay";

export function Header({
  institutions, currentId, unread, userName, roleLabel, canSearch,
}: {
  institutions: { id: string; name: string }[]; currentId: string; unread: number; userName: string; roleLabel: string; canSearch: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  const [menu, setMenu] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-white/95 px-4 pl-16 backdrop-blur lg:px-8">
      {institutions.length > 1 ? (
        <label className="hidden items-center gap-2 text-sm sm:flex">
          <span className="sr-only">Instituição</span>
          <select
            className="input h-9 w-56 py-1"
            value={currentId}
            disabled={pending}
            onChange={(e) => start(async () => {
              const res = await switchInstitution(e.target.value);
              if (!res.ok) toast({ tone: "error", message: res.message });
              router.push("/");
              router.refresh();
            })}
          >
            {institutions.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>
        </label>
      ) : null}

      {canSearch && (
        <form action="/profissionais" className="relative ml-auto w-full max-w-xs sm:ml-0">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" aria-hidden />
          <input name="q" type="search" placeholder="Buscar profissional" aria-label="Buscar profissional" className="input h-9 py-1 pl-8" />
        </form>
      )}

      <div className="ml-auto flex items-center gap-1">
        <Link href="/notificacoes" className="relative rounded p-2 text-ink-soft hover:bg-canvas hover:text-navy" aria-label={`Notificações${unread ? `, ${unread} não lidas` : ""}`}>
          <Bell className="h-5 w-5" />
          {unread > 0 && <span className="absolute right-1 top-1 min-w-[1.1rem] rounded-full bg-danger px-1 text-center text-[0.65rem] font-semibold leading-[1.1rem] text-white">{unread > 9 ? "9+" : unread}</span>}
        </Link>
        <div className="relative">
          <button onClick={() => setMenu((v) => !v)} className="flex items-center gap-2 rounded px-2 py-1.5 text-left hover:bg-canvas" aria-expanded={menu} aria-haspopup="menu">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-navy-100 text-sm font-semibold text-navy" aria-hidden>
              {userName.trim().charAt(0).toUpperCase()}
            </span>
            <span className="hidden text-sm leading-tight md:block">
              <span className="block font-medium">{userName}</span>
              <span className="block text-xs text-ink-faint">{roleLabel}</span>
            </span>
            <ChevronDown className="h-4 w-4 text-ink-faint" aria-hidden />
          </button>
          {menu && (
            <div role="menu" className="absolute right-0 mt-1 w-56 rounded-md border border-line bg-white py-1 shadow-pop">
              {institutions.length > 1 && <p className="px-3 py-2 text-xs text-ink-faint sm:hidden">Troque de instituição em um computador ou tablet.</p>}
              <Link role="menuitem" href="/bem-vindo" className="block px-3 py-2 text-sm hover:bg-canvas">Cadastrar outra instituição</Link>
              <form action="/auth/sair" method="post">
                <button role="menuitem" className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-danger hover:bg-danger-bg">
                  <LogOut className="h-4 w-4" /> Sair
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
