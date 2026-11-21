"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, X } from "lucide-react";

type Kind = "success" | "error";
type Item = { id: number; text: string; kind: Kind };

const EVENT = "fs-toast";

export function toast(text: string, kind: Kind = "success") {
  window.dispatchEvent(new CustomEvent<Omit<Item, "id">>(EVENT, { detail: { text, kind } }));
}

export function Toaster() {
  const [items, setItems] = useState<Item[]>([]);
  useEffect(() => {
    let n = 0;
    const on = (e: Event) => {
      const { text, kind } = (e as CustomEvent<Omit<Item, "id">>).detail;
      const id = ++n;
      setItems((xs) => [...xs.slice(-2), { id, text, kind }]);
      setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== id)), 4200);
    };
    window.addEventListener(EVENT, on);
    return () => window.removeEventListener(EVENT, on);
  }, []);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex flex-col items-center gap-2 px-4 lg:right-6 lg:bottom-6 lg:left-auto lg:items-end"
    >
      {items.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto flex w-full max-w-sm animate-pop items-start gap-3 rounded-2xl bg-ink-900/95 px-4 py-3 text-sm text-white shadow-lift ring-1 ring-white/10 backdrop-blur"
        >
          {t.kind === "success" ? (
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-rose-400" />
          )}
          <span className="flex-1 font-medium">{t.text}</span>
          <button
            type="button"
            aria-label="Yopish"
            onClick={() => setItems((xs) => xs.filter((x) => x.id !== t.id))}
            className="text-white/50 hover:text-white"
          >
            <X className="size-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
