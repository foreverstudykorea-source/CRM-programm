import { requireRole } from "@/lib/auth";
import { Shell } from "@/components/shell";

export default async function FinanceLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("finance");
  return (
    <Shell
      user={user}
      nav={[
        { href: "/finance", label: "Umumiy", icon: "LayoutDashboard" },
        { href: "/finance/tolovlar", label: "To'lovlar", icon: "Wallet" },
      ]}
    >
      {children}
    </Shell>
  );
}
