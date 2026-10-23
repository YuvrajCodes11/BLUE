"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ClipboardList, FileText, Plus, Save, Search } from "lucide-react";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { LoadingState } from "@/components/dashboard/LoadingState";
import { createClient, hasSupabaseConfig } from "@/lib/supabase";
import {
  createPatrolDataCaptureRecord,
  fetchBmusByWard,
  fetchLocationHierarchy,
  fetchPatrolDataCaptureRecordDetail,
  fetchPatrolDataCaptureRecords,
  updatePatrolDataCaptureRecord,
  type LocationHierarchy,
  type PatrolDataCaptureRecordInput,
} from "@/services/compliance-service";
import type { LocationBmu, PatrolDataCaptureRecord } from "@/types/blue";

type Profile = {
  id: string;
  role: string;
};

type RowDraft = Pick<
  PatrolDataCaptureRecordInput,
  | "row_no"
  | "entry_time"
  | "fishers_name"
  | "fisher_id_no"
  | "phone_no_row"
  | "gear_type_and_id"
  | "gear_quantity"
  | "fishing_location_ground"
  | "bmu_origin"
  | "infringement_code"
  | "item_confiscated_encountered_and_details"
>;

const allowedRoles = new Set(["Government Admin", "KFS Officer", "County Officer", "BMU Manager", "Ranger"]);

const infringementCodes = [
  "No Fishing License",
  "Possession / use of unsustainable gears",
  "Fishing within a no-take zone / closed season",
  "Use of restricted gear within gear exclusion zone",
  "Possession of immature / undersize fish",
  "Fish unfit for human consumption",
  "Unseaworthy craft",
  "Causing pollution",
  "Craft without valid registration / license no.",
  "Underage",
];

const emptyHeader: PatrolDataCaptureRecordInput = {
  bmu_patrol_report_id: null,
  patrol_reference_no: "",
  patrol_date: "",
  patrol_boat_name: "",
  county_id: "",
  sub_county_id: "",
  ward_id: "",
  bmu_id: "",
  county_name: "",
  patrol_objective: "",
  patrol_leader_name: "",
  position: "",
  phone_no: "",
  jcma_name: "",
  bmu_name: "",
  start_time_12hrs: "",
  end_time_12hrs: "",
  row_no: null,
  entry_time: "",
  fishers_name: "",
  fisher_id_no: "",
  phone_no_row: "",
  gear_type_and_id: "",
  gear_quantity: "",
  fishing_location_ground: "",
  bmu_origin: "",
  infringement_code: "",
  item_confiscated_encountered_and_details: "",
  status: "Draft",
};

const emptyRow: RowDraft = {
  row_no: null,
  entry_time: "",
  fishers_name: "",
  fisher_id_no: "",
  phone_no_row: "",
  gear_type_and_id: "",
  gear_quantity: "",
  fishing_location_ground: "",
  bmu_origin: "",
  infringement_code: "",
  item_confiscated_encountered_and_details: "",
};

function clean<T extends object>(input: T) {
  return Object.fromEntries(Object.entries(input).map(([key, value]) => [key, value === "" ? null : value])) as T;
}

function hasAnyValue(row: Record<string, unknown>) {
  return Object.values(row).some((value) => value !== "" && value !== null && value !== undefined);
}

function fieldClass() {
  return "rounded-xl border border-[var(--line)] bg-[var(--input)] px-3 py-2 text-sm text-[var(--text)] outline-none placeholder:text-[var(--muted-text)]";
}

function Label({ children }: { children: string }) {
  return <label className="text-xs font-black uppercase tracking-[0.16em] text-[var(--muted-text)]">{children}</label>;
}

