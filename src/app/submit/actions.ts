"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { maybeAwardFoundingCreator, verifiedOwnerOf } from "@/lib/awards";
import { getViewer } from "@/lib/auth";
import { isCategory, isKind, isMusicSource } from "@/lib/categories";
import { parseTags } from "@/lib/format";
import { lookupErrorMessage, lookupVideo, type VideoMeta } from "@/lib/lookup";
import { site } from "@/lib/site";
import { duplicateMessage, findExistingClip } from "@/lib/submissions";
import { createAdminClient } from "@/lib/supabase/admin";

export type SubmitState = { error: string | null };

export async function submitClip(_prev: SubmitState, formData: FormData): Promise<SubmitState> {
  const viewer = await getViewer();
  if (!viewer) return { error: "Your login expired. Log in again to submit." };

  const url = String(formData.get("url") ?? "");
  const kind = String(formData.get("kind") ?? "");
  const category = String(formData.get("category") ?? "");
  const music = String(formData.get("music") ?? "");
  const musicCredit = String(formData.get("musicCredit") ?? "").trim().slice(0, 200);
  const notes = String(formData.get("notes") ?? "").trim();
  const tags = parseTags(String(formData.get("tags") ?? ""));
  const agreed = formData.get("agree") === "on";

  if (!agreed) return { error: "Tick the box at the bottom to confirm this video is fine to share." };
  if (!isKind(kind)) return { error: "Choose whether this is a movie or a clip." };
  if (!isCategory(category)) return { error: "Choose a category." };
  if (!isMusicSource(music)) return { error: "Tell us what music is in the video." };
  if (music === "licensed" && !musicCredit) return { error: "Add a credit for the licensed track." };
  if (notes.length > 600) return { error: "Keep the notes under 600 characters." };

  const admin = createAdminClient();

  // Keep the review queue manageable.
  if (!viewer.isCurator) {
    const [{ count: pending }, { count: today }] = await Promise.all([
      admin.from("clips").select("id", { count: "exact", head: true }).eq("submitted_by", viewer.userId).eq("status", "pending"),
      admin
        .from("clips")
        .select("id", { count: "exact", head: true })
        .eq("submitted_by", viewer.userId)
        .gte("created_at", new Date(Date.now() - 86400_000).toISOString()),
    ]);
    if ((pending ?? 0) >= site.maxPendingSubmissions) {
      return { error: `You have ${site.maxPendingSubmissions} videos waiting for review. Hang tight until those are checked.` };
    }
    if ((today ?? 0) >= site.maxSubmissionsPerDay) {
      return { error: "That's the limit for today. Come back tomorrow with more." };
    }
  }

  // Never trust what the browser sent about the video. Look it up again here.
  let meta: VideoMeta;
  try {
    meta = await lookupVideo(url);
  } catch (error) {
    return { error: lookupErrorMessage(error) };
  }

  const existing = await findExistingClip(meta.ref);
  if (existing) return { error: duplicateMessage(existing) };

  const creatorId = await verifiedOwnerOf(meta.ref.platform, meta.channelId);
  const autoApprove = viewer.isCurator;
  const now = new Date().toISOString();

  let shortId: string | null = null;
  for (let attempt = 0; attempt < 3 && !shortId; attempt++) {
    const { data, error } = await admin
      .from("clips")
      .insert({
        platform: meta.ref.platform,
        source_type: meta.ref.sourceType,
        source_id: meta.ref.id,
        source_url: meta.sourceUrl,
        title: meta.title.slice(0, 140) || "Untitled",
        description: notes || null,
        thumbnail_url: meta.thumbnailUrl,
        duration_seconds: meta.durationSeconds,
        channel_id: meta.channelId,
        channel_name: meta.channelName.slice(0, 120),
        channel_url: meta.channelUrl,
        channel_avatar_url: meta.channelAvatarUrl,
        creator_id: creatorId,
        submitted_by: viewer.userId,
        kind,
        category,
        tags,
        music_source: music,
        music_credit: music === "licensed" ? musicCredit : null,
        status: autoApprove ? "approved" : "pending",
        reviewed_by: autoApprove ? viewer.userId : null,
        reviewed_at: autoApprove ? now : null,
        published_at: autoApprove ? now : null,
      })
      .select("short_id")
      .single<{ short_id: string }>();

    if (data) {
      shortId = data.short_id;
    } else if (error?.code === "23505" && error.message.includes("clips_source_unique")) {
      return { error: "Someone just shared this one a moment ago." };
    } else if (error?.code !== "23505") {
      return { error: "We couldn't save that. Try again in a minute." };
    }
  }
  if (!shortId) return { error: "We couldn't save that. Try again in a minute." };

  if (autoApprove && creatorId) await maybeAwardFoundingCreator(creatorId);
  if (autoApprove) revalidatePath("/");

  redirect(`/c/${shortId}?submitted=1`);
}
