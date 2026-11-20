import { requireRole } from "@/lib/auth";
import { Shell } from "@/components/shell";

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("teacher");
  return (
    <Shell user={user} nav={[{ href: "/teacher", label: "Guruhlarim", icon: "ClipboardCheck" }]}>
      {children}
    </Shell>
  );
}
