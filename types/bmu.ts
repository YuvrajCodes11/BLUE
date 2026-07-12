import type { LocationBmu, LocationCounty, LocationSubCounty, LocationWard } from "@/types/blue";

export type BmuSetupStatus = "Pending" | "In Progress" | "Complete";
export type BmuCertificateStatus = "Pending" | "Verified" | "Rejected" | "Expired";

export type BmuSetupProfile = LocationBmu & {
  setup_status: BmuSetupStatus | string | null;
  certificate_status: BmuCertificateStatus | string | null;
  verified_at: string | null;
  verified_by: string | null;
  setup_updated_at: string | null;
};

export type BmuCertificate = {
  id: string;
  bmu_id: string;
  uploaded_by: string | null;
  reviewed_by: string | null;
  certificate_type: string | null;
  certificate_number: string | null;
  area: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  storage_bucket: string;
  storage_path: string;
  file_name: string;
  mime_type: string | null;
  file_size_bytes: number | null;
  status: BmuCertificateStatus | string;
  review_notes: string | null;
  verified_at: string | null;
  rejected_at: string | null;
  created_at: string;
  updated_at: string;
};

export type BmuCertificateInput = {
  bmu_id: string;
  certificate_type: string;
  certificate_number?: string | null;
  area?: string | null;
  issue_date?: string | null;
  expiry_date?: string | null;
  file: File;
};

export type BmuProfileUpdateInput = {
  id: string;
  name: string;
  registration_code?: string | null;
  county?: string | null;
  county_id?: string | null;
  sub_county_id?: string | null;
  ward_id?: string | null;
  setup_status?: string | null;
};

export type LocationHierarchy = {
  counties: LocationCounty[];
  subCounties: LocationSubCounty[];
  wards: LocationWard[];
};

export type BmuSetupContext = {
  bmus: BmuSetupProfile[];
  certificates: BmuCertificate[];
  locations: LocationHierarchy;
};
