import type { Show } from "./types";

/**
 * Spotify integration — "Relive on Spotify": turn a show's setlist into a
 * private playlist. Fully client-side Authorization Code + PKCE flow, so no
 * server route and no client secret. Tokens live in localStorage with silent
 * refresh. Everything here is browser-only; call from client components.
 */

// The Client ID is public by design — this uses PKCE, so there is no secret,
// and the real security boundary is the redirect-URI allowlist on the Spotify
// app. Baked in so the feature works without extra env config; override with
// NEXT_PUBLIC_SPOTIFY_CLIENT_ID to point at a different Spotify app.
const CLIENT_ID =
  process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID ??
  "54455ade6207484b84f601812fca118c";
const SCOPE = "playlist-modify-private playlist-modify-public";
const AUTH_URL = "https://accounts.spotify.com/authorize";
const TOKEN_URL = "https://accounts.spotify.com/api/token";
const API = "https://api.spotify.com/v1";

const LS_TOKENS = "cm_spotify_tokens";
const SS_VERIFIER = "cm_spotify_verifier";
const SS_RETURN = "cm_spotify_return";

interface Tokens {
  access_token: string;
  refresh_token: string;
  expires_at: number; // epoch ms
  scope?: string; // scopes Spotify actually granted
}

/** Is a Client ID configured at build time? Controls whether UI appears. */
export function isSpotifyConfigured(): boolean {
  return CLIENT_ID.length > 0;
}

function loadTokens(): Tokens | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LS_TOKENS);
    return raw ? (JSON.parse(raw) as Tokens) : null;
  } catch {
    return null;
  }
}

function saveTokens(data: {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope?: string;
}): void {
  const prev = loadTokens();
  const tokens: Tokens = {
    access_token: data.access_token,
    // Spotify may omit refresh_token on refresh; keep the previous one.
    refresh_token: data.refresh_token ?? prev?.refresh_token ?? "",
    expires_at: Date.now() + data.expires_in * 1000,
    scope: data.scope ?? prev?.scope,
  };
  localStorage.setItem(LS_TOKENS, JSON.stringify(tokens));
}

export function isSpotifyConnected(): boolean {
  return !!loadTokens();
}

export function disconnectSpotify(): void {
  if (typeof window !== "undefined") localStorage.removeItem(LS_TOKENS);
}

// --- PKCE helpers ---------------------------------------------------------

function randomString(length: number): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

function base64url(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function challengeFrom(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(verifier)
  );
  return base64url(digest);
}

function redirectUri(): string {
  return `${window.location.origin}/spotify/callback`;
}

// --- Auth flow ------------------------------------------------------------

/** Kick off the consent redirect. `returnTo` is where the callback lands. */
export async function beginSpotifyAuth(returnTo: string): Promise<void> {
  const verifier = randomString(64);
  sessionStorage.setItem(SS_VERIFIER, verifier);
  sessionStorage.setItem(SS_RETURN, returnTo);
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: "code",
    redirect_uri: redirectUri(),
    code_challenge_method: "S256",
    code_challenge: await challengeFrom(verifier),
    scope: SCOPE,
    // Always show the account/consent dialog so a user can see which Spotify
    // account they're authorizing and switch it (needed to fix a wrong-account
    // connection). Without this, Spotify silently reuses the browser session.
    show_dialog: "true",
  });
  window.location.href = `${AUTH_URL}?${params.toString()}`;
}

/** Called by the callback page: exchange the code, store tokens, return path. */
export async function completeSpotifyAuth(): Promise<string> {
  const params = new URLSearchParams(window.location.search);
  const err = params.get("error");
  if (err) throw new Error(`Spotify authorization was ${err}.`);
  const code = params.get("code");
  const verifier = sessionStorage.getItem(SS_VERIFIER);
  if (!code || !verifier) throw new Error("Missing Spotify authorization code.");

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri(),
      code_verifier: verifier,
    }),
  });
  if (!res.ok) throw new Error("Could not connect to Spotify. Please try again.");
  saveTokens(await res.json());
  sessionStorage.removeItem(SS_VERIFIER);
  const returnTo = sessionStorage.getItem(SS_RETURN) || "/";
  sessionStorage.removeItem(SS_RETURN);
  return returnTo;
}

/** A non-expired access token, refreshing if needed. Null if not connected. */
async function getValidToken(): Promise<string | null> {
  const tokens = loadTokens();
  if (!tokens) return null;
  if (Date.now() < tokens.expires_at - 60_000) return tokens.access_token;
  if (!tokens.refresh_token) return null;

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: "refresh_token",
      refresh_token: tokens.refresh_token,
    }),
  });
  if (!res.ok) {
    disconnectSpotify();
    return null;
  }
  const data = await res.json();
  saveTokens(data);
  return data.access_token as string;
}

// --- Playlist building ----------------------------------------------------

