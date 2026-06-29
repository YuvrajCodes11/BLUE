import { beneficiaries, catches, compliance, fishers, gear, landingSites, projects, species, vessels } from "@/lib/mock-data";
import type { SimpleColumn, TableRow } from "@/components/dashboard/DataTable";
import type { ModuleKey } from "@/types/domain";

type ModuleConfig = {
  title: string;
  description: string;
  createLabel: string;
  records: TableRow[];
  columns: SimpleColumn[];
};

export const moduleConfigs = {
  fishers: {
    title: "Fisher Registration",
    description: "Register, verify, and manage BMU-linked fisher profiles, documents, and membership status.",
    createLabel: "Register fisher",
    records: fishers,
    columns: [
      { key: "id", label: "Fisher ID" },
      { key: "name", label: "Name" },
      { key: "bmu", label: "BMU" },
      { key: "county", label: "County" },
      { key: "status", label: "Status" },
    ],
  },
  vessels: {
    title: "Vessel Registration",
    description: "Track vessel ownership, registration numbers, renewal status, and fisher linkage.",
    createLabel: "Register vessel",
    records: vessels,
    columns: [
      { key: "id", label: "ID" },
      { key: "vessel", label: "Vessel" },
      { key: "owner", label: "Owner" },
      { key: "registration", label: "Registration" },
      { key: "status", label: "Status" },
    ],
  },
  gear: {
    title: "Fishing Gear",
    description: "Maintain approved gear types, ownership, quantities, and compliance state.",
    createLabel: "Add gear",
    records: gear,
    columns: [
      { key: "id", label: "ID" },
      { key: "gear", label: "Gear" },
      { key: "owner", label: "Owner" },
      { key: "quantity", label: "Quantity" },
      { key: "status", label: "Status" },
    ],
  },
  catches: {
    title: "Catch Assessment",
    description: "Capture landing statistics, species composition, recorder, and KFS validation state.",
    createLabel: "Submit catch",
    records: catches,
    columns: [
      { key: "id", label: "ID" },
      { key: "species", label: "Species" },
      { key: "landingSite", label: "Landing Site" },
      { key: "weightKg", label: "Kg" },
      { key: "status", label: "Status" },
    ],
  },
  species: {
    title: "Species Monitoring",
    description: "Monitor species observations, ecological categories, and conservation risk signals.",
    createLabel: "Add observation",
    records: species,
    columns: [
      { key: "id", label: "ID" },
      { key: "species", label: "Species" },
      { key: "category", label: "Category" },
      { key: "observations", label: "Observations" },
      { key: "risk", label: "Risk" },
    ],
  },
  "landing-sites": {
    title: "Landing Site Monitoring",
    description: "Track landing sites, active fishers, counties, production activity, and monitoring reports.",
    createLabel: "Add site",
    records: landingSites,
    columns: [
      { key: "id", label: "ID" },
      { key: "site", label: "Site" },
      { key: "county", label: "County" },
      { key: "activeFishers", label: "Fishers" },
      { key: "status", label: "Status" },
    ],
  },
  compliance: {
    title: "Compliance Monitoring",
    description: "Record inspections, patrol findings, enforcement actions, and follow-up status.",
    createLabel: "Create inspection",
    records: compliance,
    columns: [
      { key: "id", label: "ID" },
      { key: "type", label: "Type" },
      { key: "officer", label: "Officer" },
      { key: "finding", label: "Finding" },
      { key: "status", label: "Status" },
    ],
  },
  projects: {
    title: "NGO Projects",
    description: "Manage programs, activities, milestones, evidence, donors, and delivery progress.",
    createLabel: "Create project",
    records: projects,
    columns: [
      { key: "id", label: "ID" },
      { key: "project", label: "Project" },
      { key: "donor", label: "Donor" },
      { key: "progress", label: "Progress" },
      { key: "status", label: "Status" },
    ],
  },
  beneficiaries: {
    title: "Beneficiaries",
    description: "Track people, groups, and communities reached by blue economy and conservation programs.",
    createLabel: "Add beneficiary",
    records: beneficiaries,
    columns: [
      { key: "id", label: "ID" },
      { key: "name", label: "Name" },
      { key: "program", label: "Program" },
      { key: "county", label: "County" },
      { key: "status", label: "Status" },
    ],
  },
} satisfies Record<Exclude<ModuleKey, "notifications" | "settings">, ModuleConfig>;
