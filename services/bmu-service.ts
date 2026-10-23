import { createClient } from "@/lib/supabase";
import type {
  BmuCertificate,
  BmuCertificateInput,
  BmuCertificateStatus,
  BmuProfileUpdateInput,
  BmuSetupContext,
  BmuSetupProfile,
  LocationHierarchy,
} from "@/types/bmu";

const CERTIFICATE_BUCKET = "bmu-certificates";

const fallbackLocations: LocationHierarchy = {
  counties: [
    { id: "a30fc6e2-6a50-472b-b6f4-ee52f229740c", name: "Kilifi", code: "KLF" },
    { id: "b7894262-fcc5-4a0f-88c9-076dfa519407", name: "Kwale", code: "KWL" },
    { id: "b88842d1-3544-4cb3-90d6-1c5756deaed3", name: "Mombasa", code: "MSA" },
    { id: "e9c34177-1fd0-400e-8ffe-45669905d021", name: "Homa Bay", code: "HBY" },
  ],
  subCounties: [
    { id: "ef2c4776-8b1f-407f-b978-502de11a5665", county_id: "a30fc6e2-6a50-472b-b6f4-ee52f229740c", name: "Kilifi North" },
    { id: "efd27281-c72f-464d-9b8f-ed78d784e3e0", county_id: "b7894262-fcc5-4a0f-88c9-076dfa519407", name: "Msambweni" },
  ],
  wards: [
    { id: "f3644832-ae0b-4fa6-9533-fa29aab5dfc3", sub_county_id: "ef2c4776-8b1f-407f-b978-502de11a5665", name: "Watamu" },
    { id: "c22c1dbd-e165-47d5-9de0-e9ecd041dfe6", sub_county_id: "efd27281-c72f-464d-9b8f-ed78d784e3e0", name: "Shimoni" },
  ],
};

const fallbackBmus: BmuSetupProfile[] = [
  {
    id: "775660f7-c8d8-4e7a-99e8-f65c72152ecc",
    name: "Kilifi Creek BMU",
    county: "Kilifi",
    registration_code: "KE-BMU-2017-002",
    county_id: "a30fc6e2-6a50-472b-b6f4-ee52f229740c",
    sub_county_id: "ef2c4776-8b1f-407f-b978-502de11a5665",
    ward_id: "f3644832-ae0b-4fa6-9533-fa29aab5dfc3",
    setup_status: "Complete",
    certificate_status: "Verified",
    verified_at: "2026-02-01T10:00:00Z",
    verified_by: "Demo Admin",
    setup_updated_at: "2026-02-01T10:00:00Z",
  },
  {
    id: "999f1cc4-a5cf-4e12-bee6-068871b7ee22",
    name: "Diani Reef BMU",
    county: "Kwale",
    registration_code: "KE-BMU-2019-014",
    county_id: "b7894262-fcc5-4a0f-88c9-076dfa519407",
    sub_county_id: "efd27281-c72f-464d-9b8f-ed78d784e3e0",
    ward_id: "c22c1dbd-e165-47d5-9de0-e9ecd041dfe6",
    setup_status: "In Progress",
    certificate_status: "Pending",
    verified_at: null,
    verified_by: null,
    setup_updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "a912a429-4355-4a1d-9688-080a8593c386",
    name: "Homa Bay Central BMU",
    county: "Homa Bay",
    registration_code: "KE-BMU-2016-101",
    county_id: "e9c34177-1fd0-400e-8ffe-45669905d021",
    sub_county_id: null,
    ward_id: null,
    setup_status: "In Progress",
    certificate_status: "Pending",
    verified_at: null,
    verified_by: null,
    setup_updated_at: "2026-01-10T10:00:00Z",
  },
];

