"use client";

import { useEffect, useState } from "react";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { LoadingState } from "@/components/dashboard/LoadingState";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { createClient, hasSupabaseConfig } from "@/lib/supabase";
import type { RecordStatus } from "@/types/domain";

type AccessRow = { id: string; name: string; email: string; organization: string; message: string | null; status: RecordStatus; created_at: string };

export function AccessRequestsPanel() {
  const [rows, setRows] = useState<AccessRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setError("");
    if (!hasSupabaseConfig()) { setError("Supabase env variables are missing."); setLoading(false); return; }
    setLoading(true);
    const supabase = createClient();
    const { data, error: requestError } = await supabase.from("access_requests").select("*").order("created_at", { ascending: false });
    if (requestError) setError(requestError.message);
    setRows((data ?? []) as AccessRow[]);
    setLoading(false);
  }

  async function updateStatus(id: string, status: "Validated" | "Closed") {
    const supabase = createClient();
    const { error: updateError } = await supabase.from("access_requests").update({ status }).eq("id", id);
    if (updateError) { setError(updateError.message); return; }
    await load();
  }

  useEffect(() => { void load(); }, []);

  return (
    <div className="mt-8 rounded-2xl border border-white/10 bg-slate-950/45 p-5">
      <h2 className="text-xl font-bold">Access requests</h2>
      <p className="mt-2 text-sm text-slate-400">Admin review queue from /request-access.</p>
      <div className="mt-5">{loading ? <LoadingState /> : error ? <EmptyState title="Cannot load access requests" body={error} /> : rows.length ? <div className="grid gap-3">{rows.map((row)=><div key={row.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"><div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><strong>{row.name}</strong><p className="text-sm text-slate-400">{row.organization} · {row.email}</p></div><StatusBadge status={row.status} /></div>{row.message && <p className="mt-3 text-sm text-slate-300">{row.message}</p>}<div className="mt-4 flex gap-2"><button onClick={()=>void updateStatus(row.id,"Validated")} className="rounded-lg bg-emerald-300 px-3 py-2 text-sm font-bold text-slate-950">Approve</button><button onClick={()=>void updateStatus(row.id,"Closed")} className="rounded-lg bg-rose-300 px-3 py-2 text-sm font-bold text-slate-950">Reject</button></div></div>)}</div> : <EmptyState title="No requests" body="New access requests will appear here." />}</div>
    </div>
  );
}
