"use client";

import { useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { createStudentAction } from "@/app/actions/staff";
import { Field, FormMessage, SecretCard, SubmitButton, useToast, useFormAction, v } from "@/components/forms";
import { Modal } from "@/components/modal";

export function AddStudent({ groups }: { groups: { id: number; name: string }[] }) {
  const [open, setOpen] = useState(false);
  const [withLogin, setWithLogin] = useState(true);
  const [state, action] = useFormAction(createStudentAction);
  useToast(state);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <>
      <button className="btn-primary" onClick={() => setOpen(true)}>
        <Plus className="size-4" /> Yangi o&apos;quvchi
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Yangi o'quvchi" subtitle="Kabinet uchun parol avtomatik yaratiladi">
        {state?.secret && (
          <div className="mb-5">
            <SecretCard secret={state.secret} />
          </div>
        )}
        <form ref={formRef} action={action} className="grid gap-4 sm:grid-cols-2">
          <Field label="Ism-familiya" name="full_name" state={state} className="sm:col-span-2">
            <input id="full_name" name="full_name" className="input" maxLength={80} defaultValue={v(state, "full_name")} required />
          </Field>
          <Field label="Telefon" name="phone" state={state}>
            <input id="phone" name="phone" className="input" placeholder="+998 90 123 45 67" inputMode="tel" maxLength={32} defaultValue={v(state, "phone")} />
          </Field>
          <Field label="Guruh" name="group_id" state={state}>
            <select id="group_id" name="group_id" className="input" defaultValue={v(state, "group_id")} key={state?.at}>
              <option value="">Tanlanmagan</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Ota-ona ismi" name="parent_name" state={state}>
            <input id="parent_name" name="parent_name" className="input" maxLength={80} defaultValue={v(state, "parent_name")} />
          </Field>
          <Field label="Ota-ona telefoni" name="parent_phone" state={state}>
            <input id="parent_phone" name="parent_phone" className="input" placeholder="+998 90 123 45 67" inputMode="tel" maxLength={32} defaultValue={v(state, "parent_phone")} />
          </Field>
          <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200/60 sm:col-span-2">
            <label className="flex cursor-pointer items-center gap-2.5 text-sm font-bold text-slate-800">
              <input
                type="checkbox"
                name="create_login"
                checked={withLogin}
                onChange={(e) => setWithLogin(e.target.checked)}
                className="size-4 accent-brand-600"
              />
              O&apos;quvchi kabineti ochilsin
            </label>
            {withLogin && (
              <Field label="Login" name="login" state={state} className="mt-3" hint="Parolni tizim o'zi yaratadi va bir marta ko'rsatadi">
                <input id="login" name="login" className="input" placeholder="masalan, aziz.karimov" autoCapitalize="none" spellCheck={false} maxLength={32} defaultValue={v(state, "login")} />
              </Field>
            )}
          </div>
          <div className="space-y-3 sm:col-span-2">
            {state?.error && <FormMessage state={state} />}
            <SubmitButton className="btn-primary w-full py-3" pendingText="Saqlanmoqda…">
              Qo&apos;shish
            </SubmitButton>
          </div>
        </form>
      </Modal>
    </>
  );
}
