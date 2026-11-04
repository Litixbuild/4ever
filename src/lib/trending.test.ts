import { describe, expect, it } from "vitest";
import { trendingScore } from "./queries";

describe("trending movies", () => {
  const now = Date.parse("2026-11-04T12:00:00Z");
  const at = (h: number) => new Date(now - h * 3_600_000).toISOString();
  it("favors fresh videos people are watching", () => {
    const fresh = trendingScore({ view_count: 20, vote_count: 2, published_at: at(3), player_made: false }, now);
    const old = trendingScore({ view_count: 60, vote_count: 2, published_at: at(24 * 10), player_made: false }, now);
    expect(fresh).toBeGreaterThan(old);
  });
  it("lifts Player-made movies", () => {
    const base = { view_count: 10, vote_count: 1, published_at: at(5) };
    expect(trendingScore({ ...base, player_made: true }, now)).toBeGreaterThan(
      trendingScore({ ...base, player_made: false }, now),
    );
  });
});
