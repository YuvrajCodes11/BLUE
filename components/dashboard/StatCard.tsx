import type { Stat } from "@/types/domain";

const tones: Record<Stat["tone"], string> = {
  cyan: "text-cyan-500",
  emerald: "text-emerald-500",
  amber: "text-amber-500",
  violet: "text-violet-500",
};

export function StatCard({ stat }: { stat: Stat }) {
  return (
    <div className="ocean-panel relative overflow-hidden rounded-2xl border border-[var(--line)] p-3.5 sm:p-5 text-center transition hover:-translate-y-0.5 shadow-sm min-w-0">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-300/70 via-teal-300/60 to-blue-400/50" />
      <strong className={`block text-xl sm:text-2xl font-black ${tones[stat.tone]} truncate`}>{stat.value}</strong>
      <p className="mt-1.5 sm:mt-2 text-[10px] sm:text-xs font-black uppercase tracking-[0.14em] text-[var(--muted-text)] truncate">{stat.label}</p>
      <span className="mt-1 block text-[10px] sm:text-xs text-[var(--muted-text)] truncate">{stat.trend}</span>
    </div>
  );
}
