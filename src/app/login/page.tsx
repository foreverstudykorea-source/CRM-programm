import { redirect } from "next/navigation";
import { CalendarCheck2, PhoneCall, Wallet } from "lucide-react";
import { getCurrentUser, HOME } from "@/lib/auth";
import { Logo } from "@/components/logo";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect(HOME[user.role]);

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <section className="relative hidden overflow-hidden bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#6d28d9] p-12 text-white lg:flex lg:flex-col">
        <div className="pointer-events-none absolute -top-24 -right-24 size-96 rounded-full bg-fuchsia-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 size-[28rem] rounded-full bg-indigo-400/20 blur-3xl" />
        <Logo light />
        <div className="relative mt-auto max-w-md">
          <h1 className="text-4xl leading-tight font-extrabold tracking-tight">
            Akademiyangizni bitta joydan boshqaring
          </h1>
          <p className="mt-4 text-base text-white/75">
            Dars jadvali, davomat, ota-onalar bilan aloqa va to&apos;lovlar. Har bir xodim faqat o&apos;ziga kerakli
            bo&apos;limni ko&apos;radi.
          </p>
          <ul className="mt-8 space-y-3 text-sm">
            {[
              { icon: CalendarCheck2, text: "Ustoz bir bosishda davomat qiladi" },
              { icon: PhoneCall, text: "Admin kelmaganlar ota-onasiga darhol qo'ng'iroq qiladi" },
              { icon: Wallet, text: "Moliya bo'limi to'lov va qarzdorlikni kuzatadi" },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <span className="grid size-8 place-items-center rounded-lg bg-white/15">
                  <Icon className="size-4" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <div className="relative mt-12 text-xs text-white/50">© {new Date().getFullYear()} Forever Study Academy</div>
      </section>

      <section className="flex items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Tizimga kirish</h2>
          <p className="mt-1 text-sm text-slate-500">Login va parolingizni kiriting</p>
          <LoginForm showDemo={process.env.SHOW_DEMO_ACCOUNTS !== "false"} />
        </div>
      </section>
    </div>
  );
}
