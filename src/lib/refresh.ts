// Keeps stored video details fresh. Server only.
// YouTube's developer rules say details read from its API (titles, thumbnails, channel names) must be
// refreshed or deleted within 30 days, so a daily job re-reads anything older than 25 days.
// Videos that are gone, private or no longer embeddable are taken off 4Ever.
import { parseIsoDuration, parseTwitchDuration } from "@/lib/format";
import { createAdminClient } from "@/lib/supabase/admin";
import { helix } from "@/lib/twitch";

const STALE_DAYS = 25;
const PER_RUN = 500;

type Row = { id: string; platform: string; source_type: string; source_id: string; channel_id: string | null };
type Update = {
  title?: string;
  thumbnail_url?: string | null;
  duration_seconds?: number | null;
  channel_name?: string;
  channel_avatar_url?: string | null;
};

export type RefreshResult = { checked: number; updated: number; removed: number };

function chunks<T>(list: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}

type Thumb = { url?: string } | undefined;

async function youtubeJson(path: string): Promise<{ items?: unknown[] } | null> {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return null;
  const res = await fetch(`https://www.googleapis.com/youtube/v3/${path}&key=${key}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });
  return res.ok ? ((await res.json()) as { items?: unknown[] }) : null;
}

// Returns details per video id; ids missing from the map are gone or can't be embedded any more.
async function refreshYouTube(rows: Row[]): Promise<Map<string, Update> | null> {
  const found = new Map<string, Update>();
  const channelIds = new Set<string>();
  for (const group of chunks(rows, 50)) {
    const data = await youtubeJson(
      `videos?part=snippet,contentDetails,status&id=${group.map((r) => encodeURIComponent(r.source_id)).join(",")}`,
    );
    if (!data) return null; // YouTube didn't answer: try again tomorrow rather than removing anything.
    for (const raw of data.items ?? []) {
      const item = raw as {
        id: string;
        snippet?: {
          title?: string;
          channelId?: string;
          channelTitle?: string;
          thumbnails?: { maxres?: Thumb; standard?: Thumb; high?: Thumb; medium?: Thumb };
        };
        contentDetails?: { duration?: string };
        status?: { embeddable?: boolean; privacyStatus?: string };
      };
      if (!item.snippet || item.status?.embeddable === false || item.status?.privacyStatus === "private") continue;
      const t = item.snippet.thumbnails;
      found.set(item.id, {
        title: (item.snippet.title ?? "Untitled").slice(0, 140),
        thumbnail_url: t?.maxres?.url ?? t?.standard?.url ?? t?.high?.url ?? t?.medium?.url ?? null,
        duration_seconds: parseIsoDuration(item.contentDetails?.duration),
        channel_name: (item.snippet.channelTitle ?? "Unknown channel").slice(0, 120),
      });
      if (item.snippet.channelId) channelIds.add(item.snippet.channelId);
    }
  }
  // Channel pictures, 50 channels per request.
  const avatars = new Map<string, string | null>();
  for (const group of chunks([...channelIds], 50)) {
    const data = await youtubeJson(`channels?part=snippet&id=${group.join(",")}`);
    for (const raw of data?.items ?? []) {
      const item = raw as { id: string; snippet?: { thumbnails?: { medium?: Thumb; default?: Thumb } } };
      avatars.set(item.id, item.snippet?.thumbnails?.medium?.url ?? item.snippet?.thumbnails?.default?.url ?? null);
    }
  }
  for (const row of rows) {
    const update = found.get(row.source_id);
    if (update && row.channel_id && avatars.has(row.channel_id))
      update.channel_avatar_url = avatars.get(row.channel_id);
  }
  return found;
}

async function refreshTwitch(rows: Row[]): Promise<Map<string, Update> | null> {
  const found = new Map<string, Update>();
  try {
    const clips = rows.filter((r) => r.source_type === "twitch_clip");
    const videos = rows.filter((r) => r.source_type === "twitch_video");
    const userIds = new Set<string>();
    for (const group of chunks(clips, 100)) {
      const list = await helix<{
        id: string;
        title: string;
        broadcaster_id: string;
        broadcaster_name: string;
        thumbnail_url: string;
        duration: number;
      }>(`clips?${group.map((r) => `id=${encodeURIComponent(r.source_id)}`).join("&")}`);
      for (const c of list) {
        found.set(c.id, {
          title: (c.title || "Twitch clip").slice(0, 140),
          thumbnail_url: c.thumbnail_url || null,
          duration_seconds: c.duration ? Math.round(c.duration) : null,
          channel_name: c.broadcaster_name.slice(0, 120),
        });
        userIds.add(c.broadcaster_id);
      }
    }
    for (const group of chunks(videos, 100)) {
      const list = await helix<{
        id: string;
        title: string;
        user_id: string;
        user_name: string;
        thumbnail_url: string;
        duration: string;
      }>(`videos?${group.map((r) => `id=${encodeURIComponent(r.source_id)}`).join("&")}`);
      for (const v of list) {
        const thumb = v.thumbnail_url ? v.thumbnail_url.replace("%{width}", "640").replace("%{height}", "360") : null;
        found.set(v.id, {
          title: (v.title || "Twitch video").slice(0, 140),
          thumbnail_url: thumb && !thumb.includes("_404") ? thumb : null,
          duration_seconds: parseTwitchDuration(v.duration),
          channel_name: v.user_name.slice(0, 120),
        });
        userIds.add(v.user_id);
      }
    }
    const avatars = new Map<string, string | null>();
    for (const group of chunks([...userIds], 100)) {
      const users = await helix<{ id: string; profile_image_url?: string }>(
        `users?${group.map((id) => `id=${id}`).join("&")}`,
      );
      for (const u of users) avatars.set(u.id, u.profile_image_url || null);
    }
    for (const row of rows) {
      const update = found.get(row.source_id);
      if (update && row.channel_id && avatars.has(row.channel_id))
        update.channel_avatar_url = avatars.get(row.channel_id);
    }
    return found;
  } catch {
    return null; // Twitch didn't answer: try again tomorrow.
  }
}

export async function refreshStaleClips(): Promise<RefreshResult> {
  const admin = createAdminClient();
  const cutoff = new Date(Date.now() - STALE_DAYS * 86400_000).toISOString();
  const { data } = await admin
    .from("clips")
    .select("id, platform, source_type, source_id, channel_id")
    .neq("status", "removed")
    .lt("details_refreshed_at", cutoff)
    .order("details_refreshed_at", { ascending: true })
    .limit(PER_RUN);
  const rows = (data ?? []) as Row[];
  const result: RefreshResult = { checked: rows.length, updated: 0, removed: 0 };
  if (rows.length === 0) return result;

  const youtubeRows = rows.filter((r) => r.platform === "youtube");
  const twitchRows = rows.filter((r) => r.platform === "twitch");
  const [youtube, twitch] = await Promise.all([
    youtubeRows.length ? refreshYouTube(youtubeRows) : Promise.resolve(new Map<string, Update>()),
    twitchRows.length ? refreshTwitch(twitchRows) : Promise.resolve(new Map<string, Update>()),
  ]);
  const now = new Date().toISOString();

  for (const [list, found, platformName] of [
    [youtubeRows, youtube, "YouTube"],
    [twitchRows, twitch, "Twitch"],
  ] as const) {
    if (!found) continue; // That platform didn't answer; leave these for the next run.
    for (const row of list) {
      const update = found.get(row.source_id);
      if (update) {
        await admin
          .from("clips")
          .update({ ...update, details_refreshed_at: now })
          .eq("id", row.id);
        result.updated++;
      } else {
        await admin
          .from("clips")
          .update({
            status: "removed",
            review_note: `This video is no longer available on ${platformName}.`,
            details_refreshed_at: now,
          })
          .eq("id", row.id);
        result.removed++;
      }
    }
  }
  return result;
}
