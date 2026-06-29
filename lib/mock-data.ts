import type { AccessRequest, BeneficiaryRecord, CatchRecord, ComplianceRecord, FisherRecord, GearRecord, LandingSiteRecord, ProjectRecord, RoleSlug, SpeciesRecord, Stat, VesselRecord } from "@/types/domain";

export const dashboardStats: Record<RoleSlug, Stat[]> = {
  admin: [
    { label: "Platform users", value: "1,248", trend: "+14%", tone: "cyan" },
    { label: "Access requests", value: "38", trend: "12 pending", tone: "amber" },
    { label: "Counties active", value: "17", trend: "+3", tone: "emerald" },
    { label: "System health", value: "99.9%", trend: "stable", tone: "violet" },
  ],
  kfs: [
    { label: "Catch validations", value: "312", trend: "+22%", tone: "cyan" },
    { label: "Compliance flags", value: "19", trend: "5 urgent", tone: "amber" },
    { label: "Species records", value: "86", trend: "+8", tone: "emerald" },
    { label: "Landing sites", value: "123", trend: "national", tone: "violet" },
  ],
  county: [
    { label: "County BMUs", value: "24", trend: "+2", tone: "cyan" },
    { label: "Active fishers", value: "8,420", trend: "+11%", tone: "emerald" },
    { label: "Monthly catch", value: "128t", trend: "+7%", tone: "violet" },
    { label: "Open cases", value: "14", trend: "review", tone: "amber" },
  ],
  bmu: [
    { label: "Fishers", value: "842", trend: "+18", tone: "cyan" },
    { label: "Vessels", value: "216", trend: "+6", tone: "emerald" },
    { label: "Revenue", value: "KES 182k", trend: "+21%", tone: "violet" },
    { label: "Meetings", value: "4", trend: "this month", tone: "amber" },
  ],
  ranger: [
    { label: "Patrols", value: "31", trend: "+9", tone: "cyan" },
    { label: "Inspections", value: "74", trend: "+16%", tone: "emerald" },
    { label: "Incidents", value: "8", trend: "2 open", tone: "amber" },
    { label: "Evidence files", value: "146", trend: "stored", tone: "violet" },
  ],
  ngo: [
    { label: "Projects", value: "12", trend: "+3", tone: "cyan" },
    { label: "Beneficiaries", value: "5,860", trend: "+19%", tone: "emerald" },
    { label: "Activities", value: "214", trend: "tracked", tone: "violet" },
    { label: "Risk items", value: "7", trend: "monitor", tone: "amber" },
  ],
  donor: [
    { label: "Funded projects", value: "9", trend: "live", tone: "cyan" },
    { label: "Impact score", value: "86%", trend: "+6%", tone: "emerald" },
    { label: "Milestones", value: "72", trend: "validated", tone: "violet" },
    { label: "Open risks", value: "4", trend: "low", tone: "amber" },
  ],
  fisher: [
    { label: "Membership", value: "Active", trend: "valid", tone: "emerald" },
    { label: "Vessels", value: "1", trend: "registered", tone: "cyan" },
    { label: "Catch entries", value: "42", trend: "+4", tone: "violet" },
    { label: "Documents", value: "6", trend: "uploaded", tone: "amber" },
  ],
};

export const fishers: FisherRecord[] = [
  { id: "FSH-2026-0412", name: "Amina Mwakio", bmu: "Kilifi Creek BMU", county: "Kilifi", phone: "+254 701 880 114", status: "Active" },
  { id: "FSH-2026-0529", name: "Joseph Otieno", bmu: "Diani Reef BMU", county: "Kwale", phone: "+254 733 100 901", status: "Pending" },
  { id: "FSH-2026-0620", name: "Mary Wanjiku", bmu: "Homa Bay Central", county: "Homa Bay", phone: "+254 712 000 448", status: "Validated" },
];
export const vessels: VesselRecord[] = [
  { id: "VES-001", vessel: "Kilifi Star 07", owner: "Amina Mwakio", registration: "KE-VES-8821", status: "Active" },
  { id: "VES-002", vessel: "Blue Reef", owner: "Joseph Otieno", registration: "KE-VES-1174", status: "Pending" },
];
export const gear: GearRecord[] = [
  { id: "GER-001", gear: "Gill net", owner: "Amina Mwakio", quantity: 4, status: "Active" },
  { id: "GER-002", gear: "Handline", owner: "Mary Wanjiku", quantity: 12, status: "Validated" },
];
export const catches: CatchRecord[] = [
  { id: "CAT-001", species: "Tuna", landingSite: "Kilifi Landing", weightKg: 420, recorder: "BMU Clerk", status: "Validated" },
  { id: "CAT-002", species: "Rabbitfish", landingSite: "Diani Jetty", weightKg: 118, recorder: "Fisher", status: "Pending" },
];
export const species: SpeciesRecord[] = [
  { id: "SP-001", species: "Yellowfin Tuna", category: "Pelagic", observations: 184, risk: "Active" },
  { id: "SP-002", species: "Parrotfish", category: "Reef", observations: 73, risk: "Flagged" },
];
export const landingSites: LandingSiteRecord[] = [
  { id: "LS-001", site: "Kilifi Landing", county: "Kilifi", activeFishers: 842, status: "Active" },
  { id: "LS-002", site: "Diani Jetty", county: "Kwale", activeFishers: 516, status: "Active" },
];
export const compliance: ComplianceRecord[] = [
  { id: "CMP-001", type: "Landing site inspection", officer: "Ranger Otieno", finding: "Two vessels missing markings", status: "Pending" },
  { id: "CMP-002", type: "Patrol report", officer: "KFS Officer Mwangi", finding: "Protected zone respected", status: "Closed" },
];
export const projects: ProjectRecord[] = [
  { id: "PRJ-001", project: "Reef Recovery Program", donor: "Ocean Futures Fund", progress: "74%", status: "Active" },
  { id: "PRJ-002", project: "BMU Digital Records", donor: "Blue Coast Trust", progress: "52%", status: "Active" },
];
export const beneficiaries: BeneficiaryRecord[] = [
  { id: "BEN-001", name: "Kilifi Women Fish Traders", program: "Market Access", county: "Kilifi", status: "Active" },
  { id: "BEN-002", name: "Diani Youth Rangers", program: "Conservation Jobs", county: "Kwale", status: "Validated" },
];
export const accessRequests: AccessRequest[] = [
  { id: "REQ-001", name: "Jane Achieng", email: "jane@example.org", organization: "Coastal Conservation Group", status: "Pending" },
  { id: "REQ-002", name: "Daniel Mwita", email: "daniel@example.org", organization: "County Fisheries Office", status: "Validated" },
];
