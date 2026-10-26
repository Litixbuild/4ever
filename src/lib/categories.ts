export const CATEGORIES = [
  { value: "world-pvp", label: "World PvP" },
  { value: "battlegrounds", label: "Battlegrounds" },
  { value: "duels", label: "Duels" },
  { value: "raids-dungeons", label: "Raids & Dungeons" },
  { value: "machinima", label: "Machinima" },
  { value: "funny", label: "Funny" },
  { value: "lore", label: "Lore" },
  { value: "leveling", label: "Leveling" },
  { value: "other", label: "Other" },
] as const;

export type Category = (typeof CATEGORIES)[number]["value"];

export function isCategory(value: unknown): value is Category {
  return typeof value === "string" && CATEGORIES.some((c) => c.value === value);
}

export function categoryLabel(value: string): string {
  return CATEGORIES.find((c) => c.value === value)?.label ?? "Other";
}

export const KINDS = [
  { value: "movie", label: "Movie", plural: "Movies", hint: "An edited piece: cuts, music, a story." },
  { value: "clip", label: "Clip", plural: "Clips", hint: "A raw moment straight from a stream or recording." },
] as const;

export type Kind = (typeof KINDS)[number]["value"];

export function isKind(value: unknown): value is Kind {
  return value === "movie" || value === "clip";
}

export const MUSIC_SOURCES = [
  { value: "original", label: "Original music I made", note: "Safest" },
  { value: "game", label: "World of Warcraft soundtrack", note: "Allowed in fan videos" },
  { value: "licensed", label: "Royalty-free or licensed track", note: "Add a credit" },
  { value: "none", label: "No music, game audio only", note: "" },
] as const;

export type MusicSource = (typeof MUSIC_SOURCES)[number]["value"];

export function isMusicSource(value: unknown): value is MusicSource {
  return typeof value === "string" && MUSIC_SOURCES.some((m) => m.value === value);
}

export function musicLabel(value: string, credit: string | null): string {
  switch (value) {
    case "original":
      return "Original music by the creator";
    case "game":
      return "World of Warcraft soundtrack";
    case "licensed":
      return credit ? credit : "Licensed track";
    default:
      return "Game audio only";
  }
}
