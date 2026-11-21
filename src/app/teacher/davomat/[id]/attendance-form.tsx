"use client";

import { useMemo, useState } from "react";
import { Check, CheckCheck, Clock3, Save, X } from "lucide-react";
import { saveAttendanceAction } from "@/app/actions/staff";
import { FormMessage, SubmitButton, useToast, useFormAction, v } from "@/components/forms";
import { Avatar, Empty } from "@/components/ui";
import { Users } from "lucide-react";

type Status = "present" | "late" | "absent";
const OPTIONS: { value: Status; label: string; icon: typeof Check; on: string; idle: string }[] = [
  { value: "present", label: "Keldi", icon: Check, on: "bg-emerald-500 text-white shadow-[0_6px_16px_-6px_rgb(16_185_129/0.8)]", idle: "hover:bg-emerald-50 hover:text-emerald-700" },
  { value: "late", label: "Kechikdi", icon: Clock3, on: "bg-amber-400 text-white shadow-[0_6px_16px_-6px_rgb(245_158_11/0.8)]", idle: "hover:bg-amber-50 hover:text-amber-700" },
  { value: "absent", label: "Kelmadi", icon: X, on: "bg-rose-500 text-white shadow-[0_6px_16px_-6px_rgb(244_63_94/0.8)]", idle: "hover:bg-rose-50 hover:text-rose-700" },
];
const NEXT: Record<Status, Status> = { present: "absent", absent: "late", late: "present" };

