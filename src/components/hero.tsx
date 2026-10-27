import Link from "next/link";
import { ClipThumbImage } from "@/components/clip-card";
import { PlayIcon } from "@/components/icons";
import { InlinePlayer } from "@/components/inline-player";
import { VerifiedMark } from "@/components/people";
import { categoryLabel, musicLabel } from "@/lib/categories";
import { formatCount, formatDuration } from "@/lib/format";
import { rarityClass } from "@/lib/rarity";
import type { Clip, Feature } from "@/lib/types";
import { platformLabel } from "@/lib/video";

// The front page feature. Its details read like an item tooltip from the game:
// the name in its quality color, white properties, a green "Use:" line, gold flavor text,
// and the creator credited the way crafted items are, "<Made by …>".
export function Hero({ clip, feature }: { clip: Clip; feature: Feature | null }) {
  const href = `/c/${clip.short_id}`;
  const duration = formatDuration(clip.duration_seconds);
  const maker = clip.creator?.display_name ?? clip.channel_name;
  return (
    <section aria-labelledby="hero-title" className="showcase">
      <InlinePlayer
        clipId={clip.id}
        sourceType={clip.source_type}
        sourceId={clip.source_id}
        platform={clip.platform}
        title={clip.title}
        className="showcase-media"
      >
        <ClipThumbImage clip={clip} />
        <span className="player-play">
          <PlayIcon size={32} style={{ marginLeft: 4 }} />
        </span>
        <span className="overlay-chip overlay-tl" style={{ left: 16, top: 16, height: 28 }}>
          {platformLabel(clip.platform)}
        </span>
      </InlinePlayer>

      <div className="showcase-side">
        <div className="wow-tip">
          <h1 id="hero-title" className={`tip-title ${rarityClass(clip.view_count)}`}>
            <Link href={href}>{clip.title}</Link>
          </h1>
          <span>{feature ? "Movie of the Week" : "Most watched this week"}</span>
          <span className="tip-split">
            <span>{categoryLabel(clip.category)}</span>
            <span>{clip.kind === "movie" ? "Movie" : "Clip"}</span>
          </span>
          {duration ? (
            <span className="tip-split tip-extra">
              <span>Runtime</span>
              <span>{duration}</span>
            </span>
          ) : null}
          <span className="tip-gap">+{formatCount(clip.view_count)} Views</span>
          <span className="tip-extra">+{formatCount(clip.vote_count)} Votes</span>
          <span className="tip-muted tip-extra">{musicLabel(clip.music_source, clip.music_credit)}</span>
          {feature?.use_text ? <span className="tip-use tip-gap tip-extra">Use: {feature.use_text}</span> : null}
          {feature?.flavor_text ? (
            <span className={`tip-flavor ${feature.use_text ? "" : "tip-gap"}`}>
              &ldquo;{feature.flavor_text}&rdquo;
            </span>
          ) : null}
          <span className="tip-made tip-gap row" style={{ gap: 6 }}>
            {clip.creator ? (
              <Link href={`/u/${clip.creator.username}`} style={{ color: "inherit", textDecoration: "none" }}>
                &lt;Made by {maker}&gt;
              </Link>
            ) : (
              <span>&lt;Made by {maker}&gt;</span>
            )}
            {clip.creator ? <VerifiedMark size={15} /> : null}
          </span>
        </div>
        <div className="showcase-actions">
          <Link href={href} className="btn btn-gold btn-lg">
            <PlayIcon size={15} /> Watch now
          </Link>
          {clip.creator ? (
            <Link href={`/u/${clip.creator.username}`} className="btn btn-ghost btn-lg">
              More from {clip.creator.display_name}
            </Link>
          ) : (
            <Link href={`/browse?cat=${clip.category}`} className="btn btn-ghost btn-lg">
              More {categoryLabel(clip.category)}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

// Before anything is shared, the front page invites the first legend.
export function EmptyHero() {
  return (
    <section aria-labelledby="hero-title" className="showcase">
      <div className="showcase-media">
        <img src="/backdrop/scene.webp" alt="" />
      </div>
      <div className="showcase-side">
        <div className="wow-tip">
          <h1 id="hero-title" className="tip-title rarity-legendary">
            The First Legend
          </h1>
          <span>Unique</span>
          <span className="tip-split">
            <span>Movie of the Week</span>
            <span>Empty slot</span>
          </span>
          <span className="tip-use tip-gap">
            Use: Share the best thing you&apos;ve recorded in Forever. It could be the first movie everyone sees here.
          </span>
          <span className="tip-flavor">&ldquo;Every legend starts with a single upload.&rdquo;</span>
          <span className="tip-made tip-gap">&lt;Made by you&gt;</span>
        </div>
        <div className="showcase-actions">
          <Link href="/submit" className="btn btn-gold btn-lg">
            Submit a Clip
          </Link>
          <Link href="/settings#channels" className="btn btn-ghost btn-lg">
            Verify your channel
          </Link>
        </div>
      </div>
    </section>
  );
}
