import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Clock, DoorOpen, GraduationCap } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getGroup, groupMeetsOn, roster } from "@/lib/data";
import { addDays, formatDateShort, today, WEEKDAYS_SHORT, weekday } from "@/lib/dates";
import { colorOf, PageHeader } from "@/components/ui";
import { id as idSchema, isoDate } from "@/lib/validation";
import { AttendanceForm } from "./attendance-form";
import { TopicForm } from "./topic-form";

export const metadata: Metadata = { title: "Davomat" };

const EDIT_DAYS = 3;

export default async function AttendancePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const user = await requireRole("teacher");
  const gid = idSchema.safeParse((await params).id);
  if (!gid.success) notFound();
  const group = await getGroup(gid.data);
  if (!group) notFound();
  if (group.teacher_id !== user.id) redirect("/teacher");

  const t = today();
  // Recent lesson days (editable) and the next lesson (topic planning only).
  const recent: string[] = [];
  for (let d = 0; d >= -EDIT_DAYS; d--) if (groupMeetsOn(group, addDays(t, d))) recent.push(addDays(t, d));
  let next: string | null = null;
  for (let d = 1; d <= 14 && !next; d++) if (groupMeetsOn(group, addDays(t, d))) next = addDays(t, d);

  const requested = isoDate.safeParse((await searchParams).date);
  const allowed = [...recent, ...(next ? [next] : [])];
  const date = requested.success && allowed.includes(requested.data) ? requested.data : (recent[0] ?? next ?? t);
  const future = date > t;

  const { lesson, rows } = await roster(group.id, date);
  const c = colorOf(group.color);

  return (
    <div>
      <Link href="/teacher" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800">
        <ArrowLeft className="size-4" /> Darslarim
      </Link>
      <PageHeader
        eyebrow={group.subject}
        title={group.name}
        subtitle={
          <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="flex items-center gap-1.5">
              <Clock className="size-3.5" /> {group.start_time}–{group.end_time}
            </span>
            <span className="flex items-center gap-1.5">
              <DoorOpen className="size-3.5" /> {group.room}
            </span>
            <span className="flex items-center gap-1.5">
              <GraduationCap className="size-3.5" /> {group.level}
            </span>
          </span>
        }
      />

      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        {allowed.map((d) => {
          const on = d === date;
          return (
            <Link
              key={d}
              href={`/teacher/davomat/${group.id}?date=${d}`}
              scroll={false}
              className={`flex min-w-[78px] shrink-0 flex-col items-center rounded-2xl px-3 py-2.5 text-center transition ${
                on ? `bg-gradient-to-br ${c.grad} text-white shadow-lift` : "card text-slate-600 hover:border-slate-300"
              }`}
            >
              <span className={`text-[11px] font-bold uppercase ${on ? "text-white/80" : "text-slate-400"}`}>
                {d === t ? "Bugun" : d > t ? "Keyingi" : WEEKDAYS_SHORT[weekday(d)]}
              </span>
              <span className="text-sm font-extrabold">{formatDateShort(d)}</span>
            </Link>
          );
        })}
      </div>

      {future ? (
        <TopicForm key={date} groupId={group.id} date={date} topic={lesson?.topic ?? ""} />
      ) : (
        <AttendanceForm
          key={`${group.id}-${date}-${lesson?.marked_at ?? ""}`}
          groupId={group.id}
          date={date}
          topic={lesson?.topic ?? ""}
          markedAt={lesson?.marked_at ?? null}
          rows={rows.map((r) => ({ id: r.student_id, name: r.full_name, status: r.status, rate: r.rate }))}
        />
      )}
    </div>
  );
}
