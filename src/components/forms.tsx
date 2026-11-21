"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, Check, CheckCircle2, Copy, KeyRound, Loader2 } from "lucide-react";
import type { FormState } from "@/lib/form-state";
import { toast } from "./toast";

export function SubmitButton({
  children,
  className = "btn-primary",
  pendingText,
  ...rest
}: {
  children: React.ReactNode;
  className?: string;
  pendingText?: string;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "type" | "className" | "children">) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending || rest.disabled} {...rest}>
      {pending ? <Loader2 className="size-4 animate-spin" /> : null}
      {pending && pendingText ? pendingText : children}
    </button>
  );
}

export function FormMessage({ state }: { state: FormState }) {
  if (!state?.error && !state?.message) return null;
  const ok = !state.error;
  return (
    <div
      role={ok ? "status" : "alert"}
      key={state.at}
      className={`flex animate-pop items-start gap-2 rounded-xl px-3.5 py-2.5 text-sm font-medium ring-1 ring-inset ${
        ok ? "bg-emerald-50 text-emerald-800 ring-emerald-600/15" : "bg-rose-50 text-rose-700 ring-rose-600/15"
      }`}
    >
      {ok ? <CheckCircle2 className="mt-0.5 size-4 shrink-0" /> : <AlertCircle className="mt-0.5 size-4 shrink-0" />}
      {state.error ?? state.message}
    </div>
  );
}

const SECRET_FIELD = /pass|token|current|next|confirm/i;

/**
 * useActionState for forms. React clears a form after every submit; when the server
 * returns an error, the typed values are handed back (never passwords) so that inputs
 * using `defaultValue={v(state, "name")}` keep them.
 */
export function useFormAction(fn: (prev: FormState, form: FormData) => Promise<FormState>) {
  return useActionState(async (prev: FormState, form: FormData): Promise<FormState> => {
    const res = await fn(prev, form);
    if (!res || res.ok) return res;
    const values: Record<string, string> = {};
    for (const [k, val] of form.entries()) {
      if (typeof val !== "string" || k.startsWith("$") || SECRET_FIELD.test(k)) continue;
      values[k] = k in values ? `${values[k]},${val}` : val;
    }
    return { ...res, values };
  }, undefined);
}

/** The value a field had when the form was last submitted with an error. */
export const v = (state: FormState, name: string, fallback = "") => state?.values?.[name] ?? fallback;

/** Shows a toast whenever a server action returns. */
export function useToast(state: FormState) {
  const last = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (!state?.at || state.at === last.current) return;
    last.current = state.at;
    if (state.error) toast(state.error, "error");
    else if (state.message) toast(state.message, "success");
  }, [state]);
}

export function Field({
  label,
  name,
  hint,
  state,
  children,
  className = "",
}: {
  label: string;
  name: string;
  hint?: React.ReactNode;
  state?: FormState;
  children: React.ReactNode;
  className?: string;
}) {
  const err = state?.field === name ? state.error : undefined;
  return (
    <div className={className}>
      <label htmlFor={name} className="label">
        {label}
      </label>
      {children}
      {err ? (
        <p className="mt-1.5 text-xs font-medium text-rose-600">{err}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}

export function CopyButton({ value, label = "Nusxalash", className = "btn-ghost btn-sm" }: { value: string; label?: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className={className}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          toast("Nusxalab bo'lmadi", "error");
        }
      }}
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      {copied ? "Nusxalandi" : label}
    </button>
  );
}

/** A generated password, shown once. It is not stored anywhere in readable form. */
export function SecretCard({ secret }: { secret: NonNullable<NonNullable<FormState>["secret"]> }) {
  return (
    <div className="animate-pop rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-4">
      <div className="flex items-center gap-2 text-sm font-bold text-amber-900">
        <KeyRound className="size-4" /> {secret.name} uchun vaqtinchalik parol
      </div>
      <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
        <div className="rounded-xl bg-white/80 px-3 py-2 ring-1 ring-amber-200/70">
          <div className="eyebrow">Login</div>
          <div className="font-mono font-bold text-slate-900">{secret.login}</div>
        </div>
        <div className="rounded-xl bg-white/80 px-3 py-2 ring-1 ring-amber-200/70">
          <div className="eyebrow">Parol</div>
          <div className="font-mono font-bold tracking-wide text-slate-900">{secret.password}</div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-amber-800">
          Bu parol faqat hozir ko&apos;rsatiladi. Birinchi kirishda foydalanuvchi uni o&apos;zgartiradi.
        </p>
        <CopyButton value={`Login: ${secret.login}\nParol: ${secret.password}`} />
      </div>
    </div>
  );
}
