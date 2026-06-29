import { can } from "@/lib/roles";
import type { Permission, RoleSlug } from "@/types/domain";
import type { ReactNode } from "react";

export function PermissionGate({ role, permission, children }: { role: RoleSlug; permission: Permission; children: ReactNode }) {
  return can(role, permission) ? <>{children}</> : null;
}
