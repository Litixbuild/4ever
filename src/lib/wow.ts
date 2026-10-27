// Little bits of the game's own look, used to dress up profiles.

// Class colors, as the game shows them in raid frames and chat.
const CLASS_COLORS: Record<string, string> = {
  druid: "#ff7d0a",
  hunter: "#abd473",
  mage: "#69ccf0",
  paladin: "#f58cba",
  priest: "#ffffff",
  rogue: "#fff569",
  shaman: "#2b8cff",
  warlock: "#9482c9",
  warrior: "#c79c6e",
};

export function classColor(className: string | null | undefined): string | null {
  if (!className) return null;
  return CLASS_COLORS[className.trim().toLowerCase()] ?? null;
}

// The races and classes a character can be, in the order the character screen lists them.
export const RACES = [
  { name: "Human", faction: "alliance" },
  { name: "Dwarf", faction: "alliance" },
  { name: "Night Elf", faction: "alliance" },
  { name: "Gnome", faction: "alliance" },
  { name: "Orc", faction: "horde" },
  { name: "Undead", faction: "horde" },
  { name: "Tauren", faction: "horde" },
  { name: "Troll", faction: "horde" },
  // New in Forever, and playable on both sides.
  { name: "Skyborne", faction: null },
] as const;

// Forever has no realms: each ruleset is one mega-realm per region.
export const RULESETS = ["PvP", "PvE", "RP-PvP", "Hardcore"] as const;

// Each class's specs (talent trees), as people say them: "Shadow Priest", "Marksmanship Hunter".
export const SPECS: Record<string, readonly string[]> = {
  Druid: ["Balance", "Feral", "Restoration"],
  Hunter: ["Beast Mastery", "Marksmanship", "Survival"],
  Mage: ["Arcane", "Fire", "Frost"],
  Paladin: ["Holy", "Protection", "Retribution"],
  Priest: ["Discipline", "Holy", "Shadow"],
  Rogue: ["Assassination", "Combat", "Subtlety"],
  Shaman: ["Elemental", "Enhancement", "Restoration"],
  Warlock: ["Affliction", "Demonology", "Destruction"],
  Warrior: ["Arms", "Fury", "Protection"],
};

export function specsFor(className: string | null | undefined): readonly string[] {
  const key = Object.keys(SPECS).find((c) => c.toLowerCase() === className?.trim().toLowerCase());
  return key ? SPECS[key] : [];
}

export const CLASSES = [
  "Druid",
  "Hunter",
  "Mage",
  "Paladin",
  "Priest",
  "Rogue",
  "Shaman",
  "Warlock",
  "Warrior",
] as const;

export function raceFaction(race: string | null | undefined): "horde" | "alliance" | null {
  const key = race?.trim().toLowerCase();
  return RACES.find((r) => r.name.toLowerCase() === key)?.faction ?? null;
}

export function factionName(faction: string | null | undefined): "Horde" | "Alliance" | null {
  return faction === "horde" ? "Horde" : faction === "alliance" ? "Alliance" : null;
}

export function factionColor(faction: string | null | undefined): string {
  return faction === "horde" ? "#ff6b5e" : faction === "alliance" ? "#6fa8ff" : "var(--text-3)";
}

// Profile banner art: the Horde city for the Horde, the Alliance keep for the Alliance, the space between for everyone else.
export function bannerFor(faction: string | null | undefined): string {
  return faction === "horde"
    ? "/backdrop/banner-horde.webp"
    : faction === "alliance"
      ? "/backdrop/banner-alliance.webp"
      : "/backdrop/banner-neutral.webp";
}
