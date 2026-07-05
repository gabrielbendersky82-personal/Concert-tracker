# Concert Map 📍🎶

A map-forward personal web app for logging every concert you've been to. Drop a
pin per show, record the venue, date and setlist, and see personal stats across
everything you've seen live.

- **Map hero** — one pin per show (Leaflet + OpenStreetMap, no API key).
- **Add-show flow** — artist, venue, city, date, and a free-text setlist. The
  venue is geocoded automatically to place the pin.
- **Stats** — most-seen artist, shows per year, cities & countries visited,
  total songs seen live, and your most-played track.
- **Multi-user** — sign in with a magic link; every user only sees their own
  shows (enforced by Postgres Row-Level Security).
- **Backup** — export/import all your shows as JSON.

## Stack

| Layer     | Choice                                             |
| --------- | -------------------------------------------------- |
| Framework | Next.js 16 (App Router, TypeScript)                |
| Styling   | Tailwind CSS v4                                    |
| Map       | Leaflet + react-leaflet, OpenStreetMap tiles       |
| Data/Auth | Supabase (Postgres + Auth), accessed under RLS     |
| Geocoding | Nominatim (OpenStreetMap), via a server-side proxy |
| Deploy    | Vercel                                             |

The Next.js API routes act as the server-side proxy so no third-party key is
ever exposed to the browser (`/api/geocode` today; `/api/setlistfm` in phase 2).

## Getting started

### 1. Install

```bash
npm install
```

### 2. Create a Supabase project & apply the schema

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL editor, run the migration in
   [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql).
   It creates the `shows` and `setlist_songs` tables and enables Row-Level
   Security so each user only ever sees their own data.
3. Under **Authentication → Providers**, make sure **Email** is enabled
   (magic links work out of the box).

### 3. Configure environment variables

Copy the example and fill in your project's values (Project Settings → API):

```bash
cp .env.local.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-or-publishable-key
```

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), sign in with your email,
and use **Load sample shows** (or the **Add** tab) to get started.

## Deploying to Vercel

1. Push this repo to GitHub and import it in Vercel.
2. Add the two `NEXT_PUBLIC_SUPABASE_*` environment variables in the Vercel
   project settings.
3. In Supabase → **Authentication → URL Configuration**, add your Vercel
   deployment URL (and any custom domain) to the allowed redirect URLs so the
   magic link returns to the right place.

## Project structure

```
app/
  page.tsx                 # auth-gated map view
  login/page.tsx           # magic-link sign in
  auth/callback/route.ts   # exchanges the magic-link code for a session
  api/geocode/route.ts     # Nominatim proxy (server-side User-Agent)
  api/setlistfm/route.ts   # phase-2 stub for setlist.fm auto-import
components/
  ConcertApp.tsx           # client orchestrator (state + layout)
  MapView.tsx              # Leaflet map (dynamic import, client-only)
  AddShowForm.tsx  StatsPanel.tsx  ShowDetail.tsx  ImportExport.tsx
lib/
  supabase/                # browser + server + proxy clients
  shows.ts                 # data access (fetch/create/delete/geocode)
  stats.ts                 # stats aggregation
  sampleShows.ts  types.ts
proxy.ts                   # Next 16 middleware: session refresh + route gating
supabase/migrations/       # SQL schema + RLS
```

## Roadmap

- **Phase 2:** setlist.fm auto-import through `/api/setlistfm` (holds the API
  key server-side; free non-commercial key required).
- Drag-to-adjust pins, richer stats, and optional Mapbox tiles.
