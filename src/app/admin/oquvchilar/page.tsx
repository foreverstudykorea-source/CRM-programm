import type { Metadata } from "next";
import { Search, Users } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { listGroups, listStudents } from "@/lib/data";
import { formatDateShort } from "@/lib/dates";
import { id as idSchema } from "@/lib/validation";
import { Avatar, Badge, colorOf, Empty, PageHeader } from "@/components/ui";
import { UserActions } from "../user-actions";
import { AddStudent } from "./add-student";

export const metadata: Metadata = { title: "O'quvchilar" };

export default async function StudentsPage({ searchParams }: { searchParams: Promise<{ q?: string; g?: string }> }) {
  await requireRole("admin");
  const sp = await searchParams;
  const search = typeof sp.q === "string" ? sp.q.trim().slice(0, 60) : undefined;
  const gid = idSchema.safeParse(sp.g);
  const [students, groups] = await Promise.all([listStudents(search || undefined, gid.success ? gid.data : undefined), listGroups()]);

  return (
    <div>
      <PageHeader eyebrow="Administrator" title="O'quvchilar" subtitle={`${students.length} ta faol o'quvchi`}>
        <AddStudent groups={groups.map((g) => ({ id: g.id, name: g.name }))} />
      </PageHeader>

      <form className="card mb-4 flex animate-rise flex-col gap-2 p-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" />
          <input name="q" defaultValue={search} placeholder="Ism yoki telefon bo'yicha qidirish" className="input pl-10" maxLength={60} />
        </div>
        <select name="g" defaultValue={gid.success ? String(gid.data) : ""} className="input sm:w-64">
          <option value="">Barcha guruhlar</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
        <button className="btn-dark">Qidirish</button>
      </form>

      <section className="card animate-rise overflow-hidden" style={{ animationDelay: "80ms" }}>
        {students.length === 0 ? (
          <Empty icon={Users} title="O'quvchi topilmadi" text="Qidiruvni o'zgartirib ko'ring yoki yangi o'quvchi qo'shing." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 text-left text-xs font-bold text-slate-400">
                <tr>
                  <th className="px-5 py-3">O&apos;quvchi</th>
                  <th className="px-5 py-3">Guruh</th>
                  <th className="px-5 py-3">Davomat</th>
                  <th className="px-5 py-3">Ota-ona</th>
                  <th className="px-5 py-3">Kabinet</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((s) => {
                  const c = colorOf(s.group_color);
                  return (
                    <tr key={s.id} className="transition hover:bg-slate-50/70">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={s.full_name} />
                          <div>
                            <div className="font-bold whitespace-nowrap text-slate-900">{s.full_name}</div>
                            <div className="text-xs text-slate-500">
                              {s.phone ?? "Telefon yo'q"} · {formatDateShort(s.joined_at)} dan
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        {s.group_name ? (
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold whitespace-nowrap ${c.soft} ${c.text}`}>
                            <span className={`size-1.5 rounded-full ${c.dot}`} /> {s.group_name}
                          </span>
                        ) : (
                          <Badge>Guruhsiz</Badge>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        {s.rate == null ? (
                          <span className="text-slate-400">—</span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className={`h-full rounded-full ${s.rate >= 85 ? "bg-emerald-500" : s.rate >= 70 ? "bg-amber-400" : "bg-rose-500"}`}
                                style={{ width: `${s.rate}%` }}
                              />
                            </div>
                            <span className="text-xs font-bold text-slate-700 tabular-nums">{s.rate}%</span>
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <div className="whitespace-nowrap text-slate-800">{s.parent_name ?? "—"}</div>
                        {s.parent_phone && (
                          <a href={`tel:${s.parent_phone.replace(/[^\d+]/g, "")}`} className="text-xs font-semibold whitespace-nowrap text-brand-600 hover:underline">
                            {s.parent_phone}
                          </a>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        {s.login ? (
                          <span className="font-mono text-xs text-slate-600">{s.login}</span>
                        ) : (
                          <span className="text-xs text-slate-400">Yo&apos;q</span>
                        )}
                        {s.login && !s.has_password && <div className="text-[11px] font-semibold text-amber-600">Parol berilmagan</div>}
                      </td>
                      <td className="px-5 py-3 text-right">
                        {s.user_id && <UserActions userId={s.user_id} name={s.full_name} active compact />}
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
