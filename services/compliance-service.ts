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

const fallbackHierarchy: LocationHierarchy = {
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

// Seed dummy compliance records
let inMemoryOfficerReports: OfficerPatrolReport[] = [
  {
    id: "rep-off-01",
    patrol_reference_no: "KEFS-KLF-2026-088",
    name_of_bmu: "Kilifi Creek BMU",
    patrol_date: "2026-10-21",
    county_id: "a30fc6e2-6a50-472b-b6f4-ee52f229740c",
    sub_county_id: "ef2c4776-8b1f-407f-b978-502de11a5665",
    ward_id: "f3644832-ae0b-4fa6-9533-fa29aab5dfc3",
    bmu_id: "775660f7-c8d8-4e7a-99e8-f65c72152ecc",
    source_reference: "GOK, 2014 MCS Standard Operating procedure manual.",
    legal_reference_notes: "People, Gears, Crafts, and Fish compliance verified.",
    status: "Approved",
    created_by: "demo-officer-id",
    updated_by: "demo-officer-id",
    created_at: "2026-10-21T09:00:00Z",
    updated_at: "2026-10-21T11:00:00Z",
  },
  {
    id: "rep-off-02",
    patrol_reference_no: "KEFS-KWL-2026-042",
    name_of_bmu: "Diani Reef BMU",
    patrol_date: "2026-10-18",
    county_id: "b7894262-fcc5-4a0f-88c9-076dfa519407",
    sub_county_id: "efd27281-c72f-464d-9b8f-ed78d784e3e0",
    ward_id: "c22c1dbd-e165-47d5-9de0-e9ecd041dfe6",
    bmu_id: "999f1cc4-a5cf-4e12-bee6-068871b7ee22",
    source_reference: "GOK, 2014 MCS Standard Operating procedure manual.",
    legal_reference_notes: "Wasini Channel inshore patrol inspection.",
    status: "Approved",
    created_by: "demo-officer-id",
    updated_by: "demo-officer-id",
    created_at: "2026-10-18T14:30:00Z",
    updated_at: "2026-10-18T16:00:00Z",
  },
];

let inMemoryBmuReports: BmuPatrolReport[] = [
  {
    id: "bmu-pat-01",
    bmu_id: "775660f7-c8d8-4e7a-99e8-f65c72152ecc",
    county_id: "a30fc6e2-6a50-472b-b6f4-ee52f229740c",
    sub_county_id: "ef2c4776-8b1f-407f-b978-502de11a5665",
    ward_id: "f3644832-ae0b-4fa6-9533-fa29aab5dfc3",
    bmu_name_jina_la_patrol_bmu: "Kilifi Creek BMU",
    patrol_leader_name: "Juma Mwangi",
    patrol_leader_position: "BMU Patrol Captain",
    patrol_leader_mobile_phone_number: "+254 722 123 456",
    date_of_patrol_tarehe_ya_patrol: "2026-10-22",
    time_patrol_commenced_saa_ya_kwanza: "06:00",
    time_patrol_ended_saa_ya_kutamatisha: "11:30",
    patrol_vessel_name_jina_la_chombo: "Bahari Salama 01",
    vessel_type_aina_ya_chombo_material_length: "Fiberglass 8.5m",
    vessel_engine_horsepower_hp_nguvu_ya_engine: "40 HP Yamaha",
    patrol_objective_lengo_la_patrol_1: "Reef zone inspection & illegal speargun prevention",
    patrol_objective_lengo_la_patrol_2: "Monitor artisanal craft boundary compliance",
    patrol_area_eneo_la_patrol_1: "Kilifi North Lagoon",
    patrol_area_eneo_la_patrol_2: "Vipingo Reef Edge",
    patrol_area_eneo_la_patrol_3: "Creek Mouth",
    outcomes_matokeo_ya_patrol_na_hatua_iliyochukuliwa: "14 artisanal craft inspected. All validly registered with active biometric QR cards.",
    challenge_fuel_shortage_uhaba_wa_mafuta: false,
    challenge_bad_weather_hali_mbaya_ya_anga: false,
    challenge_mechanical_issues_boti_kuharibika: false,
    challenge_resistance_from_fishers_usumbufu_ya_wavuvi: false,
    challenge_other_mengine: null,
    attached_patrol_data_capture_form: true,
    attached_patrol_costing_table: true,
    attached_seizure_form: false,
    attached_mcs_outcome_data_compilation_form: false,
    attached_other: null,
    prepared_by_name_jina: "Juma Mwangi",
    prepared_by_designation_cheo: "BMU Enforcement Officer",
    prepared_by_signature_sahihi: "J. Mwangi",
    prepared_by_date_tarehe_ya_kuandika_repoti: "2026-10-22",
    status: "Approved",
    created_by: "demo-leader-id",
    updated_by: "demo-leader-id",
    created_at: "2026-10-22T12:00:00Z",
    updated_at: "2026-10-22T12:00:00Z",
  },
];

let inMemoryDataCaptureRecords: PatrolDataCaptureRecord[] = [
  {
    id: "pdc-01",
    bmu_patrol_report_id: "bmu-pat-01",
    patrol_reference_no: "PDC-2026-014",
    patrol_date: "2026-10-22",
    patrol_boat_name: "Bahari Salama 01",
    county_id: "a30fc6e2-6a50-472b-b6f4-ee52f229740c",
    sub_county_id: "ef2c4776-8b1f-407f-b978-502de11a5665",
    ward_id: "f3644832-ae0b-4fa6-9533-fa29aab5dfc3",
    bmu_id: "775660f7-c8d8-4e7a-99e8-f65c72152ecc",
    county_name: "Kilifi",
    patrol_objective: "Mesh size inspection and licensing validation",
    patrol_leader_name: "Juma Mwangi",
    position: "Patrol Captain",
    phone_no: "+254 722 123 456",
    jcma_name: "Watamu-Kilifi JCMA",
    bmu_name: "Kilifi Creek BMU",
    start_time_12hrs: "06:00",
    end_time_12hrs: "11:30",
    row_no: 1,
    entry_time: "07:15",
    fishers_name: "Amina Mwakio",
    fisher_id_no: "28471920",
    phone_no_row: "+254 701 880 114",
    gear_type_and_id: "Hook and Line #04",
    gear_quantity: "4 lines",
    fishing_location_ground: "Kilifi North Lagoon",
    bmu_origin: "Kilifi Creek BMU",
    infringement_code: "None - Compliant",
    item_confiscated_encountered_and_details: "Routine check. Catch contained 18kg Rabbitfish. No infringements.",
    status: "Approved",
    created_by: "demo-leader-id",
    updated_by: "demo-leader-id",
    created_at: "2026-10-22T08:00:00Z",
    updated_at: "2026-10-22T08:00:00Z",
  },
  {
    id: "pdc-02",
    bmu_patrol_report_id: "bmu-pat-01",
    patrol_reference_no: "PDC-2026-014",
    patrol_date: "2026-10-22",
    patrol_boat_name: "Bahari Salama 01",
    county_id: "a30fc6e2-6a50-472b-b6f4-ee52f229740c",
    sub_county_id: "ef2c4776-8b1f-407f-b978-502de11a5665",
    ward_id: "f3644832-ae0b-4fa6-9533-fa29aab5dfc3",
    bmu_id: "775660f7-c8d8-4e7a-99e8-f65c72152ecc",
    county_name: "Kilifi",
    patrol_objective: "Mesh size inspection",
    patrol_leader_name: "Juma Mwangi",
    position: "Patrol Captain",
    phone_no: "+254 722 123 456",
    jcma_name: "Watamu-Kilifi JCMA",
    bmu_name: "Kilifi Creek BMU",
    start_time_12hrs: "06:00",
    end_time_12hrs: "11:30",
    row_no: 2,
    entry_time: "08:40",
    fishers_name: "Hassan Bakari",
    fisher_id_no: "19482019",
    phone_no_row: "+254 722 345 678",
    gear_type_and_id: "Monofilament Net",
    gear_quantity: "1 piece",
    fishing_location_ground: "Vipingo Reef Edge",
    bmu_origin: "Kilifi Creek BMU",
    infringement_code: "Possession / use of unsustainable gears",
    item_confiscated_encountered_and_details: "Restricted net confiscated. Case referred to BMU executive for hearing.",
    status: "Under Review",
    created_by: "demo-leader-id",
    updated_by: "demo-leader-id",
    created_at: "2026-10-22T09:10:00Z",
    updated_at: "2026-10-22T09:10:00Z",
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

async function logComplianceAudit(action: string, entityType: string, entityId?: string) {
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
    // Non-blocking
  }
}

export async function fetchLocationHierarchy(): Promise<LocationHierarchy> {
  try {
    const supabase = createClient();
    const [{ data: counties }, { data: subCounties }, { data: wards }] = await Promise.all([
      supabase.from("counties").select("id,name,code").order("name"),
      supabase.from("sub_counties").select("id,county_id,name").order("name"),
      supabase.from("wards").select("id,sub_county_id,name").order("name"),
    ]);

    return {
      counties: (counties?.length ? counties : fallbackHierarchy.counties) as LocationCounty[],
      subCounties: (subCounties?.length ? subCounties : fallbackHierarchy.subCounties) as LocationSubCounty[],
      wards: (wards?.length ? wards : fallbackHierarchy.wards) as LocationWard[],
    };
  } catch {
    return fallbackHierarchy;
  }
}

export async function fetchBmusByWard(wardId: string): Promise<LocationBmu[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("bmus")
      .select("id,name,county,registration_code,county_id,sub_county_id,ward_id")
      .eq("ward_id", wardId)
      .order("name");

    if (!error && data && data.length > 0) return data as LocationBmu[];
  } catch {
    // ignore
  }

  return [
    {
      id: "775660f7-c8d8-4e7a-99e8-f65c72152ecc",
      name: "Kilifi Creek BMU",
      county: "Kilifi",
      registration_code: "KE-BMU-2017-002",
      county_id: "a30fc6e2-6a50-472b-b6f4-ee52f229740c",
      sub_county_id: "ef2c4776-8b1f-407f-b978-502de11a5665",
      ward_id: wardId,
    },
  ];
}

export async function fetchOfficerPatrolReports(): Promise<OfficerPatrolReport[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.from("patrol_reports").select("*").order("patrol_date", { ascending: false });
    if (!error && data && data.length > 0) {
      return data as OfficerPatrolReport[];
    }
  } catch {
    // ignore
  }
  return inMemoryOfficerReports;
}

