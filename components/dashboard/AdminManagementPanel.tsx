"use client";

import { useEffect, useState } from "react";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { LoadingState } from "@/components/dashboard/LoadingState";
import { createClient, hasSupabaseConfig } from "@/lib/supabase";
import type { DbRole } from "@/lib/role-redirect";

const roles: DbRole[] = ["Government Admin", "KFS Officer", "County Officer", "BMU Manager", "Ranger", "NGO Program Manager", "Donor", "Fisher"];
const roleLabel: Partial<Record<DbRole, string>> = { "Government Admin": "BMU Manager", "KFS Officer": "KeFS Officer", Fisher: "Member" };
type ProfileRow = {
  id: string;
  full_name: string;
  role: DbRole;
  county: string | null;
  county_id: string | null;
  sub_county_id: string | null;
  ward_id: string | null;
  bmu_id: string | null;
  is_active: boolean | null;
  onboarding_status: string | null;
  created_at: string;
};
type AuditRow = { id: string; action: string; entity_type: string; entity_id: string | null; created_at: string };
type CountyOption = { id: string; name: string };
type SubCountyOption = { id: string; county_id: string; name: string };
type WardOption = { id: string; sub_county_id: string; name: string };
type BmuOption = { id: string; county_id: string | null; sub_county_id: string | null; ward_id: string | null; name: string };

