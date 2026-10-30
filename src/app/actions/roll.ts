"use server";

import { revalidatePath } from "next/cache";
import { getViewer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CLASSES, specsFor } from "@/lib/wow";

export type RollResult = { ok: true } | { ok: false; error: string };

// Saves the class and spec picked on the "choose your class" screen, or just notes that it was skipped.
export async function saveRoll(className: string | null, spec: string | null): Promise<RollResult> {
  const viewer = await getViewer();
  if (!viewer?.profile) return { ok: false, error: "Log in again to save your class." };

  const update: Record<string, string | null> = { class_prompted_at: new Date().toISOString() };
  if (className) {
    const cls = CLASSES.find((c) => c === className);
    if (!cls) return { ok: false, error: "That class isn't in Forever." };
    if (spec && !specsFor(cls).includes(spec)) return { ok: false, error: "That spec doesn't belong to that class." };
    update.main_class = cls;
    update.main_spec = spec;
  }

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update(update).eq("id", viewer.userId);
  if (error) return { ok: false, error: "That didn't save. Try again in a moment." };

  revalidatePath(`/u/${viewer.profile.username}`);
  revalidatePath("/settings");
  return { ok: true };
}
