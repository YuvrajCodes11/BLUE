"use client";

import { useEffect, useState } from "react";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { LoadingState } from "@/components/dashboard/LoadingState";
import { createClient, hasSupabaseConfig } from "@/lib/supabase";
import type { DbRole } from "@/lib/role-redirect";

const roles: DbRole[] = ["Government Admin", "KFS Officer", "County Officer", "BMU Manager", "Ranger", "NGO Program Manager", "Donor", "Fisher"];
type ProfileRow = { id: string; full_name: string; role: DbRole; county: string | null; bmu_id: string | null; is_active: boolean | null; created_at: string };
type AuditRow = { id: string; action: string; entity_type: string; entity_id: string | null; created_at: string };

export function AdminManagementPanel() {
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [logs, setLogs] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setError("");
    if (!hasSupabaseConfig()) { setError("Supabase env variables are missing."); setLoading(false); return; }
    setLoading(true);
    const supabase = createClient();
    const [profileResult, auditResult] = await Promise.all([
      supabase.from("profiles").select("id, full_name, role, county, bmu_id, is_active, created_at").order("created_at", { ascending: false }),
      supabase.from("audit_logs").select("id, action, entity_type, entity_id, created_at").order("created_at", { ascending: false }).limit(20),
    ]);
    if (profileResult.error) setError(profileResult.error.message);
    if (auditResult.error) setError(auditResult.error.message);
    setProfiles((profileResult.data ?? []) as ProfileRow[]);
    setLogs((auditResult.data ?? []) as AuditRow[]);
    setLoading(false);
  }

  async function updateProfile(id: string, changes: Partial<Pick<ProfileRow, "role" | "is_active">>) {
    const supabase = createClient();
    const { error: updateError } = await supabase.from("profiles").update(changes).eq("id", id);
    if (updateError) { setError(updateError.message); return; }
    await supabase.from("audit_logs").insert({ action: "profile.updated", entity_type: "profiles", entity_id: id });
    await load();
  }

  useEffect(() => { void load(); }, []);

  if (loading) return <div className="mt-8"><LoadingState /></div>;
  if (error && !profiles.length) return <div className="mt-8"><EmptyState title="Cannot load admin management" body={error} /></div>;

  return (
    <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_0.45fr]">
      <section className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5">
        <h2 className="text-xl font-bold text-[var(--text)]">User management</h2>
        <div className="mt-5 overflow-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="text-xs uppercase tracking-[0.2em] text-[var(--muted-text)]"><tr><th className="p-3">Name</th><th className="p-3">Role</th><th className="p-3">County</th><th className="p-3">Status</th><th className="p-3">Actions</th></tr></thead><tbody>{profiles.map((profile)=><tr key={profile.id} className="border-t border-[var(--line)]"><td className="p-3 text-[var(--text)]">{profile.full_name}</td><td className="p-3"><select value={profile.role} onChange={(event)=>void updateProfile(profile.id,{ role: event.target.value as DbRole })} className="rounded-lg border border-[var(--line)] bg-[var(--input)] px-2 py-1 text-[var(--text)]">{roles.map((role)=><option key={role}>{role}</option>)}</select></td><td className="p-3 text-[var(--muted-text)]">{profile.county ?? "-"}</td><td className="p-3 text-[var(--muted-text)]">{profile.is_active === false ? "Inactive" : "Active"}</td><td className="p-3"><button onClick={()=>void updateProfile(profile.id,{ is_active: profile.is_active === false })} className="font-semibold text-cyan-600">{profile.is_active === false ? "Activate" : "Deactivate"}</button></td></tr>)}</tbody></table></div>
      </section>
      <section className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5">
        <h2 className="text-xl font-bold text-[var(--text)]">Audit logs</h2>
        <div className="mt-5 grid gap-3">{logs.length ? logs.map((log)=><div key={log.id} className="rounded-xl border border-[var(--line)] bg-[var(--soft)] p-3"><p className="text-sm text-[var(--text)]">{log.action}</p><p className="text-xs text-[var(--muted-text)]">{log.entity_type} · {log.entity_id ?? "-"}</p></div>) : <EmptyState title="No audit logs" body="Admin changes will be recorded here." />}</div>
      </section>
    </div>
  );
}
