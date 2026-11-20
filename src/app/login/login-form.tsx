"use client";

import { useActionState, useRef } from "react";
import { BookOpen, ClipboardCheck, PhoneCall, Wallet, ArrowRight } from "lucide-react";
import { login } from "@/app/actions";
import { FormMessage, SubmitButton } from "@/components/forms";

const DEMO = [
  { login: "oquvchi1", role: "O'quvchi", name: "Aziz Aliyev", icon: BookOpen, tone: "bg-indigo-50 text-indigo-600" },
  { login: "ustoz1", role: "Ustoz", name: "Dilnoza Karimova", icon: ClipboardCheck, tone: "bg-emerald-50 text-emerald-600" },
  { login: "admin", role: "Administrator", name: "Nilufar Azimova", icon: PhoneCall, tone: "bg-rose-50 text-rose-600" },
  { login: "moliya", role: "Moliya admini", name: "Sardor Qodirov", icon: Wallet, tone: "bg-amber-50 text-amber-600" },
];

export function LoginForm({ showDemo }: { showDemo: boolean }) {
  const [state, action] = useActionState(login, undefined);
  const loginRef = useRef<HTMLInputElement>(null);
  const passRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <>
      <form ref={formRef} action={action} className="mt-6 space-y-4">
        <div>
          <label className="label" htmlFor="login">Login</label>
          <input ref={loginRef} id="login" name="login" className="input" autoComplete="username" placeholder="masalan: ustoz1" required />
        </div>
        <div>
          <label className="label" htmlFor="password">Parol</label>
          <input ref={passRef} id="password" name="password" type="password" className="input" autoComplete="current-password" placeholder="••••••" required />
        </div>
        <FormMessage state={state} />
        <SubmitButton className="btn-primary w-full py-3" pendingText="Kirilmoqda…">
          Kirish <ArrowRight className="size-4" />
        </SubmitButton>
      </form>

      {showDemo && (
      <div className="mt-10">
        <div className="flex items-center gap-3 text-xs font-semibold tracking-wide text-slate-400 uppercase">
          <span className="h-px flex-1 bg-slate-200" /> Demo hisoblar (parol: demo123) <span className="h-px flex-1 bg-slate-200" />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {DEMO.map((d) => (
            <button
              key={d.login}
              type="button"
              onClick={() => {
                if (loginRef.current && passRef.current) {
                  loginRef.current.value = d.login;
                  passRef.current.value = "demo123";
                  formRef.current?.requestSubmit();
                }
              }}
              className="card group flex items-center gap-3 p-3 text-left transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md"
            >
              <span className={`grid size-9 shrink-0 place-items-center rounded-lg ${d.tone}`}>
                <d.icon className="size-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-slate-800">{d.role}</span>
                <span className="block truncate text-xs text-slate-500">{d.login}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
      )}
    </>
  );
}
