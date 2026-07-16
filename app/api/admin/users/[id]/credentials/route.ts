import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const credentialActions = new Set(["resend_setup_link", "generate_temp_password", "force_password_setup"]);

function appOrigin(request: Request) {
  return process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
}

function generateTemporaryPassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}

async function requireGovernmentAdmin(request: Request) {
  const supabase = createAdminClient();
  if (!supabase) return { error: "Server Supabase service key is not configured.", status: 500 as const };

  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) return { error: "Missing admin session.", status: 401 as const };

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user) return { error: "Invalid admin session.", status: 401 as const };

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role,is_active")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (profileError || profile?.role !== "Government Admin" || profile.is_active === false) {
    return { error: "Only Government Admin can manage user credentials.", status: 403 as const };
  }

  return { supabase, adminId: userData.user.id };
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireGovernmentAdmin(request);
  if ("error" in guard) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const action = String(body.action ?? "");
  if (!credentialActions.has(action)) return NextResponse.json({ error: "Unsupported credential action." }, { status: 400 });

  const { data: profile, error: profileError } = await guard.supabase
    .from("profiles")
    .select("id,full_name,role,is_active")
    .eq("id", id)
    .maybeSingle();
  if (profileError || !profile) return NextResponse.json({ error: profileError?.message ?? "Profile was not found." }, { status: 404 });

  const { data: userData, error: userError } = await guard.supabase.auth.admin.getUserById(id);
  if (userError || !userData.user?.email) return NextResponse.json({ error: userError?.message ?? "Auth user email was not found." }, { status: 404 });

  const now = new Date().toISOString();
  const redirectTo = `${appOrigin(request)}/set-password`;

  if (action === "force_password_setup") {
    const { error } = await guard.supabase.from("profiles").update({
      password_setup_required: true,
      last_credential_action_at: now,
      last_credential_action_by: guard.adminId,
    }).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    await guard.supabase.from("audit_logs").insert({
      actor_id: guard.adminId,
      action: "credential.force_password_setup",
      entity_type: "profiles",
      entity_id: id,
    });

    return NextResponse.json({ ok: true, status: "password_setup_required" });
  }

  if (action === "generate_temp_password") {
    const temporaryPassword = generateTemporaryPassword();
    const { error: updateUserError } = await guard.supabase.auth.admin.updateUserById(id, {
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: { full_name: profile.full_name, approved_role: profile.role, password_setup_required: true },
    });
    if (updateUserError) return NextResponse.json({ error: updateUserError.message }, { status: 400 });

    const { error: updateProfileError } = await guard.supabase.from("profiles").update({
      password_setup_required: true,
      temporary_password_generated_at: now,
      last_credential_action_at: now,
      last_credential_action_by: guard.adminId,
      is_active: true,
    }).eq("id", id);
    if (updateProfileError) return NextResponse.json({ error: updateProfileError.message }, { status: 400 });

    await guard.supabase.from("audit_logs").insert({
      actor_id: guard.adminId,
      action: "credential.temporary_password_generated",
      entity_type: "profiles",
      entity_id: id,
    });

    return NextResponse.json({ ok: true, temporaryPassword, warning: "Temporary password is shown only once. Ask the user to change it immediately after login." });
  }

  const { data: linkData, error: linkError } = await guard.supabase.auth.admin.generateLink({
    type: "recovery",
    email: userData.user.email,
    options: { redirectTo },
  });
  if (linkError) {
    const rateLimited = /rate|limit|too many/i.test(linkError.message);
    return NextResponse.json({
      error: linkError.message,
      suggestion: rateLimited ? "Email rate limit reached. Generate a temporary password instead." : "If the setup link cannot be sent, generate a temporary password instead.",
    }, { status: 400 });
  }

  const setupLink = linkData.properties?.action_link ?? null;
  const { error: updateProfileError } = await guard.supabase.from("profiles").update({
    password_setup_required: true,
    password_setup_sent_at: now,
    last_credential_action_at: now,
    last_credential_action_by: guard.adminId,
  }).eq("id", id);
  if (updateProfileError) return NextResponse.json({ error: updateProfileError.message }, { status: 400 });

  await guard.supabase.from("audit_logs").insert({
    actor_id: guard.adminId,
    action: "credential.setup_link_generated",
    entity_type: "profiles",
    entity_id: id,
  });

  return NextResponse.json({ ok: true, setupLink, message: setupLink ? "Setup link generated. Share it securely with the user." : "Setup link generated." });
}
