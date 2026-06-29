"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { LoadingState } from "@/components/dashboard/LoadingState";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { createClient, hasSupabaseConfig } from "@/lib/supabase";
import type { RecordStatus } from "@/types/domain";

type Field = { name: string; label: string; type?: "text" | "number" | "textarea"; required?: boolean };
type Row = Record<string, string | number | null> & { id: string; status?: RecordStatus };

type CrudConfig = {
  title: string;
  description: string;
  table: string;
  columns: { key: string; label: string }[];
  fields: Field[];
  statusField?: string;
};

const configs: Record<string, CrudConfig> = {
  fishers: {
    title: "Fishers",
    description: "Real Supabase fisher records with BMU affiliation and membership status.",
    table: "fishers",
    statusField: "membership_status",
    columns: [{ key: "full_name", label: "Name" }, { key: "phone", label: "Phone" }, { key: "membership_status", label: "Status" }, { key: "created_at", label: "Created" }],
    fields: [{ name: "full_name", label: "Full name", required: true }, { name: "phone", label: "Phone" }, { name: "bmu_id", label: "BMU UUID", required: true }, { name: "membership_status", label: "Status", required: true }],
  },
  vessels: {
    title: "Vessels",
    description: "Vessel registration records linked to fisher profiles.",
    table: "vessels",
    columns: [{ key: "vessel_name", label: "Vessel" }, { key: "registration_number", label: "Registration" }, { key: "ownership_type", label: "Ownership" }, { key: "created_at", label: "Created" }],
    fields: [{ name: "vessel_name", label: "Vessel name", required: true }, { name: "registration_number", label: "Registration number" }, { name: "ownership_type", label: "Ownership type" }, { name: "fisher_id", label: "Fisher UUID", required: true }],
  },
  gear: {
    title: "Fishing Gear",
    description: "Fishing gear inventory connected to fisher records.",
    table: "gear_records",
    statusField: "status",
    columns: [{ key: "gear_type", label: "Gear" }, { key: "quantity", label: "Quantity" }, { key: "status", label: "Status" }, { key: "created_at", label: "Created" }],
    fields: [{ name: "gear_type", label: "Gear type", required: true }, { name: "quantity", label: "Quantity", type: "number", required: true }, { name: "fisher_id", label: "Fisher UUID", required: true }, { name: "status", label: "Status", required: true }],
  },
  catches: {
    title: "Catch Records",
    description: "Catch assessment records for landing statistics and validation workflows.",
    table: "catch_records",
    columns: [{ key: "species", label: "Species" }, { key: "weight_kg", label: "Weight KG" }, { key: "landing_site", label: "Landing Site" }, { key: "recorded_at", label: "Recorded" }],
    fields: [{ name: "species", label: "Species", required: true }, { name: "weight_kg", label: "Weight KG", type: "number", required: true }, { name: "landing_site", label: "Landing site", required: true }, { name: "bmu_id", label: "BMU UUID", required: true }, { name: "fisher_id", label: "Fisher UUID" }],
  },

  species: {
    title: "Species Monitoring",
    description: "Real species monitoring records for conservation and fisheries analytics.",
    table: "species_records",
    statusField: "status",
    columns: [{ key: "common_name", label: "Species" }, { key: "scientific_name", label: "Scientific" }, { key: "category", label: "Category" }, { key: "status", label: "Status" }, { key: "created_at", label: "Created" }],
    fields: [{ name: "common_name", label: "Common name", required: true }, { name: "scientific_name", label: "Scientific name" }, { name: "category", label: "Category", required: true }, { name: "status", label: "Status", required: true }],
  },
  compliance: {
    title: "Compliance",
    description: "Inspection, patrol, and enforcement records connected to BMU and officer workflows.",
    table: "compliance_records",
    columns: [{ key: "record_type", label: "Type" }, { key: "finding", label: "Finding" }, { key: "action_taken", label: "Action" }, { key: "created_at", label: "Created" }],
    fields: [{ name: "record_type", label: "Record type", required: true }, { name: "finding", label: "Finding", type: "textarea", required: true }, { name: "action_taken", label: "Action taken" }, { name: "bmu_id", label: "BMU UUID" }, { name: "officer_id", label: "Officer profile UUID" }],
  },
  projects: {
    title: "NGO Projects",
    description: "Real NGO/conservation project monitoring with donor, budget, and impact tracking.",
    table: "ngo_projects",
    columns: [{ key: "title", label: "Project" }, { key: "donor_name", label: "Donor" }, { key: "budget", label: "Budget" }, { key: "impact_score", label: "Impact" }, { key: "created_at", label: "Created" }],
    fields: [{ name: "title", label: "Project title", required: true }, { name: "donor_name", label: "Donor" }, { name: "budget", label: "Budget", type: "number" }, { name: "impact_score", label: "Impact score", type: "number" }],
  },
  beneficiaries: {
    title: "Beneficiaries",
    description: "Real beneficiary records linked to NGO and blue economy programs.",
    table: "beneficiaries",
    statusField: "status",
    columns: [{ key: "name", label: "Name" }, { key: "county", label: "County" }, { key: "status", label: "Status" }, { key: "created_at", label: "Created" }],
    fields: [{ name: "name", label: "Beneficiary name", required: true }, { name: "county", label: "County" }, { name: "project_id", label: "Project UUID" }, { name: "status", label: "Status", required: true }],
  },
  notifications: {
    title: "Notifications",
    description: "Real user notifications for validation, access, reporting, and workflow updates.",
    table: "notifications",
    columns: [{ key: "title", label: "Title" }, { key: "body", label: "Message" }, { key: "read_at", label: "Read At" }, { key: "created_at", label: "Created" }],
    fields: [{ name: "user_id", label: "User profile UUID", required: true }, { name: "title", label: "Title", required: true }, { name: "body", label: "Message", type: "textarea", required: true }],
  },
  "landing-sites": {
    title: "Landing Sites",
    description: "Landing site registry with GIS-ready coordinates.",
    table: "landing_sites",
    statusField: "status",
    columns: [{ key: "name", label: "Site" }, { key: "county", label: "County" }, { key: "latitude", label: "Latitude" }, { key: "longitude", label: "Longitude" }, { key: "status", label: "Status" }],
    fields: [{ name: "name", label: "Site name", required: true }, { name: "county", label: "County", required: true }, { name: "latitude", label: "Latitude", type: "number" }, { name: "longitude", label: "Longitude", type: "number" }, { name: "status", label: "Status", required: true }],
  },
};

