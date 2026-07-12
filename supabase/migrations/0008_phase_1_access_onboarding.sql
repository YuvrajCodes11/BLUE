-- Phase 1 foundation hardening: structured access requests, scoped profile assignments,
-- and practical consent/onboarding gate fields.

alter table public.access_requests add column if not exists requested_role public.blue_role;
alter table public.access_requests add column if not exists access_type text;
alter table public.access_requests add column if not exists organization_type text;
alter table public.access_requests add column if not exists organization_name text;
alter table public.access_requests add column if not exists county_id uuid references public.counties(id) on delete set null;
alter table public.access_requests add column if not exists sub_county_id uuid references public.sub_counties(id) on delete set null;
alter table public.access_requests add column if not exists ward_id uuid references public.wards(id) on delete set null;
alter table public.access_requests add column if not exists bmu_id uuid references public.bmus(id) on delete set null;
alter table public.access_requests add column if not exists reviewed_by uuid references public.profiles(id) on delete set null;
alter table public.access_requests add column if not exists reviewed_at timestamptz;
alter table public.access_requests add column if not exists review_notes text;

alter table public.profiles add column if not exists sub_county_id uuid references public.sub_counties(id) on delete set null;
alter table public.profiles add column if not exists ward_id uuid references public.wards(id) on delete set null;
alter table public.profiles add column if not exists consent_accepted_at timestamptz;
alter table public.profiles add column if not exists data_usage_accepted_at timestamptz;
alter table public.profiles add column if not exists onboarding_completed_at timestamptz;
alter table public.profiles add column if not exists onboarding_status text not null default 'pending';

create index if not exists access_requests_status_idx on public.access_requests(status, created_at desc);
create index if not exists access_requests_scope_idx on public.access_requests(county_id, sub_county_id, ward_id, bmu_id);
create index if not exists profiles_scope_idx on public.profiles(role, county_id, sub_county_id, ward_id, bmu_id);

drop policy if exists "counties public read for access request" on public.counties;
create policy "counties public read for access request" on public.counties for select using (true);

drop policy if exists "sub counties public read for access request" on public.sub_counties;
create policy "sub counties public read for access request" on public.sub_counties for select using (true);

drop policy if exists "wards public read for access request" on public.wards;
create policy "wards public read for access request" on public.wards for select using (true);

drop policy if exists "bmus public read for access request" on public.bmus;
create policy "bmus public read for access request" on public.bmus for select using (true);

drop policy if exists "access requests admin update" on public.access_requests;
create policy "access requests admin update" on public.access_requests
  for update using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'Government Admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'Government Admin'));
