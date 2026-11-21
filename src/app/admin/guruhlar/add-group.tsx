"use client";

import { useRef, useState } from "react";
import type { FormState } from "@/lib/form-state";
import { Plus } from "lucide-react";
import { createGroupAction } from "@/app/actions/staff";
import { Field, FormMessage, SubmitButton, useFormAction, useToast, v } from "@/components/forms";
import { Modal } from "@/components/modal";
import { GROUP_COLORS } from "@/components/ui";
import { WEEKDAYS_SHORT } from "@/lib/dates";

export function AddGroup({ teachers }: { teachers: { id: number; name: string }[] }) {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action] = useFormAction(async (prev: FormState, form: FormData) => {
    const res = await createGroupAction(prev, form);
    if (res?.ok) {
      formRef.current?.reset();
      setOpen(false);
    }
    return res;
  });
  useToast(state);

  return (
    <>
      <button className="btn-primary" onClick={() => setOpen(true)}>
        <Plus className="size-4" /> Yangi guruh
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Yangi guruh" wide>
        <form ref={formRef} action={action} className="grid gap-4 sm:grid-cols-2">
          <Field label="Guruh nomi" name="name" state={state}>
            <input id="name" name="name" className="input" placeholder="English Intermediate" maxLength={60} defaultValue={v(state, "name")} required />
          </Field>
          <Field label="Fan" name="subject" state={state}>
            <input id="subject" name="subject" className="input" placeholder="Ingliz tili" maxLength={60} defaultValue={v(state, "subject")} required />
          </Field>
          <Field label="Daraja" name="level" state={state}>
            <input id="level" name="level" className="input" placeholder="Intermediate (B1)" maxLength={60} defaultValue={v(state, "level")} required />
          </Field>
          <Field label="Xona" name="room" state={state}>
            <input id="room" name="room" className="input" placeholder="104-xona" maxLength={30} defaultValue={v(state, "room")} required />
          </Field>
          <Field label="Ustoz" name="teacher_id" state={state}>
            <select id="teacher_id" name="teacher_id" className="input" defaultValue={v(state, "teacher_id")} key={state?.at}>
              <option value="">Tanlanmagan</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Oylik to'lov (so'm)" name="monthly_fee" state={state}>
            <input id="monthly_fee" name="monthly_fee" className="input" inputMode="numeric" placeholder="500 000" maxLength={15} defaultValue={v(state, "monthly_fee")} />
          </Field>
          <div className="sm:col-span-2">
            <div className="label">Dars kunlari</div>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                <label key={d} className="cursor-pointer">
                  <input type="checkbox" name="days" value={d} defaultChecked={v(state, "days").split(",").includes(String(d))} className="peer sr-only" />
                  <span className="grid h-10 w-12 place-items-center rounded-xl text-sm font-bold text-slate-600 ring-1 ring-slate-200 transition peer-checked:bg-brand-600 peer-checked:text-white peer-checked:ring-brand-600 peer-focus-visible:outline-2 peer-focus-visible:outline-brand-500">
                    {WEEKDAYS_SHORT[d]}
                  </span>
                </label>
              ))}
            </div>
            {state?.field === "days" && <p className="mt-1.5 text-xs font-medium text-rose-600">{state.error}</p>}
          </div>
          <Field label="Boshlanishi" name="start_time" state={state}>
            <input id="start_time" type="time" name="start_time" className="input" defaultValue={v(state, "start_time")} required />
          </Field>
          <Field label="Tugashi" name="end_time" state={state}>
            <input id="end_time" type="time" name="end_time" className="input" defaultValue={v(state, "end_time")} required />
          </Field>
          <div className="sm:col-span-2">
            <div className="label">Rang</div>
            <div className="flex gap-2">
              {Object.entries(GROUP_COLORS).map(([k, c], i) => (
                <label key={k} className="cursor-pointer">
                  <input type="radio" name="color" value={k} defaultChecked={state?.values?.color ? state.values.color === k : i === 0} className="peer sr-only" />
                  <span className={`block size-9 rounded-full bg-gradient-to-br ${c.grad} ring-offset-2 transition peer-checked:ring-2 peer-checked:ring-slate-900`} />
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-3 sm:col-span-2">
            {state?.error && !["days"].includes(state.field ?? "") && <FormMessage state={state} />}
            <SubmitButton className="btn-primary w-full py-3" pendingText="Saqlanmoqda…">
              Guruh yaratish
            </SubmitButton>
          </div>
        </form>
      </Modal>
    </>
  );
}
