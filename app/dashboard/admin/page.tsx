import { AccessRequestsPanel } from "@/components/dashboard/AccessRequestsPanel";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { AdminManagementPanel } from "@/components/dashboard/AdminManagementPanel";

export default function Page() {
  return <><DashboardOverview role="admin" /><AccessRequestsPanel /><AdminManagementPanel /></>;
}
