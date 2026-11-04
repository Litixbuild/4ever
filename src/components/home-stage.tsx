"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ClipThumbImage } from "@/components/clip-card";
import { PlayIcon, XIcon } from "@/components/icons";
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

// The front page's big player. It works through a queue (movies first, then the newest clips): once a video
// starts, a small "Play next video" window shows the next one in the lower corner. YouTube videos move on
// by themselves when they end; Twitch doesn't tell the page when a clip ends, so those wait for a click.
export function HomeStage({
  queue,
  ages,
  feature,
}: {
  queue: Clip[];
  // "3 days ago" per video, worked out on the server so it matches the page.
  ages: Record<string, string>;
  feature: Feature | null;
}) {
  const [index, setIndex] = useState(0);
  const [host, setHost] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const frame = useRef<HTMLIFrameElement>(null);
  const clip = queue[index];
  const next = queue[index + 1];

  const start = useCallback((target: Clip) => {
    window.dispatchEvent(new CustomEvent(PLAY_EVENT, { detail: target.id }));
    setHost(window.location.hostname);
    markSeen(target.id);
    fetch(`/api/clips/${target.id}/view`, { method: "POST", keepalive: true }).catch(() => undefined);
  }, []);

  const playNext = useCallback(() => {
    if (!next) return;
    setIndex((i) => i + 1);
    start(next);
  }, [next, start]);

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
  const label = index === 0 && feature ? "Movie of the Week" : clip.kind === "movie" ? "Movie" : "Clip";

  return (
    <section aria-labelledby="hero-title" className="showcase">
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
        <div className="wow-tip">
          <h1 id="hero-title" className={`tip-title ${rarityClass(clip.view_count)}`}>
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
            <span className={`up-next-title ${rarityClass(next.view_count)}`}>{next.title}</span>
            <span className="up-next-meta">
              {next.creator?.display_name ?? next.channel_name}
              {ages[next.id] ? ` · ${ages[next.id]}` : ""}
            </span>
          </button>
        </aside>
      ) : null}
    </section>
  );
}
