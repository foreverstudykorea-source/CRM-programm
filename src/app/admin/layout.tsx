import { requireRole } from "@/lib/auth";
import { Shell } from "@/components/shell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("admin");
  return (
    <Shell
      user={user}
      nav={[
        { href: "/admin", label: "Qo'ng'iroqlar", icon: "PhoneCall" },
        { href: "/admin/oquvchilar", label: "O'quvchilar", icon: "Users" },
        { href: "/admin/guruhlar", label: "Guruhlar", icon: "Layers" },
      ]}
    >
      {children}
    </Shell>
  );
}
