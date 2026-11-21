import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarOff, CheckCircle2, Clock, DoorOpen, Users } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { groupMeetsOn, teacherGroups } from "@/lib/data";
import { daysLabel, formatDate, today, WEEKDAYS, weekday } from "@/lib/dates";
import { Badge, colorOf, Empty, Hero, Ring } from "@/components/ui";

export const metadata: Metadata = { title: "Darslarim" };

export default async function TeacherHome() {
  const user = await requireRole("teacher");
  const t = today();
  const groups = await teacherGroups(user.id, t);
  const todays = groups.filter((g) => groupMeetsOn(g, t));
  const others = groups.filter((g) => !groupMeetsOn(g, t));
  const done = todays.filter((g) => g.marked_at).length;
  const students = groups.reduce((a, g) => a + g.student_count, 0);

  return (
    <div className="space-y-8">
      <Hero>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-medium text-white/70">
              {WEEKDAYS[weekday(t)]}, {formatDate(t)}
            </div>
            <h1 className="mt-2 text-[28px] leading-tight font-extrabold tracking-tight sm:text-4xl">
              Salom, {user.name.split(" ")[0]}!
            </h1>
            <p className="mt-1.5 text-white/75">
              {todays.length === 0
                ? "Bugun darsingiz yo'q."
                : done === todays.length
                  ? "Bugungi barcha darslar belgilandi. Rahmat!"
                  : `Bugun ${todays.length} ta dars. ${todays.length - done} tasida davomat kutilmoqda.`}
            </p>
          </div>
          <div className="flex items-center gap-4 rounded-2xl bg-white/10 p-4 ring-1 ring-white/15 backdrop-blur">
            <Ring value={todays.length ? (done / todays.length) * 100 : 100} size={64} color="#ffffff" track="rgb(255 255 255 / 0.18)">
              <span className="text-sm font-extrabold">
                {done}/{todays.length}
              </span>
            </Ring>
            <div className="text-sm">
              <div className="font-bold">Davomat</div>
              <div className="text-white/65">{students} o&apos;quvchi · {groups.length} guruh</div>
            </div>
          </div>
        </div>
      </Hero>

      <section>
        <h2 className="mb-3 text-lg font-extrabold text-slate-900">Bugungi darslar</h2>
        {todays.length === 0 ? (
          <div className="card">
            <Empty icon={CalendarOff} title="Bugun dars yo'q" text="Keyingi darslaringiz quyidagi guruhlarda." />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {todays.map((g, i) => {
              const c = colorOf(g.color);
              const marked = !!g.marked_at;
              const total = g.present + g.late + g.absent;
              return (
                <Link
                  key={g.id}
                  href={`/teacher/davomat/${g.id}`}
                  className="card card-hover group relative animate-rise overflow-hidden p-5"
                  style={{ animationDelay: `${i * 70}ms` }}
                >
                  <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${c.grad}`} />
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-lg font-extrabold text-slate-900">{g.name}</div>
                      <div className="text-sm text-slate-500">{g.level}</div>
                    </div>
                    {marked ? (
                      <Badge tone="green" dot>
                        Belgilandi
                      </Badge>
                    ) : (
                      <Badge tone="amber" dot>
                        Kutilmoqda
                      </Badge>
                    )}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <Clock className="size-4 text-slate-400" /> {g.start_time}–{g.end_time}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <DoorOpen className="size-4 text-slate-400" /> {g.room}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Users className="size-4 text-slate-400" /> {g.student_count}
                    </span>
                  </div>
                  <div className="mt-3 truncate rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
                    <span className="font-semibold text-slate-800">Mavzu:</span> {g.topic ?? "kiritilmagan"}
                  </div>
                  {marked && total > 0 && (
                    <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className="bg-emerald-500" style={{ width: `${(g.present / total) * 100}%` }} />
                      <div className="bg-amber-400" style={{ width: `${(g.late / total) * 100}%` }} />
                      <div className="bg-rose-500" style={{ width: `${(g.absent / total) * 100}%` }} />
                    </div>
                  )}
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      {marked ? `${g.present} keldi · ${g.late} kechikdi · ${g.absent} kelmadi` : "Bir bosishda belgilang"}
                    </span>
                    <span className={`flex items-center gap-1 text-sm font-bold ${marked ? "text-slate-500" : "text-brand-600"}`}>
                      {marked ? "Tahrirlash" : "Davomat qilish"}
                      <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {others.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-extrabold text-slate-900">Boshqa guruhlarim</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((g) => {
              const c = colorOf(g.color);
              return (
                <Link key={g.id} href={`/teacher/davomat/${g.id}`} className="card card-hover flex items-center gap-3 p-4">
                  <span className={`size-10 shrink-0 rounded-xl bg-gradient-to-br ${c.grad}`} />
                  <div className="min-w-0">
                    <div className="truncate font-bold text-slate-800">{g.name}</div>
                    <div className="text-xs text-slate-500">
                      {daysLabel(g.days)} · {g.start_time} · {g.room}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
      <p className="flex items-center gap-1.5 text-xs text-slate-400">
        <CheckCircle2 className="size-3.5" /> Kelmagan o&apos;quvchilar avtomatik ravishda administratorga yuboriladi.
      </p>
    </div>
  );
}
