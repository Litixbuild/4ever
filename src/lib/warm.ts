"use client";

// Makes videos start faster. YouTube and Twitch players load from their own servers, and much of the
// wait after pressing play is the browser connecting to those servers from scratch. When someone shows
// intent (hovers or touches a video, opens a video page, or a clip is next in the feed), we open those
// connections early. Nothing is downloaded and no cookies are sent until play is pressed; browsers drop
// unused connections after about 10 seconds, so they're reopened when they may have gone stale.

const ORIGINS: Record<string, string[]> = {
  youtube: ["https://www.youtube-nocookie.com", "https://www.youtube.com", "https://i.ytimg.com"],
  twitch: [
    "https://clips.twitch.tv",
    "https://player.twitch.tv",
    "https://static.twitchcdn.net",
    "https://gql.twitch.tv",
  ],
};

const lastWarmed = new Map<string, { at: number; link: HTMLLinkElement }>();
const STALE_MS = 8000;

export function warmPlatform(platform: string) {
  if (typeof document === "undefined") return;
  const now = Date.now();
  for (const origin of ORIGINS[platform] ?? []) {
    const prev = lastWarmed.get(origin);
    if (prev && now - prev.at < STALE_MS) continue;
    prev?.link.remove();
    const link = document.createElement("link");
    link.rel = "preconnect";
    link.href = origin;
    link.crossOrigin = "anonymous";
    document.head.appendChild(link);
    lastWarmed.set(origin, { at: now, link });
  }
}
