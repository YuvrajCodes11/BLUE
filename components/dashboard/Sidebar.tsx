"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BadgeCheck, BarChart3, Bell, FileText, Fish, FolderOpen, Gauge, Map, Settings, ShieldCheck, Ship, UserPlus, Users, Waves, X } from "lucide-react";
import type { ComponentType } from "react";
import { navForRole, roleLabels } from "@/lib/roles";
import type { RoleSlug } from "@/types/domain";

const icons: Record<string, ComponentType<{ className?: string }>> = {
  Overview: Gauge,
  "Register Member": UserPlus,
  Members: Users,
  Vessels: Ship,
  Catches: Fish,
  Species: Waves,
  "Landing Sites": Map,
  "BMU Setup": Settings,
  Compliance: ShieldCheck,
  "FORM 1A": FileText,
  "BMU Patrol": ShieldCheck,
  "Patrol Data": FileText,
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
  if (["Register Member", "Members", "Vessels", "Catches", "Species", "Landing Sites", "BMU Setup"].includes(label)) return "Fisheries Records";
  if (["Compliance", "FORM 1A", "BMU Patrol", "Patrol Data", "Payments", "Renewals", "Documents", "Rangers", "Reports", "Verify Member QR", "GIS", "Projects", "Beneficiaries", "Donor Impact"].includes(label)) return "Operations";
  return "Administration";
}

export function Sidebar({ role, mobile = false, onNavigate }: { role: RoleSlug; mobile?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  const nav = navForRole(role);
  const groups = nav.reduce<Record<string, typeof nav>>((acc, item) => {
    const group = groupFor(item.label);
    acc[group] = [...(acc[group] ?? []), item];
    return acc;
  }, {});

  return (
    <aside className={`dashboard-sidebar ${mobile ? "flex h-full w-full flex-col overflow-hidden" : "fixed inset-y-0 left-0 z-30 hidden w-72 overflow-hidden border-r border-[var(--sidebar-line)] shadow-2xl lg:flex lg:flex-col"} text-[var(--sidebar-text)]`}>
      <div className="relative flex items-center gap-3 border-b border-[var(--sidebar-line)] p-5">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-cyan-300 font-black text-slate-950 shadow-[0_0_38px_rgba(65,243,255,.34)]">B</span>
        <div>
          <Link href="/dashboard" className="text-lg font-black">BLUE</Link>
          <p className="text-sm text-[var(--sidebar-muted)]">Livelihoods unified ecosystem</p>
        </div>
        {mobile && (
          <button onClick={onNavigate} className="ml-auto grid h-10 w-10 place-items-center rounded-xl border border-[var(--sidebar-line)] bg-[var(--sidebar-hover)] text-[var(--sidebar-text)]" aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
      <div className="relative m-4 rounded-2xl border border-[var(--sidebar-line)] bg-[var(--sidebar-hover)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,.12)]">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--sidebar-subtle)]">Active workspace</p>
        <p className="mt-2 font-bold text-[var(--sidebar-text)]">{roleLabels[role]}</p>
      </div>
      <nav className="relative min-h-0 flex-1 overflow-y-auto px-4 pb-4">
        {Object.entries(groups).map(([group, items]) => (
          <div key={group} className="mb-6">
            <p className="mb-2 px-1 text-xs font-black uppercase tracking-[0.22em] text-[var(--sidebar-subtle)]">{group}</p>
            <div className="grid gap-1">
              {items.map((item) => {
                const Icon = icons[item.label] ?? FileText;
                const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                return (
                  <Link onClick={onNavigate} key={item.href} href={item.href} className={`flex min-h-12 items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition ${active ? "bg-[var(--sidebar-active-bg)] text-[var(--sidebar-active-text)]" : "text-[var(--sidebar-muted)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-text)]"}`}>
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
