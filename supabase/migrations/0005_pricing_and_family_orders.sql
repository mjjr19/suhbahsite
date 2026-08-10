-- Multi-child checkout with per-child stacked discounts (sibling + returning
-- "SuhbahFamily" household). Stripe metadata can't hold a variable-length,
-- per-child priced breakdown (500-char/value, 50-key limits), so checkout
-- validates and prices everything server-side and freezes it into one row
-- here; the webhook only replays it via consume_pending_checkout() below —
-- no pricing logic duplicated, no metadata size risk.

create table pending_checkouts (
  id uuid primary key default gen_random_uuid(),
  program_slug text not null,
  parent_name text,
  parent_email text not null,
  parent_phone text,
  suhbah_family_applied boolean not null default false,
  children jsonb not null,
  -- each element: { playerName, playerDob, packageLabel,
  --   sessionAssignment: { mode: "full" | "weekday" | "picked", weekday?: string, sessionIds?: string[] },
  --   basePriceCents, siblingDiscountCents, familyDiscountCents, finalPriceCents }
  total_cents integer not null,
  stripe_session_id text,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table pending_checkouts enable row level security;
-- Deliberately zero policies: only the service-role client (checkout route,
-- webhook) ever touches this table. No anon/authenticated access at all.

-- Atomically claims a pending checkout and creates every child's
-- registrations/payments/session_registrations rows in one transaction.
-- The claim (consumed_at IS NULL -> now()) and every insert live in a single
-- function call, so: concurrent Stripe webhook retries can't both pass the
-- claim (Postgres row locking makes it atomic), and a failure partway
-- through rolls the whole thing back — including the claim — so a retry
-- safely reprocesses from scratch instead of being stuck half-done forever.
--
-- Session assignment: "picked" (a parent's explicit date choice) uses the
-- ids frozen at checkout time. "full" and "weekday" are auto-assignments
-- re-resolved against the *current* sessions table right now, at payment
-- completion, rather than using anything frozen at checkout time — a Stripe
-- Checkout Session can stay open up to 24h, and re-resolving here keeps the
-- staleness window as small as it already was before this change (sessions
-- added while a payment is in flight are still caught, right up until this
-- point). Known limitation, same as before: sessions added *after* this
-- point won't retroactively include already-registered full/weekday
-- registrants.
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
begin
  update pending_checkouts
    set consumed_at = now()
    where id = p_id and consumed_at is null
    returning * into v_checkout;

  if not found then
    return query select false, 0;
    return;
  end if;

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
        then 'SuhbahFamily discount applied.' else '' end)
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
      v_child->>'packageLabel', 'stripe', 'paid', (v_child->>'finalPriceCents')::int,
      v_notes
    )
    returning id into v_registration_id;

    insert into payments (registration_id, amount_cents, method, paid_at, notes)
    values (
      v_registration_id, (v_child->>'finalPriceCents')::int, 'stripe', current_date,
      'Stripe Checkout session ' || coalesce(v_checkout.stripe_session_id, v_checkout.id::text)
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
