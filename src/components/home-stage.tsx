"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ClipThumbImage } from "@/components/clip-card";
import { ChevronLeftIcon, ChevronRightIcon, PlayIcon, XIcon } from "@/components/icons";
import { VerifiedMark } from "@/components/people";
import { PlayerMadeMark } from "@/components/player-made";
import { categoryLabel, musicLabel } from "@/lib/categories";
import { formatCount, formatDuration } from "@/lib/format";
import { rarityClass } from "@/lib/rarity";
import { markSeen } from "@/lib/seen";
import type { Clip, Feature } from "@/lib/types";
import { embedUrl, platformLabel, smallThumbnail } from "@/lib/video";
import { budgetFor, setWatching } from "@/lib/watch-xp";
import { warmPlatform } from "@/lib/warm";

const PLAY_EVENT = "4ever:play";

// The top three's title colours: the Featured Video in gold, then purple, then blue (like item quality).
const RANK_CLASS = ["rank-gold", "rank-purple", "rank-blue"];

function titleClass(position: number, ranked: number, views: number) {
  return position < ranked ? RANK_CLASS[position] : rarityClass(views);
}

// The Featured Video heading: gold lettering with a few embers drifting around it.
function FeaturedLabel() {
  return (
    <p className="featured-label">
      <span className="featured-embers" aria-hidden="true">
        {Array.from({ length: 10 }, (_, i) => (
          <i key={i} />
        ))}
      </span>
      <span className="featured-text">Featured Video</span>
    </p>
  );
}

