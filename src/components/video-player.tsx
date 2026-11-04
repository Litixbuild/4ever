"use client";

import { useEffect, useState } from "react";
import { PlayIcon } from "@/components/icons";
import { Vista } from "@/components/vista";
import { markSeen } from "@/lib/seen";
import { embedUrl, platformLabel } from "@/lib/video";
import { budgetFor, setWatching } from "@/lib/watch-xp";

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
  durationSeconds,
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
  durationSeconds?: number | null;
  countView?: boolean;
}) {
  const [host, setHost] = useState<string | null>(null);

  // Once playing, the video earns watch-time XP for about its own length (src/lib/watch-xp.ts).
  useEffect(() => {
    if (!host) return;
    setWatching(true, budgetFor(durationSeconds));
    return () => setWatching(false);
  }, [host, durationSeconds]);

  function play() {
    setHost(window.location.hostname);
    if (clipId) markSeen(clipId);
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
          {thumbnailUrl ? <img src={thumbnailUrl} alt="" referrerPolicy="no-referrer" /> : <Vista seed={shortId} />}
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
