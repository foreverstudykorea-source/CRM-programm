"use client";

import { useActionState, useState } from "react";
import { Ban, KeyRound, LogOut, MoreHorizontal, ShieldCheck } from "lucide-react";
import { resetPasswordAction, revokeSessionsAction, setUserActiveAction } from "@/app/actions/staff";
import { FormMessage, SecretCard, SubmitButton, useToast } from "@/components/forms";
import { Modal } from "@/components/modal";

/** Reset password / block / sign out everywhere, for one user. */
export function UserActions({ userId, name, active, compact }: { userId: number; name: string; active: boolean; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [reset, resetAction] = useActionState(resetPasswordAction, undefined);
  const [block, blockAction] = useActionState(setUserActiveAction, undefined);
  const [revoke, revokeAction] = useActionState(revokeSessionsAction, undefined);
  useToast(block);
  useToast(revoke);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={compact ? "btn-ghost btn-sm" : "btn-ghost btn-sm"} aria-label="Amallar">
        <MoreHorizontal className="size-4" />
        {!compact && "Boshqarish"}
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={name} subtitle="Hisob xavfsizligi">
        <div className="space-y-3">
          <form action={resetAction} className="rounded-2xl p-4 ring-1 ring-slate-200">
            <input type="hidden" name="user_id" value={userId} />
            <div className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-600">
                <KeyRound className="size-4" />
              </span>
              <div className="flex-1">
                <div className="font-bold text-slate-800">Yangi vaqtinchalik parol</div>
                <p className="text-xs text-slate-500">Eski parol ishlamay qoladi, barcha qurilmalardan chiqariladi.</p>
              </div>
              <SubmitButton className="btn-dark btn-sm" pendingText="…">
                Yaratish
              </SubmitButton>
            </div>
            {reset?.secret && <div className="mt-3"><SecretCard secret={reset.secret} /></div>}
            {reset?.error && <div className="mt-3"><FormMessage state={reset} /></div>}
          </form>

          <form action={revokeAction} className="flex items-start gap-3 rounded-2xl p-4 ring-1 ring-slate-200">
            <input type="hidden" name="user_id" value={userId} />
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-sky-50 text-sky-600">
              <LogOut className="size-4" />
            </span>
            <div className="flex-1">
              <div className="font-bold text-slate-800">Barcha qurilmalardan chiqarish</div>
              <p className="text-xs text-slate-500">Telefon yo&apos;qolsa yoki shubha bo&apos;lsa</p>
            </div>
            <SubmitButton className="btn-ghost btn-sm" pendingText="…">
              Chiqarish
            </SubmitButton>
          </form>

          <form action={blockAction} className="flex items-start gap-3 rounded-2xl p-4 ring-1 ring-slate-200">
            <input type="hidden" name="user_id" value={userId} />
            <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${active ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"}`}>
              {active ? <Ban className="size-4" /> : <ShieldCheck className="size-4" />}
            </span>
            <div className="flex-1">
              <div className="font-bold text-slate-800">{active ? "Hisobni bloklash" : "Hisobni faollashtirish"}</div>
              <p className="text-xs text-slate-500">{active ? "Kira olmaydi, ma'lumotlari saqlanadi" : "Yana tizimga kira oladi"}</p>
            </div>
            <SubmitButton className={active ? "btn-danger btn-sm" : "btn-primary btn-sm"} pendingText="…">
              {active ? "Bloklash" : "Faollashtirish"}
            </SubmitButton>
          </form>
        </div>
      </Modal>
    </>
  );
}
