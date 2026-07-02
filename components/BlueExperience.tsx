"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { Leva } from "leva";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Anchor,
  BarChart3,
  CircleDollarSign,
  Fish,
  Globe2,
  Landmark,
  Leaf,
  Lock,
  Map,
  RadioTower,
  ShieldCheck,
  UsersRound,
  Waves,
} from "lucide-react";
import type { PlatformModule, Role } from "@/types/blue";

const OceanScene = dynamic(() => import("@/components/OceanScene"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse rounded-[2rem] bg-cyan-300/10" />,
});

const capabilities = [
  { title: "Fisher records", body: "Profiles, memberships, QR verification, documents, and BMU-managed registration workflows." },
  { title: "Operational data", body: "Vessels, gear, catch records, species monitoring, landing sites, and compliance records." },
  { title: "Revenue workflows", body: "BMU fees, BLUE service fees, renewals, payment confirmation, and receipt records." },
  { title: "Governance reporting", body: "Role-scoped dashboards, reports, audit visibility, and donor-ready monitoring views." },
];

const modules: PlatformModule[] = [
  { title: "Fisheries Command", body: "BMU, vessel, gear, catch, landing site, compliance, and species records in one operating layer.", accent: "from-cyan-300 to-blue-500" },
  { title: "Marine Conservation", body: "Protected areas, patrol evidence, biodiversity observations, threat events, and response workflows.", accent: "from-emerald-300 to-cyan-500" },
  { title: "NGO & Donor OS", body: "Projects, beneficiaries, outputs, KPIs, field evidence, disbursement progress, and board-ready reporting.", accent: "from-violet-300 to-cyan-400" },
  { title: "Governance Intelligence", body: "County, national, and KFS users see the right data through RLS-backed permissions and role analytics.", accent: "from-blue-300 to-indigo-500" },
];

const roles: Role[] = [
  "Government Admin",
  "KFS Officer",
  "County Officer",
  "BMU Manager",
  "Ranger",
  "NGO Program Manager",
  "Donor",
  "Fisher",
];

const workflowSignals = [
  "Catch records",
  "Species monitoring",
  "Compliance follow-up",
  "Donor evidence",
];

