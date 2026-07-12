import { createClient } from "@/lib/supabase";
import type {
  BmuPatrolReport,
  BmuPatrolOutcome,
  BmuPatrolParticipant,
  ComplianceDocument,
  LocationBmu,
  LocationCounty,
  LocationSubCounty,
  LocationWard,
  McsOutcomeRecord,
  OfficerPatrolReport,
  OfficerPatrolReportEntry,
  PatrolDataCaptureRecord,
  SeizedItem,
  SeizureRecord,
} from "@/types/blue";

type Insertable<T> = Omit<T, "id" | "created_at" | "updated_at">;
type ActorInsertable<T> = Omit<T, "id" | "created_at" | "updated_at" | "created_by" | "updated_by"> & {
  created_by?: string | null;
  updated_by?: string | null;
};

export type OfficerPatrolReportInput = ActorInsertable<OfficerPatrolReport>;

export type OfficerPatrolReportDetail = {
  report: OfficerPatrolReport;
  entries: OfficerPatrolReportEntry[];
  mcsOutcomes: McsOutcomeRecord[];
  seizureRecords: Array<SeizureRecord & { seized_items?: SeizedItem[] }>;
  documents: ComplianceDocument[];
};

export type BmuPatrolReportInput = ActorInsertable<BmuPatrolReport>;

export type BmuPatrolReportDetail = {
  report: BmuPatrolReport;
  participants: BmuPatrolParticipant[];
  outcomes: BmuPatrolOutcome[];
  documents: ComplianceDocument[];
};

export type PatrolDataCaptureRecordInput = ActorInsertable<PatrolDataCaptureRecord>;

export type LocationHierarchy = {
  counties: LocationCounty[];
  subCounties: LocationSubCounty[];
  wards: LocationWard[];
};

async function currentUserId() {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) throw new Error(error.message);
  return data.user?.id ?? null;
}

