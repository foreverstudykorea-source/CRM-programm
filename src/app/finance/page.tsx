import Link from "next/link";
import { AlertTriangle, BadgeCheck, CircleDollarSign, Target, Users } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { billing, methodTotals, monthlyTotals } from "@/lib/data";
import { formatMoney, formatMonth, monthOf, today, MONTHS_SHORT } from "@/lib/dates";
import { Avatar, Badge, Empty, PageHeader, Stat } from "@/components/ui";
import { MonthSwitcher, parseMonth } from "./month-switcher";

const TABS = [
  { key: "debt", label: "Qarzdorlar" },
  { key: "paid", label: "To'laganlar" },
  { key: "all", label: "Hammasi" },
] as const;

const short = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(1).replace(".0", "")} mln` : `${Math.round(n / 1000)} ming`);

export default async function FinanceHome({ searchParams }: { searchParams: Promise<{ m?: string; f?: string }> }) {
  await requireRole("finance");
  const sp = await searchParams;
  const current = monthOf(today());
  const month = parseMonth(sp.m, current);
  const tab = TABS.find((x) => x.key === sp.f)?.key ?? "debt";

  const [rows, history, methods] = await Promise.all([billing(month), monthlyTotals(month, 6), methodTotals(month)]);
  const expected = rows.reduce((a, r) => a + r.fee, 0);
  const collected = rows.reduce((a, r) => a + Math.min(r.paid, r.fee || r.paid), 0);
  const received = rows.reduce((a, r) => a + r.paid, 0);
  const debtors = rows.filter((r) => r.paid < r.fee);
  const debt = debtors.reduce((a, r) => a + (r.fee - r.paid), 0);
  const pct = expected ? Math.round((collected / expected) * 100) : 0;
  const shown = tab === "all" ? rows : tab === "debt" ? debtors : rows.filter((r) => r.paid >= r.fee);
  const maxBar = Math.max(...history.map((h) => h.total), 1);
  const methodSum = methods.reduce((a, m) => a + m.total, 0) || 1;
  const METHOD_COLORS = ["bg-brand-500", "bg-emerald-500", "bg-amber-400", "bg-rose-500", "bg-sky-500"];

  return (
    <div>
      <PageHeader title="Moliya" subtitle="Oylik tushum, qarzdorlik va to'lovlar">
        <MonthSwitcher month={month} base="/finance" max={current} />
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat icon={Target} label="Kutilgan tushum" value={short(expected)} hint={formatMoney(expected)} />
        <Stat icon={CircleDollarSign} tone="green" label="Tushgan" value={short(received)} hint={`Rejaning ${pct}%`} />
        <Stat icon={AlertTriangle} tone="red" label="Qarzdorlik" value={short(debt)} hint={`${debtors.length} ta o'quvchi`} />
        <Stat icon={BadgeCheck} tone="amber" label="To'liq to'laganlar" value={`${rows.length - debtors.length}/${rows.length}`} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="card p-5 lg:col-span-2">
          <div className="flex items-baseline justify-between">
            <h2 className="font-semibold text-slate-900">Oxirgi 6 oy tushumi</h2>
            <span className="text-xs text-slate-500">so&apos;mda</span>
          </div>
          <div className="mt-6 flex h-48 items-end gap-3">
            {history.map((h) => (
              <div key={h.month} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                <span className="text-[11px] font-semibold text-slate-600">{short(h.total)}</span>
                <div
                  className={`w-full max-w-14 rounded-t-lg ${h.month === month ? "bg-gradient-to-t from-brand-600 to-violet-500" : "bg-brand-100"}`}
                  style={{ height: `${Math.max((h.total / maxBar) * 100, 2)}%` }}
                  title={`${formatMonth(h.month)}: ${formatMoney(h.total)}`}
                />
                <span className={`text-xs ${h.month === month ? "font-bold text-slate-900" : "text-slate-500"}`}>
                  {MONTHS_SHORT[Number(h.month.slice(5)) - 1]}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="card p-5">
          <h2 className="font-semibold text-slate-900">To&apos;lov usullari</h2>
          <div className="mt-2 text-xs text-slate-500">{formatMonth(month)}</div>
          <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-slate-100">
            {methods.map((m, i) => (
              <div key={m.method} className={METHOD_COLORS[i % METHOD_COLORS.length]} style={{ width: `${(m.total / methodSum) * 100}%` }} />
            ))}
          </div>
          <ul className="mt-4 space-y-2.5 text-sm">
            {methods.length === 0 && <li className="text-slate-500">To&apos;lovlar yo&apos;q</li>}
            {methods.map((m, i) => (
              <li key={m.method} className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-slate-700">
                  <span className={`size-2.5 rounded-full ${METHOD_COLORS[i % METHOD_COLORS.length]}`} />
                  {m.method} <span className="text-xs text-slate-400">({m.n})</span>
                </span>
                <span className="font-semibold text-slate-900">{formatMoney(m.total)}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="card mt-6">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-semibold text-slate-900">O&apos;quvchilar bo&apos;yicha</h2>
          <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
            {TABS.map((x) => (
              <Link key={x.key} href={`/finance?m=${month}&f=${x.key}`} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${tab === x.key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>
                {x.label}
              </Link>
            ))}
          </div>
        </div>
        {shown.length === 0 ? (
          <Empty icon={Users} title={tab === "debt" ? "Qarzdorlar yo'q" : "Ro'yxat bo'sh"} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">
                <tr>
                  <th className="px-5 py-3">O&apos;quvchi</th>
                  <th className="px-5 py-3 text-right">Oylik</th>
                  <th className="px-5 py-3 text-right">To&apos;langan</th>
                  <th className="px-5 py-3 text-right">Qoldiq</th>
                  <th className="px-5 py-3">Holat</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {shown.map((r) => {
                  const left = Math.max(r.fee - r.paid, 0);
                  return (
                    <tr key={r.student_id} className="hover:bg-slate-50/60">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={r.full_name} />
                          <div>
                            <div className="font-medium text-slate-900">{r.full_name}</div>
                            <div className="text-xs text-slate-500">{r.group_name ?? "Guruhsiz"}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right whitespace-nowrap text-slate-600">{formatMoney(r.fee)}</td>
                      <td className="px-5 py-3 text-right whitespace-nowrap font-medium text-slate-900">{formatMoney(r.paid)}</td>
                      <td className={`px-5 py-3 text-right whitespace-nowrap font-semibold ${left ? "text-rose-600" : "text-slate-400"}`}>{left ? formatMoney(left) : "—"}</td>
                      <td className="px-5 py-3">
                        {left === 0 ? <Badge tone="green">To&apos;langan</Badge> : r.paid > 0 ? <Badge tone="amber">Qisman</Badge> : <Badge tone="red">To&apos;lanmagan</Badge>}
                      </td>
                      <td className="px-5 py-3 text-right">
                        {left > 0 && (
                          <Link href={`/finance/tolovlar?m=${month}&s=${r.student_id}&a=${left}`} className="btn-ghost py-1.5 text-xs whitespace-nowrap">
                            To&apos;lov qabul qilish
                          </Link>
                        )}
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
