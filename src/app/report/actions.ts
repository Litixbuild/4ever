"use server";

import { getViewer } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export type ReportState = { ok: boolean; message: string | null };

const REASONS = ["my_video_remove", "copyright", "wrong_credit", "inappropriate", "spam", "other"] as const;
const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;

export async function submitReport(_prev: ReportState, formData: FormData): Promise<ReportState> {
  // Bots fill in every field, including the hidden one.
  if (String(formData.get("website") ?? "")) return { ok: true, message: null };

  const reason = String(formData.get("reason") ?? "");
  const details = String(formData.get("details") ?? "").trim().slice(0, 2000);
  const email = String(formData.get("email") ?? "").trim().slice(0, 200);
  const clipShortId = String(formData.get("clip") ?? "").trim();

  if (!(REASONS as readonly string[]).includes(reason)) return { ok: false, message: "Pick a reason." };
  const viewer = await getViewer();
  if (!viewer && !EMAIL.test(email)) return { ok: false, message: "Add an email so we can follow up with you." };
  if (email && !EMAIL.test(email)) return { ok: false, message: "That email doesn't look right." };
  if ((reason === "other" || reason === "copyright" || reason === "wrong_credit") && details.length < 10) {
    return { ok: false, message: "Tell us a little more so we can act on it." };
  }

  const admin = createAdminClient();
  let clipId: string | null = null;
  if (/^[A-Za-z0-9]{6,12}$/.test(clipShortId)) {
    const { data } = await admin.from("clips").select("id").eq("short_id", clipShortId).maybeSingle<{ id: string }>();
    clipId = data?.id ?? null;
  }
  if (!clipId && reason !== "other" && reason !== "copyright") {
    return { ok: false, message: "We couldn't tell which video this is about. Open the report link from the video's page." };
  }

  // Simple flood protection: at most 10 open reports per person per day.
  if (viewer) {
    const { count } = await admin
      .from("reports")
      .select("id", { count: "exact", head: true })
      .eq("reporter_id", viewer.userId)
      .gte("created_at", new Date(Date.now() - 86400_000).toISOString());
    if ((count ?? 0) >= 10) return { ok: false, message: "That's a lot of reports for one day. We'll get to the ones you sent." };
  }

  const { error } = await admin.from("reports").insert({
    clip_id: clipId,
    reporter_id: viewer?.userId ?? null,
    reason,
    details: details || null,
    contact_email: email || null,
  });
  if (error) return { ok: false, message: "That didn't send. Try again in a minute." };

  return {
    ok: true,
    message:
      reason === "my_video_remove"
        ? "Got it. A curator will take it down shortly."
        : "Thanks. A curator will look at it soon.",
  };
}
