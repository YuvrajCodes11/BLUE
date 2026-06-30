"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/dashboard/ThemeToggle";
import { createClient, hasSupabaseConfig } from "@/lib/supabase";
import { redirectForRole } from "@/lib/role-redirect";

export function SetPasswordCard() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("Checking invite session...");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function checkSession() {
      if (!hasSupabaseConfig()) {
        setError("Supabase is not configured.");
        setMessage("");
        return;
      }
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      setMessage(data.session ? "Set your BLUE password to continue." : "Open this page from the invite email link.");
    }
    void checkSession();
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    const { data: userData } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", userData.user?.id).maybeSingle();
    router.push(redirectForRole(profile?.role) ?? "/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[var(--app-bg)] px-6 py-24 text-[var(--text)]">
      <form onSubmit={submit} className="mx-auto max-w-md rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-8 shadow-2xl shadow-cyan-950/20">
        <div className="flex justify-end"><ThemeToggle /></div>
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-500">BLUE Access</p>
        <h1 className="mt-4 text-3xl font-bold">Set password</h1>
        {message && <p className="mt-3 text-sm text-[var(--muted-text)]">{message}</p>}
        <div className="mt-6 grid gap-4">
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="New password"
            className="rounded-xl border border-[var(--line)] bg-[var(--input)] px-4 py-3 text-[var(--text)] outline-none placeholder:text-[var(--muted-text)] focus:border-cyan-300"
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Confirm password"
            className="rounded-xl border border-[var(--line)] bg-[var(--input)] px-4 py-3 text-[var(--text)] outline-none placeholder:text-[var(--muted-text)] focus:border-cyan-300"
          />
        </div>
        <button disabled={loading} className="mt-6 w-full rounded-xl bg-cyan-300 px-4 py-3 font-bold text-slate-950 disabled:opacity-60">
          {loading ? "Saving..." : "Save password"}
        </button>
        {error && <div className="mt-4 rounded-xl border border-rose-300/30 bg-rose-300/10 p-3 text-sm text-rose-800">{error}</div>}
      </form>
    </div>
  );
}
