create table if not exists public.access_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  organization text not null,
  message text,
  status text not null default 'Pending',
  created_at timestamptz not null default now()
);

create table if not exists public.gear_records (
  id uuid primary key default gen_random_uuid(),
  fisher_id uuid references public.fishers(id) on delete cascade,
  gear_type text not null,
  quantity integer not null default 1,
  status text not null default 'Active',
  created_at timestamptz not null default now()
);

create table if not exists public.landing_sites (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  county text not null,
  latitude numeric(10,7),
  longitude numeric(10,7),
  status text not null default 'Active'
);

create table if not exists public.beneficiaries (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.ngo_projects(id) on delete set null,
  name text not null,
  county text,
  status text not null default 'Active',
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  title text not null,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  created_at timestamptz not null default now()
);

alter table public.access_requests enable row level security;
alter table public.gear_records enable row level security;
alter table public.landing_sites enable row level security;
alter table public.beneficiaries enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;

create policy "access requests insert public" on public.access_requests for insert with check (true);
create policy "access requests admin read" on public.access_requests for select using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'Government Admin'));
create policy "gear authenticated read" on public.gear_records for select using (auth.role() = 'authenticated');
create policy "landing sites authenticated read" on public.landing_sites for select using (auth.role() = 'authenticated');
create policy "beneficiaries authenticated read" on public.beneficiaries for select using (auth.role() = 'authenticated');
create policy "notifications own read" on public.notifications for select using (auth.uid() = user_id);
create policy "audit admin read" on public.audit_logs for select using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'Government Admin'));
