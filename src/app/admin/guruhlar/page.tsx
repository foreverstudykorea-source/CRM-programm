import { CalendarDays, Clock, DoorOpen, UserRound, Users, Wallet } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { listGroups, listTeachers } from "@/lib/data";
import { daysLabel, formatMoney } from "@/lib/dates";
import { colorOf, PageHeader } from "@/components/ui";
import { AddGroup } from "./add-group";

export default async function GroupsPage() {
  await requireRole("admin");
  const [groups, teachers] = await Promise.all([listGroups(), listTeachers()]);
  return (
    <div>
      <PageHeader title="Guruhlar" subtitle={`${groups.length} ta guruh`}>
        <AddGroup teachers={teachers} />
      </PageHeader>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {groups.map((g) => {
          const c = colorOf(g.color);
          return (
            <div key={g.id} className="card overflow-hidden">
              <div className={`h-1.5 bg-gradient-to-r ${c.bar}`} />
              <div className="p-5">
                <div className={`inline-flex rounded-lg px-2 py-0.5 text-xs font-semibold ${c.soft} ${c.text}`}>{g.subject}</div>
                <div className="mt-2 text-lg font-bold text-slate-900">{g.name}</div>
                <div className="text-sm text-slate-500">{g.level}</div>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-600">
                  <Item icon={CalendarDays} text={daysLabel(g.days)} />
                  <Item icon={Clock} text={`${g.start_time} – ${g.end_time}`} />
                  <Item icon={DoorOpen} text={g.room} />
                  <Item icon={Users} text={`${g.student_count} o'quvchi`} />
                  <Item icon={UserRound} text={g.teacher_name ?? "—"} />
                  <Item icon={Wallet} text={formatMoney(g.monthly_fee)} />
                </dl>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Item({ icon: Icon, text }: { icon: typeof Clock; text: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <Icon className="size-4 shrink-0 text-slate-400" />
      <span className="truncate">{text}</span>
    </div>
  );
}
