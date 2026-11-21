import type { Metadata } from "next";
import { Receipt } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { billing, recentPayments } from "@/lib/data";
import { formatDateShort, formatMoney, formatMonth, monthOf, today } from "@/lib/dates";
import { id as idSchema } from "@/lib/validation";
import { Avatar, Badge, Empty, PageHeader, SectionTitle } from "@/components/ui";
import { MonthSwitcher, parseMonth } from "../month-switcher";
import { PaymentForm } from "./payment-form";
import { VoidPayment } from "./void-payment";

export const metadata: Metadata = { title: "To'lovlar" };

export default async function PaymentsPage({ searchParams }: { searchParams: Promise<{ m?: string; s?: string; a?: string }> }) {
  await requireRole("finance");
  const sp = await searchParams;
  const t = today();
  const current = monthOf(t);
  const month = parseMonth(sp.m, current);
  const [payments, rows] = await Promise.all([recentPayments(month, 300), billing(month)]);
  const valid = payments.filter((p) => !p.voided_at);
  const total = valid.reduce((a, p) => a + p.amount, 0);
  const s = idSchema.safeParse(sp.s);
  const a = Number(String(sp.a ?? "").replace(/\D/g, "").slice(0, 10)) || undefined;

  return (
    <div>
      <PageHeader eyebrow="Moliya" title="To'lovlar" subtitle={`${formatMonth(month)} · ${valid.length} ta to'lov · ${formatMoney(total)}`}>
        <MonthSwitcher month={month} base="/finance/tolovlar" max={current} />
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[370px_1fr]">
        <section className="card animate-rise self-start p-5 lg:sticky lg:top-24">
          <h2 className="mb-4 font-bold text-slate-900">To&apos;lov qabul qilish</h2>
          <PaymentForm
            key={`${s.success ? s.data : ""}-${month}`}
            students={rows.map((r) => ({ id: r.student_id, name: r.full_name, group: r.group_name, fee: r.fee, left: Math.max(r.fee - r.paid, 0) }))}
            defaultStudent={s.success ? s.data : undefined}
            defaultAmount={a}
            month={month}
            today={t}
          />
        </section>

        <section className="card min-w-0 animate-rise" style={{ animationDelay: "80ms" }}>
          <SectionTitle title="To'lovlar tarixi" hint="To'lovlar o'chirilmaydi: xato bo'lsa, sababi bilan bekor qilinadi" />
          {payments.length === 0 ? (
            <Empty icon={Receipt} title="Bu oyda to'lovlar yo'q" />
          ) : (
            <ul className="divide-y divide-slate-100">
              {payments.map((p) => {
                const voided = !!p.voided_at;
                return (
                  <li key={p.id} className={`flex items-center gap-3 px-5 py-3 ${voided ? "bg-slate-50/70" : ""}`}>
                    <Avatar name={p.full_name} className={voided ? "opacity-40 grayscale" : ""} />
                    <div className="min-w-0 flex-1">
                      <div className={`truncate font-bold ${voided ? "text-slate-400 line-through" : "text-slate-900"}`}>{p.full_name}</div>
                      <div className="truncate text-xs text-slate-500">
                        {p.group_name ?? "—"} · {formatDateShort(p.paid_at)} · {p.created_by_name ?? "—"}
                        {p.note && <> · {p.note}</>}
                        {voided && <span className="font-semibold text-rose-600"> · Bekor qilingan: {p.void_reason}</span>}
                      </div>
                    </div>
                    <Badge tone="slate">{p.method}</Badge>
                    <div className={`w-32 text-right font-extrabold whitespace-nowrap tabular-nums ${voided ? "text-slate-300 line-through" : "text-emerald-600"}`}>
                      +{formatMoney(p.amount)}
                    </div>
                    {!voided ? <VoidPayment id={p.id} label={`${p.full_name}, ${formatMoney(p.amount)}`} /> : <span className="w-8" />}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
