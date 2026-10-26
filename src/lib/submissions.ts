// Server-only helpers shared by the link preview and the submit action.
import { createAdminClient } from "@/lib/supabase/admin";
import type { VideoRef } from "@/lib/video";

export type ExistingClip = { short_id: string; status: string };

export async function findExistingClip(ref: VideoRef): Promise<ExistingClip | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("clips")
    .select("short_id, status")
    .eq("source_type", ref.sourceType)
    .eq("source_id", ref.id)
    .maybeSingle<ExistingClip>();
  return data ?? null;
}

export function duplicateMessage(existing: ExistingClip): string {
  switch (existing.status) {
    case "approved":
      return "This video is already on 4Ever.";
    case "pending":
      return "Someone already shared this one. It's waiting for review.";
    default:
      return "This video can't be submitted again.";
  }
}
