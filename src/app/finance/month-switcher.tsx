import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { addMonths, formatMonth } from "@/lib/dates";

export function MonthSwitcher({ month, base, max }: { month: string; base: string; max: string }) {
  const next = addMonths(month, 1);
  return (
    <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1">
      <Link href={`${base}?m=${addMonths(month, -1)}`} className="grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100" aria-label="Oldingi oy">
        <ChevronLeft className="size-4" />
      </Link>
      <span className="min-w-32 text-center text-sm font-semibold text-slate-800">{formatMonth(month)}</span>
      {next <= max ? (
        <Link href={`${base}?m=${next}`} className="grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100" aria-label="Keyingi oy">
          <ChevronRight className="size-4" />
        </Link>
      ) : (
        <span className="grid size-8 place-items-center text-slate-300"><ChevronRight className="size-4" /></span>
      )}
    </div>
  );
}

export function parseMonth(m: string | undefined, fallback: string) {
  return m && /^\d{4}-\d{2}$/.test(m) && m <= fallback ? m : fallback;
}
