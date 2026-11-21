"use client";

import { useState } from "react";
import type { FormState } from "@/lib/form-state";
import { Undo2 } from "lucide-react";
import { voidPaymentAction } from "@/app/actions/staff";
import { FormMessage, SubmitButton, useFormAction, useToast, v } from "@/components/forms";
import { Modal } from "@/components/modal";

export function VoidPayment({ id, label }: { id: number; label: string }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useFormAction(async (prev: FormState, form: FormData) => {
    const res = await voidPaymentAction(prev, form);
    if (res?.ok) setOpen(false);
    return res;
  });
  useToast(state);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="grid size-8 place-items-center rounded-lg text-slate-300 transition hover:bg-rose-50 hover:text-rose-600"
        title="Bekor qilish"
        aria-label="Bekor qilish"
      >
        <Undo2 className="size-4" />
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="To'lovni bekor qilish" subtitle={label}>
        <form action={action} className="space-y-4">
          <input type="hidden" name="id" value={id} />
          <div>
            <label htmlFor={`reason-${id}`} className="label">
              Sababi
            </label>
            <input id={`reason-${id}`} name="reason" className="input" placeholder="Masalan, summa xato kiritilgan" maxLength={300} defaultValue={v(state, "reason")} required autoFocus />
            <p className="mt-1.5 text-xs text-slate-500">Yozuv saqlanib qoladi va jurnalda kim bekor qilgani ko&apos;rinadi.</p>
          </div>
          {state?.error && <FormMessage state={state} />}
          <SubmitButton className="btn-danger w-full py-3" pendingText="…">
            Bekor qilish
          </SubmitButton>
        </form>
      </Modal>
    </>
  );
}