export default function BlueExperience() {
  const [activeRole, setActiveRole] = useState<Role>("BMU Manager");
  const [pipelineStep, setPipelineStep] = useState(2);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const sections = gsap.utils.toArray<HTMLElement>(".reveal-section");
    const animations = sections.map((section) =>
      gsap.fromTo(
        section,
        { opacity: 0.45, y: 80, rotateX: 4 },
        {
          opacity: 1,
          y: 0,
          rotateX: 0,
          ease: "power3.out",
          scrollTrigger: {
            trigger: section,
            start: "top 78%",
            end: "top 35%",
            scrub: 0.8,
          },
        },
      ),
    );
    return () => animations.forEach((animation) => animation.scrollTrigger?.kill());
  }, []);

  const roleCopy = useMemo(() => {
    const map: Record<Role, string> = {
      "Government Admin": "National policy, audit visibility, RLS governance, cross-county analytics, and executive reporting.",
      "KFS Officer": "Operational fisheries intelligence, inspections, landing sites, species trends, and compliance escalation.",
      "County Officer": "County-wide BMU performance, revenue, licensing support, activity oversight, and exportable reports.",
      "BMU Manager": "Fisher profiles, vessels, gear, fees, receipts, meetings, minutes, compliance, and local operations.",
      Ranger: "Patrol logs, incidents, evidence, compliance outcomes, and field activity records.",
      "NGO Program Manager": "Programs, beneficiaries, activities, budgets, outputs, and field evidence aligned to donor KPIs.",
      Donor: "Funding impact, milestone completion, beneficiary reach, evidence packs, and board-level dashboards.",
      Fisher: "Profile, vessel, membership, licence documents, QR status, receipts, and communication history.",
    };
    return map[activeRole];
  }, [activeRole]);

  return (
    <main className="noise min-h-screen overflow-hidden bg-[#020712] text-white">
      <Leva hidden />
      <nav className="fixed inset-x-0 top-0 z-50 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 text-sm text-cyan-50/85 backdrop-blur-xl md:px-8">
        <a href="#hero" className="flex items-center gap-3 font-display text-lg font-bold tracking-tight text-white">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-300 text-slate-950 shadow-[0_0_40px_rgba(65,243,255,.42)]">B</span>
          BLUE
        </a>
        <div className="hidden items-center gap-7 md:flex">
          {["Mission", "Platform", "GIS", "Roles", "Pricing"].map((item) => (
            <a key={item} href={`#${item.toLowerCase()}`} className="font-semibold transition hover:text-cyan-200">
              {item}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <a href="/login" className="rounded-full border border-white/20 px-4 py-2 font-semibold text-white transition hover:border-cyan-200/70 hover:bg-white/10">
            Login
          </a>
          <a href="/request-access" className="rounded-full border border-cyan-200/30 bg-cyan-200/10 px-4 py-2 font-semibold text-cyan-50 transition hover:border-cyan-200/70 hover:bg-cyan-200/20">
            Request access
          </a>
        </div>
      </nav>

      <section id="hero" className="relative grid min-h-screen items-center px-5 pt-28 md:px-8">
        <div className="absolute inset-0 opacity-28">
          <img src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2200&q=80" alt="Ocean coastline" className="h-full w-full object-cover" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#020712]/72 via-[#020712]/78 to-[#020712]" />
        <div className="absolute inset-0 ocean-grid opacity-70" />
        <div className="wave-band" />
        <div className="mx-auto grid w-full max-w-7xl items-center gap-10 lg:grid-cols-[0.95fr_1.05fr]">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9 }} className="relative z-10">
            <div className="mb-6 inline-flex rounded-full border border-cyan-200/20 bg-cyan-200/10 px-4 py-2 text-xs uppercase tracking-[0.26em] text-cyan-100/90">
              Blue Economy Livelihoods Unified Ecosystem
            </div>
            <h1 className="font-display text-5xl font-bold leading-[0.92] tracking-[-0.03em] md:text-7xl xl:text-8xl">
              Ocean <span className="liquid-text">intelligence</span> for living coastlines.
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-cyan-50/78 md:text-xl">
              BLUE unifies fisheries governance, BMU operations, conservation evidence, NGO programs, donor monitoring, GIS layers, and community records into one secure command ecosystem.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <a href="#platform" className="rounded-full bg-cyan-200 px-6 py-3 font-bold text-slate-950 shadow-[0_0_55px_rgba(65,243,255,.32)] transition hover:scale-[1.02]">
                Explore platform
              </a>
              <a href="#dashboard" className="rounded-full border border-white/15 px-6 py-3 font-bold text-white transition hover:border-cyan-200/60 hover:bg-white/10">
                View command preview
              </a>
            </div>
          </motion.div>
          <div className="h-[460px] rounded-[2rem] border border-cyan-200/15 bg-cyan-100/5 p-2 shadow-[0_30px_140px_rgba(0,0,0,.45)] lg:h-[600px]">
            <div className="h-full overflow-hidden rounded-[1.65rem]">
              <OceanScene />
            </div>
          </div>
        </div>
      </section>

      <section id="mission" className="reveal-section mx-auto grid max-w-7xl gap-6 px-5 py-24 md:grid-cols-4 md:px-8">
        {capabilities.map((item) => (
          <div key={item.title} className="glass holo-border rounded-3xl p-6">
            <div className="text-2xl font-bold text-white">{item.title}</div>
            <p className="mt-4 text-sm leading-7 text-cyan-50/66">{item.body}</p>
          </div>
        ))}
      </section>

      <section className="reveal-section mx-auto max-w-7xl px-5 py-10 md:px-8">
        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="ocean-photo min-h-[420px] rounded-[2rem] border border-cyan-200/15 shadow-[0_35px_120px_rgba(0,0,0,.36)]">
            <img src="https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=1600&q=80" alt="Underwater blue ocean" />
            <div className="absolute bottom-0 left-0 z-10 p-7">
              <p className="text-sm uppercase tracking-[0.32em] text-cyan-100/80">Ocean operating layer</p>
              <h2 className="mt-3 max-w-2xl font-display text-4xl font-bold tracking-[-0.03em] text-white md:text-6xl">Records, patrols, revenue, and evidence shaped around real coastal work.</h2>
            </div>
          </div>
          <div className="grid gap-5">
            <div className="ocean-photo min-h-[200px] rounded-[2rem] border border-cyan-200/15">
              <img src="https://images.unsplash.com/photo-1498622205843-3b0ac17f8ba3?auto=format&fit=crop&w=1200&q=80" alt="Sea surface" />
              <div className="absolute bottom-0 z-10 p-5">
                <h3 className="font-display text-2xl font-bold text-white">BMU-first workflows</h3>
                <p className="mt-2 text-sm text-cyan-50/72">Built around member records, documents, payments, and compliance.</p>
              </div>
            </div>
            <div className="ocean-photo min-h-[200px] rounded-[2rem] border border-cyan-200/15">
              <img src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80" alt="Coastal landscape" />
              <div className="absolute bottom-0 z-10 p-5">
                <h3 className="font-display text-2xl font-bold text-white">Clean governance view</h3>
                <p className="mt-2 text-sm text-cyan-50/72">County, KFS, BMU, ranger, NGO, and donor access stays role-aware.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="platform" className="reveal-section mx-auto max-w-7xl px-5 py-24 md:px-8">
        <div className="max-w-3xl">
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-200/70">What is BLUE</p>
          <h2 className="mt-4 font-display text-5xl font-bold tracking-[-0.04em] md:text-7xl">A single nervous system for the blue economy.</h2>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {modules.map((module) => (
            <article key={module.title} className="group glass rounded-[2rem] p-6 transition duration-500 hover:-translate-y-2">
              <div className={`mb-10 h-1.5 w-24 rounded-full bg-gradient-to-r ${module.accent}`} />
              <h3 className="font-display text-2xl font-bold">{module.title}</h3>
              <p className="mt-4 leading-7 text-cyan-50/62">{module.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="reveal-section mx-auto max-w-7xl px-5 py-24 md:px-8" id="dashboard">
        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="glass rounded-[2rem] p-7">
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-200/70">Operational dashboards</p>
            <h2 className="mt-4 font-display text-5xl font-bold tracking-[-0.04em]">Connected coastal command.</h2>
            <p className="mt-5 leading-8 text-cyan-50/64">KPI cards, report areas, catch trends, compliance work queues, funding impact views, NGO activities, and marine intelligence surfaces connect to real Supabase records.</p>
            <div className="mt-8 grid gap-3">
              {[Fish, ShieldCheck, CircleDollarSign, Leaf].map((Icon, index) => (
                <div key={String(index)} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <Icon className="h-5 w-5 text-cyan-200" />
                  <span className="text-sm text-cyan-50/72">{["Species analytics", "Compliance follow-up", "Donor milestones", "Conservation activity"][index]}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="glass rounded-[2rem] p-5">
            <div className="grid gap-4 md:grid-cols-2">
              {workflowSignals.map((signal, index) => (
                <div key={signal} className="rounded-3xl border border-white/10 bg-slate-950/40 p-5">
                  <div className="flex items-center justify-between text-sm text-cyan-50/64">
                    <span>{signal}</span>
                    <span>Supabase</span>
                  </div>
                  <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
                    <motion.div initial={{ x: "-100%" }} whileInView={{ x: "100%" }} viewport={{ once: true }} transition={{ duration: 1.2, delay: index * 0.08 }} className="h-full w-1/2 rounded-full bg-gradient-to-r from-cyan-300 to-teal-300" />
                  </div>
                  <div className="mt-5 grid h-36 place-items-center rounded-2xl border border-dashed border-white/10 bg-white/[0.035] text-center text-xs uppercase tracking-[0.2em] text-cyan-50/42">
                    No fake values
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="gis" className="reveal-section mx-auto max-w-7xl px-5 py-24 md:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-200/70">GIS intelligence</p>
            <h2 className="mt-4 font-display text-5xl font-bold tracking-[-0.04em] md:text-7xl">A holographic view of marine reality.</h2>
            <p className="mt-6 leading-8 text-cyan-50/64">Landing sites, protected areas, patrol routes, fishing zones, conservation overlays, and animated markers become operational intelligence.</p>
          </div>
          <div className="glass relative min-h-[520px] overflow-hidden rounded-[2rem] p-6">
            <div className="absolute inset-0 ocean-grid opacity-70" />
            <svg viewBox="0 0 100 100" className="relative h-full min-h-[470px] w-full">
              <path d="M12 70 C30 40, 52 48, 70 22 S90 30, 86 66" fill="none" stroke="rgba(65,243,255,.42)" strokeWidth="0.6" strokeDasharray="2 2" />
              <path d="M22 28 C38 15, 55 25, 69 18" fill="none" stroke="rgba(17,215,180,.35)" strokeWidth="7" strokeLinecap="round" />
              {[22, 42, 62, 78].map((x, index) => (
                <g key={x}>
                  <circle cx={x} cy={index % 2 ? 34 : 64} r="4.5" fill="rgba(65,243,255,.16)">
                    <animate attributeName="r" values="3;7;3" dur="2.4s" repeatCount="indefinite" />
                  </circle>
                  <circle cx={x} cy={index % 2 ? 34 : 64} r="1.6" fill={index % 2 ? "#11d7b4" : "#41f3ff"} />
                </g>
              ))}
            </svg>
          </div>
        </div>
      </section>

      <section id="roles" className="reveal-section mx-auto max-w-7xl px-5 py-24 md:px-8">
        <div className="glass rounded-[2rem] p-6 md:p-8">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-cyan-200/70">Role ecosystem</p>
              <h2 className="mt-4 font-display text-5xl font-bold tracking-[-0.04em]">Eight roles. One secure ocean brain.</h2>
              <p className="mt-6 leading-8 text-cyan-50/64">Each role has a distinct dashboard, permission model, analytics layer, and data visibility boundary powered by Supabase Auth and RLS.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {roles.map((role) => (
                <button key={role} onClick={() => setActiveRole(role)} className={`rounded-2xl border p-4 text-left transition ${activeRole === role ? "border-cyan-200/70 bg-cyan-200/14 text-white" : "border-white/10 bg-white/[0.035] text-cyan-50/64 hover:border-cyan-200/35"}`}>
                  {role}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-7 rounded-3xl border border-cyan-200/15 bg-slate-950/45 p-6 text-lg leading-8 text-cyan-50/76">{roleCopy}</div>
        </div>
      </section>

      <section className="reveal-section mx-auto max-w-7xl px-5 py-24 md:px-8">
        <div className="grid gap-6 lg:grid-cols-5">
          {[
            [UsersRound, "Register", "Profiles, vessels, gear, memberships"],
            [Anchor, "Land", "Catch, species, site activity"],
            [RadioTower, "Monitor", "Compliance, patrol, ranger evidence"],
            [BarChart3, "Analyze", "Dashboards, trends, heatmaps"],
            [Landmark, "Report", "Donor, county, national exports"],
          ].map(([Icon, titleText, body]) => {
            const StepIcon = Icon as typeof UsersRound;
            const isActive = pipelineStep === ["Register", "Land", "Monitor", "Analyze", "Report"].indexOf(titleText as string);
            return (
              <button key={titleText as string} onClick={() => setPipelineStep(["Register", "Land", "Monitor", "Analyze", "Report"].indexOf(titleText as string))} className={`glass rounded-[2rem] p-5 text-left transition hover:-translate-y-1 ${isActive ? "ring-1 ring-cyan-200/70" : ""}`}>
                <StepIcon className="h-7 w-7 text-cyan-200" />
                <h3 className="mt-8 font-display text-2xl font-bold">{titleText as string}</h3>
                <p className="mt-3 text-sm leading-6 text-cyan-50/58">{body as string}</p>
              </button>
            );
          })}
        </div>
      </section>

      <section id="pricing" className="reveal-section mx-auto max-w-7xl px-5 py-24 md:px-8">
        <div className="glass rounded-[2rem] p-8 md:p-12">
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-200/70">Development timeline and pricing</p>
          <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_0.8fr]">
            <h2 className="font-display text-5xl font-bold tracking-[-0.04em] md:text-7xl">From coastal records to national intelligence.</h2>
            <div className="space-y-4 text-cyan-50/70">
              <p><strong className="text-white">Phase 1:</strong> Auth, roles, BMU records, documents, QR, payments, compliance, meetings.</p>
              <p><strong className="text-white">Phase 2:</strong> GIS, NGO projects, donor KPIs, analytics, exports, evidence packs.</p>
              <p><strong className="text-white">Phase 3:</strong> Offline-first mobile workflows, advanced intelligence, integrations, national scale.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="reveal-section px-5 py-24 md:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <Map className="mx-auto h-10 w-10 text-cyan-200" />
          <h2 className="mt-6 font-display text-5xl font-bold tracking-[-0.04em] md:text-7xl">Deploy a living ocean platform.</h2>
          <p className="mx-auto mt-6 max-w-2xl leading-8 text-cyan-50/64">BLUE is built for the future of fisheries, conservation, funding transparency, and community decision-making.</p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <a href="/request-access" className="rounded-full bg-cyan-200 px-6 py-3 font-bold text-slate-950 shadow-[0_0_45px_rgba(65,243,255,.24)] transition hover:scale-[1.02]">Request access</a>
            <a href="/login" className="rounded-full border border-white/15 px-6 py-3 font-bold text-white transition hover:border-cyan-200/60 hover:bg-white/10">Login</a>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 px-5 py-10 text-center text-sm text-cyan-50/44 md:px-8">
        BLUE — Blue Economy Livelihoods Unified Ecosystem. Built with Next.js, React, Supabase, Three.js, GSAP, and Framer Motion.
      </footer>
    </main>
  );
}
