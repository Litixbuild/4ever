import { describe, expect, it } from "vitest";
import { canonicalUrl, embedUrl, parseVideoUrl } from "./video";

describe("parseVideoUrl", () => {
  it.each([
    ["https://www.youtube.com/watch?v=dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://youtube.com/watch?v=dQw4w9WgXcQ&t=42s", "dQw4w9WgXcQ"],
    ["https://m.youtube.com/watch?v=dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://youtu.be/dQw4w9WgXcQ?si=abc", "dQw4w9WgXcQ"],
    ["youtu.be/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://www.youtube.com/shorts/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://www.youtube.com/embed/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://www.youtube.com/live/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["  https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ  ", "dQw4w9WgXcQ"],
  ])("reads YouTube link %s", (input, id) => {
    expect(parseVideoUrl(input)).toEqual({ platform: "youtube", sourceType: "youtube_video", id });
  });

  it.each([
    ["https://clips.twitch.tv/CleverFunnyBearKappa-AbC123xyz", "CleverFunnyBearKappa-AbC123xyz"],
    ["https://www.twitch.tv/somestreamer/clip/CleverFunnyBearKappa-AbC123xyz", "CleverFunnyBearKappa-AbC123xyz"],
    ["https://m.twitch.tv/somestreamer/clip/CleverFunnyBearKappa-AbC123xyz?tt=1", "CleverFunnyBearKappa-AbC123xyz"],
    ["https://clips.twitch.tv/embed?clip=CleverFunnyBearKappa&parent=x.com", "CleverFunnyBearKappa"],
  ])("reads Twitch clip link %s", (input, id) => {
    expect(parseVideoUrl(input)).toEqual({ platform: "twitch", sourceType: "twitch_clip", id });
  });

  it.each([
    ["https://www.twitch.tv/videos/2283745521", "2283745521"],
    ["twitch.tv/videos/2283745521?t=1h2m", "2283745521"],
    ["https://player.twitch.tv/?video=v2283745521&parent=x.com", "2283745521"],
  ])("reads Twitch video link %s", (input, id) => {
    expect(parseVideoUrl(input)).toEqual({ platform: "twitch", sourceType: "twitch_video", id });
  });

  it.each([
    "",
    "not a link",
    "https://www.youtube.com/watch?v=short",
    "https://www.youtube.com/@somechannel",
    "https://www.twitch.tv/somestreamer",
    "https://streamable.com/abc123",
    "https://evil.example.com/watch?v=dQw4w9WgXcQ",
    "javascript:alert(1)",
  ])("rejects %s", (input) => {
    expect(parseVideoUrl(input)).toBeNull();
  });
});

describe("canonicalUrl", () => {
  it("builds clean source links", () => {
    expect(canonicalUrl({ platform: "youtube", sourceType: "youtube_video", id: "dQw4w9WgXcQ" })).toBe(
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    );
    expect(canonicalUrl({ platform: "twitch", sourceType: "twitch_clip", id: "Abc" })).toBe(
      "https://clips.twitch.tv/Abc",
    );
    expect(canonicalUrl({ platform: "twitch", sourceType: "twitch_video", id: "123456" })).toBe(
      "https://www.twitch.tv/videos/123456",
    );
  });
});

describe("embedUrl", () => {
  it("uses YouTube privacy mode", () => {
    expect(embedUrl("youtube_video", "dQw4w9WgXcQ", "4everclips.com")).toContain("youtube-nocookie.com/embed/dQw4w9WgXcQ");
  });
  it("passes the parent host to Twitch", () => {
    expect(embedUrl("twitch_clip", "Abc", "4everclips.com")).toContain("parent=4everclips.com");
    expect(embedUrl("twitch_video", "123456", "localhost")).toContain("video=123456&parent=localhost");
  });
});
