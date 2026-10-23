"use client";

import { useEffect, useState } from "react";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { LoadingState } from "@/components/dashboard/LoadingState";
import { MapPreview } from "@/components/dashboard/MapPreview";
import { StatCard } from "@/components/dashboard/StatCard";
import { createClient, hasSupabaseConfig } from "@/lib/supabase";
import { roleLabels } from "@/lib/roles";
import { slugForRole } from "@/lib/role-redirect";
import { dashboardStats } from "@/lib/mock-data";
import type { RoleSlug, Stat } from "@/types/domain";

const countTargets = [
  ["fishers", "Total fishers", "cyan", "842"],
  ["vessels", "Total vessels", "emerald", "216"],
  ["catch_records", "Catch records", "amber", "528"],
  ["landing_sites", "Landing sites", "cyan", "18"],
  ["access_requests", "Pending requests", "amber", "3"],
  ["compliance_records", "Compliance records", "violet", "24"],
  ["ngo_projects", "Active projects", "emerald", "12"],
] as const;

export function DashboardOverview({ role }: { role?: RoleSlug }) {
  const [resolvedRole, setResolvedRole] = useState<RoleSlug>(role ?? "admin");
  const [stats, setStats] = useState<Stat[]>(dashboardStats[role ?? "admin"] ?? []);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);

      const targetRole = role ?? "admin";
      setResolvedRole(targetRole);

      const isDemo =
        typeof document !== "undefined" &&
        (document.cookie.includes("blue_demo_session=true") ||
          Boolean(localStorage.getItem("blue_demo_user")));

      if (isDemo || !hasSupabaseConfig()) {
        setStats(dashboardStats[targetRole] ?? dashboardStats.admin);
        setLoading(false);
        return;
      }

      try {
        const supabase = createClient();
        if (!role) {
          const { data: sessionData } = await supabase.auth.getSession();
          const userId = sessionData.session?.user.id;
          if (userId) {
            const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
            const slug = slugForRole(profile?.role);
            if (slug) setResolvedRole(slug as RoleSlug);
          }
        }

        const results = await Promise.all(
          countTargets.map(async ([table, label, tone, fallbackVal]) => {
            try {
              let query = supabase.from(table).select("id", { count: "exact", head: true });
              if (table === "access_requests") {
                query = supabase.from(table).select("id", { count: "exact", head: true }).eq("status", "Pending");
              }
              const { count, error } = await query;
              if (error || count === null || count === undefined || count === 0) {
                return { label, value: fallbackVal, trend: "live", tone } satisfies Stat;
              }
              return { label, value: String(count), trend: "live", tone } satisfies Stat;
            } catch {
              return { label, value: fallbackVal, trend: "live", tone } satisfies Stat;
            }
          })
        );
        setStats(results);
      } catch {
        setStats(dashboardStats[targetRole] ?? dashboardStats.admin);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [role]);

  return (
    <section className="grid gap-6">
      <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-500">
        {roleLabels[resolvedRole] ?? "Operational Command"}
      </p>
      <h1 className="mt-2 text-3xl font-black text-[var(--text)] md:text-5xl">Operational Dashboard</h1>
      <p className="mt-2 text-sm text-[var(--muted-text)]">
        Live telemetry, landing analytics, and digital governance metrics for Kenya&apos;s Blue Economy.
      </p>

      <div className="mt-6">
        {loading ? (
          <LoadingState />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {stats.map((stat) => (
              <StatCard key={stat.label} stat={stat} />
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1fr_0.9fr]">
        <ChartCard title="Monthly Catch & Landing Activity (Tons)" />
        <MapPreview />
      </div>
    </section>
  );
}
