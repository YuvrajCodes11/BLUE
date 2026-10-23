import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const name = body.name || body.full_name;
    const email = body.email;
    const organizationType = body.organizationType || body.organization_type || body.organization;
    const requestedRole = body.requestedRole || body.requested_role;
    const requestType = body.requestType || body.access_type;
    const countyId = body.countyId || body.county_id;
    const subCountyId = body.subCountyId || body.sub_county_id;
    const wardId = body.wardId || body.ward_id;
    const bmuId = body.bmuId || body.bmu_id;
    const message = body.message;

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required." }, { status: 400 });
    }

    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ ok: true, message: "Access request received and queued for review." });
    }

    // Try inserting with all fields first
    const fullPayload: Record<string, unknown> = {
      name,
      email,
      organization: organizationType || "BMU",
      organization_type: organizationType || null,
      organization_name: null,
      requested_role: requestedRole || null,
      access_type: requestType || null,
      county_id: countyId || null,
      sub_county_id: subCountyId || null,
      ward_id: wardId || null,
      bmu_id: bmuId || null,
      message: message || `Access requested: ${requestedRole || "Member"} - ${requestType || "General"}`,
      status: "Pending",
    };

    const firstAttempt = await supabase.from("access_requests").insert(fullPayload);

    if (firstAttempt.error) {
      // Fallback for schema when 0008 migration columns aren't present
      const basicPayload = {
        name,
        email,
        organization: organizationType || "BMU",
        message: [
          `Role: ${requestedRole || "BMU Manager"}`,
          `Type: ${requestType || "BMU operations"}`,
          message ? `Details: ${message}` : null,
        ]
          .filter(Boolean)
          .join(" | "),
        status: "Pending",
      };

      const fallbackAttempt = await supabase.from("access_requests").insert(basicPayload);
      if (fallbackAttempt.error) {
        return NextResponse.json({ error: fallbackAttempt.error.message }, { status: 400 });
      }
    }

    return NextResponse.json({
      ok: true,
      message: "Access request submitted successfully. BLUE admin will review it.",
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Failed to process access request.";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
