import { describe, expect, it } from "vitest";
import { guessCategory, isWowForever, looksEnglish, looksLikeReposter, looksLikeSpam } from "@/lib/clip-match";

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
    expect(isWowForever("iPhone duo #wow #iphone #nice #forever #shorts")).toBe(false);
    expect(isWowForever("Hunter's a TERROR in WoW Forever!")).toBe(true);
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
    expect(looksLikeSpam("WoW Forever Just REMOVED Lava Burst")).toBe(true);
    expect(looksLikeSpam("Blizzard Announces WoW Forever: Same Same, But Different")).toBe(true);
    expect(looksLikeSpam("3 Macros Every Player Needs in WoW Forever")).toBe(true);
    expect(looksLikeSpam("Warlock Pets Cut From 7.5 to 2: WoW Forever Voidwalker")).toBe(true);
    expect(looksLikeSpam("WoW Forever BIGGEST Problem…")).toBe(true);
    expect(looksLikeSpam("Respeccing Legacy Points in WoW Forever")).toBe(true);
    expect(looksLikeSpam("Thought two gnolls at once was still an easy fight #WoWForever")).toBe(false);
    expect(looksLikeSpam("This Duel Was Absolute Cinema | $100K WoW Forever Dueling Tournament")).toBe(false);
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

describe("looksEnglish", () => {
  it("keeps English titles", () => {
    expect(looksEnglish("Hunter's a TERROR in WoW Forever!")).toBe(true);
    expect(looksEnglish("Mages Were MADE for AV.", "en-US")).toBe(true);
    expect(looksEnglish("HUGE W in Warsong Gulch")).toBe(true);
  });
  it("leaves out other languages", () => {
    expect(looksEnglish("Das war der beste Release EVER!!!")).toBe(false);
    expect(looksEnglish("Проиграл меч… Тойоте Камри")).toBe(false);
    expect(looksEnglish("Jagódki Nadina SĄ WSZĘDZIE w WoW Forever")).toBe(false);
    expect(looksEnglish("Una TÍPICA historia en WoW forever")).toBe(false);
    expect(looksEnglish("Kein Stress in WoW Forever")).toBe(false);
    expect(looksEnglish("WoW Forever clip", "de")).toBe(false);
  });
});
