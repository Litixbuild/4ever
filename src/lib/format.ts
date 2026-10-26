import { site } from "./site";

// "PT1H2M3S" (YouTube) -> 3723
export function parseIsoDuration(value: string | null | undefined): number | null {
  if (!value) return null;
  const match = /^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?$/.exec(value);
  if (!match) return null;
  const [, d, h, m, s] = match;
  const total = Number(d ?? 0) * 86400 + Number(h ?? 0) * 3600 + Number(m ?? 0) * 60 + Math.round(Number(s ?? 0));
  return Number.isFinite(total) && total > 0 ? total : null;
}

// "1h2m3s" (Twitch) -> 3723
export function parseTwitchDuration(value: string | null | undefined): number | null {
  if (!value) return null;
  const match = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/.exec(value.trim());
  if (!match || value.trim() === "") return null;
  const [, h, m, s] = match;
  const total = Number(h ?? 0) * 3600 + Number(m ?? 0) * 60 + Number(s ?? 0);
  return total > 0 ? total : null;
}

// 222 -> "3:42", 3723 -> "1:02:03"
export function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null || !Number.isFinite(seconds) || seconds <= 0) return "";
  const total = Math.round(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}

const numberFormat = new Intl.NumberFormat("en-US");

// 1284 -> "1,284"; 12400 -> "12.4K"
export function formatCount(value: number | null | undefined): string {
  const n = Math.max(0, Number(value) || 0);
  if (n < 10000) return numberFormat.format(n);
  if (n < 1_000_000) return `${(n / 1000).toFixed(n < 100000 ? 1 : 0).replace(/\.0$/, "")}K`;
  return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
}

export function plural(count: number, one: string, many = `${one}s`): string {
  return `${formatCount(count)} ${count === 1 ? one : many}`;
}

// "5 minutes ago", "Yesterday", "Nov 6"
export function timeAgo(date: string | Date, now: Date = new Date()): string {
  const then = typeof date === "string" ? new Date(date) : date;
  const seconds = Math.round((now.getTime() - then.getTime()) / 1000);
  if (seconds < 45) return "Just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return formatDate(then);
}

// "Nov 6, 2026" (year left off when it's the current year)
export function formatDate(date: string | Date, now: Date = new Date()): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const sameYear =
    new Intl.DateTimeFormat("en-US", { year: "numeric", timeZone: site.timeZone }).format(d) ===
    new Intl.DateTimeFormat("en-US", { year: "numeric", timeZone: site.timeZone }).format(now);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
    timeZone: site.timeZone,
  }).format(d);
}

// "Dec 9, 6:00 PM ET"
export function formatDateTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const text = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: site.timeZone,
  }).format(d);
  return `${text} ${site.timeZoneLabel}`;
}

// For calendar tiles: { month: "DEC", day: "09" }
export function dateTile(date: string | Date): { month: string; day: string } {
  const d = typeof date === "string" ? new Date(date) : date;
  const month = new Intl.DateTimeFormat("en-US", { month: "short", timeZone: site.timeZone })
    .format(d)
    .toUpperCase();
  const day = new Intl.DateTimeFormat("en-US", { day: "2-digit", timeZone: site.timeZone }).format(d);
  return { month, day };
}

// Tags: lowercase letters, numbers and dashes, at most 5, each up to 24 characters.
export function parseTags(input: string): string[] {
  const tags = input
    .split(/[,#\s]+/)
    .map((tag) =>
      tag
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "")
        .replace(/^-+|-+$/g, "")
        .slice(0, 24),
    )
    .filter((tag) => tag.length >= 2);
  return Array.from(new Set(tags)).slice(0, 5);
}

// Usernames: lowercase letters, numbers and underscores, 3 to 24 characters.
export function normalizeUsername(input: string): string | null {
  const value = input.trim().toLowerCase();
  return /^[a-z0-9_]{3,24}$/.test(value) ? value : null;
}

// Only allow redirects back into this site (never to another domain).
export function safeNextPath(value: string | null | undefined, fallback = "/"): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  return value;
}

// Search text that is safe to drop into a database filter.
export function cleanSearch(value: string | null | undefined): string {
  return (value ?? "")
    .replace(/[^\p{L}\p{N}\s'-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);
}
