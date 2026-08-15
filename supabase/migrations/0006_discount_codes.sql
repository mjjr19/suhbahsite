-- Discount codes: a reusable blanket promo (percent off, anyone) and
-- staff-issued financial aid codes (percent off, up to 100%, meant for one
-- family). Both stack on top of the existing sibling/family discounts as a
-- third compounding layer applied last (see lib/pricing/calculateOrder.ts).
--
-- Reservation is atomic and happens at CHECKOUT time, not webhook time —
-- a plain "check now, increment later" would leave a race window open for
-- the entire lifetime of a Stripe Checkout Session (up to 24h), not just a
-- single instant, since nothing re-validates between checkout and payment
-- completion. reserve_discount_code() closes that: it's a single atomic
-- UPDATE, so two concurrent/sequential attempts against a max_uses:1 code
-- can't both succeed. release_discount_code() undoes a reservation if
-- Stripe session creation subsequently fails, so an aborted attempt doesn't
-- permanently burn a use.

create table discount_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  kind text not null check (kind in ('blanket', 'financial_aid')),
  percent_off integer not null check (percent_off between 1 and 100),
  max_uses integer,
  used_count integer not null default 0,
  expires_at timestamptz,
  is_active boolean not null default true,
  notes text,
  created_by uuid references staff(id),
  created_at timestamptz not null default now()
);

alter table discount_codes enable row level security;

-- Admin-only, same boundary as payments/staff/registrations. The public
-- check endpoint and checkout route use the service-role client instead,
-- same as pending_checkouts — no anon/authenticated policy at all.
create policy "Admin staff can manage discount codes" on discount_codes for all
  using (is_admin_staff()) with check (is_admin_staff());

create or replace function reserve_discount_code(p_code text)
returns discount_codes
language sql
security definer
set search_path = public
as $$
  update discount_codes
    set used_count = used_count + 1
    where code = upper(trim(p_code))
      and is_active
      and (expires_at is null or expires_at > now())
      and (max_uses is null or used_count < max_uses)
    returning *;
$$;

create or replace function release_discount_code(p_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update discount_codes
    set used_count = greatest(0, used_count - 1)
    where id = p_id;
$$;

grant execute on function reserve_discount_code(text) to service_role;
grant execute on function release_discount_code(uuid) to service_role;

alter table pending_checkouts
  add column discount_code_id uuid references discount_codes(id),
  add column discount_code_percent_off integer;
-- children jsonb gains a matching per-child `codeDiscountCents` field,
-- alongside the existing siblingDiscountCents/familyDiscountCents — no
-- schema change needed for that, it's just a new key in the existing jsonb.

-- consume_pending_checkout(): add the code discount to discount_notes, and
-- stop hardcoding payment method to 'stripe' — the new $0 full-comp path
-- (checkout route calls this function directly, no Stripe session at all)
-- means stripe_session_id can be null.
create or replace function consume_pending_checkout(p_id uuid)
returns table (claimed boolean, inserted_count integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_checkout pending_checkouts;
  v_child jsonb;
  v_session_ids uuid[];
  v_registration_id uuid;
  v_weekday_map jsonb := '{"sunday":0,"monday":1,"tuesday":2,"wednesday":3,"thursday":4,"friday":5,"saturday":6}'::jsonb;
  v_count integer := 0;
  v_notes text;
  v_payment_method text;
begin
  update pending_checkouts
    set consumed_at = now()
    where id = p_id and consumed_at is null
    returning * into v_checkout;

  if not found then
    return query select false, 0;
    return;
  end if;

  v_payment_method := case when v_checkout.stripe_session_id is null then 'other' else 'stripe' end;

  for v_child in select * from jsonb_array_elements(v_checkout.children)
  loop
    if v_child->'sessionAssignment'->>'mode' = 'picked' then
      select array_agg(elem::uuid) into v_session_ids
        from jsonb_array_elements_text(v_child->'sessionAssignment'->'sessionIds') as elem;
    elsif v_child->'sessionAssignment'->>'mode' = 'weekday' then
      select array_agg(s.id) into v_session_ids
        from sessions s
        where s.program_slug = v_checkout.program_slug
          and s.status = 'scheduled'
          and extract(dow from s.session_date) =
            (v_weekday_map->>(v_child->'sessionAssignment'->>'weekday'))::int;
    else
      select array_agg(s.id) into v_session_ids
        from sessions s
        where s.program_slug = v_checkout.program_slug
          and s.status = 'scheduled';
    end if;

    v_notes := nullif(trim(both ' ' from
      (case when coalesce((v_child->>'siblingDiscountCents')::int, 0) > 0
        then 'Sibling discount applied. ' else '' end) ||
      (case when coalesce((v_child->>'familyDiscountCents')::int, 0) > 0
        then 'SuhbahFamily discount applied. ' else '' end) ||
      (case when coalesce((v_child->>'codeDiscountCents')::int, 0) > 0
        then 'Discount code applied.' else '' end)
    ), '');

    insert into registrations (
      program_slug, registered_at, child_name, child_age,
      parent_name, parent_email, parent_phone,
      package_selected, payment_method, payment_status, amount_paid_cents,
      discount_notes
    ) values (
      v_checkout.program_slug, now(), v_child->>'playerName',
      case when v_child->>'playerDob' is not null
        then round((extract(epoch from (now() - (v_child->>'playerDob')::date))
          / (365.25 * 86400))::numeric, 2)::text
        else null end,
      v_checkout.parent_name, v_checkout.parent_email, v_checkout.parent_phone,
      v_child->>'packageLabel', v_payment_method, 'paid', (v_child->>'finalPriceCents')::int,
      v_notes
    )
    returning id into v_registration_id;

    insert into payments (registration_id, amount_cents, method, paid_at, notes)
    values (
      v_registration_id, (v_child->>'finalPriceCents')::int, v_payment_method, current_date,
      case when v_checkout.stripe_session_id is not null
        then 'Stripe Checkout session ' || v_checkout.stripe_session_id
        else 'Comped via discount code (pending_checkouts ' || v_checkout.id::text || ')'
      end
    );

    if v_session_ids is not null and array_length(v_session_ids, 1) > 0 then
      insert into session_registrations (session_id, registration_id)
      select unnest(v_session_ids), v_registration_id;
    end if;

    v_count := v_count + 1;
  end loop;

  return query select true, v_count;
end;
$$;

grant execute on function consume_pending_checkout(uuid) to service_role;
