import { requireRole } from "@/lib/auth";
import { Shell } from "@/components/shell";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("student");
  return (
    <Shell
      user={user}
      nav={[
        { href: "/student", label: "Bugun", icon: "LayoutDashboard" },
        { href: "/student/jadval", label: "Jadval", icon: "CalendarDays" },
      ]}
    >
      {children}
    </Shell>
  );
}
