-- FinanceTracker schema for Supabase/Postgres

create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  password_hash text not null,
  salt text not null,
  session_token text,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  user_id uuid primary key references public.users(id) on delete cascade,
  name text,
  phone text,
  photo_url text,
  updated_at timestamptz not null default now()
);

create table if not exists public.budget_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  description text not null,
  entry_type text not null check (entry_type in ('income','expense')),
  amount numeric(12,2) not null check (amount >= 0),
  period text not null check (period in ('weekly','fortnightly','monthly','yearly')),
  created_at timestamptz not null default now()
);

create table if not exists public.account_movements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  account text not null,
  label text not null,
  movement_type text not null check (movement_type in ('deposit','expense')),
  amount numeric(12,2) not null check (amount >= 0),
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;
alter table public.profiles enable row level security;
alter table public.budget_entries enable row level security;
alter table public.account_movements enable row level security;

-- NOTE: For a pure frontend MVP we use user_id filtering in queries and open policies.
-- Lock this down with Supabase Auth JWT policies once backend auth is added.
create policy if not exists users_public_rw on public.users for all using (true) with check (true);
create policy if not exists profiles_public_rw on public.profiles for all using (true) with check (true);
create policy if not exists budget_public_rw on public.budget_entries for all using (true) with check (true);
create policy if not exists movements_public_rw on public.account_movements for all using (true) with check (true);
