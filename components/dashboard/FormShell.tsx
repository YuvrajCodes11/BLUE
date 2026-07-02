import type { ReactNode } from "react";

export function FormShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="ocean-panel rounded-2xl p-5">
      <h3 className="font-bold text-[var(--text)]">{title}</h3>
      <div className="mt-5">{children}</div>
    </div>
  );
}
