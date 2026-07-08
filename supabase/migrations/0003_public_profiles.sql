-- Concert Map — opt-in public profiles.
-- A user can flip their profile to public; then anyone (including logged-out
-- visitors on the anon role) may read that profile and its shows. Owner-only and
-- friend-visibility policies from 0001/0002 stay intact — these are additional,
-- permissive SELECT policies, so access is the OR of all of them.

alter table public.profiles
  add column if not exists is_public boolean not null default false;

-- Anyone can read a profile row that's marked public.
drop policy if exists "public profiles readable" on public.profiles;
create policy "public profiles readable"
  on public.profiles for select
  using (is_public = true);

-- Security-definer helper: is this show-owner's profile public? Mirrors the
-- are_friends() pattern (0002) to avoid RLS recursion from the shows policies.
create or replace function public.is_profile_public(owner uuid)
  returns boolean
  language sql
  stable
  security definer
  set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = owner and p.is_public
  );
$$;

-- Anyone can read shows / setlist songs belonging to a public profile.
drop policy if exists "public shows readable" on public.shows;
create policy "public shows readable"
  on public.shows for select
  using (public.is_profile_public(user_id));

drop policy if exists "public setlist songs readable" on public.setlist_songs;
create policy "public setlist songs readable"
  on public.setlist_songs for select
  using (
    exists (
      select 1 from public.shows s
      where s.id = setlist_songs.show_id and public.is_profile_public(s.user_id)
    )
  );
