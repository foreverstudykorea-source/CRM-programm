import { BookOpen, CalendarX2, CheckCircle2, Clock, DoorOpen, GraduationCap, Wallet, UserRound, Sparkles } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getStudentByUser, lessonsBetween, paidForMonth, studentAttendance, studentAttendanceStats } from "@/lib/data";
import { addDays, formatDate, formatDateShort, formatMoney, monthOf, today, WEEKDAYS, weekday, daysLabel } from "@/lib/dates";
import { Badge, colorOf, Stat } from "@/components/ui";
import { NoGroup } from "./no-group";

const STATUS = {
  present: { label: "Keldi", tone: "green" as const, dot: "bg-emerald-500" },
  late: { label: "Kechikdi", tone: "amber" as const, dot: "bg-amber-400" },
  absent: { label: "Kelmadi", tone: "red" as const, dot: "bg-rose-500" },
};

export default async function StudentHome() {
  const user = await requireRole("student");
  const info = await getStudentByUser(user.id);
  if (!info?.group) return <NoGroup />;
  const { student, group } = info;
  const t = today();
  const c = colorOf(group.color);

  const [upcoming, history, stats, paid] = await Promise.all([
    lessonsBetween(group.id, t, addDays(t, 21)),
    studentAttendance(student.id, 10),
    studentAttendanceStats(student.id),
    paidForMonth(student.id, monthOf(t)),
  ]);
  const todayLesson = upcoming.find((l) => l.date === t) ?? null;
  const next = upcoming.find((l) => l.date > t) ?? null;
  const featured = todayLesson ?? next;
  const rate = stats.total ? Math.round(((stats.present + stats.late) / stats.total) * 100) : 100;
  const firstName = student.full_name.split(" ")[0];
  const debt = Math.max(group.monthly_fee - paid, 0);

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#312e81] via-brand-600 to-violet-600 p-6 text-white shadow-lg shadow-brand-600/20 sm:p-8">
        <div className="pointer-events-none absolute -top-20 -right-10 size-72 rounded-full bg-white/10 blur-2xl" />
        <div className="relative">
          <div className="flex items-center gap-2 text-sm text-white/75">
            <Sparkles className="size-4" /> {WEEKDAYS[weekday(t)]}, {formatDate(t)}
          </div>
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Salom, {firstName}!</h1>
          <p className="mt-1 text-white/75">
            {todayLesson ? "Bugun darsingiz bor. Kechikmang!" : "Bugun darsingiz yo'q. Keyingi dars quyida."}
          </p>

          {featured && (
            <div className="mt-6 rounded-2xl bg-white/10 p-5 ring-1 ring-white/20 backdrop-blur">
              <div className="text-xs font-semibold tracking-wider text-white/60 uppercase">
                {todayLesson ? "Bugungi mavzu" : `Keyingi dars · ${WEEKDAYS[weekday(featured.date)]}, ${formatDateShort(featured.date)}`}
              </div>
              <div className="mt-1 text-xl font-bold sm:text-2xl">{featured.topic ?? "Mavzu hali kiritilmagan"}</div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <Info icon={Clock} label="Vaqt" value={`${group.start_time} – ${group.end_time}`} />
                <Info icon={DoorOpen} label="Xona" value={group.room} />
                <Info icon={GraduationCap} label="Daraja" value={group.level} />
                <Info icon={UserRound} label="Ustoz" value={group.teacher_name ?? "—"} />
              </div>
            </div>
          )}
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat icon={CheckCircle2} tone="green" label="Davomat" value={`${rate}%`} hint={`${stats.total} ta darsdan ${stats.present + stats.late} tasida`} />
        <Stat icon={CalendarX2} tone="red" label="Qoldirilgan darslar" value={stats.absent} hint={stats.late ? `${stats.late} marta kechikkan` : "Kechikishlar yo'q"} />
        <Stat
          icon={Wallet}
          tone={debt ? "amber" : "green"}
          label="Bu oy to'lov"
          value={debt ? "Qarz bor" : "To'langan"}
          hint={debt ? `Qoldiq: ${formatMoney(debt)}` : formatMoney(paid)}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="card p-5 lg:col-span-2">
          <h2 className="font-semibold text-slate-900">Mening guruhim</h2>
          <div className={`mt-4 rounded-2xl p-4 ${c.soft}`}>
            <div className={`text-lg font-bold ${c.text}`}>{group.name}</div>
            <div className="mt-1 text-sm text-slate-600">{group.subject} · {group.level}</div>
          </div>
          <dl className="mt-4 space-y-3 text-sm">
            <Row label="Dars kunlari" value={daysLabel(group.days)} />
            <Row label="Vaqti" value={`${group.start_time} – ${group.end_time}`} />
            <Row label="Xona" value={group.room} />
            <Row label="Ustoz" value={group.teacher_name ?? "—"} />
          </dl>
        </section>

        <section className="card p-5 lg:col-span-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Oxirgi darslar</h2>
            <div className="flex gap-1">
              {history.slice().reverse().map((h) => (
                <span key={h.date} title={STATUS[h.status as keyof typeof STATUS].label} className={`size-2.5 rounded-full ${STATUS[h.status as keyof typeof STATUS].dot}`} />
              ))}
            </div>
          </div>
          <ul className="mt-3 divide-y divide-slate-100">
            {history.length === 0 && <li className="py-6 text-center text-sm text-slate-500">Hali davomat yo&apos;q</li>}
            {history.map((h) => {
              const s = STATUS[h.status as keyof typeof STATUS];
              return (
                <li key={h.date} className="flex items-center justify-between gap-3 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-slate-50 text-slate-500">
                      <BookOpen className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-slate-800">{h.topic ?? "—"}</div>
                      <div className="text-xs text-slate-500">{WEEKDAYS[weekday(h.date)]}, {formatDateShort(h.date)}</div>
                    </div>
                  </div>
                  <Badge tone={s.tone}>{s.label}</Badge>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}

function Info({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 size-4 shrink-0 text-white/60" />
      <div className="min-w-0">
        <div className="text-[11px] text-white/60 uppercase">{label}</div>
        <div className="truncate font-semibold">{value}</div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-slate-800">{value}</dd>
    </div>
  );
}
