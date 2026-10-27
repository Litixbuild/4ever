import { describe, expect, it } from "vitest";
import { pickEnabled, providerList } from "@/lib/auth-providers";

describe("pickEnabled", () => {
  it("keeps only the providers switched on in Supabase", () => {
    const settings = { external: { discord: true, twitch: false, google: false, email: true, github: true } };
    expect(pickEnabled(settings)).toEqual(["discord"]);
  });

  it("keeps our display order", () => {
    expect(pickEnabled({ external: { google: true, discord: true, twitch: true } })).toEqual([
      "discord",
      "twitch",
      "google",
    ]);
  });

  it("returns nothing when no provider is on", () => {
    expect(pickEnabled({ external: { email: true } })).toEqual([]);
  });

  it("falls back to every option when the response looks wrong", () => {
    expect(pickEnabled(null)).toEqual(["discord", "twitch", "google"]);
    expect(pickEnabled({})).toEqual(["discord", "twitch", "google"]);
    expect(pickEnabled({ external: "nope" })).toEqual(["discord", "twitch", "google"]);
  });
});

describe("providerList", () => {
  it("joins names the way people say them", () => {
    expect(providerList([])).toBe("");
    expect(providerList(["discord"])).toBe("Discord");
    expect(providerList(["twitch", "discord"])).toBe("Discord or Twitch");
    expect(providerList(["discord", "twitch", "google"])).toBe("Discord, Twitch or Google");
  });
});
