import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { type DbRole } from "@/lib/role-redirect";
import { createAdminClient } from "@/lib/supabase/admin";

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
  return createAdminClient();
}

function appOrigin(request: Request) {
  return process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
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

async function findUserIdByEmail(supabase: NonNullable<ReturnType<typeof getAdminClient>>, email: string) {
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) throw new Error(error.message);
  return data.users.find((user) => user.email?.toLowerCase() === email)?.id ?? null;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(request);
  if ("error" in guard) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const action = String(body.action ?? "");

  if (action === "reject") {
    const { error } = await guard.supabase.from("access_requests").update({
      status: "Closed",
      reviewed_by: guard.adminId,
      reviewed_at: new Date().toISOString(),
      review_notes: String(body.reviewNotes ?? "").trim() || null,
    }).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true, status: "Closed" });
  }

  if (action !== "approve") return NextResponse.json({ error: "Unsupported action." }, { status: 400 });

  const role = String(body.role ?? "BMU Manager") as DbRole;
  const countyId = String(body.countyId ?? "").trim() || null;
  const subCountyId = String(body.subCountyId ?? "").trim() || null;
  const wardId = String(body.wardId ?? "").trim() || null;
  const bmuId = String(body.bmuId ?? "").trim() || null;
  const reviewNotes = String(body.reviewNotes ?? "").trim() || null;

  if (!roles.includes(role)) return NextResponse.json({ error: "Invalid role." }, { status: 400 });
  if (role === "BMU Manager" && !bmuId) return NextResponse.json({ error: "BMU Manager approval requires a BMU assignment." }, { status: 400 });
  if (role === "County Officer" && !countyId) return NextResponse.json({ error: "County Officer approval requires a county assignment." }, { status: 400 });

  let county: string | null = null;
  if (countyId) {
    const { data: countyRow, error: countyError } = await guard.supabase.from("counties").select("name").eq("id", countyId).maybeSingle();
    if (countyError || !countyRow) return NextResponse.json({ error: countyError?.message ?? "Selected county was not found." }, { status: 400 });
    county = countyRow.name;
  }
  if (subCountyId) {
    const { data: subCountyRow } = await guard.supabase.from("sub_counties").select("id").eq("id", subCountyId).eq("county_id", countyId).maybeSingle();
    if (!subCountyRow) return NextResponse.json({ error: "Selected sub-county does not belong to the selected county." }, { status: 400 });
  }
  if (wardId) {
    const { data: wardRow } = await guard.supabase.from("wards").select("id").eq("id", wardId).eq("sub_county_id", subCountyId).maybeSingle();
    if (!wardRow) return NextResponse.json({ error: "Selected ward does not belong to the selected sub-county." }, { status: 400 });
  }
  if (bmuId) {
    const { data: bmuRow } = await guard.supabase.from("bmus").select("id").eq("id", bmuId).eq("ward_id", wardId).maybeSingle();
    if (!bmuRow) return NextResponse.json({ error: "Selected BMU does not belong to the selected ward." }, { status: 400 });
  }

  const { data: accessRequest, error: requestError } = await guard.supabase
    .from("access_requests")
    .select("name,email,organization,organization_name")
    .eq("id", id)
    .maybeSingle();

  if (requestError || !accessRequest) return NextResponse.json({ error: requestError?.message ?? "Access request not found." }, { status: 404 });

  const email = String(accessRequest.email).toLowerCase().trim();
  const fullName = String(accessRequest.name || accessRequest.organization_name || accessRequest.organization || email).trim();
  const redirectTo = `${appOrigin(request)}/set-password`;

  let userId: string | null = null;
  let inviteSent = true;

  const { data: invited, error: inviteError } = await guard.supabase.auth.admin.inviteUserByEmail(email, {
    data: { full_name: fullName, approved_role: role },
    redirectTo,
  });

  userId = invited.user?.id ?? null;

  if (inviteError) {
    userId = await findUserIdByEmail(guard.supabase, email);
    if (!userId) return NextResponse.json({ error: inviteError.message }, { status: 400 });

    const { error: updateUserError } = await guard.supabase.auth.admin.updateUserById(userId, {
      email_confirm: true,
      user_metadata: { full_name: fullName, approved_role: role },
    });
    if (updateUserError) return NextResponse.json({ error: updateUserError.message }, { status: 400 });

    const publicClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "");
    const { error: resetError } = await publicClient.auth.resetPasswordForEmail(email, { redirectTo });
    if (resetError) return NextResponse.json({ error: resetError.message }, { status: 400 });
    inviteSent = false;
  }

  if (!userId) return NextResponse.json({ error: "Could not create or find user." }, { status: 400 });

  const { error: profileError } = await guard.supabase.from("profiles").upsert({
    id: userId,
    full_name: fullName,
    role,
    county,
    county_id: countyId,
    sub_county_id: subCountyId,
    ward_id: wardId,
    bmu_id: bmuId,
    onboarding_status: "pending",
  });
  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 400 });

  const { error: updateRequestError } = await guard.supabase
    .from("access_requests")
    .update({
      status: "Validated",
      requested_role: role,
      county_id: countyId,
      sub_county_id: subCountyId,
      ward_id: wardId,
      bmu_id: bmuId,
      reviewed_by: guard.adminId,
      reviewed_at: new Date().toISOString(),
      review_notes: reviewNotes,
    })
    .eq("id", id);
  if (updateRequestError) return NextResponse.json({ error: updateRequestError.message }, { status: 400 });

  await guard.supabase.from("audit_logs").insert({
    actor_id: guard.adminId,
    action: inviteSent ? "Approved access request and sent invite" : "Approved access request and sent password setup email",
    entity_type: "access_requests",
    entity_id: id,
  });

  return NextResponse.json({ ok: true, email, role, inviteSent });
}
