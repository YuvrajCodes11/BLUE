import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const supabase = createAdminClient();
  if (!supabase) return NextResponse.json({ error: "Server Supabase service key is not configured." }, { status: 500 });

  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) return NextResponse.json({ error: "Missing user session." }, { status: 401 });

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user) return NextResponse.json({ error: "Invalid user session." }, { status: 401 });

  const { error: updateError } = await supabase.from("profiles").update({
    password_setup_required: false,
    last_credential_action_at: new Date().toISOString(),
  }).eq("id", userData.user.id);
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 });

  await supabase.from("audit_logs").insert({
    actor_id: userData.user.id,
    action: "credential.password_changed",
    entity_type: "profiles",
    entity_id: userData.user.id,
  });

  return NextResponse.json({ ok: true });
}
