-- Players registered by a parent account
create table players (
  id uuid primary key default gen_random_uuid(),
  parent_user_id uuid references auth.users(id) not null,
  full_name text not null,
  date_of_birth date,
  created_at timestamptz default now()
);

-- Program registrations tied to a player, paid for via Stripe
create table registrations (
  id uuid primary key default gen_random_uuid(),
  player_id uuid references players(id) not null,
  program_slug text not null,           -- references Sanity program by slug
  stripe_session_id text,
  stripe_payment_status text,           -- 'pending' | 'paid' | 'refunded'
  amount_cents integer,
  created_at timestamptz default now()
);

alter table players enable row level security;
alter table registrations enable row level security;

-- Parents can only read/write their own players
create policy "Parents can view their own players"
  on players for select
  using (auth.uid() = parent_user_id);

create policy "Parents can insert their own players"
  on players for insert
  with check (auth.uid() = parent_user_id);

create policy "Parents can update their own players"
  on players for update
  using (auth.uid() = parent_user_id);

-- Parents can only read/write registrations for players they own
create policy "Parents can view their own registrations"
  on registrations for select
  using (
    exists (
      select 1 from players
      where players.id = registrations.player_id
      and players.parent_user_id = auth.uid()
    )
  );

create policy "Parents can insert registrations for their own players"
  on registrations for insert
  with check (
    exists (
      select 1 from players
      where players.id = registrations.player_id
      and players.parent_user_id = auth.uid()
    )
  );
