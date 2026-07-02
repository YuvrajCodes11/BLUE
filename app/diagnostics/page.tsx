"use client";

import { useEffect, useState } from "react";
import { createClient, hasSupabaseConfig } from "@/lib/supabase";

type Check = { label: string; status: "pass" | "fail" | "warn"; detail: string };

export default function DiagnosticsPage() {
  const [checks, setChecks] = useState<Check[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function run() {
      const next: Check[] = [];
      const hasUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
      const hasAnon = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
      next.push({ label: "Supabase URL", status: hasUrl ? "pass" : "fail", detail: hasUrl ? "Configured" : "Missing NEXT_PUBLIC_SUPABASE_URL" });
      next.push({ label: "Supabase anon key", status: hasAnon ? "pass" : "fail", detail: hasAnon ? "Configured" : "Missing NEXT_PUBLIC_SUPABASE_ANON_KEY" });

      if (!hasSupabaseConfig()) {
        setChecks(next);
        setLoading(false);
        return;
      }

      try {
        const supabase = createClient();
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        next.push({ label: "Auth session", status: sessionError ? "fail" : sessionData.session ? "pass" : "warn", detail: sessionError?.message ?? (sessionData.session ? "Signed in" : "No active session") });
        const { error: dbError } = await supabase.from("bmus").select("id", { count: "exact", head: true });
        next.push({ label: "Database read", status: dbError ? "fail" : "pass", detail: dbError?.message ?? "Can read bmus table" });
      } catch (error) {
        next.push({ label: "Runtime", status: "fail", detail: error instanceof Error ? error.message : "Unknown diagnostics error" });
      }
      setChecks(next);
      setLoading(false);
    }
    void run();
  }, []);

  return (
    <main className="ocean-app-shell min-h-screen px-5 py-12 text-[var(--text)]">
      <section className="mx-auto max-w-3xl">
        <p className="text-sm uppercase tracking-[0.24em] text-cyan-500">Development only</p>
        <h1 className="mt-2 text-4xl font-bold">BLUE Supabase Diagnostics</h1>
        <p className="mt-3 text-[var(--muted-text)]">Checks configuration without exposing secret keys.</p>
        <div className="mt-8 grid gap-3">
          {loading ? <div className="ocean-panel rounded-2xl p-5">Running checks...</div> : checks.map((check) => (
            <div key={check.label} className="ocean-panel rounded-2xl p-5">
              <div className="flex items-center justify-between gap-4">
                <strong>{check.label}</strong>
                <span className={check.status === "pass" ? "text-emerald-600" : check.status === "warn" ? "text-amber-600" : "text-rose-600"}>{check.status.toUpperCase()}</span>
              </div>
              <p className="mt-2 text-sm text-[var(--muted-text)]">{check.detail}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
