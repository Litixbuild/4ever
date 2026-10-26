"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { awardBadge, maybeAwardFoundingCreator } from "@/lib/awards";
import { getViewer } from "@/lib/auth";
import { isBadgeKey } from "@/lib/badges";
import { isCategory, isKind } from "@/lib/categories";
import { parseTags } from "@/lib/format";
import { createAdminClient } from "@/lib/supabase/admin";
import { localInputToIso } from "@/lib/time";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function curator() {
  const viewer = await getViewer();
  if (!viewer?.isCurator) throw new Error("Only curators can do that.");
  return viewer;
}

function back(formData: FormData, message: string): never {
  const raw = String(formData.get("returnTo") ?? "/admin");
  const path = raw.startsWith("/admin") && !raw.startsWith("//") ? raw.split("?")[0] : "/admin";
  redirect(`${path}?notice=${encodeURIComponent(message)}`);
}

function id(formData: FormData, key: string): string | null {
  const value = String(formData.get(key) ?? "");
  return UUID.test(value) ? value : null;
}

// ---------- Review queue ----------

export async function approveClip(formData: FormData) {
  const viewer = await curator();
  const clipId = id(formData, "clipId");
  if (!clipId) back(formData, "That video wasn't found.");
  const kind = String(formData.get("kind") ?? "");
  const category = String(formData.get("category") ?? "");

  const admin = createAdminClient();
  const { data: clip } = await admin
    .from("clips")
    .select("id, short_id, creator_id, published_at")
    .eq("id", clipId)
    .maybeSingle<{ id: string; short_id: string; creator_id: string | null; published_at: string | null }>();
  if (!clip) back(formData, "That video wasn't found.");

  const now = new Date().toISOString();
  await admin
    .from("clips")
    .update({
      status: "approved",
      ...(isKind(kind) ? { kind } : {}),
      ...(isCategory(category) ? { category } : {}),
      published_at: clip.published_at ?? now,
      reviewed_by: viewer.userId,
      reviewed_at: now,
      review_note: null,
    })
    .eq("id", clip.id);

  if (clip.creator_id) await maybeAwardFoundingCreator(clip.creator_id);
  revalidatePath("/");
  revalidatePath(`/c/${clip.short_id}`);
  back(formData, "Approved and live.");
}

export async function rejectClip(formData: FormData) {
  const viewer = await curator();
  const clipId = id(formData, "clipId");
  if (!clipId) back(formData, "That video wasn't found.");
  const reason = String(formData.get("reason") ?? "").slice(0, 120);
  const note = String(formData.get("note") ?? "").trim().slice(0, 400);
  const message = [reason, note].filter(Boolean).join(" ") || "It didn't fit the site's rules.";

  const admin = createAdminClient();
  await admin
    .from("clips")
    .update({ status: "rejected", review_note: message, reviewed_by: viewer.userId, reviewed_at: new Date().toISOString() })
    .eq("id", clipId);
  back(formData, "Rejected. The submitter will see your note.");
}

// ---------- Videos ----------

export async function setClipStatus(formData: FormData) {
  const viewer = await curator();
  const clipId = id(formData, "clipId");
  const status = String(formData.get("status") ?? "");
  if (!clipId || !["approved", "removed", "pending"].includes(status)) back(formData, "Nothing changed.");
  const note = String(formData.get("note") ?? "").trim().slice(0, 400) || null;

  const admin = createAdminClient();
  const { data: clip } = await admin
    .from("clips")
    .select("short_id, published_at")
    .eq("id", clipId)
    .maybeSingle<{ short_id: string; published_at: string | null }>();
  if (!clip) back(formData, "That video wasn't found.");
  const now = new Date().toISOString();
  await admin
    .from("clips")
    .update({
      status,
      review_note: status === "removed" ? (note ?? "Removed by a curator.") : null,
      reviewed_by: viewer.userId,
      reviewed_at: now,
      ...(status === "approved" && !clip.published_at ? { published_at: now } : {}),
    })
    .eq("id", clipId);
  revalidatePath("/");
  revalidatePath(`/c/${clip.short_id}`);
  back(formData, status === "removed" ? "Removed from the site." : "Updated.");
}

