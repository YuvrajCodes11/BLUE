-- Phase 2A: BMU setup/profile management and private certificate verification.
-- Requires 0006 location hierarchy and 0008 profile scope fields.

alter table public.bmus add column if not exists setup_status text;
alter table public.bmus add column if not exists certificate_status text;
alter table public.bmus add column if not exists verified_at timestamptz;
alter table public.bmus add column if not exists verified_by uuid references public.profiles(id) on delete set null;
alter table public.bmus add column if not exists setup_updated_at timestamptz;

create table if not exists public.bmu_certificates (
  id uuid primary key default gen_random_uuid(),
  bmu_id uuid not null references public.bmus(id) on delete cascade,
  uploaded_by uuid references public.profiles(id) on delete set null,
  reviewed_by uuid references public.profiles(id) on delete set null,
  certificate_type text,
  certificate_number text,
  area text,
  issue_date date,
  expiry_date date,
  storage_bucket text not null default 'bmu-certificates',
  storage_path text not null,
  file_name text not null,
  mime_type text,
  file_size_bytes bigint,
  status text not null default 'Pending',
  review_notes text,
  verified_at timestamptz,
  rejected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bmu_certificates_status_check check (status in ('Pending','Verified','Rejected','Expired'))
);

create index if not exists bmu_certificates_bmu_status_idx on public.bmu_certificates(bmu_id, status, created_at desc);
create index if not exists bmu_certificates_storage_path_idx on public.bmu_certificates(storage_bucket, storage_path);

alter table public.bmu_certificates enable row level security;

insert into storage.buckets (id, name, public)
values ('bmu-certificates', 'bmu-certificates', false)
on conflict (id) do update set public = false;

create or replace function public.can_access_bmu_setup(record_bmu_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    left join public.bmus b on b.id = record_bmu_id
    where p.id = auth.uid()
      and (
        p.role = 'Government Admin'
        or p.role = 'KFS Officer'
        or (p.role = 'County Officer' and b.id is not null and (p.county_id is null or b.county_id = p.county_id or b.county = p.county))
        or (p.role = 'BMU Manager' and p.bmu_id is not null and p.bmu_id = record_bmu_id)
      )
  )
$$;

create or replace function public.can_manage_bmu_setup(record_bmu_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    left join public.bmus b on b.id = record_bmu_id
    where p.id = auth.uid()
      and (
        p.role = 'Government Admin'
        or (p.role = 'County Officer' and b.id is not null and (p.county_id is null or b.county_id = p.county_id or b.county = p.county))
        or (p.role = 'BMU Manager' and p.bmu_id is not null and p.bmu_id = record_bmu_id)
      )
  )
$$;

create or replace function public.can_review_bmu_certificate(record_bmu_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    left join public.bmus b on b.id = record_bmu_id
    where p.id = auth.uid()
      and (
        p.role = 'Government Admin'
        or (p.role = 'County Officer' and b.id is not null and (p.county_id is null or b.county_id = p.county_id or b.county = p.county))
      )
  )
$$;

drop policy if exists "bmus scoped setup read" on public.bmus;
create policy "bmus scoped setup read" on public.bmus
  for select using (public.can_access_bmu_setup(id));

drop policy if exists "bmus scoped setup update" on public.bmus;
create policy "bmus scoped setup update" on public.bmus
  for update using (public.can_manage_bmu_setup(id))
  with check (public.can_manage_bmu_setup(id));

drop policy if exists "bmu certificates scoped read" on public.bmu_certificates;
create policy "bmu certificates scoped read" on public.bmu_certificates
  for select using (public.can_access_bmu_setup(bmu_id));

drop policy if exists "bmu certificates scoped insert" on public.bmu_certificates;
create policy "bmu certificates scoped insert" on public.bmu_certificates
  for insert with check (public.can_manage_bmu_setup(bmu_id));

drop policy if exists "bmu certificates scoped update" on public.bmu_certificates;
create policy "bmu certificates scoped update" on public.bmu_certificates
  for update using (public.can_manage_bmu_setup(bmu_id) or public.can_review_bmu_certificate(bmu_id))
  with check (public.can_manage_bmu_setup(bmu_id) or public.can_review_bmu_certificate(bmu_id));

drop policy if exists "bmu certificates scoped delete" on public.bmu_certificates;
create policy "bmu certificates scoped delete" on public.bmu_certificates
  for delete using (public.current_profile_role() = 'Government Admin');

drop policy if exists "bmu certificate files scoped read" on storage.objects;
create policy "bmu certificate files scoped read" on storage.objects
  for select using (
    bucket_id = 'bmu-certificates'
    and exists (
      select 1
      from public.bmu_certificates c
      where c.storage_bucket = bucket_id
        and c.storage_path = name
        and public.can_access_bmu_setup(c.bmu_id)
    )
  );

drop policy if exists "bmu certificate files scoped upload" on storage.objects;
create policy "bmu certificate files scoped upload" on storage.objects
  for insert with check (
    bucket_id = 'bmu-certificates'
    and public.can_manage_bmu_setup(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists "bmu certificate files scoped update" on storage.objects;
create policy "bmu certificate files scoped update" on storage.objects
  for update using (
    bucket_id = 'bmu-certificates'
    and public.can_manage_bmu_setup(((storage.foldername(name))[1])::uuid)
  ) with check (
    bucket_id = 'bmu-certificates'
    and public.can_manage_bmu_setup(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists "bmu certificate files admin delete" on storage.objects;
create policy "bmu certificate files admin delete" on storage.objects
  for delete using (bucket_id = 'bmu-certificates' and public.current_profile_role() = 'Government Admin');
