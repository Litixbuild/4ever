// Reading data for pages. Uses the visitor's own session, so the database
// security rules decide what they can see.
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { cleanSearch } from "@/lib/format";
import { isCategory, isKind } from "@/lib/categories";
import {
  CLIP_COLUMNS,
  type BadgeRow,
  type Channel,
  type Clip,
  type CommentRow,
  type Contest,
  type Feature,
  type Profile,
} from "@/lib/types";

export type ClipSort = "new" | "views" | "votes" | "trending";

export function isClipSort(value: unknown): value is ClipSort {
  return value === "new" || value === "views" || value === "votes" || value === "trending";
}

export type ClipFilters = {
  kind?: string | null;
  category?: string | null;
  tag?: string | null;
  q?: string | null;
  sort?: ClipSort;
  page?: number;
  perPage?: number;
};

export async function listClips(filters: ClipFilters = {}): Promise<{ clips: Clip[]; total: number }> {
  const supabase = await createClient();
  const perPage = Math.min(Math.max(filters.perPage ?? 24, 1), 60);
  const page = Math.max(filters.page ?? 1, 1);

  let query = supabase.from("clips").select(CLIP_COLUMNS, { count: "exact" }).eq("status", "approved");

  if (isKind(filters.kind)) query = query.eq("kind", filters.kind);
  if (isCategory(filters.category)) query = query.eq("category", filters.category);
  const tag = (filters.tag ?? "").toLowerCase().replace(/[^a-z0-9-]/g, "");
  if (tag) query = query.contains("tags", [tag]);
  const q = cleanSearch(filters.q);
  if (q) query = query.or(`title.ilike."%${q}%",channel_name.ilike."%${q}%"`);

  switch (filters.sort) {
    case "views":
      query = query.order("view_count", { ascending: false }).order("published_at", { ascending: false });
      break;
    case "votes":
      query = query.order("vote_count", { ascending: false }).order("published_at", { ascending: false });
      break;
    case "trending":
      query = query
        .gte("published_at", new Date(Date.now() - 14 * 86400_000).toISOString())
        .order("view_count", { ascending: false })
        .order("vote_count", { ascending: false });
      break;
    default:
      query = query.order("published_at", { ascending: false });
  }

  const from = (page - 1) * perPage;
  const { data, count } = await query.range(from, from + perPage - 1);
  return { clips: (data ?? []) as unknown as Clip[], total: count ?? 0 };
}

export const getClipByShortId = cache(async (shortId: string): Promise<Clip | null> => {
  if (!/^[A-Za-z0-9]{6,12}$/.test(shortId)) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("clips").select(CLIP_COLUMNS).eq("short_id", shortId).maybeSingle();
  return (data as unknown as Clip) ?? null;
});

export async function getComments(clipId: string): Promise<CommentRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("comments")
    .select("id, clip_id, user_id, body, created_at, author:profiles ( id, username, display_name, avatar_url )")
    .eq("clip_id", clipId)
    .order("created_at", { ascending: true })
    .limit(300);
  return (data ?? []) as unknown as CommentRow[];
}

export async function getViewerClipState(clipId: string, userId: string | null) {
  if (!userId) return { voted: false, favorited: false };
  const supabase = await createClient();
  const [vote, fav] = await Promise.all([
    supabase.from("votes").select("clip_id").eq("clip_id", clipId).eq("user_id", userId).maybeSingle(),
    supabase.from("favorites").select("clip_id").eq("clip_id", clipId).eq("user_id", userId).maybeSingle(),
  ]);
  return { voted: Boolean(vote.data), favorited: Boolean(fav.data) };
}

export async function getMoreFromSameSource(clip: Clip, limit = 4): Promise<Clip[]> {
  const supabase = await createClient();
  let query = supabase.from("clips").select(CLIP_COLUMNS).eq("status", "approved").neq("id", clip.id);
  if (clip.creator_id) query = query.eq("creator_id", clip.creator_id);
  else if (clip.channel_id) query = query.eq("platform", clip.platform).eq("channel_id", clip.channel_id);
  else query = query.eq("category", clip.category);
  const { data } = await query.order("view_count", { ascending: false }).limit(limit);
  return (data ?? []) as unknown as Clip[];
}

const FEATURE_COLUMNS = `id, clip_id, use_text, flavor_text, starts_at, ends_at, created_at, clip:clips ( ${CLIP_COLUMNS} )`;

