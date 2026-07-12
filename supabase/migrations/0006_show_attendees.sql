-- Concert Map — Friends v2: tag which friends were with you at a show.
-- A show's owner records the friends who attended it too. This is metadata on
-- the owner's show (it does not create a show on the friend's account); it
-- powers "Went with …" on the show and the shared-nights hub.

create table if not exists public.show_attendees (
  id         uuid primary key default gen_random_uuid(),
  show_id    uuid not null references public.shows (id) on delete cascade,
  friend_id  uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint uniq_show_friend unique (show_id, friend_id)
);

create index if not exists show_attendees_show_idx on public.show_attendees (show_id);
create index if not exists show_attendees_friend_idx on public.show_attendees (friend_id);

alter table public.show_attendees enable row level security;

-- Visibility mirrors the parent show (owner / accepted friends / public
-- profiles), reusing the same security-definer helpers as setlist_songs and
-- show_media.

-- Owner can read + tag/untag on their own shows.
drop policy if exists "owner manages attendees" on public.show_attendees;
create policy "owner manages attendees"
  on public.show_attendees for all
  using (
    exists (
      select 1 from public.shows s
      where s.id = show_attendees.show_id and s.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.shows s
      where s.id = show_attendees.show_id and s.user_id = auth.uid()
    )
  );

-- Accepted friends of the show owner can read the tags.
drop policy if exists "friends read attendees" on public.show_attendees;
create policy "friends read attendees"
  on public.show_attendees for select
  using (
    exists (
      select 1 from public.shows s
      where s.id = show_attendees.show_id and public.are_friends(s.user_id)
    )
  );

-- Anyone can read tags on a public profile's shows.
drop policy if exists "public read attendees" on public.show_attendees;
create policy "public read attendees"
  on public.show_attendees for select
  using (
    exists (
      select 1 from public.shows s
      where s.id = show_attendees.show_id and public.is_profile_public(s.user_id)
    )
  );
