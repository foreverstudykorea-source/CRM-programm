import type { LucideIcon } from "lucide-react";
import Link from "next/link";

export const GROUP_COLORS: Record<string, { soft: string; text: string; dot: string; grad: string; ring: string; hex: string }> = {
  indigo: { soft: "bg-indigo-50", text: "text-indigo-700", dot: "bg-indigo-500", grad: "from-indigo-500 to-blue-500", ring: "ring-indigo-200", hex: "#6366f1" },
  violet: { soft: "bg-violet-50", text: "text-violet-700", dot: "bg-violet-500", grad: "from-violet-500 to-fuchsia-500", ring: "ring-violet-200", hex: "#8b5cf6" },
  rose: { soft: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-500", grad: "from-rose-500 to-orange-400", ring: "ring-rose-200", hex: "#f43f5e" },
  emerald: { soft: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", grad: "from-emerald-500 to-teal-400", ring: "ring-emerald-200", hex: "#10b981" },
  amber: { soft: "bg-amber-50", text: "text-amber-800", dot: "bg-amber-500", grad: "from-amber-500 to-yellow-400", ring: "ring-amber-200", hex: "#f59e0b" },
  sky: { soft: "bg-sky-50", text: "text-sky-700", dot: "bg-sky-500", grad: "from-sky-500 to-cyan-400", ring: "ring-sky-200", hex: "#0ea5e9" },
};
export const colorOf = (c: string | null | undefined) => GROUP_COLORS[c ?? ""] ?? GROUP_COLORS.indigo;

export function PageHeader({
  title,
  subtitle,
  eyebrow,
  children,
}: {
  title: string;
  subtitle?: React.ReactNode;
  eyebrow?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex animate-rise flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <div className="eyebrow mb-1.5 text-brand-600">{eyebrow}</div>}
        <h1 className="text-[26px] leading-tight font-extrabold tracking-tight text-slate-900 sm:text-[30px]">{title}</h1>
        {subtitle && <p className="mt-1.5 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

const TONES = {
  brand: { tile: "bg-gradient-to-br from-brand-500 to-violet-600 text-white shadow-glow", bar: "bg-brand-500" },
  green: { tile: "bg-gradient-to-br from-emerald-400 to-teal-600 text-white shadow-[0_10px_30px_-8px_rgb(16_185_129/0.55)]", bar: "bg-emerald-500" },
  red: { tile: "bg-gradient-to-br from-rose-400 to-pink-600 text-white shadow-[0_10px_30px_-8px_rgb(244_63_94/0.5)]", bar: "bg-rose-500" },
  amber: { tile: "bg-gradient-to-br from-amber-300 to-orange-500 text-white shadow-[0_10px_30px_-8px_rgb(245_158_11/0.55)]", bar: "bg-amber-500" },
  sky: { tile: "bg-gradient-to-br from-sky-400 to-blue-600 text-white shadow-[0_10px_30px_-8px_rgb(14_165_233/0.5)]", bar: "bg-sky-500" },
  slate: { tile: "bg-slate-100 text-slate-600", bar: "bg-slate-400" },
};
export type Tone = keyof typeof TONES;

export function Stat({
  label,
  value,
  hint,
  icon: Icon,
  tone = "brand",
  progress,
  href,
  delay = 0,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon: LucideIcon;
  tone?: Tone;
  progress?: number;
  href?: string;
  delay?: number;
}) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[13px] font-semibold text-slate-500">{label}</div>
          <div className="mt-1.5 truncate text-[28px] leading-none font-extrabold tracking-tight text-slate-900 tabular-nums">
            {value}
          </div>
        </div>
        <div className={`grid size-11 shrink-0 place-items-center rounded-2xl ${TONES[tone].tile}`}>
          <Icon className="size-5" strokeWidth={2.2} />
        </div>
      </div>
      {progress != null && (
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div className={`h-full rounded-full ${TONES[tone].bar}`} style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }} />
        </div>
      )}
      {hint && <div className="mt-2.5 text-xs font-medium text-slate-500">{hint}</div>}
    </>
  );
  const cls = "card block animate-rise p-5";
  const style = { animationDelay: `${delay}ms` };
  return href ? (
    <Link href={href} className={`${cls} card-hover`} style={style}>
      {body}
    </Link>
  ) : (
    <div className={cls} style={style}>
      {body}
    </div>
  );
}

