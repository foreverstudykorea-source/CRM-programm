import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { activeAdminCount } from "@/lib/data";
import { Logo } from "@/components/logo";
import { SetupForm } from "./setup-form";

export const metadata: Metadata = { title: "Sozlash" };

export default async function SetupPage() {
  // The page exists only until the first administrator is created.
  if ((await activeAdminCount()) > 0) {
    const user = await getCurrentUser();
    // Right after setup the owner stays here to copy the demo passwords.
    if (!user || user.role !== "admin") redirect("/login");
  }
  const tokenConfigured = !!process.env.SETUP_TOKEN && process.env.SETUP_TOKEN.length >= 16;

  return (
    <div className="min-h-dvh bg-surface px-4 py-10">
      <div className="mx-auto max-w-xl">
        <Logo />
        <div className="card mt-8 animate-rise p-6 sm:p-8">
          <div className="eyebrow text-brand-600">Birinchi sozlash</div>
          <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight text-slate-900">Administrator hisobini yarating</h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Bu sahifa faqat bir marta ishlaydi. Administrator yaratilgach, u yopiladi.
          </p>
          <SetupForm tokenConfigured={tokenConfigured} />
        </div>
      </div>
    </div>
  );
}
