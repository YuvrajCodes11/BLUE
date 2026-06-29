import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import type { RoleSlug } from "@/types/domain";
import type { ReactNode } from "react";

export function DashboardLayout({ role, children }: { role: RoleSlug; children: ReactNode }) {
  return <div className="min-h-screen bg-[#050b14] text-white"><Sidebar role={role} /><div className="lg:pl-72"><Topbar /><main className="px-5 py-6 lg:px-8">{children}</main></div></div>;
}
