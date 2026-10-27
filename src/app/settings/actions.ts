"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { markChannelVerified, syncTwitchChannel, verifiedOwnerOf } from "@/lib/awards";
import { getViewer } from "@/lib/auth";
import { isBadgeKey } from "@/lib/badges";
import { normalizeUsername } from "@/lib/format";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { fetchYouTubeChannel, LookupError } from "@/lib/youtube";

export type FormState = { ok: boolean; message: string | null };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function text(formData: FormData, key: string, max: number): string | null {
  const value = String(formData.get(key) ?? "").trim();
  return value ? value.slice(0, max) : null;
}

export async function updateProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const viewer = await getViewer();
  if (!viewer?.profile) return { ok: false, message: "Your login expired. Log in again." };

  const username = normalizeUsername(String(formData.get("username") ?? ""));
  if (!username) {
    return { ok: false, message: "Usernames are 3 to 24 characters: letters, numbers and underscores." };
  }
  const displayName = text(formData, "display_name", 40);
  if (!displayName) return { ok: false, message: "Add a display name." };

  const factionRaw = String(formData.get("faction") ?? "");
  const faction = factionRaw === "horde" || factionRaw === "alliance" ? factionRaw : null;

  const titleRaw = String(formData.get("active_title") ?? "");
  const activeTitle = isBadgeKey(titleRaw) ? titleRaw : null;

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      username,
      display_name: displayName,
      bio: text(formData, "bio", 280),
      main_character: text(formData, "main_character", 24),
      main_race: text(formData, "main_race", 24),
      main_class: text(formData, "main_class", 24),
      main_spec: text(formData, "main_spec", 24),
      realm: text(formData, "realm", 40),
      guild: text(formData, "guild", 40),
      faction,
      active_title: activeTitle,
    })
    .eq("id", viewer.userId);

  if (error) {
    if (error.code === "23505") return { ok: false, message: "That username is taken. Try another." };
    if (error.message.includes("earned")) return { ok: false, message: "You can only show a title you've earned." };
    return { ok: false, message: "We couldn't save your profile. Try again in a moment." };
  }

  revalidatePath("/settings");
  revalidatePath(`/u/${username}`);
  if (viewer.profile.username !== username) revalidatePath(`/u/${viewer.profile.username}`);
  return { ok: true, message: "Saved." };
}

export async function startYouTubeVerification(_prev: FormState, formData: FormData): Promise<FormState> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, message: "Your login expired. Log in again." };

  const input = String(formData.get("channel") ?? "");
  let channel;
  try {
    channel = await fetchYouTubeChannel(input);
  } catch (error) {
    return {
      ok: false,
      message: error instanceof LookupError ? error.message : "YouTube didn't answer. Try again in a minute.",
    };
  }

  const owner = await verifiedOwnerOf("youtube", channel.id);
  if (owner === viewer.userId) return { ok: true, message: "That channel is already verified on your account." };
  if (owner) {
    return {
      ok: false,
      message:
        "That channel is already verified by another 4Ever account. If that's wrong, use the report form and we'll sort it out.",
    };
  }

  const code = `4ever-${randomBytes(4).toString("hex")}`;
  const admin = createAdminClient();
  const { error } = await admin.from("channels").upsert(
    {
      user_id: viewer.userId,
      platform: "youtube",
      channel_id: channel.id,
      channel_name: channel.title,
      channel_url: channel.url,
      verification_code: code,
      verified_at: null,
    },
    { onConflict: "user_id,platform,channel_id" },
  );
  if (error) return { ok: false, message: "We couldn't start verification. Try again in a minute." };

  revalidatePath("/settings");
  return { ok: true, message: null };
}

export async function checkYouTubeVerification(_prev: FormState, formData: FormData): Promise<FormState> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, message: "Your login expired. Log in again." };
  const rowId = String(formData.get("channelRowId") ?? "");
  if (!UUID.test(rowId)) return { ok: false, message: "That channel wasn't found." };

  const admin = createAdminClient();
  const { data: row } = await admin
    .from("channels")
    .select("id, channel_id, channel_name, channel_url, verification_code, verified_at")
    .eq("id", rowId)
    .eq("user_id", viewer.userId)
    .eq("platform", "youtube")
    .maybeSingle<{
      id: string;
      channel_id: string;
      channel_name: string;
      channel_url: string | null;
      verification_code: string | null;
      verified_at: string | null;
    }>();
  if (!row) return { ok: false, message: "That channel wasn't found." };
  if (row.verified_at) return { ok: true, message: "Already verified." };
  if (!row.verification_code) return { ok: false, message: "Start verification again to get a new code." };

  let channel;
  try {
    channel = await fetchYouTubeChannel(row.channel_id);
  } catch (error) {
    return {
      ok: false,
      message: error instanceof LookupError ? error.message : "YouTube didn't answer. Try again in a minute.",
    };
  }

  if (!channel.description.includes(row.verification_code)) {
    return {
      ok: false,
      message:
        "We don't see the code in your channel description yet. YouTube can take a few minutes to update, so try again shortly.",
    };
  }

  const problem = await markChannelVerified({
    userId: viewer.userId,
    platform: "youtube",
    channelId: channel.id,
    channelName: channel.title,
    channelUrl: channel.url,
  });
  if (problem) return { ok: false, message: problem };

  revalidatePath("/settings");
  if (viewer.profile) revalidatePath(`/u/${viewer.profile.username}`);
  return { ok: true, message: "Verified! You can remove the code from your description now." };
}

export async function removeChannel(formData: FormData): Promise<void> {
  const viewer = await getViewer();
  if (!viewer) return;
  const rowId = String(formData.get("channelRowId") ?? "");
  if (!UUID.test(rowId)) return;

  const admin = createAdminClient();
  const { data: row } = await admin
    .from("channels")
    .select("platform, channel_id")
    .eq("id", rowId)
    .eq("user_id", viewer.userId)
    .maybeSingle<{ platform: string; channel_id: string }>();
  if (!row) return;

  await admin.from("channels").delete().eq("id", rowId).eq("user_id", viewer.userId);
  // Their videos from that channel go back to being credited to the channel name.
  await admin
    .from("clips")
    .update({ creator_id: null })
    .eq("creator_id", viewer.userId)
    .eq("platform", row.platform)
    .eq("channel_id", row.channel_id);

  revalidatePath("/settings");
  if (viewer.profile) revalidatePath(`/u/${viewer.profile.username}`);
}

export async function syncTwitch(): Promise<FormState> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, message: "Your login expired. Log in again." };
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { ok: false, message: "Your login expired. Log in again." };
  if (!data.user.identities?.some((i) => i.provider === "twitch")) {
    return { ok: false, message: "Link your Twitch account first." };
  }
  const problem = await syncTwitchChannel(viewer.userId, data.user.identities);
  if (problem) return { ok: false, message: problem };
  revalidatePath("/settings");
  return { ok: true, message: "Twitch channel verified." };
}

export async function deleteAccount(_prev: FormState, formData: FormData): Promise<FormState> {
  const viewer = await getViewer();
  if (!viewer?.profile) return { ok: false, message: "Your login expired. Log in again." };
  const confirm = String(formData.get("confirm") ?? "")
    .trim()
    .toLowerCase();
  if (confirm !== viewer.profile.username) {
    return { ok: false, message: `Type your username (${viewer.profile.username}) to confirm.` };
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(viewer.userId);
  if (error) return { ok: false, message: "We couldn't delete your account. Contact us and we'll do it by hand." };

  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/?goodbye=1");
}
