import type { Stat } from "@/types/domain";

const tones: Record<Stat["tone"], string> = {
  cyan: "from-cyan-400/20 to-blue-500/5 text-cyan-100",
  emerald: "from-emerald-400/20 to-cyan-500/5 text-emerald-100",
  amber: "from-amber-400/20 to-orange-500/5 text-amber-100",
  violet: "from-violet-400/20 to-cyan-500/5 text-violet-100",
};

export function StatCard({ stat }: { stat: Stat }) {
  return (
    <div className={`rounded-2xl border border-white/10 bg-gradient-to-br ${tones[stat.tone]} p-5 shadow-sm`}>
      <p className="text-sm text-slate-300">{stat.label}</p>
      <strong className="mt-3 block text-2xl text-white">{stat.value}</strong>
      <span className="mt-3 inline-block text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{stat.trend}</span>
    </div>
  );
}