export async function getCurrentFeature(): Promise<Feature | null> {
  const supabase = await createClient();
  const now = new Date().toISOString();
  const { data } = await supabase
    .from("features")
    .select(FEATURE_COLUMNS)
    .lte("starts_at", now)
    .or(`ends_at.is.null,ends_at.gt."${now}"`)
    .order("starts_at", { ascending: false })
    .limit(5);
  const features = (data ?? []) as unknown as Feature[];
  return features.find((f) => f.clip && f.clip.status === "approved") ?? null;
}

export async function listFeatures(limit = 24): Promise<Feature[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("features")
    .select(FEATURE_COLUMNS)
    .lte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: false })
    .limit(limit);
  return ((data ?? []) as unknown as Feature[]).filter((f) => f.clip && f.clip.status === "approved");
}

// When nothing is featured, show the most watched video of the past week.
export async function getHeroFallback(): Promise<Clip | null> {
  const supabase = await createClient();
  const weekAgo = new Date(Date.now() - 7 * 86400_000).toISOString();
  const { data: recent } = await supabase
    .from("clips")
    .select(CLIP_COLUMNS)
    .eq("status", "approved")
    .gte("published_at", weekAgo)
    .order("view_count", { ascending: false })
    .limit(1);
  if (recent?.[0]) return recent[0] as unknown as Clip;
  const { data: latest } = await supabase
    .from("clips")
    .select(CLIP_COLUMNS)
    .eq("status", "approved")
    .order("published_at", { ascending: false })
    .limit(1);
  return (latest?.[0] as unknown as Clip) ?? null;
}

// The contest happening now, or the next one coming up.
export async function getSpotlightContest(): Promise<Contest | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("contests")
    .select("*")
    .gt("ends_at", new Date().toISOString())
    .order("opens_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return (data as Contest) ?? null;
}

export async function listContests(): Promise<Contest[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("contests").select("*").order("opens_at", { ascending: false });
  return (data ?? []) as Contest[];
}

export async function getContest(slug: string): Promise<Contest | null> {
  if (!/^[a-z0-9-]{3,60}$/.test(slug)) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("contests").select("*").eq("slug", slug).maybeSingle();
  return (data as Contest) ?? null;
}

export type ContestStanding = { clip: Clip; windowVotes: number; placement: number | null };

export async function getContestStandings(contestId: string): Promise<ContestStanding[]> {
  const supabase = await createClient();
  const { data: board } = await supabase.rpc("contest_leaderboard", { p_contest: contestId });
  const rows = (board ?? []) as { clip_id: string; window_votes: number; placement: number | null }[];
  if (rows.length === 0) return [];
  const { data: clips } = await supabase
    .from("clips")
    .select(CLIP_COLUMNS)
    .in(
      "id",
      rows.map((r) => r.clip_id),
    );
  const byId = new Map(((clips ?? []) as unknown as Clip[]).map((c) => [c.id, c]));
  return rows
    .map((r) => ({ clip: byId.get(r.clip_id), windowVotes: Number(r.window_votes), placement: r.placement }))
    .filter((r): r is ContestStanding => Boolean(r.clip));
}

export type TopCreator = { id: string; username: string; display_name: string; avatar_url: string | null; votes: number };

export async function getTopCreators(days = 7, limit = 5): Promise<TopCreator[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("top_creators", { p_days: days, p_limit: limit });
  return ((data ?? []) as TopCreator[]).map((c) => ({ ...c, votes: Number(c.votes) }));
}

export type DirectoryCreator = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  active_title: string | null;
  faction: string | null;
  clip_count: number;
  total_views: number;
  total_votes: number;
};

export async function getCreatorDirectory(limit = 60): Promise<DirectoryCreator[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("creator_directory", { p_limit: limit });
  return ((data ?? []) as DirectoryCreator[]).map((c) => ({
    ...c,
    clip_count: Number(c.clip_count),
    total_views: Number(c.total_views),
    total_votes: Number(c.total_votes),
  }));
}

export type ActivityItem =
  | { type: "clip"; at: string; clip: Clip }
  | { type: "badge"; at: string; badge: string; person: { username: string; display_name: string } }
  | { type: "contest"; at: string; contest: Contest };

