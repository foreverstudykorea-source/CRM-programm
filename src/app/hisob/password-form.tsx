"use client";

import { useActionState, useEffect, useRef } from "react";
import { ShieldCheck } from "lucide-react";
import { changePasswordAction } from "@/app/actions/auth";
import { Field, FormMessage, SubmitButton } from "@/components/forms";

export function PasswordForm({ forced = false }: { forced?: boolean }) {
  const [state, action] = useActionState(changePasswordAction, undefined);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);

  return (
    <form ref={ref} action={action} className={`space-y-4 ${forced ? "mt-6" : ""}`}>
      <Field label={forced ? "Vaqtinchalik parol" : "Joriy parol"} name="current" state={state}>
        <input id="current" name="current" type="password" className="input" autoComplete="current-password" maxLength={128} required />
      </Field>
      <Field label="Yangi parol" name="next" state={state} hint="Kamida 10 belgi, harf va raqam. Loginingiz bo'lmasin.">
        <input id="next" name="next" type="password" className="input" autoComplete="new-password" minLength={10} maxLength={128} required />
      </Field>
      <Field label="Yangi parolni takrorlang" name="confirm" state={state}>
        <input id="confirm" name="confirm" type="password" className="input" autoComplete="new-password" maxLength={128} required />
      </Field>
      <FormMessage state={state} />
      <SubmitButton className={`btn-primary ${forced ? "w-full py-3" : ""}`} pendingText="Saqlanmoqda…">
        <ShieldCheck className="size-4" /> Parolni saqlash
      </SubmitButton>
    </form>
  );
}
