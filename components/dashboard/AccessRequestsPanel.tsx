"use client";

import { useEffect, useState } from "react";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { LoadingState } from "@/components/dashboard/LoadingState";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { createClient, hasSupabaseConfig } from "@/lib/supabase";
import type { DbRole } from "@/lib/role-redirect";
import type { RecordStatus } from "@/types/domain";

type AccessRow = { id: string; name: string; email: string; organization: string; message: string | null; status: RecordStatus; created_at: string };

const roles: DbRole[] = ["BMU Manager", "County Officer", "KFS Officer", "Ranger", "NGO Program Manager", "Donor", "Fisher", "Government Admin"];
const roleLabel: Partial<Record<DbRole, string>> = { "KFS Officer": "KeFS Officer" };

export function AccessRequestsPanel() {
  const [rows, setRows] = useState<AccessRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [roleById, setRoleById] = useState<Record<string, DbRole>>({});
  const [countyById, setCountyById] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  async function load() {
    setError("");
    if (!hasSupabaseConfig()) { setError("Supabase env variables are missing."); setLoading(false); return; }
    setLoading(true);
    const supabase = createClient();
    const { data, error: requestError } = await supabase.from("access_requests").select("*").order("created_at", { ascending: false });
    if (requestError) setError(requestError.message);
    const nextRows = (data ?? []) as AccessRow[];
    setRows(nextRows);
    setRoleById((current) => Object.fromEntries(nextRows.map((row) => [row.id, current[row.id] ?? "BMU Manager"])));
    setCountyById((current) => Object.fromEntries(nextRows.map((row) => [row.id, current[row.id] ?? "Kilifi"])));
    setLoading(false);
  }

  async function updateStatus(id: string, action: "approve" | "reject") {
    setError("");
    setNotice("");
    setBusyId(id);
    const supabase = createClient();
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) {
      setError("Admin session missing. Please login again.");
      setBusyId(null);
      return;
    }

    const response = await fetch(`/api/access-requests/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify({
        action,
        role: roleById[id] ?? "BMU Manager",
        county: countyById[id] ?? "Kilifi",
      }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(result.error ?? "Request update failed.");
      setBusyId(null);
      return;
    }
    if (action === "approve") {
      setNotice(`User approved. Password setup email sent to ${result.email}.`);
    }
    await load();
    setBusyId(null);
  }

  useEffect(() => { void load(); }, []);

  return (
    <div className="ocean-panel mt-8 rounded-2xl p-5">
      <h2 className="text-xl font-bold text-[var(--text)]">Access requests</h2>
      <p className="mt-2 text-sm text-[var(--muted-text)]">Approve requests to create login access and email the user a password setup link.</p>
      {notice && <div className="mt-4 rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</div>}
      <div className="mt-5">
        {loading ? <LoadingState /> : error ? <EmptyState title="Cannot load access requests" body={error} /> : rows.length ? (
          <div className="grid gap-3">
            {rows.map((row) => (
              <div key={row.id} className="rounded-2xl border border-[var(--line)] bg-[var(--soft)]/80 p-4 shadow-sm">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div><strong className="text-[var(--text)]">{row.name}</strong><p className="text-sm text-[var(--muted-text)]">{row.organization} · {row.email}</p></div>
                  <StatusBadge status={row.status} />
                </div>
                {row.message && <p className="mt-3 text-sm text-[var(--text)]">{row.message}</p>}
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted-text)]">Role<select value={roleById[row.id] ?? "BMU Manager"} onChange={(event)=>setRoleById((current)=>({...current,[row.id]: event.target.value as DbRole}))} className="mt-2 w-full rounded-lg border border-[var(--line)] bg-[var(--input)] px-3 py-2 text-sm text-[var(--text)]">{roles.map((role)=><option key={role} value={role}>{roleLabel[role] ?? role}</option>)}</select></label>
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted-text)]">County<input value={countyById[row.id] ?? "Kilifi"} onChange={(event)=>setCountyById((current)=>({...current,[row.id]: event.target.value}))} className="mt-2 w-full rounded-lg border border-[var(--line)] bg-[var(--input)] px-3 py-2 text-sm text-[var(--text)]" /></label>
                </div>
                <div className="mt-4 flex gap-2">
                  <button disabled={busyId === row.id} onClick={()=>void updateStatus(row.id,"approve")} className="rounded-lg bg-emerald-300 px-3 py-2 text-sm font-bold text-slate-950 disabled:opacity-50">Approve + Send Invite</button>
                  <button disabled={busyId === row.id} onClick={()=>void updateStatus(row.id,"reject")} className="rounded-lg bg-rose-300 px-3 py-2 text-sm font-bold text-slate-950 disabled:opacity-50">Reject</button>
                </div>
              </div>
            ))}
          </div>
        ) : <EmptyState title="No requests" body="New access requests will appear here." />}
      </div>
    </div>
  );
}
