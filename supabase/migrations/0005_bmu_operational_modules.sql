-- BMU operational modules inspired by the client mockup, connected to real Supabase tables.

create table if not exists public.payment_records (
  id uuid primary key default gen_random_uuid(),
  fisher_id uuid references public.fishers(id) on delete set null,
  bmu_id uuid references public.bmus(id) on delete set null,
  payer_name text not null,
  service_type text not null,
  bmu_fee numeric(14,2) not null default 0,
  blue_fee numeric(14,2) not null default 0,
  method text not null default 'Manual',
  reference text,
  status text not null default 'Pending',
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.renewal_records (
  id uuid primary key default gen_random_uuid(),
  fisher_id uuid references public.fishers(id) on delete set null,
  vessel_id uuid references public.vessels(id) on delete set null,
  bmu_id uuid references public.bmus(id) on delete set null,
  holder_name text not null,
  renewal_type text not null,
  expiry_date date not null,
  status text not null default 'Pending',
  created_at timestamptz not null default now()
);

alter table public.payment_records enable row level security;
alter table public.renewal_records enable row level security;

drop policy if exists "payments authenticated read" on public.payment_records;
create policy "payments authenticated read" on public.payment_records
  for select using (auth.role() = 'authenticated');

drop policy if exists "payments bmu county admin manage" on public.payment_records;
create policy "payments bmu county admin manage" on public.payment_records
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('Government Admin','BMU Manager','County Officer'))
  ) with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('Government Admin','BMU Manager','County Officer'))
  );

drop policy if exists "renewals authenticated read" on public.renewal_records;
create policy "renewals authenticated read" on public.renewal_records
  for select using (auth.role() = 'authenticated');

drop policy if exists "renewals bmu county admin manage" on public.renewal_records;
create policy "renewals bmu county admin manage" on public.renewal_records
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('Government Admin','BMU Manager','County Officer'))
  ) with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('Government Admin','BMU Manager','County Officer'))
  );

drop policy if exists "documents bmu county admin manage" on public.documents;
create policy "documents bmu county admin manage" on public.documents
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('Government Admin','BMU Manager','County Officer','KFS Officer','Ranger'))
  ) with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('Government Admin','BMU Manager','County Officer','KFS Officer','Ranger'))
  );
