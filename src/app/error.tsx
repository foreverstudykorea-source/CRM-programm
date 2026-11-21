"use client";

import { RotateCcw, TriangleAlert } from "lucide-react";

// Error details stay on the server; the browser only sees a reference code.
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="grid min-h-[70dvh] place-items-center px-6">
      <div className="max-w-sm text-center">
        <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-rose-50 text-rose-600">
          <TriangleAlert className="size-7" />
        </div>
        <h1 className="mt-4 text-xl font-extrabold text-slate-900">Nimadir xato ketdi</h1>
        <p className="mt-1 text-sm text-slate-500">
          Sahifani qayta yuklab ko&apos;ring. Muammo takrorlansa, administratorga xabar bering.
        </p>
        {error.digest && <p className="mt-3 font-mono text-xs text-slate-400">Kod: {error.digest}</p>}
        <button onClick={reset} className="btn-primary mt-6">
          <RotateCcw className="size-4" /> Qayta urinish
        </button>
      </div>
    </div>
  );
}
