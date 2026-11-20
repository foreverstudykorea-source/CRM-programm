"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { createStudentAction } from "@/app/actions";
import { FormMessage, SubmitButton } from "@/components/forms";

export function AddStudent({ groups }: { groups: { id: number; name: string }[] }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(createStudentAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <>
      <button className="btn-primary" onClick={() => setOpen(true)}>
        <Plus className="size-4" /> Yangi o&apos;quvchi
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={() => setOpen(false)}>
          <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Yangi o&apos;quvchi</h2>
              <button onClick={() => setOpen(false)} className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100" aria-label="Yopish">
                <X className="size-4" />
              </button>
            </div>
            <form ref={formRef} action={action} className="grid gap-4 sm:grid-cols-2">
              <Field label="Ism familiya *" name="full_name" required className="sm:col-span-2" />
              <Field label="Telefon" name="phone" placeholder="+998 90 123 45 67" />
              <div>
                <label className="label">Guruh</label>
                <select name="group_id" className="input">
                  <option value="">Tanlanmagan</option>
                  {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
              <Field label="Ota-ona ismi" name="parent_name" />
              <Field label="Ota-ona telefoni" name="parent_phone" placeholder="+998 90 123 45 67" />
              <div className="rounded-xl bg-slate-50 p-4 sm:col-span-2">
                <div className="mb-3 text-sm font-semibold text-slate-700">O&apos;quvchi kabineti (ixtiyoriy)</div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Login" name="login" placeholder="masalan: aziz2026" />
                  <Field label="Parol" name="password" type="text" placeholder="kamida 6 belgi" />
                </div>
              </div>
              <div className="space-y-3 sm:col-span-2">
                <FormMessage state={state} />
                <SubmitButton className="btn-primary w-full py-3" pendingText="Saqlanmoqda…">Qo&apos;shish</SubmitButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function Field({ label, className = "", ...props }: { label: string; className?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={className}>
      <label className="label" htmlFor={props.name}>{label}</label>
      <input id={props.name} className="input" {...props} />
    </div>
  );
}
