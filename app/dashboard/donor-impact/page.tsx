"use client";

import { Award, CheckCircle2, DollarSign, HeartHandshake, ShieldCheck, TrendingUp, Users } from "lucide-react";
import { ChartCard } from "@/components/dashboard/ChartCard";

const donorKpis = [
  { label: "Total Committed Funding", value: "KES 35.5M", change: "+24%", icon: DollarSign, tone: "text-cyan-400" },
  { label: "Artisanal Fishers Supported", value: "2,840", change: "+18%", icon: Users, tone: "text-emerald-400" },
  { label: "Hectares Protected Marine Area", value: "1,450 ha", change: "100%", icon: ShieldCheck, tone: "text-violet-400" },
  { label: "Community Grants Delivered", value: "48 Groups", change: "+12", icon: Award, tone: "text-amber-400" },
];

const milestoneTracks = [
  {
    title: "Kilifi Creek Solar Cold Chain Installation",
    donor: "Global Ocean Fund",
    progress: 100,
    status: "Completed",
    notes: "3 solar chillers operational, reducing post-harvest fish spoilage by 65%.",
  },
  {
    title: "Diani Coral Reef Community Restoration Project",
    donor: "Blue Coast Trust",
    progress: 82,
    status: "On Schedule",
    notes: "12,000 coral fragments transplanted across 18 reef structures by local youth rangers.",
  },
  {
    title: "Women Fish Traders Micro-Enterprise Credit",
    donor: "Kenya Climate Foundation",
    progress: 94,
    status: "Active",
    notes: "KES 8.4M disbursed with 98.6% repayment rate and 310 women enterprise beneficiaries.",
  },
  {
    title: "Digital Catch Validation & Biometric QR System",
    donor: "Ocean Futures Initiative",
    progress: 90,
    status: "Scaling",
    notes: "Rolled out across Kilifi, Kwale, and Mombasa landing sites.",
  },
];

export default function Page() {
  return (
    <section className="grid gap-6">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-500">Program Outcomes</p>
        <h1 className="mt-2 text-3xl font-black text-[var(--text)] md:text-5xl">Donor Impact & Outcomes</h1>
        <p className="mt-2 max-w-3xl text-sm text-[var(--muted-text)]">
          Real-time measurement of conservation grants, community livelihoods, and sustainable blue economy impact.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {donorKpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="ocean-panel rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--muted-text)]">{kpi.label}</span>
                <Icon className={`h-5 w-5 ${kpi.tone}`} />
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <p className="text-2xl font-black text-[var(--text)]">{kpi.value}</p>
                <span className="flex items-center text-xs font-black text-emerald-500">
                  <TrendingUp className="mr-0.5 h-3 w-3" /> {kpi.change}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="Livelihood & Sustainability ROI" />

        <div className="ocean-panel rounded-2xl p-5 shadow-md">
          <div className="flex items-center justify-between border-b border-[var(--line)]/60 pb-3">
            <h3 className="text-base font-black text-[var(--text)]">Milestone Delivery & Evidence</h3>
            <span className="rounded-full bg-emerald-400/15 border border-emerald-400/30 px-2.5 py-0.5 text-xs font-bold text-emerald-500">
              4 Live Programs
            </span>
          </div>

          <div className="mt-4 grid gap-3">
            {milestoneTracks.map((m) => (
              <div key={m.title} className="rounded-xl border border-[var(--line)] bg-[var(--soft)]/70 p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-black text-[var(--text)]">{m.title}</h4>
                    <p className="text-xs font-semibold text-cyan-500">{m.donor}</p>
                  </div>
                  <span className="rounded-full bg-cyan-400/15 border border-cyan-400/30 px-2 py-0.5 text-[10px] font-bold text-cyan-400">
                    {m.status}
                  </span>
                </div>
                <p className="mt-2 text-xs text-[var(--muted-text)]">{m.notes}</p>
                <div className="mt-3 flex items-center gap-3">
                  <div className="h-2 flex-1 rounded-full bg-[var(--line)] overflow-hidden">
                    <div
                      style={{ width: `${m.progress}%` }}
                      className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400"
                    />
                  </div>
                  <span className="font-mono text-xs font-bold text-[var(--text)]">{m.progress}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
