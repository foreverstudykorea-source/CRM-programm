import type { Metadata } from "next";
import { CalendarDays, Clock, DoorOpen, Layers, UserRound, Users, Wallet } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { listGroups, listTeachers } from "@/lib/data";
import { daysLabel, formatMoney } from "@/lib/dates";
import { colorOf, Empty, PageHeader } from "@/components/ui";
import { AddGroup } from "./add-group";

export const metadata: Metadata = { title: "Guruhlar" };

export default async function GroupsPage() {
  await requireRole("admin");
  const [groups, teachers] = await Promise.all([listGroups(), listTeachers()]);
  return (
    <div>
      <PageHeader eyebrow="Administrator" title="Guruhlar" subtitle={`${groups.length} ta guruh`}>
        <AddGroup teachers={teachers} />
      </PageHeader>
      {groups.length === 0 ? (
        <div className="card">
          <Empty icon={Layers} title="Hali guruh yo'q" text="Birinchi guruhni yarating, keyin o'quvchilarni qo'shing." />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {groups.map((g, i) => {
            const c = colorOf(g.color);
            return (
              <div key={g.id} className="card card-hover animate-rise overflow-hidden" style={{ animationDelay: `${i * 50}ms` }}>
                <div className={`relative bg-gradient-to-br ${c.grad} px-5 pt-5 pb-4 text-white`}>
                  <div className="grid-pattern pointer-events-none absolute inset-0 opacity-60" />
                  <div className="relative">
                    <div className="text-xs font-bold text-white/80">{g.subject}</div>
                    <div className="mt-1 text-lg font-extrabold">{g.name}</div>
                    <div className="text-sm text-white/80">{g.level}</div>
                  </div>
                </div>
                <dl className="grid grid-cols-2 gap-3 p-5 text-sm text-slate-600">
                  <Item icon={CalendarDays} text={daysLabel(g.days)} />
                  <Item icon={Clock} text={`${g.start_time}–${g.end_time}`} />
                  <Item icon={DoorOpen} text={g.room} />
                  <Item icon={Users} text={`${g.student_count} o'quvchi`} />
                  <Item icon={UserRound} text={g.teacher_name ?? "Ustoz yo'q"} />
                  <Item icon={Wallet} text={formatMoney(g.monthly_fee)} />
                </dl>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Item({ icon: Icon, text }: { icon: typeof Clock; text: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <Icon className="size-4 shrink-0 text-slate-400" />
      <span className="truncate font-medium">{text}</span>
    </div>
  );
}
