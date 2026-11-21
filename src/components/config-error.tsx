import { Database, KeyRound, Wrench } from "lucide-react";
import type { ConfigProblem } from "@/lib/health";
import { Logo } from "./logo";

const TEXT: Record<ConfigProblem["code"], { icon: typeof Database; title: string; steps: React.ReactNode }> = {
  database_url: {
    icon: Database,
    title: "Ma'lumotlar bazasi ulanmagan",
    steps: (
      <>
        Vercel loyihasida <b>Storage → Create Database → Neon</b> ni tanlang va shu loyihaga ulang. Vercel <code>DATABASE_URL</code> ni o&apos;zi
        qo&apos;shadi.
      </>
    ),
  },
  session_secret: {
    icon: KeyRound,
    title: "SESSION_SECRET o'rnatilmagan yoki juda qisqa",
    steps: (
      <>
        <b>Settings → Environment Variables</b> bo&apos;limida <code>SESSION_SECRET</code> nomli o&apos;zgaruvchi qo&apos;shing. Qiymati kamida 32 belgili
        tasodifiy matn bo&apos;lsin (masalan, <code>openssl rand -base64 32</code> natijasi). &quot;Production&quot; belgisi qo&apos;yilganini tekshiring.
      </>
    ),
  },
  database_connect: {
    icon: Database,
    title: "Ma'lumotlar bazasiga ulanib bo'lmadi",
    steps: (
      <>
        <code>DATABASE_URL</code> to&apos;g&apos;ri ekanini va Neon bazasi o&apos;chirib qo&apos;yilmaganini tekshiring. Aniq sababi Vercel →{" "}
        <b>Logs</b> bo&apos;limida <code>[config]</code> yozuvida ko&apos;rinadi.
      </>
    ),
  },
};

/** Shown instead of the app while a required server setting is missing. */
export function ConfigError({ problems }: { problems: ConfigProblem[] }) {
  return (
    <div className="min-h-dvh bg-surface px-4 py-10">
      <div className="mx-auto max-w-xl">
        <Logo />
        <div className="card mt-8 p-6 sm:p-8">
          <div className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-amber-300 to-orange-500 text-white">
            <Wrench className="size-6" />
          </div>
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900">Server sozlamalari to&apos;liq emas</h1>
          <p className="mt-1.5 text-sm text-slate-500">Quyidagilarni Vercel&apos;da to&apos;g&apos;rilang, so&apos;ng <b>Deployments → Redeploy</b> bosing.</p>
          <ul className="mt-6 space-y-3">
            {problems.map((p) => {
              const t = TEXT[p.code];
              return (
                <li key={p.code} className="flex gap-3 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200/70">
                  <t.icon className="mt-0.5 size-5 shrink-0 text-amber-600" />
                  <div className="text-sm text-slate-600">
                    <div className="font-bold text-slate-900">{t.title}</div>
                    <p className="mt-1 [&_code]:rounded [&_code]:bg-white [&_code]:px-1 [&_code]:font-semibold [&_code]:text-slate-800">{t.steps}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
