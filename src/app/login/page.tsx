import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CalendarCheck2, Lock, PhoneCall, Wallet } from "lucide-react";
import { getCurrentUser, HOME } from "@/lib/auth";
import { activeAdminCount } from "@/lib/data";
import { Logo } from "@/components/logo";
import { LoginForm } from "./login-form";
import Link from "next/link";

export const metadata: Metadata = { title: "Kirish" };

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect(HOME[user.role]);
  const needsSetup = (await activeAdminCount()) === 0;

  return (
    <div className="grid min-h-dvh bg-white lg:grid-cols-[1.1fr_1fr]">
      <section className="relative hidden overflow-hidden bg-ink-950 p-12 text-white lg:flex lg:flex-col">
        <div className="mesh absolute inset-0 opacity-80" />
        <div className="grid-pattern absolute inset-0" />
        <div className="relative">
          <Logo light />
        </div>

        <div className="relative my-auto max-w-lg py-12">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80 ring-1 ring-white/15 backdrop-blur">
            <Lock className="size-3.5" /> Himoyalangan boshqaruv tizimi
          </div>
          <h1 className="mt-5 text-[44px] leading-[1.08] font-extrabold tracking-tight">
            Akademiyangiz
            <br />
            bitta ekranda.
          </h1>
          <p className="mt-4 max-w-md text-base text-white/70">
            Dars jadvali, davomat, ota-onalar bilan aloqa va to&apos;lovlar. Har bir xodim faqat o&apos;z bo&apos;limini ko&apos;radi.
          </p>

          <div className="mt-10 grid max-w-md gap-3">
            {[
              { icon: CalendarCheck2, title: "Bir bosishda davomat", text: "Ustoz telefondan 20 soniyada belgilaydi", c: "from-emerald-400 to-teal-500" },
              { icon: PhoneCall, title: "Kelmaganlarga darhol qo'ng'iroq", text: "Admin ro'yxatni va qo'ng'iroqlar tarixini ko'radi", c: "from-rose-400 to-orange-400" },
              { icon: Wallet, title: "To'lov va qarzdorlik nazorati", text: "Moliya bo'limi har bir so'mni kuzatadi", c: "from-sky-400 to-blue-500" },
            ].map(({ icon: Icon, title, text, c }, i) => (
              <div
                key={title}
                className="flex animate-rise items-center gap-4 rounded-2xl bg-white/[0.07] p-4 ring-1 ring-white/10 backdrop-blur-md"
                style={{ animationDelay: `${120 + i * 90}ms` }}
              >
                <span className={`grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${c} shadow-lg`}>
                  <Icon className="size-5" />
                </span>
                <div>
                  <div className="font-bold">{title}</div>
                  <div className="text-sm text-white/60">{text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative text-xs text-white/40">© {new Date().getFullYear()} Forever Study Academy</div>
      </section>

      <section className="flex items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-[400px] animate-rise">
          <div className="mb-10 lg:hidden">
            <Logo />
          </div>
          <h2 className="text-[28px] font-extrabold tracking-tight text-slate-900">Xush kelibsiz</h2>
          <p className="mt-1.5 text-sm text-slate-500">Davom etish uchun login va parolingizni kiriting</p>
          {needsSetup && (
            <div className="mt-6 rounded-2xl bg-brand-50 p-4 text-sm text-brand-800 ring-1 ring-brand-200/70">
              Tizim hali sozlanmagan.{" "}
              <Link href="/setup" className="font-bold underline underline-offset-2">
                Birinchi administratorni yarating
              </Link>
            </div>
          )}
          <LoginForm />
          <p className="mt-8 flex items-center justify-center gap-1.5 text-center text-xs text-slate-400">
            <Lock className="size-3" /> Parolni unutdingizmi? Administratorga murojaat qiling.
          </p>
        </div>
      </section>
    </div>
  );
}
