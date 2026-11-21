import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ArrowUpRight, CircleDollarSign, Phone, Target, Users } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { billing, methodTotals, monthlyTotals } from "@/lib/data";
import { formatMoney, formatMonth, monthOf, today, MONTHS_SHORT } from "@/lib/dates";
import { Avatar, Badge, Empty, PageHeader, Ring, SectionTitle, Stat, Tabs } from "@/components/ui";
import { MonthSwitcher, parseMonth } from "./month-switcher";

export const metadata: Metadata = { title: "Moliya" };

const TABS = { debt: "Qarzdorlar", paid: "To'laganlar", all: "Hammasi" } as const;
const METHOD_COLORS = ["#5243e6", "#10b981", "#f59e0b", "#f43f5e", "#0ea5e9"];

const short = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(1).replace(".0", "")} mln` : n >= 1000 ? `${Math.round(n / 1000)} ming` : String(n));

export default async function FinanceHome({ searchParams }: { searchParams: Promise<{ m?: string; f?: string }> }) {
  await requireRole("finance");
  const sp = await searchParams;
  const current = monthOf(today());
  const month = parseMonth(sp.m, current);
  const tab = (sp.f && sp.f in TABS ? sp.f : "debt") as keyof typeof TABS;

  const [rows, history, methods] = await Promise.all([billing(month), monthlyTotals(month, 6), methodTotals(month)]);
  const expected = rows.reduce((a, r) => a + r.fee, 0);
  const collected = rows.reduce((a, r) => a + Math.min(r.paid, r.fee || r.paid), 0);
  const received = rows.reduce((a, r) => a + r.paid, 0);
  const debtors = rows.filter((r) => r.paid < r.fee).sort((a, b) => b.fee - b.paid - (a.fee - a.paid));
  const debt = debtors.reduce((a, r) => a + (r.fee - r.paid), 0);
  const pct = expected ? Math.round((collected / expected) * 100) : 0;
  const shown = tab === "all" ? rows : tab === "debt" ? debtors : rows.filter((r) => r.paid >= r.fee);
  const maxBar = Math.max(...history.map((h) => h.total), 1);
  const prev = history[history.length - 2]?.total ?? 0;
  const growth = prev ? Math.round(((received - prev) / prev) * 100) : null;
  const methodSum = methods.reduce((a, m) => a + m.total, 0) || 1;

  return (
    <div>
      <PageHeader eyebrow="Moliya" title="Moliyaviy ko'rinish" subtitle="Oylik tushum, qarzdorlik va to'lov usullari">
        <MonthSwitcher month={month} base="/finance" max={current} />
        <Link href={`/finance/tolovlar?m=${month}`} className="btn-primary">
          To&apos;lov qabul qilish
        </Link>
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat icon={Target} label="Kutilgan tushum" value={short(expected)} hint={formatMoney(expected)} />
        <Stat
          icon={CircleDollarSign}
          tone="green"
          label="Tushgan"
          value={short(received)}
          hint={growth == null ? formatMoney(received) : `${growth >= 0 ? "▲" : "▼"} ${Math.abs(growth)}% o'tgan oyga nisbatan`}
          delay={60}
        />
        <Stat icon={AlertTriangle} tone="red" label="Qarzdorlik" value={short(debt)} hint={`${debtors.length} ta o'quvchi`} delay={120} href={`/finance?m=${month}&f=debt`} />
        <Stat icon={Users} tone="amber" label="To'liq to'laganlar" value={`${rows.length - debtors.length}/${rows.length}`} progress={rows.length ? ((rows.length - debtors.length) / rows.length) * 100 : 0} delay={180} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="card animate-rise p-5 lg:col-span-2" style={{ animationDelay: "120ms" }}>
          <div className="flex items-baseline justify-between">
            <h2 className="font-bold text-slate-900">Oxirgi 6 oy tushumi</h2>
            <span className="text-xs text-slate-500">so&apos;mda</span>
          </div>
          <div className="mt-6 flex h-52 items-end gap-3 border-b border-slate-100">
            {history.map((h) => {
              const on = h.month === month;
              return (
                <Link
                  key={h.month}
                  href={`/finance?m=${h.month}`}
                  className="group flex h-full flex-1 flex-col items-center justify-end gap-2"
                  title={`${formatMonth(h.month)}: ${formatMoney(h.total)}`}
                >
                  <span className={`text-[11px] font-bold ${on ? "text-brand-700" : "text-slate-500"}`}>{short(h.total)}</span>
                  <div
                    className={`w-full max-w-14 rounded-t-xl transition ${
                      on ? "bg-gradient-to-t from-brand-600 to-fuchsia-500 shadow-glow" : "bg-brand-100 group-hover:bg-brand-200"
                    }`}
                    style={{ height: `${Math.max((h.total / maxBar) * 100, 3)}%` }}
                  />
                </Link>
              );
            })}
          </div>
          <div className="mt-2 flex gap-3">
            {history.map((h) => (
              <span key={h.month} className={`flex-1 text-center text-xs ${h.month === month ? "font-extrabold text-slate-900" : "text-slate-500"}`}>
                {MONTHS_SHORT[Number(h.month.slice(5)) - 1]}
              </span>
            ))}
          </div>
        </section>

        <section className="card animate-rise p-5" style={{ animationDelay: "180ms" }}>
          <h2 className="font-bold text-slate-900">Yig&apos;ilish darajasi</h2>
          <div className="mt-4 flex items-center gap-4">
            <Ring value={pct} size={92} stroke={10} color={pct >= 80 ? "#10b981" : pct >= 50 ? "#f59e0b" : "#f43f5e"}>
              <span className="text-xl font-extrabold text-slate-900">{pct}%</span>
            </Ring>
            <div className="text-sm text-slate-600">
              <div>
                <b className="text-slate-900">{formatMoney(collected)}</b>
              </div>
              <div className="text-xs">{formatMoney(expected)} dan</div>
            </div>
          </div>
          <h3 className="mt-6 text-sm font-bold text-slate-900">To&apos;lov usullari</h3>
          <div className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-slate-100">
            {methods.map((m, i) => (
              <div key={m.method} style={{ width: `${(m.total / methodSum) * 100}%`, background: METHOD_COLORS[i % METHOD_COLORS.length] }} />
            ))}
          </div>
          <ul className="mt-3 space-y-2 text-sm">
            {methods.length === 0 && <li className="text-slate-500">To&apos;lovlar yo&apos;q</li>}
            {methods.map((m, i) => (
              <li key={m.method} className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-slate-700">
                  <span className="size-2.5 rounded-full" style={{ background: METHOD_COLORS[i % METHOD_COLORS.length] }} />
                  {m.method} <span className="text-xs text-slate-400">({m.n})</span>
                </span>
                <span className="font-bold text-slate-900 tabular-nums">{short(m.total)}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="card mt-6 animate-rise" style={{ animationDelay: "240ms" }}>
        <SectionTitle title="O'quvchilar bo'yicha" hint={formatMonth(month)}>
          <Tabs
            active={tab}
            items={(Object.keys(TABS) as (keyof typeof TABS)[]).map((k) => ({
              key: k,
              label: TABS[k],
              href: `/finance?m=${month}&f=${k}`,
              count: k === "debt" ? debtors.length : undefined,
            }))}
          />
        </SectionTitle>
        {shown.length === 0 ? (
          <Empty icon={Users} title={tab === "debt" ? "Qarzdorlar yo'q 🎉" : "Ro'yxat bo'sh"} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs font-bold text-slate-400">
                <tr>
                  <th className="px-5 py-3">O&apos;quvchi</th>
                  <th className="px-5 py-3">To&apos;langan</th>
                  <th className="px-5 py-3 text-right">Qoldiq</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {shown.map((r) => {
                  const left = Math.max(r.fee - r.paid, 0);
                  const p = r.fee ? Math.min((r.paid / r.fee) * 100, 100) : 100;
                  return (
                    <tr key={r.student_id} className="transition hover:bg-slate-50/70">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={r.full_name} />
                          <div>
                            <div className="font-bold whitespace-nowrap text-slate-900">{r.full_name}</div>
                            <div className="text-xs text-slate-500">{r.group_name ?? "Guruhsiz"}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
                            <div className={`h-full rounded-full ${left === 0 ? "bg-emerald-500" : r.paid ? "bg-amber-400" : "bg-rose-400"}`} style={{ width: `${p}%` }} />
                          </div>
                          <span className="text-xs whitespace-nowrap text-slate-600 tabular-nums">
                            {short(r.paid)} / {short(r.fee)}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right whitespace-nowrap">
                        {left === 0 ? <Badge tone="green">To&apos;langan</Badge> : <span className="font-extrabold text-rose-600 tabular-nums">{formatMoney(left)}</span>}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-1.5">
                          {left > 0 && r.parent_phone && (
                            <a href={`tel:${r.parent_phone.replace(/[^\d+]/g, "")}`} className="btn-ghost btn-sm" aria-label="Qo'ng'iroq">
                              <Phone className="size-3.5" />
                            </a>
                          )}
                          {left > 0 && (
                            <Link href={`/finance/tolovlar?m=${month}&s=${r.student_id}&a=${left}`} className="btn-soft btn-sm">
                              Qabul qilish <ArrowUpRight className="size-3.5" />
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
