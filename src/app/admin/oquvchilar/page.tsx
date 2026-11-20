import { Search, Users } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { listGroups, listStudents } from "@/lib/data";
import { formatDateShort } from "@/lib/dates";
import { Avatar, Badge, Empty, PageHeader } from "@/components/ui";
import { AddStudent } from "./add-student";

export default async function StudentsPage({ searchParams }: { searchParams: Promise<{ q?: string; g?: string }> }) {
  await requireRole("admin");
  const sp = await searchParams;
  const [students, groups] = await Promise.all([listStudents(sp.q, Number(sp.g) || undefined), listGroups()]);

  return (
    <div>
      <PageHeader title="O'quvchilar" subtitle={`${students.length} ta faol o'quvchi`}>
        <AddStudent groups={groups.map((g) => ({ id: g.id, name: g.name }))} />
      </PageHeader>

      <form className="card mb-4 flex flex-col gap-2 p-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
          <input name="q" defaultValue={sp.q} placeholder="Ism yoki telefon bo'yicha qidirish" className="input pl-9" />
        </div>
        <select name="g" defaultValue={sp.g ?? ""} className="input sm:w-64">
          <option value="">Barcha guruhlar</option>
          {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        <button className="btn-primary">Qidirish</button>
      </form>

      <section className="card overflow-hidden">
        {students.length === 0 ? (
          <Empty icon={Users} title="O'quvchi topilmadi" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">
                <tr>
                  <th className="px-5 py-3">O&apos;quvchi</th>
                  <th className="px-5 py-3">Guruh</th>
                  <th className="px-5 py-3">Ota-ona</th>
                  <th className="px-5 py-3">Login</th>
                  <th className="px-5 py-3">Qo&apos;shilgan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={s.full_name} />
                        <div>
                          <div className="font-medium text-slate-900">{s.full_name}</div>
                          <div className="text-xs text-slate-500">{s.phone ?? "—"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">{s.group_name ? <Badge tone="brand">{s.group_name}</Badge> : <Badge>Guruhsiz</Badge>}</td>
                    <td className="px-5 py-3">
                      <div className="text-slate-800">{s.parent_name ?? "—"}</div>
                      {s.parent_phone && <a href={`tel:${s.parent_phone.replace(/[^\d+]/g, "")}`} className="text-xs text-brand-600 hover:underline">{s.parent_phone}</a>}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-slate-600">{s.login ?? "—"}</td>
                    <td className="px-5 py-3 text-slate-500">{formatDateShort(s.joined_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
