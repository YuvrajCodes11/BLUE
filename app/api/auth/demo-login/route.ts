import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const email = (body.email ?? "demo@blue.org").trim().toLowerCase();
  const password = body.password ?? "demo1234";

  // Check demo credentials:
  // Accept demo@blue.org / demo1234, demo / demo, demo@blue.org / Demo1234!, demo@gmail.com / demo, etc.
  const isDemoEmail =
    email === "demo@blue.org" ||
    email === "demo" ||
    email === "demo@gmail.com" ||
    email === "admin@blue.org" ||
    email.startsWith("demo");

  const validPasswords = ["demo", "demo1234", "demo1234!", "Demo1234!", "demo123", "blue", "blue2026", "BLUE2026!"];
  const isDemoPassword = validPasswords.includes(password) || password.toLowerCase().includes("demo");

  // If credentials are provided and match demo patterns or direct trigger:
  if (!isDemoEmail && !body.isQuickDemo) {
    return NextResponse.json(
      { error: "Invalid demo credentials. Use ID: demo@blue.org and Password: Demo1234!" },
      { status: 401 }
    );
  }

  const role = body.role || "Government Admin";

  const demoUser = {
    id: "demo-admin-uuid-001",
    full_name: "Demo Admin",
    email: "demo@blue.org",
    role: role,
    county: "National",
    is_active: true,
    is_demo: true,
    consent_accepted_at: new Date().toISOString(),
    data_usage_accepted_at: new Date().toISOString(),
    onboarding_completed_at: new Date().toISOString(),
    onboarding_status: "completed",
  };

  const response = NextResponse.json({
    ok: true,
    user: demoUser,
    destination: "/dashboard/admin",
    message: "Logged in successfully as Demo Admin",
  });

  // Set the demo session cookie
  response.cookies.set("blue_demo_session", "true", {
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    sameSite: "lax",
    httpOnly: false,
  });

  response.cookies.set("blue_demo_role", role, {
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    sameSite: "lax",
    httpOnly: false,
  });

  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true, message: "Demo session ended" });
  response.cookies.delete("blue_demo_session");
  response.cookies.delete("blue_demo_role");
  return response;
}
