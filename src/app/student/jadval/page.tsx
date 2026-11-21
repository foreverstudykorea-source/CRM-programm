import type { Metadata } from "next";
import { CalendarDays } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getStudentByUser, lessonsBetween, studentAttendance } from "@/lib/data";
import { addDays, formatDateShort, today, WEEKDAYS, weekday } from "@/lib/dates";
import { Badge, colorOf, Empty, PageHeader } from "@/components/ui";
import { NoGroup } from "../no-group";

export const metadata: Metadata = { title: "Jadval" };

const MARK = { present: { label: "Keldi", tone: "green" as const }, late: { label: "Kechikdi", tone: "amber" as const }, absent: { label: "Kelmadi", tone: "red" as const } };

export default async function StudentSchedule() {
  const user = await requireRole("student");
  const info = await getStudentByUser(user.id);
  if (!info?.group) return <NoGroup />;
  const { group } = info;
  const t = today();
  const c = colorOf(group.color);
  const days = group.days.split(",").map(Number);
  const [lessons, marks] = await Promise.all([
    lessonsBetween(group.id, addDays(t, -14), addDays(t, 21)),
    studentAttendance(info.student.id, 20),
  ]);
  const markByDate = new Map(marks.map((m) => [m.date, m.status]));
  const upcoming = lessons.filter((l) => l.date >= t);
  const past = lessons.filter((l) => l.date < t).reverse();

  return (
    <div>
      <PageHeader eyebrow="Jadval" title="Dars jadvali" subtitle={`${group.name} · ${group.room} · ${group.start_time} – ${group.end_time}`} />

      <section className="card animate-rise p-4 sm:p-5">
        <h2 className="mb-4 font-bold text-slate-900">Haftalik jadval</h2>
        <div className="grid grid-cols-7 gap-2">
          {[1, 2, 3, 4, 5, 6, 7].map((d) => {
            const has = days.includes(d);
            const isToday = weekday(t) === d;
            return (
              <div
                key={d}
                className={`flex min-h-24 flex-col rounded-xl p-2 text-center sm:p-3 ${
                  has ? `bg-gradient-to-br ${c.grad} text-white shadow-soft` : "bg-slate-50"
                } ${isToday ? "outline-2 outline-offset-2 outline-brand-500" : ""}`}
              >
                <div className={`text-xs font-bold ${has ? "text-white/90" : "text-slate-400"}`}>
                  <span className="sm:hidden">{WEEKDAYS[d].slice(0, 2)}</span>
                  <span className="hidden sm:inline">{WEEKDAYS[d]}</span>
                </div>
                {has ? (
                  <div className="mt-auto text-[11px] leading-tight text-white sm:text-xs">
                    <div className="font-extrabold">{group.start_time}</div>
                    <div className="hidden text-white/80 sm:block">{group.room}</div>
                  </div>
                ) : (
                  <div className="mt-auto text-[11px] text-slate-400">dam</div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <LessonList title="Kelgusi darslar va mavzular" lessons={upcoming} today={t} />
        <LessonList title="O'tilgan mavzular" lessons={past} today={t} muted marks={markByDate} />
      </div>
    </div>
  );
}

function LessonList({ title, lessons, today: t, muted, marks }: {
  title: string; lessons: { date: string; topic: string | null }[]; today: string; muted?: boolean;
  marks?: Map<string, "present" | "late" | "absent">;
}) {
  return (
    <section className="card animate-rise p-5">
      <h2 className="font-bold text-slate-900">{title}</h2>
      {lessons.length === 0 ? (
        <Empty icon={CalendarDays} title="Darslar yo'q" />
      ) : (
        <ol className="mt-3 space-y-2">
          {lessons.map((l) => (
            <li key={l.date} className={`flex items-center gap-3 rounded-xl p-3 ${l.date === t ? "bg-brand-50 ring-1 ring-brand-100" : "hover:bg-slate-50"}`}>
              <div className={`w-14 shrink-0 text-center ${muted ? "text-slate-400" : "text-slate-700"}`}>
                <div className="text-lg leading-none font-bold">{Number(l.date.slice(8))}</div>
                <div className="text-[11px] uppercase">{formatDateShort(l.date).split(" ")[1]}</div>
              </div>
              <div className="min-w-0 flex-1">
                <div className={`truncate text-sm font-medium ${muted ? "text-slate-500" : "text-slate-800"}`}>{l.topic ?? "Mavzu kiritilmagan"}</div>
                <div className="text-xs text-slate-400">{WEEKDAYS[weekday(l.date)]}</div>
              </div>
              {l.date === t && <Badge tone="brand">Bugun</Badge>}
              {marks?.get(l.date) && <Badge tone={MARK[marks.get(l.date)!].tone} dot>{MARK[marks.get(l.date)!].label}</Badge>}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