async function logComplianceAudit(action: string, entityType: string, entityId?: string) {
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

export async function fetchLocationHierarchy(): Promise<LocationHierarchy> {
  const supabase = createClient();
  const [{ data: counties, error: countiesError }, { data: subCounties, error: subCountiesError }, { data: wards, error: wardsError }] =
    await Promise.all([
      supabase.from("counties").select("id,name,code").order("name"),
      supabase.from("sub_counties").select("id,county_id,name").order("name"),
      supabase.from("wards").select("id,sub_county_id,name").order("name"),
    ]);

  const error = countiesError ?? subCountiesError ?? wardsError;
  if (error) throw new Error(error.message);

  return {
    counties: (counties ?? []) as LocationCounty[],
    subCounties: (subCounties ?? []) as LocationSubCounty[],
    wards: (wards ?? []) as LocationWard[],
  };
}

export async function fetchBmusByWard(wardId: string): Promise<LocationBmu[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("bmus")
    .select("id,name,county,registration_code,county_id,sub_county_id,ward_id")
    .eq("ward_id", wardId)
    .order("name");

  if (error) throw new Error(error.message);
  return (data ?? []) as LocationBmu[];
}

export async function fetchOfficerPatrolReports(): Promise<OfficerPatrolReport[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from("patrol_reports").select("*").order("patrol_date", { ascending: false });
  if (error) throw new Error(error.message);
  await logComplianceAudit("view", "patrol_reports");
  return (data ?? []) as OfficerPatrolReport[];
}

export async function fetchOfficerPatrolReportDetail(id: string): Promise<OfficerPatrolReportDetail> {
  const supabase = createClient();
  const [{ data: report, error: reportError }, { data: entries, error: entriesError }, { data: mcsOutcomes, error: mcsError }, { data: seizureRecords, error: seizureError }, { data: documents, error: documentsError }] =
    await Promise.all([
      supabase.from("patrol_reports").select("*").eq("id", id).single(),
      supabase.from("patrol_report_entries").select("*").eq("patrol_report_id", id).order("created_at"),
      supabase.from("mcs_outcome_records").select("*").eq("patrol_report_id", id).order("created_at"),
      supabase.from("seizure_records").select("*, seized_items(*)").eq("patrol_report_id", id).order("created_at"),
      supabase.from("compliance_documents").select("*").eq("owner_table", "patrol_reports").eq("owner_id", id).order("created_at", { ascending: false }),
    ]);

  const error = reportError ?? entriesError ?? mcsError ?? seizureError ?? documentsError;
  if (error) throw new Error(error.message);
  await logComplianceAudit("view", "patrol_reports", id);

  return {
    report: report as OfficerPatrolReport,
    entries: (entries ?? []) as OfficerPatrolReportEntry[],
    mcsOutcomes: (mcsOutcomes ?? []) as McsOutcomeRecord[],
    seizureRecords: (seizureRecords ?? []) as Array<SeizureRecord & { seized_items?: SeizedItem[] }>,
    documents: (documents ?? []) as ComplianceDocument[],
  };
}

export async function createOfficerPatrolReport(payload: OfficerPatrolReportInput) {
  const supabase = createClient();
  const userId = await currentUserId();
  const { data, error } = await supabase
    .from("patrol_reports")
    .insert({ ...payload, created_by: payload.created_by ?? userId, updated_by: payload.updated_by ?? userId })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  await logComplianceAudit("create", "patrol_reports", data.id);
  return data as OfficerPatrolReport;
}

export async function updateOfficerPatrolReport(id: string, payload: Partial<OfficerPatrolReportInput>) {
  const supabase = createClient();
  const userId = await currentUserId();
  const { data, error } = await supabase
    .from("patrol_reports")
    .update({ ...payload, updated_by: userId })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  await logComplianceAudit("edit", "patrol_reports", id);
  return data as OfficerPatrolReport;
}

export async function createOfficerPatrolReportEntry(payload: Omit<OfficerPatrolReportEntry, "id" | "created_at">) {
  const supabase = createClient();
  const { data, error } = await supabase.from("patrol_report_entries").insert(payload).select("*").single();
  if (error) throw new Error(error.message);
  await logComplianceAudit("create", "patrol_report_entries", data.id);
  return data as OfficerPatrolReportEntry;
}

export async function createMcsOutcomeRecord(payload: Omit<McsOutcomeRecord, "id" | "created_at">) {
  const supabase = createClient();
  const { data, error } = await supabase.from("mcs_outcome_records").insert(payload).select("*").single();
  if (error) throw new Error(error.message);
  await logComplianceAudit("create", "mcs_outcome_records", data.id);
  return data as McsOutcomeRecord;
}

export async function fetchBmuPatrolReports(): Promise<BmuPatrolReport[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("bmu_patrol_reports")
    .select("*")
    .order("date_of_patrol_tarehe_ya_patrol", { ascending: false });
  if (error) throw new Error(error.message);
  await logComplianceAudit("view", "bmu_patrol_reports");
  return (data ?? []) as BmuPatrolReport[];
}

export async function fetchBmuPatrolReportDetail(id: string): Promise<BmuPatrolReportDetail> {
  const supabase = createClient();
  const [{ data: report, error: reportError }, { data: participants, error: participantsError }, { data: outcomes, error: outcomesError }, { data: documents, error: documentsError }] =
    await Promise.all([
      supabase.from("bmu_patrol_reports").select("*").eq("id", id).single(),
      supabase.from("bmu_patrol_participants").select("*").eq("bmu_patrol_report_id", id).order("created_at"),
      supabase.from("bmu_patrol_outcomes").select("*").eq("bmu_patrol_report_id", id).order("created_at"),
      supabase.from("compliance_documents").select("*").eq("owner_table", "bmu_patrol_reports").eq("owner_id", id).order("created_at", { ascending: false }),
    ]);

  const error = reportError ?? participantsError ?? outcomesError ?? documentsError;
  if (error) throw new Error(error.message);
  await logComplianceAudit("view", "bmu_patrol_reports", id);

  return {
    report: report as BmuPatrolReport,
    participants: (participants ?? []) as BmuPatrolParticipant[],
    outcomes: (outcomes ?? []) as BmuPatrolOutcome[],
    documents: (documents ?? []) as ComplianceDocument[],
  };
}

export async function createBmuPatrolReport(payload: BmuPatrolReportInput) {
  const supabase = createClient();
  const userId = await currentUserId();
  const { data, error } = await supabase
    .from("bmu_patrol_reports")
    .insert({ ...payload, created_by: payload.created_by ?? userId, updated_by: payload.updated_by ?? userId })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  await logComplianceAudit("create", "bmu_patrol_reports", data.id);
  return data as BmuPatrolReport;
}

export async function updateBmuPatrolReport(id: string, payload: Partial<BmuPatrolReportInput>) {
  const supabase = createClient();
  const userId = await currentUserId();
  const { data, error } = await supabase
    .from("bmu_patrol_reports")
    .update({ ...payload, updated_by: userId })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  await logComplianceAudit("edit", "bmu_patrol_reports", id);
  return data as BmuPatrolReport;
}

export async function createBmuPatrolParticipant(payload: Omit<BmuPatrolParticipant, "id" | "created_at">) {
  const supabase = createClient();
  const { data, error } = await supabase.from("bmu_patrol_participants").insert(payload).select("*").single();
  if (error) throw new Error(error.message);
  await logComplianceAudit("create", "bmu_patrol_participants", data.id);
  return data as BmuPatrolParticipant;
}

export async function createBmuPatrolOutcome(payload: Omit<BmuPatrolOutcome, "id" | "created_at">) {
  const supabase = createClient();
  const { data, error } = await supabase.from("bmu_patrol_outcomes").insert(payload).select("*").single();
  if (error) throw new Error(error.message);
  await logComplianceAudit("create", "bmu_patrol_outcomes", data.id);
  return data as BmuPatrolOutcome;
}

export async function fetchPatrolDataCaptureRecords(): Promise<PatrolDataCaptureRecord[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from("patrol_data_capture_records").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  await logComplianceAudit("view", "patrol_data_capture_records");
  return (data ?? []) as PatrolDataCaptureRecord[];
}

export async function fetchPatrolDataCaptureRecordDetail(id: string): Promise<PatrolDataCaptureRecord> {
  const supabase = createClient();
  const { data, error } = await supabase.from("patrol_data_capture_records").select("*").eq("id", id).single();
  if (error) throw new Error(error.message);
  await logComplianceAudit("view", "patrol_data_capture_records", id);
  return data as PatrolDataCaptureRecord;
}

export async function createPatrolDataCaptureRecord(payload: PatrolDataCaptureRecordInput) {
  const supabase = createClient();
  const userId = await currentUserId();
  const { data, error } = await supabase
    .from("patrol_data_capture_records")
    .insert({ ...payload, created_by: payload.created_by ?? userId, updated_by: payload.updated_by ?? userId })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  await logComplianceAudit("create", "patrol_data_capture_records", data.id);
  return data as PatrolDataCaptureRecord;
}

export async function updatePatrolDataCaptureRecord(id: string, payload: Partial<PatrolDataCaptureRecordInput>) {
  const supabase = createClient();
  const userId = await currentUserId();
  const { data, error } = await supabase
    .from("patrol_data_capture_records")
    .update({ ...payload, updated_by: userId })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  await logComplianceAudit("edit", "patrol_data_capture_records", id);
  return data as PatrolDataCaptureRecord;
}

export async function fetchSeizureRecords(): Promise<SeizureRecord[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from("seizure_records").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  await logComplianceAudit("view", "seizure_records");
  return (data ?? []) as SeizureRecord[];
}

export async function createSeizureRecord(payload: ActorInsertable<SeizureRecord>) {
  const supabase = createClient();
  const userId = await currentUserId();
  const { data, error } = await supabase
    .from("seizure_records")
    .insert({ ...payload, created_by: payload.created_by ?? userId, updated_by: payload.updated_by ?? userId })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  await logComplianceAudit("create", "seizure_records", data.id);
  return data as SeizureRecord;
}

export async function createSeizedItem(payload: Omit<SeizedItem, "id" | "created_at">) {
  const supabase = createClient();
  const { data, error } = await supabase.from("seized_items").insert(payload).select("*").single();
  if (error) throw new Error(error.message);
  await logComplianceAudit("create", "seized_items", data.id);
  return data as SeizedItem;
}

export async function registerComplianceDocument(payload: Omit<ComplianceDocument, "id" | "created_at" | "uploaded_by">) {
  const supabase = createClient();
  const userId = await currentUserId();
  const { data, error } = await supabase
    .from("compliance_documents")
    .insert({ ...payload, uploaded_by: userId })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  await logComplianceAudit("create", "compliance_documents", data.id);
  return data as ComplianceDocument;
}
