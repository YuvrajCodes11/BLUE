"use client";

import { useMemo, useState } from "react";
import { DataTable } from "@/components/dashboard/DataTable";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { FormShell } from "@/components/dashboard/FormShell";
import { moduleConfigs } from "@/lib/module-data";
import type { ModuleKey } from "@/types/domain";

export function ModulePage({ moduleKey }: { moduleKey: Exclude<ModuleKey, "notifications" | "settings"> }) {
  const config = moduleConfigs[moduleKey];
  const [query, setQuery] = useState("");
  const records = useMemo(() => config.records.filter((record) => JSON.stringify(record).toLowerCase().includes(query.toLowerCase())), [config.records, query]);
  return (
    <section>
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div><p className="text-sm uppercase tracking-[0.24em] text-cyan-500">Core module</p><h1 className="mt-2 text-3xl font-bold text-[var(--text)] md:text-5xl">{config.title}</h1><p className="mt-3 max-w-3xl text-[var(--muted-text)]">{config.description}</p></div><button className="rounded-xl bg-cyan-300 px-4 py-2 font-bold text-slate-950">{config.createLabel}</button></div>
      <div className="mt-6 grid gap-4 xl:grid-cols-[0.72fr_0.28fr]"><div><input value={query} onChange={(event)=>setQuery(event.target.value)} placeholder="Search and filter records" className="mb-4 w-full rounded-2xl border border-[var(--line)] bg-[var(--input)] px-4 py-3 text-[var(--text)] outline-none placeholder:text-[var(--muted-text)]" />{records.length ? <DataTable columns={config.columns} rows={records} /> : <EmptyState title="No records found" body="Try changing your search or create a new record." />}</div><FormShell title="Quick create"><div className="grid gap-3"><input placeholder="Primary name" className="rounded-xl border border-[var(--line)] bg-[var(--input)] px-3 py-2 text-sm text-[var(--text)] outline-none placeholder:text-[var(--muted-text)]" /><input placeholder="Reference / county" className="rounded-xl border border-[var(--line)] bg-[var(--input)] px-3 py-2 text-sm text-[var(--text)] outline-none placeholder:text-[var(--muted-text)]" /><select className="rounded-xl border border-[var(--line)] bg-[var(--input)] px-3 py-2 text-sm text-[var(--text)] outline-none placeholder:text-[var(--muted-text)]"><option>Active</option><option>Pending</option><option>Validated</option></select><button className="rounded-xl bg-cyan-300 px-3 py-2 text-sm font-bold text-slate-950">Save draft</button></div></FormShell></div>
    </section>
  );
}
