import { NextResponse } from "next/server";
import { redirectForRole } from "@/lib/role-redirect";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const supabase = createAdminClient();
  if (!supabase) return NextResponse.json({ error: "Server Supabase service key is not configured." }, { status: 500 });

  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) return NextResponse.json({ error: "Missing session." }, { status: 401 });

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user) return NextResponse.json({ error: "Invalid session." }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  if (body.privacyAccepted !== true || body.dataUsageAccepted !== true) {
    return NextResponse.json({ error: "Privacy notice and data usage agreement must be accepted." }, { status: 400 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role,is_active")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (profileError || !profile) return NextResponse.json({ error: profileError?.message ?? "Profile not found." }, { status: 404 });
  if (profile.is_active === false) return NextResponse.json({ error: "This profile is not active." }, { status: 403 });

  const now = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      consent_accepted_at: now,
      data_usage_accepted_at: now,
      onboarding_completed_at: now,
      onboarding_status: "completed",
    })
    .eq("id", userData.user.id);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 });

  await supabase.from("audit_logs").insert({
    actor_id: userData.user.id,
    action: "onboarding.completed",
    entity_type: "profiles",
    entity_id: userData.user.id,
  });

  return NextResponse.json({ ok: true, redirectTo: redirectForRole(profile.role) ?? "/dashboard" });
}
