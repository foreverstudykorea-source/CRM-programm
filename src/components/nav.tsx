"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  GraduationCap,
  LayoutDashboard,
  Layers,
  PhoneCall,
  Receipt,
  ScrollText,
  ShieldCheck,
  UserCog,
  Users,
  Wallet,
} from "lucide-react";

const ICONS = {
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  GraduationCap,
  LayoutDashboard,
  Layers,
  PhoneCall,
  Receipt,
  ScrollText,
  ShieldCheck,
  UserCog,
  Users,
  Wallet,
};
export type IconName = keyof typeof ICONS;
export type NavItem = { href: string; label: string; icon: IconName; badge?: number };

function activeHref(pathname: string, all: NavItem[]) {
  return all
    .filter((i) => pathname === i.href || pathname.startsWith(i.href + "/"))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;
}

export function SideNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const active = activeHref(pathname, items);
  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const Icon = ICONS[item.icon];
        const on = active === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={on ? "page" : undefined}
            className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
              on ? "bg-white/[0.09] text-white" : "text-white/55 hover:bg-white/[0.05] hover:text-white"
            }`}
          >
            {on && <span className="absolute top-2 bottom-2 -left-4 w-1 rounded-r-full bg-gradient-to-b from-brand-400 to-fuchsia-400" />}
            <span
              className={`grid size-8 place-items-center rounded-lg transition ${
                on ? "bg-gradient-to-br from-brand-500 to-violet-600 text-white shadow-glow" : "bg-white/[0.06] group-hover:bg-white/10"
              }`}
            >
              <Icon className="size-4" />
            </span>
            <span className="flex-1">{item.label}</span>
            {!!item.badge && (
              <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-[0_0_0_3px_rgb(244_63_94/0.2)]">
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

export function BottomNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const active = activeHref(pathname, items);
  return (
    <nav className="fixed inset-x-3 bottom-3 z-40 rounded-2xl border border-white/60 bg-white/85 px-1.5 pb-[env(safe-area-inset-bottom)] shadow-lift backdrop-blur-xl lg:hidden">
      <div className="mx-auto flex max-w-md justify-around">
        {/* At most five tabs fit on a phone; the account page is also in the avatar menu. */}
        {(items.length > 5 ? items.filter((i) => i.href !== "/hisob") : items).map((item) => {
          const Icon = ICONS[item.icon];
          const on = active === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={on ? "page" : undefined}
              className={`relative flex flex-1 flex-col items-center gap-1 py-2 text-[10.5px] font-bold transition ${
                on ? "text-brand-600" : "text-slate-400"
              }`}
            >
              <span className={`grid h-7 w-12 place-items-center rounded-full transition ${on ? "bg-brand-50" : ""}`}>
                <Icon className="size-[19px]" />
              </span>
              <span className="max-w-full truncate px-0.5">{item.label}</span>
              {!!item.badge && (
                <span className="absolute top-1 right-[calc(50%-22px)] grid min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[9px] text-white">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
