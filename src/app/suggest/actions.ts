"use server";

import { revalidatePath } from "next/cache";
import { getViewer } from "@/lib/auth";
import { isSuggestionTopic } from "@/lib/suggestions";
import { createAdminClient } from "@/lib/supabase/admin";

export type SuggestState = { ok: boolean; message: string | null; sentAt?: number };

export async function sendSuggestion(_prev: SuggestState, formData: FormData): Promise<SuggestState> {
  // Bots fill in every field, including the hidden one.
  if (String(formData.get("website") ?? "")) return { ok: true, message: null, sentAt: Date.now() };

  const viewer = await getViewer();
  if (!viewer) return { ok: false, message: "Log in first so we can reply to you." };

  const topic = String(formData.get("topic") ?? "");
  const body = String(formData.get("body") ?? "")
    .trim()
    .slice(0, 1500);
  if (!isSuggestionTopic(topic)) return { ok: false, message: "Pick what it's about." };
  if (body.length < 5) return { ok: false, message: "Write a little more so we know what you mean." };

  const admin = createAdminClient();
  // Flood protection: five a day is plenty.
  const { count } = await admin
    .from("suggestions")
    .select("id", { count: "exact", head: true })
    .eq("author_id", viewer.userId)
    .gte("created_at", new Date(Date.now() - 86400_000).toISOString());
  if ((count ?? 0) >= 5) return { ok: false, message: "You've sent five today. We'll get to those first." };

  const { error } = await admin.from("suggestions").insert({ author_id: viewer.userId, topic, body });
  if (error) return { ok: false, message: "That didn't send. Try again in a minute." };

  revalidatePath("/suggest");
  revalidatePath("/admin", "layout");
  return {
    ok: true,
    message: "Sent. You'll see the reply here, and a dot on your name up top when it comes in.",
    sentAt: Date.now(),
  };
}
