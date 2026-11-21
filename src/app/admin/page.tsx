import type { Metadata } from "next";
import Link from "next/link";
import { CalendarCheck2, CheckCircle2, PhoneCall, PhoneMissed, TrendingDown, UserX } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { absences, adminStats, callHistory, frequentAbsentees, lessonsOnDate } from "@/lib/data";
import { addDays, formatDate, formatDateShort, today, WEEKDAYS, weekday } from "@/lib/dates";
import { Avatar, Badge, colorOf, Empty, PageHeader, SectionTitle, Stat, Tabs } from "@/components/ui";
import { CallCard } from "./call-card";

export const metadata: Metadata = { title: "Qo'ng'iroqlar" };

const RANGES = { today: { label: "Bugun", days: 0 }, week: { label: "7 kun", days: 6 }, month: { label: "30 kun", days: 29 } } as const;
const FILTERS = { todo: "Bog'lanish kerak", done: "Bog'lanildi", all: "Hammasi" } as const;

function nowHHMM() {
  return new Intl.DateTimeFormat("en-GB", { timeZone: process.env.APP_TIMEZONE || "Asia/Tashkent", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date());
}

export default async function AdminHome({ searchParams }: { searchParams: Promise<{ r?: string; f?: string }> }) {
  await requireRole("admin");
  const sp = await searchParams;
  const range = (sp.r && sp.r in RANGES ? sp.r : "week") as keyof typeof RANGES;
  const filter = (sp.f && sp.f in FILTERS ? sp.f : "todo") as keyof typeof FILTERS;
  const t = today();

  const [stats, list, lessons, frequent] = await Promise.all([
    adminStats(t),
    absences(addDays(t, -RANGES[range].days), t),
    lessonsOnDate(t),
    frequentAbsentees(t),
  ]);
  const todo = list.filter((a) => a.call_status === "pending" || a.call_status === "no_answer");
  const shown = filter === "todo" ? todo : filter === "done" ? list.filter((a) => !todo.includes(a)) : list;
  const history = await callHistory(shown.map((a) => a.attendance_id));
  const markedLessons = lessons.filter((l) => l.marked_at).length;
  const now = nowHHMM();
  const href = (r: string, f: string) => `/admin?r=${r}&f=${f}`;

  return (
    <div>
      <PageHeader
        eyebrow="Administrator"
        title="Qo'ng'iroqlar markazi"
        subtitle="Darsga kelmagan o'quvchilarning ota-onalari bilan bog'laning va natijani bir bosishda yozing"
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat icon={PhoneMissed} tone="red" label="Bog'lanish kerak" value={stats.pending_calls} hint="Oxirgi 7 kun" href="/admin?f=todo" />
        <Stat icon={UserX} tone="amber" label="Bugun kelmadi" value={stats.absent_today} hint={`${stats.students} o'quvchidan`} delay={60} />
        <Stat icon={CheckCircle2} tone="green" label="Hal qilindi" value={stats.resolved_week} hint="Oxirgi 7 kun" delay={120} />
        <Stat
          icon={CalendarCheck2}
          tone="brand"
          label="Bugungi davomat"
          value={`${markedLessons}/${lessons.length}`}
          progress={lessons.length ? (markedLessons / lessons.length) * 100 : 0}
          delay={180}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="card min-w-0 animate-rise" style={{ animationDelay: "120ms" }}>
          <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <Tabs
              active={filter}
              items={(Object.keys(FILTERS) as (keyof typeof FILTERS)[]).map((k) => ({
                key: k,
                label: FILTERS[k],
                href: href(range, k),
                count: k === "todo" ? todo.length : undefined,
              }))}
            />
            <Tabs
              active={range}
              items={(Object.keys(RANGES) as (keyof typeof RANGES)[]).map((k) => ({ key: k, label: RANGES[k].label, href: href(k, filter) }))}
            />
          </div>
          {shown.length === 0 ? (
            <Empty
              icon={filter === "todo" ? CheckCircle2 : PhoneCall}
              title={filter === "todo" ? "Hamma bilan bog'lanildi" : "Ro'yxat bo'sh"}
              text={filter === "todo" ? "Yangi kelmaganlar paydo bo'lsa, shu yerda chiqadi." : undefined}
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {shown.map((a) => (
                <CallCard
                  key={a.attendance_id}
                  a={a}
                  dateLabel={a.date === t ? "Bugun" : `${WEEKDAYS[weekday(a.date)]}, ${formatDateShort(a.date)}`}
                  longDate={formatDate(a.date)}
                  history={history.filter((h) => h.attendance_id === a.attendance_id)}
                />
              ))}
            </ul>
          )}
        </section>

        <aside className="space-y-6">
          <section className="card animate-rise" style={{ animationDelay: "180ms" }}>
            <SectionTitle title="Bugungi darslar" hint="Davomat holati" />
            <ul className="space-y-1 p-3">
              {lessons.length === 0 && <li className="px-2 py-4 text-sm text-slate-500">Bugun dars yo&apos;q</li>}
              {lessons.map((l) => {
                const c = colorOf(l.color);
                const overdue = !l.marked_at && l.end_time < now;
                return (
                  <li key={l.id} className="flex items-center gap-3 rounded-xl p-2 hover:bg-slate-50">
                    <span className={`h-9 w-1 shrink-0 rounded-full ${c.dot}`} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-bold text-slate-800">{l.name}</div>
                      <div className="truncate text-xs text-slate-500">
                        {l.start_time} · {l.room} · {l.teacher_name ?? "—"}
                      </div>
                    </div>
                    {l.marked_at ? (
                      l.absent ? <Badge tone="red">{l.absent} kelmadi</Badge> : <Badge tone="green">To&apos;liq</Badge>
                    ) : overdue ? (
                      <Badge tone="amber" dot>Belgilanmagan</Badge>
                    ) : (
                      <Badge tone="slate">Kutilmoqda</Badge>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="card animate-rise" style={{ animationDelay: "240ms" }}>
            <SectionTitle title="E'tibor talab qiladi" hint="30 kunda 2+ marta kelmaganlar" />
            <ul className="space-y-1 p-3">
              {frequent.length === 0 && <li className="px-2 py-4 text-sm text-slate-500">Hammasi yaxshi 👍</li>}
              {frequent.map((f) => (
                <li key={f.student_id} className="flex items-center gap-3 rounded-xl p-2">
                  <Avatar name={f.full_name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold text-slate-800">{f.full_name}</div>
                    <div className="truncate text-xs text-slate-500">{f.group_name ?? "Guruhsiz"}</div>
                  </div>
                  <span className="flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-600">
                    <TrendingDown className="size-3" /> {f.n}
                  </span>
                </li>
              ))}
            </ul>
            <div className="border-t border-slate-100 px-5 py-3">
              <Link href="/admin/oquvchilar" className="text-xs font-bold text-brand-600 hover:text-brand-700">
                Barcha o&apos;quvchilar →
              </Link>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
