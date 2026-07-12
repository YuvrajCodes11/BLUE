-- Stage 1: official compliance/patrol form digitization foundation.
-- This migration adds structured records, location hierarchy, scoped RLS, and audit helpers.

create table if not exists public.counties (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  code text unique,
  created_at timestamptz not null default now()
);

create table if not exists public.sub_counties (
  id uuid primary key default gen_random_uuid(),
  county_id uuid not null references public.counties(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (county_id, name)
);

create table if not exists public.wards (
  id uuid primary key default gen_random_uuid(),
  sub_county_id uuid not null references public.sub_counties(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (sub_county_id, name)
);

alter table public.bmus add column if not exists county_id uuid references public.counties(id) on delete set null;
alter table public.bmus add column if not exists sub_county_id uuid references public.sub_counties(id) on delete set null;
alter table public.bmus add column if not exists ward_id uuid references public.wards(id) on delete set null;

alter table public.profiles add column if not exists county_id uuid references public.counties(id) on delete set null;
alter table public.profiles add column if not exists sub_county_id uuid references public.sub_counties(id) on delete set null;
alter table public.profiles add column if not exists ward_id uuid references public.wards(id) on delete set null;

create table if not exists public.patrol_reports (
  id uuid primary key default gen_random_uuid(),
  patrol_reference_no text not null,
  name_of_bmu text,
  county_id uuid references public.counties(id) on delete set null,
  sub_county_id uuid references public.sub_counties(id) on delete set null,
  ward_id uuid references public.wards(id) on delete set null,
  bmu_id uuid references public.bmus(id) on delete set null,
  patrol_date date not null,
  source_reference text not null default 'GOK, 2014 MCS Standard Operating procedure manual.',
  legal_reference_notes text,
  status text not null default 'Draft',
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.patrol_report_entries (
  id uuid primary key default gen_random_uuid(),
  patrol_report_id uuid not null references public.patrol_reports(id) on delete cascade,
  entry_time time,
  location text,
  person_name text,
  id_no text,
  people_infringement text,
  quantity_gear_craft_type_equipment text,
  gear_craft_infringement text,
  quantity_and_species text,
  form_fresh_processed text,
  fish_infringement text,
  remarks text,
  created_at timestamptz not null default now()
);

create table if not exists public.mcs_outcome_records (
  id uuid primary key default gen_random_uuid(),
  patrol_report_id uuid not null references public.patrol_reports(id) on delete cascade,
  no_of_suspects integer,
  no_of_vessels integer,
  total_fines_kes numeric(14,2),
  gear_item_type_confiscated text,
  quantity text,
  type_of_infringement text,
  no_of_cases_appearing integer,
  yes_or_no_prosecution text,
  amount_of_fine numeric(14,2),
  no_of_acquittals integer,
  challenges_remarks text,
  created_at timestamptz not null default now()
);

create table if not exists public.bmu_patrol_reports (
  id uuid primary key default gen_random_uuid(),
  bmu_id uuid not null references public.bmus(id) on delete cascade,
  county_id uuid references public.counties(id) on delete set null,
  sub_county_id uuid references public.sub_counties(id) on delete set null,
  ward_id uuid references public.wards(id) on delete set null,
  bmu_name_jina_la_patrol_bmu text,
  patrol_leader_name text not null,
  patrol_leader_position text,
  patrol_leader_mobile_phone_number text,
  date_of_patrol_tarehe_ya_patrol date not null,
  time_patrol_commenced_saa_ya_kwanza time,
  time_patrol_ended_saa_ya_kutamatisha time,
  patrol_objective_lengo_la_patrol_1 text,
  patrol_objective_lengo_la_patrol_2 text,
  patrol_area_eneo_la_patrol_1 text,
  patrol_area_eneo_la_patrol_2 text,
  patrol_area_eneo_la_patrol_3 text,
  outcomes_matokeo_ya_patrol_na_hatua_iliyochukuliwa text,
  challenge_fuel_shortage_uhaba_wa_mafuta boolean not null default false,
  challenge_bad_weather_hali_mbaya_ya_anga boolean not null default false,
  challenge_mechanical_issues_boti_kuharibika boolean not null default false,
  challenge_resistance_from_fishers_usumbufu_ya_wavuvi boolean not null default false,
  challenge_other_mengine text,
  attached_patrol_data_capture_form boolean not null default false,
  attached_patrol_costing_table boolean not null default false,
  attached_seizure_form boolean not null default false,
  attached_mcs_outcome_data_compilation_form boolean not null default false,
  attached_other text,
  prepared_by_name_jina text,
  prepared_by_designation_cheo text,
  prepared_by_signature_sahihi text,
  prepared_by_date_tarehe_ya_kuandika_repoti date,
  status text not null default 'Draft',
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bmu_patrol_participants (
  id uuid primary key default gen_random_uuid(),
  bmu_patrol_report_id uuid not null references public.bmu_patrol_reports(id) on delete cascade,
  institution_taasisi_no text not null,
  idadi_ya_watu integer,
  created_at timestamptz not null default now()
);

create table if not exists public.bmu_patrol_outcomes (
  id uuid primary key default gen_random_uuid(),
  bmu_patrol_report_id uuid not null references public.bmu_patrol_reports(id) on delete cascade,
  infringement_no text,
  infringement_type text,
  action_taken_hatua_iliyochukuliwa text,
  created_at timestamptz not null default now()
);

create table if not exists public.patrol_data_capture_records (
  id uuid primary key default gen_random_uuid(),
  bmu_patrol_report_id uuid references public.bmu_patrol_reports(id) on delete set null,
  patrol_reference_no text,
  patrol_date date,
  patrol_boat_name text,
  county_id uuid references public.counties(id) on delete set null,
  sub_county_id uuid references public.sub_counties(id) on delete set null,
  ward_id uuid references public.wards(id) on delete set null,
  bmu_id uuid references public.bmus(id) on delete set null,
  county_name text,
  patrol_objective text,
  patrol_leader_name text,
  position text,
  phone_no text,
  jcma_name text,
  bmu_name text,
  start_time_12hrs time,
  end_time_12hrs time,
  row_no integer,
  entry_time time,
  fishers_name text,
  fisher_id_no text,
  phone_no_row text,
  gear_type_and_id text,
  gear_quantity text,
  fishing_location_ground text,
  bmu_origin text,
  infringement_code text,
  item_confiscated_encountered_and_details text,
  status text not null default 'Draft',
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.seizure_records (
  id uuid primary key default gen_random_uuid(),
  patrol_report_id uuid references public.patrol_reports(id) on delete set null,
  bmu_patrol_report_id uuid references public.bmu_patrol_reports(id) on delete set null,
  county_id uuid references public.counties(id) on delete set null,
  sub_county_id uuid references public.sub_counties(id) on delete set null,
  ward_id uuid references public.wards(id) on delete set null,
  bmu_id uuid references public.bmus(id) on delete set null,
  particulars_of_items_seized text,
  person_name text,
  person_nationality text,
  person_id_passport_no text,
  person_date date,
  person_signature text,
  officer_impounding_items_name text,
  officer_designation text,
  officer_pa_no text,
  officer_station text,
  officer_signature text,
  seizure_district text,
  seizure_town_location_sub_location text,
  seizure_road_street text,
  time_of_seizure time,
  status text not null default 'Draft',
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.seized_items (
  id uuid primary key default gen_random_uuid(),
  seizure_record_id uuid not null references public.seizure_records(id) on delete cascade,
  name_of_items_seized text not null,
  unit_of_quantity text,
  quantity text,
  estimated_value numeric(14,2),
  created_at timestamptz not null default now()
);

create table if not exists public.compliance_documents (
  id uuid primary key default gen_random_uuid(),
  owner_table text not null,
  owner_id uuid not null,
  document_type text not null,
  file_name text not null,
  storage_bucket text not null default 'compliance-documents',
  storage_path text not null,
  mime_type text,
  file_size_bytes bigint,
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists bmus_location_idx on public.bmus(county_id, sub_county_id, ward_id);
create index if not exists patrol_reports_scope_idx on public.patrol_reports(county_id, sub_county_id, ward_id, bmu_id, patrol_date desc);
create index if not exists bmu_patrol_reports_scope_idx on public.bmu_patrol_reports(county_id, sub_county_id, ward_id, bmu_id, date_of_patrol_tarehe_ya_patrol desc);
create index if not exists patrol_data_capture_scope_idx on public.patrol_data_capture_records(county_id, sub_county_id, ward_id, bmu_id, patrol_date desc);
create index if not exists seizure_records_scope_idx on public.seizure_records(county_id, sub_county_id, ward_id, bmu_id, created_at desc);
create index if not exists compliance_documents_owner_idx on public.compliance_documents(owner_table, owner_id);

alter table public.counties enable row level security;
alter table public.sub_counties enable row level security;
alter table public.wards enable row level security;
alter table public.patrol_reports enable row level security;
alter table public.patrol_report_entries enable row level security;
alter table public.mcs_outcome_records enable row level security;
alter table public.bmu_patrol_reports enable row level security;
alter table public.bmu_patrol_participants enable row level security;
alter table public.bmu_patrol_outcomes enable row level security;
alter table public.patrol_data_capture_records enable row level security;
alter table public.seizure_records enable row level security;
alter table public.seized_items enable row level security;
alter table public.compliance_documents enable row level security;

create or replace function public.current_profile_role()
returns public.blue_role
language sql
stable
security definer
set search_path = public
as $$
  select p.role from public.profiles p where p.id = auth.uid()
$$;

create or replace function public.current_profile_bmu_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.bmu_id from public.profiles p where p.id = auth.uid()
$$;

create or replace function public.current_profile_county_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.county_id from public.profiles p where p.id = auth.uid()
$$;

create or replace function public.can_access_compliance_scope(record_county_id uuid, record_bmu_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and (
        p.role = 'Government Admin'
        or p.role in ('KFS Officer')
        or (p.role = 'County Officer' and (p.county_id is null or p.county_id = record_county_id or p.county = (select c.name from public.counties c where c.id = record_county_id)))
        or (p.role in ('BMU Manager','Ranger') and p.bmu_id is not null and p.bmu_id = record_bmu_id)
      )
  )
$$;

create or replace function public.can_manage_officer_compliance(record_county_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and (
        p.role = 'Government Admin'
        or p.role = 'KFS Officer'
        or (p.role = 'County Officer' and (p.county_id is null or p.county_id = record_county_id or p.county = (select c.name from public.counties c where c.id = record_county_id)))
      )
  )
$$;

create or replace function public.can_manage_bmu_compliance(record_bmu_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and (
        p.role = 'Government Admin'
        or p.role = 'KFS Officer'
        or (p.role = 'County Officer' and exists (select 1 from public.bmus b where b.id = record_bmu_id and (p.county_id is null or b.county_id = p.county_id or b.county = p.county)))
        or (p.role in ('BMU Manager','Ranger') and p.bmu_id is not null and p.bmu_id = record_bmu_id)
      )
  )
$$;

create or replace function public.can_access_compliance_document_scope(record_owner_table text, record_owner_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when record_owner_table = 'patrol_reports' then exists (
      select 1 from public.patrol_reports r
      where r.id = record_owner_id and public.can_access_compliance_scope(r.county_id, r.bmu_id)
    )
    when record_owner_table = 'bmu_patrol_reports' then exists (
      select 1 from public.bmu_patrol_reports r
      where r.id = record_owner_id and public.can_access_compliance_scope(r.county_id, r.bmu_id)
    )
    when record_owner_table = 'patrol_data_capture_records' then exists (
      select 1 from public.patrol_data_capture_records r
      where r.id = record_owner_id and public.can_access_compliance_scope(r.county_id, r.bmu_id)
    )
    when record_owner_table = 'seizure_records' then exists (
      select 1 from public.seizure_records r
      where r.id = record_owner_id and public.can_access_compliance_scope(r.county_id, r.bmu_id)
    )
    else public.current_profile_role() = 'Government Admin'
  end
$$;

create or replace function public.can_manage_compliance_document_scope(record_owner_table text, record_owner_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when record_owner_table = 'patrol_reports' then exists (
      select 1 from public.patrol_reports r
      where r.id = record_owner_id and public.can_manage_officer_compliance(r.county_id)
    )
    when record_owner_table = 'bmu_patrol_reports' then exists (
      select 1 from public.bmu_patrol_reports r
      where r.id = record_owner_id and public.can_manage_bmu_compliance(r.bmu_id)
    )
    when record_owner_table = 'patrol_data_capture_records' then exists (
      select 1 from public.patrol_data_capture_records r
      where r.id = record_owner_id and public.can_manage_bmu_compliance(r.bmu_id)
    )
    when record_owner_table = 'seizure_records' then exists (
      select 1 from public.seizure_records r
      where r.id = record_owner_id and (
        (r.patrol_report_id is not null and public.can_manage_officer_compliance(r.county_id))
        or (r.bmu_patrol_report_id is not null and public.can_manage_bmu_compliance(r.bmu_id))
        or public.current_profile_role() = 'Government Admin'
      )
    )
    else public.current_profile_role() = 'Government Admin'
  end
$$;

drop policy if exists "locations authenticated read" on public.counties;
create policy "locations authenticated read" on public.counties for select using (auth.role() = 'authenticated');

drop policy if exists "sub counties authenticated read" on public.sub_counties;
create policy "sub counties authenticated read" on public.sub_counties for select using (auth.role() = 'authenticated');

drop policy if exists "wards authenticated read" on public.wards;
create policy "wards authenticated read" on public.wards for select using (auth.role() = 'authenticated');

drop policy if exists "locations admin manage counties" on public.counties;
create policy "locations admin manage counties" on public.counties
  for all using (public.current_profile_role() = 'Government Admin')
  with check (public.current_profile_role() = 'Government Admin');

drop policy if exists "locations admin manage sub counties" on public.sub_counties;
create policy "locations admin manage sub counties" on public.sub_counties
  for all using (public.current_profile_role() = 'Government Admin')
  with check (public.current_profile_role() = 'Government Admin');

drop policy if exists "locations admin manage wards" on public.wards;
create policy "locations admin manage wards" on public.wards
  for all using (public.current_profile_role() = 'Government Admin')
  with check (public.current_profile_role() = 'Government Admin');

drop policy if exists "officer patrol scoped read" on public.patrol_reports;
create policy "officer patrol scoped read" on public.patrol_reports
  for select using (public.can_access_compliance_scope(county_id, bmu_id));

drop policy if exists "officer patrol scoped manage" on public.patrol_reports;
create policy "officer patrol scoped manage" on public.patrol_reports
  for all using (public.can_manage_officer_compliance(county_id))
  with check (public.can_manage_officer_compliance(county_id));

drop policy if exists "officer patrol entries scoped read" on public.patrol_report_entries;
create policy "officer patrol entries scoped read" on public.patrol_report_entries
  for select using (exists (select 1 from public.patrol_reports r where r.id = patrol_report_id and public.can_access_compliance_scope(r.county_id, r.bmu_id)));

drop policy if exists "officer patrol entries scoped manage" on public.patrol_report_entries;
create policy "officer patrol entries scoped manage" on public.patrol_report_entries
  for all using (exists (select 1 from public.patrol_reports r where r.id = patrol_report_id and public.can_manage_officer_compliance(r.county_id)))
  with check (exists (select 1 from public.patrol_reports r where r.id = patrol_report_id and public.can_manage_officer_compliance(r.county_id)));

drop policy if exists "mcs outcomes scoped read" on public.mcs_outcome_records;
create policy "mcs outcomes scoped read" on public.mcs_outcome_records
  for select using (exists (select 1 from public.patrol_reports r where r.id = patrol_report_id and public.can_access_compliance_scope(r.county_id, r.bmu_id)));

drop policy if exists "mcs outcomes scoped manage" on public.mcs_outcome_records;
create policy "mcs outcomes scoped manage" on public.mcs_outcome_records
  for all using (exists (select 1 from public.patrol_reports r where r.id = patrol_report_id and public.can_manage_officer_compliance(r.county_id)))
  with check (exists (select 1 from public.patrol_reports r where r.id = patrol_report_id and public.can_manage_officer_compliance(r.county_id)));

drop policy if exists "bmu patrol scoped read" on public.bmu_patrol_reports;
create policy "bmu patrol scoped read" on public.bmu_patrol_reports
  for select using (public.can_access_compliance_scope(county_id, bmu_id));

drop policy if exists "bmu patrol scoped manage" on public.bmu_patrol_reports;
create policy "bmu patrol scoped manage" on public.bmu_patrol_reports
  for all using (public.can_manage_bmu_compliance(bmu_id))
  with check (public.can_manage_bmu_compliance(bmu_id));

drop policy if exists "bmu patrol participants scoped read" on public.bmu_patrol_participants;
create policy "bmu patrol participants scoped read" on public.bmu_patrol_participants
  for select using (exists (select 1 from public.bmu_patrol_reports r where r.id = bmu_patrol_report_id and public.can_access_compliance_scope(r.county_id, r.bmu_id)));

drop policy if exists "bmu patrol participants scoped manage" on public.bmu_patrol_participants;
create policy "bmu patrol participants scoped manage" on public.bmu_patrol_participants
  for all using (exists (select 1 from public.bmu_patrol_reports r where r.id = bmu_patrol_report_id and public.can_manage_bmu_compliance(r.bmu_id)))
  with check (exists (select 1 from public.bmu_patrol_reports r where r.id = bmu_patrol_report_id and public.can_manage_bmu_compliance(r.bmu_id)));

drop policy if exists "bmu patrol outcomes scoped read" on public.bmu_patrol_outcomes;
create policy "bmu patrol outcomes scoped read" on public.bmu_patrol_outcomes
  for select using (exists (select 1 from public.bmu_patrol_reports r where r.id = bmu_patrol_report_id and public.can_access_compliance_scope(r.county_id, r.bmu_id)));

drop policy if exists "bmu patrol outcomes scoped manage" on public.bmu_patrol_outcomes;
create policy "bmu patrol outcomes scoped manage" on public.bmu_patrol_outcomes
  for all using (exists (select 1 from public.bmu_patrol_reports r where r.id = bmu_patrol_report_id and public.can_manage_bmu_compliance(r.bmu_id)))
  with check (exists (select 1 from public.bmu_patrol_reports r where r.id = bmu_patrol_report_id and public.can_manage_bmu_compliance(r.bmu_id)));

drop policy if exists "patrol data capture scoped read" on public.patrol_data_capture_records;
create policy "patrol data capture scoped read" on public.patrol_data_capture_records
  for select using (public.can_access_compliance_scope(county_id, bmu_id));

drop policy if exists "patrol data capture scoped manage" on public.patrol_data_capture_records;
create policy "patrol data capture scoped manage" on public.patrol_data_capture_records
  for all using (public.can_manage_bmu_compliance(bmu_id))
  with check (public.can_manage_bmu_compliance(bmu_id));

drop policy if exists "seizure scoped read" on public.seizure_records;
create policy "seizure scoped read" on public.seizure_records
  for select using (public.can_access_compliance_scope(county_id, bmu_id));

drop policy if exists "seizure scoped manage" on public.seizure_records;
create policy "seizure scoped manage" on public.seizure_records
  for all using (
    (patrol_report_id is not null and public.can_manage_officer_compliance(county_id))
    or (bmu_patrol_report_id is not null and public.can_manage_bmu_compliance(bmu_id))
    or public.current_profile_role() = 'Government Admin'
  ) with check (
    (patrol_report_id is not null and public.can_manage_officer_compliance(county_id))
    or (bmu_patrol_report_id is not null and public.can_manage_bmu_compliance(bmu_id))
    or public.current_profile_role() = 'Government Admin'
  );

drop policy if exists "seized items scoped read" on public.seized_items;
create policy "seized items scoped read" on public.seized_items
  for select using (exists (select 1 from public.seizure_records r where r.id = seizure_record_id and public.can_access_compliance_scope(r.county_id, r.bmu_id)));

drop policy if exists "seized items scoped manage" on public.seized_items;
create policy "seized items scoped manage" on public.seized_items
  for all using (exists (
    select 1 from public.seizure_records r
    where r.id = seizure_record_id
      and (
        (r.patrol_report_id is not null and public.can_manage_officer_compliance(r.county_id))
        or (r.bmu_patrol_report_id is not null and public.can_manage_bmu_compliance(r.bmu_id))
        or public.current_profile_role() = 'Government Admin'
      )
  )) with check (exists (
    select 1 from public.seizure_records r
    where r.id = seizure_record_id
      and (
        (r.patrol_report_id is not null and public.can_manage_officer_compliance(r.county_id))
        or (r.bmu_patrol_report_id is not null and public.can_manage_bmu_compliance(r.bmu_id))
        or public.current_profile_role() = 'Government Admin'
      )
  ));

drop policy if exists "compliance documents scoped read" on public.compliance_documents;
create policy "compliance documents scoped read" on public.compliance_documents
  for select using (public.can_access_compliance_document_scope(owner_table, owner_id));

drop policy if exists "compliance documents scoped manage" on public.compliance_documents;
create policy "compliance documents scoped manage" on public.compliance_documents
  for all using (public.can_manage_compliance_document_scope(owner_table, owner_id))
  with check (public.can_manage_compliance_document_scope(owner_table, owner_id));

drop policy if exists "audit compliance actors insert" on public.audit_logs;
create policy "audit compliance actors insert" on public.audit_logs
  for insert with check (
    public.current_profile_role() in ('Government Admin','KFS Officer','County Officer','BMU Manager','Ranger')
  );
