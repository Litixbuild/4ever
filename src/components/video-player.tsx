"use client";

import { useState } from "react";
import { PlayIcon } from "@/components/icons";
import { Vista } from "@/components/vista";
import { embedUrl, platformLabel } from "@/lib/video";

// Shows the thumbnail first and only loads YouTube or Twitch after a click.
// That keeps pages fast, keeps trackers away until someone actually watches,
// and lets us count a "view" when a person presses play.
export function VideoPlayer({
  clipId,
  shortId,
  sourceType,
  sourceId,
  platform,
  title,
  thumbnailUrl,
  duration,
  countView = true,
}: {
  clipId: string;
  shortId: string;
  sourceType: string;
  sourceId: string;
  platform: string;
  title: string;
  thumbnailUrl: string | null;
  duration: string;
  countView?: boolean;
}) {
  const [host, setHost] = useState<string | null>(null);

  function play() {
    setHost(window.location.hostname);
    if (countView) {
      fetch(`/api/clips/${clipId}/view`, { method: "POST", keepalive: true }).catch(() => undefined);
    }
  }

  return (
    <div className="player">
      {host ? (
        <iframe
          src={embedUrl(sourceType, sourceId, host)}
          title={title}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : (
        <button type="button" className="player-facade" onClick={play} aria-label={`Play ${title}`}>
          {thumbnailUrl ? (
            <img src={thumbnailUrl} alt="" referrerPolicy="no-referrer" />
          ) : (
            <Vista seed={shortId} />
          )}
          <span className="player-play">
            <PlayIcon size={34} style={{ marginLeft: 4 }} />
          </span>
          <span className="player-bar">
            <span>{duration || "Play"}</span>
            <span>Plays from {platformLabel(platform)}</span>
          </span>
        </button>
      )}
    </div>
  );
}