export async function fetchOfficerPatrolReportDetail(id: string): Promise<OfficerPatrolReportDetail> {
  const found = inMemoryOfficerReports.find((r) => r.id === id) ?? inMemoryOfficerReports[0];
  return {
    report: found,
    entries: [
      {
        id: "ent-01",
        patrol_report_id: id,
        entry_time: "07:30",
        location: "Kilifi Creek Inshore",
        person_name: "Amina Mwakio",
        id_no: "28471920",
        people_infringement: "Compliant",
        quantity_gear_craft_type_equipment: "Artisanal Canoe (4 lines)",
        gear_craft_infringement: "Valid gear",
        quantity_and_species: "18kg Rabbitfish",
        form_fresh_processed: "Fresh",
        fish_infringement: "Legal size",
        remarks: "Approved landing",
        created_at: "2026-10-21T08:00:00Z",
      },
    ],
    mcsOutcomes: [
      {
        id: "mcs-01",
        patrol_report_id: id,
        no_of_suspects: 0,
        no_of_vessels: 14,
        total_fines_kes: 0,
        gear_item_type_confiscated: null,
        quantity: null,
        type_of_infringement: "None",
        no_of_cases_appearing: 0,
        yes_or_no_prosecution: "No",
        amount_of_fine: null,
        no_of_acquittals: 0,
        challenges_remarks: "Standard clear patrol with zero violations.",
        created_at: "2026-10-21T08:00:00Z",
      },
    ],
    seizureRecords: [],
    documents: [],
  };
}

