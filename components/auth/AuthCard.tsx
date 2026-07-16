"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ThemeToggle } from "@/components/dashboard/ThemeToggle";
import { createClient, hasSupabaseConfig } from "@/lib/supabase";
import { redirectForRole, type DbRole } from "@/lib/role-redirect";

const requestRoles: DbRole[] = ["BMU Manager", "County Officer", "KFS Officer", "Ranger", "NGO Program Manager", "Donor", "Fisher"];
const requestRoleLabel: Partial<Record<DbRole, string>> = { "KFS Officer": "KeFS Officer", Fisher: "Member" };
const requestTypes = ["BMU operations", "County fisheries monitoring", "Patrol and compliance", "NGO or donor monitoring", "Member profile access", "Other"];
const organizationTypes = ["BMU", "County fisheries office", "National fisheries office", "NGO", "Donor", "Community organization", "Other"];

const schema = z.object({
  email: z.string().email("Enter a valid email."),
  password: z.string().min(8, "Password must be at least 8 characters.").optional(),
  name: z.string().min(2, "Name is required.").optional(),
  organization: z.string().optional(),
  requestedRole: z.string().optional(),
  requestType: z.string().optional(),
  organizationType: z.string().optional(),
  countyId: z.string().optional(),
  subCountyId: z.string().optional(),
  wardId: z.string().optional(),
  bmuId: z.string().optional(),
  message: z.string().optional(),
});
type AuthValues = z.infer<typeof schema>;
type CountyOption = { id: string; name: string };
type SubCountyOption = { id: string; county_id: string; name: string };
type WardOption = { id: string; sub_county_id: string; name: string };
type BmuOption = { id: string; ward_id: string | null; name: string };

