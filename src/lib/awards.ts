// Server-only helpers for credit and badges. They use the admin client,
// so only call them after checking the visitor is allowed to do the thing.
import { site } from "@/lib/site";
import { createAdminClient } from "@/lib/supabase/admin";
import type { BadgeKey } from "@/lib/badges";

export async function awardBadge(userId: string, badge: BadgeKey, note?: string) {
  const admin = createAdminClient();
  await admin
    .from("user_badges")
    .upsert({ user_id: userId, badge, note: note ?? null }, { onConflict: "user_id,badge", ignoreDuplicates: true });
}

// Give a newly verified creator credit for every video from their channel already on 4Ever.
export async function backfillCreatorCredit(platform: "youtube" | "twitch", channelId: string, userId: string) {
  const admin = createAdminClient();
  await admin
    .from("clips")
    .update({ creator_id: userId })
    .eq("platform", platform)
    .eq("channel_id", channelId)
    .is("creator_id", null);
}

// Which verified 4Ever account owns this channel, if any?
export async function verifiedOwnerOf(platform: "youtube" | "twitch", channelId: string | null): Promise<string | null> {
  if (!channelId) return null;
  const admin = createAdminClient();
  const { data } = await admin
    .from("channels")
    .select("user_id")
    .eq("platform", platform)
    .eq("channel_id", channelId)
    .not("verified_at", "is", null)
    .maybeSingle<{ user_id: string }>();
  return data?.user_id ?? null;
}

// The first creators to get a video approved earn the Founding Creator title.
export async function maybeAwardFoundingCreator(userId: string) {
  const admin = createAdminClient();
  const { count } = await admin
    .from("user_badges")
    .select("user_id", { count: "exact", head: true })
    .eq("badge", "founding_creator");
  if ((count ?? 0) < site.foundingCreatorLimit) {
    await awardBadge(userId, "founding_creator");
  }
}

// Mark a channel as verified for this account and pass the credit along.
// Returns an error message, or null when it worked.
export async function markChannelVerified(input: {
  userId: string;
  platform: "youtube" | "twitch";
  channelId: string;
  channelName: string;
  channelUrl: string | null;
}): Promise<string | null> {
  const admin = createAdminClient();
  const owner = await verifiedOwnerOf(input.platform, input.channelId);
  if (owner && owner !== input.userId) {
    return "That channel is already verified by another 4Ever account. If that's wrong, use the report form and we'll sort it out.";
  }

  const { error } = await admin.from("channels").upsert(
    {
      user_id: input.userId,
      platform: input.platform,
      channel_id: input.channelId,
      channel_name: input.channelName,
      channel_url: input.channelUrl,
      verification_code: null,
      verified_at: new Date().toISOString(),
    },
    { onConflict: "user_id,platform,channel_id" },
  );
  if (error) return "We couldn't save that channel. Try again in a minute.";

  await awardBadge(input.userId, "verified_creator");
  await backfillCreatorCredit(input.platform, input.channelId, input.userId);

  const { count } = await admin
    .from("clips")
    .select("id", { count: "exact", head: true })
    .eq("creator_id", input.userId)
    .eq("status", "approved");
  if ((count ?? 0) > 0) await maybeAwardFoundingCreator(input.userId);
  return null;
}

type IdentityLike = { provider: string; id?: string; identity_data?: Record<string, unknown> };

// When someone logs in with Twitch (or links Twitch in Settings), their Twitch
// channel is verified automatically: Twitch has already proven they own it.
export async function syncTwitchChannel(userId: string, identities: IdentityLike[] | undefined): Promise<string | null> {
  const identity = identities?.find((i) => i.provider === "twitch");
  if (!identity) return null;
  const data = identity.identity_data ?? {};
  const twitchId = String(data.provider_id ?? data.sub ?? identity.id ?? "");
  if (!/^\d+$/.test(twitchId)) return "We couldn't read your Twitch account. Try linking it again.";

  let login = String(data.slug ?? data.nickname ?? data.name ?? "").toLowerCase();
  let displayName = String(data.nickname ?? data.full_name ?? data.name ?? login);

  const { fetchTwitchUser, isTwitchConfigured } = await import("@/lib/twitch");
  if (isTwitchConfigured()) {
    const user = await fetchTwitchUser(twitchId).catch(() => null);
    if (user) {
      login = user.login;
      displayName = user.display_name;
    }
  }

  return markChannelVerified({
    userId,
    platform: "twitch",
    channelId: twitchId,
    channelName: displayName || login || "Twitch channel",
    channelUrl: login ? `https://www.twitch.tv/${login}` : null,
  });
}
