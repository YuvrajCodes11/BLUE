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

async function currentUserId() {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) throw new Error(error.message);
  return data.user?.id ?? null;
}

async function logBmuAudit(action: string, entityType: string, entityId?: string) {
  const supabase = createClient();
  const actorId = await currentUserId();
  const { error } = await supabase.from("audit_logs").insert({
    actor_id: actorId,
    action,
    entity_type: entityType,
    entity_id: entityId ?? null,
  });
  if (error) throw new Error(error.message);
}

function clean<T extends object>(input: T) {
  return Object.fromEntries(Object.entries(input).map(([key, value]) => [key, value === "" ? null : value])) as T;
}

function safeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").slice(0, 120);
}

export async function fetchBmuLocationHierarchy(): Promise<LocationHierarchy> {
  const supabase = createClient();
  const [{ data: counties, error: countiesError }, { data: subCounties, error: subCountiesError }, { data: wards, error: wardsError }] = await Promise.all([
    supabase.from("counties").select("id,name,code").order("name"),
    supabase.from("sub_counties").select("id,county_id,name").order("name"),
    supabase.from("wards").select("id,sub_county_id,name").order("name"),
  ]);

  const error = countiesError ?? subCountiesError ?? wardsError;
  if (error) throw new Error(error.message);

  return {
    counties: (counties ?? []) as LocationHierarchy["counties"],
    subCounties: (subCounties ?? []) as LocationHierarchy["subCounties"],
    wards: (wards ?? []) as LocationHierarchy["wards"],
  };
}

export async function fetchBmuSetupContext(): Promise<BmuSetupContext> {
  const supabase = createClient();
  const [locations, bmuResult, certificateResult] = await Promise.all([
    fetchBmuLocationHierarchy(),
    supabase
      .from("bmus")
      .select("id,name,county,registration_code,county_id,sub_county_id,ward_id,setup_status,certificate_status,verified_at,verified_by,setup_updated_at")
      .order("name"),
    supabase.from("bmu_certificates").select("*").order("created_at", { ascending: false }),
  ]);

  if (bmuResult.error) throw new Error(bmuResult.error.message);
  if (certificateResult.error) throw new Error(certificateResult.error.message);
  await logBmuAudit("view", "bmu_setup");

  return {
    locations,
    bmus: (bmuResult.data ?? []) as BmuSetupProfile[],
    certificates: (certificateResult.data ?? []) as BmuCertificate[],
  };
}

export async function updateBmuProfile(input: BmuProfileUpdateInput) {
  const supabase = createClient();
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

  const { data, error } = await supabase
    .from("bmus")
    .update(payload)
    .eq("id", input.id)
    .select("id,name,county,registration_code,county_id,sub_county_id,ward_id,setup_status,certificate_status,verified_at,verified_by,setup_updated_at")
    .single();

  if (error) throw new Error(error.message);
  await logBmuAudit("bmu_profile_update", "bmus", input.id);
  return data as BmuSetupProfile;
}

export async function uploadBmuCertificate(input: BmuCertificateInput) {
  const supabase = createClient();
  const userId = await currentUserId();
  const path = `${input.bmu_id}/${Date.now()}-${safeFileName(input.file.name)}`;
  const { error: uploadError } = await supabase.storage.from(CERTIFICATE_BUCKET).upload(path, input.file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (uploadError) throw new Error(uploadError.message);

  const { data, error } = await supabase
    .from("bmu_certificates")
    .insert(clean({
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
      mime_type: input.file.type || null,
      file_size_bytes: input.file.size,
      status: "Pending" satisfies BmuCertificateStatus,
    }))
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  const { error: bmuError } = await supabase
    .from("bmus")
    .update({ certificate_status: "Pending", setup_status: "In Progress", setup_updated_at: new Date().toISOString() })
    .eq("id", input.bmu_id);
  if (bmuError) throw new Error(bmuError.message);

  await logBmuAudit("bmu_certificate_upload", "bmu_certificates", data.id);
  return data as BmuCertificate;
}

export async function updateBmuCertificateMetadata(certificate: Pick<BmuCertificate, "id" | "bmu_id"> & Partial<Pick<BmuCertificate, "certificate_type" | "certificate_number" | "area" | "issue_date" | "expiry_date">>) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("bmu_certificates")
    .update(clean({
      certificate_type: certificate.certificate_type ?? null,
      certificate_number: certificate.certificate_number ?? null,
      area: certificate.area ?? null,
      issue_date: certificate.issue_date ?? null,
      expiry_date: certificate.expiry_date ?? null,
      status: "Pending",
      reviewed_by: null,
      verified_at: null,
      rejected_at: null,
      review_notes: null,
      updated_at: new Date().toISOString(),
    }))
    .eq("id", certificate.id)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  await logBmuAudit("bmu_certificate_update", "bmu_certificates", certificate.id);
  return data as BmuCertificate;
}

export async function reviewBmuCertificate(certificate: BmuCertificate, status: Extract<BmuCertificateStatus, "Verified" | "Rejected">, reviewNotes: string) {
  const supabase = createClient();
  const userId = await currentUserId();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("bmu_certificates")
    .update(clean({
      status,
      review_notes: reviewNotes || null,
      reviewed_by: userId,
      verified_at: status === "Verified" ? now : null,
      rejected_at: status === "Rejected" ? now : null,
      updated_at: now,
    }))
    .eq("id", certificate.id)
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  const bmuUpdate = status === "Verified"
    ? { certificate_status: "Verified", setup_status: "Complete", verified_at: now, verified_by: userId, setup_updated_at: now }
    : { certificate_status: "Rejected", setup_status: "In Progress", verified_at: null, verified_by: null, setup_updated_at: now };

  const { error: bmuError } = await supabase.from("bmus").update(bmuUpdate).eq("id", certificate.bmu_id);
  if (bmuError) throw new Error(bmuError.message);

  await logBmuAudit(status === "Verified" ? "bmu_certificate_verified" : "bmu_certificate_rejected", "bmu_certificates", certificate.id);
  return data as BmuCertificate;
}

export async function createBmuCertificateSignedUrl(certificate: Pick<BmuCertificate, "storage_bucket" | "storage_path">) {
  const supabase = createClient();
  const { data, error } = await supabase.storage.from(certificate.storage_bucket).createSignedUrl(certificate.storage_path, 60 * 5);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}
