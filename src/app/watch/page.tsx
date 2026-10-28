import type { Metadata } from "next";
import { ClipFeed, type FeedClip } from "@/components/clip-feed";
import { getViewer } from "@/lib/auth";
import { categoryLabel, isKind } from "@/lib/categories";
import { formatDuration } from "@/lib/format";
import { getClipByShortId, listClips } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import type { Clip } from "@/lib/types";

export const metadata: Metadata = {
  title: "Clips",
  description: "Swipe through World of Warcraft: Forever clips.",
};

function toFeedClip(clip: Clip, voted: boolean): FeedClip {
  // The face of a video is its verified creator; if the channel isn't claimed yet, the person who shared it.
  const person = clip.creator ?? clip.submitter;
  return {
    id: clip.id,
    shortId: clip.short_id,
    title: clip.title,
    sourceType: clip.source_type,
    sourceId: clip.source_id,
    platform: clip.platform,
    channelAvatar: clip.channel_avatar_url,
    thumbnailUrl: clip.thumbnail_url,
    duration: formatDuration(clip.duration_seconds),
    category: categoryLabel(clip.category),
    channelName: clip.channel_name,
    views: clip.view_count,
    votes: clip.vote_count,
    comments: clip.comment_count,
    voted,
    person: person
      ? {
          name: person.display_name,
          username: person.username,
          avatar: person.avatar_url ?? (clip.creator ? clip.channel_avatar_url : null),
          isCreator: Boolean(clip.creator),
        }
      : null,
  };
}

function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// The swipe feed: one clip at a time, full screen, like Shorts.
export default async function WatchPage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string; kind?: string }>;
}) {
  const params = await searchParams;
  const kind = isKind(params.kind) ? params.kind : "clip";
  // Up to the 180 most watched, three pages of 60.
  const [viewer, ...pages] = await Promise.all([
    getViewer(),
    ...[1, 2, 3].map((page) => listClips({ kind, sort: "views", perPage: 60, page })),
  ]);
  const clips = pages.flatMap((p) => p.clips);

  // A fresh random order every visit, so the same clips aren't always up front.
  // A clip someone tapped to get here (?start=) still plays first.
  let list = shuffle(clips);
  if (params.start) {
    const startClip = list.find((c) => c.short_id === params.start) ?? (await getClipByShortId(params.start));
    if (startClip && startClip.status === "approved") list = [startClip, ...list.filter((c) => c.id !== startClip.id)];
  }

  let votedIds = new Set<string>();
  if (viewer && list.length > 0) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("votes")
      .select("clip_id")
      .eq("user_id", viewer.userId)
      .in(
        "clip_id",
        list.map((c) => c.id),
      );
    votedIds = new Set((data ?? []).map((v: { clip_id: string }) => v.clip_id));
  }

  const startIndex = Math.max(
    0,
    list.findIndex((c) => c.short_id === params.start),
  );

  return (
    <ClipFeed
      clips={list.map((c) => toFeedClip(c, votedIds.has(c.id)))}
      startIndex={startIndex}
      kind={kind}
      loggedIn={Boolean(viewer)}
    />
  );
}
