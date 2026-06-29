export type RoleSlug = "admin" | "kfs" | "county" | "bmu" | "ranger" | "ngo" | "donor" | "fisher";

export type UserRole =
  | "Government Admin"
  | "KFS Officer"
  | "County Officer"
  | "BMU Manager"
  | "Ranger"
  | "NGO Program Manager"
  | "Donor"
  | "Fisher";

export type Permission =
  | "users.manage"
  | "requests.manage"
  | "fishers.manage"
  | "fishers.view"
  | "vessels.manage"
  | "gear.manage"
  | "catches.create"
  | "catches.validate"
  | "species.view"
  | "landing-sites.manage"
  | "compliance.manage"
  | "reports.export"
  | "gis.view"
  | "projects.manage"
  | "beneficiaries.manage"
  | "donor-impact.view"
  | "settings.manage"
  | "payments.manage"
  | "renewals.manage"
  | "documents.manage"
  | "rangers.manage"
  | "qr.verify";

export type NavItem = { label: string; href: string; permission?: Permission };
export type Stat = { label: string; value: string; trend: string; tone: "cyan" | "emerald" | "amber" | "violet" };
export type TableColumn<T> = { key: keyof T; label: string };

export type RecordStatus = "Active" | "Pending" | "Validated" | "Flagged" | "Draft" | "Closed";

export type FisherRecord = {
  id: string;
  name: string;
  bmu: string;
  county: string;
  phone: string;
  status: RecordStatus;
};

export type VesselRecord = { id: string; vessel: string; owner: string; registration: string; status: RecordStatus };
export type GearRecord = { id: string; gear: string; owner: string; quantity: number; status: RecordStatus };
export type CatchRecord = { id: string; species: string; landingSite: string; weightKg: number; recorder: string; status: RecordStatus };
export type SpeciesRecord = { id: string; species: string; category: string; observations: number; risk: RecordStatus };
export type LandingSiteRecord = { id: string; site: string; county: string; activeFishers: number; status: RecordStatus };
export type ComplianceRecord = { id: string; type: string; officer: string; finding: string; status: RecordStatus };
export type ProjectRecord = { id: string; project: string; donor: string; progress: string; status: RecordStatus };
export type BeneficiaryRecord = { id: string; name: string; program: string; county: string; status: RecordStatus };
export type AccessRequest = { id: string; name: string; email: string; organization: string; status: RecordStatus };

export type ModuleKey =
  | "fishers"
  | "vessels"
  | "gear"
  | "catches"
  | "species"
  | "landing-sites"
  | "compliance"
  | "projects"
  | "beneficiaries"
  | "notifications"
  | "settings";
