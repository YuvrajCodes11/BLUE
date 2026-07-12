"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient, hasSupabaseConfig } from "@/lib/supabase";
import { redirectForRole } from "@/lib/role-redirect";
import { ThemeToggle } from "@/components/dashboard/ThemeToggle";

type Profile = {
  full_name: string | null;
  role: string | null;
  county: string | null;
  county_id: string | null;
  sub_county_id: string | null;
  ward_id: string | null;
  bmu_id: string | null;
  consent_accepted_at: string | null;
  data_usage_accepted_at: string | null;
  onboarding_completed_at: string | null;
};

export function ConsentOnboardingForm() {
  const router = useRouter();
  const search = useSearchParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [dataUsageAccepted, setDataUsageAccepted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!hasSupabaseConfig()) {
      setError("Supabase is not configured.");
      setLoading(false);
      return;
    }
    const supabase = createClient();
    async function load() {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (!user) {
        router.push("/login");
        return;
      }
      const { data, error: profileError } = await supabase
        .from("profiles")
        .select("full_name,role,county,county_id,sub_county_id,ward_id,bmu_id,consent_accepted_at,data_usage_accepted_at,onboarding_completed_at")
        .eq("id", user.id)
        .maybeSingle();
      if (profileError || !data) {
        setError(profileError?.message ?? "Profile not found. Please request access.");
        setLoading(false);
        return;
      }
      const nextProfile = data as Profile;
      if (nextProfile.consent_accepted_at && nextProfile.data_usage_accepted_at && nextProfile.onboarding_completed_at) {
        router.push(search.get("next") ?? redirectForRole(nextProfile.role) ?? "/dashboard");
        return;
      }
      setProfile(nextProfile);
      setLoading(false);
    }
    void load();
  }, [router, search]);

  async function submit() {
    setError("");
    if (!privacyAccepted || !dataUsageAccepted) {
      setError("Please accept both the privacy notice and data usage agreement.");
      return;
    }
    setSubmitting(true);
    const supabase = createClient();
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) {
      router.push("/login");
      return;
    }
    const response = await fetch("/api/onboarding/complete", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify({ privacyAccepted, dataUsageAccepted }),
    });
    const result = await response.json().catch(() => ({}));
    setSubmitting(false);
    if (!response.ok) {
      setError(result.error ?? "Could not complete onboarding.");
      return;
    }
    router.push(search.get("next") ?? result.redirectTo ?? "/dashboard");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 py-10 text-[var(--text)]">
      <section className="ocean-panel mx-auto max-w-2xl rounded-3xl p-6 shadow-2xl">
        <div className="flex justify-end"><ThemeToggle /></div>
        <div className="text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-cyan-300 font-black text-slate-950">B</span>
          <p className="mt-5 text-xs font-black uppercase tracking-[0.24em] text-cyan-600">BLUE onboarding</p>
          <h1 className="mt-3 text-3xl font-black">Privacy and data usage agreement</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--muted-text)]">
            Before entering the platform, confirm how BLUE handles organization records, personal data, and operational access.
          </p>
        </div>

        {loading ? (
          <p className="mt-8 rounded-2xl border border-[var(--line)] p-4 text-sm text-[var(--muted-text)]">Loading profile...</p>
        ) : (
          <div className="mt-8 grid gap-4">
            {profile && (
              <div className="rounded-2xl border border-[var(--line)] bg-[var(--soft)] p-4 text-sm">
                <p className="font-bold text-[var(--text)]">{profile.full_name ?? "Approved user"}</p>
                <p className="mt-1 text-[var(--muted-text)]">Assigned role: {profile.role === "KFS Officer" ? "KeFS Officer" : profile.role}</p>
                <p className="mt-1 text-[var(--muted-text)]">Scope: {profile.county ?? "Assigned by administrator"}</p>
              </div>
            )}

            <label className="flex gap-3 rounded-2xl border border-[var(--line)] bg-[var(--soft)] p-4 text-sm leading-6">
              <input type="checkbox" checked={privacyAccepted} onChange={(event) => setPrivacyAccepted(event.target.checked)} className="mt-1 h-4 w-4" />
              <span>I accept the BLUE privacy notice. I understand that authorized users can access records only according to their approved role and assigned organization scope.</span>
            </label>

            <label className="flex gap-3 rounded-2xl border border-[var(--line)] bg-[var(--soft)] p-4 text-sm leading-6">
              <input type="checkbox" checked={dataUsageAccepted} onChange={(event) => setDataUsageAccepted(event.target.checked)} className="mt-1 h-4 w-4" />
              <span>I accept the data usage agreement. I understand that organizations retain ownership of their own data and BLUE provides the software platform for secure management, reporting, and decision-making.</span>
            </label>

            {error && <p className="rounded-xl border border-rose-300/30 bg-rose-300/10 p-3 text-sm text-rose-800">{error}</p>}
            <button onClick={() => void submit()} disabled={submitting} className="ocean-action rounded-xl px-4 py-3 font-black text-slate-950 disabled:opacity-60">
              {submitting ? "Completing..." : "Accept and enter dashboard"}
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
