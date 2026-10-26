import { describe, expect, it } from "vitest";
import { isoToLocalInput, localInputToIso } from "./time";

describe("Eastern time conversion", () => {
  it("converts winter times (EST, UTC-5)", () => {
    expect(localInputToIso("2026-12-09T18:00", "America/New_York")).toBe("2026-12-09T23:00:00.000Z");
    expect(isoToLocalInput("2026-11-04T23:00:00Z", "America/New_York")).toBe("2026-11-04T18:00");
  });
  it("converts summer times (EDT, UTC-4)", () => {
    expect(localInputToIso("2026-07-01T18:00", "America/New_York")).toBe("2026-07-01T22:00:00.000Z");
    expect(isoToLocalInput("2026-07-01T22:00:00Z", "America/New_York")).toBe("2026-07-01T18:00");
  });
  it("handles midnight", () => {
    expect(isoToLocalInput("2026-12-10T05:00:00Z", "America/New_York")).toBe("2026-12-10T00:00");
  });
  it("rejects junk", () => {
    expect(localInputToIso("tomorrow")).toBeNull();
  });
});
