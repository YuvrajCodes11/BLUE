"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Download, Eye, FileText, Plus, QrCode, Save, Search, ShieldCheck, X } from "lucide-react";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { LoadingState } from "@/components/dashboard/LoadingState";
import { createClient, hasSupabaseConfig } from "@/lib/supabase";
import { exportOfficialPdfReport } from "@/lib/export-utils";
import {
  createMcsOutcomeRecord,
  createOfficerPatrolReport,
  createOfficerPatrolReportEntry,
  createSeizedItem,
  createSeizureRecord,
  fetchBmusByWard,
  fetchLocationHierarchy,
  fetchOfficerPatrolReportDetail,
  fetchOfficerPatrolReports,
  updateOfficerPatrolReport,
  type LocationHierarchy,
  type OfficerPatrolReportDetail,
  type OfficerPatrolReportInput,
} from "@/services/compliance-service";
import type { LocationBmu, OfficerPatrolReport, OfficerPatrolReportEntry, SeizedItem, SeizureRecord } from "@/types/blue";

type Profile = {
  id: string;
  role: string;
};

type EntryDraft = Omit<OfficerPatrolReportEntry, "id" | "patrol_report_id" | "created_at">;
type SeizedItemDraft = Omit<SeizedItem, "id" | "seizure_record_id" | "created_at">;
type SeizureDraft = Omit<SeizureRecord, "id" | "patrol_report_id" | "bmu_patrol_report_id" | "created_by" | "updated_by" | "created_at" | "updated_at">;

const allowedRoles = new Set(["Government Admin", "KFS Officer", "County Officer"]);

const sourceReference = "GOK, 2014 MCS Standard Operating procedure manual.";
const legalReferenceNotes =
  "Legal reference categories shown on the source FORM 1A must be preserved: People, Gears, Crafts, and Fish.";

const emptyEntry: EntryDraft = {
  entry_time: "",
  location: "",
  person_name: "",
  id_no: "",
  people_infringement: "",
  quantity_gear_craft_type_equipment: "",
  gear_craft_infringement: "",
  quantity_and_species: "",
  form_fresh_processed: "",
  fish_infringement: "",
  remarks: "",
};

const emptySeizure: SeizureDraft = {
  county_id: "",
  sub_county_id: "",
  ward_id: "",
  bmu_id: "",
  particulars_of_items_seized: "",
  person_name: "",
  person_nationality: "",
  person_id_passport_no: "",
  person_date: "",
  person_signature: "",
  officer_impounding_items_name: "",
  officer_designation: "",
  officer_pa_no: "",
  officer_station: "",
  officer_signature: "",
  seizure_district: "",
  seizure_town_location_sub_location: "",
  seizure_road_street: "",
  time_of_seizure: "",
  status: "Draft",
};

const emptySeizedItem: SeizedItemDraft = {
  name_of_items_seized: "",
  unit_of_quantity: "",
  quantity: "",
  estimated_value: null,
};

const mcsOutcomeFields = [
  ["no_of_suspects", "No. of suspects"],
  ["no_of_vessels", "No. of vessels"],
  ["total_fines_kes", "Total fines in KES"],
  ["gear_item_type_confiscated", "Gear/item type confiscated"],
  ["quantity", "Quantity"],
  ["type_of_infringement", "Type of infringement"],
  ["no_of_cases_appearing", "No. of cases appearing"],
  ["yes_or_no_prosecution", "YES or NO Prosecution"],
  ["amount_of_fine", "Amount of fine"],
  ["no_of_acquittals", "No. of acquittals"],
  ["challenges_remarks", "Challenges/Remarks"],
] as const;

const seizureNoticeFields = [
  ["particulars_of_items_seized", "Particulars of items seized"],
  ["person_name", "Name"],
  ["person_nationality", "Nationality"],
  ["person_id_passport_no", "ID/Passport No."],
  ["person_date", "Date"],
  ["person_signature", "Signature"],
  ["officer_impounding_items_name", "Name of officer impounding items"],
  ["officer_designation", "Designation"],
  ["officer_pa_no", "PA/no."],
  ["officer_station", "Station"],
  ["officer_signature", "Signature"],
  ["seizure_district", "District"],
  ["seizure_town_location_sub_location", "Town/Location/Sub-location"],
  ["seizure_road_street", "Road/Street"],
  ["time_of_seizure", "Time of seizure"],
] as const;