let inMemoryCertificates: BmuCertificate[] = [
  {
    id: "cert-01",
    bmu_id: "775660f7-c8d8-4e7a-99e8-f65c72152ecc",
    uploaded_by: "demo-admin-uuid-001",
    certificate_type: "BMU Registration Certificate",
    certificate_number: "KE-BMU-CERT-2017-002",
    area: "Kilifi Creek & North Channel",
    issue_date: "2026-01-15",
    expiry_date: "2028-01-15",
    storage_bucket: "bmu-certificates",
    storage_path: "certificates/kilifi-bmu-registration.pdf",
    file_name: "kilifi-bmu-registration-2026.pdf",
    mime_type: "application/pdf",
    file_size_bytes: 245000,
    status: "Verified",
    reviewed_by: "Demo Admin",
    verified_at: "2026-02-01T10:00:00Z",
    rejected_at: null,
    review_notes: "All gazetted by-laws and executive committee credentials verified.",
    created_at: "2026-01-15T08:30:00Z",
    updated_at: "2026-02-01T10:00:00Z",
  },
  {
    id: "cert-02",
    bmu_id: "999f1cc4-a5cf-4e12-bee6-068871b7ee22",
    uploaded_by: "demo-admin-uuid-001",
    certificate_type: "Environmental Compliance Certificate",
    certificate_number: "NEMA-KWL-2026-042",
    area: "Diani Inshore Coral Lagoon",
    issue_date: "2026-03-01",
    expiry_date: "2027-03-01",
    storage_bucket: "bmu-certificates",
    storage_path: "certificates/diani-environmental-cert.pdf",
    file_name: "diani-environmental-cert-2026.pdf",
    mime_type: "application/pdf",
    file_size_bytes: 182000,
    status: "Pending",
    reviewed_by: null,
    verified_at: null,
    rejected_at: null,
    review_notes: "Awaiting final water sample audit signoff from county health inspector.",
    created_at: "2026-03-01T11:20:00Z",
    updated_at: "2026-03-01T11:20:00Z",
  },
];

async function currentUserId() {
  try {
    const supabase = createClient();
    const { data } = await supabase.auth.getUser();
    return data.user?.id ?? "demo-user-id";
  } catch {
    return "demo-user-id";
  }
}

async function logBmuAudit(action: string, entityType: string, entityId?: string) {
  try {
    const supabase = createClient();
    const actorId = await currentUserId();
    await supabase.from("audit_logs").insert({
      actor_id: actorId,
      action,
      entity_type: entityType,
      entity_id: entityId ?? null,
    });
  } catch {
    // Audit logging is non-blocking
  }
}

function clean<T extends object>(input: T) {
  return Object.fromEntries(Object.entries(input).map(([key, value]) => [key, value === "" ? null : value])) as T;
}

function safeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").slice(0, 120);
}

export async function fetchBmuLocationHierarchy(): Promise<LocationHierarchy> {
  try {
    const supabase = createClient();
    const [{ data: counties }, { data: subCounties }, { data: wards }] = await Promise.all([
      supabase.from("counties").select("id,name,code").order("name"),
      supabase.from("sub_counties").select("id,county_id,name").order("name"),
      supabase.from("wards").select("id,sub_county_id,name").order("name"),
    ]);

    return {
      counties: (counties?.length ? counties : fallbackLocations.counties) as LocationHierarchy["counties"],
      subCounties: (subCounties?.length ? subCounties : fallbackLocations.subCounties) as LocationHierarchy["subCounties"],
      wards: (wards?.length ? wards : fallbackLocations.wards) as LocationHierarchy["wards"],
    };
  } catch {
    return fallbackLocations;
  }
}

export async function fetchBmuSetupContext(): Promise<BmuSetupContext> {
  let locations = fallbackLocations;
  try {
    locations = await fetchBmuLocationHierarchy();
  } catch {
    // use fallback
  }

  let bmus = fallbackBmus;
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("bmus")
      .select("id,name,county,registration_code,county_id,sub_county_id,ward_id,setup_status,certificate_status,verified_at,verified_by,setup_updated_at")
      .order("name");
    if (!error && data && data.length > 0) {
      bmus = data as BmuSetupProfile[];
    }
  } catch {
    // use fallback
  }

  let certificates = inMemoryCertificates;
  try {
    const supabase = createClient();
    const { data, error } = await supabase.from("bmu_certificates").select("*").order("created_at", { ascending: false });
    if (!error && data && data.length > 0) {
      certificates = data as BmuCertificate[];
    }
  } catch {
    // use inMemoryCertificates
  }

  void logBmuAudit("view", "bmu_setup");

  return {
    locations,
    bmus,
    certificates,
  };
}

