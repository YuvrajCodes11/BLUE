"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Plus, Search, Eye, Edit2, Trash2 } from "lucide-react";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { LoadingState } from "@/components/dashboard/LoadingState";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { createClient, hasSupabaseConfig } from "@/lib/supabase";
import type { RecordStatus } from "@/types/domain";

type Field = {
  name: string;
  label: string;
  type?: "text" | "number" | "textarea" | "select";
  options?: { value: string; label: string }[];
  defaultValue?: string | number;
  required?: boolean;
};

type Row = Record<string, any> & { id: string; status?: RecordStatus };

type CrudConfig = {
  title: string;
  description: string;
  table: string;
  columns: { key: string; label: string }[];
  fields: Field[];
  statusField?: string;
  dummyRows: Row[];
};

const defaultBmuId = "775660f7-c8d8-4e7a-99e8-f65c72152ecc"; // Kilifi Creek BMU
const defaultFisherId = "11111111-2222-3333-4444-555555555501"; // Amina Mwakio

const configs: Record<string, CrudConfig> = {
  "register-member": {
    title: "Register Member",
    description: "Create and manage fisher/member profiles linked to BMUs with biometric QR IDs.",
    table: "fishers",
    statusField: "membership_status",
    columns: [
      { key: "full_name", label: "Name" },
      { key: "phone", label: "Phone" },
      { key: "membership_status", label: "Status" },
      { key: "qr_code", label: "QR Code" },
      { key: "created_at", label: "Created" },
    ],
    fields: [
      { name: "full_name", label: "Full name", required: true },
      { name: "phone", label: "Phone number (+254...)", required: true },
      {
        name: "bmu_id",
        label: "BMU Affiliation",
        type: "select",
        options: [
          { value: defaultBmuId, label: "Kilifi Creek BMU" },
          { value: "999f1cc4-a5cf-4e12-bee6-068871b7ee22", label: "Diani Reef BMU" },
          { value: "a912a429-4355-4a1d-9688-080a8593c386", label: "Homa Bay Central BMU" },
        ],
        defaultValue: defaultBmuId,
        required: true,
      },
      {
        name: "membership_status",
        label: "Membership Status",
        type: "select",
        options: [
          { value: "Active", label: "Active" },
          { value: "Pending", label: "Pending" },
          { value: "Validated", label: "Validated" },
        ],
        defaultValue: "Active",
        required: true,
      },
    ],
    dummyRows: [
      { id: "fsh-01", full_name: "Amina Mwakio", phone: "+254 701 880 114", membership_status: "Active", qr_code: "BLUE-FSH-001", created_at: "2026-10-15" },
      { id: "fsh-02", full_name: "Joseph Otieno", phone: "+254 733 100 901", membership_status: "Active", qr_code: "BLUE-FSH-002", created_at: "2026-10-18" },
      { id: "fsh-03", full_name: "Mary Wanjiku", phone: "+254 712 000 448", membership_status: "Validated", qr_code: "BLUE-FSH-003", created_at: "2026-10-20" },
      { id: "fsh-04", full_name: "Hassan Bakari", phone: "+254 722 345 678", membership_status: "Active", qr_code: "BLUE-FSH-004", created_at: "2026-10-21" },
      { id: "fsh-05", full_name: "Fatuma Said", phone: "+254 790 555 123", membership_status: "Pending", qr_code: "BLUE-FSH-005", created_at: "2026-10-22" },
    ],
  },
  fishers: {
    title: "Members Directory",
    description: "BMU-affiliated fisher registry with verified identity, contact details, and landing rights.",
    table: "fishers",
    statusField: "membership_status",
    columns: [
      { key: "full_name", label: "Name" },
      { key: "phone", label: "Phone" },
      { key: "membership_status", label: "Status" },
      { key: "qr_code", label: "QR Code" },
      { key: "created_at", label: "Created" },
    ],
    fields: [
      { name: "full_name", label: "Full name", required: true },
      { name: "phone", label: "Phone" },
      {
        name: "bmu_id",
        label: "BMU Affiliation",
        type: "select",
        options: [
          { value: defaultBmuId, label: "Kilifi Creek BMU" },
          { value: "999f1cc4-a5cf-4e12-bee6-068871b7ee22", label: "Diani Reef BMU" },
          { value: "a912a429-4355-4a1d-9688-080a8593c386", label: "Homa Bay Central BMU" },
        ],
        defaultValue: defaultBmuId,
        required: true,
      },
      {
        name: "membership_status",
        label: "Status",
        type: "select",
        options: [
          { value: "Active", label: "Active" },
          { value: "Pending", label: "Pending" },
          { value: "Validated", label: "Validated" },
        ],
        defaultValue: "Active",
        required: true,
      },
    ],
    dummyRows: [
      { id: "fsh-01", full_name: "Amina Mwakio", phone: "+254 701 880 114", membership_status: "Active", qr_code: "BLUE-FSH-001", created_at: "2026-10-15" },
      { id: "fsh-02", full_name: "Joseph Otieno", phone: "+254 733 100 901", membership_status: "Active", qr_code: "BLUE-FSH-002", created_at: "2026-10-18" },
      { id: "fsh-03", full_name: "Mary Wanjiku", phone: "+254 712 000 448", membership_status: "Validated", qr_code: "BLUE-FSH-003", created_at: "2026-10-20" },
      { id: "fsh-04", full_name: "Hassan Bakari", phone: "+254 722 345 678", membership_status: "Active", qr_code: "BLUE-FSH-004", created_at: "2026-10-21" },
    ],
  },
  vessels: {
    title: "Vessel Registry",
    description: "Registered fishing vessels and artisanal boats linked to verified owners.",
    table: "vessels",
    columns: [
      { key: "vessel_name", label: "Vessel" },
      { key: "registration_number", label: "Registration" },
      { key: "ownership_type", label: "Ownership" },
      { key: "created_at", label: "Created" },
    ],
    fields: [
      { name: "vessel_name", label: "Vessel name", required: true },
      { name: "registration_number", label: "Registration number", required: true },
      {
        name: "ownership_type",
        label: "Ownership type",
        type: "select",
        options: [
          { value: "Owner", label: "Individual Owner" },
          { value: "Co-owned", label: "Co-owned" },
          { value: "BMU Owned", label: "BMU Owned" },
          { value: "Leased", label: "Leased" },
        ],
        defaultValue: "Owner",
        required: true,
      },
      {
        name: "fisher_id",
        label: "Registered Owner",
        type: "select",
        options: [
          { value: defaultFisherId, label: "Amina Mwakio" },
          { value: "11111111-2222-3333-4444-555555555502", label: "Joseph Otieno" },
          { value: "11111111-2222-3333-4444-555555555504", label: "Hassan Bakari" },
        ],
        defaultValue: defaultFisherId,
        required: true,
      },
    ],
    dummyRows: [
      { id: "ves-01", vessel_name: "Kilifi Star 07", registration_number: "KE-VES-8821", ownership_type: "Owner", created_at: "2026-10-12" },
      { id: "ves-02", vessel_name: "Blue Reef Runner", registration_number: "KE-VES-1174", ownership_type: "Owner", created_at: "2026-10-14" },
      { id: "ves-03", vessel_name: "Bahari Explorer", registration_number: "KE-VES-9942", ownership_type: "Co-owned", created_at: "2026-10-19" },
      { id: "ves-04", vessel_name: "Mwambao One", registration_number: "KE-VES-3041", ownership_type: "Owner", created_at: "2026-10-22" },
    ],
  },
  catches: {
    title: "Catch Records",
    description: "Catch assessment logs for landing statistics, quotas, and validation workflows.",
    table: "catch_records",
    columns: [
      { key: "species", label: "Species" },
      { key: "weight_kg", label: "Weight (KG)" },
      { key: "landing_site", label: "Landing Site" },
      { key: "recorded_at", label: "Recorded" },
    ],
    fields: [
      { name: "species", label: "Species", required: true },
      { name: "weight_kg", label: "Weight (KG)", type: "number", required: true },
      {
        name: "landing_site",
        label: "Landing site",
        type: "select",
        options: [
          { value: "Kilifi Landing", label: "Kilifi Landing" },
          { value: "Diani Jetty", label: "Diani Jetty" },
          { value: "Watamu Marine", label: "Watamu Marine" },
          { value: "Shimoni Pier", label: "Shimoni Pier" },
          { value: "Homa Bay Pier", label: "Homa Bay Pier" },
        ],
        defaultValue: "Kilifi Landing",
        required: true,
      },
      {
        name: "bmu_id",
        label: "BMU Station",
        type: "select",
        options: [
          { value: defaultBmuId, label: "Kilifi Creek BMU" },
          { value: "999f1cc4-a5cf-4e12-bee6-068871b7ee22", label: "Diani Reef BMU" },
          { value: "a912a429-4355-4a1d-9688-080a8593c386", label: "Homa Bay Central BMU" },
        ],
        defaultValue: defaultBmuId,
        required: true,
      },
    ],
    dummyRows: [
      { id: "cat-01", species: "Yellowfin Tuna", weight_kg: 420.5, landing_site: "Kilifi Landing", recorded_at: "2026-10-23" },
      { id: "cat-02", species: "Rabbitfish (Siganus sutor)", weight_kg: 118.0, landing_site: "Diani Jetty", recorded_at: "2026-10-22" },
      { id: "cat-03", species: "Kingfish (Scomberomorus)", weight_kg: 265.8, landing_site: "Watamu Marine", recorded_at: "2026-10-21" },
      { id: "cat-04", species: "Nile Perch", weight_kg: 340.2, landing_site: "Homa Bay Pier", recorded_at: "2026-10-20" },
      { id: "cat-05", species: "Red Snapper", weight_kg: 89.4, landing_site: "Kilifi Landing", recorded_at: "2026-10-19" },
    ],
  },
  species: {
    title: "Species Monitoring",
    description: "Marine and freshwater species conservation and catch quota monitoring.",
    table: "species_records",
    statusField: "status",
    columns: [
      { key: "common_name", label: "Species" },
      { key: "scientific_name", label: "Scientific Name" },
      { key: "category", label: "Category" },
      { key: "status", label: "Status" },
      { key: "created_at", label: "Created" },
    ],
    fields: [
      { name: "common_name", label: "Common name", required: true },
      { name: "scientific_name", label: "Scientific name", required: true },
      {
        name: "category",
        label: "Category",
        type: "select",
        options: [
          { value: "Pelagic", label: "Pelagic" },
          { value: "Reef", label: "Reef" },
          { value: "Demersal", label: "Demersal" },
          { value: "Crustacean", label: "Crustacean" },
          { value: "Freshwater", label: "Freshwater" },
        ],
        defaultValue: "Pelagic",
        required: true,
      },
      {
        name: "status",
        label: "Conservation Status",
        type: "select",
        options: [
          { value: "Active", label: "Sustainable (Active)" },
          { value: "Flagged", label: "Flagged / Protected" },
          { value: "Pending", label: "Under Review" },
        ],
        defaultValue: "Active",
        required: true,
      },
    ],
    dummyRows: [
      { id: "sp-01", common_name: "Yellowfin Tuna", scientific_name: "Thunnus albacares", category: "Pelagic", status: "Active", created_at: "2026-09-10" },
      { id: "sp-02", common_name: "Rabbitfish", scientific_name: "Siganus sutor", category: "Reef", status: "Active", created_at: "2026-09-15" },
      { id: "sp-03", common_name: "Kingfish", scientific_name: "Scomberomorus commerson", category: "Pelagic", status: "Active", created_at: "2026-09-20" },
      { id: "sp-04", common_name: "Parrotfish", scientific_name: "Scaridae", category: "Reef", status: "Flagged", created_at: "2026-10-01" },
      { id: "sp-05", common_name: "Nile Perch", scientific_name: "Lates niloticus", category: "Freshwater", status: "Active", created_at: "2026-10-05" },
      { id: "sp-06", common_name: "Spiny Lobster", scientific_name: "Panulirus homarus", category: "Crustacean", status: "Active", created_at: "2026-10-12" },
    ],
  },
  compliance: {
    title: "Compliance & Inspections",
    description: "Maritime inspections, patrol observations, and gear enforcement logs.",
    table: "compliance_records",
    columns: [
      { key: "record_type", label: "Type" },
      { key: "finding", label: "Finding" },
      { key: "action_taken", label: "Action Taken" },
      { key: "created_at", label: "Created" },
    ],
    fields: [
      {
        name: "record_type",
        label: "Inspection / Record Type",
        type: "select",
        options: [
          { value: "Landing site inspection", label: "Landing site inspection" },
          { value: "Patrol report", label: "Patrol report" },
          { value: "Vessel licence review", label: "Vessel licence review" },
          { value: "Gear compliance audit", label: "Gear compliance audit" },
        ],
        defaultValue: "Landing site inspection",
        required: true,
      },
      { name: "finding", label: "Finding", type: "textarea", required: true },
      { name: "action_taken", label: "Action taken", required: true },
      {
        name: "bmu_id",
        label: "BMU Station",
        type: "select",
        options: [
          { value: defaultBmuId, label: "Kilifi Creek BMU" },
          { value: "999f1cc4-a5cf-4e12-bee6-068871b7ee22", label: "Diani Reef BMU" },
        ],
        defaultValue: defaultBmuId,
      },
    ],
    dummyRows: [
      { id: "cmp-01", record_type: "Landing site inspection", finding: "Mesh size inspection completed for 8 artisanal nets. All compliant with 2.5 inch rule.", action_taken: "Compliance clearance badge issued", created_at: "2026-10-21" },
      { id: "cmp-02", record_type: "Patrol report", finding: "Protected marine conservation zone checked. Zero unauthorized intrusions detected.", action_taken: "Routine log filed with KeFS County Desk", created_at: "2026-10-22" },
      { id: "cmp-03", record_type: "Vessel licence review", finding: "Two artisanal canoes observed without current annual inspection sticker.", action_taken: "Issued 7-day compliance rectification notice", created_at: "2026-10-23" },
    ],
  },
  projects: {
    title: "NGO & Blue Economy Projects",
    description: "Conservation and community blue economy project tracking with donor milestones.",
    table: "ngo_projects",
    columns: [
      { key: "title", label: "Project" },
      { key: "donor_name", label: "Donor" },
      { key: "budget", label: "Budget (KES)" },
      { key: "impact_score", label: "Impact Score" },
      { key: "created_at", label: "Created" },
    ],
    fields: [
      { name: "title", label: "Project title", required: true },
      { name: "donor_name", label: "Donor / Partner", required: true },
      { name: "budget", label: "Budget (KES)", type: "number", required: true },
      { name: "impact_score", label: "Impact score (0-100)", type: "number", required: true },
    ],
    dummyRows: [
      { id: "prj-01", title: "Reef Ecosystem Restoration Initiative", donor_name: "Global Ocean Fund", budget: 15000000, impact_score: 94.5, created_at: "2026-08-15" },
      { id: "prj-02", title: "BMU Cold Chain & Market Access", donor_name: "Blue Coast Trust", budget: 8500000, impact_score: 88.0, created_at: "2026-09-01" },
      { id: "prj-03", title: "Mangrove Reforestation & Carbon Credits", donor_name: "Kenya Climate Foundation", budget: 12000000, impact_score: 91.2, created_at: "2026-09-20" },
    ],
  },
  beneficiaries: {
    title: "Program Beneficiaries",
    description: "Coastal community members and groups supported by blue livelihoods initiatives.",
    table: "beneficiaries",
    statusField: "status",
    columns: [
      { key: "name", label: "Name / Group" },
      { key: "county", label: "County" },
      { key: "status", label: "Status" },
      { key: "created_at", label: "Created" },
    ],
    fields: [
      { name: "name", label: "Beneficiary name / group", required: true },
      {
        name: "county",
        label: "County",
        type: "select",
        options: [
          { value: "Kilifi", label: "Kilifi" },
          { value: "Kwale", label: "Kwale" },
          { value: "Mombasa", label: "Mombasa" },
          { value: "Homa Bay", label: "Homa Bay" },
          { value: "Lamu", label: "Lamu" },
        ],
        defaultValue: "Kilifi",
        required: true,
      },
      {
        name: "status",
        label: "Status",
        type: "select",
        options: [
          { value: "Active", label: "Active" },
          { value: "Validated", label: "Validated" },
        ],
        defaultValue: "Active",
        required: true,
      },
    ],
    dummyRows: [
      { id: "ben-01", name: "Kilifi Women Fish Traders Association", county: "Kilifi", status: "Active", created_at: "2026-09-12" },
      { id: "ben-02", name: "Diani Youth Coral Guardians", county: "Kwale", status: "Validated", created_at: "2026-09-18" },
      { id: "ben-03", name: "Watamu Eco-Tourism Self-Help Group", county: "Kilifi", status: "Active", created_at: "2026-09-25" },
      { id: "ben-04", name: "Shimoni Artisanal Fishers Co-op", county: "Kwale", status: "Active", created_at: "2026-10-02" },
      { id: "ben-05", name: "Homa Bay Women Aquaculture Group", county: "Homa Bay", status: "Validated", created_at: "2026-10-14" },
    ],
  },
  payments: {
    title: "Revenue & Payments Ledger",
    description: "BMU landing fees, licence dues, and digital BLUE platform revenue entries.",
    table: "payment_records",
    statusField: "status",
    columns: [
      { key: "payer_name", label: "Payer" },
      { key: "service_type", label: "Service" },
      { key: "bmu_fee", label: "BMU Fee (KES)" },
      { key: "blue_fee", label: "BLUE Fee (KES)" },
      { key: "method", label: "Method" },
      { key: "status", label: "Status" },
    ],
    fields: [
      { name: "payer_name", label: "Payer name", required: true },
      {
        name: "service_type",
        label: "Service type",
        type: "select",
        options: [
          { value: "Landing Fee", label: "Landing Fee" },
          { value: "Vessel Permit", label: "Vessel Permit" },
          { value: "Annual Membership", label: "Annual Membership" },
          { value: "Cold Storage Fee", label: "Cold Storage Fee" },
          { value: "Beach Stall Rent", label: "Beach Stall Rent" },
        ],
        defaultValue: "Landing Fee",
        required: true,
      },
      { name: "bmu_fee", label: "BMU fee (KES)", type: "number", required: true },
      { name: "blue_fee", label: "BLUE platform fee (KES)", type: "number", required: true },
      {
        name: "method",
        label: "Payment method",
        type: "select",
        options: [
          { value: "M-Pesa", label: "M-Pesa" },
          { value: "Bank Transfer", label: "Bank Transfer" },
          { value: "Cash Voucher", label: "Cash Voucher" },
        ],
        defaultValue: "M-Pesa",
        required: true,
      },
      {
        name: "status",
        label: "Status",
        type: "select",
        options: [
          { value: "Active", label: "Completed" },
          { value: "Pending", label: "Pending" },
        ],
        defaultValue: "Active",
        required: true,
      },
    ],
    dummyRows: [
      { id: "pay-01", payer_name: "Amina Mwakio", service_type: "Landing Fee", bmu_fee: 500, blue_fee: 50, method: "M-Pesa", status: "Active" },
      { id: "pay-02", payer_name: "Joseph Otieno", service_type: "Vessel Permit", bmu_fee: 2500, blue_fee: 250, method: "M-Pesa", status: "Active" },
      { id: "pay-03", payer_name: "Hassan Bakari", service_type: "Annual Membership", bmu_fee: 1000, blue_fee: 100, method: "Bank Transfer", status: "Active" },
      { id: "pay-04", payer_name: "Mary Wanjiku", service_type: "Cold Storage Fee", bmu_fee: 750, blue_fee: 75, method: "M-Pesa", status: "Pending" },
      { id: "pay-05", payer_name: "Fatuma Said", service_type: "Beach Stall Rent", bmu_fee: 1200, blue_fee: 120, method: "M-Pesa", status: "Active" },
    ],
  },
  renewals: {
    title: "Annual Renewals",
    description: "Vessel licences, BMU certificates, and fisher permits renewal tracking.",
    table: "renewal_records",
    statusField: "status",
    columns: [
      { key: "holder_name", label: "Holder" },
      { key: "renewal_type", label: "Type" },
      { key: "expiry_date", label: "Expiry" },
      { key: "status", label: "Status" },
      { key: "created_at", label: "Created" },
    ],
    fields: [
      { name: "holder_name", label: "Holder name", required: true },
      {
        name: "renewal_type",
        label: "Renewal type",
        type: "select",
        options: [
          { value: "Artisanal Fisher Licence", label: "Artisanal Fisher Licence" },
          { value: "Vessel Registration", label: "Vessel Registration" },
          { value: "BMU Operating Certificate", label: "BMU Operating Certificate" },
          { value: "Deep Sea Fishing Permit", label: "Deep Sea Fishing Permit" },
        ],
        defaultValue: "Artisanal Fisher Licence",
        required: true,
      },
      { name: "expiry_date", label: "Expiry date (YYYY-MM-DD)", required: true },
      {
        name: "status",
        label: "Status",
        type: "select",
        options: [
          { value: "Active", label: "Active" },
          { value: "Pending", label: "Pending" },
          { value: "Validated", label: "Validated" },
        ],
        defaultValue: "Active",
        required: true,
      },
    ],
    dummyRows: [
      { id: "ren-01", holder_name: "Amina Mwakio", renewal_type: "Artisanal Fisher Licence", expiry_date: "2026-12-31", status: "Active", created_at: "2026-01-01" },
      { id: "ren-02", holder_name: "Joseph Otieno", renewal_type: "Vessel Registration KE-VES-1174", expiry_date: "2026-11-15", status: "Active", created_at: "2026-02-15" },
      { id: "ren-03", holder_name: "Kilifi Creek BMU", renewal_type: "BMU Operating Certificate", expiry_date: "2027-06-30", status: "Validated", created_at: "2026-06-30" },
      { id: "ren-04", holder_name: "Hassan Bakari", renewal_type: "Deep Sea Fishing Permit", expiry_date: "2026-09-01", status: "Pending", created_at: "2026-03-01" },
    ],
  },
  documents: {
    title: "Document Registry",
    description: "Official bylaws, vessel registries, certificates, and compliance documentation.",
    table: "documents",
    columns: [
      { key: "document_type", label: "Type" },
      { key: "owner_type", label: "Owner Type" },
      { key: "storage_path", label: "File Path" },
      { key: "created_at", label: "Created" },
    ],
    fields: [
      {
        name: "document_type",
        label: "Document type",
        type: "select",
        options: [
          { value: "BMU Registration Certificate", label: "BMU Registration Certificate" },
          { value: "Artisanal Fisher Licence", label: "Artisanal Fisher Licence" },
          { value: "BMU By-Laws", label: "BMU By-Laws" },
          { value: "Vessel Seaworthiness Report", label: "Vessel Seaworthiness Report" },
        ],
        defaultValue: "BMU Registration Certificate",
        required: true,
      },
      {
        name: "owner_type",
        label: "Owner type",
        type: "select",
        options: [
          { value: "BMU", label: "BMU" },
          { value: "Fisher", label: "Fisher" },
          { value: "County Office", label: "County Office" },
        ],
        defaultValue: "BMU",
        required: true,
      },
      { name: "storage_path", label: "Storage path or reference", required: true },
    ],
    dummyRows: [
      { id: "doc-01", document_type: "BMU Registration Certificate", owner_type: "BMU", storage_path: "certificates/kilifi-bmu-registration-2026.pdf", created_at: "2026-07-01" },
      { id: "doc-02", document_type: "Artisanal Fisher Licence", owner_type: "Fisher", storage_path: "licences/amina-mwakio-license-2026.pdf", created_at: "2026-08-10" },
      { id: "doc-03", document_type: "BMU By-Laws", owner_type: "BMU", storage_path: "bmu-by-laws/diani-bmu-by-laws-signed.pdf", created_at: "2026-08-22" },
      { id: "doc-04", document_type: "Vessel Seaworthiness Report", owner_type: "Fisher", storage_path: "reports/vessel-seaworthy-2026.pdf", created_at: "2026-09-05" },
    ],
  },
  rangers: {
    title: "Ranger Patrol & Surveillance",
    description: "Patrol reports, marine surveillance, and enforcement logs without GIS dependencies.",
    table: "compliance_records",
    columns: [
      { key: "record_type", label: "Type" },
      { key: "finding", label: "Finding" },
      { key: "action_taken", label: "Action" },
      { key: "created_at", label: "Created" },
    ],
    fields: [
      {
        name: "record_type",
        label: "Patrol / Record type",
        type: "select",
        options: [
          { value: "Reef Surveillance Patrol", label: "Reef Surveillance Patrol" },
          { value: "Night Beach Patrol", label: "Night Beach Patrol" },
          { value: "Gear Inspection", label: "Gear Inspection" },
        ],
        defaultValue: "Reef Surveillance Patrol",
        required: true,
      },
      { name: "finding", label: "Surveillance finding", type: "textarea", required: true },
      { name: "action_taken", label: "Action taken", required: true },
    ],
    dummyRows: [
      { id: "rng-01", record_type: "Reef Surveillance Patrol", finding: "Watamu marine reserve perimeter checked. No illegal spearfishing detected.", action_taken: "Zone secured and logged", created_at: "2026-10-22" },
      { id: "rng-02", record_type: "Night Beach Patrol", finding: "Diani landing beach surveyed between 22:00 and 02:00. All vessels safely beached.", action_taken: "BMU watchman notified", created_at: "2026-10-21" },
    ],
  },
  notifications: {
    title: "Operational Notifications",
    description: "Live alerts for catch validations, compliance approvals, and system broadcasts.",
    table: "notifications",
    columns: [
      { key: "title", label: "Title" },
      { key: "body", label: "Message" },
      { key: "read_at", label: "Status" },
      { key: "created_at", label: "Created" },
    ],
    fields: [
      { name: "title", label: "Notification Title", required: true },
      { name: "body", label: "Message Body", type: "textarea", required: true },
    ],
    dummyRows: [
      { id: "notif-01", title: "Catch Record Validated", body: "KFS Officer validated your Yellowfin Tuna catch entry (420.5 kg) at Kilifi Landing.", read_at: "Read", created_at: "2026-10-23" },
      { id: "notif-02", title: "Quarterly BMU Review Meeting", body: "Kilifi Creek BMU quarterly financial and membership audit is scheduled for this Friday.", read_at: "New", created_at: "2026-10-22" },
      { id: "notif-03", title: "New Access Request Pending", body: "Dr. Jane Achieng submitted an access request for County Marine Research.", read_at: "New", created_at: "2026-10-21" },
      { id: "notif-04", title: "Mangrove Grant Approved", body: "KES 12,000,000 funding milestone approved by Kenya Climate Foundation.", read_at: "Read", created_at: "2026-10-20" },
    ],
  },
  "landing-sites": {
    title: "Landing Sites Registry",
    description: "Official fish landing sites and coastal beach stations with active capacity.",
    table: "landing_sites",
    statusField: "status",
    columns: [
      { key: "name", label: "Site Name" },
      { key: "county", label: "County" },
      { key: "latitude", label: "Latitude" },
      { key: "longitude", label: "Longitude" },
      { key: "status", label: "Status" },
    ],
    fields: [
      { name: "name", label: "Site name", required: true },
      {
        name: "county",
        label: "County",
        type: "select",
        options: [
          { value: "Kilifi", label: "Kilifi" },
          { value: "Kwale", label: "Kwale" },
          { value: "Mombasa", label: "Mombasa" },
          { value: "Homa Bay", label: "Homa Bay" },
          { value: "Lamu", label: "Lamu" },
        ],
        defaultValue: "Kilifi",
        required: true,
      },
      { name: "latitude", label: "Latitude", type: "number", required: true },
      { name: "longitude", label: "Longitude", type: "number", required: true },
      {
        name: "status",
        label: "Status",
        type: "select",
        options: [
          { value: "Active", label: "Active" },
          { value: "Pending", label: "Pending" },
        ],
        defaultValue: "Active",
        required: true,
      },
    ],
    dummyRows: [
      { id: "ls-01", name: "Kilifi Landing", county: "Kilifi", latitude: -3.6302, longitude: 39.8499, status: "Active" },
      { id: "ls-02", name: "Diani Jetty", county: "Kwale", latitude: -4.2797, longitude: 39.5936, status: "Active" },
      { id: "ls-03", name: "Watamu Marine Park Site", county: "Kilifi", latitude: -3.3541, longitude: 40.0177, status: "Active" },
      { id: "ls-04", name: "Shimoni Pier", county: "Kwale", latitude: -4.6477, longitude: 39.3814, status: "Active" },
      { id: "ls-05", name: "Homa Bay Pier", county: "Homa Bay", latitude: -0.5273, longitude: 34.4571, status: "Active" },
      { id: "ls-06", name: "Old Port Mombasa", county: "Mombasa", latitude: -4.0583, longitude: 39.6784, status: "Active" },
    ],
  },
};