export async function getActivity(limit = 6): Promise<ActivityItem[]> {
  const supabase = await createClient();
  const nowIso = new Date().toISOString();
  const weekAgo = new Date(Date.now() - 7 * 86400_000).toISOString();
  const [clips, badges, contests] = await Promise.all([
    supabase
      .from("clips")
      .select(CLIP_COLUMNS)
      .eq("status", "approved")
      .order("published_at", { ascending: false })
      .limit(limit),
    supabase
      .from("user_badges")
      .select("badge, awarded_at, person:profiles ( username, display_name )")
      .neq("badge", "verified_creator")
      .order("awarded_at", { ascending: false })
      .limit(limit),
    supabase.from("contests").select("*").lte("opens_at", nowIso).gte("opens_at", weekAgo),
  ]);

  const items: ActivityItem[] = [
    ...((clips.data ?? []) as unknown as Clip[]).map(
      (clip): ActivityItem => ({ type: "clip", at: clip.published_at ?? clip.created_at, clip }),
    ),
    ...((badges.data ?? []) as unknown as { badge: string; awarded_at: string; person: { username: string; display_name: string } | null }[])
      .filter((b) => b.person)
      .map((b): ActivityItem => ({ type: "badge", at: b.awarded_at, badge: b.badge, person: b.person! })),
    ...((contests.data ?? []) as Contest[]).map(
      (contest): ActivityItem => ({ type: "contest", at: contest.opens_at, contest }),
    ),
  ];
  return items.sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit);
}

const PROFILE_COLUMNS =
  "id, username, display_name, avatar_url, bio, main_character, main_level, main_race, main_class, main_spec, realm, guild, faction, active_title, role, created_at";

export const getProfileByUsername = cache(async (username: string): Promise<Profile | null> => {
  const value = username.toLowerCase();
  if (!/^[a-z0-9_]{3,24}$/.test(value)) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select(PROFILE_COLUMNS).eq("username", value).maybeSingle();
  return (data as Profile) ?? null;
});

export async function getCreatorStats(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase.rpc("creator_stats", { p_user: userId }).maybeSingle();
  const row = (data ?? {}) as Partial<Record<"clip_count" | "total_views" | "total_votes" | "times_featured", number>>;
  return {
    clipCount: Number(row.clip_count ?? 0),
    totalViews: Number(row.total_views ?? 0),
    totalVotes: Number(row.total_votes ?? 0),
    timesFeatured: Number(row.times_featured ?? 0),
  };
}

export async function getBadges(userId: string): Promise<BadgeRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("user_badges")
    .select("user_id, badge, awarded_at, note")
    .eq("user_id", userId)
    .order("awarded_at", { ascending: true });
  return (data ?? []) as BadgeRow[];
}

export async function getChannels(userId: string): Promise<Channel[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("channels")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  return (data ?? []) as Channel[];
}

export async function getClipsByCreator(userId: string, limit = 48): Promise<Clip[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("clips")
    .select(CLIP_COLUMNS)
    .eq("status", "approved")
    .eq("creator_id", userId)
    .order("published_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as unknown as Clip[];
}

export async function getClipsSharedBy(userId: string, limit = 48): Promise<Clip[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("clips")
    .select(CLIP_COLUMNS)
    .eq("status", "approved")
    .eq("submitted_by", userId)
    .or(`creator_id.is.null,creator_id.neq.${userId}`)
    .order("published_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as unknown as Clip[];
}

export async function getFavoriteClips(userId: string, limit = 48): Promise<Clip[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("favorites")
    .select(`created_at, clip:clips ( ${CLIP_COLUMNS} )`)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return ((data ?? []) as unknown as { clip: Clip | null }[])
    .map((row) => row.clip)
    .filter((clip): clip is Clip => Boolean(clip && clip.status === "approved"));
}

export async function getMostViewed(limit = 12): Promise<Clip[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("clips")
    .select(CLIP_COLUMNS)
    .eq("status", "approved")
    .order("view_count", { ascending: false })
    .limit(limit);
  return (data ?? []) as unknown as Clip[];
}

export type Champion = { contest: Contest; clip: Clip };

export async function getChampions(limit = 24): Promise<Champion[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("contest_entries")
    .select(`contest:contests ( * ), clip:clips ( ${CLIP_COLUMNS} )`)
    .eq("placement", 1)
    .order("created_at", { ascending: false })
    .limit(limit);
  return ((data ?? []) as unknown as { contest: Contest | null; clip: Clip | null }[])
    .filter((row): row is Champion => Boolean(row.contest && row.clip && row.clip.status === "approved"))
    .sort((a, b) => b.contest.ends_at.localeCompare(a.contest.ends_at));
}
