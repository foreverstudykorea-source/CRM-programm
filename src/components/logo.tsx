export function Logo({ light = false }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-violet-500 text-white shadow-md shadow-brand-500/30">
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M12 4 2 9l10 5 10-5-10-5Z" />
          <path d="M6 11.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5" />
        </svg>
      </div>
      <div className="leading-tight">
        <div className={`text-[15px] font-extrabold tracking-tight ${light ? "text-white" : "text-slate-900"}`}>Forever Study</div>
        <div className={`text-[11px] font-medium ${light ? "text-white/70" : "text-slate-500"}`}>Academy CRM</div>
      </div>
    </div>
  );
}
