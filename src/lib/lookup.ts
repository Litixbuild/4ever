// Looks up a YouTube or Twitch link and returns the real details from the platform.
// Server only. This is what makes credit trustworthy: the channel name always
// comes from YouTube or Twitch, never from what someone typed.
import { fetchTwitchClip, fetchTwitchVideo } from "@/lib/twitch";
import { canonicalUrl, parseVideoUrl, type VideoRef } from "@/lib/video";
import { fetchYouTubeVideo, LookupError } from "@/lib/youtube";

export { LookupError };

export type VideoMeta = {
  ref: VideoRef;
  sourceUrl: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
  channelId: string | null;
  channelName: string;
  channelUrl: string | null;
};

export async function lookupVideo(input: string): Promise<VideoMeta> {
  const ref = parseVideoUrl(input);
  if (!ref) {
    throw new LookupError("Paste a link to a YouTube video, a Twitch clip, or a Twitch video.");
  }
  const sourceUrl = canonicalUrl(ref);

  if (ref.platform === "youtube") {
    const video = await fetchYouTubeVideo(ref.id);
    return { ref, sourceUrl, ...video };
  }

  const info = ref.sourceType === "twitch_clip" ? await fetchTwitchClip(ref.id) : await fetchTwitchVideo(ref.id);
  return { ref, sourceUrl, ...info };
}

export function lookupErrorMessage(error: unknown): string {
  if (error instanceof LookupError) return error.message;
  if (error instanceof Error && error.name === "TimeoutError") {
    return "That took too long to load. Try again in a minute.";
  }
  return "Something went wrong reading that link. Try again in a minute.";
}
