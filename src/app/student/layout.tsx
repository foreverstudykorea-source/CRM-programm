import { requireRole } from "@/lib/auth";
import { navFor } from "@/lib/nav";
import { Shell } from "@/components/shell";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("student");
  return (
    <Shell user={user} nav={navFor("student")}>
      {children}
    </Shell>
  );
}
