import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center px-6">
      <div className="text-center">
        <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">
          <Compass className="size-7" />
        </div>
        <h1 className="mt-4 text-2xl font-extrabold text-slate-900">Sahifa topilmadi</h1>
        <p className="mt-1 text-sm text-slate-500">Havola eskirgan yoki sizda bu sahifaga ruxsat yo&apos;q.</p>
        <Link href="/" className="btn-primary mt-6">
          Bosh sahifaga
        </Link>
      </div>
    </div>
  );
}
