import type { NavItem } from "@/components/nav";
import type { Role } from "./security";

const ACCOUNT: NavItem = { href: "/hisob", label: "Hisob", icon: "ShieldCheck" };

export function navFor(role: Role, badges: { calls?: number } = {}): NavItem[] {
  return [...roleNav(role, badges), ACCOUNT];
}

function roleNav(role: Role, badges: { calls?: number }): NavItem[] {
  switch (role) {
    case "student":
      return [
        { href: "/student", label: "Bugun", icon: "LayoutDashboard" },
        { href: "/student/jadval", label: "Jadval", icon: "CalendarDays" },
      ];
    case "teacher":
      return [{ href: "/teacher", label: "Darslarim", icon: "ClipboardCheck" }];
    case "admin":
      return [
        { href: "/admin", label: "Qo'ng'iroqlar", icon: "PhoneCall", badge: badges.calls },
        { href: "/admin/oquvchilar", label: "O'quvchilar", icon: "Users" },
        { href: "/admin/guruhlar", label: "Guruhlar", icon: "Layers" },
        { href: "/admin/xodimlar", label: "Xodimlar", icon: "UserCog" },
        { href: "/admin/jurnal", label: "Jurnal", icon: "ScrollText" },
      ];
    case "finance":
      return [
        { href: "/finance", label: "Umumiy", icon: "Wallet" },
        { href: "/finance/tolovlar", label: "To'lovlar", icon: "Receipt" },
      ];
  }
}
