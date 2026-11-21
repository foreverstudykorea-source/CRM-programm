"use client";

import { useEffect, useState } from "react";

const TZ = "Asia/Tashkent";

function nowMinutes(tz: string) {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date());
  const h = Number(parts.find((p) => p.type === "hour")?.value);
  const m = Number(parts.find((p) => p.type === "minute")?.value);
  return h * 60 + m;
}
const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
const dur = (m: number) => (m >= 60 ? `${Math.floor(m / 60)} soat ${m % 60 ? `${m % 60} daqiqa` : ""}` : `${m} daqiqa`).trim();

/** Live status of today's lesson: starts in …, in progress, finished. */
export function Countdown({ start, end, tz = TZ }: { start: string; end: string; tz?: string }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(nowMinutes(tz));
    tick();
    const id = setInterval(tick, 20_000);
    return () => clearInterval(id);
  }, [tz]);
  if (now == null) return <span className="opacity-0">…</span>;
  const s = toMin(start);
  const e = toMin(end);
  if (now < s)
    return (
      <span className="inline-flex items-center gap-2">
        <span className="size-2 animate-pulse rounded-full bg-amber-300" /> {dur(s - now)}dan so&apos;ng boshlanadi
      </span>
    );
  if (now < e)
    return (
      <span className="inline-flex items-center gap-2">
        <span className="size-2 animate-pulse rounded-full bg-emerald-400" /> Dars ketmoqda · {dur(e - now)} qoldi
      </span>
    );
  return (
    <span className="inline-flex items-center gap-2">
      <span className="size-2 rounded-full bg-white/50" /> Dars tugadi
    </span>
  );
}
