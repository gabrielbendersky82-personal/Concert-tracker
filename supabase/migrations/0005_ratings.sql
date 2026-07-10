-- Ratings + song of the night (roadmap item 5).
-- rating: 1–5 dots; favorite_song_id: the "song of the night" from the
-- show's own setlist. Both optional. RLS: shows policies already scope
-- updates to the owner, so no policy changes are needed.

alter table public.shows
  add column if not exists rating smallint
    check (rating between 1 and 5),
  add column if not exists favorite_song_id uuid
    references public.setlist_songs (id) on delete set null;
