import type { Metadata } from "next";
import Link from "next/link";
import { MiniClip } from "@/components/clip-card";
import { CheckIcon } from "@/components/icons";
import { getViewer } from "@/lib/auth";
import { getChannels, getClipByShortId } from "@/lib/queries";
import { platformLabel } from "@/lib/video";

export const metadata: Metadata = { title: "Claim your video" };

export default async function ClaimPage({ searchParams }: { searchParams: Promise<{ clip?: string }> }) {
  const { clip: shortId } = await searchParams;
  const clip = shortId ? await getClipByShortId(shortId) : null;
  const viewer = await getViewer();
  const channels = viewer ? await getChannels(viewer.userId) : [];
  const alreadyYours = Boolean(clip && viewer && clip.creator_id === viewer.userId);
  const platform = clip ? platformLabel(clip.platform) : "YouTube or Twitch";

  return (
    <div className="container page page-narrow" style={{ gap: 28 }}>
      <div className="stack" style={{ gap: 8 }}>
        <span className="eyebrow">Claim your work</span>
        <h1 className="h1">Is this your video?</h1>
        <p className="lead">
          Credit on 4Ever comes from the channel that uploaded the video. Prove the channel is yours and every video from
          it gets your name and a verified check, automatically.
        </p>
      </div>

      {clip ? <MiniClip clip={clip} /> : null}

      {alreadyYours ? (
        <div className="notice notice-ok">
          <CheckIcon size={16} /> This one is already credited to you. Nothing else to do.
        </div>
      ) : (
        <ol className="steps" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          <li>
            <span className="numeral">I</span>
            <strong>{viewer ? "You're logged in" : "Log in"}</strong>
            <span className="small muted">
              {viewer ? (
                "Good, that part's done."
              ) : (
                <>
                  Use Discord, Twitch or Google. <Link href={`/login?next=${encodeURIComponent(`/claim${shortId ? `?clip=${shortId}` : ""}`)}`}>Log in</Link>
                </>
              )}
            </span>
          </li>
          <li>
            <span className="numeral">II</span>
            <strong>Verify your {platform} channel</strong>
            <span className="small muted">
              {clip?.platform === "twitch"
                ? "Link your Twitch account in Settings. It's verified instantly."
                : "Add a short code to your channel description, then press check. Takes about a minute."}{" "}
              {viewer ? <Link href="/settings#channels">Open Settings</Link> : null}
            </span>
          </li>
          <li>
            <span className="numeral">III</span>
            <strong>That&apos;s it</strong>
            <span className="small muted">
              This video and everything else from your channel moves to your profile with the verified check.
            </span>
          </li>
        </ol>
      )}

      {viewer && channels.some((c) => c.verified_at) && !alreadyYours && clip ? (
        <p className="notice">
          Your verified channels don&apos;t include {clip.channel_name}. If you upload under a different channel, verify
          that one too.
        </p>
      ) : null}

      <div className="card stack-sm">
        <h2 className="h3">Want it taken down instead?</h2>
        <p className="small muted" style={{ margin: 0 }}>
          No hard feelings. Send a removal request and a curator will take it off 4Ever.
        </p>
        <Link href={`/report${shortId ? `?clip=${shortId}&reason=my_video_remove` : ""}`} className="btn btn-ghost" style={{ alignSelf: "flex-start", marginTop: 6 }}>
          Request removal
        </Link>
      </div>
    </div>
  );
}
