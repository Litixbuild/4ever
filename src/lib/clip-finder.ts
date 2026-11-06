// Finds brand new WoW Forever clips on YouTube and adds them to 4Ever as the site. Server only.
// YouTube only, never Twitch. Runs every two hours (netlify/functions/find-clips.mts) and from the
// "Find new clips now" button on the Videos admin page.
//
// Two places to look, both on the free YouTube quota (10,000 units a day):
// 1. The latest uploads of every channel already on 4Ever (1 unit per channel).
// 2. A YouTube search for the newest short "WoW Forever" videos (100 units per search).
// Every video then has to pass the rules in clip-match.ts: under a minute, embeddable, public,
// uploaded since Forever launched, says WoW Forever, not spam, not a reposter, not blocked.
import { parseIsoDuration } from "@/lib/format";
import {
  FOREVER_LAUNCH,
  guessCategory,
  isWowForever,
  looksLikeReposter,
  looksLikeSpam,
  MAX_CLIP_SECONDS,
  MIN_CLIP_SECONDS,
} from "@/lib/clip-match";
import { createAdminClient } from "@/lib/supabase/admin";

const API = "https://www.googleapis.com/youtube/v3";
const SEARCHES = ["wow forever", "#wowforever"];
const SEARCH_BACK_HOURS = 48;
const MAX_CHANNELS = 150;
const PER_CHANNEL_PER_RUN = 4;
const PER_RUN = 40;

export type FindResult = { looked: number; added: number; skipped: number; error?: string };

type Thumb = { url?: string } | undefined;
type VideoItem = {
  id: string;
  snippet?: {
    title?: string;
    description?: string;
    tags?: string[];
    channelId?: string;
    channelTitle?: string;
    publishedAt?: string;
    liveBroadcastContent?: string;
    thumbnails?: { maxres?: Thumb; standard?: Thumb; high?: Thumb; medium?: Thumb };
  };
  contentDetails?: { duration?: string };
  status?: { embeddable?: boolean; privacyStatus?: string };
};

async function yt<T>(path: string): Promise<T | null> {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch(`${API}/${path}&key=${key}`, { cache: "no-store", signal: AbortSignal.timeout(8000) });
    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    return null;
  }
}

// Runs fn over the list, a few at a time, so the whole run stays well inside the function time limit.
async function eachLimited<T>(list: T[], limit: number, fn: (item: T) => Promise<void>) {
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, list.length) }, async () => {
      while (next < list.length) await fn(list[next++]);
    }),
  );
}

function chunks<T>(list: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}

