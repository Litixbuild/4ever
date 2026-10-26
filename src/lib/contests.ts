import { formatDateTime } from "@/lib/format";
import type { Contest } from "@/lib/types";

export type ContestPhase = "upcoming" | "open" | "voting" | "ended";

export function contestPhase(contest: Pick<Contest, "opens_at" | "closes_at" | "ends_at">, now = new Date()): ContestPhase {
  const t = now.getTime();
  if (t < new Date(contest.opens_at).getTime()) return "upcoming";
  if (t < new Date(contest.closes_at).getTime()) return "open";
  if (t < new Date(contest.ends_at).getTime()) return "voting";
  return "ended";
}

export function contestStatusLine(contest: Contest, now = new Date()): string {
  switch (contestPhase(contest, now)) {
    case "upcoming":
      return `Opens ${formatDateTime(contest.opens_at)}`;
    case "open":
      return `Open now · entries close ${formatDateTime(contest.closes_at)}`;
    case "voting":
      return `Entries closed · voting until ${formatDateTime(contest.ends_at)}`;
    default:
      return `Ended ${formatDateTime(contest.ends_at)}`;
  }
}

// The date shown on the little calendar tile.
export function contestTileDate(contest: Contest, now = new Date()): string {
  const phase = contestPhase(contest, now);
  if (phase === "upcoming") return contest.opens_at;
  if (phase === "open") return contest.closes_at;
  return contest.ends_at;
}
