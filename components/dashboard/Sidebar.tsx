"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Anchor, BadgeCheck, BarChart3, Bell, FileText, Fish, FolderOpen, Gauge, Map, Settings, ShieldCheck, Ship, UserPlus, Users, Waves } from "lucide-react";
import type { ComponentType } from "react";
import { navForRole, roleLabels } from "@/lib/roles";
import type { RoleSlug } from "@/types/domain";

const icons: Record<string, ComponentType<{ className?: string }>> = {
  Overview: Gauge,
  "Register Member": UserPlus,
  Fishers: Users,
  Vessels: Ship,
  Gear: Anchor,
  Catches: Fish,
  Species: Waves,
  "Landing Sites": Map,
  Compliance: ShieldCheck,
  Payments: BadgeCheck,
  Renewals: FileText,
  Documents: FolderOpen,
  Rangers: ShieldCheck,
  "Verify Member QR": BadgeCheck,
  Reports: BarChart3,
  GIS: Map,
  Projects: FolderOpen,
  Beneficiaries: UserPlus,
  "Donor Impact": BadgeCheck,
  Notifications: Bell,
  Settings,
};

function groupFor(label: string) {
  if (label === "Overview") return "Command";
  if (["Register Member", "Fishers", "Vessels", "Gear", "Catches", "Species", "Landing Sites"].includes(label)) return "Fisheries Records";
  if (["Compliance", "Payments", "Renewals", "Documents", "Rangers", "Reports", "Verify Member QR", "GIS", "Projects", "Beneficiaries", "Donor Impact"].includes(label)) return "Operations";
  return "Administration";
}

export function Sidebar({ role }: { role: RoleSlug }) {
  const pathname = usePathname();
  const nav = navForRole(role);
  const groups = nav.reduce<Record<string, typeof nav>>((acc, item) => {
    const group = groupFor(item.label);
    acc[group] = [...(acc[group] ?? []), item];
    return acc;
  }, {});

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-[var(--sidebar-line)] bg-[var(--sidebar-bg)] text-white shadow-2xl lg:flex lg:flex-col">
      <div className="flex items-center gap-3 border-b border-white/10 p-5">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-cyan-300 font-black text-slate-950">B</span>
        <div>
          <Link href="/dashboard" className="text-lg font-black">BLUE</Link>
          <p className="text-sm text-cyan-100/65">Livelihoods unified ecosystem</p>
        </div>
      </div>
      <div className="m-4 rounded-2xl border border-cyan-200/20 bg-cyan-200/10 p-4">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-100/55">Active workspace</p>
        <p className="mt-2 font-bold text-white">{roleLabels[role]}</p>
      </div>
      <nav className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
        {Object.entries(groups).map(([group, items]) => (
          <div key={group} className="mb-6">
            <p className="mb-2 px-1 text-xs font-black uppercase tracking-[0.22em] text-cyan-100/45">{group}</p>
            <div className="grid gap-1">
              {items.map((item) => {
                const Icon = icons[item.label] ?? FileText;
                const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                return (
                  <Link key={item.href} href={item.href} className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition ${active ? "bg-cyan-300 text-slate-950" : "text-cyan-50/68 hover:bg-white/10 hover:text-white"}`}>
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
