"use client";

import { useEffect, useState } from "react";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { LoadingState } from "@/components/dashboard/LoadingState";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { createClient, hasSupabaseConfig } from "@/lib/supabase";
import type { DbRole } from "@/lib/role-redirect";
import type { RecordStatus } from "@/types/domain";

type AccessRow = { id: string; name: string; email: string; organization: string; message: string | null; status: RecordStatus; created_at: string };
type StructuredAccessRow = AccessRow & {
  requested_role?: DbRole | null;
  access_type?: string | null;
  organization_type?: string | null;
  organization_name?: string | null;
  county_id?: string | null;
  sub_county_id?: string | null;
  ward_id?: string | null;
  bmu_id?: string | null;
  review_notes?: string | null;
};
type CountyOption = { id: string; name: string };
type SubCountyOption = { id: string; county_id: string; name: string };
type WardOption = { id: string; sub_county_id: string; name: string };
type BmuOption = { id: string; county_id: string | null; sub_county_id: string | null; ward_id: string | null; name: string };

const roles: DbRole[] = ["BMU Manager", "County Officer", "KFS Officer", "Ranger", "NGO Program Manager", "Donor", "Fisher", "Government Admin"];
const roleLabel: Partial<Record<DbRole, string>> = { "KFS Officer": "KeFS Officer" };

