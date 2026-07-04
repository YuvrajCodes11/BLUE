"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  ArrowRight,
  Bell,
  CheckCircle2,
  Database,
  FileText,
  Landmark,
  Lock,
  Map,
  Search,
  Settings,
  ShieldCheck,
} from "lucide-react";
import type { PlatformModule, Role } from "@/types/blue";

const modules: PlatformModule[] = [
  {
    title: "Registration",
    body: "BMU managers create and maintain fisher, vessel, certificate, and membership records.",
    accent: "from-cyan-400 to-blue-500",
  },
  {
    title: "Compliance",
    body: "Rangers and BMUs record patrols, inspections, compliance forms, evidence, and follow-up status.",
    accent: "from-emerald-400 to-cyan-500",
  },
  {
    title: "Revenue",
    body: "Membership fees, vessel renewals, BLUE service fees, expenditure, receipts, and ledger views.",
    accent: "from-amber-300 to-orange-500",
  },
  {
    title: "Monitoring",
    body: "County, KeFS, NGO, and donor users view role-filtered progress, outputs, KPIs, and reports.",
    accent: "from-blue-500 to-indigo-500",
  },
];

const roles: Role[] = [
  "KFS Officer",
  "County Officer",
  "BMU Manager",
  "Ranger",
  "NGO Program Manager",
  "Donor",
  "Fisher",
];

const publicRoleLabel: Partial<Record<Role, string>> = {
  "KFS Officer": "KeFS Officer",
};

const workflowSteps = [
  ["Request access", "Users request access with role, organization, county, and location context."],
  ["Admin approval", "The platform owner approves the request and assigns the correct role."],
  ["Operational entry", "Authorized users create records through validated forms and scoped dashboards."],
  ["Review and export", "Teams filter, review, export, and use records for decisions and reporting."],
];

const oceanImages = {
  whale: "https://images.unsplash.com/photo-1568430462989-44163eb1752f?auto=format&fit=crop&w=1800&q=85",
  surface: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=85",
  coast: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=85",
  reef: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1600&q=85",
};