export async function updateBmuProfile(input: BmuProfileUpdateInput) {
  const payload = clean({
    name: input.name,
    registration_code: input.registration_code ?? null,
    county: input.county ?? null,
    county_id: input.county_id ?? null,
    sub_county_id: input.sub_county_id ?? null,
    ward_id: input.ward_id ?? null,
    setup_status: input.setup_status ?? "In Progress",
    setup_updated_at: new Date().toISOString(),
  });

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("bmus")
      .update(payload)
      .eq("id", input.id)
      .select("id,name,county,registration_code,county_id,sub_county_id,ward_id,setup_status,certificate_status,verified_at,verified_by,setup_updated_at")
      .single();

    if (!error && data) {
      void logBmuAudit("bmu_profile_update", "bmus", input.id);
      return data as BmuSetupProfile;
    }
  } catch {
    // fallback to local update
  }

  void logBmuAudit("bmu_profile_update", "bmus", input.id);
  return {
    ...input,
    setup_updated_at: new Date().toISOString(),
  } as BmuSetupProfile;
}

export async function uploadBmuCertificate(input: BmuCertificateInput) {
  const userId = await currentUserId();
  const path = `${input.bmu_id}/${Date.now()}-${safeFileName(input.file.name)}`;

  const newCert: BmuCertificate = {
    id: `cert-${Date.now()}`,
    bmu_id: input.bmu_id,
    uploaded_by: userId,
    certificate_type: input.certificate_type,
    certificate_number: input.certificate_number ?? null,
    area: input.area ?? null,
    issue_date: input.issue_date ?? null,
    expiry_date: input.expiry_date ?? null,
    storage_bucket: CERTIFICATE_BUCKET,
    storage_path: path,
    file_name: input.file.name,
    mime_type: input.file.type || "application/pdf",
    file_size_bytes: input.file.size,
    status: "Pending" satisfies BmuCertificateStatus,
    reviewed_by: null,
    review_notes: null,
    verified_at: null,
    rejected_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  try {
    const supabase = createClient();
    await supabase.storage.from(CERTIFICATE_BUCKET).upload(path, input.file, {
      cacheControl: "3600",
      upsert: false,
    });

    const { data, error } = await supabase
      .from("bmu_certificates")
      .insert(clean(newCert))
      .select("*")
      .single();

    if (!error && data) {
      inMemoryCertificates = [data as BmuCertificate, ...inMemoryCertificates];
      return data as BmuCertificate;
    }
  } catch {
    // fallback
  }

  inMemoryCertificates = [newCert, ...inMemoryCertificates];
  void logBmuAudit("bmu_certificate_upload", "bmu_certificates", newCert.id);
  return newCert;
}

export async function updateBmuCertificateMetadata(
  certificate: Pick<BmuCertificate, "id" | "bmu_id"> &
    Partial<Pick<BmuCertificate, "certificate_type" | "certificate_number" | "area" | "issue_date" | "expiry_date">>
) {
  const updatedCert = {
    ...certificate,
    status: "Pending" as BmuCertificateStatus,
    updated_at: new Date().toISOString(),
  };

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("bmu_certificates")
      .update(clean(updatedCert))
      .eq("id", certificate.id)
      .select("*")
      .single();

    if (!error && data) {
      return data as BmuCertificate;
    }
  } catch {
    // fallback
  }

  inMemoryCertificates = inMemoryCertificates.map((c) =>
    c.id === certificate.id ? ({ ...c, ...updatedCert } as BmuCertificate) : c
  );
  return inMemoryCertificates.find((c) => c.id === certificate.id) as BmuCertificate;
}

export async function reviewBmuCertificate(
  certificate: BmuCertificate,
  status: Extract<BmuCertificateStatus, "Verified" | "Rejected">,
  reviewNotes: string
) {
  const userId = await currentUserId();
  const now = new Date().toISOString();

  const updateData = {
    status,
    review_notes: reviewNotes || null,
    reviewed_by: userId,
    verified_at: status === "Verified" ? now : null,
    rejected_at: status === "Rejected" ? now : null,
    updated_at: now,
  };

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("bmu_certificates")
      .update(clean(updateData))
      .eq("id", certificate.id)
      .select("*")
      .single();

    if (!error && data) {
      return data as BmuCertificate;
    }
  } catch {
    // fallback
  }

  inMemoryCertificates = inMemoryCertificates.map((c) =>
    c.id === certificate.id ? ({ ...c, ...updateData } as BmuCertificate) : c
  );
  return inMemoryCertificates.find((c) => c.id === certificate.id) as BmuCertificate;
}

export async function createBmuCertificateSignedUrl(certificate: Pick<BmuCertificate, "storage_bucket" | "storage_path">) {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.storage.from(certificate.storage_bucket).createSignedUrl(certificate.storage_path, 60 * 5);
    if (!error && data?.signedUrl) {
      return data.signedUrl;
    }
  } catch {
    // fallback
  }
  return "#certificate-preview";
}
