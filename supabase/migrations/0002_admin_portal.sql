-- Admin portal schema. Replaces the Phase 1 Stripe-only players/registrations
-- shape with the unified model used by the admin portal (seasons/packages,
-- CSV-imported historical registrations, and future Stripe/Sanity-program
-- registrations all in one table). Only test-mode data existed in the old
-- tables, so they're dropped rather than migrated.

drop table if exists registrations cascade;
drop table if exists players cascade;

-- Seasons: one row per camp/quarter cohort (Summer 2025, Fall 2025, Winter 2026, ...)
create table seasons (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  program_type text not null check (program_type in ('weekly_camp', 'quarter')),
  start_date date,
  end_date date,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

-- Sessions: individual weeks/dates within a season
create table sessions (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references seasons(id) on delete cascade,
  label text not null,
  session_date date,
  price_cents integer,
  sort_order integer not null default 0
);

-- Packages: bundles offered for a season (Full Quarter, Half Quarter, etc.)
create table packages (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references seasons(id) on delete cascade,
  name text not null,
  price_cents integer not null,
  sessions_included integer,
  is_active boolean not null default true
);

-- Staff: admin portal users, all equal access per current requirements
create table staff (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id),
  full_name text not null,
  email text not null unique,
  is_active boolean not null default true,
  invited_by uuid references staff(id),
  invited_at timestamptz not null default now(),
  accepted_at timestamptz
);

-- Registrations: one row per child per season OR per Sanity-driven program.
-- season_id/program_slug: exactly one is set. season_id covers season-based
-- signups (CSV-imported historical rows, future admin-created ones);
-- program_slug covers the live Stripe checkout flow, which registers against
-- a Sanity `program` document rather than a Supabase season.
create table registrations (
  id uuid primary key default gen_random_uuid(),
  season_id uuid references seasons(id),
  program_slug text,
  legacy_registration_id text unique,
  registered_at timestamptz,
  child_name text not null,
  child_age text,
  parent_name text,
  parent_email text,
  parent_phone text,
  address text,
  emergency_contact_name text,
  emergency_contact_phone text,
  emergency_contact_email text,
  allergies text,
  medications text,
  package_selected text,
  package_id uuid references packages(id),
  payment_method text,
  payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid', 'partial', 'paid')),
  amount_paid_cents integer not null default 0,
  discount_notes text,
  zelle_payer_name text,
  receipt_url text,
  data_quality_flags text,
  created_by uuid references staff(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint registrations_season_or_program check (
    (season_id is not null and program_slug is null) or
    (season_id is null and program_slug is not null)
  )
);

-- Payments: ledger supporting partial/multiple payments per registration
create table payments (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references registrations(id) on delete cascade,
  amount_cents integer not null,
  method text not null check (method in ('zelle', 'cash', 'stripe', 'other')),
  paid_at date not null,
  receipt_url text,
  recorded_by uuid references staff(id),
  notes text,
  created_at timestamptz not null default now()
);

alter table seasons enable row level security;
alter table sessions enable row level security;
alter table packages enable row level security;
alter table registrations enable row level security;
alter table payments enable row level security;
alter table staff enable row level security;

-- Policies on `staff` (and any policy that checks staff membership) can't
-- just subquery `staff` directly from within its own RLS-protected table,
-- or from other tables' policies re-checking staff on every row — Postgres
-- re-applies staff's RLS to that inner query, causing infinite recursion.
-- A `security definer` helper function bypasses RLS for that one lookup and
-- breaks the cycle. This is the standard fix for "check staff membership"
-- policies in Supabase.
create or replace function is_active_staff()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from staff
    where auth_user_id = auth.uid() and is_active
  );
$$;

create policy "Public can view seasons" on seasons for select using (true);
create policy "Staff can manage seasons" on seasons for all
  using (is_active_staff()) with check (is_active_staff());

create policy "Public can view sessions" on sessions for select using (true);
create policy "Staff can manage sessions" on sessions for all
  using (is_active_staff()) with check (is_active_staff());

create policy "Public can view packages" on packages for select using (true);
create policy "Staff can manage packages" on packages for all
  using (is_active_staff()) with check (is_active_staff());

create policy "Staff can manage registrations" on registrations for all
  using (is_active_staff()) with check (is_active_staff());

create policy "Staff can manage payments" on payments for all
  using (is_active_staff()) with check (is_active_staff());

create policy "Staff can view staff" on staff for select using (is_active_staff());
create policy "Staff can manage staff" on staff for all
  using (is_active_staff()) with check (is_active_staff());
