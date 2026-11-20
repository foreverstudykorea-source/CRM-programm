"use client";

import { useActionState, useRef, useState } from "react";
import { addPaymentAction, type FormState } from "@/app/actions";
import { FormMessage, SubmitButton } from "@/components/forms";

type S = { id: number; name: string; group: string | null; fee: number; left: number };
const fmt = (n: number) => new Intl.NumberFormat("ru-RU").format(n).replace(/ /g, " ");

export function PaymentForm({ students, defaultStudent, defaultAmount, month, today }: {
  students: S[]; defaultStudent?: number; defaultAmount?: number; month: string; today: string;
}) {
  const [sid, setSid] = useState<number | "">(defaultStudent ?? "");
  const [amount, setAmount] = useState(defaultAmount ? fmt(defaultAmount) : "");
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action] = useActionState(async (prev: FormState, form: FormData) => {
    const res = await addPaymentAction(prev, form);
    if (res?.ok) {
      formRef.current?.reset();
      setSid("");
      setAmount("");
    }
    return res;
  }, undefined);
  const selected = students.find((s) => s.id === sid);

  return (
    <form ref={formRef} action={action} className="space-y-4">
      <div>
        <label className="label" htmlFor="student_id">O&apos;quvchi</label>
        <select
          id="student_id"
          name="student_id"
          className="input"
          value={sid}
          onChange={(e) => {
            const id = Number(e.target.value) || "";
            setSid(id);
            const s = students.find((x) => x.id === id);
            if (s) setAmount(fmt(s.left || s.fee));
          }}
          required
        >
          <option value="">Tanlang…</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}{s.left ? ` · qarz ${fmt(s.left)}` : " · to'langan"}
            </option>
          ))}
        </select>
        {selected && (
          <p className="mt-1.5 text-xs text-slate-500">
            {selected.group ?? "Guruhsiz"} · oylik {fmt(selected.fee)} so&apos;m
          </p>
        )}
      </div>
      <div>
        <label className="label" htmlFor="amount">Summa (so&apos;m)</label>
        <input
          id="amount"
          name="amount"
          inputMode="numeric"
          className="input text-lg font-semibold"
          value={amount}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, "");
            setAmount(digits ? fmt(Number(digits)) : "");
          }}
          placeholder="0"
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="month">Qaysi oy uchun</label>
          <input id="month" name="month" type="month" defaultValue={month} className="input" required />
        </div>
        <div>
          <label className="label" htmlFor="paid_at">Sana</label>
          <input id="paid_at" name="paid_at" type="date" defaultValue={today} className="input" required />
        </div>
      </div>
      <div>
        <span className="label">To&apos;lov usuli</span>
        <div className="grid grid-cols-2 gap-2">
          {["Naqd", "Karta", "Click", "Payme"].map((m, i) => (
            <label key={m} className="cursor-pointer">
              <input type="radio" name="method" value={m} defaultChecked={i === 0} className="peer sr-only" />
              <span className="block rounded-xl border border-slate-200 px-3 py-2 text-center text-sm font-semibold text-slate-600 peer-checked:border-brand-600 peer-checked:bg-brand-50 peer-checked:text-brand-700">
                {m}
              </span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <label className="label" htmlFor="note">Izoh</label>
        <input id="note" name="note" className="input" placeholder="ixtiyoriy" />
      </div>
      <FormMessage state={state} />
      <SubmitButton className="btn-primary w-full py-3" pendingText="Saqlanmoqda…">To&apos;lovni saqlash</SubmitButton>
    </form>
  );
}
