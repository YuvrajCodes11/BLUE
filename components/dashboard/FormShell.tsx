import type { ReactNode } from "react";

export function FormShell({ title, children }: { title: string; children: ReactNode }) {
  return <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-5"><h3 className="font-bold text-white">{title}</h3><div className="mt-5">{children}</div></div>;
}
