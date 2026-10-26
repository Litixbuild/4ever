// Recognizes YouTube and Twitch links and pulls out the video id.

export type VideoRef =
  | { platform: "youtube"; sourceType: "youtube_video"; id: string }
  | { platform: "twitch"; sourceType: "twitch_clip"; id: string }
  | { platform: "twitch"; sourceType: "twitch_video"; id: string };

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const TWITCH_CLIP_SLUG = /^[A-Za-z0-9_-]{3,120}$/;
const TWITCH_VIDEO_ID = /^\d{5,20}$/;

const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
]);

const TWITCH_HOSTS = new Set(["twitch.tv", "www.twitch.tv", "m.twitch.tv", "go.twitch.tv"]);

function toUrl(input: string): URL | null {
  const trimmed = input.trim();
  if (!trimmed || trimmed.length > 500) return null;
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    return new URL(withScheme);
  } catch {
    return null;
  }
}

export function parseVideoUrl(input: string): VideoRef | null {
  const url = toUrl(input);
  if (!url) return null;
  const host = url.hostname.toLowerCase();
  const parts = url.pathname.split("/").filter(Boolean);

  // youtu.be/ID
  if (host === "youtu.be" || host === "www.youtu.be") {
    const id = parts[0];
    return id && YOUTUBE_ID.test(id) ? { platform: "youtube", sourceType: "youtube_video", id } : null;
  }

  if (YOUTUBE_HOSTS.has(host)) {
    // youtube.com/watch?v=ID
    if (parts[0] === "watch") {
      const id = url.searchParams.get("v") ?? "";
      return YOUTUBE_ID.test(id) ? { platform: "youtube", sourceType: "youtube_video", id } : null;
    }
    // youtube.com/shorts/ID, /embed/ID, /live/ID, /v/ID
    if (["shorts", "embed", "live", "v"].includes(parts[0] ?? "")) {
      const id = parts[1] ?? "";
      return YOUTUBE_ID.test(id) ? { platform: "youtube", sourceType: "youtube_video", id } : null;
    }
    return null;
  }

  // clips.twitch.tv/SLUG or clips.twitch.tv/embed?clip=SLUG
  if (host === "clips.twitch.tv") {
    const slug = parts[0] === "embed" ? (url.searchParams.get("clip") ?? "") : (parts[0] ?? "");
    return TWITCH_CLIP_SLUG.test(slug) ? { platform: "twitch", sourceType: "twitch_clip", id: slug } : null;
  }

  // player.twitch.tv/?video=v123456
  if (host === "player.twitch.tv") {
    const video = (url.searchParams.get("video") ?? "").replace(/^v/i, "");
    if (TWITCH_VIDEO_ID.test(video)) return { platform: "twitch", sourceType: "twitch_video", id: video };
    const clip = url.searchParams.get("clip") ?? "";
    return TWITCH_CLIP_SLUG.test(clip) ? { platform: "twitch", sourceType: "twitch_clip", id: clip } : null;
  }

  if (TWITCH_HOSTS.has(host)) {
    // twitch.tv/videos/123456
    if (parts[0] === "videos") {
      const id = parts[1] ?? "";
      return TWITCH_VIDEO_ID.test(id) ? { platform: "twitch", sourceType: "twitch_video", id } : null;
    }
    // twitch.tv/CHANNEL/clip/SLUG
    if (parts[1] === "clip") {
      const slug = parts[2] ?? "";
      return TWITCH_CLIP_SLUG.test(slug) ? { platform: "twitch", sourceType: "twitch_clip", id: slug } : null;
    }
    // twitch.tv/CHANNEL/video/123456 (older links)
    if (parts[1] === "video" || parts[1] === "v") {
      const id = parts[2] ?? "";
      return TWITCH_VIDEO_ID.test(id) ? { platform: "twitch", sourceType: "twitch_video", id } : null;
    }
    return null;
  }

  return null;
}

export function canonicalUrl(ref: VideoRef): string {
  switch (ref.sourceType) {
    case "youtube_video":
      return `https://www.youtube.com/watch?v=${ref.id}`;
    case "twitch_clip":
      return `https://clips.twitch.tv/${ref.id}`;
    case "twitch_video":
      return `https://www.twitch.tv/videos/${ref.id}`;
  }
}

export function platformLabel(platform: string): string {
  return platform === "twitch" ? "Twitch" : "YouTube";
}

// Embeds load only after someone presses play.
// Twitch needs the site's own hostname passed as "parent".
export function embedUrl(sourceType: string, id: string, parentHost: string): string {
  const parent = encodeURIComponent(parentHost);
  switch (sourceType) {
    case "twitch_clip":
      return `https://clips.twitch.tv/embed?clip=${encodeURIComponent(id)}&parent=${parent}&autoplay=true`;
    case "twitch_video":
      return `https://player.twitch.tv/?video=${encodeURIComponent(id)}&parent=${parent}&autoplay=true`;
    default:
      return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0&modestbranding=1`;
  }
}
