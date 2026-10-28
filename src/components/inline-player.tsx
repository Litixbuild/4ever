"use client";

import { useEffect, useState, type ReactNode } from "react";
import { pressedEmbedUrl } from "@/lib/video";

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
  children,
}: {
  clipId: string;
  sourceType: string;
  sourceId: string;
  platform: string;
  title: string;
  className: string;
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

  function play() {
    window.dispatchEvent(new CustomEvent(PLAY_EVENT, { detail: clipId }));
    setHost(window.location.hostname);
    fetch(`/api/clips/${clipId}/view`, { method: "POST", keepalive: true }).catch(() => undefined);
  }

  if (host) {
    return (
      <div className={`${className} is-playing`}>
        <iframe
          src={`${pressedEmbedUrl(sourceType, sourceId, host)}${platform === "youtube" ? "&playsinline=1" : ""}`}
          title={title}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    );
  }

  return (
    <button type="button" className={className} onClick={play} aria-label={`Play ${title}`}>
      {children}
    </button>
  );
}
