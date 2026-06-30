"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
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
  const segment = pathname.split("/")[2];
  return routeRoles[segment] ?? fallback;
}

export function DashboardLayout({ role, children }: { role: RoleSlug; children: ReactNode }) {
  const pathname = usePathname();
  const activeRole = roleFromPath(pathname, role);

  return (
    <div className="min-h-screen bg-[var(--app-bg)] text-[var(--text)]">
      <Sidebar role={activeRole} />
      <div className="lg:pl-72">
        <Topbar />
        <main className="px-4 py-5 lg:px-6">{children}</main>
      </div>
    </div>
  );
}
