import { describe, expect, it } from "vitest";
import { bannerFor, CLASSES, classColor, factionName, raceFaction, specsFor } from "@/lib/wow";

describe("classColor", () => {
  it("knows the classes, in any case", () => {
    expect(classColor("Rogue")).toBe("#fff569");
    expect(classColor(" mage ")).toBe("#69ccf0");
  });
  it("returns null for anything else", () => {
    expect(classColor("Bard")).toBeNull();
    expect(classColor(null)).toBeNull();
  });
});

describe("factions", () => {
  it("names and banners", () => {
    expect(factionName("horde")).toBe("Horde");
    expect(factionName(null)).toBeNull();
    expect(bannerFor("alliance")).toContain("alliance");
    expect(bannerFor(null)).toContain("neutral");
  });
});

describe("races and classes", () => {
  it("every class has a color", () => {
    for (const c of CLASSES) expect(classColor(c)).toMatch(/^#/);
  });
  it("reads a race's faction", () => {
    expect(raceFaction("Undead")).toBe("horde");
    expect(raceFaction("night elf")).toBe("alliance");
    expect(raceFaction("Pandaren")).toBeNull();
    expect(raceFaction("Skyborne")).toBeNull();
    expect(raceFaction(null)).toBeNull();
  });
});

describe("specs", () => {
  it("lists each class's specs, in any case", () => {
    expect(specsFor("Priest")).toContain("Shadow");
    expect(specsFor(" hunter ")).toContain("Marksmanship");
    expect(specsFor("Bard")).toEqual([]);
    expect(specsFor(null)).toEqual([]);
  });
});
