// Achievements people can earn. Each one also unlocks a title they can show on their profile.

export const BADGES = [
  {
    key: "movie_of_the_week",
    name: "Movie of the Week",
    description: "Had a video picked for the front page",
    title: "{name}, Headliner",
    color: "#ff9a3d",
  },
  {
    key: "contest_winner",
    name: "Contest Winner",
    description: "Won a 4Ever contest",
    title: "{name}, Champion",
    color: "#ff9a3d",
  },
  {
    key: "founding_creator",
    name: "Founding Creator",
    description: "One of the first 50 creators on 4Ever",
    title: "{name}, Founder",
    color: "#c084fc",
  },
  {
    key: "verified_creator",
    name: "Verified Creator",
    description: "Proved they own their YouTube or Twitch channel",
    title: "{name}, Creator",
    color: "#60a5fa",
  },
  {
    key: "curator",
    name: "Curator",
    description: "Helps run 4Ever and pick what gets featured",
    title: "{name}, Curator",
    color: "#4ade80",
  },
] as const;

export type BadgeKey = (typeof BADGES)[number]["key"];

export function isBadgeKey(value: unknown): value is BadgeKey {
  return typeof value === "string" && BADGES.some((b) => b.key === value);
}

export function badgeInfo(key: string) {
  return BADGES.find((b) => b.key === key) ?? null;
}

export function titleFor(badgeKey: string | null | undefined, displayName: string): string | null {
  if (!badgeKey) return null;
  const badge = badgeInfo(badgeKey);
  return badge ? badge.title.replace("{name}", displayName) : null;
}
