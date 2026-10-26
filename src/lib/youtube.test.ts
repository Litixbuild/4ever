import { describe, expect, it } from "vitest";
import { parseChannelInput } from "./youtube";

describe("parseChannelInput", () => {
  it("reads handles, links and ids", () => {
    expect(parseChannelInput("@velrisk")).toEqual({ by: "handle", value: "@velrisk" });
    expect(parseChannelInput("https://www.youtube.com/@velrisk")).toEqual({ by: "handle", value: "@velrisk" });
    expect(parseChannelInput("youtube.com/@velrisk/videos")).toEqual({ by: "handle", value: "@velrisk" });
    expect(parseChannelInput("https://www.youtube.com/channel/UC1234567890123456789012")).toEqual({
      by: "id",
      value: "UC1234567890123456789012",
    });
    expect(parseChannelInput("UC1234567890123456789012")).toEqual({ by: "id", value: "UC1234567890123456789012" });
    expect(parseChannelInput("https://www.youtube.com/user/OldName")).toEqual({ by: "username", value: "OldName" });
  });
  it("rejects other sites and junk", () => {
    expect(parseChannelInput("")).toBeNull();
    expect(parseChannelInput("https://twitch.tv/velrisk")).toBeNull();
    expect(parseChannelInput("https://www.youtube.com/c/SomeCustomName")).toBeNull();
  });
});