export function AttendanceForm({
  groupId,
  date,
  topic,
  rows,
  markedAt,
}: {
  groupId: number;
  date: string;
  topic: string;
  markedAt: string | null;
  rows: { id: number; name: string; status: Status | null; rate: number | null }[];
}) {
  const [state, action] = useFormAction(saveAttendanceAction);
  useToast(state);
  const initial = useMemo(() => Object.fromEntries(rows.map((r) => [r.id, r.status ?? "present"])) as Record<number, Status>, [rows]);
  const [statuses, setStatuses] = useState<Record<number, Status>>(initial);
  const set = (id: number, s: Status) => setStatuses((x) => ({ ...x, [id]: s }));

  const counts = { present: 0, late: 0, absent: 0 };
  Object.values(statuses).forEach((s) => counts[s]++);
  const dirty = rows.some((r) => statuses[r.id] !== initial[r.id]) || !markedAt;

  if (rows.length === 0) {
    return (
      <div className="card">
        <Empty icon={Users} title="Guruhda o'quvchi yo'q" text="Administrator o'quvchilarni guruhga qo'shgach, ro'yxat shu yerda chiqadi." />
      </div>
    );
  }

  return (
    <form action={action} className="grid gap-6 lg:grid-cols-3">
      <input type="hidden" name="group_id" value={groupId} />
      <input type="hidden" name="date" value={date} />
      {rows.map((r) => (
        <input key={r.id} type="hidden" name={`s_${r.id}`} value={statuses[r.id]} />
      ))}

      <section className="card animate-rise lg:col-span-2">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="font-bold text-slate-900">O&apos;quvchilar ({rows.length})</h2>
            <p className="text-xs text-slate-500">Hamma &quot;Keldi&quot; turibdi. Faqat kelmaganlarni bosing.</p>
          </div>
          <button
            type="button"
            onClick={() => setStatuses(Object.fromEntries(rows.map((r) => [r.id, "present"])))}
            className="btn-soft btn-sm"
          >
            <CheckCheck className="size-4" /> Hammasi keldi
          </button>
        </div>
        <ul className="divide-y divide-slate-100">
          {rows.map((r, i) => {
            const s = statuses[r.id];
            return (
              <li
                key={r.id}
                className={`flex animate-rise flex-col gap-3 px-5 py-3.5 transition sm:flex-row sm:items-center sm:justify-between ${
                  s === "absent" ? "bg-rose-50/50" : s === "late" ? "bg-amber-50/40" : ""
                }`}
                style={{ animationDelay: `${Math.min(i * 25, 400)}ms` }}
              >
                <button
                  type="button"
                  onClick={() => set(r.id, NEXT[s])}
                  className="flex min-w-0 items-center gap-3 text-left"
                  title="Bosib holatni almashtiring"
                >
                  <span className="relative">
                    <Avatar name={r.name} />
                    <span
                      className={`absolute -right-0.5 -bottom-0.5 size-3.5 rounded-full ring-2 ring-white ${
                        s === "present" ? "bg-emerald-500" : s === "late" ? "bg-amber-400" : "bg-rose-500"
                      }`}
                    />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-slate-800">{r.name}</span>
                    {r.rate != null && (
                      <span className={`text-xs ${r.rate < 75 ? "font-semibold text-rose-600" : "text-slate-500"}`}>Davomat {r.rate}%</span>
                    )}
                  </span>
                </button>
                <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100/80 p-1 sm:flex">
                  {OPTIONS.map((o) => {
                    const on = s === o.value;
                    return (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => set(r.id, o.value)}
                        aria-pressed={on}
                        className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition active:scale-95 ${
                          on ? o.on : `text-slate-500 ${o.idle}`
                        }`}
                      >
                        <o.icon className="size-3.5" strokeWidth={2.6} />
                        {o.label}
                      </button>
                    );
                  })}
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <section className="card animate-rise p-5" style={{ animationDelay: "80ms" }}>
          <label htmlFor="topic" className="label">
            Bugungi mavzu
          </label>
          <input id="topic" name="topic" defaultValue={v(state, "topic", topic)} className="input" placeholder="Masalan, Present Perfect" maxLength={200} />
          <p className="mt-1.5 text-xs text-slate-500">O&apos;quvchilar o&apos;z sahifasida ko&apos;radi</p>
        </section>

        <section className="card animate-rise p-5" style={{ animationDelay: "140ms" }}>
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { n: counts.present, l: "Keldi", c: "text-emerald-600 bg-emerald-50" },
              { n: counts.late, l: "Kechikdi", c: "text-amber-600 bg-amber-50" },
              { n: counts.absent, l: "Kelmadi", c: "text-rose-600 bg-rose-50" },
            ].map((x) => (
              <div key={x.l} className={`rounded-xl py-3 ${x.c}`}>
                <div className="text-2xl font-extrabold tabular-nums">{x.n}</div>
                <div className="text-[11px] font-bold">{x.l}</div>
              </div>
            ))}
          </div>
          {counts.absent > 0 && (
            <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
              Saqlangach, {counts.absent} ta kelmagan o&apos;quvchi ota-onasiga qo&apos;ng&apos;iroq qilish uchun administratorga yuboriladi.
            </p>
          )}
          <div className="mt-4 hidden space-y-3 lg:block">
            <FormMessage state={state} />
            <SubmitButton className="btn-primary w-full py-3" pendingText="Saqlanmoqda…" disabled={!dirty}>
              <Save className="size-4" /> {markedAt ? "O'zgarishlarni saqlash" : "Davomatni saqlash"}
            </SubmitButton>
          </div>
          {markedAt && <p className="mt-3 text-center text-xs text-slate-400">Avval saqlangan. Istalgan vaqtda tuzatishingiz mumkin.</p>}
        </section>
      </aside>

      <div className="h-16 lg:hidden" aria-hidden />
      {/* Mobile: the save button stays above the bottom navigation. */}
      <div className="fixed inset-x-3 bottom-[88px] z-30 lg:hidden">
        <SubmitButton className="btn-primary w-full py-3.5 shadow-lift" pendingText="Saqlanmoqda…" disabled={!dirty}>
          <Save className="size-4" /> Saqlash · {counts.present + counts.late}/{rows.length} keldi
        </SubmitButton>
      </div>
    </form>
  );
}
