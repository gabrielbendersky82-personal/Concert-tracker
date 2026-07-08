-- Concert Map — photos & YouTube videos per show.
-- One normalized table (like setlist_songs) holding both media kinds. Visibility
-- exactly mirrors the parent show: owner always, accepted friends, and anyone
-- when the owner's profile is public. Photos live in a public Storage bucket.

create table if not exists public.show_media (
  id           uuid primary key default gen_random_uuid(),
  show_id      uuid not null references public.shows (id) on delete cascade,
  kind         text not null check (kind in ('photo', 'video')),
  storage_path text,          -- photos: object path inside the concert-photos bucket
  youtube_id   text,          -- videos: the 11-char YouTube id
  caption      text,
  position     int not null default 0,
  created_at   timestamptz not null default now()
);

create index if not exists show_media_show_idx on public.show_media (show_id);

alter table public.show_media enable row level security;

-- Owner has full access (mirrors setlist_songs owner policy, 0001).
drop policy if exists "media follow show owner" on public.show_media;
create policy "media follow show owner"
  on public.show_media
  for all
  using (
    exists (
      select 1 from public.shows s
      where s.id = show_media.show_id and s.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.shows s
      where s.id = show_media.show_id and s.user_id = auth.uid()
    )
  );

-- Accepted friends may read (mirrors 0002).
drop policy if exists "friends can view media" on public.show_media;
create policy "friends can view media"
  on public.show_media for select
  using (
    exists (
      select 1 from public.shows s
      where s.id = show_media.show_id and public.are_friends(s.user_id)
    )
  );

-- Anyone may read media of a public profile (mirrors 0003).
drop policy if exists "public media readable" on public.show_media;
create policy "public media readable"
  on public.show_media for select
  using (
    exists (
      select 1 from public.shows s
      where s.id = show_media.show_id and public.is_profile_public(s.user_id)
    )
  );

-- ── Storage: public concert-photos bucket ────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('concert-photos', 'concert-photos', true)
on conflict (id) do nothing;

-- Reads are public (bucket is public). Writes are limited to files under your
-- own "{user_id}/…" prefix.
drop policy if exists "own concert photos insert" on storage.objects;
create policy "own concert photos insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'concert-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "own concert photos update" on storage.objects;
create policy "own concert photos update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'concert-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'concert-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "own concert photos delete" on storage.objects;
create policy "own concert photos delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'concert-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