export function AccessRequestsPanel() {
  const [rows, setRows] = useState<StructuredAccessRow[]>([]);
  const [counties, setCounties] = useState<CountyOption[]>([]);
  const [subCounties, setSubCounties] = useState<SubCountyOption[]>([]);
  const [wards, setWards] = useState<WardOption[]>([]);
  const [bmus, setBmus] = useState<BmuOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [roleById, setRoleById] = useState<Record<string, DbRole>>({});
  const [countyById, setCountyById] = useState<Record<string, string>>({});
  const [subCountyById, setSubCountyById] = useState<Record<string, string>>({});
  const [wardById, setWardById] = useState<Record<string, string>>({});
  const [bmuById, setBmuById] = useState<Record<string, string>>({});
  const [notesById, setNotesById] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  async function load() {
    setError("");
    if (!hasSupabaseConfig()) { setError("Supabase env variables are missing."); setLoading(false); return; }
    setLoading(true);
    const supabase = createClient();
    const [requestResult, countyResult, subCountyResult, wardResult, bmuResult] = await Promise.all([
      supabase.from("access_requests").select("*").order("created_at", { ascending: false }),
      supabase.from("counties").select("id,name").order("name"),
      supabase.from("sub_counties").select("id,county_id,name").order("name"),
      supabase.from("wards").select("id,sub_county_id,name").order("name"),
      supabase.from("bmus").select("id,county_id,sub_county_id,ward_id,name").order("name"),
    ]);
    const { data, error: requestError } = requestResult;
    if (requestError) setError(requestError.message);
    if (!countyResult.error) setCounties((countyResult.data ?? []) as CountyOption[]);
    if (!subCountyResult.error) setSubCounties((subCountyResult.data ?? []) as SubCountyOption[]);
    if (!wardResult.error) setWards((wardResult.data ?? []) as WardOption[]);
    if (!bmuResult.error) setBmus((bmuResult.data ?? []) as BmuOption[]);
    const nextRows = (data ?? []) as StructuredAccessRow[];
    setRows(nextRows);
    setRoleById((current) => Object.fromEntries(nextRows.map((row) => [row.id, current[row.id] ?? row.requested_role ?? "BMU Manager"])));
    setCountyById((current) => Object.fromEntries(nextRows.map((row) => [row.id, current[row.id] ?? row.county_id ?? ""])));
    setSubCountyById((current) => Object.fromEntries(nextRows.map((row) => [row.id, current[row.id] ?? row.sub_county_id ?? ""])));
    setWardById((current) => Object.fromEntries(nextRows.map((row) => [row.id, current[row.id] ?? row.ward_id ?? ""])));
    setBmuById((current) => Object.fromEntries(nextRows.map((row) => [row.id, current[row.id] ?? row.bmu_id ?? ""])));
    setNotesById((current) => Object.fromEntries(nextRows.map((row) => [row.id, current[row.id] ?? row.review_notes ?? ""])));
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

    const role = roleById[id] ?? "BMU Manager";
    if (action === "approve" && role === "BMU Manager" && !bmuById[id]) {
      setError("BMU Manager approval requires a BMU assignment.");
      setBusyId(null);
      return;
    }
    if (action === "approve" && role === "County Officer" && !countyById[id]) {
      setError("County Officer approval requires a county assignment.");
      setBusyId(null);
      return;
    }

    const response = await fetch(`/api/access-requests/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify({
        action,
        role,
        countyId: countyById[id] || null,
        subCountyId: subCountyById[id] || null,
        wardId: wardById[id] || null,
        bmuId: bmuById[id] || null,
        reviewNotes: notesById[id] || null,
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
                  <div><strong className="text-[var(--text)]">{row.name}</strong><p className="text-sm text-[var(--muted-text)]">{row.organization_name ?? row.organization} · {row.email}</p></div>
                  <StatusBadge status={row.status} />
                </div>
                <div className="mt-3 grid gap-2 text-sm text-[var(--muted-text)] md:grid-cols-3">
                  <span>Requested: {row.requested_role ? (roleLabel[row.requested_role] ?? row.requested_role) : "Legacy request"}</span>
                  <span>Access: {row.access_type ?? "-"}</span>
                  <span>Organization type: {row.organization_type ?? "-"}</span>
                </div>
                {row.message && <p className="mt-3 whitespace-pre-wrap text-sm text-[var(--text)]">{row.message}</p>}
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted-text)]">Role<select value={roleById[row.id] ?? "BMU Manager"} onChange={(event)=>setRoleById((current)=>({...current,[row.id]: event.target.value as DbRole}))} className="mt-2 w-full rounded-lg border border-[var(--line)] bg-[var(--input)] px-3 py-2 text-sm text-[var(--text)]">{roles.map((role)=><option key={role} value={role}>{roleLabel[role] ?? role}</option>)}</select></label>
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted-text)]">County<select value={countyById[row.id] ?? ""} onChange={(event)=>{setCountyById((current)=>({...current,[row.id]: event.target.value})); setSubCountyById((current)=>({...current,[row.id]: ""})); setWardById((current)=>({...current,[row.id]: ""})); setBmuById((current)=>({...current,[row.id]: ""}));}} className="mt-2 w-full rounded-lg border border-[var(--line)] bg-[var(--input)] px-3 py-2 text-sm text-[var(--text)]"><option value="">No county scope</option>{counties.map((county)=><option key={county.id} value={county.id}>{county.name}</option>)}</select></label>
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted-text)]">Sub-county<select value={subCountyById[row.id] ?? ""} onChange={(event)=>{setSubCountyById((current)=>({...current,[row.id]: event.target.value})); setWardById((current)=>({...current,[row.id]: ""})); setBmuById((current)=>({...current,[row.id]: ""}));}} className="mt-2 w-full rounded-lg border border-[var(--line)] bg-[var(--input)] px-3 py-2 text-sm text-[var(--text)]"><option value="">No sub-county scope</option>{subCounties.filter((item)=>!countyById[row.id] || item.county_id === countyById[row.id]).map((item)=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted-text)]">Ward<select value={wardById[row.id] ?? ""} onChange={(event)=>{setWardById((current)=>({...current,[row.id]: event.target.value})); setBmuById((current)=>({...current,[row.id]: ""}));}} className="mt-2 w-full rounded-lg border border-[var(--line)] bg-[var(--input)] px-3 py-2 text-sm text-[var(--text)]"><option value="">No ward scope</option>{wards.filter((item)=>!subCountyById[row.id] || item.sub_county_id === subCountyById[row.id]).map((item)=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted-text)]">BMU<select value={bmuById[row.id] ?? ""} onChange={(event)=>setBmuById((current)=>({...current,[row.id]: event.target.value}))} className="mt-2 w-full rounded-lg border border-[var(--line)] bg-[var(--input)] px-3 py-2 text-sm text-[var(--text)]"><option value="">No BMU scope</option>{bmus.filter((item)=>!wardById[row.id] || item.ward_id === wardById[row.id]).map((item)=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted-text)] md:col-span-2">Review notes<textarea value={notesById[row.id] ?? ""} onChange={(event)=>setNotesById((current)=>({...current,[row.id]: event.target.value}))} className="mt-2 min-h-20 w-full rounded-lg border border-[var(--line)] bg-[var(--input)] px-3 py-2 text-sm normal-case tracking-normal text-[var(--text)]" /></label>
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
