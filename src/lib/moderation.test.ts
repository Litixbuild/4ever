import { describe, expect, it } from "vitest";
import { titleNeedsReview } from "@/lib/moderation";

describe("titleNeedsReview", () => {
  it("flags crude titles, including dotted spellings and other languages", () => {
    expect(titleNeedsReview("SE..X..O SIN CONSENTIMIENDO")).toBe(true);
    expect(titleNeedsReview("da blya MainfinityTV")).toBe(true);
    expect(titleNeedsReview("this is fucking insane")).toBe(true);
    expect(titleNeedsReview("s.e.x appeal")).toBe(true);
  });
  it("leaves ordinary titles alone", () => {
    expect(titleNeedsReview("INSANE MID-AIR KILL WITH SKYBORNE RACIAL")).toBe(false);
    expect(titleNeedsReview("Classic Era Petition")).toBe(false);
    expect(titleNeedsReview("Cockatrice farming in Wetlands")).toBe(false);
    expect(titleNeedsReview("Scunthorpe raid night")).toBe(false);
    expect(titleNeedsReview("Shadow Priest essex meetup")).toBe(false);
  });
});
