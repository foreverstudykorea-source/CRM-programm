import type { Metadata } from "next";
import { Laptop, LogOut, ShieldCheck, Smartphone } from "lucide-react";
import { logoutAction, logoutOtherDevicesAction } from "@/app/actions/auth";
import { getSession, requireUser } from "@/lib/auth";
import { sessionsForUser, getStudentByUser } from "@/lib/data";
import { navFor } from "@/lib/nav";
import { Logo } from "@/components/logo";
import { Shell, ROLE_LABEL } from "@/components/shell";
import { Avatar, Badge, PageHeader, SectionTitle } from "@/components/ui";
import { PasswordForm } from "./password-form";

export const metadata: Metadata = { title: "Hisob" };

function device(ua: string | null) {
  if (!ua) return { name: "Noma'lum qurilma", mobile: false };
  const mobile = /Mobile|Android|iPhone/i.test(ua);
  const os = /Android/i.test(ua) ? "Android" : /iPhone|iPad/i.test(ua) ? "iOS" : /Windows/i.test(ua) ? "Windows" : /Mac OS/i.test(ua) ? "macOS" : /Linux/i.test(ua) ? "Linux" : "";
  const br = /Edg\//.test(ua) ? "Edge" : /OPR\//.test(ua) ? "Opera" : /YaBrowser/.test(ua) ? "Yandex" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "Brauzer";
  return { name: [br, os].filter(Boolean).join(" · "), mobile };
}

const fmt = (ts: string) =>
  new Intl.DateTimeFormat("ru-RU", { timeZone: process.env.APP_TIMEZONE || "Asia/Tashkent", dateStyle: "short", timeStyle: "short" }).format(new Date(ts));

export default async function AccountPage() {
  const user = await requireUser({ allowTempPassword: true });
  const current = await getSession();

  if (user.must_change_password) {
    return (
      <div className="min-h-dvh bg-surface px-4 py-10">
        <div className="mx-auto max-w-md">
          <Logo />
          <div className="card mt-8 animate-rise p-6 sm:p-8">
            <div className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-amber-300 to-orange-500 text-white">
              <ShieldCheck className="size-6" />
            </div>
            <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900">Yangi parol o&apos;rnating</h1>
            <p className="mt-1.5 text-sm text-slate-500">
              Salom, {user.name.split(" ")[0]}! Siz vaqtinchalik parol bilan kirdingiz. Davom etish uchun faqat o&apos;zingiz biladigan parol o&apos;ylab toping.
            </p>
            <PasswordForm forced />
          </div>
          <form action={logoutAction} className="mt-4 text-center">
            <button className="text-sm font-semibold text-slate-500 hover:text-slate-800">Chiqish</button>
          </form>
        </div>
      </div>
    );
  }

  const sessions = await sessionsForUser(user.id);
  const others = sessions.filter((s) => s.id !== current?.id).length;
  const student = user.role === "student" ? await getStudentByUser(user.id) : null;

  return (
    <Shell user={user} nav={navFor(user.role)}>
      <PageHeader eyebrow="Hisob" title="Hisob va xavfsizlik" subtitle="Parolingiz va faol qurilmalaringiz" />
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-2">
          <section className="card animate-rise p-5">
            <div className="flex items-center gap-4">
              <Avatar name={user.name} size="lg" />
              <div>
                <div className="text-lg font-extrabold text-slate-900">{user.name}</div>
                <div className="mt-0.5 flex items-center gap-2 text-sm text-slate-500">
                  <Badge tone="brand">{ROLE_LABEL[user.role]}</Badge> <span className="font-mono">{user.login}</span>
                </div>
              </div>
            </div>
            {student?.group && (
              <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                Guruh: <span className="font-bold text-slate-800">{student.group.name}</span>
              </div>
            )}
          </section>
          <section className="card animate-rise" style={{ animationDelay: "60ms" }}>
            <SectionTitle title="Parolni almashtirish" hint="Boshqa qurilmalardagi sessiyalar avtomatik yopiladi" />
            <div className="p-5">
              <PasswordForm />
            </div>
          </section>
        </div>

        <section className="card animate-rise lg:col-span-3" style={{ animationDelay: "120ms" }}>
          <SectionTitle title="Faol qurilmalar" hint="12 soat harakatsizlikdan so'ng avtomatik chiqariladi">
            {others > 0 && (
              <form action={logoutOtherDevicesAction}>
                <button className="btn-ghost btn-sm text-rose-600">
                  <LogOut className="size-3.5" /> Boshqalaridan chiqish ({others})
                </button>
              </form>
            )}
          </SectionTitle>
          <ul className="divide-y divide-slate-100">
            {sessions.map((s) => {
              const d = device(s.user_agent);
              const Icon = d.mobile ? Smartphone : Laptop;
              return (
                <li key={s.id} className="flex items-center gap-4 px-5 py-4">
                  <span className="grid size-10 place-items-center rounded-xl bg-slate-100 text-slate-500">
                    <Icon className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 font-semibold text-slate-800">
                      {d.name} {s.id === current?.id && <Badge tone="green" dot>Shu qurilma</Badge>}
                    </div>
                    <div className="text-xs text-slate-500">
                      {s.ip ?? "IP noma'lum"} · oxirgi faollik {fmt(s.last_seen_at)}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </Shell>
  );
}
