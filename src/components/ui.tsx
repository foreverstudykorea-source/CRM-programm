import type { LucideIcon } from "lucide-react";

export const GROUP_COLORS: Record<string, { soft: string; text: string; dot: string; bar: string; ring: string }> = {
  indigo: { soft: "bg-indigo-50", text: "text-indigo-700", dot: "bg-indigo-500", bar: "from-indigo-500 to-indigo-400", ring: "ring-indigo-200" },
  violet: { soft: "bg-violet-50", text: "text-violet-700", dot: "bg-violet-500", bar: "from-violet-500 to-fuchsia-400", ring: "ring-violet-200" },
  rose: { soft: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-500", bar: "from-rose-500 to-orange-400", ring: "ring-rose-200" },
  emerald: { soft: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", bar: "from-emerald-500 to-teal-400", ring: "ring-emerald-200" },
  amber: { soft: "bg-amber-50", text: "text-amber-800", dot: "bg-amber-500", bar: "from-amber-500 to-yellow-400", ring: "ring-amber-200" },
  sky: { soft: "bg-sky-50", text: "text-sky-700", dot: "bg-sky-500", bar: "from-sky-500 to-cyan-400", ring: "ring-sky-200" },
};
export const colorOf = (c: string) => GROUP_COLORS[c] ?? GROUP_COLORS.indigo;

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[28px]">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

const TONES = {
  brand: "bg-brand-50 text-brand-600",
  green: "bg-emerald-50 text-emerald-600",
  red: "bg-rose-50 text-rose-600",
  amber: "bg-amber-50 text-amber-600",
  slate: "bg-slate-100 text-slate-600",
};

export function Stat({ label, value, hint, icon: Icon, tone = "brand" }: {
  label: string; value: React.ReactNode; hint?: React.ReactNode; icon: LucideIcon; tone?: keyof typeof TONES;
}) {
  return (
    <div className="card flex items-start gap-4 p-5">
      <div className={`grid size-11 shrink-0 place-items-center rounded-xl ${TONES[tone]}`}>
        <Icon className="size-5" />
      </div>
      <div className="min-w-0">
        <div className="text-xs font-semibold tracking-wide text-slate-500 uppercase">{label}</div>
        <div className="mt-1 truncate text-2xl font-bold text-slate-900">{value}</div>
        {hint && <div className="mt-0.5 text-xs text-slate-500">{hint}</div>}
      </div>
    </div>
  );
}

const BADGES = {
  green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  red: "bg-rose-50 text-rose-700 ring-rose-200",
  amber: "bg-amber-50 text-amber-800 ring-amber-200",
  blue: "bg-sky-50 text-sky-700 ring-sky-200",
  slate: "bg-slate-100 text-slate-600 ring-slate-200",
  brand: "bg-brand-50 text-brand-700 ring-brand-100",
};

export function Badge({ tone = "slate", children }: { tone?: keyof typeof BADGES; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${BADGES[tone]}`}>
      {children}
    </span>
  );
}

export function Empty({ icon: Icon, title, text }: { icon: LucideIcon; title: string; text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="grid size-12 place-items-center rounded-2xl bg-slate-100 text-slate-400">
        <Icon className="size-6" />
      </div>
      <div className="mt-3 font-semibold text-slate-800">{title}</div>
      {text && <p className="mt-1 max-w-sm text-sm text-slate-500">{text}</p>}
    </div>
  );
}

export function Avatar({ name, className = "" }: { name: string; className?: string }) {
  const initials = name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  const hues = ["bg-indigo-100 text-indigo-700", "bg-violet-100 text-violet-700", "bg-rose-100 text-rose-700", "bg-emerald-100 text-emerald-700", "bg-amber-100 text-amber-800", "bg-sky-100 text-sky-700"];
  const h = hues[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % hues.length];
  return <div className={`grid size-9 shrink-0 place-items-center rounded-full text-xs font-bold ${h} ${className}`}>{initials}</div>;
}