export function AuthCard({ mode }: { mode: "login" | "register" | "forgot" | "access" }) {
  const router = useRouter();
  const search = useSearchParams();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [counties, setCounties] = useState<CountyOption[]>([]);
  const [subCounties, setSubCounties] = useState<SubCountyOption[]>([]);
  const [wards, setWards] = useState<WardOption[]>([]);
  const [bmus, setBmus] = useState<BmuOption[]>([]);
  const { register, handleSubmit, formState, watch, setValue } = useForm<AuthValues>({
    defaultValues: {
      email: search.get("email") ?? "",
      requestedRole: "BMU Manager",
      requestType: "BMU operations",
      organizationType: "BMU",
    },
  });
  const selectedCountyId = watch("countyId");
  const selectedSubCountyId = watch("subCountyId");
  const selectedWardId = watch("wardId");
  const selectedRole = watch("requestedRole");

  useEffect(() => {
    if (mode !== "access" || !hasSupabaseConfig()) return;
    const supabase = createClient();
    async function loadLocations() {
      const { data, error: locationError } = await supabase.from("counties").select("id,name").order("name");
      if (!locationError) setCounties((data ?? []) as CountyOption[]);
    }
    void loadLocations();
  }, [mode]);

  useEffect(() => {
    setValue("subCountyId", "");
    setValue("wardId", "");
    setValue("bmuId", "");
    setSubCounties([]);
    setWards([]);
    setBmus([]);
    if (!selectedCountyId || !hasSupabaseConfig()) return;
    const supabase = createClient();
    async function loadSubCounties() {
      const { data } = await supabase.from("sub_counties").select("id,county_id,name").eq("county_id", selectedCountyId).order("name");
      setSubCounties((data ?? []) as SubCountyOption[]);
    }
    void loadSubCounties();
  }, [selectedCountyId, setValue]);

  useEffect(() => {
    setValue("wardId", "");
    setValue("bmuId", "");
    setWards([]);
    setBmus([]);
    if (!selectedSubCountyId || !hasSupabaseConfig()) return;
    const supabase = createClient();
    async function loadWards() {
      const { data } = await supabase.from("wards").select("id,sub_county_id,name").eq("sub_county_id", selectedSubCountyId).order("name");
      setWards((data ?? []) as WardOption[]);
    }
    void loadWards();
  }, [selectedSubCountyId, setValue]);

  useEffect(() => {
    setValue("bmuId", "");
    setBmus([]);
    if (!selectedWardId || !hasSupabaseConfig()) return;
    const supabase = createClient();
    async function loadBmus() {
      const { data } = await supabase.from("bmus").select("id,ward_id,name").eq("ward_id", selectedWardId).order("name");
      setBmus((data ?? []) as BmuOption[]);
    }
    void loadBmus();
  }, [selectedWardId, setValue]);

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
      if (signInError) {
        const message = /rate|limit/i.test(signInError.message)
          ? "Login failed: too many auth attempts. Wait a few minutes or ask the admin for a temporary password."
          : `Login failed: ${signInError.message}. If the account is approved but login still fails, ask the admin to resend setup access or issue a temporary password.`;
        throw new Error(message);
      }
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role,is_active,consent_accepted_at,data_usage_accepted_at,onboarding_completed_at,password_setup_required")
        .eq("id", authData.user.id)
        .maybeSingle();
      if (profileError) throw profileError;
      const destination = redirectForRole(profile?.role);
      if (!profile || !destination) {
        await supabase.auth.signOut();
        setError("No approved BLUE profile was found for this email. Please request access or ask the admin to approve your account.");
        return;
      }
      if (profile.is_active === false) {
        await supabase.auth.signOut();
        setError("This account is inactive. Please contact the BLUE admin to reactivate access.");
        return;
      }
      if (profile.password_setup_required) {
        router.push(`/set-password?next=${encodeURIComponent(search.get("next") ?? destination)}`);
        router.refresh();
        return;
      }
      if (!profile.consent_accepted_at || !profile.data_usage_accepted_at || !profile.onboarding_completed_at) {
        router.push(`/onboarding?next=${encodeURIComponent(search.get("next") ?? destination)}`);
        router.refresh();
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
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(values.email, { redirectTo: `${location.origin}/set-password` });
      if (resetError) throw resetError;
      setMessage("Password reset email sent.");
      return;
    }

    if (!values.name || !values.organizationType || !values.requestedRole || !values.requestType) {
      setError("Name, organization type, role, and access type are required.");
      return;
    }
    if (values.requestedRole === "BMU Manager" && bmus.length > 0 && !values.bmuId) {
      setError("BMU Manager access requires a BMU selection.");
      return;
    }

    const { error: insertError } = await supabase.from("access_requests").insert({
      name: values.name,
      email: values.email,
      organization: values.organizationType,
      organization_name: null,
      organization_type: values.organizationType,
      requested_role: values.requestedRole,
      access_type: values.requestType,
      county_id: values.countyId || null,
      sub_county_id: values.subCountyId || null,
      ward_id: values.wardId || null,
      bmu_id: values.bmuId || null,
      message: values.message,
      status: "Pending",
    });
    if (insertError) throw insertError;
    setMessage("Access request submitted successfully. BLUE admin will review it.");
  }

  async function onSubmit(values: AuthValues) {
    try {
      await submit(values);
    } catch (err) {
      const fallback = mode === "login"
        ? "Login failed. Please confirm the account is approved and the password has been set from the invite/reset email."
        : mode === "access"
          ? "Access request failed. Please check the required fields and try again."
          : "Request failed. Please try again.";
      setError(err instanceof Error ? err.message : fallback);
    }
  }

  const title = mode === "login" ? "Login" : mode === "register" ? "Create account" : mode === "forgot" ? "Reset password" : "Request access";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="ocean-panel mx-auto w-full max-w-lg rounded-3xl p-6 text-[var(--text)] shadow-2xl">
      <div className="flex justify-end"><ThemeToggle /></div>
      <div className="text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-cyan-300 font-black text-slate-950 shadow-[0_0_42px_rgba(65,243,255,.34)]">B</span>
        <h1 className="mt-4 text-3xl font-black">{title}</h1>
        <p className="mt-2 text-sm text-[var(--muted-text)]">Blue Economy Livelihoods Unified Ecosystem</p>
      </div>
      <div className="mt-6 grid gap-3">
        {(mode === "register" || mode === "access") && <label className="grid gap-1.5 text-xs font-bold uppercase tracking-[0.18em] text-[var(--muted-text)]">Full name<input {...register("name")} placeholder="Full name" className="rounded-xl border border-[var(--line)] bg-[var(--input)] px-4 py-3 text-sm normal-case tracking-normal text-[var(--text)] outline-none placeholder:text-[var(--muted-text)]" /></label>}
        {mode === "access" && (
          <label className="grid gap-1.5 text-xs font-bold uppercase tracking-[0.18em] text-[var(--muted-text)]">Organization type<select {...register("organizationType")} className="rounded-xl border border-[var(--line)] bg-[var(--input)] px-4 py-3 text-sm normal-case tracking-normal text-[var(--text)] outline-none placeholder:text-[var(--muted-text)]">
              {organizationTypes.map((type) => <option key={type} value={type}>{type}</option>)}
            </select></label>
        )}
        <label className="grid gap-1.5 text-xs font-bold uppercase tracking-[0.18em] text-[var(--muted-text)]">Email<input {...register("email")} placeholder="Email" className="rounded-xl border border-[var(--line)] bg-[var(--input)] px-4 py-3 text-sm normal-case tracking-normal text-[var(--text)] outline-none placeholder:text-[var(--muted-text)]" /></label>
        {mode === "access" && (
          <div className="grid gap-3 md:grid-cols-2">
            <label className="grid gap-1.5 text-xs font-bold uppercase tracking-[0.18em] text-[var(--muted-text)]">Requested role<select {...register("requestedRole")} className="rounded-xl border border-[var(--line)] bg-[var(--input)] px-4 py-3 text-sm normal-case tracking-normal text-[var(--text)] outline-none placeholder:text-[var(--muted-text)]">
                {requestRoles.map((role) => <option key={role} value={role}>{requestRoleLabel[role] ?? role}</option>)}
              </select></label>
            <label className="grid gap-1.5 text-xs font-bold uppercase tracking-[0.18em] text-[var(--muted-text)]">Access type<select {...register("requestType")} className="rounded-xl border border-[var(--line)] bg-[var(--input)] px-4 py-3 text-sm normal-case tracking-normal text-[var(--text)] outline-none placeholder:text-[var(--muted-text)]">
                {requestTypes.map((type) => <option key={type}>{type}</option>)}
              </select></label>
          </div>
        )}
        {mode === "access" && (
          <div className="grid gap-3 md:grid-cols-2">
            <label className="grid gap-1.5 text-xs font-bold uppercase tracking-[0.18em] text-[var(--muted-text)]">County<select {...register("countyId")} className="rounded-xl border border-[var(--line)] bg-[var(--input)] px-4 py-3 text-sm normal-case tracking-normal text-[var(--text)] outline-none">
              <option value="">Select county</option>
              {counties.map((county) => <option key={county.id} value={county.id}>{county.name}</option>)}
            </select></label>
            <label className="grid gap-1.5 text-xs font-bold uppercase tracking-[0.18em] text-[var(--muted-text)]">Sub-county<select {...register("subCountyId")} disabled={!selectedCountyId} className="rounded-xl border border-[var(--line)] bg-[var(--input)] px-4 py-3 text-sm normal-case tracking-normal text-[var(--text)] outline-none disabled:opacity-60">
              <option value="">Select sub-county</option>
              {subCounties.map((subCounty) => <option key={subCounty.id} value={subCounty.id}>{subCounty.name}</option>)}
            </select></label>
            <label className="grid gap-1.5 text-xs font-bold uppercase tracking-[0.18em] text-[var(--muted-text)]">Ward<select {...register("wardId")} disabled={!selectedSubCountyId} className="rounded-xl border border-[var(--line)] bg-[var(--input)] px-4 py-3 text-sm normal-case tracking-normal text-[var(--text)] outline-none disabled:opacity-60">
              <option value="">Select ward</option>
              {wards.map((ward) => <option key={ward.id} value={ward.id}>{ward.name}</option>)}
            </select></label>
            <label className="grid gap-1.5 text-xs font-bold uppercase tracking-[0.18em] text-[var(--muted-text)]">BMU<select {...register("bmuId")} disabled={!selectedWardId} className="rounded-xl border border-[var(--line)] bg-[var(--input)] px-4 py-3 text-sm normal-case tracking-normal text-[var(--text)] outline-none disabled:opacity-60">
              <option value="">{selectedRole === "BMU Manager" ? "Select required BMU" : "Optional BMU scope"}</option>
              {bmus.map((bmu) => <option key={bmu.id} value={bmu.id}>{bmu.name}</option>)}
            </select></label>
          </div>
        )}
        {mode === "access" && <label className="grid gap-1.5 text-xs font-bold uppercase tracking-[0.18em] text-[var(--muted-text)]">Message<textarea {...register("message")} placeholder="Briefly describe what access is needed for" className="min-h-28 rounded-xl border border-[var(--line)] bg-[var(--input)] px-4 py-3 text-sm normal-case tracking-normal text-[var(--text)] outline-none placeholder:text-[var(--muted-text)]" /></label>}
        {mode !== "forgot" && mode !== "access" && <label className="grid gap-1.5 text-xs font-bold uppercase tracking-[0.18em] text-[var(--muted-text)]">Password<input {...register("password")} type="password" placeholder="Password" className="rounded-xl border border-[var(--line)] bg-[var(--input)] px-4 py-3 text-sm normal-case tracking-normal text-[var(--text)] outline-none placeholder:text-[var(--muted-text)]" /></label>}
        <button disabled={formState.isSubmitting} className="ocean-action rounded-xl px-4 py-3 font-black text-slate-950 disabled:opacity-60">{formState.isSubmitting ? "Working..." : "Continue"}</button>
        {mode === "login" && <div className="grid gap-1 text-center text-sm text-[var(--muted-text)]"><p>No approved account yet? <Link className="font-bold text-cyan-500" href="/request-access">Request access</Link></p><p><Link className="font-bold text-cyan-500" href="/forgot-password">Forgot or set password?</Link></p><p>Account approved but cannot login? Contact admin to resend setup access or issue a temporary password.</p></div>}
        {mode === "access" && <p className="text-center text-sm text-[var(--muted-text)]">Already approved? <Link className="font-bold text-cyan-500" href="/login">Login instead</Link></p>}
        {message && <p className="rounded-xl border border-cyan-300/20 bg-cyan-300/10 p-3 text-sm text-cyan-800">{message}</p>}
        {error && <p className="rounded-xl border border-rose-300/30 bg-rose-300/10 p-3 text-sm text-rose-800">{error}</p>}
      </div>
    </form>
  );
}