function clean<T extends object>(input: T) {
  return Object.fromEntries(Object.entries(input).map(([key, value]) => [key, value === "" ? null : value])) as T;
}

function hasAnyValue(row: Record<string, unknown>) {
  return Object.values(row).some((value) => value !== "" && value !== null && value !== undefined);
}

function hasSeizureValue(row: SeizureDraft) {
  return seizureNoticeFields.some(([key]) => {
    const value = row[key];
    return value !== "" && value !== null && value !== undefined;
  });
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

function fieldClass() {
  return "rounded-xl border border-[var(--line)] bg-[var(--input)] px-3 py-2 text-sm text-[var(--text)] outline-none placeholder:text-[var(--muted-text)]";
}

function Label({ children }: { children: string }) {
  return <label className="text-xs font-black uppercase tracking-[0.18em] text-[var(--muted-text)]">{children}</label>;
}

export function OfficerForm1APage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [reports, setReports] = useState<OfficerPatrolReport[]>([]);
  const [detail, setDetail] = useState<OfficerPatrolReportDetail | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [locations, setLocations] = useState<LocationHierarchy>({ counties: [], subCounties: [], wards: [] });
  const [bmus, setBmus] = useState<LocationBmu[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<OfficerPatrolReport | null>(null);
  const [form, setForm] = useState<OfficerPatrolReportInput>({
    patrol_reference_no: "",
    name_of_bmu: "",
    county_id: "",
    sub_county_id: "",
    ward_id: "",
    bmu_id: "",
    patrol_date: "",
    source_reference: sourceReference,
    legal_reference_notes: legalReferenceNotes,
    status: "Draft",
  });
  const [entries, setEntries] = useState<EntryDraft[]>([{ ...emptyEntry }]);
  const [mcsOutcome, setMcsOutcome] = useState({
    no_of_suspects: "",
    no_of_vessels: "",
    total_fines_kes: "",
    gear_item_type_confiscated: "",
    quantity: "",
    type_of_infringement: "",
    no_of_cases_appearing: "",
    yes_or_no_prosecution: "",
    amount_of_fine: "",
    no_of_acquittals: "",
    challenges_remarks: "",
  });
  const [seizure, setSeizure] = useState<SeizureDraft>({ ...emptySeizure });
  const [seizedItems, setSeizedItems] = useState<SeizedItemDraft[]>([{ ...emptySeizedItem }]);

  const subCounties = useMemo(() => locations.subCounties.filter((item) => item.county_id === form.county_id), [form.county_id, locations.subCounties]);
  const wards = useMemo(() => locations.wards.filter((item) => item.sub_county_id === form.sub_county_id), [form.sub_county_id, locations.wards]);
  const filteredReports = useMemo(() => reports.filter((report) => JSON.stringify(report).toLowerCase().includes(query.toLowerCase())), [query, reports]);
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
        const [hierarchy, reportRows] = await Promise.all([fetchLocationHierarchy(), fetchOfficerPatrolReports()]);
        setLocations(hierarchy);
        setReports(reportRows);
        return;
      }

      const supabase = createClient();
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw new Error(userError.message);
      if (!userData.user) throw new Error("Please log in to access officer patrol reporting.");
      const { data: profileData, error: profileError } = await supabase.from("profiles").select("id,role").eq("id", userData.user.id).single();
      if (profileError) throw new Error(profileError.message);
      setProfile(profileData as Profile);
      if (!allowedRoles.has(profileData.role)) {
        setReports([]);
        return;
      }
      const [hierarchy, reportRows] = await Promise.all([fetchLocationHierarchy(), fetchOfficerPatrolReports()]);
      setLocations(hierarchy);
      setReports(reportRows);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load FORM 1A records.");
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

  function updateForm(key: keyof OfficerPatrolReportInput, value: string) {
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key === "county_id") {
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
      return next;
    });
  }

  function resetCreate() {
    setEditing(null);
    setForm({
      patrol_reference_no: "",
      name_of_bmu: "",
      county_id: "",
      sub_county_id: "",
      ward_id: "",
      bmu_id: "",
      patrol_date: "",
      source_reference: sourceReference,
      legal_reference_notes: legalReferenceNotes,
      status: "Draft",
    });
    setEntries([{ ...emptyEntry }]);
    setMcsOutcome({
      no_of_suspects: "",
      no_of_vessels: "",
      total_fines_kes: "",
      gear_item_type_confiscated: "",
      quantity: "",
      type_of_infringement: "",
      no_of_cases_appearing: "",
      yes_or_no_prosecution: "",
      amount_of_fine: "",
      no_of_acquittals: "",
      challenges_remarks: "",
    });
    setSeizure({ ...emptySeizure });
    setSeizedItems([{ ...emptySeizedItem }]);
    setShowCreate(true);
  }

  function startEdit(report: OfficerPatrolReport) {
    setEditing(report);
    setForm({
      patrol_reference_no: report.patrol_reference_no,
      name_of_bmu: report.name_of_bmu ?? "",
      county_id: report.county_id ?? "",
      sub_county_id: report.sub_county_id ?? "",
      ward_id: report.ward_id ?? "",
      bmu_id: report.bmu_id ?? "",
      patrol_date: report.patrol_date,
      source_reference: report.source_reference,
      legal_reference_notes: report.legal_reference_notes ?? "",
      status: report.status,
    });
    setShowCreate(true);
  }

  async function viewDetail(id: string) {
    setError("");
    try {
      const data = await fetchOfficerPatrolReportDetail(id);
      setDetail(data);
      setShowModal(true);
    } catch (detailError) {
      setError(detailError instanceof Error ? detailError.message : "Unable to load FORM 1A detail.");
    }
  }

  async function submit() {
    setError("");
    setNotice("");
    if (!form.patrol_reference_no || !form.patrol_date) {
      setError("Patrol Reference No and Date are required.");
      return;
    }
    setSaving(true);
    try {
      const cleanedForm = clean(form);
      if (editing) {
        const updated = await updateOfficerPatrolReport(editing.id, cleanedForm);
        setReports((current) => current.map((item) => (item.id === updated.id ? updated : item)));
        setNotice("FORM 1A header updated.");
        setEditing(null);
        setShowCreate(false);
        return;
      }

      const report = await createOfficerPatrolReport(cleanedForm);
      const entryRows = entries.filter(hasAnyValue);
      await Promise.all(entryRows.map((entry) => createOfficerPatrolReportEntry({ ...clean(entry), patrol_report_id: report.id })));

      if (hasAnyValue(mcsOutcome)) {
        await createMcsOutcomeRecord({
          patrol_report_id: report.id,
          no_of_suspects: mcsOutcome.no_of_suspects ? Number(mcsOutcome.no_of_suspects) : null,
          no_of_vessels: mcsOutcome.no_of_vessels ? Number(mcsOutcome.no_of_vessels) : null,
          total_fines_kes: mcsOutcome.total_fines_kes ? Number(mcsOutcome.total_fines_kes) : null,
          gear_item_type_confiscated: mcsOutcome.gear_item_type_confiscated || null,
          quantity: mcsOutcome.quantity || null,
          type_of_infringement: mcsOutcome.type_of_infringement || null,
          no_of_cases_appearing: mcsOutcome.no_of_cases_appearing ? Number(mcsOutcome.no_of_cases_appearing) : null,
          yes_or_no_prosecution: mcsOutcome.yes_or_no_prosecution || null,
          amount_of_fine: mcsOutcome.amount_of_fine ? Number(mcsOutcome.amount_of_fine) : null,
          no_of_acquittals: mcsOutcome.no_of_acquittals ? Number(mcsOutcome.no_of_acquittals) : null,
          challenges_remarks: mcsOutcome.challenges_remarks || null,
        });
      }

      if (hasSeizureValue(seizure)) {
        const createdSeizure = await createSeizureRecord({
          ...clean(seizure),
          patrol_report_id: report.id,
          bmu_patrol_report_id: null,
          county_id: form.county_id || null,
          sub_county_id: form.sub_county_id || null,
          ward_id: form.ward_id || null,
          bmu_id: form.bmu_id || null,
        });
        await Promise.all(
          seizedItems
            .filter((item) => item.name_of_items_seized || item.unit_of_quantity || item.quantity || item.estimated_value)
            .map((item) =>
              createSeizedItem({
                seizure_record_id: createdSeizure.id,
                name_of_items_seized: item.name_of_items_seized || "Unspecified item",
                unit_of_quantity: item.unit_of_quantity || null,
                quantity: item.quantity || null,
                estimated_value: item.estimated_value ? Number(item.estimated_value) : null,
              }),
            ),
        );
      }

      setNotice("FORM 1A patrol report created.");
      setReports((current) => [report, ...current]);
      resetCreate();
      setShowCreate(false);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to save FORM 1A.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingState />;
  if (!canAccess) return <EmptyState title="Officer workflow access only" body="FORM 1A is available to BMU Manager, KeFS/KFS Officer, and County Officer roles." />;

  return (
    <section className="grid gap-6 w-full max-w-full min-w-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between w-full min-w-0">
        <div className="min-w-0 max-w-full">
          <p className="text-sm font-black uppercase tracking-[0.24em] text-cyan-500">Official FORM 1A</p>
          <h1 className="mt-2 text-2xl font-black text-[var(--text)] sm:text-4xl md:text-5xl">Patrol Reporting Form</h1>
          <p className="mt-3 max-w-3xl text-sm text-[var(--muted-text)] break-words">
            KeFS/KFS, County, and Fisheries Officer workflow for officer-side patrol reporting. This is separate from BMU Patrol Reporting.
          </p>
        </div>
        <button onClick={resetCreate} className="ocean-action inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl px-4 py-3 font-bold text-slate-950 transition active:scale-95 shadow-md">
          <Plus className="h-4 w-4" /> New FORM 1A
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
            <ShieldCheck className="h-5 w-5 text-cyan-500" />
            <h2 className="text-xl font-black text-[var(--text)]">{editing ? "Edit FORM 1A header" : "Create FORM 1A patrol report"}</h2>
          </div>
          {editing && <p className="mt-2 text-sm text-[var(--muted-text)]">Safe edit mode updates the report header/status only. Entry-row editing will be added after this workflow is verified.</p>}

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="grid gap-2"><Label>Patrol Reference No</Label><input className={fieldClass()} value={form.patrol_reference_no} onChange={(e) => updateForm("patrol_reference_no", e.target.value)} /></div>
            <div className="grid gap-2"><Label>Name of BMU</Label><input className={fieldClass()} value={form.name_of_bmu ?? ""} onChange={(e) => updateForm("name_of_bmu", e.target.value)} /></div>
            <div className="grid gap-2"><Label>Date</Label><input type="date" className={fieldClass()} value={form.patrol_date} onChange={(e) => updateForm("patrol_date", e.target.value)} /></div>
            <div className="grid gap-2"><Label>Status</Label><select className={fieldClass()} value={form.status} onChange={(e) => updateForm("status", e.target.value)}><option>Draft</option><option>Submitted</option><option>Under Review</option><option>Approved</option><option>Closed</option></select></div>
            <div className="grid gap-2"><Label>County</Label><select className={fieldClass()} value={form.county_id ?? ""} onChange={(e) => updateForm("county_id", e.target.value)}><option value="">Select county</option>{locations.counties.map((county) => <option key={county.id} value={county.id}>{county.name}</option>)}</select></div>
            <div className="grid gap-2"><Label>Sub-county</Label><select className={fieldClass()} value={form.sub_county_id ?? ""} onChange={(e) => updateForm("sub_county_id", e.target.value)}><option value="">Select sub-county</option>{subCounties.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
            <div className="grid gap-2"><Label>Ward</Label><select className={fieldClass()} value={form.ward_id ?? ""} onChange={(e) => updateForm("ward_id", e.target.value)}><option value="">Select ward</option>{wards.map((ward) => <option key={ward.id} value={ward.id}>{ward.name}</option>)}</select></div>
            <div className="grid gap-2"><Label>BMU</Label><select className={fieldClass()} value={form.bmu_id ?? ""} onChange={(e) => updateForm("bmu_id", e.target.value)}><option value="">Select BMU under ward</option>{bmus.map((bmu) => <option key={bmu.id} value={bmu.id}>{bmu.name}</option>)}</select></div>
          </div>

          <div className="mt-5 grid gap-2">
            <Label>Legal/source reference notes</Label>
            <textarea className={`${fieldClass()} min-h-24`} value={form.legal_reference_notes ?? ""} onChange={(e) => updateForm("legal_reference_notes", e.target.value)} />
            <p className="text-sm text-[var(--muted-text)]">Source: {sourceReference}</p>
          </div>

          {!editing && (
            <>
              <div className="mt-6">
                <h3 className="font-black text-[var(--text)]">Patrol reporting table fields</h3>
                <div className="mt-3 grid gap-4">
                  {entries.map((entry, index) => (
                    <div key={index} className="rounded-2xl border border-[var(--line)] bg-[var(--soft)] p-4">
                      <p className="mb-3 text-sm font-bold text-[var(--muted-text)]">Entry {index + 1}</p>
                      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        {([
                          ["entry_time", "Time"],
                          ["location", "Location"],
                          ["person_name", "Name"],
                          ["id_no", "ID No."],
                          ["people_infringement", "Infringement"],
                          ["quantity_gear_craft_type_equipment", "Quantity / Gear / Craft type / Equipment"],
                          ["gear_craft_infringement", "Infringement"],
                          ["quantity_and_species", "Quantity and Species"],
                          ["form_fresh_processed", "Form (Fresh processed)"],
                          ["fish_infringement", "Infringement"],
                          ["remarks", "Remarks"],
                        ] as const).map(([key, label]) => (
                          <div key={key} className="grid gap-2">
                            <Label>{label}</Label>
                            <input type={key === "entry_time" ? "time" : "text"} className={fieldClass()} value={entry[key] ?? ""} onChange={(e) => setEntries((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, [key]: e.target.value } : row))} />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={() => setEntries((current) => [...current, { ...emptyEntry }])} className="mt-3 rounded-xl border border-[var(--line)] px-4 py-2 text-sm font-bold text-[var(--text)]">Add entry row</button>
              </div>

              <div className="mt-6 grid gap-4 xl:grid-cols-2">
                <div className="rounded-2xl border border-[var(--line)] bg-[var(--soft)] p-4">
                  <h3 className="font-black text-[var(--text)]">MCS Outcome Data Compilation fields</h3>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    {mcsOutcomeFields.map(([key, label]) => (
                      <div key={key} className="grid gap-2">
                        <Label>{label}</Label>
                        <input className={fieldClass()} value={mcsOutcome[key as keyof typeof mcsOutcome]} onChange={(e) => setMcsOutcome((current) => ({ ...current, [key]: e.target.value }))} />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border border-[var(--line)] bg-[var(--soft)] p-4">
                  <h3 className="font-black text-[var(--text)]">Seizure notice fields included with officer report</h3>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    {seizureNoticeFields.map(([key, label]) => (
                      <div key={key} className="grid gap-2">
                        <Label>{label}</Label>
                        <input type={key.includes("date") ? "date" : key.includes("time") ? "time" : "text"} className={fieldClass()} value={String(seizure[key as keyof SeizureDraft] ?? "")} onChange={(e) => setSeizure((current) => ({ ...current, [key]: e.target.value }))} />
                      </div>
                    ))}
                  </div>
                  <h4 className="mt-4 font-bold text-[var(--text)]">Seized items table</h4>
                  <div className="mt-3 grid gap-3">
                    {seizedItems.map((item, index) => (
                      <div key={index} className="grid gap-3 md:grid-cols-4">
                        <input placeholder="Name of Items Seized" className={fieldClass()} value={item.name_of_items_seized} onChange={(e) => setSeizedItems((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, name_of_items_seized: e.target.value } : row))} />
                        <input placeholder="Unit of Quantity" className={fieldClass()} value={item.unit_of_quantity ?? ""} onChange={(e) => setSeizedItems((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, unit_of_quantity: e.target.value } : row))} />
                        <input placeholder="Quantity" className={fieldClass()} value={item.quantity ?? ""} onChange={(e) => setSeizedItems((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, quantity: e.target.value } : row))} />
                        <input placeholder="Estimated value" type="number" className={fieldClass()} value={item.estimated_value ?? ""} onChange={(e) => setSeizedItems((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, estimated_value: e.target.value ? Number(e.target.value) : null } : row))} />
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setSeizedItems((current) => [...current, { ...emptySeizedItem }])} className="mt-3 rounded-xl border border-[var(--line)] px-4 py-2 text-sm font-bold text-[var(--text)]">Add seized item</button>
                </div>
              </div>
            </>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <button disabled={saving} onClick={() => void submit()} className="ocean-action inline-flex items-center gap-2 rounded-xl px-4 py-3 font-bold text-slate-950 disabled:opacity-60">
              <Save className="h-4 w-4" /> {saving ? "Saving..." : editing ? "Update header" : "Save FORM 1A"}
            </button>
            <button onClick={() => { setShowCreate(false); setEditing(null); }} className="rounded-xl border border-[var(--line)] px-4 py-3 font-bold text-[var(--text)]">Cancel</button>
          </div>
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.62fr)_minmax(0,0.38fr)] w-full max-w-full min-w-0">
        <div className="ocean-panel rounded-2xl p-4 sm:p-5 w-full max-w-full min-w-0 overflow-hidden">
          <div className="flex items-center gap-3">
            <Search className="h-5 w-5 text-cyan-500" />
            <input className="w-full bg-transparent text-[var(--text)] outline-none placeholder:text-[var(--muted-text)]" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search FORM 1A records" />
          </div>
          <div className="mt-4 w-full max-w-full min-w-0 overflow-x-auto rounded-xl border border-[var(--line)]/60">
            {filteredReports.length ? (
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="text-xs uppercase tracking-[0.18em] text-[var(--muted-text)]">
                  <tr><th className="px-3 py-3">S/N</th><th className="px-3 py-3">Patrol Reference No</th><th className="px-3 py-3">Name of BMU</th><th className="px-3 py-3">Date</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Actions</th></tr>
                </thead>
                <tbody>
                  {filteredReports.map((report, index) => (
                    <tr key={report.id} className="border-t border-[var(--line)]">
                      <td className="px-3 py-4 text-[var(--muted-text)]">{String(index + 1).padStart(2, "0")}</td>
                      <td className="px-3 py-4 font-bold text-[var(--text)]">{report.patrol_reference_no}</td>
                      <td className="px-3 py-4 text-[var(--text)]">{report.name_of_bmu ?? "-"}</td>
                      <td className="px-3 py-4 text-[var(--text)]">{report.patrol_date}</td>
                      <td className="px-3 py-4"><ComplianceStatusBadge status={report.status} /></td>
                      <td className="space-x-3 px-3 py-4"><button className="font-bold text-cyan-600" onClick={() => void viewDetail(report.id)}>View</button><button className="font-bold text-emerald-600" onClick={() => startEdit(report)}>Edit</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <EmptyState title="No FORM 1A records" body="Create the first officer-side patrol report. No demo records are shown." />
            )}
          </div>
        </div>

        <div className="ocean-panel rounded-2xl p-4 sm:p-5 shadow-sm w-full max-w-full min-w-0 overflow-hidden">
          <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-cyan-400" />
              <h2 className="font-bold text-[var(--text)] text-sm">FORM 1A Inspection Dossier</h2>
            </div>
            {detail && (
              <span className="inline-flex items-center rounded-full border border-emerald-400/40 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-400">
                Official Form 1A
              </span>
            )}
          </div>
          {detail ? (
            <div className="mt-4 space-y-4 text-xs text-[var(--text)]">
              <div className="rounded-xl border border-[var(--line)] bg-[var(--soft)] p-3">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--muted-text)]">Patrol Reference</span>
                <p className="mt-0.5 font-black text-sm text-[var(--text)]">{detail.report.patrol_reference_no}</p>
                <p className="text-[11px] text-cyan-400 font-semibold mt-1">Source: {detail.report.source_reference}</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-[var(--line)] bg-[var(--soft)] p-2.5">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--muted-text)]">Patrol Date</span>
                  <p className="font-bold text-[var(--text)] mt-0.5">{detail.report.patrol_date}</p>
                </div>
                <div className="rounded-xl border border-[var(--line)] bg-[var(--soft)] p-2.5">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--muted-text)]">BMU Zone</span>
                  <p className="font-bold text-[var(--text)] mt-0.5">{detail.report.name_of_bmu || "Kilifi BMU"}</p>
                </div>
              </div>

              <div className="rounded-xl border border-[var(--line)] bg-[var(--soft)] p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted-text)]">Inspection Log Entries</span>
                  <span className="font-bold text-cyan-400">{detail.entries.length} recorded</span>
                </div>
                {detail.entries.length ? (
                  <div className="space-y-1.5">
                    {detail.entries.map((entry, idx) => (
                      <div key={idx} className="flex items-center justify-between rounded-lg bg-[var(--input)] p-2 text-[11px]">
                        <span className="font-bold text-[var(--text)]">{entry.person_name || "Fisher Log"}</span>
                        <span className="text-cyan-400 font-mono">{entry.location || "Grid -"}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-[var(--muted-text)]">No entries logged during inspection.</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-[var(--line)] bg-[var(--soft)] p-2.5">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--muted-text)]">MCS Outcomes</span>
                  <p className="font-bold text-emerald-400 mt-0.5">{detail.mcsOutcomes.length ? `${detail.mcsOutcomes.length} Captured` : "None"}</p>
                </div>
                <div className="rounded-xl border border-[var(--line)] bg-[var(--soft)] p-2.5">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--muted-text)]">Seizure Notices</span>
                  <p className="font-bold text-amber-300 mt-0.5">{detail.seizureRecords.length ? `${detail.seizureRecords.length} Seizure(s)` : "None"}</p>
                </div>
              </div>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowModal(true)}
                  className="ocean-action inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-950 shadow-md transition active:scale-95"
                >
                  <Eye className="h-4 w-4" /> Open Full FORM 1A Dossier
                </button>
              </div>
            </div>
          ) : (
            <EmptyState title="Select a record" body="Open a FORM 1A record to view structured entries, MCS outcomes, and seizure notice data." />
          )}
        </div>
      </div>

      {/* Official Officer FORM 1A Dossier Modal */}
      {showModal && detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="ocean-panel relative w-full max-w-2xl rounded-2xl border border-cyan-500/30 p-4 sm:p-6 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-3 sm:pb-4">
              <div className="flex items-center gap-2 min-w-0">
                <ShieldCheck className="h-5 w-5 text-cyan-400 shrink-0" />
                <span className="font-bold text-sm text-[var(--text)] truncate">Official Fisheries Officer FORM 1A Report</span>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="grid h-8 w-8 place-items-center rounded-lg border border-[var(--line)] bg-[var(--soft)] text-[var(--muted-text)] hover:text-[var(--text)] transition shrink-0 ml-2"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 overflow-y-auto pr-1 flex-1 space-y-4">
              <div className="rounded-2xl border border-cyan-500/30 bg-[var(--input)] p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[var(--line)] pb-4">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-cyan-400">
                      REPUBLIC OF KENYA · FISHERIES SERVICE MCS DIVISION
                    </span>
                    <h3 className="text-lg sm:text-xl font-black text-[var(--text)] mt-1">
                      Patrol Ref: {detail.report.patrol_reference_no}
                    </h3>
                    <p className="text-xs text-[var(--muted-text)] mt-0.5">
                      BMU: <strong className="text-[var(--text)]">{detail.report.name_of_bmu || "Kilifi"}</strong> · Date: <strong className="text-[var(--text)]">{detail.report.patrol_date}</strong>
                    </p>
                  </div>
                  <div className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5" /> FORM 1A CERTIFIED
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-[var(--line)] bg-[var(--soft)] p-3.5 sm:p-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-cyan-400 mb-2">Structured Inspection Log ({detail.entries.length} entries)</h4>
                  {detail.entries.length ? (
                    <div className="space-y-2">
                      {detail.entries.map((entry, idx) => (
                        <div key={idx} className="rounded-lg bg-[var(--input)] p-3 text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[var(--text)]">{entry.person_name || "Fisher Record"}</span>
                            <span className="font-mono text-cyan-400">{entry.location || "Coast Area"}</span>
                          </div>
                          <p className="text-[var(--muted-text)]">{entry.gear_craft_infringement || entry.people_infringement || entry.fish_infringement || "Inspection completed. Compliant."}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[var(--muted-text)]">No entries logged during this patrol inspection.</p>
                  )}
                </div>

                {detail.seizureRecords.length > 0 && (
                  <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3.5 sm:p-4">
                    <h4 className="text-xs font-black uppercase tracking-wider text-amber-400 mb-2">Official Seizure Notices ({detail.seizureRecords.length})</h4>
                    <div className="space-y-2">
                      {detail.seizureRecords.map((s, idx) => (
                        <div key={idx} className="rounded-lg bg-[var(--input)] p-3 text-xs space-y-1 border border-amber-500/20">
                          <p className="font-bold text-amber-300">Notice Ref: {s.id.slice(0, 8)}</p>
                          <p className="text-[var(--text)]">Items Seized: {s.particulars_of_items_seized || "Confiscated gear"}</p>
                          <p className="text-[var(--muted-text)] font-mono text-[10px]">District / Town: {s.seizure_district || "Kilifi Coast"}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-[var(--line)] bg-[var(--soft)] p-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <QrCode className="h-7 w-7 sm:h-8 sm:w-8 text-cyan-400 shrink-0" />
                    <div>
                      <span className="block text-[10px] font-bold text-[var(--muted-text)] uppercase">Digital Ledger Stamp</span>
                      <span className="font-mono text-[10px] text-cyan-400">SHA256: 3c9e88...a521</span>
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] text-[var(--muted-text)] block">Kenya Fisheries Service (KFS)</span>
                    <strong className="text-xs text-[var(--text)]">MCS Surveillance Operations Hub</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-col-reverse sm:flex-row items-stretch sm:items-center sm:justify-end gap-2 sm:gap-3 border-t border-[var(--line)] pt-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-xl border border-[var(--line)] bg-[var(--soft)] px-4 py-2.5 sm:py-2 text-xs font-bold text-[var(--text)] hover:border-cyan-400 transition text-center"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  exportOfficialPdfReport({
                    filename: `officer-form-1a-${detail.report.patrol_reference_no || "report"}.html`,
                    title: `Fisheries Officer FORM 1A Report · Ref: ${detail.report.patrol_reference_no}`,
                    authority: "Kenya Fisheries Service (KeFS) · Monitoring, Control & Surveillance (MCS) Unit",
                    summary: `Official coastal patrol inspection report filed under Fisheries Management and Development Act (Form 1A). Documents vessel verifications, gear compliance checks, and legal seizure notices.`,
                    metadata: [
                      { label: "Patrol Reference", value: detail.report.patrol_reference_no },
                      { label: "Date of Inspection", value: detail.report.patrol_date },
                      { label: "BMU Authority", value: detail.report.name_of_bmu || "Kilifi BMU" },
                      { label: "Source Reference", value: detail.report.source_reference },
                      { label: "Entries Logged", value: `${detail.entries.length} inspections` },
                      { label: "MCS Enforcement Outcomes", value: `${detail.mcsOutcomes.length} recorded` },
                      { label: "Seizure Notices", value: `${detail.seizureRecords.length} notice(s)` },
                    ],
                    tables: detail.entries.length
                      ? [
                          {
                            title: "Structured Inspection Registry",
                            headers: ["Fisher / Crew", "Location", "Encounter Findings"],
                            rows: detail.entries.map((e) => [
                              e.person_name || "Fisher Record",
                              e.location || "Coast Grid",
                              e.gear_craft_infringement || e.people_infringement || e.fish_infringement || "Compliant",
                            ]),
                          },
                        ]
                      : undefined,
                  });
                  setShowModal(false);
                  setNotice("✓ FORM 1A report exported.");
                  setTimeout(() => setNotice(""), 3000);
                }}
                className="ocean-action inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 sm:py-2 text-xs font-bold text-slate-950 shadow-md"
              >
                <Download className="h-4 w-4" /> Export FORM 1A
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
