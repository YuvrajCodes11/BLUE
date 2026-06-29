-- BLUE development seed data. Fake/demo data only. No secrets.

insert into public.bmus (id, name, county, registration_code, status)
values ('11111111-1111-1111-1111-111111111111', 'Kilifi Creek BMU', 'Kilifi', 'KE-BMU-DEMO-001', 'active')
on conflict (registration_code) do nothing;

insert into public.landing_sites (id, name, county, latitude, longitude, status)
values ('22222222-2222-2222-2222-222222222222', 'Kilifi Landing', 'Kilifi', -3.6302000, 39.8499000, 'Active')
on conflict (id) do nothing;

insert into public.species_records (id, common_name, scientific_name, category, status)
values
  ('33333333-3333-3333-3333-333333333331', 'Yellowfin Tuna', 'Thunnus albacares', 'Pelagic', 'Active'),
  ('33333333-3333-3333-3333-333333333332', 'Rabbitfish', 'Siganus sutor', 'Reef', 'Active'),
  ('33333333-3333-3333-3333-333333333333', 'Parrotfish', 'Scaridae', 'Reef', 'Flagged')
on conflict (id) do nothing;

insert into public.fishers (id, bmu_id, full_name, phone, membership_status)
values ('44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'Demo Fisher', '+254 700 000 001', 'Active')
on conflict (id) do nothing;

insert into public.vessels (id, fisher_id, vessel_name, registration_number, ownership_type)
values ('55555555-5555-5555-5555-555555555555', '44444444-4444-4444-4444-444444444444', 'Demo Blue Vessel', 'KE-DEMO-001', 'Owner')
on conflict (id) do nothing;

insert into public.gear_records (id, fisher_id, gear_type, quantity, status)
values ('66666666-6666-6666-6666-666666666666', '44444444-4444-4444-4444-444444444444', 'Gill net', 4, 'Active')
on conflict (id) do nothing;

insert into public.catch_records (id, bmu_id, fisher_id, species, weight_kg, landing_site)
values ('77777777-7777-7777-7777-777777777777', '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 'Yellowfin Tuna', 120.50, 'Kilifi Landing')
on conflict (id) do nothing;

-- Admin profile placeholder. Replace UUID with a real auth.users.id after creating a Supabase Auth user.
-- insert into public.profiles (id, full_name, role, county, is_active)
-- values ('00000000-0000-0000-0000-000000000000', 'Demo Admin', 'Government Admin', 'National', true);