export async function createOfficerPatrolReport(payload: OfficerPatrolReportInput) {
  const now = new Date().toISOString();
  const newReport: OfficerPatrolReport = {
    id: `rep-off-${Date.now()}`,
    ...payload,
    created_by: payload.created_by ?? null,
    updated_by: payload.updated_by ?? null,
    created_at: now,
    updated_at: now,
  };

  try {
    const supabase = createClient();
    const userId = await currentUserId();
    const { data, error } = await supabase
      .from("patrol_reports")
      .insert({ ...payload, created_by: payload.created_by ?? userId, updated_by: payload.updated_by ?? userId })
      .select("*")
      .single();

    if (!error && data) {
      inMemoryOfficerReports = [data as OfficerPatrolReport, ...inMemoryOfficerReports];
      return data as OfficerPatrolReport;
    }
  } catch {
    // fallback
  }

  inMemoryOfficerReports = [newReport, ...inMemoryOfficerReports];
  return newReport;
}

export async function updateOfficerPatrolReport(id: string, payload: Partial<OfficerPatrolReportInput>) {
  inMemoryOfficerReports = inMemoryOfficerReports.map((r) => (r.id === id ? { ...r, ...payload } : r));
  return inMemoryOfficerReports.find((r) => r.id === id) as OfficerPatrolReport;
}

