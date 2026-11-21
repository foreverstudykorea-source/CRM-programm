"use client";

import { BookOpen } from "lucide-react";
import { saveTopicAction } from "@/app/actions/staff";
import { FormMessage, SubmitButton, useToast, useFormAction, v } from "@/components/forms";

export function TopicForm({ groupId, date, topic }: { groupId: number; date: string; topic: string }) {
  const [state, action] = useFormAction(saveTopicAction);
  useToast(state);
  return (
    <form action={action} className="card max-w-xl animate-rise space-y-4 p-5">
      <input type="hidden" name="group_id" value={groupId} />
      <input type="hidden" name="date" value={date} />
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
          <BookOpen className="size-5" />
        </span>
        <div>
          <div className="font-bold text-slate-900">Keyingi dars mavzusi</div>
          <div className="text-xs text-slate-500">O&apos;quvchilar uni o&apos;z sahifasida oldindan ko&apos;radi</div>
        </div>
      </div>
      <input name="topic" defaultValue={v(state, "topic", topic)} className="input" placeholder="Masalan, Present Perfect" maxLength={200} required />
      <FormMessage state={state} />
      <SubmitButton pendingText="Saqlanmoqda…">Saqlash</SubmitButton>
    </form>
  );
}
