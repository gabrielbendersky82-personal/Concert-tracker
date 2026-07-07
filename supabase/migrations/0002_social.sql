-- Concert Map — social layer: profiles, friendships, and friend-visible shows.

-- ── profiles ─────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  handle        text unique not null,
  display_name  text,
  created_at    timestamptz not null default now(),
  constraint handle_format check (handle ~ '^[a-z0-9_]{3,20}$')
);

alter table public.profiles enable row level security;

-- Any signed-in user can read profiles (needed to search/display friends).
drop policy if exists "profiles are readable" on public.profiles;
create policy "profiles are readable"
  on public.profiles for select
  using (auth.uid() is not null);

drop policy if exists "insert own profile" on public.profiles;
create policy "insert own profile"
  on public.profiles for insert
  with check (id = auth.uid());

drop policy if exists "update own profile" on public.profiles;
create policy "update own profile"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- ── friendships ──────────────────────────────────────────────────────────────
create table if not exists public.friendships (
  id          uuid primary key default gen_random_uuid(),
  requester   uuid not null references auth.users (id) on delete cascade,
  addressee   uuid not null references auth.users (id) on delete cascade,
  status      text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint no_self_friend check (requester <> addressee),
  constraint uniq_pair unique (requester, addressee)
);

create index if not exists friendships_addressee_idx on public.friendships (addressee);
create index if not exists friendships_requester_idx on public.friendships (requester);

alter table public.friendships enable row level security;

-- You can only see rows you're part of.
drop policy if exists "see own friendships" on public.friendships;
create policy "see own friendships"
  on public.friendships for select
  using (auth.uid() in (requester, addressee));

-- You create requests as yourself.
drop policy if exists "create own requests" on public.friendships;
create policy "create own requests"
  on public.friendships for insert
  with check (requester = auth.uid());

-- Only the addressee can accept (update) a request.
drop policy if exists "respond to requests" on public.friendships;
create policy "respond to requests"
  on public.friendships for update
  using (addressee = auth.uid())
  with check (addressee = auth.uid());

-- Either party can remove/cancel.
drop policy if exists "remove friendship" on public.friendships;
create policy "remove friendship"
  on public.friendships for delete
  using (auth.uid() in (requester, addressee));

-- ── friend visibility of shows ───────────────────────────────────────────────
-- Security-definer helper avoids RLS recursion when checked from shows policies.
create or replace function public.are_friends(other uuid)
  returns boolean
  language sql
  stable
  security definer
  set search_path = public
as $$
  select exists (
    select 1 from public.friendships f
    where f.status = 'accepted'
      and (
        (f.requester = auth.uid() and f.addressee = other) or
        (f.addressee = auth.uid() and f.requester = other)
      )
  );
$$;

-- Accepted friends may read each other's shows (in addition to owner access).
drop policy if exists "friends can view shows" on public.shows;
create policy "friends can view shows"
  on public.shows for select
  using (public.are_friends(user_id));

drop policy if exists "friends can view setlist songs" on public.setlist_songs;
create policy "friends can view setlist songs"
  on public.setlist_songs for select
  using (
    exists (
      select 1 from public.shows s
      where s.id = setlist_songs.show_id and public.are_friends(s.user_id)
    )
  );
