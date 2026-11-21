import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { listStaff } from "@/lib/data";
import { Avatar, Badge, PageHeader } from "@/components/ui";
import { ROLE_LABEL } from "@/components/shell";
import { UserActions } from "../user-actions";
import { AddStaff } from "./add-staff";

export const metadata: Metadata = { title: "Xodimlar" };

const fmt = (ts: string | null) =>
  ts ? new Intl.DateTimeFormat("ru-RU", { timeZone: process.env.APP_TIMEZONE || "Asia/Tashkent", dateStyle: "short", timeStyle: "short" }).format(new Date(ts)) : "Hali kirmagan";

const ROLE_TONE = { admin: "dark", finance: "blue", teacher: "brand" } as const;

export default async function StaffPage() {
  const me = await requireRole("admin");
  const staff = await listStaff();
  return (
    <div>
      <PageHeader eyebrow="Administrator" title="Xodimlar" subtitle="Ustozlar, administratorlar va moliya xodimlari hisoblari">
        <AddStaff />
      </PageHeader>

      <div className="mb-4 flex animate-rise items-start gap-3 rounded-2xl bg-gradient-to-r from-brand-50 to-violet-50 p-4 text-sm text-brand-900 ring-1 ring-brand-100">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-brand-600" />
        <p>
          Parollarni tizim o&apos;zi yaratadi va faqat bir marta ko&apos;rsatadi. Xodim birinchi kirishda o&apos;z parolini o&apos;rnatadi. Xodim ishdan
          ketsa, hisobini bloklang: u darhol barcha qurilmalardan chiqariladi.
        </p>
      </div>

      <section className="card animate-rise overflow-hidden" style={{ animationDelay: "60ms" }}>
        <ul className="divide-y divide-slate-100">
          {staff.map((u) => (
            <li key={u.id} className={`flex flex-wrap items-center gap-4 px-5 py-4 ${u.active ? "" : "bg-slate-50 opacity-70"}`}>
              <Avatar name={u.name} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-slate-900">{u.name}</span>
                  <Badge tone={ROLE_TONE[u.role]}>{ROLE_LABEL[u.role]}</Badge>
                  {!u.active && <Badge tone="red">Bloklangan</Badge>}
                  {u.active && !u.has_password && <Badge tone="amber">Parol berilmagan</Badge>}
                  {u.active && u.has_password && u.must_change_password && <Badge tone="amber">Vaqtinchalik parol</Badge>}
                  {u.id === me.id && <Badge tone="green">Siz</Badge>}
                </div>
                <div className="mt-0.5 text-xs text-slate-500">
                  <span className="font-mono">{u.login}</span> · oxirgi kirish: {fmt(u.last_login_at)}
                  {u.sessions > 0 && ` · ${u.sessions} ta faol qurilma`}
                </div>
              </div>
              {u.id !== me.id && <UserActions userId={u.id} name={u.name} active={u.active} />}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
