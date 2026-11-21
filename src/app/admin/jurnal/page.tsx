import type { Metadata } from "next";
import { ScrollText } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { auditLog } from "@/lib/data";
import { Badge, Empty, PageHeader, Tabs, type BadgeTone } from "@/components/ui";

export const metadata: Metadata = { title: "Jurnal" };

const FILTERS = {
  all: { label: "Hammasi", prefix: undefined },
  auth: { label: "Kirishlar", prefix: "auth." },
  attendance: { label: "Davomat", prefix: "attendance." },
  call: { label: "Qo'ng'iroqlar", prefix: "call." },
  payment: { label: "To'lovlar", prefix: "payment." },
  user: { label: "Hisoblar", prefix: "user." },
  security: { label: "Xavfsizlik", prefix: "security." },
} as const;

const LABEL: Record<string, [string, BadgeTone]> = {
  "auth.login": ["Tizimga kirdi", "green"],
  "auth.logout": ["Chiqdi", "slate"],
  "auth.login_failed": ["Noto'g'ri parol", "red"],
  "auth.login_blocked": ["Kirish bloklandi", "red"],
  "auth.password_changed": ["Parolni almashtirdi", "brand"],
  "auth.sessions_revoked": ["Qurilmalardan chiqdi", "slate"],
  "attendance.marked": ["Davomat belgilandi", "green"],
  "attendance.corrected": ["Davomat tuzatildi", "amber"],
  "lesson.topic": ["Mavzu yozildi", "slate"],
  "call.logged": ["Qo'ng'iroq natijasi", "blue"],
  "payment.added": ["To'lov qabul qilindi", "green"],
  "payment.voided": ["To'lov bekor qilindi", "red"],
  "student.created": ["O'quvchi qo'shildi", "brand"],
  "group.created": ["Guruh yaratildi", "brand"],
  "user.created": ["Xodim qo'shildi", "brand"],
  "user.password_reset": ["Parol tiklandi", "amber"],
  "user.blocked": ["Hisob bloklandi", "red"],
  "user.unblocked": ["Hisob faollashtirildi", "green"],
  "user.sessions_revoked": ["Qurilmalardan chiqarildi", "amber"],
  "security.denied": ["Ruxsatsiz urinish", "red"],
  "setup.completed": ["Tizim sozlandi", "dark"],
  "setup.bad_token": ["Noto'g'ri sozlash kaliti", "red"],
};

const fmt = (ts: string) =>
  new Intl.DateTimeFormat("ru-RU", { timeZone: process.env.APP_TIMEZONE || "Asia/Tashkent", dateStyle: "short", timeStyle: "medium" }).format(new Date(ts));

function describe(details: Record<string, unknown> | null) {
  if (!details) return null;
  return Object.entries(details)
    .filter(([, v]) => v !== undefined && v !== null && typeof v !== "object")
    .map(([k, v]) => `${k}: ${String(v)}`)
    .join(" · ");
}

export default async function AuditPage({ searchParams }: { searchParams: Promise<{ f?: string }> }) {
  await requireRole("admin");
  const sp = await searchParams;
  const f = (sp.f && sp.f in FILTERS ? sp.f : "all") as keyof typeof FILTERS;
  const rows = await auditLog({ action: FILTERS[f].prefix, limit: 300 });

  return (
    <div>
      <PageHeader eyebrow="Xavfsizlik" title="Harakatlar jurnali" subtitle="Kim, qachon, nima qildi. Yozuvlarni o'zgartirib yoki o'chirib bo'lmaydi." />
      <div className="mb-4 overflow-x-auto pb-1">
        <Tabs active={f} items={(Object.keys(FILTERS) as (keyof typeof FILTERS)[]).map((k) => ({ key: k, label: FILTERS[k].label, href: `/admin/jurnal?f=${k}` }))} />
      </div>
      <section className="card animate-rise overflow-hidden">
        {rows.length === 0 ? (
          <Empty icon={ScrollText} title="Yozuvlar yo'q" />
        ) : (
          <ul className="divide-y divide-slate-100">
            {rows.map((r) => {
              const [label, tone] = LABEL[r.action] ?? [r.action, "slate" as BadgeTone];
              const d = describe(r.details);
              return (
                <li key={r.id} className="flex flex-col gap-1 px-5 py-3 sm:flex-row sm:items-center sm:gap-4">
                  <div className="w-36 shrink-0 font-mono text-xs text-slate-400 tabular-nums">{fmt(r.at)}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={tone}>{label}</Badge>
                      <span className="text-sm font-semibold text-slate-800">{r.actor_name ?? "Noma'lum"}</span>
                    </div>
                    {d && <div className="mt-0.5 truncate text-xs text-slate-500">{d}</div>}
                  </div>
                  <div className="font-mono text-xs text-slate-400">{r.ip ?? ""}</div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
