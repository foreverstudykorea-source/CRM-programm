import { requireRole } from "@/lib/auth";
import { navFor } from "@/lib/nav";
import { Shell } from "@/components/shell";

export default async function FinanceLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("finance");
  return (
    <Shell user={user} nav={navFor("finance")}>
      {children}
    </Shell>
  );
}
