-- X-traordinary admin board: schema
-- Two users (owner + VA). Access is gated by the allowed_users table through RLS.

create table if not exists public.allowed_users (
  email text primary key,
  role text not null check (role in ('owner', 'va')),
  display_name text not null default '',
  created_at timestamptz not null default now()
);

create or replace function public.is_allowed()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.allowed_users a
    where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

create or replace function public.current_role_name()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select a.role from public.allowed_users a
  where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  limit 1;
$$;

create table if not exists public.weeks (
  id uuid primary key default gen_random_uuid(),
  week_start date not null unique,            -- always a Monday
  status text not null default 'draft' check (status in ('draft', 'approved')),
  summary text not null default '',           -- AI's one-paragraph focus for the week
  owner_notes text not null default '',       -- what the owner told the AI to change
  generated_at timestamptz,
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  week_id uuid not null references public.weeks(id) on delete cascade,
  assignee text not null check (assignee in ('owner', 'va')),
  day date not null,
  sort int not null default 0,
  title text not null,
  detail text not null default '',
  kind text not null default 'other' check (kind in ('post', 'engage', 'outbound', 'partner', 'call', 'build', 'report', 'admin', 'other')),
  pillar text,                                -- proof | teach | lifestyle | pov | partners (posts only)
  channel text,                               -- linkedin | instagram | email | phone | site | other
  status text not null default 'todo' check (status in ('todo', 'done', 'skipped')),
  source text not null default 'ai' check (source in ('ai', 'routine', 'manual')),
  done_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists tasks_week_day_idx on public.tasks (week_id, day, assignee, sort);

create table if not exists public.memos (
  id uuid primary key default gen_random_uuid(),
  week_id uuid not null references public.weeks(id) on delete cascade,
  author text not null check (author in ('owner', 'va')),
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.metrics (
  week_id uuid primary key references public.weeks(id) on delete cascade,
  posts_linkedin int not null default 0,
  posts_instagram int not null default 0,
  impressions int not null default 0,
  profile_views int not null default 0,
  requests_sent int not null default 0,
  requests_accepted int not null default 0,
  conversations int not null default 0,
  scorecard_completions int not null default 0,
  scorecard_fits int not null default 0,
  coffees int not null default 0,
  first_calls int not null default 0,
  proposals_sent int not null default 0,
  assessments_signed int not null default 0,
  newsletter_subs int not null default 0,
  notes text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists public.pipeline (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company text not null default '',
  title text not null default '',
  kind text not null default 'buyer' check (kind in ('buyer', 'partner')),
  source text not null default 'outbound' check (source in ('outbound', 'scorecard', 'partner', 'event', 'referral', 'other')),
  stage text not null default 'new' check (stage in ('new', 'connected', 'conversation', 'coffee_booked', 'call_booked', 'proposal_sent', 'assessment_signed', 'retained', 'lost')),
  next_step text not null default '',
  owner text not null default 'va' check (owner in ('owner', 'va')),
  linkedin_url text not null default '',
  last_touch date,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.settings (
  key text primary key,
  value text not null default '',
  updated_at timestamptz not null default now()
);

-- RLS: anyone on the allow-list can read and write everything; nobody else can see anything.
alter table public.allowed_users enable row level security;
alter table public.weeks enable row level security;
alter table public.tasks enable row level security;
alter table public.memos enable row level security;
alter table public.metrics enable row level security;
alter table public.pipeline enable row level security;
alter table public.settings enable row level security;

drop policy if exists allowed_read_allowed_users on public.allowed_users;
create policy allowed_read_allowed_users on public.allowed_users for select to authenticated using (public.is_allowed());
drop policy if exists owner_writes_allowed_users on public.allowed_users;
create policy owner_writes_allowed_users on public.allowed_users for all to authenticated
  using (public.current_role_name() = 'owner') with check (public.current_role_name() = 'owner');

do $$
declare t text;
begin
  foreach t in array array['weeks', 'tasks', 'memos', 'metrics', 'pipeline', 'settings'] loop
    execute format('drop policy if exists allowed_all on public.%I', t);
    execute format('create policy allowed_all on public.%I for all to authenticated using (public.is_allowed()) with check (public.is_allowed())', t);
  end loop;
end $$;
