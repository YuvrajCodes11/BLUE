-- Production RLS policies for first connected modules.
-- These assume public.profiles.id = auth.uid() and public.profiles.role stores the BLUE role enum.

drop policy if exists "fishers admin bmu county manage" on public.fishers;
create policy "fishers admin bmu county manage" on public.fishers
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('Government Admin','BMU Manager','County Officer'))
  ) with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('Government Admin','BMU Manager','County Officer'))
  );

drop policy if exists "vessels admin bmu county manage" on public.vessels;
create policy "vessels admin bmu county manage" on public.vessels
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('Government Admin','BMU Manager','County Officer'))
  ) with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('Government Admin','BMU Manager','County Officer'))
  );

drop policy if exists "gear admin bmu county manage" on public.gear_records;
create policy "gear admin bmu county manage" on public.gear_records
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('Government Admin','BMU Manager','County Officer'))
  ) with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('Government Admin','BMU Manager','County Officer'))
  );

drop policy if exists "catch admin bmu county kfs manage" on public.catch_records;
create policy "catch admin bmu county kfs manage" on public.catch_records
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('Government Admin','BMU Manager','County Officer','KFS Officer'))
  ) with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('Government Admin','BMU Manager','County Officer','KFS Officer'))
  );

drop policy if exists "landing sites admin county kfs manage" on public.landing_sites;
create policy "landing sites admin county kfs manage" on public.landing_sites
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('Government Admin','County Officer','KFS Officer'))
  ) with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('Government Admin','County Officer','KFS Officer'))
  );

drop policy if exists "access requests admin update" on public.access_requests;
create policy "access requests admin update" on public.access_requests
  for update using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'Government Admin')
  ) with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'Government Admin')
  );
