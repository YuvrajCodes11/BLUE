import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import type { RoleSlug } from "@/types/domain";
import type { ReactNode } from "react";

export function DashboardLayout({ role, children }: { role: RoleSlug; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--app-bg)] text-[var(--text)]">
      <Sidebar role={role} />
      <div className="lg:pl-72">
        <Topbar />
        <main className="px-4 py-5 lg:px-6">{children}</main>
      </div>
    </div>
  );
}
