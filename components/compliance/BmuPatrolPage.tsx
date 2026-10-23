"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { FileText, Plus, Save, Search, ShieldCheck } from "lucide-react";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { LoadingState } from "@/components/dashboard/LoadingState";
import { createClient, hasSupabaseConfig } from "@/lib/supabase";
import {
  createBmuPatrolOutcome,
  createBmuPatrolParticipant,
  createBmuPatrolReport,
  fetchBmusByWard,
  fetchBmuPatrolReportDetail,
  fetchBmuPatrolReports,
  fetchLocationHierarchy,
  updateBmuPatrolReport,
  type BmuPatrolReportDetail,
  type BmuPatrolReportInput,
  type LocationHierarchy,
} from "@/services/compliance-service";
import type { BmuPatrolOutcome, BmuPatrolParticipant, BmuPatrolReport, LocationBmu } from "@/types/blue";

type Profile = {
  id: string;
  role: string;
};

type ParticipantDraft = Omit<BmuPatrolParticipant, "id" | "bmu_patrol_report_id" | "created_at">;
type OutcomeDraft = Omit<BmuPatrolOutcome, "id" | "bmu_patrol_report_id" | "created_at">;

const allowedRoles = new Set(["Government Admin", "KFS Officer", "County Officer", "BMU Manager", "Ranger"]);

const emptyParticipant: ParticipantDraft = {
  institution_taasisi_no: "",
  idadi_ya_watu: null,
};

const emptyOutcome: OutcomeDraft = {
  infringement_no: "",
  infringement_type: "",
  action_taken_hatua_iliyochukuliwa: "",
};

