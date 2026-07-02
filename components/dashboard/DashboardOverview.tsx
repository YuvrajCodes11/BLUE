"use client";

import { useEffect, useState } from "react";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { LoadingState } from "@/components/dashboard/LoadingState";
import { MapPreview } from "@/components/dashboard/MapPreview";
import { StatCard } from "@/components/dashboard/StatCard";
import { createClient, hasSupabaseConfig } from "@/lib/supabase";
import { roleLabels } from "@/lib/roles";
import type { RoleSlug, Stat } from "@/types/domain";

const countTargets = [
  ["fishers", "Total fishers", "cyan"],
  ["vessels", "Total vessels", "emerald"],
  ["catch_records", "Catch records", "amber"],
  ["landing_sites", "Landing sites", "cyan"],
  ["access_requests", "Pending requests", "amber"],
  ["compliance_records", "Compliance issues", "violet"],
  ["ngo_projects", "Active projects", "emerald"],
] as const;

export function DashboardOverview({ role }: { role: RoleSlug }) {
  const [stats, setStats] = useState<Stat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setError("");
      if (!hasSupabaseConfig()) {
        setError("Supabase env variables are missing, so real dashboard counts cannot load.");
        setLoading(false);
        return;
      }
      setLoading(true);
      const supabase = createClient();
      const results = await Promise.all(countTargets.map(async ([table, label, tone]) => {
        let query = supabase.from(table).select("id", { count: "exact", head: true });
        if (table === "access_requests") query = supabase.from(table).select("id", { count: "exact", head: true }).eq("status", "Pending");
        const { count, error: countError } = await query;
        if (countError) throw countError;
        return { label, value: String(count ?? 0), trend: "live", tone } satisfies Stat;
      }));
      setStats(results);
      setLoading(false);
    }
    load().catch((err: unknown) => {
      setError(err instanceof Error ? err.message : "Could not load dashboard counts.");
      setLoading(false);
    });
  }, [role]);

  return (
    <section>
      <p className="text-sm uppercase tracking-[0.24em] text-cyan-200/70">{roleLabels[role]}</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-5xl">Operational dashboard</h1>
      <div className="mt-6">{loading ? <LoadingState /> : error ? <EmptyState title="Dashboard counts unavailable" body={error} /> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{stats.map((stat) => <StatCard key={stat.label} stat={stat} />)}</div>}</div>
      <div className="mt-6 grid gap-4 xl:grid-cols-[1fr_0.9fr]"><ChartCard title="Production and activity trend" /><MapPreview /></div>
    </section>
  );
}
