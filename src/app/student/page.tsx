import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, CalendarCheck2, Clock, DoorOpen, GraduationCap, UserRound, Wallet } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getStudentByUser, lessonsBetween, paidForMonth, studentAttendance, studentAttendanceStats } from "@/lib/data";
import { addDays, daysLabel, formatDate, formatDateShort, formatMoney, formatMonth, monthOf, today, WEEKDAYS, weekday } from "@/lib/dates";
import { Badge, colorOf, Hero, Ring } from "@/components/ui";
import { Countdown } from "./countdown";
import { NoGroup } from "./no-group";

export const metadata: Metadata = { title: "Bugun" };

const STATUS = {
  present: { label: "Keldi", tone: "green" as const, dot: "bg-emerald-500" },
  late: { label: "Kechikdi", tone: "amber" as const, dot: "bg-amber-400" },
  absent: { label: "Kelmadi", tone: "red" as const, dot: "bg-rose-500" },
};

function greeting() {
  const h = Number(new Intl.DateTimeFormat("en-GB", { timeZone: process.env.APP_TIMEZONE || "Asia/Tashkent", hour: "2-digit", hourCycle: "h23" }).format(new Date()));
  return h < 11 ? "Xayrli tong" : h < 17 ? "Xayrli kun" : "Xayrli kech";
}

