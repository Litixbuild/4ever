import { describe, expect, it } from "vitest";
import { DAILY_XP_CAP, MAX_RANK, RANK_START, minutesForRank, rankName, rankProgress } from "./ranks";

describe("ranks", () => {
  it("starts everyone at rank 1 with an empty bar", () => {
    const p = rankProgress(0, "horde");
    expect(p).toMatchObject({ rank: 1, name: "Scout", percent: 0, into: 0, needed: 30, maxed: false });
  });

  it("moves up a rank exactly at the threshold", () => {
    expect(rankProgress(29, "alliance").rank).toBe(1);
    expect(rankProgress(30, "alliance")).toMatchObject({ rank: 2, name: "Corporal", into: 0 });
    expect(rankProgress(RANK_START[13], "horde")).toMatchObject({ rank: 14, name: "High Warlord", maxed: true });
  });

  it("gets harder every rank", () => {
    for (let r = 2; r < MAX_RANK; r++) expect(minutesForRank(r)).toBeGreaterThan(minutesForRank(r - 1));
    // The top rank takes weeks at the daily cap.
    expect(RANK_START[13] / DAILY_XP_CAP).toBeGreaterThan(14);
  });

  it("shows a percentage inside the current rank", () => {
    expect(rankProgress(15, "horde").percent).toBe(50);
    expect(rankProgress(99999, "alliance")).toMatchObject({ rank: 14, percent: 100, name: "Grand Marshal" });
  });

  it("uses a plain rank number without a faction", () => {
    expect(rankName(3, null)).toBe("Rank 3");
    expect(rankName(3, "horde")).toBe("Sergeant");
  });

  it("colors names like item quality", () => {
    expect(rankProgress(0, "horde").rarity).toBe("common");
    expect(rankProgress(RANK_START[12], "horde").rarity).toBe("legendary");
  });
});
