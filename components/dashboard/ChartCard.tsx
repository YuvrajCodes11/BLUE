export function ChartCard({ title }: { title: string }) {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-black text-[var(--text)]">{title}</h3>
        <span className="rounded-full border border-[var(--line)] px-3 py-1 text-xs font-bold text-[var(--muted-text)]">Live only</span>
      </div>
      <div className="mt-6 grid min-h-44 place-items-center rounded-2xl border border-dashed border-[var(--line)] bg-[var(--soft)] p-6 text-center">
        <div>
          <p className="font-bold text-[var(--text)]">No trend data yet</p>
          <p className="mt-2 max-w-md text-sm text-[var(--muted-text)]">Charts will populate from Supabase records after operational data is entered. No demo values are shown.</p>
        </div>
      </div>
    </div>
  );
}
