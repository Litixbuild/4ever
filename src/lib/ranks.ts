// Watch-time ranks, modeled on the original game's PvP honor ranks.
// One minute of watching = 1 XP. Each rank takes about 45% longer to fill than the one before,
// so the early ranks come quickly and the top ones take weeks.

export type Faction = "horde" | "alliance";

export const ALLIANCE_RANKS = [
  "Private",
  "Corporal",
  "Sergeant",
  "Master Sergeant",
  "Sergeant Major",
  "Knight",
  "Knight-Lieutenant",
  "Knight-Captain",
  "Knight-Champion",
  "Lieutenant Commander",
  "Commander",
  "Marshal",
  "Field Marshal",
  "Grand Marshal",
] as const;

export const HORDE_RANKS = [
  "Scout",
  "Grunt",
  "Sergeant",
  "Senior Sergeant",
  "First Sergeant",
  "Stone Guard",
  "Blood Guard",
  "Legionnaire",
  "Centurion",
  "Champion",
  "Lieutenant General",
  "General",
  "Warlord",
  "High Warlord",
] as const;

export const MAX_RANK = 14;

// Most XP (minutes) a person can earn in one day. Keeps a tab left open overnight from maxing a rank.
export const DAILY_XP_CAP = 180;

// Minutes needed to go from rank r to rank r + 1.
export function minutesForRank(rank: number): number {
  return Math.round(10 * 1.45 ** (rank - 1));
}

// XP at which each rank starts: RANK_START[0] is rank 1 (0 XP).
export const RANK_START: number[] = (() => {
  const starts = [0];
  for (let rank = 1; rank < MAX_RANK; rank++) starts.push(starts[rank - 1] + minutesForRank(rank));
  return starts;
})();

// Name colors climb like item quality: white, green, blue, purple, then orange for the top two.
// The keys match the .rarity-* classes in globals.css.
export function rankRarity(rank: number): "common" | "uncommon" | "rare" | "epic" | "legendary" {
  if (rank >= 13) return "legendary";
  if (rank >= 10) return "epic";
  if (rank >= 7) return "rare";
  if (rank >= 4) return "uncommon";
  return "common";
}

export function rankName(rank: number, faction: Faction | null | undefined): string {
  const list = faction === "horde" ? HORDE_RANKS : faction === "alliance" ? ALLIANCE_RANKS : null;
  return list ? list[rank - 1] : `Rank ${rank}`;
}

export type RankProgress = {
  rank: number;
  name: string;
  rarity: ReturnType<typeof rankRarity>;
  // XP earned inside the current rank, and what this rank needs in total.
  into: number;
  needed: number;
  // 0 to 100. Always 100 at the top rank.
  percent: number;
  maxed: boolean;
};

export function rankProgress(xp: number | null | undefined, faction: Faction | null | undefined): RankProgress {
  const total = Math.max(0, Math.floor(Number(xp) || 0));
  let rank = 1;
  while (rank < MAX_RANK && total >= RANK_START[rank]) rank++;
  const maxed = rank === MAX_RANK;
  const needed = maxed ? 0 : minutesForRank(rank);
  const into = total - RANK_START[rank - 1];
  const percent = maxed ? 100 : Math.min(100, Math.floor((into / needed) * 100));
  return { rank, name: rankName(rank, faction), rarity: rankRarity(rank), into, needed, percent, maxed };
}