// The front page's big player. The queue starts with the most watched videos today (the Featured Video,
// then the 2nd and 3rd), followed by the newest. Every video in the queue sits in the rail under the
// player, so people can watch them in any order; once one plays, a small "Play next video" window offers
// the next. YouTube videos move on by themselves when they end; Twitch ones wait for a click.
export function HomeStage({
  queue,
  ages,
  feature,
  ranked,
}: {
  queue: Clip[];
  // "3 days ago" per video, worked out on the server so it matches the page.
  ages: Record<string, string>;
  // The admin's feature notes, when the Featured Video is the one they picked.
  feature: Feature | null;
  // How many videos at the front of the queue are the most watched today (up to 3).
  ranked: number;
}) {
  const [index, setIndex] = useState(0);
  const [host, setHost] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const frame = useRef<HTMLIFrameElement>(null);
  const stage = useRef<HTMLElement>(null);
  const rail = useRef<HTMLOListElement>(null);
  const clip = queue[index];
  const next = queue[index + 1];

  const start = useCallback((target: Clip) => {
    window.dispatchEvent(new CustomEvent(PLAY_EVENT, { detail: target.id }));
    setHost(window.location.hostname);
    markSeen(target.id);
    fetch(`/api/clips/${target.id}/view`, { method: "POST", keepalive: true }).catch(() => undefined);
  }, []);

  const playAt = useCallback(
    (position: number) => {
      const target = queue[position];
      if (!target) return;
      setIndex(position);
      start(target);
    },
    [queue, start],
  );

  const playNext = useCallback(() => playAt(index + 1), [playAt, index]);

  // Picking from the rail: play it, and bring the player into view if it has scrolled away.
  function pick(position: number) {
    playAt(position);
    const top = stage.current?.getBoundingClientRect().top ?? 0;
    if (top < 0 || top > window.innerHeight * 0.5) {
      stage.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function slide(direction: 1 | -1) {
    const list = rail.current;
    if (list) list.scrollBy({ left: direction * list.clientWidth * 0.9, behavior: "smooth" });
  }

  // Keep the video that's playing in sight in the rail.
  useEffect(() => {
    const card = rail.current?.children[index] as HTMLElement | undefined;
    const list = rail.current;
    if (!card || !list) return;
    const left = card.offsetLeft - list.offsetLeft;
    if (left < list.scrollLeft || left + card.offsetWidth > list.scrollLeft + list.clientWidth) {
      list.scrollTo({ left: left - 12, behavior: "smooth" });
    }
  }, [index]);

  // Another video on the page started: this one stops.
  useEffect(() => {
    function onPlay(event: Event) {
      if ((event as CustomEvent<string>).detail !== clip?.id) setHost(null);
    }
    window.addEventListener(PLAY_EVENT, onPlay);
    return () => window.removeEventListener(PLAY_EVENT, onPlay);
  }, [clip?.id]);

  // Watch-time XP while it plays.
  useEffect(() => {
    if (!host || !clip) return;
    setWatching(true, budgetFor(clip.duration_seconds));
    return () => setWatching(false);
  }, [host, clip]);

  // Keep the next video's player servers warm.
  useEffect(() => {
    if (host && next) warmPlatform(next.platform);
  }, [host, next]);

  // YouTube reports when a video ends; then the next one plays.
  useEffect(() => {
    if (!host || clip?.platform !== "youtube") return;
    function onMessage(event: MessageEvent) {
      if (event.source !== frame.current?.contentWindow || typeof event.data !== "string") return;
      let data: { event?: string; info?: { playerState?: number } | number | null };
      try {
        data = JSON.parse(event.data);
      } catch {
        return;
      }
      const state =
        data.event === "onStateChange" ? data.info : typeof data.info === "object" ? data.info?.playerState : undefined;
      if (state === 0) playNext();
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [host, clip?.platform, playNext]);

  if (!clip) return null;

  const src = host
    ? `${embedUrl(clip.source_type, clip.source_id, host)}${
        clip.platform === "youtube"
          ? `&playsinline=1&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`
          : ""
      }`
    : null;
  const href = `/c/${clip.short_id}`;
  const duration = formatDuration(clip.duration_seconds);
  const maker = clip.creator?.display_name ?? clip.channel_name;
  const label = clip.kind === "movie" ? "Movie" : "Clip";
  const featured = index === 0 && ranked > 0;

  return (
    <>
      <section aria-labelledby="hero-title" className="showcase" ref={stage}>
        {src ? (
          <div className="showcase-media is-playing">
            <iframe
              key={clip.id}
              ref={frame}
              src={src}
              title={clip.title}
              onLoad={() =>
                frame.current?.contentWindow?.postMessage(
                  JSON.stringify({ event: "listening", id: "4ever-home", channel: "widget" }),
                  "*",
                )
              }
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
        ) : (
          <button
            type="button"
            className="showcase-media"
            onClick={() => start(clip)}
            onPointerEnter={() => warmPlatform(clip.platform)}
            onTouchStart={() => warmPlatform(clip.platform)}
            aria-label={`Play ${clip.title}`}
          >
            <ClipThumbImage clip={clip} large />
            <span className="player-play">
              <PlayIcon size={32} style={{ marginLeft: 4 }} />
            </span>
            <span className="overlay-chip overlay-tl" style={{ left: 16, top: 16, height: 28 }}>
              {platformLabel(clip.platform)}
            </span>
          </button>
        )}

        <div className="showcase-side">
          {featured ? <FeaturedLabel /> : null}
          <div className="wow-tip">
            <h1 id="hero-title" className={`tip-title ${titleClass(index, ranked, clip.view_count)}`}>
              <Link href={href}>{clip.title}</Link>
            </h1>
            <span className="row" style={{ gap: 8 }}>
              {label}
              {clip.player_made ? <PlayerMadeMark /> : null}
            </span>
            <span className="tip-split">
              <span>{categoryLabel(clip.category)}</span>
              {duration ? <span>{duration}</span> : null}
            </span>
            {ages[clip.id] ? (
              <span className="tip-muted">Uploaded {ages[clip.id].replace(/^Yesterday$/, "yesterday")}</span>
            ) : null}
            <span className="tip-gap">+{formatCount(clip.view_count)} Views</span>
            <span className="tip-extra">+{formatCount(clip.vote_count)} Votes</span>
            <span className="tip-muted tip-extra">{musicLabel(clip.music_source, clip.music_credit)}</span>
            {index === 0 && feature?.use_text ? (
              <span className="tip-use tip-gap tip-extra">Use: {feature.use_text}</span>
            ) : null}
            {index === 0 && feature?.flavor_text ? (
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
        </div>

        {host && next && !dismissed ? (
          <aside className="up-next" aria-label="Play next video">
            <div className="up-next-head">
              <span>Play next video</span>
              <button type="button" className="up-next-close" onClick={() => setDismissed(true)} aria-label="Close">
                <XIcon size={14} />
              </button>
            </div>
            <button
              type="button"
              className="up-next-card"
              onClick={playNext}
              onPointerEnter={() => warmPlatform(next.platform)}
            >
              <span className="up-next-thumb">
                {next.thumbnail_url ? (
                  <img src={smallThumbnail(next.thumbnail_url)} alt="" referrerPolicy="no-referrer" />
                ) : null}
                <span className="up-next-play">
                  <PlayIcon size={16} style={{ marginLeft: 2 }} />
                </span>
              </span>
              <span className={`up-next-title ${titleClass(index + 1, ranked, next.view_count)}`}>{next.title}</span>
              <span className="up-next-meta">
                {next.creator?.display_name ?? next.channel_name}
                {ages[next.id] ? ` · ${ages[next.id]}` : ""}
              </span>
            </button>
          </aside>
        ) : null}
      </section>

      {queue.length > 1 ? (
        <section aria-label="More videos" className="stage-rail">
          <ol ref={rail} className="stage-rail-list">
            {queue.map((item, position) => {
              const playing = Boolean(host) && position === index;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    className={`rail-card${position === index ? " is-current" : ""}${position < ranked ? ` rail-rank-${position + 1}` : ""}`}
                    onClick={() => pick(position)}
                    onPointerEnter={() => warmPlatform(item.platform)}
                    aria-current={position === index ? "true" : undefined}
                  >
                    <span className="rail-thumb">
                      <ClipThumbImage clip={item} small />
                      {position === 0 && ranked > 0 ? <span className="rail-featured">Featured</span> : null}
                      {playing ? <span className="rail-now">Playing</span> : null}
                      {formatDuration(item.duration_seconds) ? (
                        <span className="rail-time">{formatDuration(item.duration_seconds)}</span>
                      ) : null}
                    </span>
                    <span className={`rail-title ${titleClass(position, ranked, item.view_count)}`}>{item.title}</span>
                    <span className="rail-meta">
                      {item.creator?.display_name ?? item.channel_name}
                      {ages[item.id] ? <time> {ages[item.id]}</time> : null}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
          <button
            type="button"
            className="rail-arrow rail-arrow-left"
            onClick={() => slide(-1)}
            aria-label="Earlier videos"
          >
            <ChevronLeftIcon size={20} />
          </button>
          <button
            type="button"
            className="rail-arrow rail-arrow-right"
            onClick={() => slide(1)}
            aria-label="More videos"
          >
            <ChevronRightIcon size={20} />
          </button>
        </section>
      ) : null}
    </>
  );
}
