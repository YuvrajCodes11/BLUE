create extension if not exists "pgcrypto";

create type public.blue_role as enum (
  'Government Admin',
  'KFS Officer',
  'County Officer',
  'BMU Manager',
  'Ranger',
  'NGO Program Manager',
  'Donor',
  'Fisher'
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role public.blue_role not null default 'Fisher',
  county text,
  bmu_id uuid,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table public.bmus (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  county text not null,
  registration_code text unique not null,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table public.fishers (
  id uuid primary key default gen_random_uuid(),
  bmu_id uuid not null references public.bmus(id) on delete cascade,
  full_name text not null,
  phone text,
  membership_status text not null default 'pending',
  qr_code text unique not null default encode(gen_random_bytes(12), 'hex'),
  created_at timestamptz not null default now()
);

create table public.vessels (
  id uuid primary key default gen_random_uuid(),
  fisher_id uuid not null references public.fishers(id) on delete cascade,
  vessel_name text not null,
  registration_number text,
  ownership_type text,
  created_at timestamptz not null default now()
);

create table public.catch_records (
  id uuid primary key default gen_random_uuid(),
  bmu_id uuid not null references public.bmus(id) on delete cascade,
  fisher_id uuid references public.fishers(id) on delete set null,
  species text not null,
  weight_kg numeric(12,2) not null,
  landing_site text not null,
  recorded_at timestamptz not null default now()
);

create table public.compliance_records (
  id uuid primary key default gen_random_uuid(),
  bmu_id uuid references public.bmus(id) on delete set null,
  officer_id uuid references public.profiles(id) on delete set null,
  record_type text not null,
  finding text not null,
  action_taken text,
  created_at timestamptz not null default now()
);

create table public.ngo_projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  donor_name text,
  budget numeric(14,2) not null default 0,
  impact_score numeric(5,2) not null default 0,
  created_at timestamptz not null default now()
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  owner_type text not null,
  storage_path text not null,
  document_type text not null,
  created_at timestamptz not null default now()
);

create index fishers_bmu_id_idx on public.fishers(bmu_id);
create index vessels_fisher_id_idx on public.vessels(fisher_id);
create index catch_records_bmu_id_recorded_at_idx on public.catch_records(bmu_id, recorded_at desc);
create index compliance_records_bmu_id_created_at_idx on public.compliance_records(bmu_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.bmus enable row level security;
alter table public.fishers enable row level security;
alter table public.vessels enable row level security;
alter table public.catch_records enable row level security;
alter table public.compliance_records enable row level security;
alter table public.ngo_projects enable row level security;
alter table public.documents enable row level security;

create policy "profiles read own or admin" on public.profiles for select using (auth.uid() = id or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'Government Admin'));
create policy "bmu read authenticated" on public.bmus for select using (auth.role() = 'authenticated');
create policy "fishers read authenticated" on public.fishers for select using (auth.role() = 'authenticated');
create policy "vessels read authenticated" on public.vessels for select using (auth.role() = 'authenticated');
create policy "catch read authenticated" on public.catch_records for select using (auth.role() = 'authenticated');
create policy "compliance read authenticated" on public.compliance_records for select using (auth.role() = 'authenticated');
create policy "ngo read authenticated" on public.ngo_projects for select using (auth.role() = 'authenticated');
create policy "documents read authenticated" on public.documents for select using (auth.role() = 'authenticated');

insert into public.bmus (name, county, registration_code) values
  ('Kilifi Creek BMU', 'Kilifi', 'KE-BMU-2017-002'),
  ('Diani Reef BMU', 'Kwale', 'KE-BMU-2019-014'),
  ('Homa Bay Central BMU', 'Homa Bay', 'KE-BMU-2016-101');
