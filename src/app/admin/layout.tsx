import { requireRole } from "@/lib/auth";
import { adminStats } from "@/lib/data";
import { today } from "@/lib/dates";
import { navFor } from "@/lib/nav";
import { Shell } from "@/components/shell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("admin");
  const stats = await adminStats(today());
  return (
    <Shell user={user} nav={navFor("admin", { calls: stats.pending_calls })}>
      {children}
    </Shell>
  );
}
