import { LogOut } from "lucide-react";
import { logout } from "@/app/actions";
import type { User } from "@/lib/auth";
import { formatDate, today, WEEKDAYS, weekday } from "@/lib/dates";
import { Logo } from "./logo";
import { BottomNav, SideNav, type NavItem } from "./nav";
import { Avatar } from "./ui";

export const ROLE_LABEL = {
  student: "O'quvchi",
  teacher: "Ustoz",
  admin: "Administrator",
  finance: "Moliya admini",
} as const;

export function Shell({ user, nav, children }: { user: User; nav: NavItem[]; children: React.ReactNode }) {
  const t = today();
  return (
    <div className="min-h-screen lg:pl-64">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-gradient-to-b from-[#1e1b4b] via-[#272370] to-[#3b2a8f] px-4 py-6 lg:flex">
        <div className="px-2">
          <Logo light />
        </div>
        <div className="mt-8 flex-1">
          <SideNav items={nav} />
        </div>
        <div className="rounded-2xl bg-white/10 p-3">
          <div className="flex items-center gap-3">
            <Avatar name={user.name} className="ring-2 ring-white/20" />
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-white">{user.name}</div>
              <div className="text-xs text-white/60">{ROLE_LABEL[user.role]}</div>
            </div>
          </div>
          <form action={logout} className="mt-3">
            <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-white/80 transition hover:bg-white/20 hover:text-white">
              <LogOut className="size-3.5" /> Chiqish
            </button>
          </form>
        </div>
      </aside>

      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="lg:hidden">
            <Logo />
          </div>
          <div className="hidden text-sm text-slate-500 lg:block">
            <span className="font-semibold text-slate-700">{WEEKDAYS[weekday(t)]}</span>, {formatDate(t)}
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <div className="text-sm font-semibold text-slate-800">{user.name}</div>
              <div className="text-xs text-slate-500">{ROLE_LABEL[user.role]}</div>
            </div>
            <form action={logout} className="lg:hidden">
              <button className="grid size-9 place-items-center rounded-xl border border-slate-200 text-slate-500" aria-label="Chiqish">
                <LogOut className="size-4" />
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pt-6 pb-28 sm:px-6 lg:pb-12">{children}</main>
      <BottomNav items={nav} />
    </div>
  );
}