export async function updateClip(formData: FormData) {
  await curator();
  const clipId = id(formData, "clipId");
  if (!clipId) back(formData, "That video wasn't found.");
  const title = String(formData.get("title") ?? "").trim().slice(0, 140);
  const kind = String(formData.get("kind") ?? "");
  const category = String(formData.get("category") ?? "");
  const tags = parseTags(String(formData.get("tags") ?? ""));
  if (!title) back(formData, "A title is required.");

  const admin = createAdminClient();
  const { data } = await admin
    .from("clips")
    .update({ title, tags, ...(isKind(kind) ? { kind } : {}), ...(isCategory(category) ? { category } : {}) })
    .eq("id", clipId)
    .select("short_id")
    .maybeSingle<{ short_id: string }>();
  if (data) revalidatePath(`/c/${data.short_id}`);
  back(formData, "Saved.");
}

// ---------- Reports ----------

export async function resolveReport(formData: FormData) {
  const viewer = await curator();
  const reportId = id(formData, "reportId");
  const outcome = String(formData.get("outcome") ?? "");
  if (!reportId || !["resolved", "dismissed", "removed"].includes(outcome)) back(formData, "Nothing changed.");

  const admin = createAdminClient();
  const now = new Date().toISOString();
  if (outcome === "removed") {
    const { data: report } = await admin
      .from("reports")
      .select("clip_id, reason")
      .eq("id", reportId)
      .maybeSingle<{ clip_id: string | null; reason: string }>();
    if (report?.clip_id) {
      const { data: clip } = await admin
        .from("clips")
        .update({
          status: "removed",
          review_note: report.reason === "my_video_remove" ? "Removed at the creator's request." : "Removed after a report.",
          reviewed_by: viewer.userId,
          reviewed_at: now,
        })
        .eq("id", report.clip_id)
        .select("short_id")
        .maybeSingle<{ short_id: string }>();
      if (clip) revalidatePath(`/c/${clip.short_id}`);
      revalidatePath("/");
    }
  }
  await admin
    .from("reports")
    .update({ status: outcome === "dismissed" ? "dismissed" : "resolved", resolved_by: viewer.userId, resolved_at: now })
    .eq("id", reportId);
  back(formData, outcome === "removed" ? "Video removed and report closed." : "Report closed.");
}

// ---------- Movie of the Week ----------

export async function setFeature(formData: FormData) {
  const viewer = await curator();
  const input = String(formData.get("clip") ?? "").trim();
  const shortId = (input.match(/\/c\/([A-Za-z0-9]{6,12})/)?.[1] ?? input).trim();
  if (!/^[A-Za-z0-9]{6,12}$/.test(shortId)) back(formData, "Paste the video's 4Ever link or its short id.");
  const days = Math.min(Math.max(Number.parseInt(String(formData.get("days") ?? "7"), 10) || 7, 1), 30);
  const useText = String(formData.get("use_text") ?? "").trim().slice(0, 120) || null;
  const flavorText = String(formData.get("flavor_text") ?? "").trim().slice(0, 120) || null;

  const admin = createAdminClient();
  const { data: clip } = await admin
    .from("clips")
    .select("id, creator_id, status")
    .eq("short_id", shortId)
    .maybeSingle<{ id: string; creator_id: string | null; status: string }>();
  if (!clip || clip.status !== "approved") back(formData, "That video isn't live on 4Ever.");

  const now = new Date();
  await admin.from("features").update({ ends_at: now.toISOString() }).or(`ends_at.is.null,ends_at.gt."${now.toISOString()}"`);
  await admin.from("features").insert({
    clip_id: clip.id,
    use_text: useText,
    flavor_text: flavorText,
    starts_at: now.toISOString(),
    ends_at: new Date(now.getTime() + days * 86400_000).toISOString(),
    created_by: viewer.userId,
  });
  if (clip.creator_id) await awardBadge(clip.creator_id, "movie_of_the_week");
  revalidatePath("/");
  revalidatePath("/hall-of-fame");
  back(formData, "New Movie of the Week is live.");
}

export async function endFeature(formData: FormData) {
  await curator();
  const featureId = id(formData, "featureId");
  if (!featureId) back(formData, "Nothing changed.");
  const admin = createAdminClient();
  await admin.from("features").update({ ends_at: new Date().toISOString() }).eq("id", featureId);
  revalidatePath("/");
  back(formData, "Feature ended.");
}

// ---------- Contests ----------

