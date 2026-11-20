"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen, CalendarDays, ClipboardCheck, GraduationCap, LayoutDashboard, PhoneCall, Users, Wallet, Layers,
} from "lucide-react";

const ICONS = { BookOpen, CalendarDays, ClipboardCheck, GraduationCap, LayoutDashboard, PhoneCall, Users, Wallet, Layers };
export type IconName = keyof typeof ICONS;
export type NavItem = { href: string; label: string; icon: IconName };

function isActive(pathname: string, href: string, all: NavItem[]) {
  if (pathname === href) return true;
  // Highlight the most specific matching item only.
  const best = all.filter((i) => pathname.startsWith(i.href + "/") || pathname === i.href).sort((a, b) => b.href.length - a.href.length)[0];
  return best?.href === href;
}

export function SideNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const Icon = ICONS[item.icon];
        const active = isActive(pathname, item.href, items);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
              active ? "bg-white/15 text-white shadow-inner" : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Icon className="size-[18px]" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function BottomNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-md justify-around">
        {items.map((item) => {
          const Icon = ICONS[item.icon];
          const active = isActive(pathname, item.href, items);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold ${
                active ? "text-brand-600" : "text-slate-500"
              }`}
            >
              <Icon className="size-5" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
