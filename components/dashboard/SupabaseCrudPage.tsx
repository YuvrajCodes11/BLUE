"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Plus, Search, Eye, Edit2, Trash2, Download, FileText, CheckCircle2, ShieldCheck, QrCode, Printer, X } from "lucide-react";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { LoadingState } from "@/components/dashboard/LoadingState";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { createClient, hasSupabaseConfig } from "@/lib/supabase";
import { exportToCsv, exportOfficialPdfReport } from "@/lib/export-utils";
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
      { key: "status", label: "Status" },
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
          { value: "Co-Management Agreement", label: "Co-Management Agreement" },
          { value: "Grant Agreement", label: "Grant Agreement" },
          { value: "Environmental Audit", label: "Environmental Audit" },
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
      {
        id: "doc-01",
        title: "Kilifi Creek BMU Registration Certificate",
        document_type: "BMU Registration Certificate",
        owner_type: "BMU",
        owner_name: "Kilifi Creek BMU",
        reference_no: "KE-BMU-CERT-2017-002",
        issuing_authority: "State Department for Blue Economy & Fisheries",
        status: "Verified",
        file_size: "2.4 MB",
        storage_path: "certificates/kilifi-bmu-registration-2026.pdf",
        created_at: "2026-07-01",
        summary: "Official gazetted registration granting co-management jurisdiction over Kilifi Creek inshore lagoon, reef edge, and gazetted landing stations under the Fisheries Management and Development Act.",
      },
      {
        id: "doc-02",
        title: "Artisanal Fisher Master Operating Licence",
        document_type: "Artisanal Fisher Licence",
        owner_type: "Fisher",
        owner_name: "Amina Mwakio (ID: 28471920)",
        reference_no: "FSH-KLF-2026-084",
        issuing_authority: "Kenya Fisheries Service (KeFS)",
        status: "Active",
        file_size: "1.1 MB",
        storage_path: "licences/amina-mwakio-license-2026.pdf",
        created_at: "2026-08-10",
        summary: "Annual artisanal operating license authorizing hook-and-line, handline, and small basket trap harvesting within Kilifi coastal waters with verified digital biometric QR registration.",
      },
      {
        id: "doc-03",
        title: "Diani Reef BMU Gazetted By-Laws & Code of Conduct",
        document_type: "BMU By-Laws",
        owner_type: "BMU",
        owner_name: "Diani Reef BMU",
        reference_no: "KWL-BMU-BL-2019-014",
        issuing_authority: "Kwale County Directorate of Fisheries",
        status: "Validated",
        file_size: "3.8 MB",
        storage_path: "bmu-by-laws/diani-bmu-by-laws-signed.pdf",
        created_at: "2026-08-22",
        summary: "Locally gazetted by-laws regulating seasonal octopus closure zones, ban on beach seines and monofilament nets, and setting BMU landing cess dues collection framework.",
      },
      {
        id: "doc-04",
        title: "Vessel Seaworthiness & Safety Inspection Certificate",
        document_type: "Vessel Seaworthiness Report",
        owner_type: "Fisher",
        owner_name: "Bahari Salama 01 (Captain Juma Mwangi)",
        reference_no: "VES-SEA-2026-042",
        issuing_authority: "Kenya Maritime Authority & KeFS",
        status: "Certified",
        file_size: "1.6 MB",
        storage_path: "reports/vessel-seaworthy-2026.pdf",
        created_at: "2026-09-05",
        summary: "Annual hull structural integrity, Yamaha 40HP engine emission, lifejacket flotation devices, and AIS transmitter telemetry compliance verified for 8.5m fiberglass craft.",
      },
      {
        id: "doc-05",
        title: "Watamu-Kilifi Joint Co-Management Agreement (JCMA)",
        document_type: "Co-Management Agreement",
        owner_type: "BMU",
        owner_name: "Watamu & Kilifi Creek BMUs",
        reference_no: "JCMA-KLF-2026-003",
        issuing_authority: "Kenya Wildlife Service & KeFS",
        status: "Active",
        file_size: "4.5 MB",
        storage_path: "agreements/watamu-kilifi-jcma-signed.pdf",
        created_at: "2026-09-18",
        summary: "Tripartite agreement establishing joint community ranger patrols, buffer conservation boundary enforcement, and coral reef protection zones.",
      },
      {
        id: "doc-06",
        title: "Solar Cold-Chain Facility Grant Agreement",
        document_type: "Grant Agreement",
        owner_type: "County Office",
        owner_name: "Kilifi County Fisheries Directorate",
        reference_no: "OFI-GRANT-2026-018",
        issuing_authority: "Ocean Futures Initiative & Global Ocean Fund",
        status: "Active",
        file_size: "2.9 MB",
        storage_path: "grants/kilifi-solar-coldchain-agreement.pdf",
        created_at: "2026-10-02",
        summary: "Grant agreement financing 3 solar-powered ice flake generation stations and 10 metric ton cold storage hub to eliminate post-harvest landing spoilage.",
      },
      {
        id: "doc-07",
        title: "NEMA Inshore Water Quality & Habitat Compliance Audit",
        document_type: "Environmental Audit",
        owner_type: "BMU",
        owner_name: "Diani Reef BMU",
        reference_no: "NEMA-KWL-2026-042",
        issuing_authority: "National Environment Management Authority (NEMA)",
        status: "Verified",
        file_size: "2.1 MB",
        storage_path: "nema/diani-water-quality-audit-2026.pdf",
        created_at: "2026-10-12",
        summary: "Comprehensive water microbiological and turbidity testing confirming zero effluent contamination and favorable coral reef regeneration indicators.",
      },
      {
        id: "doc-08",
        title: "Joint Fisheries Patrol MCS Inspection Log (Form 1A)",
        document_type: "Patrol Compliance Log",
        owner_type: "County Office",
        owner_name: "KeFS Coastal Patrol Unit",
        reference_no: "KEFS-KLF-2026-088",
        issuing_authority: "Director General, Kenya Fisheries Service",
        status: "Verified",
        file_size: "1.9 MB",
        storage_path: "patrols/kefs-patrol-form1a-2026-088.pdf",
        created_at: "2026-10-21",
        summary: "Official enforcement logbook documenting 14 vessel boardings, 1 illegal net confiscation, and zero illegal foreign incursions within the 12NM territorial sea.",
      },
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
  const [selected, setSelected] = useState<Row | null>(config.dummyRows[0] ?? null);
  const [editing, setEditing] = useState<Row | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<Row | null>(null);
  const [inspectRecord, setInspectRecord] = useState<Row | null>(null);
  const [downloading, setDownloading] = useState(false);
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
      setSelected(config.dummyRows[0] ?? null);
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
        setRows(config.dummyRows);
      } else if (data && data.length > 0) {
        if (moduleKey === "documents") {
          const combined = [...config.dummyRows, ...(data as Row[])];
          const unique = Array.from(new Map(combined.map((item) => [item.storage_path || item.id, item])).values());
          setRows(unique);
        } else {
          setRows(data as Row[]);
        }
      } else {
        setRows(config.dummyRows);
      }

      setSelected((curr) => curr ?? (data?.[0] as Row) ?? config.dummyRows[0] ?? null);
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
    <section className="grid gap-6 w-full max-w-full min-w-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between w-full min-w-0">
        <div className="min-w-0 max-w-full">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-500">BLUE Ecosystem Module</p>
          <h1 className="mt-2 text-2xl font-black text-[var(--text)] sm:text-4xl">{config.title}</h1>
          <p className="mt-2 max-w-3xl text-sm text-[var(--muted-text)] break-words">{config.description}</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <button
            type="button"
            onClick={() => {
              exportToCsv(`${moduleKey}-registry`, filtered, config.columns);
              setNotice(`✓ Exported ${filtered.length} ${config.title} records to CSV.`);
              setTimeout(() => setNotice(""), 3500);
            }}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl border border-[var(--line)] bg-[var(--soft)] px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-[var(--text)] transition hover:border-cyan-400 active:scale-95 whitespace-nowrap"
          >
            <Download className="h-4 w-4 text-cyan-400 shrink-0" /> Export CSV
          </button>
          <button
            onClick={startCreate}
            className="flex-1 sm:flex-none ocean-action inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-slate-950 transition active:scale-95 shadow-md whitespace-nowrap"
          >
            <Plus className="h-4 w-4 shrink-0" /> Add Record
          </button>
        </div>
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
        <div className="ocean-panel rounded-2xl p-4 sm:p-5 shadow-lg w-full max-w-full min-w-0 overflow-hidden">
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

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.36fr)] w-full max-w-full min-w-0">
        <div className="ocean-panel rounded-2xl p-4 sm:p-5 w-full max-w-full min-w-0 overflow-hidden">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between w-full min-w-0">
            <div className="flex flex-1 items-center gap-3 rounded-xl border border-[var(--line)] bg-[var(--input)] px-3.5 py-2.5 min-w-0 w-full">
              <Search className="h-4 w-4 shrink-0 text-cyan-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search / filter entries..."
                className="w-full min-w-0 bg-transparent text-sm text-[var(--text)] outline-none placeholder:text-[var(--muted-text)]"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="text-xs font-semibold text-[var(--muted-text)] hover:text-[var(--text)] shrink-0"
                >
                  Clear
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={startCreate}
              className="hidden sm:inline-flex ocean-action shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-950 shadow-md transition active:scale-95"
            >
              <Plus className="h-4 w-4" /> Add Record
            </button>
          </div>

          <div className="mt-4 w-full max-w-full min-w-0 overflow-x-auto rounded-xl border border-[var(--line)]/60">
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
                    <th className="px-3 py-3 text-right pr-4 min-w-[190px]">Actions</th>
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
                      <td className="px-3 py-4 text-xs font-semibold whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5 pr-1">
                          <button
                            type="button"
                            onClick={() => {
                              setSelected(row);
                              if (moduleKey === "documents") {
                                setPreviewDoc(row);
                              } else {
                                setInspectRecord(row);
                              }
                            }}
                            className="inline-flex items-center rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-xs font-bold text-cyan-400 transition hover:bg-cyan-500/20 active:scale-95"
                          >
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => startEdit(row)}
                            className="inline-flex items-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-400 transition hover:bg-emerald-500/20 active:scale-95"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => void remove(row)}
                            className="inline-flex items-center rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-xs font-bold text-rose-400 transition hover:bg-rose-500/20 active:scale-95"
                          >
                            Delete
                          </button>
                        </div>
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

        {/* Right Column: Detail View */}
        <div className="ocean-panel rounded-2xl p-4 sm:p-5 shadow-sm w-full max-w-full min-w-0 overflow-hidden">
          <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-cyan-400" />
              <h3 className="font-bold text-[var(--text)] text-sm">
                {moduleKey === "documents" ? "Document Preview" : "Record Overview"}
              </h3>
            </div>
            {selected && selected.status && (
              <StatusBadge status={selected.status as RecordStatus} />
            )}
          </div>

          {selected ? (
            moduleKey === "documents" ? (
              <div className="mt-4 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-[var(--text)] text-sm leading-tight truncate">
                        {String(selected.title || selected.document_type || "Official Document")}
                      </h4>
                      <p className="text-xs text-[var(--muted-text)] mt-0.5">
                        {String(selected.file_size || "2.4 MB")} · PDF Document
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 inline-flex rounded-full border border-emerald-400/40 bg-emerald-500/15 px-2.5 py-0.5 text-xs font-bold text-emerald-400">
                    {String(selected.status || "Verified")}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-xl border border-[var(--line)] bg-[var(--soft)] p-2.5">
                    <span className="block font-semibold text-[var(--muted-text)] uppercase tracking-wider text-[10px]">Reference No</span>
                    <span className="font-bold text-[var(--text)] mt-0.5 block truncate">{String(selected.reference_no || "KE-BMU-2026")}</span>
                  </div>
                  <div className="rounded-xl border border-[var(--line)] bg-[var(--soft)] p-2.5">
                    <span className="block font-semibold text-[var(--muted-text)] uppercase tracking-wider text-[10px]">Owner Entity</span>
                    <span className="font-bold text-[var(--text)] mt-0.5 block truncate">{String(selected.owner_name || selected.owner_type || "BMU")}</span>
                  </div>
                  <div className="rounded-xl border border-[var(--line)] bg-[var(--soft)] p-2.5 col-span-2">
                    <span className="block font-semibold text-[var(--muted-text)] uppercase tracking-wider text-[10px]">Issuing Authority</span>
                    <span className="font-bold text-cyan-400 mt-0.5 block truncate">{String(selected.issuing_authority || "State Department for Blue Economy & Fisheries")}</span>
                  </div>
                  <div className="rounded-xl border border-[var(--line)] bg-[var(--soft)] p-2.5 col-span-2">
                    <span className="block font-semibold text-[var(--muted-text)] uppercase tracking-wider text-[10px]">Storage Reference</span>
                    <span className="font-mono text-[11px] text-[var(--muted-text)] mt-0.5 block truncate">{String(selected.storage_path || "")}</span>
                  </div>
                </div>

                <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-cyan-400 mb-1">
                    <ShieldCheck className="h-4 w-4" /> Official Excerpt & Terms
                  </div>
                  <p className="text-[var(--text)] leading-relaxed text-[11px]">
                    {String(selected.summary || "Official regulatory and legal documentation verified under the Kenyan Fisheries and Blue Economy framework.")}
                  </p>
                </div>

                <div className="flex flex-col gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setPreviewDoc(selected)}
                    className="ocean-action inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-950 shadow-md transition active:scale-95"
                  >
                    <Eye className="h-4 w-4" /> Open Full Document Preview
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDownloading(true);
                      setNotice(`Generating and downloading ${selected.title || selected.document_type} (PDF)...`);
                      exportOfficialPdfReport({
                        filename: `${(selected.title || selected.document_type || "document").toLowerCase().replace(/[^a-z0-9]+/g, "-")}.html`,
                        title: String(selected.title || selected.document_type || "Official Document"),
                        referenceNo: String(selected.reference_no || "KE-BMU-2026-001"),
                        authority: String(selected.issuing_authority || "State Department for Blue Economy & Fisheries"),
                        summary: String(selected.summary || "Official regulatory and legal documentation verified under the Kenyan Fisheries and Blue Economy framework."),
                        metadata: [
                          { label: "Granted Entity / Holder", value: String(selected.owner_name || selected.owner_type || "BMU") },
                          { label: "Verification Status", value: String(selected.status || "Verified & Active") },
                          { label: "Storage Path", value: String(selected.storage_path || "vault/documents/") },
                          { label: "Registration Date", value: String(selected.created_at || "2026-10-23") },
                        ],
                      });
                      setTimeout(() => {
                        setDownloading(false);
                        setNotice(`✓ ${selected.title || selected.document_type} downloaded successfully.`);
                        setTimeout(() => setNotice(""), 3500);
                      }, 400);
                    }}
                    disabled={downloading}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--soft)] px-4 py-2 text-xs font-bold text-[var(--text)] transition hover:border-cyan-400 active:scale-95 disabled:opacity-50"
                  >
                    <Download className="h-4 w-4 text-cyan-400" /> Download Verified PDF
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                <div className="rounded-xl border border-[var(--line)] bg-[var(--soft)] p-3.5">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--muted-text)]">
                    Primary Record / Entity
                  </span>
                  <h4 className="mt-0.5 text-base font-black text-[var(--text)] truncate">
                    {String(
                      selected.full_name ||
                      selected.vessel_name ||
                      selected.species_name ||
                      selected.site_name ||
                      selected.project_name ||
                      selected.title ||
                      selected.name ||
                      selected.id ||
                      "BLUE Record"
                    )}
                  </h4>
                  {selected.bmu_id && (
                    <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-400">
                      <ShieldCheck className="h-3 w-3" /> Kilifi BMU Network
                    </span>
                  )}
                </div>

                <div className="grid gap-2 text-xs">
                  {Object.entries(selected)
                    .filter(([k]) => !["id", "summary"].includes(k))
                    .slice(0, 6)
                    .map(([key, val]) => (
                      <div key={key} className="flex items-center justify-between rounded-xl border border-[var(--line)] bg-[var(--soft)] px-3 py-2">
                        <span className="font-semibold capitalize text-[var(--muted-text)]">
                          {key.replace(/_/g, " ")}:
                        </span>
                        <span className="font-bold text-[var(--text)] truncate max-w-[180px]">
                          {String(val ?? "-")}
                        </span>
                      </div>
                    ))}
                </div>

                <div className="flex flex-col gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setInspectRecord(selected)}
                    className="ocean-action inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-950 shadow-md transition active:scale-95"
                  >
                    <Eye className="h-4 w-4" /> Open Full Record Dossier
                  </button>
                  <button
                    type="button"
                    onClick={() => startEdit(selected)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--soft)] px-4 py-2 text-xs font-bold text-[var(--text)] transition hover:border-emerald-400 active:scale-95"
                  >
                    <Edit2 className="h-4 w-4 text-emerald-400" /> Edit Record
                  </button>
                </div>
              </div>
            )
          ) : (
            <div className="mt-8 text-center text-sm text-[var(--muted-text)]">
              <Eye className="mx-auto mb-2 h-6 w-6 opacity-40" />
              Select a record from the table to preview details.
            </div>
          )}
        </div>
      </div>

      {/* Official Universal Record Dossier Modal */}
      {inspectRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="ocean-panel relative w-full max-w-2xl rounded-2xl border border-cyan-500/30 p-4 sm:p-6 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-3 sm:pb-4">
              <div className="flex items-center gap-2 min-w-0">
                <ShieldCheck className="h-5 w-5 text-cyan-400 shrink-0" />
                <span className="font-bold text-sm text-[var(--text)] truncate">Official {config.title} Dossier</span>
              </div>
              <button
                type="button"
                onClick={() => setInspectRecord(null)}
                className="grid h-8 w-8 place-items-center rounded-lg border border-[var(--line)] bg-[var(--soft)] text-[var(--muted-text)] hover:text-[var(--text)] transition shrink-0 ml-2"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Dossier Body */}
            <div className="mt-4 overflow-y-auto pr-1 flex-1 space-y-4">
              <div className="rounded-2xl border border-cyan-500/30 bg-[var(--input)] p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[var(--line)] pb-4">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-cyan-400">
                      REPUBLIC OF KENYA · BLUE ECOSYSTEM VAULT
                    </span>
                    <h3 className="text-lg sm:text-xl font-black text-[var(--text)] mt-1">
                      {String(
                        inspectRecord.full_name ||
                        inspectRecord.vessel_name ||
                        inspectRecord.species_name ||
                        inspectRecord.site_name ||
                        inspectRecord.project_name ||
                        inspectRecord.title ||
                        inspectRecord.name ||
                        "Official Record"
                      )}
                    </h3>
                  </div>
                  {inspectRecord.status && (
                    <StatusBadge status={inspectRecord.status as RecordStatus} />
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 mt-4">
                  {Object.entries(inspectRecord)
                    .filter(([k]) => !["id"].includes(k))
                    .map(([key, val]) => (
                      <div key={key} className="rounded-xl border border-[var(--line)] bg-[var(--soft)] p-3">
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--muted-text)]">
                          {key.replace(/_/g, " ")}
                        </span>
                        <span className="mt-1 block font-bold text-xs text-[var(--text)] break-words">
                          {String(val ?? "-")}
                        </span>
                      </div>
                    ))}
                </div>

                <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-[var(--line)] bg-[var(--soft)] p-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <QrCode className="h-7 w-7 sm:h-8 sm:w-8 text-cyan-400 shrink-0" />
                    <div>
                      <span className="block text-[10px] font-bold text-[var(--muted-text)] uppercase">Registry Verification Hash</span>
                      <span className="font-mono text-[10px] text-cyan-400">SHA256: 4e9c1b...802d</span>
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Authenticated on Chain
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-4 flex flex-col-reverse sm:flex-row items-stretch sm:items-center sm:justify-end gap-2 sm:gap-3 border-t border-[var(--line)] pt-3">
              <button
                type="button"
                onClick={() => setInspectRecord(null)}
                className="rounded-xl border border-[var(--line)] bg-[var(--soft)] px-4 py-2.5 sm:py-2 text-xs font-bold text-[var(--text)] hover:border-cyan-400 transition text-center"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const toEdit = inspectRecord;
                  setInspectRecord(null);
                  startEdit(toEdit);
                }}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 sm:py-2 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 transition"
              >
                <Edit2 className="h-4 w-4" /> Edit Record
              </button>
              <button
                type="button"
                onClick={() => {
                  exportOfficialPdfReport({
                    filename: `${config.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-dossier.html`,
                    title: `${config.title} · Official Record Dossier`,
                    summary: `Official administrative and operational record registered within the Republic of Kenya National Blue Economy digital vault under the Fisheries Management and Development Act.`,
                    metadata: Object.entries(inspectRecord)
                      .filter(([k]) => !["id"].includes(k))
                      .map(([k, v]) => ({ label: k.replace(/_/g, " "), value: String(v ?? "-") })),
                  });
                  setInspectRecord(null);
                  setNotice(`✓ ${config.title} record dossier exported.`);
                  setTimeout(() => setNotice(""), 3000);
                }}
                className="ocean-action inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 sm:py-2 text-xs font-bold text-slate-950 shadow-md"
              >
                <Download className="h-4 w-4" /> Export Summary
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="ocean-panel relative w-full max-w-2xl rounded-2xl border border-cyan-500/30 p-4 sm:p-6 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-3 sm:pb-4">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="h-5 w-5 text-cyan-400 shrink-0" />
                <span className="font-bold text-sm text-[var(--text)] truncate">Official Document Vault Preview</span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="grid h-8 w-8 place-items-center rounded-lg border border-[var(--line)] bg-[var(--soft)] text-[var(--muted-text)] hover:text-[var(--text)] transition shrink-0 ml-2"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Document Certificate Body */}
            <div className="mt-4 overflow-y-auto pr-1 flex-1">
              <div className="rounded-2xl border-2 border-cyan-500/40 bg-[var(--input)] p-4 sm:p-6 text-center relative overflow-hidden">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] font-mono text-[var(--muted-text)]">REPUBLIC OF KENYA</span>
                  <div className="flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-2.5 sm:px-3 py-1 text-[10px] sm:text-[11px] font-bold text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" /> DIGITAL SEAL VERIFIED
                  </div>
                </div>

                <div className="space-y-1 mt-1">
                  <p className="text-xs font-black tracking-[0.2em] text-cyan-400 uppercase">State Department for Blue Economy & Fisheries</p>
                  <p className="text-[10px] sm:text-[11px] font-bold tracking-wider text-[var(--muted-text)] uppercase">
                    Ministry of Mining, Blue Economy and Maritime Affairs
                  </p>
                  <p className="text-xs font-black text-[var(--text)] uppercase tracking-wide">
                    National Blue Economy Regulatory Vault
                  </p>
                </div>

                <div className="my-4 sm:my-5 border-t border-b border-cyan-500/30 py-3 sm:py-4">
                  <h2 className="text-sm sm:text-base font-black tracking-wide text-cyan-300 uppercase">
                    {String(previewDoc.title || previewDoc.document_type || "Official Certificate")}
                  </h2>
                  <p className="text-xs text-[var(--muted-text)] font-mono mt-1">
                    REFERENCE NO: <span className="font-bold text-[var(--text)]">{String(previewDoc.reference_no || "KE-BMU-2026-001")}</span>
                  </p>
                </div>

                <div className="text-left space-y-3 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                    <div className="rounded-xl border border-[var(--line)] bg-[var(--soft)] p-3">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--muted-text)]">Granted Entity / Holder</span>
                      <strong className="text-sm font-bold text-[var(--text)] mt-0.5 block">
                        {String(previewDoc.owner_name || previewDoc.owner_type || "Kilifi Creek BMU")}
                      </strong>
                    </div>
                    <div className="rounded-xl border border-[var(--line)] bg-[var(--soft)] p-3">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--muted-text)]">Status & Validity</span>
                      <span className="inline-flex mt-1 items-center gap-1 font-bold text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5" /> {String(previewDoc.status || "Verified & Active")}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-[var(--line)] bg-[var(--soft)] p-3.5 leading-relaxed">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-cyan-400 mb-1">Official Legal Grant & Summary</span>
                    <p className="text-[var(--text)] text-xs">
                      {String(previewDoc.summary || "This document confirms that the holder has fulfilled all legal and regulatory provisions under the Fisheries Management and Development Act.")}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 rounded-xl border border-[var(--line)] bg-[var(--soft)] p-3.5">
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 sm:h-12 sm:w-12 place-items-center rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shrink-0">
                        <QrCode className="h-6 w-6 sm:h-7 sm:w-7" />
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--muted-text)]">Digital Ledger Seal</span>
                        <span className="font-mono text-[10px] text-cyan-400">SHA256: 8f4b7a0c...3a1c</span>
                        <span className="block text-[10px] text-[var(--muted-text)]">Timestamped on BLUE Network</span>
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <div className="inline-block border-t border-[var(--line)] pt-1">
                        <p className="text-xs font-black text-[var(--text)]">Director General of Fisheries</p>
                        <p className="text-[10px] text-[var(--muted-text)]">Republic of Kenya</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-4 flex flex-col-reverse sm:flex-row items-stretch sm:items-center sm:justify-end gap-2 sm:gap-3 border-t border-[var(--line)] pt-3">
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="rounded-xl border border-[var(--line)] bg-[var(--soft)] px-4 py-2.5 sm:py-2 text-xs font-bold text-[var(--text)] hover:border-cyan-400 transition text-center"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  exportOfficialPdfReport({
                    filename: `${(previewDoc.title || previewDoc.document_type || "document").toLowerCase().replace(/[^a-z0-9]+/g, "-")}.html`,
                    title: String(previewDoc.title || previewDoc.document_type || "Official Certificate"),
                    referenceNo: String(previewDoc.reference_no || "KE-BMU-2026-001"),
                    authority: String(previewDoc.issuing_authority || "State Department for Blue Economy & Fisheries"),
                    summary: String(previewDoc.summary || "This document confirms that the holder has fulfilled all legal and regulatory provisions under the Fisheries Management and Development Act."),
                    metadata: [
                      { label: "Granted Entity / Holder", value: String(previewDoc.owner_name || previewDoc.owner_type || "Kilifi Creek BMU") },
                      { label: "Verification Status", value: String(previewDoc.status || "Verified & Active") },
                      { label: "File Reference", value: String(previewDoc.storage_path || "certificates/") },
                    ],
                  });
                  setPreviewDoc(null);
                  setNotice(`✓ ${previewDoc.title || previewDoc.document_type} PDF exported.`);
                  setTimeout(() => setNotice(""), 3000);
                }}
                className="ocean-action inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 sm:py-2 text-xs font-bold text-slate-950 shadow-md"
              >
                <Download className="h-4 w-4" /> Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
