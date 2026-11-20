import Link from "next/link";
import { CalendarCheck2, CheckCircle2, PhoneCall, PhoneMissed, UserX, Users } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { absences, adminStats, lessonsOnDate } from "@/lib/data";
import { addDays, formatDate, formatDateShort, today, WEEKDAYS, weekday } from "@/lib/dates";
import { Badge, colorOf, Empty, PageHeader, Stat } from "@/components/ui";
import { CallRow } from "./call-row";

const FILTERS = [
  { key: "pending", label: "Bog'lanish kerak" },
  { key: "done", label: "Bog'lanildi" },
  { key: "all", label: "Hammasi" },
] as const;
const RANGES = [
  { key: "1", label: "Bugun" },
  { key: "7", label: "7 kun" },
  { key: "30", label: "30 kun" },
] as const;

export default async function AdminHome({ searchParams }: { searchParams: Promise<{ f?: string; r?: string }> }) {
  await requireRole("admin");
  const sp = await searchParams;
  const f = FILTERS.find((x) => x.key === sp.f)?.key ?? "pending";
  const r = RANGES.find((x) => x.key === sp.r)?.key ?? "7";
  const t = today();

  const [stats, list, todays] = await Promise.all([
    adminStats(t),
    absences(addDays(t, -(Number(r) - 1)), t),
    lessonsOnDate(t),
  ]);
  const isPending = (s: string) => s === "pending" || s === "no_answer";
  const shown = list.filter((a) => (f === "all" ? true : f === "pending" ? isPending(a.call_status) : !isPending(a.call_status)));
  const href = (nf: string, nr: string) => `/admin?f=${nf}&r=${nr}`;

  return (
    <div>
      <PageHeader title="Kelmaganlar va qo'ng'iroqlar" subtitle="Darsga kelmagan o'quvchilarning ota-onalari bilan bog'laning" />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat icon={Users} label="O'quvchilar" value={stats.students} hint={`${stats.groups} ta guruh`} />
        <Stat icon={UserX} tone="red" label="Bugun kelmadi" value={stats.absent_today} />
        <Stat icon={PhoneMissed} tone="amber" label="Bog'lanish kerak" value={stats.pending_calls} hint="Oxirgi 7 kun" />
        <Stat icon={CalendarCheck2} tone="green" label="Bugungi darslar" value={`${todays.filter((l) => l.marked_at).length}/${todays.length}`} hint="davomat qilingan" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_300px]">
        <section className="card min-w-0">
          <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1">
              {FILTERS.map((x) => (
                <Link key={x.key} href={href(x.key, r)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap ${f === x.key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>
                  {x.label}
                  {x.key === "pending" && <span className="ml-1.5 rounded-full bg-rose-500 px-1.5 text-[10px] text-white">{list.filter((a) => isPending(a.call_status)).length}</span>}
                </Link>
              ))}
            </div>
            <div className="flex gap-1">
              {RANGES.map((x) => (
                <Link key={x.key} href={href(f, x.key)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${r === x.key ? "bg-brand-50 text-brand-700" : "text-slate-500 hover:bg-slate-50"}`}>
                  {x.label}
                </Link>
              ))}
            </div>
          </div>
          {shown.length === 0 ? (
            <Empty
              icon={f === "pending" ? CheckCircle2 : PhoneCall}
              title={f === "pending" ? "Hamma bilan bog'lanildi" : "Ro'yxat bo'sh"}
              text={f === "pending" ? "Tanlangan davrda qo'ng'iroq qilinishi kerak bo'lgan o'quvchi yo'q." : undefined}
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {shown.map((a) => (
                <CallRow
                  key={a.attendance_id}
                  a={{ ...a, dateLabel: a.date === t ? "Bugun" : `${WEEKDAYS[weekday(a.date)]}, ${formatDateShort(a.date)}`, longDate: formatDate(a.date) }}
                />
              ))}
            </ul>
          )}
        </section>

        <aside className="card self-start p-5">
          <h2 className="font-semibold text-slate-900">Bugungi darslar</h2>
          <p className="text-xs text-slate-500">Davomat holati</p>
          {todays.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">Bugun dars yo&apos;q.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {todays.map((l) => (
                <li key={l.id} className="flex items-center gap-3">
                  <span className={`size-2.5 shrink-0 rounded-full ${colorOf(l.color).dot}`} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-slate-800">{l.name}</div>
                    <div className="text-xs text-slate-500">{l.start_time} · {l.room} · {l.teacher_name}</div>
                  </div>
                  {l.marked_at ? (
                    l.absent ? <Badge tone="red">{l.absent} kelmadi</Badge> : <Badge tone="green">To&apos;liq</Badge>
                  ) : (
                    <Badge tone="slate">Kutilmoqda</Badge>
                  )}
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}
