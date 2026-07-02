import type { RecordStatus } from "@/types/domain";

const tones: Record<RecordStatus, string> = {
  Active: "bg-emerald-300/14 text-emerald-300 ring-emerald-300/35",
  Pending: "bg-amber-300/14 text-amber-300 ring-amber-300/35",
  Validated: "bg-cyan-300/14 text-cyan-300 ring-cyan-300/35",
  Flagged: "bg-rose-300/14 text-rose-300 ring-rose-300/35",
  Draft: "bg-slate-300/14 text-slate-300 ring-slate-300/35",
  Closed: "bg-violet-300/14 text-violet-300 ring-violet-300/35",
};

export function StatusBadge({ status }: { status: RecordStatus }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ring-1 backdrop-blur ${tones[status]}`}>{status}</span>;
}
