import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import type { ReactNode } from "react";

export default function Layout({ children }: { children: ReactNode }) {
  return <DashboardLayout role="admin">{children}</DashboardLayout>;
}
