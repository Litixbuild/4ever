import Link from "next/link";
import { EyeIcon, PlayIcon } from "@/components/icons";
import { InlinePlayer } from "@/components/inline-player";
import { Avatar, VerifiedMark } from "@/components/people";
import { Vista } from "@/components/vista";
import { categoryLabel } from "@/lib/categories";
import { formatCount, formatDuration } from "@/lib/format";
import { rarityClass, rarityFor } from "@/lib/rarity";
import type { Clip } from "@/lib/types";
import { platformLabel } from "@/lib/video";

export function ClipThumbImage({ clip }: { clip: Pick<Clip, "thumbnail_url" | "short_id"> }) {
  return clip.thumbnail_url ? (
    <img src={clip.thumbnail_url} alt="" loading="lazy" referrerPolicy="no-referrer" />
  ) : (
    <Vista seed={clip.short_id} />
  );
}

// Who gets the credit line: the verified creator if there is one, otherwise the channel.
export function CreditLine({ clip, size = 22 }: { clip: Clip; size?: number }) {
  if (clip.creator) {
    return (
      <Link href={`/u/${clip.creator.username}`} className="person-link">
        <Avatar name={clip.creator.display_name} src={clip.creator.avatar_url ?? clip.channel_avatar_url} size={size} />
        <span>{clip.creator.display_name}</span>
        <VerifiedMark size={14} />
      </Link>
    );
  }
  return (
    <span className="person-link" title={`${clip.channel_name} on ${platformLabel(clip.platform)}`}>
      <Avatar name={clip.channel_name} src={clip.channel_avatar_url} size={size} />
      <span>{clip.channel_name}</span>
    </span>
  );
}

export function ClipCard({ clip }: { clip: Clip }) {
  const href = `/c/${clip.short_id}`;
  const duration = formatDuration(clip.duration_seconds);
  return (
    <article className={`clip-card q-${rarityFor(clip.view_count).key}`}>
      <InlinePlayer
        clipId={clip.id}
        sourceType={clip.source_type}
        sourceId={clip.source_id}
        platform={clip.platform}
        title={clip.title}
        className="thumb"
      >
        <ClipThumbImage clip={clip} />
        <span className="overlay-chip overlay-tl">{platformLabel(clip.platform)}</span>
        <span className="play-dot">
          <PlayIcon size={18} style={{ marginLeft: 3 }} />
        </span>
        {duration ? <span className="overlay-chip overlay-br">{duration}</span> : null}
      </InlinePlayer>
      <div className="clip-body">
        <Link href={href} className={`clip-title ${rarityClass(clip.view_count)}`}>
          {clip.title}
        </Link>
        <CreditLine clip={clip} />
        <div className="clip-meta">
          <span>{categoryLabel(clip.category)}</span>
          <span className="push icon-stat" title={`${formatCount(clip.view_count)} views`}>
            <EyeIcon size={14} />
            {formatCount(clip.view_count)}
            <span className="sr-only">views</span>
          </span>
        </div>
      </div>
    </article>
  );
}

export function ClipGrid({ clips }: { clips: Clip[] }) {
  return (
    <div className="clip-grid">
      {clips.map((clip) => (
        <ClipCard key={clip.id} clip={clip} />
      ))}
    </div>
  );
}

export function MiniClip({ clip }: { clip: Clip }) {
  const duration = formatDuration(clip.duration_seconds);
  return (
    <Link href={`/c/${clip.short_id}`} className="mini-clip">
      <span className="mini-thumb">
        <ClipThumbImage clip={clip} />
        {duration ? (
          <span className="overlay-chip" style={{ right: 6, bottom: 6, height: 20, fontSize: 11 }}>
            {duration}
          </span>
        ) : null}
      </span>
      <span className="stack-sm" style={{ gap: 4, minWidth: 0 }}>
        <span className={`mini-title ${rarityClass(clip.view_count)}`}>{clip.title}</span>
        <span className="tiny muted">{clip.creator?.display_name ?? clip.channel_name}</span>
        <span className="tiny muted row" style={{ gap: 5 }}>
          <EyeIcon size={12} /> {formatCount(clip.view_count)}
        </span>
      </span>
    </Link>
  );
}