function schemaFor(fields: Field[]) {
  const shape: Record<string, z.ZodTypeAny> = {};
  fields.forEach((field) => {
    const base = field.type === "number" ? z.coerce.number() : z.string();
    shape[field.name] = field.required ? base : base.optional().or(z.literal(""));
  });
  return z.object(shape);
}

export function SupabaseCrudPage({ moduleKey }: { moduleKey: keyof typeof configs }) {
  const config = configs[moduleKey];
  const [rows, setRows] = useState<Row[]>([]);
  const [selected, setSelected] = useState<Row | null>(null);
  const [editing, setEditing] = useState<Row | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const form = useForm<Record<string, string | number>>();
  const validation = useMemo(() => schemaFor(config.fields), [config.fields]);

  async function load() {
    setError("");
    if (!hasSupabaseConfig()) { setError("Supabase env variables are missing."); setLoading(false); return; }
    setLoading(true);
    const supabase = createClient();
    const { data, error: loadError } = await supabase.from(config.table).select("*").order("created_at", { ascending: false });
    if (loadError) setError(loadError.message);
    setRows((data ?? []) as Row[]);
    setLoading(false);
  }

  useEffect(() => { void load(); }, [config.table]);

  async function submit(values: Record<string, string | number>) {
    setError(""); setNotice("");
    const parsed = validation.safeParse(values);
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Invalid form."); return; }
    const payload = Object.fromEntries(Object.entries(parsed.data).filter(([, value]) => value !== ""));
    const supabase = createClient();
    const result = editing
      ? await supabase.from(config.table).update(payload).eq("id", editing.id)
      : await supabase.from(config.table).insert(payload);
    if (result.error) { setError(result.error.message); return; }
    form.reset(); setEditing(null); setNotice(editing ? "Record updated." : "Record created.");
    await load();
  }

  async function remove(row: Row) {
    setError(""); setNotice("");
    const supabase = createClient();
    const { error: deleteError } = await supabase.from(config.table).delete().eq("id", row.id);
    if (deleteError) { setError(deleteError.message); return; }
    setNotice("Record deleted."); setSelected(null); await load();
  }

  function startEdit(row: Row) {
    setEditing(row);
    config.fields.forEach((field) => form.setValue(field.name, row[field.name] ?? ""));
  }

  const filtered = rows.filter((row) => JSON.stringify(row).toLowerCase().includes(query.toLowerCase()));

  return (
    <section>
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div><p className="text-sm uppercase tracking-[0.24em] text-cyan-200/70">Supabase module</p><h1 className="mt-2 text-3xl font-bold md:text-5xl">{config.title}</h1><p className="mt-3 max-w-3xl text-slate-400">{config.description}</p></div><button onClick={() => { setEditing(null); form.reset(); }} className="rounded-xl bg-cyan-300 px-4 py-2 font-bold text-slate-950">New record</button></div>
      <div className="mt-6 grid gap-4 xl:grid-cols-[0.68fr_0.32fr]">
        <div>
          <input value={query} onChange={(event)=>setQuery(event.target.value)} placeholder="Search/filter real Supabase records" className="mb-4 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none placeholder:text-slate-500" />
          {loading ? <LoadingState /> : error && !rows.length ? <EmptyState title="Cannot load records" body={error} /> : filtered.length ? <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/45"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-white/[0.04] text-xs uppercase tracking-[0.2em] text-slate-400"><tr>{config.columns.map((column)=><th key={column.key} className="px-4 py-4">{column.label}</th>)}<th className="px-4 py-4">Actions</th></tr></thead><tbody>{filtered.map((row)=><tr key={row.id} className="border-t border-white/10 text-slate-200"><>{config.columns.map((column)=>{ const value=row[column.key]; return <td key={column.key} className="px-4 py-4">{column.key === config.statusField && typeof value === "string" ? <StatusBadge status={value as RecordStatus} /> : String(value ?? "-")}</td>; })}</><td className="space-x-2 px-4 py-4"><button onClick={()=>setSelected(row)} className="text-cyan-200">View</button><button onClick={()=>startEdit(row)} className="text-emerald-200">Edit</button><button onClick={()=>void remove(row)} className="text-rose-200">Delete</button></td></tr>)}</tbody></table></div> : <EmptyState title="No records" body="Create the first record or adjust filters." />}
        </div>
        <div className="grid gap-4">
          <form onSubmit={form.handleSubmit((values)=>void submit(values))} className="rounded-2xl border border-white/10 bg-slate-950/45 p-5"><h3 className="font-bold text-white">{editing ? "Edit record" : "Create record"}</h3><div className="mt-4 grid gap-3">{config.fields.map((field)=> field.type === "textarea" ? <textarea key={field.name} {...form.register(field.name)} placeholder={field.label} className="min-h-24 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 outline-none" /> : <input key={field.name} {...form.register(field.name)} type={field.type ?? "text"} placeholder={field.label} className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 outline-none" />)}<button className="rounded-xl bg-cyan-300 px-3 py-2 font-bold text-slate-950">{editing ? "Update" : "Create"}</button>{notice && <p className="text-sm text-emerald-200">{notice}</p>}{error && <p className="text-sm text-rose-200">{error}</p>}</div></form>
          {selected && <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-5"><h3 className="font-bold text-white">Detail view</h3><pre className="mt-4 max-h-80 overflow-auto whitespace-pre-wrap text-xs text-slate-300">{JSON.stringify(selected, null, 2)}</pre></div>}
        </div>
      </div>
    </section>
  );
}