export async function createOfficerPatrolReportEntry(payload: Omit<OfficerPatrolReportEntry, "id" | "created_at">) {
  return { id: `ent-${Date.now()}`, ...payload, created_at: new Date().toISOString() };
}

export async function createMcsOutcomeRecord(payload: Omit<McsOutcomeRecord, "id" | "created_at">) {
  return { id: `mcs-${Date.now()}`, ...payload, created_at: new Date().toISOString() };
}

export async function fetchBmuPatrolReports(): Promise<BmuPatrolReport[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("bmu_patrol_reports")
      .select("*")
      .order("date_of_patrol_tarehe_ya_patrol", { ascending: false });

    if (!error && data && data.length > 0) return data as BmuPatrolReport[];
  } catch {
    // ignore
  }

  return inMemoryBmuReports;
}

export async function fetchBmuPatrolReportDetail(id: string): Promise<BmuPatrolReportDetail> {
  const found = inMemoryBmuReports.find((r) => r.id === id) ?? inMemoryBmuReports[0];
  return {
    report: found,
    participants: [
      {
        id: "part-01",
        bmu_patrol_report_id: id,
        institution_taasisi_no: "Kilifi Creek BMU Scout Team",
        idadi_ya_watu: 4,
        created_at: "2026-10-22T06:00:00Z",
      },
    ],
    outcomes: [
      {
        id: "out-01",
        bmu_patrol_report_id: id,
        infringement_no: "INF-2026-001",
        infringement_type: "Illegal monofilament net",
        action_taken_hatua_iliyochukuliwa: "Confiscated and logged",
        created_at: "2026-10-22T09:00:00Z",
      },
    ],
    documents: [],
  };
}

export async function createBmuPatrolReport(payload: BmuPatrolReportInput) {
  const now = new Date().toISOString();
  const newReport: BmuPatrolReport = {
    id: `bmu-pat-${Date.now()}`,
    ...payload,
    created_by: payload.created_by ?? null,
    updated_by: payload.updated_by ?? null,
    created_at: now,
    updated_at: now,
  };

  try {
    const supabase = createClient();
    const userId = await currentUserId();
    const { data, error } = await supabase
      .from("bmu_patrol_reports")
      .insert({ ...payload, created_by: payload.created_by ?? userId, updated_by: payload.updated_by ?? userId })
      .select("*")
      .single();

    if (!error && data) {
      inMemoryBmuReports = [data as BmuPatrolReport, ...inMemoryBmuReports];
      return data as BmuPatrolReport;
    }
  } catch {
    // fallback
  }

  inMemoryBmuReports = [newReport, ...inMemoryBmuReports];
  return newReport;
}

