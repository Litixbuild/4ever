// Title colors work like item quality in the classic game.
// The more people watch a video on 4Ever, the rarer its title color.
// Tier names are only used in code; the site never prints them.
// "Views" are plays started on 4Ever, counted once per person per day.

export const RARITY_TIERS = [
  { key: "legendary", minViews: 2500, color: "#ff9a3d" },
  { key: "epic", minViews: 750, color: "#c084fc" },
  { key: "rare", minViews: 200, color: "#60a5fa" },
  { key: "uncommon", minViews: 50, color: "#4ade80" },
  { key: "common", minViews: 0, color: "#f1e9da" },
] as const;

export type RarityKey = (typeof RARITY_TIERS)[number]["key"];

export function rarityFor(views: number | null | undefined): (typeof RARITY_TIERS)[number] {
  const count = Math.max(0, Number(views) || 0);
  return RARITY_TIERS.find((tier) => count >= tier.minViews) ?? RARITY_TIERS[RARITY_TIERS.length - 1];
}

export function rarityClass(views: number | null | undefined): string {
  return `rarity-${rarityFor(views).key}`;
}
