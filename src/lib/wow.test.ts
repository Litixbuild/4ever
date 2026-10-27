import { describe, expect, it } from "vitest";
import { bannerFor, CLASSES, classColor, factionName, raceFaction } from "@/lib/wow";

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
    expect(raceFaction(null)).toBeNull();
  });
});
