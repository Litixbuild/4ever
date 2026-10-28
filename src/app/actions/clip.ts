"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getViewer } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SHORT_ID = /^[A-Za-z0-9]{6,12}$/;

export type ToggleResult = { ok: true; on: boolean } | { ok: false; error: string };

async function toggle(table: "votes" | "favorites", clipId: string, shortId: string): Promise<ToggleResult> {
  if (!UUID.test(clipId) || !SHORT_ID.test(shortId)) return { ok: false, error: "That video wasn't found." };
  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: "login" };

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from(table)
    .select("clip_id")
    .eq("clip_id", clipId)
    .eq("user_id", viewer.userId)
    .maybeSingle();

  const { error } = existing
    ? await supabase.from(table).delete().eq("clip_id", clipId).eq("user_id", viewer.userId)
    : await supabase.from(table).insert({ clip_id: clipId, user_id: viewer.userId });

  if (error) return { ok: false, error: "That didn't save. Try again in a moment." };
  revalidatePath(`/c/${shortId}`);
  return { ok: true, on: !existing };
}

export async function toggleVote(clipId: string, shortId: string): Promise<ToggleResult> {
  return toggle("votes", clipId, shortId);
}

export async function toggleFavorite(clipId: string, shortId: string): Promise<ToggleResult> {
  return toggle("favorites", clipId, shortId);
}

export type CommentState = { ok: boolean; message: string | null; key: number };

export async function postComment(_prev: CommentState, formData: FormData): Promise<CommentState> {
  const clipId = String(formData.get("clipId") ?? "");
  const shortId = String(formData.get("shortId") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  const key = Date.now();

  if (!UUID.test(clipId) || !SHORT_ID.test(shortId)) return { ok: false, message: "That video wasn't found.", key };
  if (!body) return { ok: false, message: "Write something first.", key };
  if (body.length > 1000) return { ok: false, message: "Keep comments under 1,000 characters.", key };

  const viewer = await getViewer();
  if (!viewer) return { ok: false, message: "Log in to comment.", key };

  const supabase = await createClient();
  const { error } = await supabase.from("comments").insert({ clip_id: clipId, user_id: viewer.userId, body });
  if (error) {
    const message =
      error.message.includes("too fast") || error.message.includes("little fast")
        ? "You're commenting a little fast. Try again in a few seconds."
        : "Your comment didn't post. Try again in a moment.";
    return { ok: false, message, key };
  }
  revalidatePath(`/c/${shortId}`);
  return { ok: true, message: null, key };
}

export async function deleteComment(formData: FormData): Promise<void> {
  const commentId = String(formData.get("commentId") ?? "");
  const shortId = String(formData.get("shortId") ?? "");
  if (!UUID.test(commentId) || !SHORT_ID.test(shortId)) return;
  const viewer = await getViewer();
  if (!viewer) return;
  const supabase = await createClient();
  await supabase.from("comments").delete().eq("id", commentId);
  revalidatePath(`/c/${shortId}`);
}

export type DeleteClipState = { error: string | null };

// Creators can delete videos from their own channel, and people can delete what they submitted.
// The video stays on YouTube or Twitch; only the 4Ever listing (with its votes and comments) goes.
export async function deleteClip(_prev: DeleteClipState, formData: FormData): Promise<DeleteClipState> {
  const clipId = String(formData.get("clipId") ?? "");
  if (!UUID.test(clipId)) return { error: "That video wasn't found." };
  const viewer = await getViewer();
  if (!viewer) return { error: "Log in to delete your video." };

  const admin = createAdminClient();
  const { data: clip } = await admin
    .from("clips")
    .select("id, creator_id, submitted_by")
    .eq("id", clipId)
    .maybeSingle<{ id: string; creator_id: string | null; submitted_by: string | null }>();
  if (!clip) return { error: "That video wasn't found." };
  if (clip.creator_id !== viewer.userId && clip.submitted_by !== viewer.userId) {
    return { error: "Only the creator or the person who shared it can delete this video." };
  }

  const { error } = await admin.from("clips").delete().eq("id", clip.id);
  if (error) return { error: "That didn't delete. Try again in a moment." };

  revalidatePath("/", "layout");
  redirect(`/u/${viewer.profile?.username ?? ""}?deleted=1`);
}
