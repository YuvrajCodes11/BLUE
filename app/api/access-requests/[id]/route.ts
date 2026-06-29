import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { redirectForRole, type DbRole } from "@/lib/role-redirect";

const roles: DbRole[] = [
  "Government Admin",
  "KFS Officer",
  "County Officer",
  "BMU Manager",
  "Ranger",
  "NGO Program Manager",
  "Donor",
  "Fisher",
];

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function requireAdmin(request: Request) {
  const supabase = getAdminClient();
  if (!supabase) return { error: "Server Supabase service key is not configured.", status: 500 as const };

  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) return { error: "Missing admin session.", status: 401 as const };

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user) return { error: "Invalid admin session.", status: 401 as const };

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (profileError || profile?.role !== "Government Admin") {
    return { error: "Only Government Admin can approve access.", status: 403 as const };
  }

  return { supabase, adminId: userData.user.id };
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(request);
  if ("error" in guard) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const action = String(body.action ?? "");

  if (action === "reject") {
    const { error } = await guard.supabase.from("access_requests").update({ status: "Closed" }).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true, status: "Closed" });
  }

  if (action !== "approve") return NextResponse.json({ error: "Unsupported action." }, { status: 400 });

  const role = String(body.role ?? "BMU Manager") as DbRole;
  const temporaryPassword = String(body.temporaryPassword ?? "");
  const county = String(body.county ?? "").trim() || null;

  if (!roles.includes(role)) return NextResponse.json({ error: "Invalid role." }, { status: 400 });
  if (temporaryPassword.length < 8) return NextResponse.json({ error: "Temporary password must be at least 8 characters." }, { status: 400 });

  const { data: accessRequest, error: requestError } = await guard.supabase
    .from("access_requests")
    .select("name,email,organization")
    .eq("id", id)
    .maybeSingle();

  if (requestError || !accessRequest) return NextResponse.json({ error: requestError?.message ?? "Access request not found." }, { status: 404 });

  const email = String(accessRequest.email).toLowerCase().trim();
  const fullName = String(accessRequest.name || accessRequest.organization || email).trim();

  const { data: created, error: createError } = await guard.supabase.auth.admin.createUser({
    email,
    password: temporaryPassword,
    email_confirm: true,
    user_metadata: { full_name: fullName, approved_role: role },
  });

  let userId = created.user?.id;
  if (createError) {
    const { data: users, error: listError } = await guard.supabase.auth.admin.listUsers();
    if (listError) return NextResponse.json({ error: listError.message }, { status: 400 });
    const existing = users.users.find((user) => user.email?.toLowerCase() === email);
    if (!existing) return NextResponse.json({ error: createError.message }, { status: 400 });
    userId = existing.id;
    const { error: updateUserError } = await guard.supabase.auth.admin.updateUserById(userId, {
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: { full_name: fullName, approved_role: role },
    });
    if (updateUserError) return NextResponse.json({ error: updateUserError.message }, { status: 400 });
  }

  if (!userId) return NextResponse.json({ error: "Could not create or find user." }, { status: 400 });

  const { error: profileError } = await guard.supabase.from("profiles").upsert({
    id: userId,
    full_name: fullName,
    role,
    county,
  });
  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 400 });

  const { error: updateRequestError } = await guard.supabase
    .from("access_requests")
    .update({ status: "Validated" })
    .eq("id", id);
  if (updateRequestError) return NextResponse.json({ error: updateRequestError.message }, { status: 400 });

  await guard.supabase.from("audit_logs").insert({
    actor_id: guard.adminId,
    action: "Approved access request",
    entity_type: "access_requests",
    entity_id: id,
  });

  return NextResponse.json({ ok: true, email, role, loginUrl: redirectForRole(role) });
}
