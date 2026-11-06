"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ClipThumbImage } from "@/components/clip-card";
import { ChevronLeftIcon, ChevronRightIcon, PlayIcon, XIcon } from "@/components/icons";
import { VerifiedMark } from "@/components/people";
import { PlayerMadeMark } from "@/components/player-made";
import { categoryLabel, musicLabel } from "@/lib/categories";
import { displayTitle, formatCount, formatDuration } from "@/lib/format";
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
// then the 2nd and 3rd), followed by the newest; the rail under the poster holds everything after the
// Featured Video, so people can pick in any order. Pressing play on any of them opens a full-screen player
// that starts by itself, with an X to close and "Play next video" under it. YouTube moves on by itself when
// a video ends; Twitch waits for a click (and on phones Twitch always needs one tap to start).
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
  const frame = useRef<HTMLIFrameElement>(null);
  // The YouTube player's last reported state (1 = playing, 3 = buffering).
  const ytState = useRef<number | null>(null);
  const rail = useRef<HTMLOListElement>(null);
  const clip = queue[index];
  const next = queue[index + 1];

  // Every video opens in the full-screen player and starts by itself; the X closes it.
  const start = useCallback((target: Clip) => {
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen({ navigationUI: "hide" }).catch(() => undefined);
    }
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

  const close = useCallback(() => {
    setHost(null);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => undefined);
  }, []);

  // While the full-screen player is open: no page scrolling behind it, and Escape closes it.
  useEffect(() => {
    if (!host) return;
    const root = document.documentElement;
    root.classList.add("theater-open");
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      root.classList.remove("theater-open");
      window.removeEventListener("keydown", onKey);
    };
  }, [host, close]);

  function slide(direction: 1 | -1) {
    const list = rail.current;
    if (list) list.scrollBy({ left: direction * list.clientWidth * 0.9, behavior: "smooth" });
  }

  // Keep the video that's playing in sight in the rail.
  useEffect(() => {
    const card = rail.current?.children[index - 1] as HTMLElement | undefined;
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
      if (typeof state === "number") ytState.current = state;
      if (typeof data.info === "object" && (data.info as { currentTime?: number } | null)?.currentTime) {
        if (((data.info as { currentTime?: number }).currentTime ?? 0) > 0.2) ytState.current = 1;
      }
      if (state === 0) playNext();
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [host, clip?.platform, playNext]);

  // Tell the YouTube player to report its state, then make sure it starts: if the browser held back
  // autoplay with sound, ask again, and as a last resort start it muted (always allowed).
  function onFrameLoad() {
    const target = frame.current?.contentWindow;
    if (!target) return;
    const send = (message: object) => target.postMessage(JSON.stringify(message), "*");
    send({ event: "listening", id: "4ever-home", channel: "widget" });
    if (clip?.platform !== "youtube") return;
    ytState.current = null;
    const started = () => ytState.current === 1 || ytState.current === 3;
    // If the browser wouldn't start it with sound, start it muted (always allowed); YouTube's own
    // speaker button turns the sound back on.
    window.setTimeout(() => {
      if (started()) return;
      send({ event: "command", func: "mute", args: [] });
      send({ event: "command", func: "playVideo", args: [] });
    }, 1000);
  }

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
      <section aria-labelledby="hero-title" className="showcase">
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

        <div className="showcase-side">
          {featured ? (
            <FeaturedLabel />
          ) : ranked > 0 && index > 0 ? (
            <button type="button" className="back-featured" onClick={() => setIndex(0)}>
              <ChevronLeftIcon size={16} />
              Back to the Featured Video
            </button>
          ) : null}
          <div className="wow-tip">
            <h1 id="hero-title" className={`tip-title ${titleClass(index, ranked, clip.view_count)}`}>
              <Link href={href}>{displayTitle(clip.title)}</Link>
            </h1>
            {/* Phones: everything about the video on one short line. */}
            <span className="tip-line">
              {[
                categoryLabel(clip.category),
                duration,
                ages[clip.id] ? ages[clip.id].replace(/^Yesterday$/, "yesterday") : null,
                `${formatCount(clip.view_count)} ${clip.view_count === 1 ? "view" : "views"}`,
              ]
                .filter(Boolean)
                .join(" · ")}
              {clip.player_made ? <PlayerMadeMark /> : null}
            </span>
            <span className="row tip-wide" style={{ gap: 8 }}>
              {label}
              {clip.player_made ? <PlayerMadeMark /> : null}
            </span>
            <span className="tip-split tip-wide">
              <span>{categoryLabel(clip.category)}</span>
              {duration ? <span>{duration}</span> : null}
            </span>
            {ages[clip.id] ? (
              <span className="tip-muted tip-wide">Uploaded {ages[clip.id].replace(/^Yesterday$/, "yesterday")}</span>
            ) : null}
            <span className="tip-gap tip-wide">+{formatCount(clip.view_count)} Views</span>
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
      </section>

      {queue.length > 1 ? (
        <section aria-label="More videos" className="stage-rail">
          <ol ref={rail} className="stage-rail-list">
            {queue.map((item, position) => {
              // The Featured Video is already the big player; the rail starts with the 2nd.
              if (position === 0) return null;
              const playing = Boolean(host) && position === index;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    className={`rail-card${position === index ? " is-current" : ""}${position < ranked ? ` rail-rank-${position + 1}` : ""}`}
                    onClick={() => playAt(position)}
                    onPointerEnter={() => warmPlatform(item.platform)}
                    aria-current={position === index ? "true" : undefined}
                  >
                    <span className="rail-thumb">
                      <ClipThumbImage clip={item} small />
                      {playing ? <span className="rail-now">Playing</span> : null}
                      {formatDuration(item.duration_seconds) ? (
                        <span className="rail-time">{formatDuration(item.duration_seconds)}</span>
                      ) : null}
                    </span>
                    <span className={`rail-title ${titleClass(position, ranked, item.view_count)}`}>
                      {displayTitle(item.title)}
                    </span>
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

      {src ? (
        <div className="theater" role="dialog" aria-modal="true" aria-label={clip.title}>
          <div className="theater-bar">
            <span className={`theater-title ${titleClass(index, ranked, clip.view_count)}`}>
              {featured ? <span className="theater-featured">Featured Video</span> : null}
              {displayTitle(clip.title)}
            </span>
            <button type="button" className="theater-close" onClick={close} aria-label="Close the player" autoFocus>
              <XIcon size={22} />
            </button>
          </div>
          <div className="theater-stage">
            <iframe
              key={clip.id}
              ref={frame}
              src={src}
              title={clip.title}
              onLoad={onFrameLoad}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
          {next ? (
            <button
              type="button"
              className="theater-next"
              onClick={playNext}
              onPointerEnter={() => warmPlatform(next.platform)}
            >
              <span className="theater-next-thumb">
                {next.thumbnail_url ? (
                  <img src={smallThumbnail(next.thumbnail_url)} alt="" referrerPolicy="no-referrer" />
                ) : null}
                <PlayIcon size={16} style={{ marginLeft: 2 }} />
              </span>
              <span className="theater-next-text">
                <span className="theater-next-head">Play next video</span>
                <span className={`theater-next-title ${titleClass(index + 1, ranked, next.view_count)}`}>
                  {displayTitle(next.title)}
                </span>
              </span>
            </button>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
