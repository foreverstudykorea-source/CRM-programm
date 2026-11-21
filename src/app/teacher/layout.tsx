import { requireRole } from "@/lib/auth";
import { navFor } from "@/lib/nav";
import { Shell } from "@/components/shell";

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("teacher");
  return (
    <Shell user={user} nav={navFor("teacher")}>
      {children}
    </Shell>
  );
}
