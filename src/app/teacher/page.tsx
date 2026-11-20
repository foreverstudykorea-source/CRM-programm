import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock, DoorOpen, Users, CalendarDays } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { teacherGroups } from "@/lib/data";
import { daysLabel, today, weekday } from "@/lib/dates";
import { Badge, colorOf, Empty, PageHeader } from "@/components/ui";

export default async function TeacherHome() {
  const user = await requireRole("teacher");
  const t = today();
  const groups = await teacherGroups(user.id, t);
  const wd = String(weekday(t));
  const todays = groups.filter((g) => g.days.split(",").includes(wd));
  const others = groups.filter((g) => !g.days.split(",").includes(wd));
  const done = todays.filter((g) => g.today_marked).length;

  return (
    <div>
      <PageHeader
        title={`Xush kelibsiz, ${user.name.split(" ")[0]}!`}
        subtitle={todays.length ? `Bugun ${todays.length} ta darsingiz bor · ${done} tasi belgilangan` : "Bugun darsingiz yo'q"}
      />

      <h2 className="mb-3 text-sm font-semibold tracking-wide text-slate-500 uppercase">Bugungi darslar</h2>
      {todays.length === 0 ? (
        <div className="card"><Empty icon={CalendarDays} title="Bugun dars yo'q" text="Boshqa kunlar uchun guruhni tanlab, sanani o'zgartirishingiz mumkin." /></div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {todays.map((g) => <GroupCard key={g.id} g={g} date={t} today />)}
        </div>
      )}

      {others.length > 0 && (
        <>
          <h2 className="mt-8 mb-3 text-sm font-semibold tracking-wide text-slate-500 uppercase">Boshqa guruhlar</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {others.map((g) => <GroupCard key={g.id} g={g} date={t} />)}
          </div>
        </>
      )}
    </div>
  );
}

function GroupCard({ g, date, today: isToday }: {
  g: Awaited<ReturnType<typeof teacherGroups>>[number]; date: string; today?: boolean;
}) {
  const c = colorOf(g.color);
  return (
    <div className="card overflow-hidden">
      <div className={`h-1.5 bg-gradient-to-r ${c.bar}`} />
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-lg font-bold text-slate-900">{g.name}</div>
            <div className="text-sm text-slate-500">{g.subject} · {g.level}</div>
          </div>
          {isToday && (g.today_marked ? <Badge tone="green"><CheckCircle2 className="size-3" /> Belgilangan</Badge> : <Badge tone="amber">Kutilmoqda</Badge>)}
        </div>
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
          <span className="flex items-center gap-1.5"><Clock className="size-4 text-slate-400" />{g.start_time} – {g.end_time}</span>
          <span className="flex items-center gap-1.5"><DoorOpen className="size-4 text-slate-400" />{g.room}</span>
          <span className="flex items-center gap-1.5"><Users className="size-4 text-slate-400" />{g.student_count} o&apos;quvchi</span>
          <span className="flex items-center gap-1.5"><CalendarDays className="size-4 text-slate-400" />{daysLabel(g.days)}</span>
        </div>
        {isToday && g.today_topic && (
          <div className="mt-4 rounded-xl bg-slate-50 px-3.5 py-2.5 text-sm">
            <span className="text-slate-500">Mavzu: </span><span className="font-medium text-slate-800">{g.today_topic}</span>
          </div>
        )}
        <Link
          href={`/teacher/davomat/${g.id}?date=${date}`}
          className={`${isToday && !g.today_marked ? "btn-primary" : "btn-ghost"} mt-5 w-full`}
        >
          {isToday ? (g.today_marked ? "Davomatni ko'rish / tahrirlash" : "Davomat qilish") : "Guruhni ochish"}
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}
