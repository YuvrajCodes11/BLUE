export function ChartCard({ title }: { title: string }) {
  const bars = [42, 68, 51, 84, 73, 92, 61];
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-5">
      <h3 className="font-bold text-white">{title}</h3>
      <div className="mt-6 flex h-44 items-end gap-3">
        {bars.map((bar, index) => <span key={index} className="flex-1 rounded-t-xl bg-gradient-to-t from-cyan-500 to-emerald-300" style={{ height: `${bar}%` }} />)}
      </div>
    </div>
  );
}
