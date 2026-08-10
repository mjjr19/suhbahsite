-- Schedule + attendance. Sessions previously only existed under Supabase
-- `seasons` (zero rows exist today); the live Fall Camp program is a Sanity
-- `program` document instead, so sessions need the same season_id/program_slug
-- either-or shape `registrations` already uses. Also adds a `role` to staff
-- (admin vs coach) so schedule/attendance can be opened up to coaches while
-- payments/registrations/staff management stay admin-only.

alter table sessions
  alter column season_id drop not null,
  add column program_slug text,
  add column start_time time,
  add column end_time time,
  add column status text not null default 'scheduled' check (status in ('scheduled', 'cancelled')),
  add constraint sessions_season_or_program check (
    (season_id is not null and program_slug is null) or
    (season_id is null and program_slug is not null)
  );

create index sessions_program_slug_idx on sessions(program_slug);
create index sessions_season_id_idx on sessions(season_id);

alter table staff
  add column role text not null default 'admin' check (role in ('admin', 'coach'));

-- Roster + attendance combined: every roster entry is 1:1 with an
-- attendance slot, so there's no case for one without the other.
create table session_registrations (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  registration_id uuid not null references registrations(id) on delete cascade,
  attendance_status text not null default 'unmarked'
    check (attendance_status in ('present', 'absent', 'excused', 'unmarked')),
  marked_by uuid references staff(id),
  marked_at timestamptz,
  created_at timestamptz not null default now(),
  unique (session_id, registration_id)
);

create index session_registrations_session_id_idx on session_registrations(session_id);
create index session_registrations_registration_id_idx on session_registrations(registration_id);

alter table session_registrations enable row level security;

-- Second security-definer helper, same recursion-avoidance shape as
-- is_active_staff(): needed because RLS is row-level, not column-level, and
-- `registrations` mixes safety fields (allergies) with financial fields
-- (amount_paid_cents) on the same row. Coaches must not read financial
-- columns, so `registrations` itself becomes admin-only and coaches instead
-- go through session_roster() below, which only returns safety-relevant
-- columns.
create or replace function is_admin_staff()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from staff
    where auth_user_id = auth.uid() and is_active and role = 'admin'
  );
$$;

-- Structurally excludes payment/package/address columns from its return
-- type (not just filtered at query time) so a coach can never receive
-- financial data through this path, regardless of what the caller asks for.
create or replace function session_roster(p_session_id uuid)
returns table (
  session_registration_id uuid,
  registration_id uuid,
  child_name text,
  child_age text,
  allergies text,
  medications text,
  parent_name text,
  parent_phone text,
  attendance_status text,
  marked_by uuid,
  marked_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select
    sr.id as session_registration_id,
    r.id as registration_id,
    r.child_name,
    r.child_age,
    r.allergies,
    r.medications,
    r.parent_name,
    r.parent_phone,
    sr.attendance_status,
    sr.marked_by,
    sr.marked_at
  from session_registrations sr
  join registrations r on r.id = sr.registration_id
  where sr.session_id = p_session_id
    and is_active_staff();
$$;

grant execute on function session_roster(uuid) to authenticated;

-- Coaches manage the schedule and attendance alongside admins.
create policy "Staff can manage session_registrations" on session_registrations for all
  using (is_active_staff()) with check (is_active_staff());

-- "Staff can manage sessions" already uses is_active_staff() from
-- 0002_admin_portal.sql and already covers coaches — no change needed.

-- Payments and staff management stay admin-only.
drop policy "Staff can manage payments" on payments;
create policy "Staff can manage payments" on payments for all
  using (is_admin_staff()) with check (is_admin_staff());

drop policy "Staff can view staff" on staff;
create policy "Staff can view staff" on staff for select using (is_admin_staff());

drop policy "Staff can manage staff" on staff;
create policy "Staff can manage staff" on staff for all
  using (is_admin_staff()) with check (is_admin_staff());

-- Registrations mix safety fields with financial fields on the same row, so
-- the table itself becomes admin-only; coaches read roster data only
-- through session_roster() above. The separate "Parents can view own
-- registrations" policy from 0003_parent_portal.sql is untouched — it's an
-- additive, independent policy unrelated to staff roles.
drop policy "Staff can manage registrations" on registrations;
create policy "Staff can manage registrations" on registrations for all
  using (is_admin_staff()) with check (is_admin_staff());
