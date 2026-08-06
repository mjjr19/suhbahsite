-- Parent portal: link a registration to the Supabase Auth user who owns it,
-- so a parent who checked out as a guest can later sign in with a magic
-- link and see their own registrations/payments. No auth user exists at
-- checkout time (Stripe guest flow), so this starts null and is backfilled
-- lazily on first login by matching parent_email case-insensitively — see
-- app/auth/callback/route.ts. Not unique: one parent can have multiple
-- registrations (siblings, repeat seasons).
alter table registrations
  add column auth_user_id uuid references auth.users(id);

create index registrations_auth_user_id_idx on registrations(auth_user_id);

-- Parents can read (never write) their own registrations once backfilled.
-- Additive to "Staff can manage registrations" — Postgres OR's multiple
-- permissive policies together on the same command, so staff access is
-- unaffected. No is_active_staff()-style security-definer helper needed
-- here: unlike staff checking its own table, this policy only reads
-- auth.uid() and a column on the same row, so there's no recursion risk.
create policy "Parents can view own registrations" on registrations for select
  using (auth_user_id = auth.uid());

-- Parents can read their own payments via the owning registration. Payments
-- has no auth_user_id of its own — ownership is derived through the join.
create policy "Parents can view own payments" on payments for select
  using (exists (
    select 1 from registrations
    where registrations.id = payments.registration_id
    and registrations.auth_user_id = auth.uid()
  ));
