import { describe, expect, it } from "vitest";
import { contestPhase } from "./contests";

const contest = {
  opens_at: "2026-12-09T23:00:00Z",
  closes_at: "2026-12-20T04:59:00Z",
  ends_at: "2026-12-23T04:59:00Z",
};

describe("contestPhase", () => {
  it("walks through each phase", () => {
    expect(contestPhase(contest, new Date("2026-12-01T00:00:00Z"))).toBe("upcoming");
    expect(contestPhase(contest, new Date("2026-12-10T00:00:00Z"))).toBe("open");
    expect(contestPhase(contest, new Date("2026-12-21T00:00:00Z"))).toBe("voting");
    expect(contestPhase(contest, new Date("2026-12-24T00:00:00Z"))).toBe("ended");
  });
});
