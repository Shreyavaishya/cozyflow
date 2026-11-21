-- Run this once in Supabase: SQL Editor -> New query -> paste -> Run

create table if not exists public.user_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_data enable row level security;

create policy "read own data" on public.user_data
  for select using (auth.uid() = user_id);
create policy "insert own data" on public.user_data
  for insert with check (auth.uid() = user_id);
create policy "update own data" on public.user_data
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- Pro subscriptions (written only by the server with the service role key) ----------
create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan text not null,
  pro_until timestamptz,
  lifetime boolean not null default false,
  updated_at timestamptz not null default now()
);
alter table public.subscriptions enable row level security;
create policy "read own subscription" on public.subscriptions
  for select using (auth.uid() = user_id);
-- no insert/update policy on purpose: users cannot grant themselves Pro

create table if not exists public.payments (
  order_id text primary key,        -- primary key makes payment verification idempotent
  payment_id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  plan text not null,
  amount integer not null,          -- paise
  created_at timestamptz not null default now()
);
alter table public.payments enable row level security;
create policy "read own payments" on public.payments
  for select using (auth.uid() = user_id);

-- ---------- Sponsors ----------
create table if not exists public.sponsors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  tagline text not null,
  cta text not null default 'Learn more',
  url text not null,
  emoji text not null default '✨',
  active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.sponsors enable row level security;
create policy "public reads live sponsors" on public.sponsors
  for select using (
    active
    and (starts_at is null or starts_at <= now())
    and (ends_at is null or ends_at > now())
  );
-- Add sponsors from the Supabase dashboard (Table editor). No client can write here.

create table if not exists public.sponsor_events (
  id bigint generated always as identity primary key,
  sponsor_id uuid not null references public.sponsors(id) on delete cascade,
  event text not null check (event in ('impression', 'click')),
  created_at timestamptz not null default now()
);
alter table public.sponsor_events enable row level security;
create policy "anyone can log events" on public.sponsor_events
  for insert to anon, authenticated with check (true);
-- no select policy: only you can read events (dashboard / service role)

-- Public numbers for the /sponsor page (aggregates only, no personal data)
create or replace function public.public_stats() returns json
language sql security definer set search_path = public as $$
  select json_build_object(
    'users',         (select count(*) from user_data),
    'weekly_active', (select count(*) from user_data where updated_at > now() - interval '7 days'),
    'sessions',      (select coalesce(sum(coalesce((data->'stats'->>'totalSessions')::bigint, 0)), 0) from user_data),
    'minutes',       (select coalesce(sum(coalesce((data->'stats'->>'totalMinutes')::bigint, 0)), 0) from user_data),
    'impressions',   (select count(*) from sponsor_events where event = 'impression'),
    'clicks',        (select count(*) from sponsor_events where event = 'click')
  );
$$;
grant execute on function public.public_stats() to anon, authenticated;

-- Report for one sponsor (run in SQL editor and send them the result):
-- select s.name,
--   count(*) filter (where e.event = 'impression') as impressions,
--   count(*) filter (where e.event = 'click') as clicks,
--   round(100.0 * count(*) filter (where e.event = 'click') / nullif(count(*) filter (where e.event = 'impression'), 0), 2) as ctr_percent
-- from sponsors s left join sponsor_events e on e.sponsor_id = s.id
-- where e.created_at >= date_trunc('month', now())
-- group by s.name;

-- ---------- Explicit grants (needed if "Grant API access to new tables automatically" is OFF; harmless if ON) ----------
grant usage on schema public to anon, authenticated, service_role;

grant select, insert, update on public.user_data to authenticated;
grant select on public.subscriptions to authenticated;
grant select on public.payments to authenticated;
grant select on public.sponsors to anon, authenticated;
grant insert on public.sponsor_events to anon, authenticated;

grant all on public.user_data, public.subscriptions, public.payments, public.sponsors, public.sponsor_events to service_role;

