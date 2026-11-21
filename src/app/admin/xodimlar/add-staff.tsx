"use client";

import { useEffect, useRef, useState } from "react";
import { UserPlus } from "lucide-react";
import { createStaffAction } from "@/app/actions/staff";
import { Field, FormMessage, SecretCard, SubmitButton, useToast, useFormAction, v } from "@/components/forms";
import { Modal } from "@/components/modal";

export function AddStaff() {
  const [open, setOpen] = useState(false);
  const [state, action] = useFormAction(createStaffAction);
  useToast(state);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);

  return (
    <>
      <button className="btn-primary" onClick={() => setOpen(true)}>
        <UserPlus className="size-4" /> Yangi xodim
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Yangi xodim" subtitle="Vaqtinchalik parol avtomatik yaratiladi">
        {state?.secret && (
          <div className="mb-5">
            <SecretCard secret={state.secret} />
          </div>
        )}
        <form ref={ref} action={action} className="grid gap-4">
          <Field label="Ism-familiya" name="name" state={state}>
            <input id="name" name="name" className="input" maxLength={80} defaultValue={v(state, "name")} required />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Login" name="login" state={state}>
              <input id="login" name="login" className="input" autoCapitalize="none" spellCheck={false} maxLength={32} defaultValue={v(state, "login")} required />
            </Field>
            <Field label="Telefon" name="phone" state={state}>
              <input id="phone" name="phone" className="input" inputMode="tel" placeholder="+998 90 123 45 67" maxLength={32} defaultValue={v(state, "phone")} />
            </Field>
          </div>
          <div>
            <div className="label">Rol</div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { v: "teacher", l: "Ustoz", d: "Davomat" },
                { v: "admin", l: "Admin", d: "Hammasi" },
                { v: "finance", l: "Moliya", d: "To'lovlar" },
              ].map((r, i) => (
                <label key={r.v} className="cursor-pointer">
                  <input type="radio" name="role" value={r.v} defaultChecked={state?.values?.role ? state.values.role === r.v : i === 0} className="peer sr-only" />
                  <span className="block rounded-xl p-3 text-center ring-1 ring-slate-200 transition peer-checked:bg-brand-50 peer-checked:ring-2 peer-checked:ring-brand-500">
                    <span className="block text-sm font-bold text-slate-800">{r.l}</span>
                    <span className="block text-xs text-slate-500">{r.d}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
          {state?.error && <FormMessage state={state} />}
          <SubmitButton className="btn-primary w-full py-3" pendingText="Saqlanmoqda…">
            Qo&apos;shish
          </SubmitButton>
        </form>
      </Modal>
    </>
  );
}