export async function updateBmuPatrolReport(id: string, payload: Partial<BmuPatrolReportInput>) {
  inMemoryBmuReports = inMemoryBmuReports.map((r) => (r.id === id ? { ...r, ...payload } : r));
  return inMemoryBmuReports.find((r) => r.id === id) as BmuPatrolReport;
}

export async function createBmuPatrolParticipant(payload: Omit<BmuPatrolParticipant, "id" | "created_at">) {
  return { id: `part-${Date.now()}`, ...payload, created_at: new Date().toISOString() };
}

export async function createBmuPatrolOutcome(payload: Omit<BmuPatrolOutcome, "id" | "created_at">) {
  return { id: `out-${Date.now()}`, ...payload, created_at: new Date().toISOString() };
}

export async function fetchPatrolDataCaptureRecords(): Promise<PatrolDataCaptureRecord[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.from("patrol_data_capture_records").select("*").order("created_at", { ascending: false });
    if (!error && data && data.length > 0) return data as PatrolDataCaptureRecord[];
  } catch {
    // ignore
  }

  return inMemoryDataCaptureRecords;
}

export async function fetchPatrolDataCaptureRecordDetail(id: string): Promise<PatrolDataCaptureRecord> {
  const found = inMemoryDataCaptureRecords.find((r) => r.id === id) ?? inMemoryDataCaptureRecords[0];
  return found;
}

export async function createPatrolDataCaptureRecord(payload: PatrolDataCaptureRecordInput) {
  const now = new Date().toISOString();
  const newRec: PatrolDataCaptureRecord = {
    id: `pdc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    ...payload,
    created_by: payload.created_by ?? null,
    updated_by: payload.updated_by ?? null,
    created_at: now,
    updated_at: now,
  };

  try {
    const supabase = createClient();
    const userId = await currentUserId();
    const { data, error } = await supabase
      .from("patrol_data_capture_records")
      .insert({ ...payload, created_by: payload.created_by ?? userId, updated_by: payload.updated_by ?? userId })
      .select("*")
      .single();

    if (!error && data) {
      inMemoryDataCaptureRecords = [data as PatrolDataCaptureRecord, ...inMemoryDataCaptureRecords];
      return data as PatrolDataCaptureRecord;
    }
  } catch {
    // fallback
  }

  inMemoryDataCaptureRecords = [newRec, ...inMemoryDataCaptureRecords];
  return newRec;
}

export async function updatePatrolDataCaptureRecord(id: string, payload: Partial<PatrolDataCaptureRecordInput>) {
  inMemoryDataCaptureRecords = inMemoryDataCaptureRecords.map((r) => (r.id === id ? { ...r, ...payload } : r));
  return inMemoryDataCaptureRecords.find((r) => r.id === id) as PatrolDataCaptureRecord;
}

export async function fetchSeizureRecords(): Promise<SeizureRecord[]> {
  return [];
}

export async function createSeizureRecord(payload: ActorInsertable<SeizureRecord>) {
  return { id: `sz-${Date.now()}`, ...payload, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as SeizureRecord;
}

export async function createSeizedItem(payload: Omit<SeizedItem, "id" | "created_at">) {
  return { id: `szi-${Date.now()}`, ...payload, created_at: new Date().toISOString() };
}

export async function registerComplianceDocument(payload: Omit<ComplianceDocument, "id" | "created_at" | "uploaded_by">) {
  return { id: `cdoc-${Date.now()}`, ...payload, created_at: new Date().toISOString(), uploaded_by: null };
}
