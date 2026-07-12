export type DbRole =
  | "Government Admin"
  | "KFS Officer"
  | "County Officer"
  | "BMU Manager"
  | "Ranger"
  | "NGO Program Manager"
  | "Donor"
  | "Fisher";

export const roleRedirects: Record<DbRole, string> = {
  "Government Admin": "/dashboard/admin",
  "KFS Officer": "/dashboard/kfs",
  "County Officer": "/dashboard/county",
  "BMU Manager": "/dashboard/bmu",
  Ranger: "/dashboard/ranger",
  "NGO Program Manager": "/dashboard/ngo",
  Donor: "/dashboard/donor",
  Fisher: "/dashboard/fisher",
};

export function redirectForRole(role: string | null | undefined) {
  if (!role || !(role in roleRedirects)) return null;
  return roleRedirects[role as DbRole];
}

export const roleSlugs: Record<DbRole, string> = {
  "Government Admin": "admin",
  "KFS Officer": "kfs",
  "County Officer": "county",
  "BMU Manager": "bmu",
  Ranger: "ranger",
  "NGO Program Manager": "ngo",
  Donor: "donor",
  Fisher: "fisher",
};

export function slugForRole(role: string | null | undefined) {
  if (!role || !(role in roleSlugs)) return null;
  return roleSlugs[role as DbRole];
}
