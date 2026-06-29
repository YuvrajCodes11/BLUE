import type { NavItem, Permission, RoleSlug, UserRole } from "@/types/domain";

export const roleLabels: Record<RoleSlug, UserRole> = {
  admin: "Government Admin",
  kfs: "KFS Officer",
  county: "County Officer",
  bmu: "BMU Manager",
  ranger: "Ranger",
  ngo: "NGO Program Manager",
  donor: "Donor",
  fisher: "Fisher",
};

export const rolePermissions: Record<RoleSlug, Permission[]> = {
  admin: ["users.manage", "requests.manage", "fishers.view", "fishers.manage", "vessels.manage", "gear.manage", "catches.validate", "species.view", "landing-sites.manage", "compliance.manage", "reports.export", "gis.view", "projects.manage", "beneficiaries.manage", "donor-impact.view", "settings.manage"],
  kfs: ["fishers.view", "catches.validate", "species.view", "landing-sites.manage", "compliance.manage", "reports.export", "gis.view"],
  county: ["fishers.view", "vessels.manage", "gear.manage", "catches.validate", "landing-sites.manage", "compliance.manage", "reports.export", "gis.view"],
  bmu: ["fishers.manage", "vessels.manage", "gear.manage", "catches.create", "landing-sites.manage", "compliance.manage", "reports.export"],
  ranger: ["fishers.view", "compliance.manage", "gis.view", "reports.export"],
  ngo: ["projects.manage", "beneficiaries.manage", "donor-impact.view", "reports.export", "gis.view"],
  donor: ["donor-impact.view", "reports.export", "gis.view"],
  fisher: ["fishers.view", "catches.create"],
};

export const baseNav: NavItem[] = [
  { label: "Overview", href: "/dashboard" },
  { label: "Fishers", href: "/dashboard/fishers", permission: "fishers.view" },
  { label: "Vessels", href: "/dashboard/vessels", permission: "vessels.manage" },
  { label: "Gear", href: "/dashboard/gear", permission: "gear.manage" },
  { label: "Catches", href: "/dashboard/catches", permission: "catches.create" },
  { label: "Species", href: "/dashboard/species", permission: "species.view" },
  { label: "Landing Sites", href: "/dashboard/landing-sites", permission: "landing-sites.manage" },
  { label: "Compliance", href: "/dashboard/compliance", permission: "compliance.manage" },
  { label: "Reports", href: "/dashboard/reports", permission: "reports.export" },
  { label: "GIS", href: "/dashboard/gis", permission: "gis.view" },
  { label: "Projects", href: "/dashboard/projects", permission: "projects.manage" },
  { label: "Beneficiaries", href: "/dashboard/beneficiaries", permission: "beneficiaries.manage" },
  { label: "Donor Impact", href: "/dashboard/donor-impact", permission: "donor-impact.view" },
  { label: "Notifications", href: "/dashboard/notifications" },
  { label: "Settings", href: "/dashboard/settings" },
];

export function can(role: RoleSlug, permission?: Permission) {
  return !permission || rolePermissions[role].includes(permission);
}

export function navForRole(role: RoleSlug) {
  return baseNav.filter((item) => can(role, item.permission));
}