function ComplianceStatusBadge({ status }: { status: string }) {
  const tones: Record<string, string> = {
    Draft: "bg-slate-400/15 text-slate-500 ring-slate-400/30",
    Submitted: "bg-cyan-400/15 text-cyan-600 ring-cyan-400/30",
    "Under Review": "bg-amber-400/15 text-amber-600 ring-amber-400/30",
    Approved: "bg-emerald-400/15 text-emerald-600 ring-emerald-400/30",
    Rejected: "bg-rose-400/15 text-rose-600 ring-rose-400/30",
    Closed: "bg-violet-400/15 text-violet-600 ring-violet-400/30",
  };
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${tones[status] ?? tones.Draft}`}>{status}</span>;
}

export function PatrolDataCapturePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [records, setRecords] = useState<PatrolDataCaptureRecord[]>([]);
  const [detail, setDetail] = useState<PatrolDataCaptureRecord | null>(null);
  const [locations, setLocations] = useState<LocationHierarchy>({ counties: [], subCounties: [], wards: [] });
  const [bmus, setBmus] = useState<LocationBmu[]>([]);
  const [form, setForm] = useState<PatrolDataCaptureRecordInput>({ ...emptyHeader });
  const [rows, setRows] = useState<RowDraft[]>([{ ...emptyRow }]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<PatrolDataCaptureRecord | null>(null);

  const subCounties = useMemo(() => locations.subCounties.filter((item) => item.county_id === form.county_id), [form.county_id, locations.subCounties]);
  const wards = useMemo(() => locations.wards.filter((item) => item.sub_county_id === form.sub_county_id), [form.sub_county_id, locations.wards]);
  const filteredRecords = useMemo(() => records.filter((record) => JSON.stringify(record).toLowerCase().includes(query.toLowerCase())), [query, records]);
  const canAccess = profile ? allowedRoles.has(profile.role) : false;

  async function load() {
    setError("");
    if (!hasSupabaseConfig()) {
      setError("Supabase env variables are missing.");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const isDemo =
        typeof document !== "undefined" &&
        (document.cookie.includes("blue_demo_session=true") || Boolean(localStorage.getItem("blue_demo_user")));

      if (isDemo) {
        setProfile({ id: "demo-admin-uuid-001", role: "Government Admin" });
        const [hierarchy, recordRows] = await Promise.all([fetchLocationHierarchy(), fetchPatrolDataCaptureRecords()]);
        setLocations(hierarchy);
        setRecords(recordRows);
        return;
      }

      const supabase = createClient();
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw new Error(userError.message);
      if (!userData.user) throw new Error("Please log in to access Patrol Data Capture.");
      const { data: profileData, error: profileError } = await supabase.from("profiles").select("id,role").eq("id", userData.user.id).single();
      if (profileError) throw new Error(profileError.message);
      setProfile(profileData as Profile);
      if (!allowedRoles.has(profileData.role)) {
        setRecords([]);
        return;
      }
      const [hierarchy, recordRows] = await Promise.all([fetchLocationHierarchy(), fetchPatrolDataCaptureRecords()]);
      setLocations(hierarchy);
      setRecords(recordRows);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load Patrol Data Capture records.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    async function loadBmus() {
      if (!form.ward_id) {
        setBmus([]);
        return;
      }
      try {
        setBmus(await fetchBmusByWard(form.ward_id));
      } catch (bmuError) {
        setError(bmuError instanceof Error ? bmuError.message : "Unable to load BMUs for selected ward.");
      }
    }
    void loadBmus();
  }, [form.ward_id]);

  function updateForm<K extends keyof PatrolDataCaptureRecordInput>(key: K, value: PatrolDataCaptureRecordInput[K]) {
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key === "county_id") {
        const county = locations.counties.find((item) => item.id === value);
        next.county_name = county?.name ?? "";
        next.sub_county_id = "";
        next.ward_id = "";
        next.bmu_id = "";
      }
      if (key === "sub_county_id") {
        next.ward_id = "";
        next.bmu_id = "";
      }
      if (key === "ward_id") {
        next.bmu_id = "";
      }
      if (key === "bmu_id") {
        const bmu = bmus.find((item) => item.id === value);
        next.bmu_name = bmu?.name ?? next.bmu_name;
      }
      return next;
    });
  }

  function resetCreate() {
    setEditing(null);
    setForm({ ...emptyHeader });
    setRows([{ ...emptyRow }]);
    setShowCreate(true);
  }

  function startEdit(record: PatrolDataCaptureRecord) {
    setEditing(record);
    setForm({
      bmu_patrol_report_id: record.bmu_patrol_report_id,
      patrol_reference_no: record.patrol_reference_no ?? "",
      patrol_date: record.patrol_date ?? "",
      patrol_boat_name: record.patrol_boat_name ?? "",
      county_id: record.county_id ?? "",
      sub_county_id: record.sub_county_id ?? "",
      ward_id: record.ward_id ?? "",
      bmu_id: record.bmu_id ?? "",
      county_name: record.county_name ?? "",
      patrol_objective: record.patrol_objective ?? "",
      patrol_leader_name: record.patrol_leader_name ?? "",
      position: record.position ?? "",
      phone_no: record.phone_no ?? "",
      jcma_name: record.jcma_name ?? "",
      bmu_name: record.bmu_name ?? "",
      start_time_12hrs: record.start_time_12hrs ?? "",
      end_time_12hrs: record.end_time_12hrs ?? "",
      row_no: record.row_no,
      entry_time: record.entry_time ?? "",
      fishers_name: record.fishers_name ?? "",
      fisher_id_no: record.fisher_id_no ?? "",
      phone_no_row: record.phone_no_row ?? "",
      gear_type_and_id: record.gear_type_and_id ?? "",
      gear_quantity: record.gear_quantity ?? "",
      fishing_location_ground: record.fishing_location_ground ?? "",
      bmu_origin: record.bmu_origin ?? "",
      infringement_code: record.infringement_code ?? "",
      item_confiscated_encountered_and_details: record.item_confiscated_encountered_and_details ?? "",
      status: record.status,
    });
    setRows([{
      row_no: record.row_no,
      entry_time: record.entry_time ?? "",
      fishers_name: record.fishers_name ?? "",
      fisher_id_no: record.fisher_id_no ?? "",
      phone_no_row: record.phone_no_row ?? "",
      gear_type_and_id: record.gear_type_and_id ?? "",
      gear_quantity: record.gear_quantity ?? "",
      fishing_location_ground: record.fishing_location_ground ?? "",
      bmu_origin: record.bmu_origin ?? "",
      infringement_code: record.infringement_code ?? "",
      item_confiscated_encountered_and_details: record.item_confiscated_encountered_and_details ?? "",
    }]);
    setShowCreate(true);
  }

  async function viewDetail(id: string) {
    setError("");
    try {
      setDetail(await fetchPatrolDataCaptureRecordDetail(id));
    } catch (detailError) {
      setError(detailError instanceof Error ? detailError.message : "Unable to load Patrol Data Capture detail.");
    }
  }

  async function submit() {
    setError("");
    setNotice("");
    if (!form.patrol_reference_no || !form.patrol_date) {
      setError("Patrol Reference No. and Patrol Date are required.");
      return;
    }
    const activeRows = rows.filter((row) => hasAnyValue(row as unknown as Record<string, unknown>));
    if (!activeRows.length) {
      setError("At least one table row is required.");
      return;
    }
    setSaving(true);
    try {
      const header = clean(form);
      if (editing) {
        const updated = await updatePatrolDataCaptureRecord(editing.id, clean({ ...header, ...activeRows[0] }));
        setRecords((current) => current.map((item) => (item.id === updated.id ? updated : item)));
        setNotice("Patrol Data Capture record updated.");
        setEditing(null);
        setShowCreate(false);
        return;
      }

      const created = await Promise.all(activeRows.map((row, index) => createPatrolDataCaptureRecord(clean({ ...header, ...row, row_no: row.row_no ?? index + 1 }))));
      setRecords((current) => [...created, ...current]);
      setNotice("Patrol Data Capture records created.");
      resetCreate();
      setShowCreate(false);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to save Patrol Data Capture.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingState />;
  if (!canAccess) return <EmptyState title="Patrol Data Capture access only" body="Patrol Data Capture is available to BMU Manager, KeFS/KFS Officer, County Officer, and Ranger roles." />;

  return (
    <section className="grid gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.24em] text-cyan-500">Form 1A Patrol Data Capture Form</p>
          <h1 className="mt-2 text-3xl font-black text-[var(--text)] md:text-5xl">For use during patrol</h1>
          <p className="mt-3 max-w-3xl text-[var(--muted-text)]">Structured patrol data rows for field capture. This stage does not include Seizure Form, attachments, or exports.</p>
        </div>
        <button onClick={resetCreate} className="ocean-action inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-bold text-slate-950">
          <Plus className="h-4 w-4" /> New Patrol Data
        </button>
      </div>

      {(error || notice) && (
        <div className={`rounded-2xl border px-4 py-3 text-sm ${error ? "border-rose-400/40 bg-rose-500/10 text-rose-500" : "border-emerald-400/40 bg-emerald-500/10 text-emerald-600"}`}>
          {error || notice}
        </div>
      )}

      {showCreate && (
        <div className="ocean-panel rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <ClipboardList className="h-5 w-5 text-cyan-500" />
            <h2 className="text-xl font-black text-[var(--text)]">{editing ? "Edit Patrol Data Capture row" : "Create Patrol Data Capture form"}</h2>
          </div>

          <FormBlock title="Form header">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Field label="Patrol Reference No."><input className={fieldClass()} value={form.patrol_reference_no ?? ""} onChange={(e) => updateForm("patrol_reference_no", e.target.value)} /></Field>
              <Field label="Patrol Date"><input type="date" className={fieldClass()} value={form.patrol_date ?? ""} onChange={(e) => updateForm("patrol_date", e.target.value)} /></Field>
              <Field label="Patrol Boat Name"><input className={fieldClass()} value={form.patrol_boat_name ?? ""} onChange={(e) => updateForm("patrol_boat_name", e.target.value)} /></Field>
              <Field label="Status"><select className={fieldClass()} value={form.status} onChange={(e) => updateForm("status", e.target.value)}><option>Draft</option><option>Submitted</option><option>Under Review</option><option>Approved</option><option>Rejected</option><option>Closed</option></select></Field>
              <Field label="County"><select className={fieldClass()} value={form.county_id ?? ""} onChange={(e) => updateForm("county_id", e.target.value)}><option value="">Select county</option>{locations.counties.map((county) => <option key={county.id} value={county.id}>{county.name}</option>)}</select></Field>
              <Field label="Sub-county"><select className={fieldClass()} value={form.sub_county_id ?? ""} onChange={(e) => updateForm("sub_county_id", e.target.value)}><option value="">Select sub-county</option>{subCounties.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
              <Field label="Ward"><select className={fieldClass()} value={form.ward_id ?? ""} onChange={(e) => updateForm("ward_id", e.target.value)}><option value="">Select ward</option>{wards.map((ward) => <option key={ward.id} value={ward.id}>{ward.name}</option>)}</select></Field>
              <Field label="BMU"><select className={fieldClass()} value={form.bmu_id ?? ""} onChange={(e) => updateForm("bmu_id", e.target.value)}><option value="">Select BMU under ward</option>{bmus.map((bmu) => <option key={bmu.id} value={bmu.id}>{bmu.name}</option>)}</select></Field>
              <Field label="County Name"><input className={fieldClass()} value={form.county_name ?? ""} onChange={(e) => updateForm("county_name", e.target.value)} /></Field>
              <Field label="Patrol Objective"><input className={fieldClass()} value={form.patrol_objective ?? ""} onChange={(e) => updateForm("patrol_objective", e.target.value)} /></Field>
              <Field label="Patrol Leader Name"><input className={fieldClass()} value={form.patrol_leader_name ?? ""} onChange={(e) => updateForm("patrol_leader_name", e.target.value)} /></Field>
              <Field label="Position"><input className={fieldClass()} value={form.position ?? ""} onChange={(e) => updateForm("position", e.target.value)} /></Field>
              <Field label="Phone No."><input className={fieldClass()} value={form.phone_no ?? ""} onChange={(e) => updateForm("phone_no", e.target.value)} /></Field>
              <Field label="JCMA Name"><input className={fieldClass()} value={form.jcma_name ?? ""} onChange={(e) => updateForm("jcma_name", e.target.value)} /></Field>
              <Field label="BMU Name"><input className={fieldClass()} value={form.bmu_name ?? ""} onChange={(e) => updateForm("bmu_name", e.target.value)} /></Field>
              <Field label="Start time (12hrs)"><input type="time" className={fieldClass()} value={form.start_time_12hrs ?? ""} onChange={(e) => updateForm("start_time_12hrs", e.target.value)} /></Field>
              <Field label="End Time (12hrs)"><input type="time" className={fieldClass()} value={form.end_time_12hrs ?? ""} onChange={(e) => updateForm("end_time_12hrs", e.target.value)} /></Field>
            </div>
          </FormBlock>

          <FormBlock title="Table fields">
            <div className="grid gap-4">
              {rows.map((row, index) => (
                <div key={index} className="rounded-2xl border border-[var(--line)] bg-[var(--soft)] p-4">
                  <p className="mb-3 text-sm font-bold text-[var(--muted-text)]">Row {index + 1}</p>
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <RowInput label="S/No." type="number" value={row.row_no ?? ""} onChange={(value) => setRows((current) => current.map((item, rowIndex) => rowIndex === index ? { ...item, row_no: value ? Number(value) : null } : item))} />
                    <RowInput label="Time" type="time" value={row.entry_time ?? ""} onChange={(value) => setRows((current) => current.map((item, rowIndex) => rowIndex === index ? { ...item, entry_time: value } : item))} />
                    <RowInput label="Fisher's Name" value={row.fishers_name ?? ""} onChange={(value) => setRows((current) => current.map((item, rowIndex) => rowIndex === index ? { ...item, fishers_name: value } : item))} />
                    <RowInput label="ID" value={row.fisher_id_no ?? ""} onChange={(value) => setRows((current) => current.map((item, rowIndex) => rowIndex === index ? { ...item, fisher_id_no: value } : item))} />
                    <RowInput label="Phone No." value={row.phone_no_row ?? ""} onChange={(value) => setRows((current) => current.map((item, rowIndex) => rowIndex === index ? { ...item, phone_no_row: value } : item))} />
                    <RowInput label="Gear Type & ID." value={row.gear_type_and_id ?? ""} onChange={(value) => setRows((current) => current.map((item, rowIndex) => rowIndex === index ? { ...item, gear_type_and_id: value } : item))} />
                    <RowInput label="Gear Quantity" value={row.gear_quantity ?? ""} onChange={(value) => setRows((current) => current.map((item, rowIndex) => rowIndex === index ? { ...item, gear_quantity: value } : item))} />
                    <RowInput label="Fishing Location/Ground" value={row.fishing_location_ground ?? ""} onChange={(value) => setRows((current) => current.map((item, rowIndex) => rowIndex === index ? { ...item, fishing_location_ground: value } : item))} />
                    <RowInput label="BMU Origin" value={row.bmu_origin ?? ""} onChange={(value) => setRows((current) => current.map((item, rowIndex) => rowIndex === index ? { ...item, bmu_origin: value } : item))} />
                    <Field label="Infringement code">
                      <select className={fieldClass()} value={row.infringement_code ?? ""} onChange={(e) => setRows((current) => current.map((item, rowIndex) => rowIndex === index ? { ...item, infringement_code: e.target.value } : item))}>
                        <option value="">Select code</option>
                        {infringementCodes.map((code) => <option key={code} value={code}>{code}</option>)}
                      </select>
                    </Field>
                    <div className="md:col-span-2 xl:col-span-4">
                      <Field label="Item Confiscated / Encountered and Details including types and number of unsustainable gear and/or fish and action taken">
                        <textarea className={`${fieldClass()} min-h-20`} value={row.item_confiscated_encountered_and_details ?? ""} onChange={(e) => setRows((current) => current.map((item, rowIndex) => rowIndex === index ? { ...item, item_confiscated_encountered_and_details: e.target.value } : item))} />
                      </Field>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {!editing && <button onClick={() => setRows((current) => [...current, { ...emptyRow }])} className="mt-3 rounded-xl border border-[var(--line)] px-4 py-2 text-sm font-bold text-[var(--text)]">Add table row</button>}
          </FormBlock>

          <FormBlock title="Infringement code section">
            <div className="grid gap-2 md:grid-cols-2">
              {infringementCodes.map((code) => <div key={code} className="rounded-xl border border-[var(--line)] bg-[var(--input)] px-3 py-2 text-sm font-semibold text-[var(--text)]">{code}</div>)}
            </div>
          </FormBlock>

          <div className="mt-6 flex flex-wrap gap-3">
            <button disabled={saving} onClick={() => void submit()} className="ocean-action inline-flex items-center gap-2 rounded-xl px-4 py-3 font-bold text-slate-950 disabled:opacity-60">
              <Save className="h-4 w-4" /> {saving ? "Saving..." : editing ? "Update row" : "Save Patrol Data"}
            </button>
            <button onClick={() => { setShowCreate(false); setEditing(null); }} className="rounded-xl border border-[var(--line)] px-4 py-3 font-bold text-[var(--text)]">Cancel</button>
          </div>
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[0.62fr_0.38fr]">
        <div className="ocean-panel rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <Search className="h-5 w-5 text-cyan-500" />
            <input className="w-full bg-transparent text-[var(--text)] outline-none placeholder:text-[var(--muted-text)]" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search Patrol Data Capture records" />
          </div>
          <div className="mt-4 overflow-x-auto">
            {filteredRecords.length ? (
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="text-xs uppercase tracking-[0.18em] text-[var(--muted-text)]">
                  <tr><th className="px-3 py-3">S/No.</th><th className="px-3 py-3">Patrol Reference No.</th><th className="px-3 py-3">Fisher's Name</th><th className="px-3 py-3">BMU</th><th className="px-3 py-3">Infringement code</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Actions</th></tr>
                </thead>
                <tbody>
                  {filteredRecords.map((record, index) => (
                    <tr key={record.id} className="border-t border-[var(--line)]">
                      <td className="px-3 py-4 text-[var(--muted-text)]">{record.row_no ?? index + 1}</td>
                      <td className="px-3 py-4 font-bold text-[var(--text)]">{record.patrol_reference_no ?? "-"}</td>
                      <td className="px-3 py-4 text-[var(--text)]">{record.fishers_name ?? "-"}</td>
                      <td className="px-3 py-4 text-[var(--text)]">{record.bmu_name ?? "-"}</td>
                      <td className="px-3 py-4 text-[var(--text)]">{record.infringement_code ?? "-"}</td>
                      <td className="px-3 py-4"><ComplianceStatusBadge status={record.status} /></td>
                      <td className="space-x-3 px-3 py-4"><button className="font-bold text-cyan-600" onClick={() => void viewDetail(record.id)}>View</button><button className="font-bold text-emerald-600" onClick={() => startEdit(record)}>Edit</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <EmptyState title="No Patrol Data Capture records" body="Create the first patrol data row. No demo records are shown." />
            )}
          </div>
        </div>

        <div className="ocean-panel rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-cyan-500" />
            <h2 className="font-black text-[var(--text)]">Detail view</h2>
          </div>
          {detail ? (
            <div className="mt-4 grid gap-4 text-sm text-[var(--text)]">
              <div><p className="text-xs uppercase tracking-[0.18em] text-[var(--muted-text)]">Patrol Reference No.</p><p className="font-bold">{detail.patrol_reference_no ?? "-"}</p></div>
              <div><p className="text-xs uppercase tracking-[0.18em] text-[var(--muted-text)]">Fisher's Name</p><p>{detail.fishers_name ?? "-"}</p></div>
              <div><p className="text-xs uppercase tracking-[0.18em] text-[var(--muted-text)]">Infringement code</p><p>{detail.infringement_code ?? "-"}</p></div>
              <div><p className="text-xs uppercase tracking-[0.18em] text-[var(--muted-text)]">Item Confiscated / Encountered and Details</p><p>{detail.item_confiscated_encountered_and_details ?? "-"}</p></div>
              <pre className="max-h-96 overflow-auto rounded-xl bg-[var(--soft)] p-3 text-xs text-[var(--muted-text)]">{JSON.stringify(detail, null, 2)}</pre>
            </div>
          ) : (
            <EmptyState title="Select a record" body="Open a Patrol Data Capture row to view the structured form data." />
          )}
        </div>
      </div>
    </section>
  );
}

function FormBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-5 rounded-2xl border border-[var(--line)] bg-[var(--soft)] p-4">
      <h3 className="mb-4 font-black text-[var(--text)]">{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function RowInput({ label, value, onChange, type = "text" }: { label: string; value: string | number; onChange: (value: string) => void; type?: string }) {
  return (
    <Field label={label}>
      <input type={type} className={fieldClass()} value={value} onChange={(event) => onChange(event.target.value)} />
    </Field>
  );
}