const emptyReport: BmuPatrolReportInput = {
  bmu_id: "",
  county_id: "",
  sub_county_id: "",
  ward_id: "",
  bmu_name_jina_la_patrol_bmu: "",
  patrol_leader_name: "",
  patrol_leader_position: "",
  patrol_leader_mobile_phone_number: "",
  date_of_patrol_tarehe_ya_patrol: "",
  time_patrol_commenced_saa_ya_kwanza: "",
  time_patrol_ended_saa_ya_kutamatisha: "",
  patrol_vessel_name_jina_la_chombo: "",
  vessel_type_aina_ya_chombo_material_length: "",
  vessel_engine_horsepower_hp_nguvu_ya_engine: "",
  patrol_objective_lengo_la_patrol_1: "",
  patrol_objective_lengo_la_patrol_2: "",
  patrol_area_eneo_la_patrol_1: "",
  patrol_area_eneo_la_patrol_2: "",
  patrol_area_eneo_la_patrol_3: "",
  outcomes_matokeo_ya_patrol_na_hatua_iliyochukuliwa: "",
  challenge_fuel_shortage_uhaba_wa_mafuta: false,
  challenge_bad_weather_hali_mbaya_ya_anga: false,
  challenge_mechanical_issues_boti_kuharibika: false,
  challenge_resistance_from_fishers_usumbufu_ya_wavuvi: false,
  challenge_other_mengine: "",
  attached_patrol_data_capture_form: false,
  attached_patrol_costing_table: false,
  attached_seizure_form: false,
  attached_mcs_outcome_data_compilation_form: false,
  attached_other: "",
  prepared_by_name_jina: "",
  prepared_by_designation_cheo: "",
  prepared_by_signature_sahihi: "",
  prepared_by_date_tarehe_ya_kuandika_repoti: "",
  status: "Draft",
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

export function BmuPatrolPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [reports, setReports] = useState<BmuPatrolReport[]>([]);
  const [detail, setDetail] = useState<BmuPatrolReportDetail | null>(null);
  const [locations, setLocations] = useState<LocationHierarchy>({ counties: [], subCounties: [], wards: [] });
  const [bmus, setBmus] = useState<LocationBmu[]>([]);
  const [form, setForm] = useState<BmuPatrolReportInput>({ ...emptyReport });
  const [participants, setParticipants] = useState<ParticipantDraft[]>([{ ...emptyParticipant }]);
  const [outcomes, setOutcomes] = useState<OutcomeDraft[]>([{ ...emptyOutcome }]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<BmuPatrolReport | null>(null);

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
        const [hierarchy, reportRows] = await Promise.all([fetchLocationHierarchy(), fetchBmuPatrolReports()]);
        setLocations(hierarchy);
        setReports(reportRows);
        return;
      }

      const supabase = createClient();
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw new Error(userError.message);
      if (!userData.user) throw new Error("Please log in to access BMU Patrol Reporting.");
      const { data: profileData, error: profileError } = await supabase.from("profiles").select("id,role").eq("id", userData.user.id).single();
      if (profileError) throw new Error(profileError.message);
      setProfile(profileData as Profile);
      if (!allowedRoles.has(profileData.role)) {
        setReports([]);
        return;
      }
      const [hierarchy, reportRows] = await Promise.all([fetchLocationHierarchy(), fetchBmuPatrolReports()]);
      setLocations(hierarchy);
      setReports(reportRows);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load BMU Patrol reports.");
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

  function updateForm<K extends keyof BmuPatrolReportInput>(key: K, value: BmuPatrolReportInput[K]) {
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
    setForm({ ...emptyReport });
    setParticipants([{ ...emptyParticipant }]);
    setOutcomes([{ ...emptyOutcome }]);
    setShowCreate(true);
  }

  function startEdit(report: BmuPatrolReport) {
    setEditing(report);
    setForm({
      bmu_id: report.bmu_id,
      county_id: report.county_id ?? "",
      sub_county_id: report.sub_county_id ?? "",
      ward_id: report.ward_id ?? "",
      bmu_name_jina_la_patrol_bmu: report.bmu_name_jina_la_patrol_bmu ?? "",
      patrol_leader_name: report.patrol_leader_name,
      patrol_leader_position: report.patrol_leader_position ?? "",
      patrol_leader_mobile_phone_number: report.patrol_leader_mobile_phone_number ?? "",
      date_of_patrol_tarehe_ya_patrol: report.date_of_patrol_tarehe_ya_patrol,
      time_patrol_commenced_saa_ya_kwanza: report.time_patrol_commenced_saa_ya_kwanza ?? "",
      time_patrol_ended_saa_ya_kutamatisha: report.time_patrol_ended_saa_ya_kutamatisha ?? "",
      patrol_vessel_name_jina_la_chombo: report.patrol_vessel_name_jina_la_chombo ?? "",
      vessel_type_aina_ya_chombo_material_length: report.vessel_type_aina_ya_chombo_material_length ?? "",
      vessel_engine_horsepower_hp_nguvu_ya_engine: report.vessel_engine_horsepower_hp_nguvu_ya_engine ?? "",
      patrol_objective_lengo_la_patrol_1: report.patrol_objective_lengo_la_patrol_1 ?? "",
      patrol_objective_lengo_la_patrol_2: report.patrol_objective_lengo_la_patrol_2 ?? "",
      patrol_area_eneo_la_patrol_1: report.patrol_area_eneo_la_patrol_1 ?? "",
      patrol_area_eneo_la_patrol_2: report.patrol_area_eneo_la_patrol_2 ?? "",
      patrol_area_eneo_la_patrol_3: report.patrol_area_eneo_la_patrol_3 ?? "",
      outcomes_matokeo_ya_patrol_na_hatua_iliyochukuliwa: report.outcomes_matokeo_ya_patrol_na_hatua_iliyochukuliwa ?? "",
      challenge_fuel_shortage_uhaba_wa_mafuta: report.challenge_fuel_shortage_uhaba_wa_mafuta,
      challenge_bad_weather_hali_mbaya_ya_anga: report.challenge_bad_weather_hali_mbaya_ya_anga,
      challenge_mechanical_issues_boti_kuharibika: report.challenge_mechanical_issues_boti_kuharibika,
      challenge_resistance_from_fishers_usumbufu_ya_wavuvi: report.challenge_resistance_from_fishers_usumbufu_ya_wavuvi,
      challenge_other_mengine: report.challenge_other_mengine ?? "",
      attached_patrol_data_capture_form: report.attached_patrol_data_capture_form,
      attached_patrol_costing_table: report.attached_patrol_costing_table,
      attached_seizure_form: report.attached_seizure_form,
      attached_mcs_outcome_data_compilation_form: report.attached_mcs_outcome_data_compilation_form,
      attached_other: report.attached_other ?? "",
      prepared_by_name_jina: report.prepared_by_name_jina ?? "",
      prepared_by_designation_cheo: report.prepared_by_designation_cheo ?? "",
      prepared_by_signature_sahihi: report.prepared_by_signature_sahihi ?? "",
      prepared_by_date_tarehe_ya_kuandika_repoti: report.prepared_by_date_tarehe_ya_kuandika_repoti ?? "",
      status: report.status,
    });
    setShowCreate(true);
  }

  async function viewDetail(id: string) {
    setError("");
    try {
      setDetail(await fetchBmuPatrolReportDetail(id));
    } catch (detailError) {
      setError(detailError instanceof Error ? detailError.message : "Unable to load BMU Patrol detail.");
    }
  }

  async function submit() {
    setError("");
    setNotice("");
    if (!form.bmu_id || !form.patrol_leader_name || !form.date_of_patrol_tarehe_ya_patrol) {
      setError("BMU, Patrol leader name, and Date of Patrol / Tarehe ya Patrol are required.");
      return;
    }
    setSaving(true);
    try {
      const cleanedForm = clean(form);
      if (editing) {
        const updated = await updateBmuPatrolReport(editing.id, cleanedForm);
        setReports((current) => current.map((item) => (item.id === updated.id ? updated : item)));
        setNotice("BMU Patrol report updated.");
        setEditing(null);
        setShowCreate(false);
        return;
      }

      const report = await createBmuPatrolReport(cleanedForm);
      const participantRows = participants.filter((row) => hasAnyValue(row as unknown as Record<string, unknown>));
      const outcomeRows = outcomes.filter((row) => hasAnyValue(row as unknown as Record<string, unknown>));
      await Promise.all(participantRows.map((participant) => createBmuPatrolParticipant({ ...clean(participant), bmu_patrol_report_id: report.id })));
      await Promise.all(outcomeRows.map((outcome) => createBmuPatrolOutcome({ ...clean(outcome), bmu_patrol_report_id: report.id })));
      setReports((current) => [report, ...current]);
      setNotice("BMU Patrol report created.");
      resetCreate();
      setShowCreate(false);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to save BMU Patrol report.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingState />;
  if (!canAccess) return <EmptyState title="BMU Patrol access only" body="BMU Patrol Reporting is available to BMU Manager, KeFS/KFS Officer, County Officer, and Ranger roles." />;

  return (
    <section className="grid gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.24em] text-cyan-500">BMU Compliance / Patrols</p>
          <h1 className="mt-2 text-3xl font-black text-[var(--text)] md:text-5xl">BMU Patrol Reporting Form</h1>
          <p className="mt-3 max-w-3xl text-[var(--muted-text)]">Structured BMU-side patrol reporting. This is separate from officer-side FORM 1A, Patrol Data Capture, and Seizure Form workflows.</p>
        </div>
        <button onClick={resetCreate} className="ocean-action inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-bold text-slate-950">
          <Plus className="h-4 w-4" /> New BMU Patrol
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
            <h2 className="text-xl font-black text-[var(--text)]">{editing ? "Edit BMU Patrol report" : "Create BMU Patrol report"}</h2>
          </div>
          {editing && <p className="mt-2 text-sm text-[var(--muted-text)]">Safe edit mode updates the main report fields. Participant/outcome row editing will be added after this workflow is verified.</p>}

          <div className="mt-5 grid gap-5">
            <FormBlock title="1. Patrol Information / Taarifa ya Patrol">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Field label="County"><select className={fieldClass()} value={form.county_id ?? ""} onChange={(e) => updateForm("county_id", e.target.value)}><option value="">Select county</option>{locations.counties.map((county) => <option key={county.id} value={county.id}>{county.name}</option>)}</select></Field>
                <Field label="Sub-county"><select className={fieldClass()} value={form.sub_county_id ?? ""} onChange={(e) => updateForm("sub_county_id", e.target.value)}><option value="">Select sub-county</option>{subCounties.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
                <Field label="Ward"><select className={fieldClass()} value={form.ward_id ?? ""} onChange={(e) => updateForm("ward_id", e.target.value)}><option value="">Select ward</option>{wards.map((ward) => <option key={ward.id} value={ward.id}>{ward.name}</option>)}</select></Field>
                <Field label="BMU"><select className={fieldClass()} value={form.bmu_id} onChange={(e) => updateForm("bmu_id", e.target.value)}><option value="">Select BMU under ward</option>{bmus.map((bmu) => <option key={bmu.id} value={bmu.id}>{bmu.name}</option>)}</select></Field>
                <Field label="BMU Name / Jina la Patrol BMU"><input className={fieldClass()} value={form.bmu_name_jina_la_patrol_bmu ?? ""} onChange={(e) => updateForm("bmu_name_jina_la_patrol_bmu", e.target.value)} /></Field>
                <Field label="Patrol leader name"><input className={fieldClass()} value={form.patrol_leader_name} onChange={(e) => updateForm("patrol_leader_name", e.target.value)} /></Field>
                <Field label="Patrol leader position"><input className={fieldClass()} value={form.patrol_leader_position ?? ""} onChange={(e) => updateForm("patrol_leader_position", e.target.value)} /></Field>
                <Field label="Patrol leader mobile phone number"><input className={fieldClass()} value={form.patrol_leader_mobile_phone_number ?? ""} onChange={(e) => updateForm("patrol_leader_mobile_phone_number", e.target.value)} /></Field>
                <Field label="Date of Patrol / Tarehe ya Patrol"><input type="date" className={fieldClass()} value={form.date_of_patrol_tarehe_ya_patrol} onChange={(e) => updateForm("date_of_patrol_tarehe_ya_patrol", e.target.value)} /></Field>
                <Field label="Time patrol commenced / Saa ya kwanza"><input type="time" className={fieldClass()} value={form.time_patrol_commenced_saa_ya_kwanza ?? ""} onChange={(e) => updateForm("time_patrol_commenced_saa_ya_kwanza", e.target.value)} /></Field>
                <Field label="Time patrol ended / Saa ya kutamatisha"><input type="time" className={fieldClass()} value={form.time_patrol_ended_saa_ya_kutamatisha ?? ""} onChange={(e) => updateForm("time_patrol_ended_saa_ya_kutamatisha", e.target.value)} /></Field>
                <Field label="Status"><select className={fieldClass()} value={form.status} onChange={(e) => updateForm("status", e.target.value)}><option>Draft</option><option>Submitted</option><option>Under Review</option><option>Approved</option><option>Rejected</option><option>Closed</option></select></Field>
              </div>
            </FormBlock>

            <FormBlock title="2. Patrol objective(s) / Lengo la Patrol">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Patrol objective / Lengo la Patrol 1"><textarea className={`${fieldClass()} min-h-24`} value={form.patrol_objective_lengo_la_patrol_1 ?? ""} onChange={(e) => updateForm("patrol_objective_lengo_la_patrol_1", e.target.value)} /></Field>
                <Field label="Patrol objective / Lengo la Patrol 2"><textarea className={`${fieldClass()} min-h-24`} value={form.patrol_objective_lengo_la_patrol_2 ?? ""} onChange={(e) => updateForm("patrol_objective_lengo_la_patrol_2", e.target.value)} /></Field>
              </div>
            </FormBlock>

            {!editing && (
              <FormBlock title="3. Patrol participants / Washikadau walioshiriki katika patrol">
                <div className="grid gap-3">
                  {participants.map((participant, index) => (
                    <div key={index} className="grid gap-3 md:grid-cols-[1fr_180px]">
                      <input placeholder="Institution / Taasisi No" className={fieldClass()} value={participant.institution_taasisi_no} onChange={(e) => setParticipants((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, institution_taasisi_no: e.target.value } : row))} />
                      <input placeholder="Idadi ya watu" type="number" className={fieldClass()} value={participant.idadi_ya_watu ?? ""} onChange={(e) => setParticipants((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, idadi_ya_watu: e.target.value ? Number(e.target.value) : null } : row))} />
                    </div>
                  ))}
                </div>
                <button onClick={() => setParticipants((current) => [...current, { ...emptyParticipant }])} className="mt-3 rounded-xl border border-[var(--line)] px-4 py-2 text-sm font-bold text-[var(--text)]">Add participant row</button>
              </FormBlock>
            )}

            <FormBlock title="4. Vessel Information / Taarifa kuhusu Chombo la Patrol iliyotumika">
              <div className="grid gap-4 md:grid-cols-3">
                <Field label="Name of patrol vessel / Jina la Chombo"><input className={fieldClass()} value={form.patrol_vessel_name_jina_la_chombo ?? ""} onChange={(e) => updateForm("patrol_vessel_name_jina_la_chombo", e.target.value)} /></Field>
                <Field label="Vessel Type / Aina ya Chombo (material & length)"><input className={fieldClass()} value={form.vessel_type_aina_ya_chombo_material_length ?? ""} onChange={(e) => updateForm("vessel_type_aina_ya_chombo_material_length", e.target.value)} /></Field>
                <Field label="Horsepower (HP) of Vessel Engine / Nguvu ya Engine"><input className={fieldClass()} value={form.vessel_engine_horsepower_hp_nguvu_ya_engine ?? ""} onChange={(e) => updateForm("vessel_engine_horsepower_hp_nguvu_ya_engine", e.target.value)} /></Field>
              </div>
            </FormBlock>

            <FormBlock title="5. Patrol Area / Eneo la Patrol">
              <div className="grid gap-4 md:grid-cols-3">
                <Field label="Patrol Area / Eneo la Patrol 1"><input className={fieldClass()} value={form.patrol_area_eneo_la_patrol_1 ?? ""} onChange={(e) => updateForm("patrol_area_eneo_la_patrol_1", e.target.value)} /></Field>
                <Field label="Patrol Area / Eneo la Patrol 2"><input className={fieldClass()} value={form.patrol_area_eneo_la_patrol_2 ?? ""} onChange={(e) => updateForm("patrol_area_eneo_la_patrol_2", e.target.value)} /></Field>
                <Field label="Patrol Area / Eneo la Patrol 3"><input className={fieldClass()} value={form.patrol_area_eneo_la_patrol_3 ?? ""} onChange={(e) => updateForm("patrol_area_eneo_la_patrol_3", e.target.value)} /></Field>
              </div>
            </FormBlock>

            <FormBlock title="6. Outcomes / Matokeo ya patrol na hatua iliyochukuliwa">
              <textarea className={`${fieldClass()} min-h-28`} value={form.outcomes_matokeo_ya_patrol_na_hatua_iliyochukuliwa ?? ""} onChange={(e) => updateForm("outcomes_matokeo_ya_patrol_na_hatua_iliyochukuliwa", e.target.value)} />
              {!editing && (
                <div className="mt-4 grid gap-3">
                  {outcomes.map((outcome, index) => (
                    <div key={index} className="grid gap-3 md:grid-cols-3">
                      <input placeholder="Infringement No" className={fieldClass()} value={outcome.infringement_no ?? ""} onChange={(e) => setOutcomes((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, infringement_no: e.target.value } : row))} />
                      <input placeholder="Infringement type" className={fieldClass()} value={outcome.infringement_type ?? ""} onChange={(e) => setOutcomes((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, infringement_type: e.target.value } : row))} />
                      <input placeholder="Action taken / Hatua iliyochukuliwa" className={fieldClass()} value={outcome.action_taken_hatua_iliyochukuliwa ?? ""} onChange={(e) => setOutcomes((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, action_taken_hatua_iliyochukuliwa: e.target.value } : row))} />
                    </div>
                  ))}
                  <button onClick={() => setOutcomes((current) => [...current, { ...emptyOutcome }])} className="w-fit rounded-xl border border-[var(--line)] px-4 py-2 text-sm font-bold text-[var(--text)]">Add outcome row</button>
                </div>
              )}
            </FormBlock>

            <FormBlock title="7. Challenges Encountered / Changamoto">
              <div className="grid gap-3 md:grid-cols-2">
                {([
                  ["challenge_fuel_shortage_uhaba_wa_mafuta", "Fuel shortage / Uhaba wa mafuta"],
                  ["challenge_bad_weather_hali_mbaya_ya_anga", "Bad weather / Hali mbaya ya anga"],
                  ["challenge_mechanical_issues_boti_kuharibika", "Mechanical issues / Boti kuharibika"],
                  ["challenge_resistance_from_fishers_usumbufu_ya_wavuvi", "Resistance from fishers / Usumbufu ya wavuvi"],
                ] as const).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-3 rounded-xl border border-[var(--line)] bg-[var(--input)] px-3 py-3 text-sm font-bold text-[var(--text)]">
                    <input type="checkbox" checked={Boolean(form[key])} onChange={(e) => updateForm(key, e.target.checked)} />
                    {label}
                  </label>
                ))}
              </div>
              <div className="mt-3 grid gap-2">
                <Label>Other / Mengine</Label>
                <textarea className={`${fieldClass()} min-h-20`} value={form.challenge_other_mengine ?? ""} onChange={(e) => updateForm("challenge_other_mengine", e.target.value)} />
              </div>
            </FormBlock>

            <FormBlock title="8. Attached documents list section">
              <p className="mb-3 text-sm text-[var(--muted-text)]">Upload/storage support will be completed in the attachments stage. For now this section records which supporting documents are expected.</p>
              <div className="grid gap-3 md:grid-cols-2">
                {([
                  ["attached_patrol_data_capture_form", "Attached Patrol Data Capture Form"],
                  ["attached_patrol_costing_table", "Attached Patrol Costing Table"],
                  ["attached_seizure_form", "Attached Seizure Form"],
                  ["attached_mcs_outcome_data_compilation_form", "Attached MCS Outcome Data Compilation Form"],
                ] as const).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-3 rounded-xl border border-[var(--line)] bg-[var(--input)] px-3 py-3 text-sm font-bold text-[var(--text)]">
                    <input type="checkbox" checked={Boolean(form[key])} onChange={(e) => updateForm(key, e.target.checked)} />
                    {label}
                  </label>
                ))}
              </div>
              <div className="mt-3 grid gap-2">
                <Label>Attached other</Label>
                <input className={fieldClass()} value={form.attached_other ?? ""} onChange={(e) => updateForm("attached_other", e.target.value)} />
              </div>
            </FormBlock>

            <FormBlock title="9. Prepared by / Mwandishi wa Repoti">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Field label="Prepared by Name / Jina"><input className={fieldClass()} value={form.prepared_by_name_jina ?? ""} onChange={(e) => updateForm("prepared_by_name_jina", e.target.value)} /></Field>
                <Field label="Prepared by Designation / Cheo"><input className={fieldClass()} value={form.prepared_by_designation_cheo ?? ""} onChange={(e) => updateForm("prepared_by_designation_cheo", e.target.value)} /></Field>
                <Field label="Prepared by Signature / Sahihi"><input className={fieldClass()} value={form.prepared_by_signature_sahihi ?? ""} onChange={(e) => updateForm("prepared_by_signature_sahihi", e.target.value)} /></Field>
                <Field label="Prepared by Date / Tarehe ya kuandika repoti"><input type="date" className={fieldClass()} value={form.prepared_by_date_tarehe_ya_kuandika_repoti ?? ""} onChange={(e) => updateForm("prepared_by_date_tarehe_ya_kuandika_repoti", e.target.value)} /></Field>
              </div>
            </FormBlock>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button disabled={saving} onClick={() => void submit()} className="ocean-action inline-flex items-center gap-2 rounded-xl px-4 py-3 font-bold text-slate-950 disabled:opacity-60">
              <Save className="h-4 w-4" /> {saving ? "Saving..." : editing ? "Update report" : "Save BMU Patrol"}
            </button>
            <button onClick={() => { setShowCreate(false); setEditing(null); }} className="rounded-xl border border-[var(--line)] px-4 py-3 font-bold text-[var(--text)]">Cancel</button>
          </div>
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[0.62fr_0.38fr]">
        <div className="ocean-panel rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <Search className="h-5 w-5 text-cyan-500" />
            <input className="w-full bg-transparent text-[var(--text)] outline-none placeholder:text-[var(--muted-text)]" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search BMU Patrol reports" />
          </div>
          <div className="mt-4 overflow-x-auto">
            {filteredReports.length ? (
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="text-xs uppercase tracking-[0.18em] text-[var(--muted-text)]">
                  <tr><th className="px-3 py-3">S/N</th><th className="px-3 py-3">BMU</th><th className="px-3 py-3">Patrol leader</th><th className="px-3 py-3">Date</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Actions</th></tr>
                </thead>
                <tbody>
                  {filteredReports.map((report, index) => (
                    <tr key={report.id} className="border-t border-[var(--line)]">
                      <td className="px-3 py-4 text-[var(--muted-text)]">{String(index + 1).padStart(2, "0")}</td>
                      <td className="px-3 py-4 font-bold text-[var(--text)]">{report.bmu_name_jina_la_patrol_bmu ?? report.bmu_id}</td>
                      <td className="px-3 py-4 text-[var(--text)]">{report.patrol_leader_name}</td>
                      <td className="px-3 py-4 text-[var(--text)]">{report.date_of_patrol_tarehe_ya_patrol}</td>
                      <td className="px-3 py-4"><ComplianceStatusBadge status={report.status} /></td>
                      <td className="space-x-3 px-3 py-4"><button className="font-bold text-cyan-600" onClick={() => void viewDetail(report.id)}>View</button><button className="font-bold text-emerald-600" onClick={() => startEdit(report)}>Edit</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <EmptyState title="No BMU Patrol reports" body="Create the first BMU patrol report. No demo records are shown." />
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
              <div><p className="text-xs uppercase tracking-[0.18em] text-[var(--muted-text)]">BMU</p><p className="font-bold">{detail.report.bmu_name_jina_la_patrol_bmu ?? detail.report.bmu_id}</p></div>
              <div><p className="text-xs uppercase tracking-[0.18em] text-[var(--muted-text)]">Patrol leader</p><p>{detail.report.patrol_leader_name}</p></div>
              <div><p className="text-xs uppercase tracking-[0.18em] text-[var(--muted-text)]">Participants / Washikadau</p><p>{detail.participants.length} row(s)</p></div>
              <div><p className="text-xs uppercase tracking-[0.18em] text-[var(--muted-text)]">Outcomes / Matokeo</p><p>{detail.outcomes.length} row(s)</p></div>
              <div><p className="text-xs uppercase tracking-[0.18em] text-[var(--muted-text)]">Attachments</p><p>{detail.documents.length ? `${detail.documents.length} uploaded document(s)` : "Upload support pending until attachments stage"}</p></div>
              <pre className="max-h-96 overflow-auto rounded-xl bg-[var(--soft)] p-3 text-xs text-[var(--muted-text)]">{JSON.stringify(detail, null, 2)}</pre>
            </div>
          ) : (
            <EmptyState title="Select a record" body="Open a BMU Patrol report to view structured participants, outcomes, document markers, and report details." />
          )}
        </div>
      </div>
    </section>
  );
}

function FormBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--soft)] p-4">
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
