import type { RecordStatus } from "@/types/domain";

const tones: Record<RecordStatus, string> = {
  Active: "bg-emerald-400/10 text-emerald-200 ring-emerald-300/20",
  Pending: "bg-amber-400/10 text-amber-200 ring-amber-300/20",
  Validated: "bg-cyan-400/10 text-cyan-200 ring-cyan-300/20",
  Flagged: "bg-rose-400/10 text-rose-200 ring-rose-300/20",
  Draft: "bg-slate-400/10 text-slate-200 ring-slate-300/20",
  Closed: "bg-violet-400/10 text-violet-200 ring-violet-300/20",
};

export function StatusBadge({ status }: { status: RecordStatus }) {
  return <span className={`rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${tones[status]}`}>{status}</span>;
}
