import { Receipt, Trash2 } from "lucide-react";
import { deletePaymentAction } from "@/app/actions";
import { requireRole } from "@/lib/auth";
import { billing, recentPayments } from "@/lib/data";
import { formatDateShort, formatMoney, formatMonth, monthOf, today } from "@/lib/dates";
import { Avatar, Badge, Empty, PageHeader } from "@/components/ui";
import { MonthSwitcher, parseMonth } from "../month-switcher";
import { PaymentForm } from "./payment-form";

export default async function PaymentsPage({ searchParams }: { searchParams: Promise<{ m?: string; s?: string; a?: string }> }) {
  await requireRole("finance");
  const sp = await searchParams;
  const t = today();
  const current = monthOf(t);
  const month = parseMonth(sp.m, current);
  const [payments, rows] = await Promise.all([recentPayments(month, 200), billing(month)]);
  const total = payments.reduce((a, p) => a + p.amount, 0);

  return (
    <div>
      <PageHeader title="To'lovlar" subtitle={`${formatMonth(month)} · ${payments.length} ta to'lov · ${formatMoney(total)}`}>
        <MonthSwitcher month={month} base="/finance/tolovlar" max={current} />
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <section className="card self-start p-5 lg:sticky lg:top-24">
          <h2 className="mb-4 font-semibold text-slate-900">To&apos;lov qabul qilish</h2>
          <PaymentForm
            key={`${sp.s ?? ""}-${month}`}
            students={rows.map((r) => ({ id: r.student_id, name: r.full_name, group: r.group_name, fee: r.fee, left: Math.max(r.fee - r.paid, 0) }))}
            defaultStudent={Number(sp.s) || undefined}
            defaultAmount={Number(sp.a) || undefined}
            month={month}
            today={t}
          />
        </section>

        <section className="card min-w-0">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold text-slate-900">To&apos;lovlar tarixi</h2>
          </div>
          {payments.length === 0 ? (
            <Empty icon={Receipt} title="Bu oyda to'lovlar yo'q" />
          ) : (
            <ul className="divide-y divide-slate-100">
              {payments.map((p) => (
                <li key={p.id} className="flex items-center gap-3 px-5 py-3">
                  <Avatar name={p.full_name} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium text-slate-900">{p.full_name}</div>
                    <div className="truncate text-xs text-slate-500">
                      {p.group_name ?? "—"} · {formatDateShort(p.paid_at)}
                      {p.note && <> · {p.note}</>}
                    </div>
                  </div>
                  <Badge tone="slate">{p.method}</Badge>
                  <div className="w-28 text-right font-semibold whitespace-nowrap text-emerald-600">+{formatMoney(p.amount)}</div>
                  <form action={deletePaymentAction}>
                    <input type="hidden" name="id" value={p.id} />
                    <button className="grid size-8 place-items-center rounded-lg text-slate-300 hover:bg-rose-50 hover:text-rose-600" title="O'chirish" aria-label="O'chirish">
                      <Trash2 className="size-4" />
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
