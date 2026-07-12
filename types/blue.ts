export type Role =
  | "Government Admin"
  | "KFS Officer"
  | "County Officer"
  | "BMU Manager"
  | "Ranger"
  | "NGO Program Manager"
  | "Donor"
  | "Fisher";

export type Metric = {
  label: string;
  value: string;
  delta: string;
};

export type PlatformModule = {
  title: string;
  body: string;
  accent: string;
};

export type GisPoint = {
  label: string;
  x: number;
  y: number;
  kind: "landing" | "zone" | "conservation" | "route";
};

export type DashboardSignal = {
  label: string;
  value: number;
};

export type LocationCounty = {
  id: string;
  name: string;
  code: string | null;
};

export type LocationSubCounty = {
  id: string;
  county_id: string;
  name: string;
};

export type LocationWard = {
  id: string;
  sub_county_id: string;
  name: string;
};

export type LocationBmu = {
  id: string;
  name: string;
  county: string;
  registration_code: string;
  county_id: string | null;
  sub_county_id: string | null;
  ward_id: string | null;
};

export type ComplianceStatus = "Draft" | "Submitted" | "Under Review" | "Approved" | "Rejected" | "Closed";

export type OfficerPatrolReport = {
  id: string;
  patrol_reference_no: string;
  name_of_bmu: string | null;
  county_id: string | null;
  sub_county_id: string | null;
  ward_id: string | null;
  bmu_id: string | null;
  patrol_date: string;
  source_reference: string;
  legal_reference_notes: string | null;
  status: ComplianceStatus | string;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

export type OfficerPatrolReportEntry = {
  id: string;
  patrol_report_id: string;
  entry_time: string | null;
  location: string | null;
  person_name: string | null;
  id_no: string | null;
  people_infringement: string | null;
  quantity_gear_craft_type_equipment: string | null;
  gear_craft_infringement: string | null;
  quantity_and_species: string | null;
  form_fresh_processed: string | null;
  fish_infringement: string | null;
  remarks: string | null;
  created_at: string;
};

export type McsOutcomeRecord = {
  id: string;
  patrol_report_id: string;
  no_of_suspects: number | null;
  no_of_vessels: number | null;
  total_fines_kes: number | null;
  gear_item_type_confiscated: string | null;
  quantity: string | null;
  type_of_infringement: string | null;
  no_of_cases_appearing: number | null;
  yes_or_no_prosecution: string | null;
  amount_of_fine: number | null;
  no_of_acquittals: number | null;
  challenges_remarks: string | null;
  created_at: string;
};

export type BmuPatrolReport = {
  id: string;
  bmu_id: string;
  county_id: string | null;
  sub_county_id: string | null;
  ward_id: string | null;
  bmu_name_jina_la_patrol_bmu: string | null;
  patrol_leader_name: string;
  patrol_leader_position: string | null;
  patrol_leader_mobile_phone_number: string | null;
  date_of_patrol_tarehe_ya_patrol: string;
  time_patrol_commenced_saa_ya_kwanza: string | null;
  time_patrol_ended_saa_ya_kutamatisha: string | null;
  patrol_vessel_name_jina_la_chombo: string | null;
  vessel_type_aina_ya_chombo_material_length: string | null;
  vessel_engine_horsepower_hp_nguvu_ya_engine: string | null;
  patrol_objective_lengo_la_patrol_1: string | null;
  patrol_objective_lengo_la_patrol_2: string | null;
  patrol_area_eneo_la_patrol_1: string | null;
  patrol_area_eneo_la_patrol_2: string | null;
  patrol_area_eneo_la_patrol_3: string | null;
  outcomes_matokeo_ya_patrol_na_hatua_iliyochukuliwa: string | null;
  challenge_fuel_shortage_uhaba_wa_mafuta: boolean;
  challenge_bad_weather_hali_mbaya_ya_anga: boolean;
  challenge_mechanical_issues_boti_kuharibika: boolean;
  challenge_resistance_from_fishers_usumbufu_ya_wavuvi: boolean;
  challenge_other_mengine: string | null;
  attached_patrol_data_capture_form: boolean;
  attached_patrol_costing_table: boolean;
  attached_seizure_form: boolean;
  attached_mcs_outcome_data_compilation_form: boolean;
  attached_other: string | null;
  prepared_by_name_jina: string | null;
  prepared_by_designation_cheo: string | null;
  prepared_by_signature_sahihi: string | null;
  prepared_by_date_tarehe_ya_kuandika_repoti: string | null;
  status: ComplianceStatus | string;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

export type BmuPatrolParticipant = {
  id: string;
  bmu_patrol_report_id: string;
  institution_taasisi_no: string;
  idadi_ya_watu: number | null;
  created_at: string;
};

export type BmuPatrolOutcome = {
  id: string;
  bmu_patrol_report_id: string;
  infringement_no: string | null;
  infringement_type: string | null;
  action_taken_hatua_iliyochukuliwa: string | null;
  created_at: string;
};

export type PatrolDataCaptureRecord = {
  id: string;
  bmu_patrol_report_id: string | null;
  patrol_reference_no: string | null;
  patrol_date: string | null;
  patrol_boat_name: string | null;
  county_id: string | null;
  sub_county_id: string | null;
  ward_id: string | null;
  bmu_id: string | null;
  county_name: string | null;
  patrol_objective: string | null;
  patrol_leader_name: string | null;
  position: string | null;
  phone_no: string | null;
  jcma_name: string | null;
  bmu_name: string | null;
  start_time_12hrs: string | null;
  end_time_12hrs: string | null;
  row_no: number | null;
  entry_time: string | null;
  fishers_name: string | null;
  fisher_id_no: string | null;
  phone_no_row: string | null;
  gear_type_and_id: string | null;
  gear_quantity: string | null;
  fishing_location_ground: string | null;
  bmu_origin: string | null;
  infringement_code: string | null;
  item_confiscated_encountered_and_details: string | null;
  status: ComplianceStatus | string;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

export type SeizureRecord = {
  id: string;
  patrol_report_id: string | null;
  bmu_patrol_report_id: string | null;
  county_id: string | null;
  sub_county_id: string | null;
  ward_id: string | null;
  bmu_id: string | null;
  particulars_of_items_seized: string | null;
  person_name: string | null;
  person_nationality: string | null;
  person_id_passport_no: string | null;
  person_date: string | null;
  person_signature: string | null;
  officer_impounding_items_name: string | null;
  officer_designation: string | null;
  officer_pa_no: string | null;
  officer_station: string | null;
  officer_signature: string | null;
  seizure_district: string | null;
  seizure_town_location_sub_location: string | null;
  seizure_road_street: string | null;
  time_of_seizure: string | null;
  status: ComplianceStatus | string;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

export type SeizedItem = {
  id: string;
  seizure_record_id: string;
  name_of_items_seized: string;
  unit_of_quantity: string | null;
  quantity: string | null;
  estimated_value: number | null;
  created_at: string;
};

export type ComplianceDocument = {
  id: string;
  owner_table: string;
  owner_id: string;
  document_type: string;
  file_name: string;
  storage_bucket: string;
  storage_path: string;
  mime_type: string | null;
  file_size_bytes: number | null;
  uploaded_by: string | null;
  created_at: string;
};
