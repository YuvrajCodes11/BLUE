"use client";

import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { LoadingState } from "@/components/dashboard/LoadingState";
import { createClient, hasSupabaseConfig } from "@/lib/supabase";
import { redirectForRole, slugForRole } from "@/lib/role-redirect";
import { navForRole } from "@/lib/roles";
import Link from "next/link";
import type { RoleSlug } from "@/types/domain";
import type { ReactNode } from "react";

const routeRoles: Record<string, RoleSlug> = {
  admin: "admin",
  kfs: "kfs",
  county: "county",
  bmu: "bmu",
  ranger: "ranger",
  ngo: "ngo",
  donor: "donor",
  fisher: "fisher",
};

function roleFromPath(pathname: string, fallback: RoleSlug) {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 2 && segments[0] === "dashboard") {
    return routeRoles[segments[1]] ?? fallback;
  }
  return fallback;
}

export function DashboardLayout({ role, children }: { role: RoleSlug; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [profileRole, setProfileRole] = useState<RoleSlug>(role);
  const activeRole = roleFromPath(pathname, profileRole);
  const [allowed, setAllowed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setAllowed(false);
    // Check demo session
    const isDemo =
      typeof document !== "undefined" &&
      (document.cookie.includes("blue_demo_session=true") || Boolean(localStorage.getItem("blue_demo_user")));

    if (isDemo) {
      setProfileRole("admin");
      setAllowed(true);
      return;
    }

    if (!hasSupabaseConfig()) {
      setAllowed(true);
      return;
    }
    const supabase = createClient();
    async function guardDashboard() {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (!user) {
        router.push(`/login?next=${encodeURIComponent(pathname)}`);
        return;
      }
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role,is_active,consent_accepted_at,data_usage_accepted_at,onboarding_completed_at")
        .eq("id", user.id)
        .maybeSingle();
      if (error || !profile || profile.is_active === false) {
        await supabase.auth.signOut();
        router.push(`/request-access?email=${encodeURIComponent(user.email ?? "")}`);
        return;
      }
      if (!profile.consent_accepted_at || !profile.data_usage_accepted_at || !profile.onboarding_completed_at) {
        router.push(`/onboarding?next=${encodeURIComponent(pathname)}`);
        return;
      }
      const userSlug = slugForRole(profile.role);
      if (userSlug) setProfileRole(userSlug as RoleSlug);
      const dashboardSegments = pathname.split("/").filter(Boolean);
      const dashboardRoleFromPath = dashboardSegments.length === 2 && dashboardSegments[0] === "dashboard" ? dashboardSegments[1] : null;
      if (dashboardRoleFromPath && routeRoles[dashboardRoleFromPath] && userSlug !== routeRoles[dashboardRoleFromPath]) {
        router.push(redirectForRole(profile.role) ?? "/dashboard");
        return;
      }
      setAllowed(true);
    }
    void guardDashboard();
  }, [pathname, router]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  if (!allowed) {
    return (
      <div className="ocean-app-shell min-h-screen p-8 text-[var(--text)]">
        <LoadingState />
      </div>
    );
  }

  return (
    <div className="ocean-app-shell min-h-screen text-[var(--text)]">
      <Sidebar role={activeRole} />
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" aria-label="Close navigation menu" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-[min(22rem,88vw)] shadow-2xl">
            <Sidebar role={activeRole} mobile onNavigate={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}
      <div className="min-w-0 max-w-full w-full overflow-x-hidden lg:pl-72">
        <Topbar role={activeRole} onMenuClick={() => setMobileMenuOpen(true)} />
        <main className="relative min-w-0 max-w-full w-full px-3.5 pb-36 pt-4 sm:px-6 sm:pb-24 sm:pt-6 lg:px-8 lg:pb-12 lg:pt-8">{children}</main>
        <MobileQuickNav role={activeRole} />
      </div>
    </div>
  );
}

function MobileQuickNav({ role }: { role: RoleSlug }) {
  const pathname = usePathname();
  const nav = navForRole(role).slice(0, 5);
  return (
    <nav className="fixed inset-x-2 sm:inset-x-3 bottom-2.5 sm:bottom-3 z-30 grid grid-cols-5 gap-1 rounded-2xl sm:rounded-3xl border border-[var(--line)] bg-[var(--topbar)] p-1 sm:p-1.5 shadow-2xl backdrop-blur-2xl lg:hidden">
      {nav.map((item) => {
        const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex min-h-11 sm:min-h-12 items-center justify-center rounded-xl sm:rounded-2xl px-1 sm:px-2 text-center text-[10px] sm:text-[11px] font-black leading-tight transition active:scale-95 ${
              active ? "bg-cyan-300 text-slate-950 shadow-sm" : "text-[var(--muted-text)] hover:text-[var(--text)]"
            }`}
          >
            <span className="truncate">
              {item.label.replace("Register Member", "Register").replace("Landing Sites", "Sites").replace("Verify Member QR", "Verify")}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
