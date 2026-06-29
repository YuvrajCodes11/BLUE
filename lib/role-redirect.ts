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
