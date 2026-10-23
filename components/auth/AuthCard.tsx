"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Sparkles } from "lucide-react";
import { ThemeToggle } from "@/components/dashboard/ThemeToggle";
import { createClient, hasSupabaseConfig } from "@/lib/supabase";
import { redirectForRole, type DbRole } from "@/lib/role-redirect";

const requestRoles: DbRole[] = ["BMU Manager", "County Officer", "KFS Officer", "Ranger", "NGO Program Manager", "Donor", "Fisher"];
const requestRoleLabel: Partial<Record<DbRole, string>> = { "KFS Officer": "KeFS Officer", Fisher: "Member" };
const requestTypes = ["BMU operations", "County fisheries monitoring", "Patrol and compliance", "NGO or donor monitoring", "Member profile access", "Other"];
const organizationTypes = ["BMU", "County fisheries office", "National fisheries office", "NGO", "Donor", "Community organization", "Other"];

const schema = z.object({
  email: z.string().min(1, "Enter an email or demo ID."),
  password: z.string().min(1, "Password is required.").optional(),
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
type BmuOption = { id: string; county_id?: string | null; ward_id?: string | null; name: string; county?: string | null };

export function AuthCard({ mode }: { mode: "login" | "register" | "forgot" | "access" }) {
  const router = useRouter();
  const search = useSearchParams();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const [allLocations, setAllLocations] = useState<{
    counties: CountyOption[];
    subCounties: SubCountyOption[];
    wards: WardOption[];
    bmus: BmuOption[];
  }>({ counties: [], subCounties: [], wards: [], bmus: [] });

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

  // Load locations from the high-reliability /api/locations endpoint
  useEffect(() => {
    if (mode !== "access") return;
    async function loadLocations() {
      try {
        const res = await fetch("/api/locations");
        if (!res.ok) throw new Error("Failed to load locations");
        const data = await res.json();
        setAllLocations(data);
        setCounties(data.counties ?? []);
      } catch {
        // Fallback local Kenyan coastal data
        const fallbackCounties: CountyOption[] = [
          { id: "a30fc6e2-6a50-472b-b6f4-ee52f229740c", name: "Kilifi" },
          { id: "b7894262-fcc5-4a0f-88c9-076dfa519407", name: "Kwale" },
          { id: "b88842d1-3544-4cb3-90d6-1c5756deaed3", name: "Mombasa" },
          { id: "e9c34177-1fd0-400e-8ffe-45669905d021", name: "Homa Bay" },
          { id: "lamu-id", name: "Lamu" },
        ];
        setCounties(fallbackCounties);
      }
    }
    void loadLocations();
  }, [mode]);

  // Cascade Sub-counties when County changes
  useEffect(() => {
    setValue("subCountyId", "");
    setValue("wardId", "");
    setValue("bmuId", "");
    setWards([]);
    setBmus([]);

    if (!selectedCountyId) {
      setSubCounties([]);
      return;
    }

    const filtered = allLocations.subCounties.filter((s) => s.county_id === selectedCountyId);
    setSubCounties(filtered);

    // Also populate BMUs available for this county
    const countyBmus = allLocations.bmus.filter((b) => b.county_id === selectedCountyId);
    if (countyBmus.length > 0) {
      setBmus(countyBmus);
    }
  }, [selectedCountyId, allLocations, setValue]);

  // Cascade Wards when Sub-county changes
  useEffect(() => {
    setValue("wardId", "");
    setValue("bmuId", "");

    if (!selectedSubCountyId) {
      setWards([]);
      return;
    }

    const filtered = allLocations.wards.filter((w) => w.sub_county_id === selectedSubCountyId);
    setWards(filtered);
  }, [selectedSubCountyId, allLocations, setValue]);

  // Cascade BMUs when Ward changes
  useEffect(() => {
    setValue("bmuId", "");

    if (!selectedWardId) {
      // Keep county-level BMUs if available
      if (selectedCountyId) {
        const countyBmus = allLocations.bmus.filter((b) => b.county_id === selectedCountyId);
        setBmus(countyBmus);
      } else {
        setBmus([]);
      }
      return;
    }

    const filtered = allLocations.bmus.filter((b) => b.ward_id === selectedWardId);
    if (filtered.length > 0) {
      setBmus(filtered);
    } else {
      // Fallback to county BMUs
      const countyBmus = allLocations.bmus.filter((b) => b.county_id === selectedCountyId);
      setBmus(countyBmus.length ? countyBmus : allLocations.bmus);
    }
  }, [selectedWardId, selectedCountyId, allLocations, setValue]);

  // Demo Login Helper
  async function performDemoLogin(role = "Government Admin") {
    setMessage("");
    setError("");
    try {
      const res = await fetch("/api/auth/demo-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isQuickDemo: true, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Demo login failed");

      if (typeof window !== "undefined") {
        document.cookie = "blue_demo_session=true; path=/; max-age=604800; SameSite=Lax";
        document.cookie = `blue_demo_role=${role}; path=/; max-age=604800; SameSite=Lax`;
        localStorage.setItem("blue_demo_user", JSON.stringify(data.user));
      }

      startTransition(() => {
        router.push(data.destination || "/dashboard/admin");
        router.refresh();
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Demo login failed.");
    }
  }

  async function submit(values: AuthValues) {
    setMessage("");
    setError("");

    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check the form.");
      return;
    }

    const rawEmail = (values.email ?? "").trim().toLowerCase();
    const rawPass = (values.password ?? "").trim();

    // Check for hardcoded Demo Login credentials
    const isDemoEmail =
      rawEmail === "demo@blue.org" ||
      rawEmail === "demo" ||
      rawEmail === "demo@gmail.com" ||
      rawEmail === "admin@blue.org";

    const isDemoPassword =
      rawPass === "demo" ||
      rawPass === "demo1234" ||
      rawPass === "demo1234!" ||
      rawPass === "Demo1234!" ||
      rawPass === "blue" ||
      rawPass === "blue2026" ||
      rawPass.toLowerCase().includes("demo");

    if (mode === "login" && (isDemoEmail || (rawEmail.includes("demo") && isDemoPassword))) {
      await performDemoLogin();
      return;
    }

    if (!hasSupabaseConfig() && mode !== "access") {
      setError("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
      return;
    }

    const supabase = createClient();
    if (mode === "login") {
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password ?? "",
      });
      if (signInError) {
        const message = /rate|limit/i.test(signInError.message)
          ? "Login failed: too many auth attempts. Wait a few minutes or ask the admin for a temporary password."
          : `Login failed: ${signInError.message}. For instant presentation, use Demo Login below.`;
        throw new Error(message);
      }
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role,is_active,consent_accepted_at,data_usage_accepted_at,onboarding_completed_at")
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
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: `${location.origin}/set-password`,
      });
      if (resetError) throw resetError;
      setMessage("Password reset email sent.");
      return;
    }

    // mode === "access"
    if (!values.name || !values.organizationType || !values.requestedRole || !values.requestType) {
      setError("Name, organization type, role, and access type are required.");
      return;
    }

    // Use our resilient /api/access-requests endpoint
    const response = await fetch("/api/access-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: values.name,
        email: values.email,
        organizationType: values.organizationType,
        requestedRole: values.requestedRole,
        requestType: values.requestType,
        countyId: values.countyId || null,
        subCountyId: values.subCountyId || null,
        wardId: values.wardId || null,
        bmuId: values.bmuId || null,
        message: values.message,
      }),
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(result.error || "Failed to submit access request.");
    }

    setMessage("Access request submitted successfully! BLUE administrator has been notified.");
  }

  async function onSubmit(values: AuthValues) {
    try {
      await submit(values);
    } catch (err) {
      const fallback =
        mode === "login"
          ? "Login failed. You can also use the Demo Login button below."
          : mode === "access"
            ? "Access request failed. Please check the required fields and try again."
            : "Request failed. Please try again.";
      const errorMessage =
        err instanceof Error
          ? err.message
          : typeof err === "object" && err && "message" in err && typeof err.message === "string"
            ? err.message
            : fallback;
      setError(errorMessage);
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

      {mode === "login" && (
        <div className="mt-6 rounded-2xl border border-cyan-400/30 bg-cyan-400/10 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-cyan-400" />
              <div>
                <strong className="text-sm font-bold text-[var(--text)]">Client Presentation Demo</strong>
                <p className="text-xs text-[var(--muted-text)]">
                  ID: <span className="font-mono font-bold text-cyan-400">demo@blue.org</span> | Password: <span className="font-mono font-bold text-cyan-400">Demo1234!</span>
                </p>
              </div>
            </div>
            <button
              type="button"
              disabled={isPending}
              onClick={() => void performDemoLogin()}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-cyan-300 px-3 py-2 text-xs font-black text-slate-950 shadow-md transition hover:bg-cyan-200 active:scale-95 disabled:opacity-50"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {isPending ? "Entering..." : "Quick Demo Login"}
            </button>
          </div>
        </div>
      )}

      <div className="mt-6 grid gap-3">
        {(mode === "register" || mode === "access") && (
          <label className="grid gap-1.5 text-xs font-bold uppercase tracking-[0.18em] text-[var(--muted-text)]">
            Full name
            <input
              {...register("name")}
              placeholder="Full name"
              className="rounded-xl border border-[var(--line)] bg-[var(--input)] px-4 py-3 text-sm normal-case tracking-normal text-[var(--text)] outline-none placeholder:text-[var(--muted-text)]"
            />
          </label>
        )}

        {mode === "access" && (
          <label className="grid gap-1.5 text-xs font-bold uppercase tracking-[0.18em] text-[var(--muted-text)]">
            Organization type
            <select
              {...register("organizationType")}
              className="rounded-xl border border-[var(--line)] bg-[var(--input)] px-4 py-3 text-sm normal-case tracking-normal text-[var(--text)] outline-none"
            >
              {organizationTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="grid gap-1.5 text-xs font-bold uppercase tracking-[0.18em] text-[var(--muted-text)]">
          {mode === "login" ? "Email or Demo ID" : "Email"}
          <input
            {...register("email")}
            placeholder={mode === "login" ? "demo@blue.org or your email" : "Email"}
            className="rounded-xl border border-[var(--line)] bg-[var(--input)] px-4 py-3 text-sm normal-case tracking-normal text-[var(--text)] outline-none placeholder:text-[var(--muted-text)]"
          />
        </label>

        {mode === "access" && (
          <div className="grid gap-3 md:grid-cols-2">
            <label className="grid gap-1.5 text-xs font-bold uppercase tracking-[0.18em] text-[var(--muted-text)]">
              Requested role
              <select
                {...register("requestedRole")}
                className="rounded-xl border border-[var(--line)] bg-[var(--input)] px-4 py-3 text-sm normal-case tracking-normal text-[var(--text)] outline-none"
              >
                {requestRoles.map((role) => (
                  <option key={role} value={role}>
                    {requestRoleLabel[role] ?? role}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1.5 text-xs font-bold uppercase tracking-[0.18em] text-[var(--muted-text)]">
              Access type
              <select
                {...register("requestType")}
                className="rounded-xl border border-[var(--line)] bg-[var(--input)] px-4 py-3 text-sm normal-case tracking-normal text-[var(--text)] outline-none"
              >
                {requestTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        {mode === "access" && (
          <div className="grid gap-3 md:grid-cols-2">
            <label className="grid gap-1.5 text-xs font-bold uppercase tracking-[0.18em] text-[var(--muted-text)]">
              County
              <select
                {...register("countyId")}
                className="rounded-xl border border-[var(--line)] bg-[var(--input)] px-4 py-3 text-sm normal-case tracking-normal text-[var(--text)] outline-none"
              >
                <option value="">Select county</option>
                {counties.map((county) => (
                  <option key={county.id} value={county.id}>
                    {county.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1.5 text-xs font-bold uppercase tracking-[0.18em] text-[var(--muted-text)]">
              Sub-county
              <select
                {...register("subCountyId")}
                disabled={!selectedCountyId}
                className="rounded-xl border border-[var(--line)] bg-[var(--input)] px-4 py-3 text-sm normal-case tracking-normal text-[var(--text)] outline-none disabled:opacity-50"
              >
                <option value="">Select sub-county</option>
                {subCounties.map((subCounty) => (
                  <option key={subCounty.id} value={subCounty.id}>
                    {subCounty.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1.5 text-xs font-bold uppercase tracking-[0.18em] text-[var(--muted-text)]">
              Ward
              <select
                {...register("wardId")}
                disabled={!selectedSubCountyId}
                className="rounded-xl border border-[var(--line)] bg-[var(--input)] px-4 py-3 text-sm normal-case tracking-normal text-[var(--text)] outline-none disabled:opacity-50"
              >
                <option value="">Select ward</option>
                {wards.map((ward) => (
                  <option key={ward.id} value={ward.id}>
                    {ward.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1.5 text-xs font-bold uppercase tracking-[0.18em] text-[var(--muted-text)]">
              BMU
              <select
                {...register("bmuId")}
                disabled={!selectedCountyId}
                className="rounded-xl border border-[var(--line)] bg-[var(--input)] px-4 py-3 text-sm normal-case tracking-normal text-[var(--text)] outline-none disabled:opacity-50"
              >
                <option value="">{selectedRole === "BMU Manager" ? "Select required BMU" : "Optional BMU scope"}</option>
                {bmus.map((bmu) => (
                  <option key={bmu.id} value={bmu.id}>
                    {bmu.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        {mode === "access" && (
          <label className="grid gap-1.5 text-xs font-bold uppercase tracking-[0.18em] text-[var(--muted-text)]">
            Message
            <textarea
              {...register("message")}
              placeholder="Briefly describe what access is needed for"
              className="min-h-28 rounded-xl border border-[var(--line)] bg-[var(--input)] px-4 py-3 text-sm normal-case tracking-normal text-[var(--text)] outline-none placeholder:text-[var(--muted-text)]"
            />
          </label>
        )}

        {mode !== "forgot" && mode !== "access" && (
          <label className="grid gap-1.5 text-xs font-bold uppercase tracking-[0.18em] text-[var(--muted-text)]">
            Password
            <input
              {...register("password")}
              type="password"
              placeholder={mode === "login" ? "Password or Demo1234!" : "Password"}
              className="rounded-xl border border-[var(--line)] bg-[var(--input)] px-4 py-3 text-sm normal-case tracking-normal text-[var(--text)] outline-none placeholder:text-[var(--muted-text)]"
            />
          </label>
        )}

        <button
          disabled={formState.isSubmitting || isPending}
          className="ocean-action rounded-xl px-4 py-3 font-black text-slate-950 disabled:opacity-60"
        >
          {formState.isSubmitting || isPending ? "Authenticating..." : mode === "login" ? "Sign In" : "Continue"}
        </button>

        {mode === "login" && (
          <div className="grid gap-1 text-center text-sm text-[var(--muted-text)]">
            <p>
              No approved account yet?{" "}
              <Link className="font-bold text-cyan-500" href="/request-access">
                Request access
              </Link>
            </p>
            <p>
              <Link className="font-bold text-cyan-500" href="/forgot-password">
                Forgot or set password?
              </Link>
            </p>
          </div>
        )}

        {mode === "access" && (
          <p className="text-center text-sm text-[var(--muted-text)]">
            Already approved?{" "}
            <Link className="font-bold text-cyan-500" href="/login">
              Login instead
            </Link>
          </p>
        )}

        {message && <p className="rounded-xl border border-cyan-300/30 bg-cyan-300/15 p-3 text-sm text-cyan-800">{message}</p>}
        {error && <p className="rounded-xl border border-rose-300/30 bg-rose-300/10 p-3 text-sm text-rose-800">{error}</p>}
      </div>
    </form>
  );
}
