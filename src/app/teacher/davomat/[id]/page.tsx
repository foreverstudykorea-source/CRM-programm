import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Clock, DoorOpen } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getGroup, roster } from "@/lib/data";
import { formatDate, today, WEEKDAYS, weekday } from "@/lib/dates";
import { PageHeader } from "@/components/ui";
import { AttendanceForm } from "./attendance-form";

export default async function AttendancePage({ params, searchParams }: {
  params: Promise<{ id: string }>; searchParams: Promise<{ date?: string }>;
}) {
  const user = await requireRole("teacher");
  const { id } = await params;
  const sp = await searchParams;
  const t = today();
  const date = sp.date && /^\d{4}-\d{2}-\d{2}$/.test(sp.date) ? sp.date : t;
  const group = await getGroup(Number(id));
  if (!group) notFound();
  if (group.teacher_id !== user.id) redirect("/teacher");

  const { lesson, rows } = await roster(group.id, date);
  const scheduled = group.days.split(",").includes(String(weekday(date)));

  return (
    <div>
      <Link href="/teacher" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800">
        <ArrowLeft className="size-4" /> Guruhlarim
      </Link>
      <PageHeader
        title={group.name}
        subtitle={
          <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>{WEEKDAYS[weekday(date)]}, {formatDate(date)}</span>
            <span className="flex items-center gap-1"><Clock className="size-3.5" />{group.start_time} – {group.end_time}</span>
            <span className="flex items-center gap-1"><DoorOpen className="size-3.5" />{group.room}</span>
          </span>
        }
      >
        <form className="flex items-center gap-2">
          <input type="date" name="date" defaultValue={date} max={t} className="input w-auto py-2" />
          <button className="btn-ghost py-2">Ochish</button>
        </form>
      </PageHeader>

      {!scheduled && (
        <div className="mb-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Bu kun guruhning odatiy dars kuni emas. Qo&apos;shimcha dars bo&apos;lsa, davomatni baribir saqlashingiz mumkin.
        </div>
      )}

      <AttendanceForm
        key={`${group.id}-${date}`}
        groupId={group.id}
        date={date}
        topic={lesson?.topic ?? ""}
        markedAt={lesson?.marked_at ?? null}
        future={date > t}
        rows={rows.map((r) => ({ id: r.student_id, name: r.full_name, status: (r.status as "present" | "absent" | "late" | null) ?? null }))}
      />
    </div>
  );
}