/** Ordered search queries for one song: quoted precise match, then loose. */
export function spotifySearchQueries(title: string, artist: string): string[] {
  const clean = (s: string) => s.replace(/["']/g, "").trim();
  const t = clean(title);
  // Drop trailing " & the …" / " and his …" so featured-band suffixes don't
  // over-constrain the artist match.
  const a = clean(artist).replace(/\s+(&|and)\s+the\b.*$/i, "");
  return [`track:"${t}" artist:"${a}"`, `${t} ${a}`];
}

async function spotifyFetch<T>(
  token: string,
  path: string,
  init?: RequestInit,
  op = "talking to Spotify"
): Promise<T> {
  const res = await fetch(path.startsWith("http") ? path : `${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });
  if (!res.ok) {
    // Surface Spotify's own error message so failures are self-explanatory.
    let detail = "";
    try {
      const body = await res.json();
      detail = body?.error?.message || body?.error_description || "";
    } catch {
      /* no JSON body */
    }
    if (res.status === 429) {
      throw new Error("Spotify is busy right now — try again in a moment.");
    }
    if (res.status === 401) {
      disconnectSpotify();
      throw new Error("Your Spotify session expired — please connect again.");
    }
    if (res.status === 403) {
      const isWrite = op.startsWith("creating the playlist") || op === "adding songs";
      const said = detail ? `Spotify said "${detail}" (403)` : "Spotify said 403 (Forbidden)";
      const advice = isWrite
        ? " Click Reconnect below and approve the playlist permission on Spotify's screen."
        : " This account isn't authorized for the app — add the email from Spotify's login screen under the app's User Management (Development mode).";
      throw new Error(`${said} while ${op}.${advice}`);
    }
    throw new Error(
      detail
        ? `Spotify: ${detail} (while ${op})`
        : `Spotify request failed (${res.status}) while ${op}.`
    );
  }
  return (await res.json().catch(() => ({}))) as T;
}

async function findTrackUri(
  token: string,
  title: string,
  artist: string
): Promise<string | null> {
  for (const q of spotifySearchQueries(title, artist)) {
    const params = new URLSearchParams({ q, type: "track", limit: "1" });
    const data = await spotifyFetch<{ tracks?: { items?: { uri: string }[] } }>(
      token,
      `/search?${params.toString()}`,
      undefined,
      "searching for songs"
    );
    const uri = data.tracks?.items?.[0]?.uri;
    if (uri) return uri;
  }
  return null;
}

export interface PlaylistResult {
  url: string;
  found: number;
  total: number;
  missed: string[];
}

/**
 * Build a private Spotify playlist from a show's setlist, in order.
 * `onProgress(done, total)` fires as songs are resolved.
 */
export async function createSetlistPlaylist(
  show: Show,
  onProgress?: (done: number, total: number) => void
): Promise<PlaylistResult> {
  const token = await getValidToken();
  if (!token) throw new Error("Not connected to Spotify.");

  const songs = [...show.setlist_songs].sort((a, b) => a.position - b.position);
  if (songs.length === 0) throw new Error("This show has no setlist to build.");

  // Litmus test first: /me is the most basic authenticated endpoint. If the
  // account isn't allowlisted for the app, this is where it fails — the
  // clearest possible signal ("while checking your account").
  const me = await spotifyFetch<{ id: string }>(
    token,
    "/me",
    undefined,
    "checking your account"
  );
  if (!me.id) {
    throw new Error(
      "Spotify didn't return your account id. Please Reconnect below."
    );
  }
  // If we can see the granted scopes and playlist permission is absent, the
  // consent didn't grant write access — a reconnect (with the app revoked at
  // spotify.com/account/apps) is the fix.
  const granted = loadTokens()?.scope ?? "";
  if (granted && !granted.includes("playlist-modify")) {
    throw new Error(
      `Spotify didn't grant playlist permission (only: ${granted}). Reconnect below and approve it.`
    );
  }

  // Resolve track URIs with a small concurrency pool (setlists are 10–30 songs).
  const uris: (string | null)[] = new Array(songs.length).fill(null);
  let done = 0;
  let next = 0;
  async function worker() {
    while (next < songs.length) {
      const i = next++;
      try {
        uris[i] = await findTrackUri(token!, songs[i].title, show.artist);
      } catch {
        uris[i] = null;
      }
      onProgress?.(++done, songs.length);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(5, songs.length) }, worker)
  );

  const foundUris = uris.filter((u): u is string => !!u);
  const missed = songs.filter((_, i) => !uris[i]).map((s) => s.title);
  if (foundUris.length === 0) {
    throw new Error("Couldn't find any of these songs on Spotify.");
  }

  const place = show.venue || show.city || "";
  const name = [show.artist, place, show.show_date.slice(0, 4)]
    .filter(Boolean)
    .join(" · ");
  const playlist = await spotifyFetch<{
    id: string;
    external_urls: { spotify: string };
  }>(
    token,
    `/users/${me.id}/playlists`,
    {
      method: "POST",
      body: JSON.stringify({
        name,
        description: `Setlist from ${show.show_date} · made with Concert Map`,
        public: false,
      }),
    },
    `creating the playlist (account ${me.id})`
  );

  // Add tracks in order (chunks of 100, though setlists never reach it).
  for (let i = 0; i < foundUris.length; i += 100) {
    await spotifyFetch(
      token,
      `/playlists/${playlist.id}/tracks`,
      {
        method: "POST",
        body: JSON.stringify({ uris: foundUris.slice(i, i + 100) }),
      },
      "adding songs"
    );
  }

  return {
    url: playlist.external_urls.spotify,
    found: foundUris.length,
    total: songs.length,
    missed,
  };
}
