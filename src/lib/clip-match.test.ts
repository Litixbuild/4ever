import { describe, expect, it } from "vitest";
import { guessCategory, isWowForever, looksLikeReposter, looksLikeSpam } from "@/lib/clip-match";

describe("isWowForever", () => {
  it("accepts titles, hashtags and tags that name WoW Forever", () => {
    expect(isWowForever("Rogue 1v3 in WoW Forever")).toBe(true);
    expect(isWowForever("insane gank #wowforever #shorts")).toBe(true);
    expect(isWowForever("Tarren Mill chaos", "World of Warcraft Forever, day 2")).toBe(true);
    expect(isWowForever("Tarren Mill chaos", "", ["WoW_Forever"])).toBe(true);
  });
  it("turns down other games and plain 'forever'", () => {
    expect(isWowForever("Forever young cover")).toBe(false);
    expect(isWowForever("WoW Classic hardcore death")).toBe(false);
    expect(isWowForever("Minecraft forever world #shorts")).toBe(false);
  });
});

describe("looksLikeSpam", () => {
  it("catches selling and boosting", () => {
    expect(looksLikeSpam("Cheap WoW Forever gold for sale")).toBe(true);
    expect(looksLikeSpam("Deadmines boost run WoW Forever")).toBe(true);
    expect(looksLikeSpam("Warrior one-shots a mage")).toBe(false);
  });
  it("leaves out news, guides and launch-time videos", () => {
    expect(looksLikeSpam("WoW Forever PvP Tier List Prediction")).toBe(true);
    expect(looksLikeSpam("WoW Forever Launch Time in Every Time Zone (Nov 4)")).toBe(true);
    expect(looksLikeSpam("PvP or PVE Server? WoW Forever")).toBe(true);
    expect(looksLikeSpam("WoW Forever Guild Ganking in STV #wowforever")).toBe(false);
  });
});

describe("looksLikeReposter", () => {
  it("flags clip collections, not players", () => {
    expect(looksLikeReposter("Wow Clipz")).toBe(true);
    expect(looksLikeReposter("WoW Forever Feed")).toBe(true);
    expect(looksLikeReposter("WoWForeverReplays")).toBe(true);
    expect(looksLikeReposter("Best Of Payo")).toBe(true);
    expect(looksLikeReposter("Azeroth Moments")).toBe(true);
    expect(looksLikeReposter("Esfand")).toBe(false);
    expect(looksLikeReposter("Pull & Pray")).toBe(false);
  });
});

describe("guessCategory", () => {
  it("sorts by what the title says", () => {
    expect(guessCategory("Warsong flag cap #wowforever")).toBe("battlegrounds");
    expect(guessCategory("Molten Core wipe WoW Forever")).toBe("raids-dungeons");
    expect(guessCategory("Rogue vs mage duel")).toBe("duels");
    expect(guessCategory("Ganked at Tarren Mill")).toBe("world-pvp");
    expect(guessCategory("biggest fail 😂")).toBe("funny");
    expect(guessCategory("Ding 60!")).toBe("leveling");
    expect(guessCategory("Look at this view")).toBe("other");
  });
});
