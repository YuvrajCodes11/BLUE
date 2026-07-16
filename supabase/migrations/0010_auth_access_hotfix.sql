-- Phase 1 auth/access hotfix: admin credential recovery controls.
-- All fields are nullable/backward-compatible except the boolean default.

alter table public.profiles add column if not exists password_setup_required boolean not null default false;
alter table public.profiles add column if not exists password_setup_sent_at timestamptz;
alter table public.profiles add column if not exists temporary_password_generated_at timestamptz;
alter table public.profiles add column if not exists last_credential_action_at timestamptz;
alter table public.profiles add column if not exists last_credential_action_by uuid references public.profiles(id) on delete set null;

create index if not exists profiles_password_setup_idx on public.profiles(password_setup_required, onboarding_status);
