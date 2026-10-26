import { describe, expect, it } from "vitest";
import {
  cleanSearch,
  formatCount,
  formatDuration,
  normalizeUsername,
  parseIsoDuration,
  parseTags,
  parseTwitchDuration,
  safeNextPath,
  timeAgo,
} from "./format";

describe("durations", () => {
  it("reads YouTube durations", () => {
    expect(parseIsoDuration("PT3M42S")).toBe(222);
    expect(parseIsoDuration("PT1H2M3S")).toBe(3723);
    expect(parseIsoDuration("PT45S")).toBe(45);
    expect(parseIsoDuration("P0D")).toBeNull();
    expect(parseIsoDuration("nonsense")).toBeNull();
  });
  it("reads Twitch durations", () => {
    expect(parseTwitchDuration("3m42s")).toBe(222);
    expect(parseTwitchDuration("1h2m3s")).toBe(3723);
    expect(parseTwitchDuration("")).toBeNull();
  });
  it("formats durations", () => {
    expect(formatDuration(222)).toBe("3:42");
    expect(formatDuration(3723)).toBe("1:02:03");
    expect(formatDuration(5)).toBe("0:05");
    expect(formatDuration(null)).toBe("");
  });
});

describe("formatCount", () => {
  it("adds separators and shortens big numbers", () => {
    expect(formatCount(0)).toBe("0");
    expect(formatCount(1284)).toBe("1,284");
    expect(formatCount(12400)).toBe("12.4K");
    expect(formatCount(250000)).toBe("250K");
    expect(formatCount(1_500_000)).toBe("1.5M");
  });
});

describe("timeAgo", () => {
  const now = new Date("2026-11-10T12:00:00Z");
  it("describes recent times", () => {
    expect(timeAgo("2026-11-10T11:59:50Z", now)).toBe("Just now");
    expect(timeAgo("2026-11-10T11:55:00Z", now)).toBe("5 minutes ago");
    expect(timeAgo("2026-11-10T10:00:00Z", now)).toBe("2 hours ago");
    expect(timeAgo("2026-11-09T12:00:00Z", now)).toBe("Yesterday");
    expect(timeAgo("2026-11-07T12:00:00Z", now)).toBe("3 days ago");
  });
});

describe("parseTags", () => {
  it("cleans, dedupes and caps tags", () => {
    expect(parseTags("Rogue, #Hillsbrad  outnumbered,rogue")).toEqual(["rogue", "hillsbrad", "outnumbered"]);
    expect(parseTags("a, b, c")).toEqual([]);
    expect(parseTags("one two three four five six")).toHaveLength(5);
    expect(parseTags("<script>")).toEqual(["script"]);
  });
});

describe("normalizeUsername", () => {
  it("accepts simple names and lowercases them", () => {
    expect(normalizeUsername("Velrisk")).toBe("velrisk");
    expect(normalizeUsername("gank_master_99")).toBe("gank_master_99");
  });
  it("rejects bad names", () => {
    expect(normalizeUsername("ab")).toBeNull();
    expect(normalizeUsername("has space")).toBeNull();
    expect(normalizeUsername("emoji🙂")).toBeNull();
  });
});

describe("safeNextPath", () => {
  it("only allows paths on this site", () => {
    expect(safeNextPath("/submit")).toBe("/submit");
    expect(safeNextPath("https://evil.com")).toBe("/");
    expect(safeNextPath("//evil.com")).toBe("/");
    expect(safeNextPath("/\\evil.com")).toBe("/");
    expect(safeNextPath(null, "/settings")).toBe("/settings");
  });
});

describe("cleanSearch", () => {
  it("strips characters that would break a filter", () => {
    expect(cleanSearch("tarren mill, (dusk)")).toBe("tarren mill dusk");
    expect(cleanSearch("%_*")).toBe("");
    expect(cleanSearch("Mind-Control off the ledge")).toBe("Mind-Control off the ledge");
  });
});