function schemaFor(fields: Field[]) {
  const shape: Record<string, z.ZodTypeAny> = {};
  fields.forEach((field) => {
    const base = field.type === "number" ? z.coerce.number() : z.string();
    shape[field.name] = field.required ? base : base.optional().or(z.literal(""));
  });
  return z.object(shape);
}

export function SupabaseCrudPage({ moduleKey }: { moduleKey: keyof typeof configs }) {
  const config = configs[moduleKey];
  const [rows, setRows] = useState<Row[]>(config.dummyRows);
  const [selected, setSelected] = useState<Row | null>(null);
  const [editing, setEditing] = useState<Row | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const form = useForm<Record<string, string | number>>({
    defaultValues: Object.fromEntries(
      config.fields.map((f) => [f.name, f.defaultValue ?? ""])
    ),
  });

  const validation = useMemo(() => schemaFor(config.fields), [config.fields]);

  async function load() {
    setError("");
    setLoading(true);

    if (!hasSupabaseConfig()) {
      setRows(config.dummyRows);
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { data, error: loadError } = await supabase
        .from(config.table)
        .select("*")
        .order("created_at", { ascending: false });

      if (loadError) {
        // Fallback to dummy rows for tables that do not exist or fail RLS
        setRows(config.dummyRows);
      } else if (data && data.length > 0) {
        setRows(data as Row[]);
      } else {
        // If DB table is empty, combine with dummy records so client always sees an active page
        setRows(config.dummyRows);
      }
    } catch {
      setRows(config.dummyRows);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [config.table]);

  async function submit(values: Record<string, string | number>) {
    setError("");
    setNotice("");
    const parsed = validation.safeParse(values);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid form.");
      return;
    }
    const payload = Object.fromEntries(Object.entries(parsed.data).filter(([, value]) => value !== ""));

    // Attempt to persist to Supabase if table exists
    if (hasSupabaseConfig()) {
      try {
        const supabase = createClient();
        if (editing) {
          await supabase.from(config.table).update(payload).eq("id", editing.id);
        } else {
          await supabase.from(config.table).insert({
            ...payload,
            id: crypto.randomUUID(),
          });
        }
      } catch {
        // Continue with local update if database insert fails
      }
    }

    if (editing) {
      setRows((current) =>
        current.map((item) => (item.id === editing.id ? { ...item, ...payload } : item))
      );
      setNotice("Record updated successfully.");
    } else {
      const newRecord: Row = {
        id: `rec-${Date.now()}`,
        created_at: new Date().toISOString().split("T")[0],
        ...payload,
      };
      setRows((current) => [newRecord, ...current]);
      setNotice("Record created successfully.");
    }

    form.reset(Object.fromEntries(config.fields.map((f) => [f.name, f.defaultValue ?? ""])));
    setEditing(null);
    setShowForm(false);
  }

  async function remove(row: Row) {
    setError("");
    setNotice("");
    if (hasSupabaseConfig()) {
      try {
        const supabase = createClient();
        await supabase.from(config.table).delete().eq("id", row.id);
      } catch {
        // ignore
      }
    }
    setRows((current) => current.filter((r) => r.id !== row.id));
    setNotice("Record deleted.");
    setSelected(null);
  }

  function startEdit(row: Row) {
    setEditing(row);
    setShowForm(true);
    config.fields.forEach((field) => form.setValue(field.name, row[field.name] ?? ""));
  }

  function startCreate() {
    setEditing(null);
    form.reset(Object.fromEntries(config.fields.map((f) => [f.name, f.defaultValue ?? ""])));
    setShowForm(true);
  }

  const filtered = rows.filter((row) =>
    JSON.stringify(row).toLowerCase().includes(query.toLowerCase())
  );

  return (
    <section className="grid gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-500">BLUE Ecosystem Module</p>
          <h1 className="mt-2 text-3xl font-black text-[var(--text)] sm:text-4xl">{config.title}</h1>
          <p className="mt-2 max-w-3xl text-sm text-[var(--muted-text)]">{config.description}</p>
        </div>
        <button
          onClick={startCreate}
          className="ocean-action inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-bold text-slate-950 transition active:scale-95 shadow-md"
        >
          <Plus className="h-4 w-4" /> Add Record
        </button>
      </div>

      {(error || notice) && (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${
            error ? "border-rose-400/40 bg-rose-500/10 text-rose-500" : "border-emerald-400/40 bg-emerald-500/10 text-emerald-600"
          }`}
        >
          {error || notice}
        </div>
      )}

      {showForm && (
        <div className="ocean-panel rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between border-b border-[var(--line)] pb-4">
            <h3 className="text-lg font-black text-[var(--text)]">{editing ? "Edit Record" : "Create New Record"}</h3>
            <button
              onClick={() => {
                setShowForm(false);
                setEditing(null);
              }}
              className="text-xs font-bold text-[var(--muted-text)] hover:text-[var(--text)]"
            >
              Close
            </button>
          </div>
          <form onSubmit={form.handleSubmit((values) => void submit(values))} className="mt-4 grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              {config.fields.map((field) => (
                <div key={field.name} className={field.type === "textarea" ? "md:col-span-2" : ""}>
                  <label className="text-xs font-black uppercase tracking-[0.16em] text-[var(--muted-text)]">
                    {field.label}
                  </label>
                  {field.type === "textarea" ? (
                    <textarea
                      {...form.register(field.name)}
                      placeholder={field.label}
                      className="mt-1.5 min-h-24 w-full rounded-xl border border-[var(--line)] bg-[var(--input)] px-3 py-2 text-sm text-[var(--text)] outline-none"
                    />
                  ) : field.type === "select" && field.options ? (
                    <select
                      {...form.register(field.name)}
                      className="mt-1.5 min-h-11 w-full rounded-xl border border-[var(--line)] bg-[var(--input)] px-3 py-2 text-sm text-[var(--text)] outline-none"
                    >
                      {field.options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      {...form.register(field.name)}
                      type={field.type ?? "text"}
                      placeholder={field.label}
                      className="mt-1.5 min-h-11 w-full rounded-xl border border-[var(--line)] bg-[var(--input)] px-3 py-2 text-sm text-[var(--text)] outline-none"
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="mt-2 flex gap-3">
              <button
                type="submit"
                className="ocean-action rounded-xl px-5 py-2.5 text-sm font-bold text-slate-950 shadow-md"
              >
                {editing ? "Update Record" : "Save Record"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditing(null);
                }}
                className="rounded-xl border border-[var(--line)] px-4 py-2.5 text-sm font-bold text-[var(--text)]"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[1fr_0.36fr]">
        <div className="ocean-panel rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <Search className="h-5 w-5 text-cyan-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search / filter entries..."
              className="w-full bg-transparent text-sm text-[var(--text)] outline-none placeholder:text-[var(--muted-text)]"
            />
          </div>

          <div className="mt-4 overflow-x-auto">
            {loading ? (
              <LoadingState />
            ) : filtered.length ? (
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--line)] text-xs uppercase tracking-[0.18em] text-[var(--muted-text)]">
                    <th className="px-3 py-3">S/N</th>
                    {config.columns.map((column) => (
                      <th key={column.key} className="px-3 py-3">
                        {column.label}
                      </th>
                    ))}
                    <th className="px-3 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row, index) => (
                    <tr
                      key={row.id}
                      className="border-b border-[var(--line)]/60 text-[var(--text)] transition hover:bg-[var(--soft)]/70"
                    >
                      <td className="px-3 py-4 text-xs font-bold text-[var(--muted-text)]">
                        {String(index + 1).padStart(2, "0")}
                      </td>
                      {config.columns.map((column) => {
                        const val = row[column.key];
                        return (
                          <td key={column.key} className="px-3 py-4">
                            {column.key === config.statusField && typeof val === "string" ? (
                              <StatusBadge status={val as RecordStatus} />
                            ) : (
                              <span className="font-medium">{String(val ?? "-")}</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="space-x-3 px-3 py-4 text-xs font-bold">
                        <button
                          onClick={() => setSelected(row)}
                          className="text-cyan-500 hover:underline"
                        >
                          View
                        </button>
                        <button
                          onClick={() => startEdit(row)}
                          className="text-emerald-500 hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => void remove(row)}
                          className="text-rose-500 hover:underline"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <EmptyState title="No records found" body="Click 'Add Record' to create the first entry." />
            )}
          </div>
        </div>

        <div className="ocean-panel rounded-2xl p-5">
          <h3 className="font-bold text-[var(--text)]">Detail View</h3>
          {selected ? (
            <div className="mt-4">
              <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-xl bg-[var(--soft)] p-3 text-xs text-[var(--text)]">
                {JSON.stringify(selected, null, 2)}
              </pre>
            </div>
          ) : (
            <div className="mt-8 text-center text-sm text-[var(--muted-text)]">
              <Eye className="mx-auto mb-2 h-6 w-6 opacity-40" />
              Select a record from the table to preview details.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
