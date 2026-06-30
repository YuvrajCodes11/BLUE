"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ThemeToggle } from "@/components/dashboard/ThemeToggle";
import { createClient, hasSupabaseConfig } from "@/lib/supabase";
import { redirectForRole, type DbRole } from "@/lib/role-redirect";

const requestRoles: DbRole[] = ["BMU Manager", "County Officer", "KFS Officer", "Ranger", "NGO Program Manager", "Donor", "Fisher"];
const requestTypes = ["BMU operations", "County fisheries monitoring", "Patrol and compliance", "NGO or donor monitoring", "Fisher profile access", "Other"];

const schema = z.object({
  email: z.string().email("Enter a valid email."),
  password: z.string().min(8, "Password must be at least 8 characters.").optional(),
  name: z.string().min(2, "Name is required.").optional(),
  organization: z.string().optional(),
  requestedRole: z.string().optional(),
  requestType: z.string().optional(),
  message: z.string().optional(),
});
type AuthValues = z.infer<typeof schema>;

export function AuthCard({ mode }: { mode: "login" | "register" | "forgot" | "access" }) {
  const router = useRouter();
  const search = useSearchParams();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const { register, handleSubmit, formState } = useForm<AuthValues>({
    defaultValues: {
      email: search.get("email") ?? "",
      requestedRole: "BMU Manager",
      requestType: "BMU operations",
    },
  });

  async function submit(values: AuthValues) {
    setMessage("");
    setError("");
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check the form.");
      return;
    }
    if (!hasSupabaseConfig()) {
      setError("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
      return;
    }

    const supabase = createClient();
    if (mode === "login") {
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({ email: values.email, password: values.password ?? "" });
      if (signInError) throw signInError;
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", authData.user.id)
        .maybeSingle();
      if (profileError) throw profileError;
      const destination = redirectForRole(profile?.role);
      if (!destination) {
        await supabase.auth.signOut();
        router.push(`/request-access?email=${encodeURIComponent(values.email)}`);
        return;
      }
      router.push(search.get("next") ?? destination);
      router.refresh();
      return;
    }
    if (mode === "register") {
      const { error: signUpError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password ?? "",
        options: { data: { full_name: values.name } },
      });
      if (signUpError) throw signUpError;
      setMessage("Registration created. Check email verification before login.");
      return;
    }
    if (mode === "forgot") {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(values.email, { redirectTo: `${location.origin}/login` });
      if (resetError) throw resetError;
      setMessage("Password reset email sent.");
      return;
    }

    const details = [
      values.requestedRole ? `Requested role: ${values.requestedRole}` : null,
      values.requestType ? `Access type: ${values.requestType}` : null,
      values.message ? `Message: ${values.message}` : null,
    ].filter(Boolean).join("\n");

    const { error: insertError } = await supabase.from("access_requests").insert({
      name: values.name,
      email: values.email,
      organization: values.organization,
      message: details,
      status: "Pending",
    });
    if (insertError) throw insertError;
    setMessage("Access request submitted successfully. BLUE admin will review it.");
  }

  async function onSubmit(values: AuthValues) {
    try { await submit(values); } catch (err) { setError(err instanceof Error ? err.message : "Request failed."); }
  }

  const title = mode === "login" ? "Login" : mode === "register" ? "Create account" : mode === "forgot" ? "Reset password" : "Request access";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mx-auto w-full max-w-lg rounded-3xl border border-[var(--line)] bg-[var(--panel)] p-6 text-[var(--text)] shadow-2xl">
      <div className="flex justify-end"><ThemeToggle /></div>
      <div className="text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-cyan-300 font-black text-slate-950">B</span>
        <h1 className="mt-4 text-3xl font-black">{title}</h1>
        <p className="mt-2 text-sm text-[var(--muted-text)]">Blue Economy Livelihoods Unified Ecosystem</p>
      </div>
      <div className="mt-6 grid gap-3">
        {(mode === "register" || mode === "access") && <input {...register("name")} placeholder="Full name" className="rounded-xl border border-[var(--line)] bg-[var(--input)] px-4 py-3 text-[var(--text)] outline-none placeholder:text-[var(--muted-text)]" />}
        {mode === "access" && <input {...register("organization")} placeholder="Organization / BMU / county" className="rounded-xl border border-[var(--line)] bg-[var(--input)] px-4 py-3 text-[var(--text)] outline-none placeholder:text-[var(--muted-text)]" />}
        <input {...register("email")} placeholder="Email" className="rounded-xl border border-[var(--line)] bg-[var(--input)] px-4 py-3 text-[var(--text)] outline-none placeholder:text-[var(--muted-text)]" />
        {mode === "access" && (
          <div className="grid gap-3 md:grid-cols-2">
            <select {...register("requestedRole")} className="rounded-xl border border-[var(--line)] bg-[var(--input)] px-4 py-3 text-[var(--text)] outline-none placeholder:text-[var(--muted-text)]">
              {requestRoles.map((role) => <option key={role}>{role}</option>)}
            </select>
            <select {...register("requestType")} className="rounded-xl border border-[var(--line)] bg-[var(--input)] px-4 py-3 text-[var(--text)] outline-none placeholder:text-[var(--muted-text)]">
              {requestTypes.map((type) => <option key={type}>{type}</option>)}
            </select>
          </div>
        )}
        {mode === "access" && <textarea {...register("message")} placeholder="Briefly describe what access is needed for" className="min-h-28 rounded-xl border border-[var(--line)] bg-[var(--input)] px-4 py-3 text-[var(--text)] outline-none placeholder:text-[var(--muted-text)]" />}
        {mode !== "forgot" && mode !== "access" && <input {...register("password")} type="password" placeholder="Password" className="rounded-xl border border-[var(--line)] bg-[var(--input)] px-4 py-3 text-[var(--text)] outline-none placeholder:text-[var(--muted-text)]" />}
        <button disabled={formState.isSubmitting} className="rounded-xl bg-cyan-300 px-4 py-3 font-black text-slate-950 disabled:opacity-60">{formState.isSubmitting ? "Working..." : "Continue"}</button>
        {mode === "login" && <p className="text-center text-sm text-[var(--muted-text)]">No approved account yet? <Link className="font-bold text-cyan-500" href="/request-access">Request access</Link></p>}
        {mode === "access" && <p className="text-center text-sm text-[var(--muted-text)]">Already approved? <Link className="font-bold text-cyan-500" href="/login">Login instead</Link></p>}
        {message && <p className="rounded-xl border border-cyan-300/20 bg-cyan-300/10 p-3 text-sm text-cyan-800">{message}</p>}
        {error && <p className="rounded-xl border border-rose-300/30 bg-rose-300/10 p-3 text-sm text-rose-800">{error}</p>}
      </div>
    </form>
  );
}
