import type { RecordStatus } from "@/types/domain";

const tones: Record<RecordStatus, string> = {
  Active: "bg-emerald-100 text-emerald-800 ring-emerald-300",
  Pending: "bg-amber-100 text-amber-800 ring-amber-300",
  Validated: "bg-cyan-100 text-cyan-800 ring-cyan-300",
  Flagged: "bg-rose-100 text-rose-800 ring-rose-300",
  Draft: "bg-slate-100 text-slate-800 ring-slate-300",
  Closed: "bg-violet-100 text-violet-800 ring-violet-300",
};

export function StatusBadge({ status }: { status: RecordStatus }) {
  return <span className={`rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${tones[status]}`}>{status}</span>;
}
