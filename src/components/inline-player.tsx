"use client";

import { useEffect, useState, type ReactNode } from "react";
import { budgetFor, setWatching } from "@/lib/watch-xp";
import { warmPlatform } from "@/lib/warm";
import { markSeen } from "@/lib/seen";
import { embedUrl } from "@/lib/video";

const PLAY_EVENT = "4ever:play";

// A thumbnail that turns into the video right where it sits when pressed.
// Only one video plays at a time: starting one stops any other on the page.
export function InlinePlayer({
  clipId,
  sourceType,
  sourceId,
  platform,
  title,
  className,
  durationSeconds,
  children,
}: {
  clipId: string;
  sourceType: string;
  sourceId: string;
  platform: string;
  title: string;
  className: string;
  durationSeconds?: number | null;
  children: ReactNode;
}) {
  const [host, setHost] = useState<string | null>(null);

  useEffect(() => {
    function onPlay(event: Event) {
      if ((event as CustomEvent<string>).detail !== clipId) setHost(null);
    }
    window.addEventListener(PLAY_EVENT, onPlay);
    return () => window.removeEventListener(PLAY_EVENT, onPlay);
  }, [clipId]);

  // A playing video earns watch-time XP until it's closed, another one starts, or its length runs out.
  useEffect(() => {
    if (!host) return;
    setWatching(true, budgetFor(durationSeconds));
    return () => setWatching(false);
  }, [host, durationSeconds]);

  const src = (h: string) => `${embedUrl(sourceType, sourceId, h)}${platform === "youtube" ? "&playsinline=1" : ""}`;
  // Hovering or touching a video starts connecting to its player, so pressing play is quicker.
  const warm = () => warmPlatform(platform);

  function play() {
    window.dispatchEvent(new CustomEvent(PLAY_EVENT, { detail: clipId }));
    setHost(window.location.hostname);
    markSeen(clipId);
    fetch(`/api/clips/${clipId}/view`, { method: "POST", keepalive: true }).catch(() => undefined);
  }

  if (host) {
    return (
      <div className={`${className} is-playing`}>
        <iframe
          src={src(host)}
          title={title}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      className={className}
      onClick={play}
      onPointerEnter={warm}
      onTouchStart={warm}
      onFocus={warm}
      aria-label={`Play ${title}`}
    >
      {children}
    </button>
  );
}
