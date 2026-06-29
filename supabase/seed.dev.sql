-- Safe development seed. No secrets.
-- 1) Create auth users in Supabase Auth manually.
-- 2) Replace the sample UUID below with the auth.users.id for your admin user.

insert into public.bmus (name, county, registration_code, status)
values ('Kilifi Creek BMU', 'Kilifi', 'KE-BMU-SEED-001', 'active')
on conflict (registration_code) do nothing;

insert into public.landing_sites (name, county, latitude, longitude, status)
values ('Kilifi Landing', 'Kilifi', -3.6302000, 39.8499000, 'Active');

insert into public.species_records (common_name, scientific_name, category, status)
values
  ('Yellowfin Tuna', 'Thunnus albacares', 'Pelagic', 'Active'),
  ('Rabbitfish', 'Siganus sutor', 'Reef', 'Active'),
  ('Parrotfish', 'Scaridae', 'Reef', 'Flagged');

-- Example admin profile setup after creating auth user:
-- insert into public.profiles (id, full_name, role, county, is_active)
-- values ('00000000-0000-0000-0000-000000000000', 'BLUE Admin', 'Government Admin', 'National', true);