export function AdminManagementPanel() {
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [logs, setLogs] = useState<AuditRow[]>([]);
  const [counties, setCounties] = useState<CountyOption[]>([]);
  const [subCounties, setSubCounties] = useState<SubCountyOption[]>([]);
  const [wards, setWards] = useState<WardOption[]>([]);
  const [bmus, setBmus] = useState<BmuOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setError("");
    if (!hasSupabaseConfig()) { setError("Supabase env variables are missing."); setLoading(false); return; }
    setLoading(true);
    const supabase = createClient();
    const [profileResult, auditResult, countyResult, subCountyResult, wardResult, bmuResult] = await Promise.all([
      supabase.from("profiles").select("id, full_name, role, county, county_id, sub_county_id, ward_id, bmu_id, is_active, onboarding_status, created_at").order("created_at", { ascending: false }),
      supabase.from("audit_logs").select("id, action, entity_type, entity_id, created_at").order("created_at", { ascending: false }).limit(20),
      supabase.from("counties").select("id,name").order("name"),
      supabase.from("sub_counties").select("id,county_id,name").order("name"),
      supabase.from("wards").select("id,sub_county_id,name").order("name"),
      supabase.from("bmus").select("id,county_id,sub_county_id,ward_id,name").order("name"),
    ]);
    if (profileResult.error) setError(profileResult.error.message);
    if (auditResult.error) setError(auditResult.error.message);
    setProfiles((profileResult.data ?? []) as ProfileRow[]);
    setLogs((auditResult.data ?? []) as AuditRow[]);
    if (!countyResult.error) setCounties((countyResult.data ?? []) as CountyOption[]);
    if (!subCountyResult.error) setSubCounties((subCountyResult.data ?? []) as SubCountyOption[]);
    if (!wardResult.error) setWards((wardResult.data ?? []) as WardOption[]);
    if (!bmuResult.error) setBmus((bmuResult.data ?? []) as BmuOption[]);
    setLoading(false);
  }

  async function updateProfile(id: string, changes: Partial<Pick<ProfileRow, "role" | "is_active" | "county_id" | "sub_county_id" | "ward_id" | "bmu_id" | "county">>) {
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
      <section className="ocean-panel rounded-2xl p-5">
        <h2 className="text-xl font-bold text-[var(--text)]">User management</h2>
        <div className="mt-5 overflow-auto"><table className="w-full min-w-[1200px] text-left text-sm"><thead className="text-xs uppercase tracking-[0.2em] text-[var(--muted-text)]"><tr><th className="p-3">Name</th><th className="p-3">Role</th><th className="p-3">County</th><th className="p-3">Sub-county</th><th className="p-3">Ward</th><th className="p-3">BMU</th><th className="p-3">Onboarding</th><th className="p-3">Status</th><th className="p-3">Actions</th></tr></thead><tbody>{profiles.map((profile)=><tr key={profile.id} className="border-t border-[var(--line)]"><td className="p-3 text-[var(--text)]">{profile.full_name}</td><td className="p-3"><select value={profile.role} onChange={(event)=>void updateProfile(profile.id,{ role: event.target.value as DbRole })} className="rounded-lg border border-[var(--line)] bg-[var(--input)] px-2 py-1 text-[var(--text)]">{roles.map((role)=><option key={role} value={role}>{roleLabel[role] ?? role}</option>)}</select></td><td className="p-3"><select value={profile.county_id ?? ""} onChange={(event)=>{const county = counties.find((item)=>item.id === event.target.value)?.name ?? null; void updateProfile(profile.id,{ county_id: event.target.value || null, county, sub_county_id: null, ward_id: null, bmu_id: null });}} className="w-40 rounded-lg border border-[var(--line)] bg-[var(--input)] px-2 py-1 text-[var(--text)]"><option value="">None</option>{counties.map((county)=><option key={county.id} value={county.id}>{county.name}</option>)}</select></td><td className="p-3"><select value={profile.sub_county_id ?? ""} onChange={(event)=>void updateProfile(profile.id,{ sub_county_id: event.target.value || null, ward_id: null, bmu_id: null })} className="w-40 rounded-lg border border-[var(--line)] bg-[var(--input)] px-2 py-1 text-[var(--text)]"><option value="">None</option>{subCounties.filter((item)=>!profile.county_id || item.county_id === profile.county_id).map((item)=><option key={item.id} value={item.id}>{item.name}</option>)}</select></td><td className="p-3"><select value={profile.ward_id ?? ""} onChange={(event)=>void updateProfile(profile.id,{ ward_id: event.target.value || null, bmu_id: null })} className="w-40 rounded-lg border border-[var(--line)] bg-[var(--input)] px-2 py-1 text-[var(--text)]"><option value="">None</option>{wards.filter((item)=>!profile.sub_county_id || item.sub_county_id === profile.sub_county_id).map((item)=><option key={item.id} value={item.id}>{item.name}</option>)}</select></td><td className="p-3"><select value={profile.bmu_id ?? ""} onChange={(event)=>void updateProfile(profile.id,{ bmu_id: event.target.value || null })} className="w-44 rounded-lg border border-[var(--line)] bg-[var(--input)] px-2 py-1 text-[var(--text)]"><option value="">None</option>{bmus.filter((item)=>!profile.ward_id || item.ward_id === profile.ward_id).map((item)=><option key={item.id} value={item.id}>{item.name}</option>)}</select></td><td className="p-3 text-[var(--muted-text)]">{profile.onboarding_status ?? "pending"}</td><td className="p-3 text-[var(--muted-text)]">{profile.is_active === false ? "Inactive" : "Active"}</td><td className="p-3"><button onClick={()=>void updateProfile(profile.id,{ is_active: profile.is_active === false })} className="font-semibold text-cyan-600">{profile.is_active === false ? "Activate" : "Deactivate"}</button></td></tr>)}</tbody></table></div>
      </section>
      <section className="ocean-panel rounded-2xl p-5">
        <h2 className="text-xl font-bold text-[var(--text)]">Audit logs</h2>
        <div className="mt-5 grid gap-3">{logs.length ? logs.map((log)=><div key={log.id} className="rounded-xl border border-[var(--line)] bg-[var(--soft)]/80 p-3"><p className="text-sm text-[var(--text)]">{log.action}</p><p className="text-xs text-[var(--muted-text)]">{log.entity_type} · {log.entity_id ?? "-"}</p></div>) : <EmptyState title="No audit logs" body="Admin changes will be recorded here." />}</div>
      </section>
    </div>
  );
}
