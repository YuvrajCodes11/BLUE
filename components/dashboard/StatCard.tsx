import type { Stat } from "@/types/domain";

const tones: Record<Stat["tone"], string> = {
  cyan: "text-cyan-500",
  emerald: "text-emerald-500",
  amber: "text-amber-500",
  violet: "text-violet-500",
};

export function StatCard({ stat }: { stat: Stat }) {
  return (
    <div className="border-r border-b border-[var(--line)] bg-[var(--panel)] p-4 text-center last:border-r-0">
      <strong className={`block text-2xl font-black ${tones[stat.tone]}`}>{stat.value}</strong>
      <p className="mt-2 text-xs font-black uppercase tracking-[0.14em] text-[var(--muted-text)]">{stat.label}</p>
      <span className="mt-1 block text-xs text-[var(--muted-text)]">{stat.trend}</span>
    </div>
  );
}