const BADGES = {
  green: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
  red: "bg-rose-50 text-rose-700 ring-rose-600/15",
  amber: "bg-amber-50 text-amber-800 ring-amber-600/20",
  blue: "bg-sky-50 text-sky-700 ring-sky-600/15",
  slate: "bg-slate-100 text-slate-600 ring-slate-500/10",
  brand: "bg-brand-50 text-brand-700 ring-brand-600/15",
  dark: "bg-ink-900 text-white ring-ink-900",
};
export type BadgeTone = keyof typeof BADGES;

export function Badge({ tone = "slate", children, dot }: { tone?: BadgeTone; children: React.ReactNode; dot?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11.5px] font-bold whitespace-nowrap ring-1 ring-inset ${BADGES[tone]}`}
    >
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

export function Empty({ icon: Icon, title, text, children }: { icon: LucideIcon; title: string; text?: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="relative">
        <div className="absolute inset-0 scale-150 rounded-full bg-brand-100/60 blur-xl" />
        <div className="relative grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-white to-brand-50 text-brand-500 shadow-soft ring-1 ring-brand-100">
          <Icon className="size-6" />
        </div>
      </div>
      <div className="mt-4 font-bold text-slate-800">{title}</div>
      {text && <p className="mt-1 max-w-sm text-sm text-slate-500">{text}</p>}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}

const HUES = [
  "from-indigo-400 to-blue-500",
  "from-violet-400 to-fuchsia-500",
  "from-rose-400 to-orange-400",
  "from-emerald-400 to-teal-500",
  "from-amber-400 to-orange-500",
  "from-sky-400 to-cyan-500",
  "from-pink-400 to-rose-500",
];

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function Avatar({ name, size = "md", className = "" }: { name: string; size?: "sm" | "md" | "lg"; className?: string }) {
  const h = HUES[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % HUES.length];
  const s = size === "sm" ? "size-8 text-[11px]" : size === "lg" ? "size-12 text-sm" : "size-10 text-xs";
  return (
    <div className={`grid shrink-0 place-items-center rounded-full bg-gradient-to-br font-bold text-white shadow-sm ${h} ${s} ${className}`}>
      {initials(name)}
    </div>
  );
}

/** Circular progress, e.g. attendance rate. */
export function Ring({
  value,
  size = 64,
  stroke = 7,
  color = "#5243e6",
  track = "#eef0f6",
  children,
}: {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  children?: React.ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.min(Math.max(value, 0), 100);
  return (
    <div className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (v / 100) * c}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}

export function Tabs({ items, active }: { items: { key: string; label: string; href: string; count?: number }[]; active: string }) {
  return (
    <div className="inline-flex gap-1 rounded-xl bg-slate-100/80 p-1 ring-1 ring-slate-200/60 ring-inset">
      {items.map((x) => {
        const on = x.key === active;
        return (
          <Link
            key={x.key}
            href={x.href}
            scroll={false}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              on ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/70" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {x.label}
            {x.count != null && x.count > 0 && (
              <span className={`rounded-full px-1.5 py-px text-[10px] ${on ? "bg-rose-500 text-white" : "bg-slate-200 text-slate-600"}`}>
                {x.count}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}

export function SectionTitle({ title, hint, children }: { title: string; hint?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
      <div>
        <h2 className="font-bold text-slate-900">{title}</h2>
        {hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

/** Gradient banner at the top of each dashboard. */
export function Hero({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`mesh relative animate-rise overflow-hidden rounded-3xl p-6 text-white shadow-lift sm:p-8 ${className}`}>
      <div className="grid-pattern pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute -top-24 -right-16 size-80 rounded-full bg-white/10 blur-3xl" />
      <div className="relative">{children}</div>
    </section>
  );
}
