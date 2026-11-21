import { FlaskConical } from "lucide-react";
import { isDemo } from "@/lib/data";

/** Shown on every page while the demo data is loaded, so nobody mistakes it for real records. */
export async function DemoBanner() {
  if (!(await isDemo())) return null;
  return (
    <div role="status" className="flex items-center justify-center gap-2 bg-amber-400 px-4 py-1.5 text-center text-xs font-bold text-amber-950">
      <FlaskConical className="size-3.5 shrink-0" />
      DEMO VERSIYA: barcha ismlar, telefonlar, davomat va to&apos;lovlar namunaviy, haqiqiy emas.
    </div>
  );
}
