"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Check, ChevronDown, Copy, History, Loader2, MessageSquareText, Phone, PhoneOff, Send, StickyNote } from "lucide-react";
import { logCallAction } from "@/app/actions/staff";
import { useToast, useFormAction, v } from "@/components/forms";
import { toast } from "@/components/toast";
import { Avatar, Badge, colorOf } from "@/components/ui";
import type { Absence } from "@/lib/data";

const STATUS = {
  pending: { label: "Kutilmoqda", tone: "amber" as const },
  no_answer: { label: "Javob bermadi", tone: "red" as const },
  called: { label: "Gaplashildi", tone: "green" as const },
  messaged: { label: "Xabar yuborildi", tone: "blue" as const },
};
const OUTCOME_LABEL: Record<string, string> = { called: "Gaplashildi", no_answer: "Javob bermadi", messaged: "Xabar yuborildi" };

const tel = (p: string) => p.replace(/[^\d+]/g, "");

function OutcomeButton({ value, children, className }: { value: string; children: React.ReactNode; className: string }) {
  const { pending, data } = useFormStatus();
  const mine = pending && data?.get("outcome") === value;
  return (
    <button type="submit" name="outcome" value={value} disabled={pending} className={className}>
      {mine ? <Loader2 className="size-3.5 animate-spin" /> : null}
      {children}
    </button>
  );
}

export function CallCard({
  a,
  dateLabel,
  longDate,
  history,
}: {
  a: Absence;
  dateLabel: string;
  longDate: string;
  history: { outcome: string; note: string | null; created_at: string; by_name: string | null }[];
}) {
  const [state, action] = useFormAction(logCallAction);
  useToast(state);
  const [noteOpen, setNoteOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const s = STATUS[a.call_status];
  const c = colorOf(a.group_color);
  const message =
    `Assalomu alaykum${a.parent_name ? `, ${a.parent_name}` : ""}! Forever Study akademiyasidan bezovta qilyapmiz. ` +
    `Farzandingiz ${a.full_name} ${longDate} kuni soat ${a.start_time} dagi "${a.group_name}" darsiga kelmadi. ` +
    `Iltimos, sababini bizga xabar bering. Rahmat!`;

  return (
    <li className={`px-5 py-4 transition ${a.call_status === "pending" ? "" : "bg-slate-50/40"}`}>
      <div className="flex items-start gap-3.5">
        <Avatar name={a.full_name} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-slate-900">{a.full_name}</span>
            <Badge tone={s.tone} dot>
              {s.label}
            </Badge>
            {a.absences_30d >= 3 && <Badge tone="red">30 kunda {a.absences_30d} marta</Badge>}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className={`size-2 rounded-full ${c.dot}`} /> {a.group_name}
            </span>
            <span>
              {dateLabel}, {a.start_time}
            </span>
          </div>

          <div className="mt-3 flex flex-col gap-3 rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="eyebrow">Ota-ona</div>
              <div className="truncate text-sm font-bold text-slate-800">{a.parent_name ?? "Ko'rsatilmagan"}</div>
              <div className="font-mono text-sm text-slate-600 tabular-nums">{a.parent_phone ?? "Telefon yo'q"}</div>
            </div>
            <div className="flex flex-wrap gap-2">
              {a.parent_phone ? (
                <>
                  <a href={`tel:${tel(a.parent_phone)}`} className="btn-primary btn-sm px-4 py-2">
                    <Phone className="size-3.5" /> Qo&apos;ng&apos;iroq
                  </a>
                  <a href={`sms:${tel(a.parent_phone)}?body=${encodeURIComponent(message)}`} className="btn-ghost btn-sm py-2">
                    <MessageSquareText className="size-3.5" /> SMS
                  </a>
                </>
              ) : null}
              <button
                type="button"
                className="btn-ghost btn-sm py-2"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(message);
                    toast("Xabar matni nusxalandi");
                  } catch {
                    toast("Nusxalab bo'lmadi", "error");
                  }
                }}
              >
                <Copy className="size-3.5" /> Matn
              </button>
            </div>
          </div>

          <form action={action} className="mt-3">
            <input type="hidden" name="attendance_id" value={a.attendance_id} />
            {noteOpen && (
              <input
                name="note"
                className="input mb-2 animate-pop"
                placeholder="Izoh: masalan, kasal bo'lgan, ertaga keladi"
                maxLength={500}
                defaultValue={v(state, "note")}
                autoFocus
              />
            )}
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 text-xs font-semibold text-slate-400">Natija:</span>
              <OutcomeButton value="called" className="btn btn-sm bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/15 hover:bg-emerald-100">
                <Check className="size-3.5" /> Gaplashildi
              </OutcomeButton>
              <OutcomeButton value="no_answer" className="btn btn-sm bg-rose-50 text-rose-700 ring-1 ring-rose-600/15 hover:bg-rose-100">
                <PhoneOff className="size-3.5" /> Javob bermadi
              </OutcomeButton>
              <OutcomeButton value="messaged" className="btn btn-sm bg-sky-50 text-sky-700 ring-1 ring-sky-600/15 hover:bg-sky-100">
                <Send className="size-3.5" /> Xabar yuborildi
              </OutcomeButton>
              {!noteOpen && (
                <button type="button" onClick={() => setNoteOpen(true)} className="btn btn-sm text-slate-500 hover:bg-slate-100">
                  <StickyNote className="size-3.5" /> Izoh
                </button>
              )}
            </div>
          </form>

          {(a.note || history.length > 0) && (
            <div className="mt-3">
              {a.note && (
                <p className="text-xs text-slate-500">
                  &ldquo;{a.note}&rdquo; {a.updated_by_name && <>— {a.updated_by_name}</>}
                </p>
              )}
              {history.length > 0 && (
                <button
                  type="button"
                  onClick={() => setHistoryOpen((o) => !o)}
                  className="mt-1.5 flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800"
                >
                  <History className="size-3.5" /> {history.length} ta urinish
                  <ChevronDown className={`size-3.5 transition ${historyOpen ? "rotate-180" : ""}`} />
                </button>
              )}
              {historyOpen && (
                <ol className="mt-2 animate-pop space-y-1.5 border-l-2 border-slate-200 pl-3">
                  {history.map((h, i) => (
                    <li key={i} className="text-xs text-slate-600">
                      <span className="font-bold text-slate-800">{OUTCOME_LABEL[h.outcome] ?? h.outcome}</span>
                      {h.note && <> · {h.note}</>}
                      <span className="text-slate-400">
                        {" "}
                        · {h.by_name ?? "—"},{" "}
                        {new Intl.DateTimeFormat("ru-RU", { timeZone: "Asia/Tashkent", dateStyle: "short", timeStyle: "short" }).format(new Date(h.created_at))}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          )}
        </div>
      </div>
    </li>
  );
}
