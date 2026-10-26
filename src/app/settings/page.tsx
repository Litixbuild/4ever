import type { Metadata } from "next";
import Link from "next/link";
import { removeChannel } from "@/app/settings/actions";
import { CheckIcon, StreamIcon, VideoIcon } from "@/components/icons";
import { DeleteAccount, ProfileForm, TwitchLink, YouTubeCheck, YouTubeStart } from "@/components/settings-forms";
import { requireViewer } from "@/lib/auth";
import { badgeInfo, titleFor } from "@/lib/badges";
import { getBadges, getChannels } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const viewer = await requireViewer("/settings");
  const { notice } = await searchParams;
  const profile = viewer.profile;

  if (!profile) {
    return (
      <div className="container page page-narrow">
        <div className="notice notice-warn">
          Your profile is still being set up. Refresh in a moment, or log out and back in.
        </div>
      </div>
    );
  }

  const supabase = await createClient();
  const [{ data: userData }, channels, badges] = await Promise.all([
    supabase.auth.getUser(),
    getChannels(viewer.userId),
    getBadges(viewer.userId),
  ]);
  const twitchLinked = Boolean(userData.user?.identities?.some((i) => i.provider === "twitch"));
  const titles = badges
    .map((b) => ({ key: b.badge, label: titleFor(b.badge, profile.display_name) ?? badgeInfo(b.badge)?.name ?? b.badge }))
    .filter((t) => Boolean(t.label));

  const youtube = channels.filter((c) => c.platform === "youtube");
  const twitch = channels.filter((c) => c.platform === "twitch" && c.verified_at);
  const pendingYouTube = youtube.filter((c) => !c.verified_at && c.verification_code);

  return (
    <div className="container page page-narrow" style={{ gap: 40 }}>
      <div className="stack" style={{ gap: 8 }}>
        <span className="eyebrow">Settings</span>
        <h1 className="h1">Your account</h1>
        <p className="muted" style={{ margin: 0 }}>
          Logged in as {viewer.email ?? profile.display_name}. <Link href={`/u/${profile.username}`}>View your profile</Link>
        </p>
      </div>

      {notice ? (
        <div className="notice notice-warn" role="status">
          {notice.slice(0, 300)}
        </div>
      ) : null}

      <section aria-labelledby="profile-head" className="stack" style={{ gap: 14 }}>
        <h2 id="profile-head" className="h2">
          Profile
        </h2>
        <ProfileForm profile={profile} titles={titles} />
      </section>

      <section aria-labelledby="channels-head" id="channels" className="stack" style={{ gap: 14, scrollMarginTop: 90 }}>
        <div className="stack-sm">
          <h2 id="channels-head" className="h2">
            Verified channels
          </h2>
          <p className="muted" style={{ margin: 0 }}>
            Prove you own your channel and every video from it on 4Ever gets your name and a verified check, including
            ones other people share.
          </p>
        </div>

        {[...twitch, ...youtube.filter((c) => c.verified_at)].length > 0 ? (
          <ul className="list-plain stack-sm" style={{ gap: 10 }}>
            {[...twitch, ...youtube.filter((c) => c.verified_at)].map((c) => (
              <li key={c.id} className="card row" style={{ padding: "14px 18px", gap: 12 }}>
                {c.platform === "youtube" ? <VideoIcon size={18} /> : <StreamIcon size={18} />}
                <span style={{ fontWeight: 800 }}>{c.channel_name}</span>
                <span className="pill pill-green">
                  <CheckIcon size={12} /> Verified
                </span>
                <form action={removeChannel} style={{ marginLeft: "auto" }}>
                  <input type="hidden" name="channelRowId" value={c.id} />
                  <button type="submit" className="btn btn-ghost btn-sm">
                    Remove
                  </button>
                </form>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="card stack" style={{ gap: 14 }}>
          <h3 className="h3 row" style={{ gap: 8 }}>
            <VideoIcon size={18} /> YouTube
          </h3>
          {pendingYouTube.map((c) => (
            <div key={c.id} className="card-tooltip stack" style={{ gap: 10 }}>
              <span style={{ fontWeight: 800, color: "#fff" }}>Almost there: {c.channel_name}</span>
              <ol style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 6, fontSize: 14.5 }}>
                <li>
                  Open YouTube Studio, then <strong>Customization</strong>, then <strong>Basic info</strong>.
                </li>
                <li>
                  Paste this code anywhere in your channel description:{" "}
                  <code style={{ padding: "2px 8px", borderRadius: 6, background: "#000", color: "var(--gold-hi)", fontWeight: 800 }}>
                    {c.verification_code}
                  </code>
                </li>
                <li>Publish, then press the button below. You can delete the code afterwards.</li>
              </ol>
              <div className="row" style={{ gap: 10 }}>
                <YouTubeCheck channelRowId={c.id} />
                <form action={removeChannel}>
                  <input type="hidden" name="channelRowId" value={c.id} />
                  <button type="submit" className="link-button small" style={{ color: "var(--tooltip-muted)" }}>
                    Cancel
                  </button>
                </form>
              </div>
            </div>
          ))}
          <YouTubeStart />
        </div>

        <div className="card stack" style={{ gap: 12 }}>
          <h3 className="h3 row" style={{ gap: 8 }}>
            <StreamIcon size={18} /> Twitch
          </h3>
          <p className="small muted" style={{ margin: 0 }}>
            {twitch.length > 0
              ? "Your Twitch channel is verified. Clips and videos from it are credited to you."
              : "Link your Twitch account and your channel is verified instantly. Twitch already proves you own it."}
          </p>
          {twitch.length === 0 ? <TwitchLink linked={twitchLinked} /> : null}
        </div>
      </section>

      <section aria-labelledby="account-head" className="stack" style={{ gap: 14 }}>
        <h2 id="account-head" className="h2">
          Account
        </h2>
        <div className="card stack" style={{ gap: 18 }}>
          <form action="/auth/signout" method="post">
            <button type="submit" className="btn btn-ghost">
              Log out
            </button>
          </form>
          <hr className="divider" />
          <DeleteAccount username={profile.username} />
        </div>
      </section>
    </div>
  );
}
