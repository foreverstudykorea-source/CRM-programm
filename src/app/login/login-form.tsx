"use client";

import { useState } from "react";
import { ArrowRight, Eye, EyeOff, KeyRound, UserRound } from "lucide-react";
import { loginAction } from "@/app/actions/auth";
import { FormMessage, SubmitButton, useFormAction, v } from "@/components/forms";

export function LoginForm() {
  const [state, action] = useFormAction(loginAction);
  const [show, setShow] = useState(false);
  const [caps, setCaps] = useState(false);

  return (
    <form action={action} className="mt-8 space-y-5">
      <div>
        <label htmlFor="login" className="label">
          Login
        </label>
        <div className="relative">
          <UserRound className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" />
          <input
            id="login"
            name="login"
            className="input py-3 pl-10"
            placeholder="masalan, ustoz1"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={64}
            defaultValue={v(state, "login")}
            required
            autoFocus
          />
        </div>
      </div>
      <div>
        <label htmlFor="password" className="label">
          Parol
        </label>
        <div className="relative">
          <KeyRound className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" />
          <input
            id="password"
            name="password"
            type={show ? "text" : "password"}
            className="input py-3 pr-11 pl-10"
            placeholder="••••••••••"
            autoComplete="current-password"
            maxLength={128}
            required
            onKeyUp={(e) => setCaps(e.getModifierState("CapsLock"))}
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute top-1/2 right-2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label={show ? "Parolni yashirish" : "Parolni ko'rsatish"}
          >
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        {caps && <p className="mt-1.5 text-xs font-semibold text-amber-600">Caps Lock yoqilgan</p>}
      </div>
      <FormMessage state={state} />
      <SubmitButton className="btn-primary w-full py-3 text-[15px]" pendingText="Tekshirilmoqda…">
        Kirish <ArrowRight className="size-4" />
      </SubmitButton>
    </form>
  );
}