export default async function StudentHome() {
  const user = await requireRole("student");
  const info = await getStudentByUser(user.id);
  if (!info?.group) return <NoGroup />;
  const { student, group } = info;
  const t = today();
  const c = colorOf(group.color);

  const [upcoming, history, stats, paid] = await Promise.all([
    lessonsBetween(group.id, t, addDays(t, 21)),
    studentAttendance(student.id, 8),
    studentAttendanceStats(student.id),
    paidForMonth(student.id, monthOf(t)),
  ]);
  const meetsToday = group.days.split(",").map(Number).includes(weekday(t));
  const todayLesson = upcoming.find((l) => l.date === t) ?? null;
  const nextLessons = upcoming.filter((l) => l.date > t).slice(0, 4);
  const featured = meetsToday ? todayLesson : (nextLessons[0] ?? null);
  const rate = stats.total ? Math.round(((stats.present + stats.late) / stats.total) * 100) : 100;
  const firstName = student.full_name.split(" ")[0];
  const debt = Math.max(group.monthly_fee - paid, 0);

  return (
    <div className="space-y-6">
      <Hero>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm font-medium text-white/70">
            {WEEKDAYS[weekday(t)]}, {formatDate(t)}
          </div>
          {meetsToday && (
            <div className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold ring-1 ring-white/20 backdrop-blur">
              <Countdown start={group.start_time} end={group.end_time} />
            </div>
          )}
        </div>
        <h1 className="mt-3 text-[28px] leading-tight font-extrabold tracking-tight sm:text-4xl">
          {greeting()}, {firstName}!
        </h1>
        <p className="mt-1.5 text-white/75">
          {meetsToday ? "Bugun darsingiz bor. Kechikmang!" : "Bugun darsingiz yo'q. Dam oling, keyingi dars quyida."}
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-[1.4fr_1fr]">
          <div className="rounded-2xl bg-white/[0.12] p-5 ring-1 ring-white/20 backdrop-blur-md">
            <div className="text-[11px] font-bold tracking-[0.08em] text-white/60 uppercase">
              {meetsToday ? "Bugungi mavzu" : featured ? `Keyingi dars · ${WEEKDAYS[weekday(featured.date)]}, ${formatDateShort(featured.date)}` : "Keyingi dars"}
            </div>
            <div className="mt-1.5 text-xl font-extrabold sm:text-2xl">{featured?.topic ?? "Mavzu hali kiritilmagan"}</div>
            <div className="mt-2 text-sm text-white/70">
              {group.name} · {group.subject}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <InfoTile icon={Clock} label="Vaqt" value={`${group.start_time}–${group.end_time}`} />
            <InfoTile icon={DoorOpen} label="Xona" value={group.room} />
            <InfoTile icon={GraduationCap} label="Daraja" value={group.level} />
            <InfoTile icon={UserRound} label="Ustoz" value={group.teacher_name ?? "—"} />
          </div>
        </div>
      </Hero>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card flex animate-rise items-center gap-4 p-5" style={{ animationDelay: "60ms" }}>
          <Ring value={rate} size={68} color={rate >= 85 ? "#10b981" : rate >= 70 ? "#f59e0b" : "#f43f5e"}>
            <span className="text-sm font-extrabold text-slate-900">{rate}%</span>
          </Ring>
          <div>
            <div className="text-[13px] font-semibold text-slate-500">Davomat</div>
            <div className="mt-0.5 text-sm text-slate-700">
              {stats.total} darsdan <b>{stats.present + stats.late}</b> tasida
            </div>
          </div>
        </div>
        <div className="card flex animate-rise items-center gap-4 p-5" style={{ animationDelay: "120ms" }}>
          <span className="grid size-[68px] place-items-center rounded-full bg-rose-50 text-2xl font-extrabold text-rose-600">{stats.absent}</span>
          <div>
            <div className="text-[13px] font-semibold text-slate-500">Qoldirilgan darslar</div>
            <div className="mt-0.5 text-sm text-slate-700">{stats.late ? `${stats.late} marta kechikkan` : "Kechikishlar yo'q"}</div>
          </div>
        </div>
        <div className="card flex animate-rise items-center gap-4 p-5" style={{ animationDelay: "180ms" }}>
          <span className={`grid size-[68px] place-items-center rounded-full ${debt ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"}`}>
            <Wallet className="size-7" />
          </span>
          <div>
            <div className="text-[13px] font-semibold text-slate-500">{formatMonth(monthOf(t))} to&apos;lovi</div>
            <div className="mt-0.5 text-sm font-bold text-slate-800">{debt ? `Qoldiq: ${formatMoney(debt)}` : "To'langan ✓"}</div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="card animate-rise p-5 lg:col-span-2" style={{ animationDelay: "200ms" }}>
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-900">Keyingi darslar</h2>
            <Link href="/student/jadval" className="flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700">
              Jadval <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <ol className="relative mt-4 space-y-4 border-l-2 border-dashed border-slate-200 pl-5">
            {nextLessons.length === 0 && <li className="text-sm text-slate-500">Rejalashtirilgan dars yo&apos;q</li>}
            {nextLessons.map((l, i) => (
              <li key={l.id} className="relative">
                <span className={`absolute top-1 -left-[27px] size-3 rounded-full ring-4 ring-white ${i === 0 ? c.dot : "bg-slate-300"}`} />
                <div className="text-xs font-bold text-slate-500">
                  {WEEKDAYS[weekday(l.date)]}, {formatDateShort(l.date)} · {group.start_time}
                </div>
                <div className="mt-0.5 text-sm font-semibold text-slate-800">{l.topic ?? "Mavzu kiritilmagan"}</div>
              </li>
            ))}
          </ol>
          <div className={`mt-5 rounded-xl px-4 py-3 text-sm ${c.soft}`}>
            <span className={`font-bold ${c.text}`}>{daysLabel(group.days)}</span>
            <span className="text-slate-600"> · {group.start_time}–{group.end_time} · {group.room}</span>
          </div>
        </section>

        <section className="card animate-rise p-5 lg:col-span-3" style={{ animationDelay: "260ms" }}>
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-900">Oxirgi darslar</h2>
            <div className="flex gap-1" aria-hidden>
              {history.slice().reverse().map((h) => (
                <span key={h.date} className={`h-5 w-1.5 rounded-full ${STATUS[h.status].dot}`} />
              ))}
            </div>
          </div>
          <ul className="mt-3 divide-y divide-slate-100">
            {history.length === 0 && (
              <li className="flex items-center gap-2 py-6 text-sm text-slate-500">
                <CalendarCheck2 className="size-4" /> Hali davomat yo&apos;q
              </li>
            )}
            {history.map((h) => {
              const s = STATUS[h.status];
              return (
                <li key={h.date} className="flex items-center justify-between gap-3 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-slate-50 text-slate-400 ring-1 ring-slate-100">
                      <BookOpen className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-slate-800">{h.topic ?? "—"}</div>
                      <div className="text-xs text-slate-500">
                        {WEEKDAYS[weekday(h.date)]}, {formatDateShort(h.date)}
                      </div>
                    </div>
                  </div>
                  <Badge tone={s.tone} dot>
                    {s.label}
                  </Badge>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}

function InfoTile({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/[0.08] p-3 ring-1 ring-white/15">
      <Icon className="size-4 text-white/60" />
      <div className="mt-2 text-[10px] font-bold tracking-wider text-white/55 uppercase">{label}</div>
      <div className="truncate text-sm font-bold">{value}</div>
    </div>
  );
}