function ProductPreview() {
  const bars = [58, 72, 45, 82, 64, 76];

  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-3 shadow-2xl shadow-slate-200/80">
      <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-50">
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-cyan-400" />
            <span className="h-3 w-3 rounded-full bg-blue-300" />
            <span className="h-3 w-3 rounded-full bg-emerald-300" />
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-500 sm:flex">
            <Search className="h-3.5 w-3.5" />
            Search records
          </div>
        </div>
        <div className="grid min-h-[520px] lg:grid-cols-[220px_1fr]">
          <aside className="hidden border-r border-slate-200 bg-[#073a5a] p-4 text-white lg:block">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-300 font-bold text-slate-950">B</span>
              <div>
                <div className="font-bold">BLUE</div>
                <div className="text-xs text-cyan-100/70">BMU workspace</div>
              </div>
            </div>
            <div className="mt-8 space-y-2 text-sm">
              {["Dashboard", "Fishers", "Vessels", "Compliance", "Reports", "Settings"].map((item, index) => (
                <div key={item} className={`rounded-xl px-3 py-2 ${index === 0 ? "bg-white text-slate-950" : "text-cyan-50/78"}`}>
                  {item}
                </div>
              ))}
            </div>
          </aside>
          <div className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-700">Operational dashboard</p>
                <h3 className="mt-2 text-2xl font-bold text-slate-950">Real records, clear decisions</h3>
              </div>
              <div className="flex items-center gap-2">
                <button className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600" aria-label="Notifications">
                  <Bell className="h-4 w-4" />
                </button>
                <button className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600" aria-label="Settings">
                  <Settings className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                ["Fishers", "Live"],
                ["Vessels", "Verified"],
                ["Requests", "Pending"],
                ["Reports", "Exports"],
              ].map(([label, sub]) => (
                <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{sub}</div>
                  <div className="mt-3 text-lg font-bold text-slate-950">{label}</div>
                </div>
              ))}
            </div>
            <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_0.9fr]">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-950">Activity trend</div>
                  <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">Live data</span>
                </div>
                <div className="mt-8 flex h-36 items-end gap-3">
                  {bars.map((height, index) => (
                    <div key={String(index)} className="flex flex-1 items-end rounded-t-xl bg-slate-100">
                      <span className="w-full rounded-t-xl bg-gradient-to-t from-cyan-500 to-blue-400" style={{ height: `${height}%` }} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="font-bold text-slate-950">Review queue</div>
                <div className="mt-4 space-y-3">
                  {["Certificate verification", "Compliance form", "Meeting minutes"].map((item) => (
                    <div key={item} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-3">
                      <span className="text-sm font-medium text-slate-700">{item}</span>
                      <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">Review</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function OceanPhotoPanel({
  image,
  eyebrow,
  title,
  body,
  tall = false,
}: {
  image: string;
  eyebrow: string;
  title: string;
  body: string;
  tall?: boolean;
}) {
  return (
    <div className={`group relative overflow-hidden rounded-[2rem] border border-cyan-200/70 bg-slate-950 shadow-xl shadow-cyan-100/60 ${tall ? "min-h-[520px]" : "min-h-[340px]"}`}>
      <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]" />
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950/72 via-slate-950/28 to-cyan-700/10" />
      <div className="absolute inset-x-0 bottom-0 p-6 text-white md:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.26em] text-cyan-100">{eyebrow}</p>
        <h3 className="mt-3 max-w-xl font-display text-3xl font-bold tracking-[-0.03em] md:text-5xl">{title}</h3>
        <p className="mt-4 max-w-lg leading-7 text-cyan-50/82">{body}</p>
      </div>
    </div>
  );
}

function InterfaceCard({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Database;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-cyan-50 text-cyan-700">
          <Icon className="h-5 w-5" />
        </span>
        <h3 className="text-xl font-bold text-slate-950">{title}</h3>
      </div>
      <div className="mt-5">{children}</div>
    </div>
  );
}

export default function BlueExperience() {
  const [activeRole, setActiveRole] = useState<Role>("BMU Manager");

  const roleCopy = useMemo(() => {
    const map: Record<Role, string> = {
      "Government Admin": "National audit visibility, user governance, cross-county oversight, platform settings, and executive reporting.",
      "KFS Officer": "Fisheries oversight, inspection history, landing site data, species trends, and compliance escalation.",
      "County Officer": "County-wide BMU performance, records review, operational monitoring, and exportable reports.",
      "BMU Manager": "Fisher profiles, vessels, fees, receipts, meetings, minutes, documents, compliance, and local operations.",
      Ranger: "Patrol logs, compliance checks, evidence uploads, field activity records, and incident follow-up.",
      "NGO Program Manager": "Projects, beneficiaries, activities, budgets, outputs, and field evidence aligned to donor KPIs.",
      Donor: "Read-only project performance, funding outcomes, beneficiary reach, evidence packs, and impact summaries.",
      Fisher: "Profile, membership status, QR identity, documents, receipts, and community-related records.",
    };
    return map[activeRole];
  }, [activeRole]);

  return (
    <main className="min-h-screen overflow-hidden bg-[#f6fbff] text-slate-950">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_15%_0%,rgba(34,211,238,0.20),transparent_32rem),radial-gradient(circle_at_88%_8%,rgba(14,165,233,0.16),transparent_30rem),linear-gradient(180deg,#f8fdff_0%,#eef8fc_52%,#ffffff_100%)]" />

      <nav className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/86 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-8">
          <a href="#hero" className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-cyan-300 font-display text-lg font-bold text-slate-950 shadow-lg shadow-cyan-200/60">B</span>
            <div>
              <div className="font-display text-lg font-bold tracking-tight text-slate-950">BLUE</div>
              <div className="hidden text-xs font-medium text-slate-500 sm:block">Livelihoods unified ecosystem</div>
            </div>
          </a>
          <div className="hidden items-center gap-7 text-sm font-semibold text-slate-600 lg:flex">
            {["Platform", "Security", "Workflows", "Roles", "Pricing"].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="hover:text-slate-950">
                {item}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <a href="/login" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm hover:border-cyan-300 hover:text-slate-950">
              Login
            </a>
            <a href="/request-access" className="rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-slate-300/60 hover:-translate-y-0.5 hover:bg-cyan-700">
              Request access
            </a>
          </div>
        </div>
      </nav>

      <section id="hero" className="relative isolate overflow-hidden px-5 py-20 md:px-8 md:py-28">
        <div className="enterprise-ocean-video-bg" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.82fr_1.18fr]">
          <div className="relative z-10">
            <div className="inline-flex rounded-full border border-cyan-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-cyan-700 shadow-sm">
              Blue Economy Livelihoods Unified Ecosystem
            </div>
            <h1 className="mt-7 max-w-4xl font-display text-5xl font-bold leading-[0.98] tracking-[-0.045em] text-slate-950 md:text-7xl">
              Enterprise software for fisheries governance and BMU operations.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 md:text-xl">
              BLUE gives government teams, counties, BMUs, rangers, NGOs, donors, and communities one secure platform for records, compliance, payments, reporting, and decision-making.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <a href="/request-access" className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-6 py-3 font-bold text-white shadow-xl shadow-slate-300/70 hover:-translate-y-0.5 hover:bg-cyan-700">
                Request access <ArrowRight className="h-4 w-4" />
              </a>
              <a href="/login" className="rounded-full border border-slate-200 bg-white px-6 py-3 font-bold text-slate-800 shadow-sm hover:border-cyan-300">
                Login
              </a>
            </div>
            <div className="mt-9 grid max-w-2xl gap-3 sm:grid-cols-3">
              {["Supabase Auth + RLS", "Role dashboards", "Export-ready reports"].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                  <CheckCircle2 className="h-4 w-4 text-cyan-600" />
                  {item}
                </div>
              ))}
            </div>
          </div>
          <ProductPreview />
        </div>
      </section>

      <section className="px-5 py-10 md:px-8">
        <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[1.18fr_0.82fr]">
          <OceanPhotoPanel
            image={oceanImages.whale}
            eyebrow="Blue planet context"
            title="Built for the people protecting coastal livelihoods."
            body="BLUE keeps the product practical, but its visual identity stays connected to fisheries, conservation, and the living ocean."
            tall
          />
          <div className="grid gap-5">
            <OceanPhotoPanel
              image={oceanImages.surface}
              eyebrow="Marine records"
              title="From field activity to usable data."
              body="Operational records become easier to store, verify, search, and report."
            />
            <OceanPhotoPanel
              image={oceanImages.coast}
              eyebrow="Community operations"
              title="Designed for BMU workflows."
              body="Members, vessels, payments, documents, meetings, and compliance stay in one place."
            />
          </div>
        </div>
      </section>

      <section id="platform" className="px-5 py-16 md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.26em] text-cyan-700">Platform modules</p>
            <h2 className="mt-4 font-display text-4xl font-bold tracking-[-0.035em] text-slate-950 md:text-6xl">
              Built around the work teams actually do.
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              The interface is practical, permission-aware, and connected to real operational data instead of static dashboard decoration.
            </p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {modules.map((module) => (
              <article key={module.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/70 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/80">
                <div className={`mb-8 h-1.5 w-20 rounded-full bg-gradient-to-r ${module.accent}`} />
                <h3 className="text-xl font-bold text-slate-950">{module.title}</h3>
                <p className="mt-4 leading-7 text-slate-600">{module.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-10 md:px-8">
        <div className="mx-auto grid max-w-7xl items-center gap-8 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70 md:p-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="relative min-h-[390px] overflow-hidden rounded-[1.5rem]">
            <img src={oceanImages.reef} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-tr from-slate-950/64 via-transparent to-cyan-200/20" />
            <div className="absolute bottom-5 left-5 rounded-2xl bg-white/92 p-4 shadow-xl backdrop-blur">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-700">Conservation layer</p>
              <p className="mt-1 max-w-xs text-sm font-semibold text-slate-800">Records, evidence, compliance, and reporting aligned around real marine work.</p>
            </div>
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.26em] text-cyan-700">Not just a database</p>
            <h2 className="mt-4 font-display text-4xl font-bold tracking-[-0.035em] text-slate-950 md:text-5xl">
              A cleaner operating system for coastal decisions.
            </h2>
            <p className="mt-5 leading-8 text-slate-600">
              The landing page now carries real ocean imagery while the application message stays clear: BLUE is built to reduce paperwork, protect records, and help teams act faster.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {["BMU records", "Revenue ledger", "Compliance logs", "Export-ready reports"].map((item) => (
                <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 font-bold text-slate-700">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="security" className="px-5 py-16 md:px-8">
        <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-3">
          <InterfaceCard icon={Lock} title="Access control">
            <p className="leading-7 text-slate-600">Users enter through request access, admin approval, Supabase Auth, and role-based routing.</p>
            <div className="mt-5 space-y-2">
              {["Approved users only", "Role dashboard redirects", "Protected routes"].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  {item}
                </div>
              ))}
            </div>
          </InterfaceCard>
          <InterfaceCard icon={Database} title="Real database layer">
            <p className="leading-7 text-slate-600">Supabase PostgreSQL stores operational records, requests, BMUs, landing sites, reports, and audit data.</p>
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 font-mono text-xs text-slate-500">
              profiles / access_requests / bmus / fishers / vessels / catch_records
            </div>
          </InterfaceCard>
          <InterfaceCard icon={ShieldCheck} title="Data boundaries">
            <p className="leading-7 text-slate-600">RLS policies and scoped UI prevent users from seeing operational data outside their role and assigned workspace.</p>
            <div className="mt-5 rounded-2xl bg-cyan-50 p-4 text-sm font-semibold text-cyan-800">Designed for government, NGO, donor, and BMU trust.</div>
          </InterfaceCard>
        </div>
      </section>

      <section id="workflows" className="px-5 py-16 md:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/70 md:p-8 lg:grid-cols-[0.82fr_1.18fr]">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.26em] text-cyan-700">Workflow design</p>
            <h2 className="mt-4 font-display text-4xl font-bold tracking-[-0.035em] text-slate-950 md:text-5xl">
              From request to report without paper-heavy handoffs.
            </h2>
            <p className="mt-5 leading-8 text-slate-600">
              BLUE is structured to reduce repeated entry, centralize documents, and make records searchable for future decisions.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {workflowSteps.map(([title, body], index) => (
              <div key={title} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-sm font-bold text-cyan-700 shadow-sm">{index + 1}</div>
                <h3 className="mt-5 text-lg font-bold text-slate-950">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-16 md:px-8">
        <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/70">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-50 text-blue-700">
                <Map className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.22em] text-cyan-700">GIS preview</p>
                <h3 className="text-xl font-bold text-slate-950">Landing sites and zones</h3>
              </div>
            </div>
            <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-3 shadow-inner shadow-cyan-50">
              <div className="gis-preview relative min-h-[340px] overflow-hidden rounded-[1.35rem] border border-cyan-100">
                <div className="gis-scan" aria-hidden="true" />
                <svg className="absolute inset-0 h-full w-full" viewBox="0 0 640 340" role="img" aria-label="Animated landing-site and marine-zone GIS preview">
                  <path className="gis-coast" d="M-20 224 C70 180 130 194 196 142 C262 88 318 126 372 91 C446 42 520 84 660 34" />
                  <path className="gis-zone" d="M52 250 C142 182 214 230 290 156 C373 74 448 136 576 92" />
                  <path className="gis-route gis-route-a" d="M122 235 C192 180 264 171 341 142 C418 113 471 94 538 64" />
                  <path className="gis-route gis-route-b" d="M173 264 C231 235 287 220 350 187 C425 148 485 157 570 129" />
                  <path className="gis-boundary" d="M84 78 H560 V282 H84 Z" />
                </svg>
                {[
                  ["BMU", "left-[17%] top-[61%]", "bg-emerald-400", "0s"],
                  ["Landing", "left-[43%] top-[38%]", "bg-cyan-400", "-0.7s"],
                  ["Patrol", "left-[63%] top-[52%]", "bg-blue-400", "-1.4s"],
                  ["Zone", "left-[78%] top-[27%]", "bg-indigo-400", "-2.1s"],
                ].map(([label, position, color, delay]) => (
                  <div key={label} className={`gis-marker absolute ${position}`} style={{ animationDelay: delay }}>
                    <span className={`block h-3.5 w-3.5 rounded-full ${color} shadow-lg shadow-cyan-300/50 ring-4 ring-white`} />
                    <span className="mt-2 block rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold text-slate-700 shadow-sm">{label}</span>
                  </div>
                ))}
                <div className="absolute bottom-4 left-4 right-4 grid gap-2 sm:grid-cols-3">
                  {["Landing sites", "Patrol path", "Marine zone"].map((item) => (
                    <div key={item} className="rounded-2xl border border-white/70 bg-white/84 px-3 py-2 text-xs font-bold text-slate-700 shadow-sm backdrop-blur">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="rounded-[2rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-sm shadow-slate-200/70">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-cyan-300 text-slate-950">
                <FileText className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.22em] text-cyan-200">Records and reports</p>
                <h3 className="text-xl font-bold">Every record has a purpose</h3>
              </div>
            </div>
            <div className="mt-6 space-y-3">
              {["Auto serial numbers", "Certificate upload", "Revenue and expenditure", "PDF and CSV export"].map((item) => (
                <div key={item} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3">
                  <span className="font-semibold text-cyan-50">{item}</span>
                  <CheckCircle2 className="h-4 w-4 text-cyan-300" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="roles" className="px-5 py-16 md:px-8">
        <div className="mx-auto max-w-7xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/70 md:p-8">
          <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.26em] text-cyan-700">Role ecosystem</p>
              <h2 className="mt-4 font-display text-4xl font-bold tracking-[-0.035em] text-slate-950 md:text-5xl">
                Distinct dashboards. One shared source of truth.
              </h2>
              <p className="mt-5 leading-8 text-slate-600">{roleCopy}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {roles.map((role) => (
                <button
                  key={role}
                  onClick={() => setActiveRole(role)}
                  className={`rounded-2xl border p-4 text-left font-bold ${
                    activeRole === role
                      ? "border-cyan-300 bg-cyan-50 text-cyan-800 shadow-sm"
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:border-cyan-200 hover:bg-white"
                  }`}
                >
                  {publicRoleLabel[role] ?? role}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="px-5 py-16 md:px-8">
        <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[1fr_0.75fr]">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/70">
            <p className="text-sm font-bold uppercase tracking-[0.26em] text-cyan-700">Delivery scope</p>
            <h2 className="mt-4 font-display text-4xl font-bold tracking-[-0.035em] text-slate-950 md:text-5xl">Production-ready core in one month.</h2>
            <p className="mt-5 leading-8 text-slate-600">
              The current scope focuses on web-based access, role dashboards, Supabase-connected records, access approval, BMU operations, compliance, meetings, revenue, documents, reports, and clean administration.
            </p>
          </div>
          <div className="rounded-[2rem] border border-cyan-200 bg-cyan-50 p-8">
            <div className="text-sm font-bold uppercase tracking-[0.26em] text-cyan-700">Built with</div>
            <div className="mt-5 grid gap-3">
              {["Next.js + React", "TypeScript + Tailwind", "Supabase Auth + PostgreSQL", "RLS permissions", "Vercel deployment"].map((item) => (
                <div key={item} className="flex items-center gap-3 font-semibold text-slate-800">
                  <CheckCircle2 className="h-4 w-4 text-cyan-700" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="px-5 py-20 md:px-8">
        <div className="mx-auto max-w-5xl rounded-[2rem] bg-slate-950 p-8 text-center text-white shadow-2xl shadow-slate-300/70 md:p-12">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-cyan-300 text-slate-950">
            <Landmark className="h-6 w-6" />
          </div>
          <h2 className="mx-auto mt-6 max-w-3xl font-display text-4xl font-bold tracking-[-0.035em] md:text-6xl">
            Serious software for coastal operations.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl leading-8 text-cyan-50/72">
            BLUE is designed to replace paper-heavy processes with structured records, secure access, and decisions backed by live operational data.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <a href="/request-access" className="inline-flex items-center gap-2 rounded-full bg-cyan-300 px-6 py-3 font-bold text-slate-950 hover:-translate-y-0.5">
              Request access <ArrowRight className="h-4 w-4" />
            </a>
            <a href="/login" className="rounded-full border border-white/15 px-6 py-3 font-bold text-white hover:border-cyan-200/70 hover:bg-white/10">
              Login
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white px-5 py-10 text-center text-sm text-slate-500 md:px-8">
        BLUE — Blue Economy Livelihoods Unified Ecosystem. Built with Next.js, React, TypeScript, Tailwind CSS, Supabase, and Vercel.
      </footer>
    </main>
  );
}
