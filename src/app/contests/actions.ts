"use server";

import { revalidatePath } from "next/cache";
import { getViewer } from "@/lib/auth";
import { contestPhase } from "@/lib/contests";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Contest } from "@/lib/types";

export type EntryState = { ok: boolean; message: string | null };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function enterContest(_prev: EntryState, formData: FormData): Promise<EntryState> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, message: "Log in to enter." };
  const contestId = String(formData.get("contestId") ?? "");
  const clipId = String(formData.get("clipId") ?? "");
  if (!UUID.test(contestId) || !UUID.test(clipId)) return { ok: false, message: "Pick one of your videos." };

  const admin = createAdminClient();
  const { data: contest } = await admin.from("contests").select("*").eq("id", contestId).maybeSingle<Contest>();
  if (!contest) return { ok: false, message: "That contest wasn't found." };
  if (contestPhase(contest) !== "open") return { ok: false, message: "Entries aren't open right now." };

  const { data: clip } = await admin
    .from("clips")
    .select("id, status, creator_id")
    .eq("id", clipId)
    .maybeSingle<{ id: string; status: string; creator_id: string | null }>();
  if (!clip || clip.status !== "approved") return { ok: false, message: "That video isn't approved yet." };
  if (clip.creator_id !== viewer.userId) {
    return { ok: false, message: "You can only enter videos from your own verified channel." };
  }

  const { count } = await admin
    .from("contest_entries")
    .select("clip_id", { count: "exact", head: true })
    .eq("contest_id", contestId)
    .eq("entered_by", viewer.userId);
  if ((count ?? 0) >= 1) return { ok: false, message: "You already have an entry in this contest. Withdraw it first to swap." };

  const { error } = await admin
    .from("contest_entries")
    .insert({ contest_id: contestId, clip_id: clipId, entered_by: viewer.userId });
  if (error) return { ok: false, message: "That didn't save. Try again in a minute." };

  revalidatePath(`/contests/${contest.slug}`);
  return { ok: true, message: "You're in. Good luck!" };
}

export async function withdrawEntry(formData: FormData): Promise<void> {
  const viewer = await getViewer();
  if (!viewer) return;
  const contestId = String(formData.get("contestId") ?? "");
  const clipId = String(formData.get("clipId") ?? "");
  if (!UUID.test(contestId) || !UUID.test(clipId)) return;

  const admin = createAdminClient();
  const { data: contest } = await admin.from("contests").select("*").eq("id", contestId).maybeSingle<Contest>();
  if (!contest || contestPhase(contest) !== "open") return;

  await admin
    .from("contest_entries")
    .delete()
    .eq("contest_id", contestId)
    .eq("clip_id", clipId)
    .eq("entered_by", viewer.userId);
  revalidatePath(`/contests/${contest.slug}`);
}
