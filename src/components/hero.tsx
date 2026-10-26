import Link from "next/link";
import { ClipThumbImage, CreditLine } from "@/components/clip-card";
import { ClockIcon, EyeIcon, MusicIcon, PlayIcon, StarIcon, SwordIcon, UpIcon } from "@/components/icons";
import { Vista } from "@/components/vista";
import { categoryLabel, musicLabel } from "@/lib/categories";
import { formatCount, formatDuration } from "@/lib/format";
import { rarityClass } from "@/lib/rarity";
import type { Clip, Feature } from "@/lib/types";
import { platformLabel } from "@/lib/video";

export function Hero({ clip, feature }: { clip: Clip; feature: Feature | null }) {
  const href = `/c/${clip.short_id}`;
  const duration = formatDuration(clip.duration_seconds);
  return (
    <section aria-labelledby="hero-title" className="hero">
      <Link href={href} className="hero-media thumb" aria-label={`Watch ${clip.title}`}>
        <ClipThumbImage clip={clip} />
        <span className="overlay-chip" style={{ left: 18, top: 18, height: 30, padding: "0 12px", color: "var(--gold-hi)", border: "1px solid rgba(242,207,126,0.35)", letterSpacing: "0.1em", fontWeight: 800 }}>
          <StarIcon size={13} />
          {feature ? "MOVIE OF THE WEEK" : "TRENDING THIS WEEK"}
        </span>
        <span className="player-play" style={{ width: 84, height: 84 }}>
          <PlayIcon size={30} style={{ marginLeft: 4 }} />
        </span>
        <span className="overlay-chip" style={{ left: 18, bottom: 18, height: 28 }}>
          {platformLabel(clip.platform)}
        </span>
        {duration ? (
          <span className="overlay-chip" style={{ right: 18, bottom: 18, height: 28 }}>
            {duration}
          </span>
        ) : null}
      </Link>

      <div className="hero-info">
        <span className="eyebrow">
          {clip.kind === "movie" ? "Movie" : "Clip"} · {categoryLabel(clip.category)}
        </span>
        <h1 id="hero-title" className={`hero-title ${rarityClass(clip.view_count)}`}>
          <Link href={href} style={{ color: "inherit", textDecoration: "none" }}>
            {clip.title}
          </Link>
        </h1>
        <div className="row small muted" style={{ gap: "8px 18px" }}>
          {duration ? (
            <span className="row" style={{ gap: 6 }}>
              <ClockIcon size={15} />
              {duration}
            </span>
          ) : null}
          <span className="row" style={{ gap: 6 }}>
            <SwordIcon size={15} />
            {categoryLabel(clip.category)}
          </span>
          <span className="row" style={{ gap: 6 }}>
            <MusicIcon size={15} />
            {musicLabel(clip.music_source, clip.music_credit)}
          </span>
        </div>
        {feature && (feature.use_text || feature.flavor_text) ? (
          <div className="card-tooltip stack-sm" style={{ gap: 4, fontSize: 14 }}>
            {feature.use_text ? <span className="use-line">Use: {feature.use_text}</span> : null}
            {feature.flavor_text ? <span className="flavor-line">&ldquo;{feature.flavor_text}&rdquo;</span> : null}
          </div>
        ) : null}
        <div className="row" style={{ gap: 12, flexWrap: "nowrap" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <CreditLine clip={clip} size={36} />
          </div>
          <span className="icon-stat small muted" title="Views on 4Ever">
            <EyeIcon size={15} /> {formatCount(clip.view_count)}
          </span>
          <span className="icon-stat small" style={{ color: "var(--gold-hi)" }} title="Votes">
            <UpIcon size={15} /> {formatCount(clip.vote_count)}
          </span>
        </div>
        <div className="row" style={{ marginTop: "auto" }}>
          <Link href={href} className="btn btn-gold btn-lg">
            <PlayIcon size={15} /> Watch now
          </Link>
          {clip.creator ? (
            <Link href={`/u/${clip.creator.username}`} className="btn btn-ghost btn-lg">
              Creator profile
            </Link>
          ) : (
            <Link href={`/browse?cat=${clip.category}`} className="btn btn-ghost btn-lg">
              More like this
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

export function EmptyHero() {
  return (
    <section aria-labelledby="hero-title" className="hero">
      <div className="hero-media thumb" style={{ aspectRatio: "16 / 9" }}>
        <Vista seed="tarren-mill" />
      </div>
      <div className="hero-info">
        <span className="eyebrow">Movie of the Week</span>
        <h1 id="hero-title" className="hero-title">
          The front page is waiting for its first legend
        </h1>
        <p className="lead" style={{ margin: 0 }}>
          4Ever is brand new. Share the best thing you&apos;ve recorded in Forever and it could be the first movie
          everyone sees here.
        </p>
        <div className="card-tooltip stack-sm" style={{ gap: 4, fontSize: 14 }}>
          <span className="use-line">Use: Be the first.</span>
          <span className="flavor-line">&ldquo;Every legend starts with a single upload.&rdquo;</span>
        </div>
        <div className="row" style={{ marginTop: "auto" }}>
          <Link href="/submit" className="btn btn-gold btn-lg">
            Submit a Clip
          </Link>
          <Link href="/contests" className="btn btn-ghost btn-lg">
            See the contests
          </Link>
        </div>
      </div>
    </section>
  );
}
