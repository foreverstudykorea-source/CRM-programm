"use client";

import { useActionState, useState } from "react";
import { Plus, X } from "lucide-react";
import { createGroupAction, type FormState } from "@/app/actions";
import { FormMessage, SubmitButton } from "@/components/forms";
import { GROUP_COLORS } from "@/components/ui";

const DAYS = ["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"];

export function AddGroup({ teachers }: { teachers: { id: number; name: string }[] }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(async (prev: FormState, form: FormData) => {
    const res = await createGroupAction(prev, form);
    if (res?.ok) setOpen(false);
    return res;
  }, undefined);

  return (
    <>
      <button className="btn-primary" onClick={() => setOpen(true)}>
        <Plus className="size-4" /> Yangi guruh
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 backdrop-blur-sm sm:items-center sm:p-4" onClick={() => setOpen(false)}>
          <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Yangi guruh</h2>
              <button onClick={() => setOpen(false)} className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100" aria-label="Yopish">
                <X className="size-4" />
              </button>
            </div>
            <form action={action} className="grid gap-4 sm:grid-cols-2">
              <F label="Guruh nomi *" name="name" required className="sm:col-span-2" placeholder="masalan: English Intermediate" />
              <F label="Fan" name="subject" placeholder="Ingliz tili" />
              <F label="Daraja" name="level" placeholder="Intermediate (B1)" />
              <F label="Xona" name="room" placeholder="104-xona" />
              <div>
                <label className="label">Ustoz</label>
                <select name="teacher_id" className="input">
                  <option value="">Tanlanmagan</option>
                  {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="label">Dars kunlari *</label>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map((d, i) => (
                    <label key={d} className="cursor-pointer">
                      <input type="checkbox" name="days" value={i + 1} className="peer sr-only" />
                      <span className="grid size-10 place-items-center rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 peer-checked:border-brand-600 peer-checked:bg-brand-600 peer-checked:text-white">{d}</span>
                    </label>
                  ))}
                </div>
              </div>
              <F label="Boshlanishi *" name="start_time" type="time" required defaultValue="14:00" />
              <F label="Tugashi *" name="end_time" type="time" required defaultValue="15:30" />
              <F label="Oylik to'lov (so'm)" name="monthly_fee" inputMode="numeric" placeholder="500000" />
              <div>
                <label className="label">Rang</label>
                <div className="flex gap-2 pt-1">
                  {Object.entries(GROUP_COLORS).map(([k, v], i) => (
                    <label key={k} className="cursor-pointer">
                      <input type="radio" name="color" value={k} defaultChecked={i === 0} className="peer sr-only" />
                      <span className={`block size-8 rounded-full ${v.dot} ring-offset-2 peer-checked:ring-2 peer-checked:ring-slate-900`} />
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-3 sm:col-span-2">
                <FormMessage state={state} />
                <SubmitButton className="btn-primary w-full py-3" pendingText="Saqlanmoqda…">Yaratish</SubmitButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function F({ label, className = "", ...props }: { label: string; className?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={className}>
      <label className="label" htmlFor={props.name}>{label}</label>
      <input id={props.name} className="input" {...props} />
    </div>
  );
}
