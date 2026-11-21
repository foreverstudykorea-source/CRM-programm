import Link from "next/link";
import { ChevronDown, LogOut, ShieldCheck, UserRound } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import type { User } from "@/lib/auth";
import { formatDate, today, WEEKDAYS, weekday } from "@/lib/dates";
import { DemoBanner } from "./demo-banner";
import { Logo } from "./logo";
import { BottomNav, SideNav, type NavItem } from "./nav";
import { Toaster } from "./toast";
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
    <div className="min-h-dvh lg:pl-[272px]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[272px] flex-col overflow-hidden bg-ink-900 px-4 py-6 lg:flex">
        <div className="pointer-events-none absolute -top-32 -left-24 size-80 rounded-full bg-brand-600/30 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-0 size-72 rounded-full bg-fuchsia-600/15 blur-3xl" />
        <div className="relative px-2">
          <Logo light />
        </div>
        <div className="eyebrow relative mt-9 mb-2 px-3 text-white/30">Menyu</div>
        <div className="relative flex-1">
          <SideNav items={nav} />
        </div>
        <div className="relative rounded-2xl border border-white/[0.06] bg-white/[0.04] p-3">
          <div className="flex items-center gap-3">
            <Avatar name={user.name} className="ring-2 ring-white/15" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-bold text-white">{user.name}</div>
              <div className="text-xs text-white/50">{ROLE_LABEL[user.role]}</div>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Link
              href="/hisob"
              className="flex items-center justify-center gap-1.5 rounded-lg bg-white/[0.06] px-2 py-2 text-xs font-semibold text-white/75 transition hover:bg-white/10 hover:text-white"
            >
              <ShieldCheck className="size-3.5" /> Hisob
            </Link>
            <form action={logoutAction}>
              <button className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-white/[0.06] px-2 py-2 text-xs font-semibold text-white/75 transition hover:bg-rose-500/80 hover:text-white">
                <LogOut className="size-3.5" /> Chiqish
              </button>
            </form>
          </div>
        </div>
      </aside>

      <DemoBanner />
      <header className="sticky top-0 z-30 border-b border-slate-200/60 bg-surface/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="lg:hidden">
            <Logo />
          </div>
          <div className="hidden items-center gap-2 text-sm text-slate-500 lg:flex">
            <span className="size-2 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgb(16_185_129/0.2)]" />
            <span className="font-bold text-slate-800">{WEEKDAYS[weekday(t)]}</span>
            <span>{formatDate(t)}</span>
          </div>
          <details className="group relative">
            <summary className="flex cursor-pointer list-none items-center gap-2.5 rounded-xl py-1 pr-2 pl-1 transition hover:bg-white [&::-webkit-details-marker]:hidden">
              <Avatar name={user.name} size="sm" />
              <div className="hidden text-left leading-tight sm:block">
                <div className="text-sm font-bold text-slate-800">{user.name}</div>
                <div className="text-[11px] text-slate-500">{ROLE_LABEL[user.role]}</div>
              </div>
              <ChevronDown className="size-4 text-slate-400 transition group-open:rotate-180" />
            </summary>
            <div className="absolute right-0 mt-2 w-56 animate-pop rounded-2xl border border-slate-200/70 bg-white p-1.5 shadow-lift">
              <div className="px-3 py-2 sm:hidden">
                <div className="text-sm font-bold text-slate-900">{user.name}</div>
                <div className="text-xs text-slate-500">{ROLE_LABEL[user.role]}</div>
              </div>
              <Link href="/hisob" className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                <UserRound className="size-4 text-slate-400" /> Hisob va xavfsizlik
              </Link>
              <form action={logoutAction}>
                <button className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50">
                  <LogOut className="size-4" /> Chiqish
                </button>
              </form>
            </div>
          </details>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pt-6 pb-32 sm:px-6 lg:pb-14">{children}</main>
      <BottomNav items={nav} />
      <Toaster />
    </div>
  );
}
