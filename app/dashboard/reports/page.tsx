"use client";

import { useState } from "react";
import { Download, FileText, Filter, CheckCircle2 } from "lucide-react";
import { ChartCard } from "@/components/dashboard/ChartCard";

const reportArchives = [
  {
    id: "rep-2026-10",
    title: "October 2026 Coastal Catch & Landing Assessment",
    type: "Monthly Catch Analytics",
    size: "2.4 MB",
    generated: "2026-10-23",
    status: "Validated",
  },
  {
    id: "rep-2026-q3",
    title: "Q3 2026 Marine Compliance & MCS Patrol Summary",
    type: "Compliance & Enforcement",
    size: "4.1 MB",
    generated: "2026-10-01",
    status: "Published",
  },
  {
    id: "rep-2026-bmu",
    title: "BMU Revenue Sharing & Landing Dues Audit",
    type: "Financial & Revenue",
    size: "1.8 MB",
    generated: "2026-09-30",
    status: "Audited",
  },
  {
    id: "rep-2026-sp",
    title: "Kenya Coast Yellowfin & Reef Species Population Trend",
    type: "Ecological Monitoring",
    size: "3.2 MB",
    generated: "2026-09-15",
    status: "Published",
  },
];

import { exportToCsv, exportOfficialPdfReport } from "@/lib/export-utils";

