"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, Download, TriangleAlert } from "lucide-react";
import { setupAction } from "@/app/actions/auth";
import { CopyButton, Field, FormMessage, SubmitButton, useFormAction, v } from "@/components/forms";

const ROLE = { admin: "Administrator", finance: "Moliya", teacher: "Ustoz", student: "O'quvchi" } as Record<string, string>;

export function SetupForm({ tokenConfigured }: { tokenConfigured: boolean }) {
  const [state, action] = useFormAction(setupAction);

  if (state?.credentials?.length) {
    const text = state.credentials.map((c) => `${c.name}\t${ROLE[c.role]}\t${c.login}\t${c.password}`).join("\n");
    return (
      <div className="mt-6 space-y-4">
        <div className="flex items-start gap-3 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-800 ring-1 ring-emerald-600/15">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
          <div>
            <div className="font-bold">Tizim sozlandi, demo ma&apos;lumotlar qo&apos;shildi.</div>
            Quyidagi parollar faqat hozir ko&apos;rsatiladi. Ularni saqlab oling yoki keyin &quot;Xodimlar&quot; bo&apos;limida yangisini yarating.
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <CopyButton value={text} label="Hammasini nusxalash" className="btn-ghost" />
          <a
            className="btn-ghost"
            download="forever-study-demo-parollar.txt"
            href={`data:text/plain;charset=utf-8,${encodeURIComponent(text)}`}
          >
            <Download className="size-4" /> Faylga saqlash
          </a>
        </div>
        <div className="max-h-80 overflow-auto rounded-xl ring-1 ring-slate-200">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-slate-50 text-left text-xs text-slate-500">
              <tr>
                <th className="px-3 py-2">Ism</th>
                <th className="px-3 py-2">Login</th>
                <th className="px-3 py-2">Parol</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {state.credentials.map((c) => (
                <tr key={c.login}>
                  <td className="px-3 py-2">
                    <div className="font-semibold text-slate-800">{c.name}</div>
                    <div className="text-xs text-slate-500">{ROLE[c.role]}</div>
                  </td>
                  <td className="px-3 py-2 font-mono">{c.login}</td>
                  <td className="px-3 py-2 font-mono font-bold">{c.password}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Link href="/admin" className="btn-primary w-full py-3">
          Boshqaruv paneliga o&apos;tish <ArrowRight className="size-4" />
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="mt-6 space-y-4">
      {!tokenConfigured && (
        <div className="flex gap-3 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-600/20">
          <TriangleAlert className="mt-0.5 size-5 shrink-0" />
          <div>
            Serverda <code className="font-bold">SETUP_TOKEN</code> o&apos;rnatilmagan. Vercel → Settings → Environment Variables
            bo&apos;limida kamida 16 belgili maxfiy kalit qo&apos;shing va qayta deploy qiling.
          </div>
        </div>
      )}
      <Field label="Sozlash kaliti (SETUP_TOKEN)" name="token" state={state} hint="Vercel'da o'zingiz qo'ygan maxfiy kalit">
        <input id="token" name="token" type="password" className="input" autoComplete="off" required />
      </Field>
      <Field label="Ism-familiya" name="name" state={state}>
        <input id="name" name="name" className="input" placeholder="Masalan, Aziz Karimov" maxLength={80} defaultValue={v(state, "name")} required />
      </Field>
      <Field label="Login" name="login" state={state} hint="Lotin harflari, raqamlar, . _ -">
        <input id="login" name="login" className="input" autoCapitalize="none" spellCheck={false} maxLength={32} defaultValue={v(state, "login")} required />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Parol" name="password" state={state} hint="Kamida 10 belgi, harf va raqam">
          <input id="password" name="password" type="password" className="input" autoComplete="new-password" maxLength={128} required />
        </Field>
        <Field label="Parolni takrorlang" name="confirm" state={state}>
          <input id="confirm" name="confirm" type="password" className="input" autoComplete="new-password" maxLength={128} required />
        </Field>
      </div>
      <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200/70">
        <input type="checkbox" name="demo" defaultChecked={v(state, "demo") === "on"} className="mt-0.5 size-4 accent-brand-600" />
        <span className="text-sm">
          <span className="font-bold text-slate-800">Demo ma&apos;lumotlar bilan to&apos;ldirish</span>
          <span className="block text-slate-500">
            5 guruh, 3 ustoz, 25 o&apos;quvchi, davomat va to&apos;lovlar. Har bir hisobga alohida tasodifiy parol beriladi.
          </span>
        </span>
      </label>
      <FormMessage state={state} />
      <SubmitButton className="btn-primary w-full py-3" pendingText="Yaratilmoqda…">
        Yaratish va kirish <ArrowRight className="size-4" />
      </SubmitButton>
    </form>
  );
}
