"use server";

import { revalidatePath } from "next/cache";
import { getViewer } from "@/lib/auth";
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
    const message = error.message.includes("too fast") || error.message.includes("little fast")
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
