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

// What each spec does, for the class picker: its job in a group and one line on how it plays.
export const SPEC_INFO: Record<string, Record<string, { role: string; line: string }>> = {
  Druid: {
    Balance: { role: "Caster DPS", line: "Moonfire and Starfire, with buffs the party keeps." },
    Feral: { role: "Tank / Melee", line: "Cat and bear forms. One tree for both jobs." },
    Restoration: { role: "Healer", line: "Heals over time, Innervate, and raid-wide utility." },
  },
  Hunter: {
    "Beast Mastery": { role: "Ranged DPS", line: "The pet does the work. You keep it alive and angry." },
    Marksmanship: { role: "Ranged DPS", line: "Aimed Shot, Trueshot Aura, burst from range." },
    Survival: { role: "Ranged DPS", line: "Traps, control, and tools for when they close in." },
  },
  Mage: {
    Arcane: { role: "Caster DPS", line: "Mana-hungry burst and the best utility tree." },
    Fire: { role: "Caster DPS", line: "Scorch, Fireball, and everything that scales off crit." },
    Frost: { role: "Caster DPS", line: "Control, kiting and survival. The PvP tree." },
  },
  Paladin: {
    Holy: { role: "Healer", line: "Big single-target heals, blessings and auras." },
    Protection: { role: "Tank", line: "Righteous Fury threat and shield-based mitigation." },
    Retribution: { role: "Melee DPS", line: "Seals, judgements and a two-handed weapon." },
  },
  Priest: {
    Discipline: { role: "Healer", line: "Shields and damage prevention over raw healing." },
    Holy: { role: "Healer", line: "The most healing in the game, and group tools with it." },
    Shadow: { role: "Caster DPS", line: "Damage over time, self-sustain, and PvP pressure." },
  },
  Rogue: {
    Assassination: { role: "Melee DPS", line: "Poisons and finishers from the dagger tree." },
    Combat: { role: "Melee DPS", line: "Sustained damage and weapon flexibility." },
    Subtlety: { role: "Melee DPS", line: "Stealth, openers and the pressure tree for duels." },
  },
  Shaman: {
    Elemental: { role: "Caster DPS", line: "Lightning damage and the totems that come with it." },
    Enhancement: { role: "Melee DPS", line: "Windfury bursts and close-range weapon work." },
    Restoration: { role: "Healer", line: "Chain Heal and the totem kit nobody else brings." },
  },
  Warlock: {
    Affliction: { role: "Caster DPS", line: "Curses and drains. Damage that builds over a fight." },
    Demonology: { role: "Caster DPS", line: "Stronger demons and the staying power to use them." },
    Destruction: { role: "Caster DPS", line: "Shadow Bolt and direct damage, front-loaded." },
  },
  Warrior: {
    Arms: { role: "Melee DPS", line: "Two-handed burst built around Mortal Strike." },
    Fury: { role: "Melee DPS", line: "Dual wielding and rage. The highest ceiling." },
    Protection: { role: "Tank", line: "Shield tanking and threat. The raid's main tank." },
  },
};

// The class's emblem, shown in the class picker.
export function classIcon(className: string): string {
  return `/classes/${className.toLowerCase()}.webp`;
}