export default function Page() {
  const [downloadNotice, setDownloadNotice] = useState("");

  function triggerDownload(title: string, format: "CSV" | "PDF") {
    setDownloadNotice(`Generating and downloading ${title} (${format})...`);

    if (format === "CSV") {
      const sampleCatchData = [
        { month: "May 2026", landing_site: "Kilifi Creek BMU", species: "Yellowfin Tuna", weight_kg: 42800, gross_kes: 4280000, active_vessels: 42 },
        { month: "Jun 2026", landing_site: "Watamu Beach", species: "Kingfish / Nguru", weight_kg: 51200, gross_kes: 5632000, active_vessels: 48 },
        { month: "Jul 2026", landing_site: "Diani Reef Jetty", species: "Snapper & Reef Species", weight_kg: 68400, gross_kes: 7182000, active_vessels: 54 },
        { month: "Aug 2026", landing_site: "Shimoni Station", species: "Sailfish / Sansuli", weight_kg: 62100, gross_kes: 6831000, active_vessels: 50 },
        { month: "Sep 2026", landing_site: "Ngomeni Inshore", species: "Prawns & Inshore Mix", weight_kg: 78500, gross_kes: 8635000, active_vessels: 60 },
        { month: "Oct 2026", landing_site: "Kilifi Creek BMU", species: "Pelagic & Mixed Catch", weight_kg: 92300, gross_kes: 10153000, active_vessels: 65 },
      ];
      exportToCsv(`${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`, sampleCatchData);
    } else {
      exportOfficialPdfReport({
        filename: `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.html`,
        title,
        category: "Fisheries Governance & Blue Economy Analytics",
        summary: `Official certified report published by the State Department for Blue Economy & Fisheries, summarizing landing activities, compliance observations, and community livelihood indicators across the Kenyan Coastline.`,
        metadata: [
          { label: "Reporting Period", value: "2026 Fiscal Year · Q1-Q3" },
          { label: "Regulatory Framework", value: "Fisheries Management & Development Act" },
          { label: "Lead Enforcement Body", value: "Kenya Fisheries Service (KeFS) MCS Unit" },
          { label: "Data Verification Status", value: "Verified & Gazetted" },
        ],
        tables: [
          {
            title: "Summary Landings by BMU Cluster",
            headers: ["Landing Site / BMU", "Key Species", "Volume (MT)", "Value (KES)"],
            rows: [
              ["Kilifi Creek BMU", "Yellowfin Tuna & Pelagic", "92.3 MT", "10,153,000"],
              ["Watamu Reserve Area", "Reef Fish & Snapper", "51.2 MT", "5,632,000"],
              ["Diani Reef Station", "Kingfish & Trevally", "68.4 MT", "7,182,000"],
              ["Shimoni Wasini Channel", "Deep Sea Pelagics", "62.1 MT", "6,831,000"],
            ],
          },
        ],
      });
    }

    setTimeout(() => {
      setDownloadNotice(`✓ ${title} (${format}) downloaded successfully.`);
      setTimeout(() => setDownloadNotice(""), 4000);
    }, 600);
  }

  return (
    <section className="grid gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-500">Analytics & Governance</p>
          <h1 className="mt-2 text-2xl font-black text-[var(--text)] sm:text-4xl md:text-5xl">Official Reports & Exports</h1>
          <p className="mt-3 max-w-3xl text-sm text-[var(--muted-text)]">
            Verified fisheries reports, catch quota data, patrol compliance summaries, and donor export files.
          </p>
        </div>
        <div className="w-full sm:w-auto">
          <button
            onClick={() => triggerDownload("Complete BLUE Platform Summary", "PDF")}
            className="ocean-action inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-slate-950 shadow-md transition active:scale-95"
          >
            <Download className="h-4 w-4" /> Export All Data (CSV/PDF)
          </button>
        </div>
      </div>

      {downloadNotice && (
        <div className="rounded-2xl border border-cyan-400/40 bg-cyan-400/10 p-4 text-sm font-bold text-cyan-500 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-cyan-400" />
          {downloadNotice}
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="Monthly Catch Volume & Fleet Activity" />
        <ChartCard title="Species Composition & Landings Trend" />
      </div>

      <div className="ocean-panel rounded-2xl p-4 sm:p-5 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)]/60 pb-4">
          <div>
            <h2 className="text-base sm:text-lg font-black text-[var(--text)]">Published Report Archive</h2>
            <p className="text-xs text-[var(--muted-text)]">All reports verified by County Fisheries and KeFS Officers.</p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1 rounded-xl border border-[var(--line)] bg-[var(--soft)] px-3 py-1.5 font-bold text-[var(--text)]">
              <Filter className="h-3 w-3 text-cyan-400" /> Filter: 2026 Fiscal Year
            </span>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto rounded-xl border border-[var(--line)]/60">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--line)]/60 text-xs uppercase tracking-[0.18em] text-[var(--muted-text)]">
                <th className="px-3 py-3">Report Title</th>
                <th className="px-3 py-3">Category</th>
                <th className="px-3 py-3">File Size</th>
                <th className="px-3 py-3">Date</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3 text-right">Download</th>
              </tr>
            </thead>
            <tbody>
              {reportArchives.map((rep) => (
                <tr key={rep.id} className="border-b border-[var(--line)]/40 transition hover:bg-[var(--soft)]/60">
                  <td className="px-3 py-4 font-bold text-[var(--text)]">
                    <div className="flex items-center gap-2.5">
                      <FileText className="h-4 w-4 text-cyan-400 shrink-0" />
                      <span>{rep.title}</span>
                    </div>
                  </td>
                  <td className="px-3 py-4 text-xs font-semibold text-[var(--muted-text)]">{rep.type}</td>
                  <td className="px-3 py-4 font-mono text-xs">{rep.size}</td>
                  <td className="px-3 py-4 text-xs">{rep.generated}</td>
                  <td className="px-3 py-4">
                    <span className="rounded-full bg-emerald-400/15 border border-emerald-400/30 px-2 py-0.5 text-[10px] font-bold text-emerald-500">
                      {rep.status}
                    </span>
                  </td>
                  <td className="px-3 py-4 text-right space-x-2">
                    <button
                      onClick={() => triggerDownload(rep.title, "PDF")}
                      className="rounded-lg border border-[var(--line)] bg-[var(--soft)] px-2.5 py-1 text-xs font-bold text-cyan-400 hover:border-cyan-400/60"
                    >
                      PDF
                    </button>
                    <button
                      onClick={() => triggerDownload(rep.title, "CSV")}
                      className="rounded-lg border border-[var(--line)] bg-[var(--soft)] px-2.5 py-1 text-xs font-bold text-emerald-400 hover:border-emerald-400/60"
                    >
                      CSV
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