-- ---------- Leaderboard (opt-in) ----------
create table if not exists public.leaderboard_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 20 and display_name ~ '^[A-Za-z0-9 _.-]+$'),
  opted_in boolean not null default true,
  created_at timestamptz not null default now()
);
create unique index if not exists leaderboard_name_unique on public.leaderboard_profiles (lower(display_name));
alter table public.leaderboard_profiles enable row level security;
create policy "read own leaderboard profile" on public.leaderboard_profiles
  for select using (auth.uid() = user_id);
create policy "join leaderboard" on public.leaderboard_profiles
  for insert with check (auth.uid() = user_id);
create policy "rename on leaderboard" on public.leaderboard_profiles
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "leave leaderboard" on public.leaderboard_profiles
  for delete using (auth.uid() = user_id);

-- Public ranking: only opted-in users, only display name + minutes. period = 'week' (Mon-Sun, IST) or 'all'.
-- Daily minutes are capped at 16h to blunt trivial cheating. Data comes from the user's synced stats.
create or replace function public.get_leaderboard(period text default 'week')
returns table(rank bigint, display_name text, minutes bigint, is_me boolean)
language sql stable security definer set search_path = public as $$
  with params as (
    select (date_trunc('week', now() at time zone 'Asia/Kolkata'))::date as week_start
  ),
  totals as (
    select
      p.user_id,
      p.display_name,
      case when period = 'all'
        then coalesce((u.data->'stats'->>'totalMinutes')::bigint, 0)
        else coalesce((
          select sum(least(coalesce((h->>'minutes')::bigint, 0), 960))
          from jsonb_array_elements(coalesce(u.data->'stats'->'dailyHistory', '[]'::jsonb)) h
          where (h->>'date')::date >= (select week_start from params)
        ), 0)
      end as minutes
    from leaderboard_profiles p
    join user_data u on u.user_id = p.user_id
    where p.opted_in
  )
  select rank() over (order by t.minutes desc), t.display_name, t.minutes, coalesce(t.user_id = auth.uid(), false)
  from totals t
  where t.minutes > 0
  order by t.minutes desc, t.display_name
  limit 50;
$$;

grant select, insert, update, delete on public.leaderboard_profiles to authenticated;
grant all on public.leaderboard_profiles to service_role;
grant execute on function public.get_leaderboard(text) to anon, authenticated;

-- ---------- Atomic payment application (called only by the server with the service role) ----------
-- Records the payment and grants Pro in ONE transaction, so a failure can never leave a payment
-- recorded without Pro being granted. Replays return 'already'. p_days = 0 means lifetime.
create or replace function public.apply_payment(
  p_order_id text, p_payment_id text, p_user_id uuid, p_plan text, p_amount integer, p_days integer
) returns text
language plpgsql security definer set search_path = public as $$
declare
  cur public.subscriptions%rowtype;
  base timestamptz;
  new_until timestamptz;
  is_lifetime boolean;
begin
  begin
    insert into public.payments (order_id, payment_id, user_id, plan, amount)
    values (p_order_id, p_payment_id, p_user_id, p_plan, p_amount);
  exception when unique_violation then
    return 'already';
  end;

  select * into cur from public.subscriptions where user_id = p_user_id for update;

  is_lifetime := (p_days = 0) or coalesce(cur.lifetime, false);
  if p_days = 0 then
    new_until := cur.pro_until;
  else
    base := case when cur.pro_until is not null and cur.pro_until > now() then cur.pro_until else now() end;
    new_until := base + make_interval(days => p_days);
  end if;

  insert into public.subscriptions (user_id, plan, pro_until, lifetime, updated_at)
  values (p_user_id, p_plan, new_until, is_lifetime, now())
  on conflict (user_id) do update
    set plan = excluded.plan, pro_until = excluded.pro_until, lifetime = excluded.lifetime, updated_at = now();

  return 'applied';
end;
$$;

revoke all on function public.apply_payment(text, text, uuid, text, integer, integer) from public, anon, authenticated;
grant execute on function public.apply_payment(text, text, uuid, text, integer, integer) to service_role;