export async function saveContest(formData: FormData) {
  await curator();
  const contestId = id(formData, "contestId");
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase();
  const title = String(formData.get("title") ?? "").trim().slice(0, 80);
  const opens = localInputToIso(String(formData.get("opens_at") ?? ""));
  const closes = localInputToIso(String(formData.get("closes_at") ?? ""));
  const ends = localInputToIso(String(formData.get("ends_at") ?? ""));

  if (!/^[a-z0-9-]{3,60}$/.test(slug)) back(formData, "The link name can use lowercase letters, numbers and dashes.");
  if (!title) back(formData, "Give the contest a title.");
  if (!opens || !closes || !ends) back(formData, "Fill in all three dates.");
  if (!(opens < closes && closes <= ends)) back(formData, "Dates must go: opens, then entries close, then voting ends.");

  const row = {
    slug,
    title,
    tagline: String(formData.get("tagline") ?? "").trim().slice(0, 160) || null,
    description: String(formData.get("description") ?? "").trim().slice(0, 4000) || null,
    rules: String(formData.get("rules") ?? "").trim().slice(0, 4000) || null,
    prizes: String(formData.get("prizes") ?? "")
      .split("\n")
      .map((p) => p.trim())
      .filter(Boolean)
      .slice(0, 6),
    opens_at: opens,
    closes_at: closes,
    ends_at: ends,
  };

  const admin = createAdminClient();
  const { error } = contestId
    ? await admin.from("contests").update(row).eq("id", contestId)
    : await admin.from("contests").insert(row);
  if (error) back(formData, error.code === "23505" ? "That link name is already used." : "That didn't save.");
  revalidatePath("/contests");
  revalidatePath(`/contests/${slug}`);
  revalidatePath("/");
  back(formData, contestId ? "Contest saved." : "Contest created.");
}

export async function setPlacement(formData: FormData) {
  await curator();
  const contestId = id(formData, "contestId");
  const clipId = id(formData, "clipId");
  const raw = String(formData.get("placement") ?? "");
  const placement = ["1", "2", "3"].includes(raw) ? Number(raw) : null;
  if (!contestId || !clipId) back(formData, "Nothing changed.");

  const admin = createAdminClient();
  await admin.from("contest_entries").update({ placement }).eq("contest_id", contestId).eq("clip_id", clipId);
  if (placement === 1) {
    const { data: clip } = await admin
      .from("clips")
      .select("creator_id")
      .eq("id", clipId)
      .maybeSingle<{ creator_id: string | null }>();
    if (clip?.creator_id) await awardBadge(clip.creator_id, "contest_winner");
  }
  const { data: contest } = await admin.from("contests").select("slug").eq("id", contestId).maybeSingle<{ slug: string }>();
  if (contest) revalidatePath(`/contests/${contest.slug}`);
  revalidatePath("/hall-of-fame");
  back(formData, "Placement saved.");
}

// ---------- People ----------

export async function setRole(formData: FormData) {
  const viewer = await curator();
  if (!viewer.isAdmin) back(formData, "Only admins can change roles.");
  const userId = id(formData, "userId");
  const role = String(formData.get("role") ?? "");
  if (!userId || !["member", "curator", "admin"].includes(role)) back(formData, "Nothing changed.");
  if (userId === viewer.userId && role !== "admin") back(formData, "You can't remove your own admin role.");

  const admin = createAdminClient();
  await admin.from("profiles").update({ role }).eq("id", userId);
  if (role === "curator" || role === "admin") await awardBadge(userId, "curator");
  back(formData, "Role updated.");
}

export async function grantBadge(formData: FormData) {
  await curator();
  const userId = id(formData, "userId");
  const badge = String(formData.get("badge") ?? "");
  if (!userId || !isBadgeKey(badge)) back(formData, "Nothing changed.");
  await awardBadge(userId, badge, "Awarded by a curator");
  back(formData, "Achievement awarded.");
}

export async function revokeBadge(formData: FormData) {
  await curator();
  const userId = id(formData, "userId");
  const badge = String(formData.get("badge") ?? "");
  if (!userId || !isBadgeKey(badge)) back(formData, "Nothing changed.");
  const admin = createAdminClient();
  await admin.from("user_badges").delete().eq("user_id", userId).eq("badge", badge);
  back(formData, "Achievement removed.");
}
