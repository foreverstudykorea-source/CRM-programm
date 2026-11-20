"use client";

import { useActionState, useState } from "react";
import { Copy, MessageSquareText, Phone, Check } from "lucide-react";
import { updateCallAction } from "@/app/actions";
import { SubmitButton } from "@/components/forms";
import { Avatar, Badge } from "@/components/ui";
import type { Absence } from "@/lib/data";

const STATUS = {
  pending: { label: "Kutilmoqda", tone: "amber" as const },
  no_answer: { label: "Javob bermadi", tone: "red" as const },
  called: { label: "Gaplashildi", tone: "green" as const },
  messaged: { label: "Xabar yuborildi", tone: "blue" as const },
};

const tel = (p: string) => p.replace(/[^\d+]/g, "");

export function CallRow({ a }: { a: Absence & { dateLabel: string; longDate: string } }) {
  const [state, action] = useActionState(updateCallAction, undefined);
  const [copied, setCopied] = useState(false);
  const s = STATUS[a.call_status];
  const message =
    `Assalomu alaykum${a.parent_name ? `, ${a.parent_name}` : ""}! Forever Study akademiyasidan bezovta qilyapmiz. ` +
    `Farzandingiz ${a.full_name} ${a.longDate} kuni soat ${a.start_time} dagi "${a.group_name}" darsiga kelmadi. ` +
    `Iltimos, sababini bizga xabar bering. Rahmat!`;

  return (
    <li className="px-5 py-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <Avatar name={a.full_name} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-slate-900">{a.full_name}</span>
              <Badge tone={s.tone}>{s.label}</Badge>
              {a.absences_30d >= 3 && <Badge tone="red">30 kunda {a.absences_30d} marta</Badge>}
            </div>
            <div className="mt-0.5 text-sm text-slate-500">
              {a.group_name} · {a.dateLabel}, {a.start_time}
            </div>
            <div className="mt-2 text-sm">
              <span className="text-slate-500">Ota-ona: </span>
              <span className="font-medium text-slate-800">{a.parent_name ?? "—"}</span>
              {a.parent_phone && <span className="ml-2 whitespace-nowrap text-slate-600">{a.parent_phone}</span>}
            </div>
            {a.note && (
              <div className="mt-1.5 text-xs text-slate-500">
                &ldquo;{a.note}&rdquo; {a.updated_by_name && <>— {a.updated_by_name}</>}
              </div>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          {a.parent_phone && (
            <>
              <a href={`tel:${tel(a.parent_phone)}`} className="btn-primary py-2 text-xs">
                <Phone className="size-3.5" /> Qo&apos;ng&apos;iroq
              </a>
              <a href={`sms:${tel(a.parent_phone)}?body=${encodeURIComponent(message)}`} className="btn-ghost py-2 text-xs">
                <MessageSquareText className="size-3.5" /> SMS
              </a>
            </>
          )}
          <button
            type="button"
            className="btn-ghost py-2 text-xs"
            onClick={async () => {
              await navigator.clipboard.writeText(message);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            title="Telegram yoki boshqa ilovaga yuborish uchun nusxa olish"
          >
            {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />} Matn
          </button>
        </div>
      </div>

      <form action={action} className="mt-3 flex flex-col gap-2 rounded-xl bg-slate-50 p-2 sm:flex-row sm:items-center lg:ml-12">
        <input type="hidden" name="attendance_id" value={a.attendance_id} />
        <select name="status" defaultValue={a.call_status} className="input py-2 sm:w-44">
          <option value="pending">Kutilmoqda</option>
          <option value="called">Gaplashildi</option>
          <option value="no_answer">Javob bermadi</option>
          <option value="messaged">Xabar yuborildi</option>
        </select>
        <input name="note" defaultValue={a.note ?? ""} placeholder="Izoh: masalan, kasal bo'lgan" className="input flex-1 py-2" />
        <SubmitButton className="btn-ghost py-2 text-xs">Saqlash</SubmitButton>
        {state?.ok && <span className="px-1 text-xs font-medium text-emerald-600">✓</span>}
        {state?.error && <span className="px-1 text-xs font-medium text-rose-600">{state.error}</span>}
      </form>
    </li>
  );
}
