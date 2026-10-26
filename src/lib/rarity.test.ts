import { describe, expect, it } from "vitest";
import { rarityClass, rarityFor } from "./rarity";

describe("rarityFor", () => {
  it("maps views to title colors", () => {
    expect(rarityFor(0).key).toBe("common");
    expect(rarityFor(49).key).toBe("common");
    expect(rarityFor(50).key).toBe("uncommon");
    expect(rarityFor(200).key).toBe("rare");
    expect(rarityFor(750).key).toBe("epic");
    expect(rarityFor(2500).key).toBe("legendary");
    expect(rarityFor(1_000_000).key).toBe("legendary");
  });
  it("handles missing values", () => {
    expect(rarityFor(null).key).toBe("common");
    expect(rarityFor(undefined).key).toBe("common");
    expect(rarityFor(-5).key).toBe("common");
  });
  it("builds a class name", () => {
    expect(rarityClass(800)).toBe("rarity-epic");
  });
});
