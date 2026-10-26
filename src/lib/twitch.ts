// Talks to Twitch. Server only.
import { parseTwitchDuration } from "@/lib/format";
import { LookupError } from "@/lib/youtube";

let cachedToken: { value: string; expiresAt: number } | null = null;

function credentials() {
  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

export function isTwitchConfigured(): boolean {
  return credentials() !== null;
}

async function appToken(forceRefresh = false): Promise<string> {
  const creds = credentials();
  if (!creds) throw new LookupError("Twitch links aren't switched on yet. Try a YouTube link for now.");
  if (!forceRefresh && cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;

  const res = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: creds.clientId,
      client_secret: creds.clientSecret,
      grant_type: "client_credentials",
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new LookupError("Twitch didn't answer. Try again in a minute.");
  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { value: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return cachedToken.value;
}

async function helix<T>(path: string): Promise<T[]> {
  const creds = credentials();
  if (!creds) throw new LookupError("Twitch links aren't switched on yet. Try a YouTube link for now.");
  for (let attempt = 0; attempt < 2; attempt++) {
    const token = await appToken(attempt > 0);
    const res = await fetch(`https://api.twitch.tv/helix/${path}`, {
      headers: { "Client-Id": creds.clientId, Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (res.status === 401 && attempt === 0) continue;
    if (!res.ok) throw new LookupError("Twitch didn't answer. Try again in a minute.");
    const data = (await res.json()) as { data?: T[] };
    return data.data ?? [];
  }
  throw new LookupError("Twitch didn't answer. Try again in a minute.");
}

export type TwitchUser = { id: string; login: string; display_name: string };

export async function fetchTwitchUser(id: string): Promise<TwitchUser | null> {
  const users = await helix<TwitchUser>(`users?id=${encodeURIComponent(id)}`);
  return users[0] ?? null;
}

export type TwitchVideoInfo = {
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
  channelId: string;
  channelName: string;
  channelUrl: string;
};

export async function fetchTwitchClip(slug: string): Promise<TwitchVideoInfo> {
  const clips = await helix<{
    title: string;
    broadcaster_id: string;
    broadcaster_name: string;
    thumbnail_url: string;
    duration: number;
  }>(`clips?id=${encodeURIComponent(slug)}`);
  const clip = clips[0];
  if (!clip) throw new LookupError("We couldn't find that Twitch clip. It may have been deleted.");
  const user = await fetchTwitchUser(clip.broadcaster_id).catch(() => null);
  const login = user?.login ?? clip.broadcaster_name.toLowerCase();
  return {
    title: (clip.title || "Twitch clip").slice(0, 140),
    description: null,
    thumbnailUrl: clip.thumbnail_url || null,
    durationSeconds: clip.duration ? Math.round(clip.duration) : null,
    channelId: clip.broadcaster_id,
    channelName: user?.display_name ?? clip.broadcaster_name,
    channelUrl: `https://www.twitch.tv/${login}`,
  };
}

export async function fetchTwitchVideo(id: string): Promise<TwitchVideoInfo> {
  const videos = await helix<{
    title: string;
    description: string;
    user_id: string;
    user_login: string;
    user_name: string;
    thumbnail_url: string;
    duration: string;
  }>(`videos?id=${encodeURIComponent(id)}`);
  const video = videos[0];
  if (!video) throw new LookupError("We couldn't find that Twitch video. It may have expired or been deleted.");
  const thumb = video.thumbnail_url
    ? video.thumbnail_url.replace("%{width}", "640").replace("%{height}", "360")
    : null;
  return {
    title: (video.title || "Twitch video").slice(0, 140),
    description: video.description || null,
    thumbnailUrl: thumb && !thumb.includes("_404") ? thumb : null,
    durationSeconds: parseTwitchDuration(video.duration),
    channelId: video.user_id,
    channelName: video.user_name,
    channelUrl: `https://www.twitch.tv/${video.user_login}`,
  };
}
