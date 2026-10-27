// Talks to YouTube. Server only.
import { parseIsoDuration } from "@/lib/format";

export class LookupError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LookupError";
  }
}

const API = "https://www.googleapis.com/youtube/v3";

function apiKey(): string | null {
  return process.env.YOUTUBE_API_KEY || null;
}

async function getJson(url: string): Promise<{ status: number; body: unknown }> {
  const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(8000) });
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  return { status: res.status, body };
}

export type YouTubeVideo = {
  title: string;
  description: string | null;
  thumbnailUrl: string;
  durationSeconds: number | null;
  channelId: string | null;
  channelName: string;
  channelUrl: string | null;
  channelAvatarUrl: string | null;
};

type Thumb = { url?: string } | undefined;

export async function fetchYouTubeVideo(id: string): Promise<YouTubeVideo> {
  const key = apiKey();
  const fallbackThumb = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

  if (!key) {
    // No API key: use YouTube's public oEmbed endpoint (no duration, no channel id).
    const watchUrl = `https://www.youtube.com/watch?v=${id}`;
    const { status, body } = await getJson(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(watchUrl)}&format=json`,
    );
    if (status === 401 || status === 403) {
      throw new LookupError(
        "This video has embedding turned off, so it can't play on 4Ever. The creator can turn it on in YouTube Studio.",
      );
    }
    if (status !== 200 || !body) throw new LookupError("We couldn't find that video. Is it public?");
    const data = body as { title?: string; author_name?: string; author_url?: string };
    return {
      title: (data.title ?? "Untitled").slice(0, 140),
      description: null,
      thumbnailUrl: fallbackThumb,
      durationSeconds: null,
      channelId: null,
      channelName: data.author_name ?? "Unknown channel",
      channelUrl: data.author_url ?? null,
      channelAvatarUrl: null,
    };
  }

  const { status, body } = await getJson(
    `${API}/videos?part=snippet,contentDetails,status&id=${encodeURIComponent(id)}&key=${key}`,
  );
  if (status !== 200) throw new LookupError("YouTube didn't answer. Try again in a minute.");
  const items = (body as { items?: unknown[] })?.items ?? [];
  const item = items[0] as
    | {
        snippet?: {
          title?: string;
          description?: string;
          channelId?: string;
          channelTitle?: string;
          thumbnails?: { maxres?: Thumb; standard?: Thumb; high?: Thumb; medium?: Thumb; default?: Thumb };
        };
        contentDetails?: { duration?: string };
        status?: { embeddable?: boolean; privacyStatus?: string };
      }
    | undefined;

  if (!item?.snippet) throw new LookupError("We couldn't find that video. Is it public?");
  if (item.status?.privacyStatus === "private") throw new LookupError("That video is private.");
  if (item.status?.embeddable === false) {
    throw new LookupError(
      "This video has embedding turned off, so it can't play on 4Ever. The creator can turn it on in YouTube Studio.",
    );
  }

  const thumbs = item.snippet.thumbnails;
  const thumbnailUrl =
    thumbs?.maxres?.url ?? thumbs?.standard?.url ?? thumbs?.high?.url ?? thumbs?.medium?.url ?? fallbackThumb;
  const channelId = item.snippet.channelId ?? null;

  return {
    title: (item.snippet.title ?? "Untitled").slice(0, 140),
    description: item.snippet.description ?? null,
    thumbnailUrl,
    durationSeconds: parseIsoDuration(item.contentDetails?.duration),
    channelId,
    channelName: item.snippet.channelTitle ?? "Unknown channel",
    channelUrl: channelId ? `https://www.youtube.com/channel/${channelId}` : null,
    channelAvatarUrl: channelId ? await fetchYouTubeChannelAvatar(channelId).catch(() => null) : null,
  };
}

// The channel's profile picture. Costs one unit of YouTube quota.
export async function fetchYouTubeChannelAvatar(channelId: string): Promise<string | null> {
  const key = apiKey();
  if (!key) return null;
  const { status, body } = await getJson(`${API}/channels?part=snippet&id=${encodeURIComponent(channelId)}&key=${key}`);
  if (status !== 200) return null;
  const item = ((body as { items?: unknown[] })?.items ?? [])[0] as
    { snippet?: { thumbnails?: { medium?: Thumb; high?: Thumb; default?: Thumb } } } | undefined;
  const t = item?.snippet?.thumbnails;
  return t?.medium?.url ?? t?.high?.url ?? t?.default?.url ?? null;
}

export type YouTubeChannel = {
  id: string;
  title: string;
  description: string;
  url: string;
};

// Accepts a channel link, an @handle, or a channel id.
export function parseChannelInput(
  input: string,
): { by: "id"; value: string } | { by: "handle"; value: string } | { by: "username"; value: string } | null {
  const raw = input.trim();
  if (!raw) return null;
  if (/^UC[A-Za-z0-9_-]{22}$/.test(raw)) return { by: "id", value: raw };
  if (/^@[A-Za-z0-9._-]{3,30}$/.test(raw)) return { by: "handle", value: raw };

  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    return null;
  }
  if (!/(^|\.)youtube\.com$/i.test(url.hostname)) return null;
  const parts = url.pathname.split("/").filter(Boolean);
  if (parts[0]?.startsWith("@")) return { by: "handle", value: parts[0] };
  if (parts[0] === "channel" && parts[1] && /^UC[A-Za-z0-9_-]{22}$/.test(parts[1])) {
    return { by: "id", value: parts[1] };
  }
  if (parts[0] === "user" && parts[1]) return { by: "username", value: parts[1] };
  return null;
}

export async function fetchYouTubeChannel(input: string): Promise<YouTubeChannel> {
  const key = apiKey();
  if (!key) throw new LookupError("YouTube verification isn't switched on yet. Ask an admin to add a YouTube API key.");
  const parsed = parseChannelInput(input);
  if (!parsed) {
    throw new LookupError("Paste your channel link (youtube.com/@yourname) or your @handle.");
  }
  const param =
    parsed.by === "id"
      ? `id=${encodeURIComponent(parsed.value)}`
      : parsed.by === "handle"
        ? `forHandle=${encodeURIComponent(parsed.value)}`
        : `forUsername=${encodeURIComponent(parsed.value)}`;
  const { status, body } = await getJson(`${API}/channels?part=snippet&${param}&key=${key}`);
  if (status !== 200) throw new LookupError("YouTube didn't answer. Try again in a minute.");
  const item = ((body as { items?: unknown[] })?.items ?? [])[0] as
    { id?: string; snippet?: { title?: string; description?: string; customUrl?: string } } | undefined;
  if (!item?.id || !item.snippet) throw new LookupError("We couldn't find that channel.");
  return {
    id: item.id,
    title: item.snippet.title ?? "YouTube channel",
    description: item.snippet.description ?? "",
    url: item.snippet.customUrl
      ? `https://www.youtube.com/${item.snippet.customUrl.startsWith("@") ? "" : "@"}${item.snippet.customUrl}`
      : `https://www.youtube.com/channel/${item.id}`,
  };
}
