-- Concert Map — initial schema
-- Tables: shows, setlist_songs. Row-Level Security scopes every row to its owner.

create extension if not exists "pgcrypto";

-- ── shows ────────────────────────────────────────────────────────────────────
create table if not exists public.shows (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  artist      text not null,
  venue       text,
  city        text,
  country     text,
  latitude    double precision,
  longitude   double precision,
  show_date   date not null,
  notes       text,
  created_at  timestamptz not null default now()
);

create index if not exists shows_user_id_idx on public.shows (user_id);
create index if not exists shows_show_date_idx on public.shows (show_date);

-- ── setlist_songs ────────────────────────────────────────────────────────────
create table if not exists public.setlist_songs (
  id        uuid primary key default gen_random_uuid(),
  show_id   uuid not null references public.shows (id) on delete cascade,
  position  integer not null,
  title     text not null
);

create index if not exists setlist_songs_show_id_idx on public.setlist_songs (show_id);

-- ── Row-Level Security ───────────────────────────────────────────────────────
alter table public.shows enable row level security;
alter table public.setlist_songs enable row level security;

-- shows: owners can do everything with their own rows.
drop policy if exists "shows are owner-only" on public.shows;
create policy "shows are owner-only"
  on public.shows
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- setlist_songs: access follows the parent show's ownership.
drop policy if exists "setlist songs follow show owner" on public.setlist_songs;
create policy "setlist songs follow show owner"
  on public.setlist_songs
  for all
  using (
    exists (
      select 1 from public.shows s
      where s.id = setlist_songs.show_id and s.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.shows s
      where s.id = setlist_songs.show_id and s.user_id = auth.uid()
    )
  );