export async function findNewClips(): Promise<FindResult> {
  if (!process.env.YOUTUBE_API_KEY) return { looked: 0, added: 0, skipped: 0, error: "No YouTube key." };
  const admin = createAdminClient();

  // Who the videos are posted by (the admin account, same as hand-picked ones), known channels, blocks.
  const [{ data: owner }, { data: known }, { data: blocks }] = await Promise.all([
    admin
      .from("profiles")
      .select("id")
      .eq("role", "admin")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle<{ id: string }>(),
    admin
      .from("clips")
      .select("channel_id, published_at")
      .eq("platform", "youtube")
      .eq("status", "approved")
      .not("channel_id", "is", null)
      .order("published_at", { ascending: false })
      .limit(3000),
    admin.from("clip_source_blocks").select("channel_id"),
  ]);
  if (!owner) return { looked: 0, added: 0, skipped: 0, error: "No admin account." };
  const blocked = new Set((blocks ?? []).map((b: { channel_id: string }) => b.channel_id));
  const knownChannels = [
    ...new Set((known ?? []).map((k: { channel_id: string }) => k.channel_id).filter((c) => !blocked.has(c))),
  ];

  const candidates = new Set<string>();

  // 1. Latest uploads from channels already on 4Ever. "UU…" is a channel's uploads playlist.
  await eachLimited(knownChannels.slice(0, MAX_CHANNELS), 10, async (channelId) => {
    const data = await yt<{ items?: { contentDetails?: { videoId?: string; videoPublishedAt?: string } }[] }>(
      `playlistItems?part=contentDetails&maxResults=15&playlistId=UU${channelId.slice(2)}`,
    );
    for (const item of data?.items ?? []) {
      const id = item.contentDetails?.videoId;
      const at = item.contentDetails?.videoPublishedAt;
      if (id && (!at || at >= FOREVER_LAUNCH)) candidates.add(id);
    }
  });

  // 2. The newest short videos anyone posted about WoW Forever.
  const since = new Date(Math.max(Date.parse(FOREVER_LAUNCH), Date.now() - SEARCH_BACK_HOURS * 3600_000));
  for (const q of SEARCHES) {
    const data = await yt<{ items?: { id?: { videoId?: string } }[] }>(
      `search?part=id&type=video&order=date&videoDuration=short&maxResults=50&q=${encodeURIComponent(q)}` +
        `&publishedAfter=${encodeURIComponent(since.toISOString())}`,
    );
    for (const item of data?.items ?? []) if (item.id?.videoId) candidates.add(item.id.videoId);
  }

  // Leave out anything 4Ever already has, in any state (removed and rejected ones stay out).
  const ids = [...candidates];
  const have = new Set<string>();
  for (const group of chunks(ids, 200)) {
    const { data } = await admin.from("clips").select("source_id").eq("platform", "youtube").in("source_id", group);
    for (const row of data ?? []) have.add((row as { source_id: string }).source_id);
  }
  const fresh = ids.filter((id) => !have.has(id));

  // Full details, 50 videos per request (1 unit each).
  const videos: VideoItem[] = [];
  for (const group of chunks(fresh, 50)) {
    const data = await yt<{ items?: VideoItem[] }>(`videos?part=snippet,contentDetails,status&id=${group.join(",")}`);
    videos.push(...(data?.items ?? []));
  }

  const knownSet = new Set(knownChannels);
  const perChannel = new Map<string, number>();
  const picked: VideoItem[] = [];
  // Oldest first, so if a channel posts a burst the earlier ones go up first and later runs pick up the rest.
  videos.sort((a, b) => (a.snippet?.publishedAt ?? "").localeCompare(b.snippet?.publishedAt ?? ""));
  for (const v of videos) {
    const s = v.snippet;
    if (!s?.channelId || !s.title || blocked.has(s.channelId)) continue;
    const seconds = parseIsoDuration(v.contentDetails?.duration);
    if (!seconds || seconds < MIN_CLIP_SECONDS || seconds > MAX_CLIP_SECONDS) continue;
    if (v.status?.embeddable === false || v.status?.privacyStatus !== "public") continue;
    if (s.liveBroadcastContent && s.liveBroadcastContent !== "none") continue;
    if (!s.publishedAt || s.publishedAt < FOREVER_LAUNCH) continue;
    if (!isWowForever(s.title, s.description ?? "", s.tags ?? [])) continue;
    if (looksLikeSpam(s.title)) continue;
    // New channels have to look like a player's own channel; channels already on 4Ever are trusted.
    if (!knownSet.has(s.channelId) && looksLikeReposter(s.channelTitle ?? "")) continue;
    const count = perChannel.get(s.channelId) ?? 0;
    if (count >= PER_CHANNEL_PER_RUN) continue;
    perChannel.set(s.channelId, count + 1);
    picked.push(v);
    if (picked.length >= PER_RUN) break;
  }

  // Channel pictures for the credit line.
  const avatars = new Map<string, string | null>();
  for (const group of chunks([...new Set(picked.map((v) => v.snippet!.channelId!))], 50)) {
    const data = await yt<{ items?: { id: string; snippet?: { thumbnails?: { medium?: Thumb; default?: Thumb } } }[] }>(
      `channels?part=snippet&id=${group.join(",")}`,
    );
    for (const c of data?.items ?? [])
      avatars.set(c.id, c.snippet?.thumbnails?.medium?.url ?? c.snippet?.thumbnails?.default?.url ?? null);
  }

  const now = new Date().toISOString();
  const rows = picked.map((v) => {
    const s = v.snippet!;
    const t = s.thumbnails;
    return {
      platform: "youtube",
      source_type: "youtube_video",
      source_id: v.id,
      source_url: `https://www.youtube.com/watch?v=${v.id}`,
      title: s.title!.slice(0, 140),
      thumbnail_url:
        t?.maxres?.url ??
        t?.standard?.url ??
        t?.high?.url ??
        t?.medium?.url ??
        `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`,
      duration_seconds: parseIsoDuration(v.contentDetails?.duration),
      channel_id: s.channelId!,
      channel_name: (s.channelTitle ?? "YouTube channel").slice(0, 120),
      channel_url: `https://www.youtube.com/channel/${s.channelId}`,
      channel_avatar_url: avatars.get(s.channelId!) ?? null,
      submitted_by: owner.id,
      shared_as_site: true,
      auto_found: true,
      kind: "clip",
      category: guessCategory(s.title!, s.tags ?? []),
      music_source: "none",
      status: "approved",
      reviewed_by: owner.id,
      reviewed_at: now,
      published_at: now,
      uploaded_at: s.publishedAt ?? null,
      details_refreshed_at: now,
    };
  });

  let added = 0;
  if (rows.length) {
    // One request; a video someone submitted a second ago is simply skipped.
    const { data } = await admin
      .from("clips")
      .upsert(rows, { onConflict: "source_type,source_id", ignoreDuplicates: true })
      .select("id");
    added = data?.length ?? 0;
  }
  return { looked: ids.length, added, skipped: fresh.length - added };
}
