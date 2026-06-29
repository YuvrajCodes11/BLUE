"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { createClient, hasSupabaseConfig } from "@/lib/supabase";
import { redirectForRole } from "@/lib/role-redirect";

const schema = z.object({
  email: z.string().email("Enter a valid email."),
  password: z.string().min(8, "Password must be at least 8 characters.").optional(),
  name: z.string().min(2, "Name is required.").optional(),
  organization: z.string().optional(),
  message: z.string().optional(),
});
type AuthValues = z.infer<typeof schema>;

export function AuthCard({ mode }: { mode: "login" | "register" | "forgot" | "access" }) {
  const router = useRouter();
  const search = useSearchParams();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const { register, handleSubmit, formState } = useForm<AuthValues>();

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
        setError("No approved BLUE profile found for this account. Please request access or ask an admin to assign your role.");
        await supabase.auth.signOut();
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
    const { error: insertError } = await supabase.from("access_requests").insert({
      name: values.name,
      email: values.email,
      organization: values.organization,
      message: values.message,
      status: "Pending",
    });
    if (insertError) throw insertError;
    setMessage("Access request submitted successfully.");
  }

  async function onSubmit(values: AuthValues) {
    try { await submit(values); } catch (err) { setError(err instanceof Error ? err.message : "Request failed."); }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mx-auto w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.06] p-6 text-white backdrop-blur-xl">
      <h1 className="text-3xl font-bold">{mode === "login" ? "Login" : mode === "register" ? "Create account" : mode === "forgot" ? "Reset password" : "Request access"}</h1>
      <div className="mt-6 grid gap-3">
        {(mode === "register" || mode === "access") && <input {...register("name")} placeholder="Full name" className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 outline-none" />}
        {mode === "access" && <input {...register("organization")} placeholder="Organization" className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 outline-none" />}
        <input {...register("email")} placeholder="Email" className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 outline-none" />
        {mode === "access" && <textarea {...register("message")} placeholder="What does your organization need?" className="min-h-28 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 outline-none" />}
        {mode !== "forgot" && mode !== "access" && <input {...register("password")} type="password" placeholder="Password" className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 outline-none" />}
        <button disabled={formState.isSubmitting} className="rounded-xl bg-cyan-300 px-4 py-3 font-bold text-slate-950 disabled:opacity-60">{formState.isSubmitting ? "Working..." : "Continue"}</button>
        {message && <p className="rounded-xl border border-cyan-300/20 bg-cyan-300/10 p-3 text-sm text-cyan-100">{message}</p>}
        {error && <p className="rounded-xl border border-rose-300/20 bg-rose-300/10 p-3 text-sm text-rose-100">{error}</p>}
      </div>
    </form>
  );
}
