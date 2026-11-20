"use client";

import { useActionState, useState } from "react";
import { Check, Clock3, X, CheckCheck, Save } from "lucide-react";
import { saveAttendanceAction } from "@/app/actions";
import { FormMessage, SubmitButton } from "@/components/forms";
import { Avatar } from "@/components/ui";

type Status = "present" | "absent" | "late";
const OPTIONS: { value: Status; label: string; icon: typeof Check; on: string }[] = [
  { value: "present", label: "Keldi", icon: Check, on: "bg-emerald-500 text-white shadow-sm shadow-emerald-500/30" },
  { value: "late", label: "Kechikdi", icon: Clock3, on: "bg-amber-400 text-white shadow-sm shadow-amber-400/30" },
  { value: "absent", label: "Kelmadi", icon: X, on: "bg-rose-500 text-white shadow-sm shadow-rose-500/30" },
];

export function AttendanceForm({ groupId, date, topic, rows, markedAt, future }: {
  groupId: number; date: string; topic: string; markedAt: string | null; future: boolean;
  rows: { id: number; name: string; status: Status | null }[];
}) {
  const [state, action] = useActionState(saveAttendanceAction, undefined);
  const [statuses, setStatuses] = useState<Record<number, Status>>(
    Object.fromEntries(rows.map((r) => [r.id, r.status ?? "present"])),
  );
  const counts = { present: 0, late: 0, absent: 0 };
  Object.values(statuses).forEach((s) => counts[s]++);

  return (
    <form action={action} className="grid gap-6 lg:grid-cols-3">
      <input type="hidden" name="group_id" value={groupId} />
      <input type="hidden" name="date" value={date} />

      <section className="card lg:col-span-2">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="font-semibold text-slate-900">O&apos;quvchilar ({rows.length})</h2>
            <p className="text-xs text-slate-500">Har bir o&apos;quvchi uchun holatni tanlang</p>
          </div>
          <button
            type="button"
            onClick={() => setStatuses(Object.fromEntries(rows.map((r) => [r.id, "present"])))}
            className="btn-ghost py-2 text-xs"
          >
            <CheckCheck className="size-4" /> Hammasi keldi
          </button>
        </div>
        <ul className="divide-y divide-slate-100">
          {rows.map((r, i) => (
            <li key={r.id} className="flex flex-col gap-3 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="w-5 text-right text-xs text-slate-400">{i + 1}</span>
                <Avatar name={r.name} />
                <span className="font-medium text-slate-800">{r.name}</span>
              </div>
              <input type="hidden" name={`s_${r.id}`} value={statuses[r.id]} />
              <div className="flex gap-1 rounded-xl bg-slate-100 p-1" role="radiogroup" aria-label={r.name}>
                {OPTIONS.map((o) => {
                  const active = statuses[r.id] === o.value;
                  return (
                    <button
                      key={o.value}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setStatuses((s) => ({ ...s, [r.id]: o.value }))}
                      className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition sm:flex-none ${
                        active ? o.on : "text-slate-500 hover:bg-white hover:text-slate-800"
                      }`}
                    >
                      <o.icon className="size-3.5" /> {o.label}
                    </button>
                  );
                })}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <section className="card p-5">
          <label className="label" htmlFor="topic">Bugungi mavzu</label>
          <textarea id="topic" name="topic" defaultValue={topic} rows={3} className="input resize-none" placeholder="Masalan: Present Perfect" />
          <p className="mt-1.5 text-xs text-slate-500">O&apos;quvchilar bu mavzuni o&apos;z sahifasida ko&apos;radi.</p>
        </section>
        <section className="card p-5">
          <div className="grid grid-cols-3 gap-2 text-center">
            <Count label="Keldi" n={counts.present} cls="text-emerald-600" />
            <Count label="Kechikdi" n={counts.late} cls="text-amber-500" />
            <Count label="Kelmadi" n={counts.absent} cls="text-rose-600" />
          </div>
          {counts.absent > 0 && (
            <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">
              Kelmaganlar ro&apos;yxati saqlangandan so&apos;ng administratorga ota-onasiga qo&apos;ng&apos;iroq qilish uchun yuboriladi.
            </p>
          )}
          <div className="mt-4 space-y-3">
            <FormMessage state={state} />
            {future ? (
              <p className="text-sm text-slate-500">Kelajakdagi dars uchun davomat belgilab bo&apos;lmaydi.</p>
            ) : (
              <SubmitButton className="btn-primary w-full py-3" pendingText="Saqlanmoqda…">
                <Save className="size-4" /> {markedAt ? "Yangilash" : "Davomatni saqlash"}
              </SubmitButton>
            )}
          </div>
        </section>
      </aside>
    </form>
  );
}

function Count({ label, n, cls }: { label: string; n: number; cls: string }) {
  return (
    <div className="rounded-xl bg-slate-50 py-3">
      <div className={`text-2xl font-bold ${cls}`}>{n}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}
