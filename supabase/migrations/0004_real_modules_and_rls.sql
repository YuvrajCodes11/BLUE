-- Complete production tables/policies for connected modules.

alter table public.profiles add column if not exists is_active boolean not null default true;

create table if not exists public.species_records (
  id uuid primary key default gen_random_uuid(),
  common_name text not null,
  scientific_name text,
  category text not null,
  status text not null default 'Active',
  created_at timestamptz not null default now()
);

alter table public.species_records enable row level security;

drop policy if exists "species authenticated read" on public.species_records;
create policy "species authenticated read" on public.species_records for select using (auth.role() = 'authenticated');

drop policy if exists "species kfs admin manage" on public.species_records;
create policy "species kfs admin manage" on public.species_records
  for all using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('Government Admin','KFS Officer')))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('Government Admin','KFS Officer')));

drop policy if exists "profiles admin update" on public.profiles;
create policy "profiles admin update" on public.profiles
  for update using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'Government Admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'Government Admin'));

drop policy if exists "profiles admin insert" on public.profiles;
create policy "profiles admin insert" on public.profiles
  for insert with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'Government Admin'));

drop policy if exists "beneficiaries ngo admin manage" on public.beneficiaries;
create policy "beneficiaries ngo admin manage" on public.beneficiaries
  for all using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('Government Admin','NGO Program Manager')))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('Government Admin','NGO Program Manager')));

drop policy if exists "projects ngo admin manage" on public.ngo_projects;
create policy "projects ngo admin manage" on public.ngo_projects
  for all using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('Government Admin','NGO Program Manager')))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('Government Admin','NGO Program Manager')));

drop policy if exists "projects donor read" on public.ngo_projects;
create policy "projects donor read" on public.ngo_projects for select using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('Donor','NGO Program Manager','Government Admin'))
);

drop policy if exists "compliance ranger kfs admin manage" on public.compliance_records;
create policy "compliance ranger kfs admin manage" on public.compliance_records
  for all using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('Government Admin','KFS Officer','Ranger','BMU Manager','County Officer')))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('Government Admin','KFS Officer','Ranger','BMU Manager','County Officer')));

drop policy if exists "notifications admin insert" on public.notifications;
create policy "notifications admin insert" on public.notifications for insert with check (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'Government Admin')
);

drop policy if exists "audit admin insert" on public.audit_logs;
create policy "audit admin insert" on public.audit_logs for insert with check (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'Government Admin')
);

-- Fisher own-record read: current schema does not yet link auth profile directly to fishers.
-- Production setup should add profile_id/fisher_user_id when fisher self-service is enabled.
