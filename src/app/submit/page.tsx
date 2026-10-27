import type { Metadata } from "next";
import Link from "next/link";
import { CheckIcon, XIcon } from "@/components/icons";
import { SubmitForm } from "@/components/submit-form";
import { requireViewer } from "@/lib/auth";
import { getChannels } from "@/lib/queries";
import { platformLabel } from "@/lib/video";

export const metadata: Metadata = { title: "Submit a clip" };

export default async function SubmitPage() {
  const viewer = await requireViewer("/submit");
  const channels = await getChannels(viewer.userId);
  const verified = channels.filter((c) => c.verified_at);

  return (
    <div className="container page" style={{ gap: 28, paddingTop: 36 }}>
      <div className="stack" style={{ gap: 8, maxWidth: 720 }}>
        <h1 className="h1">Share a movie or clip</h1>
        <p className="lead">
          Paste a link from YouTube or Twitch. We pull in the real creator automatically, so credit always lands in the
          right place.
        </p>
      </div>

      <div className="split" style={{ gap: 32 }}>
        <div className="split-main">
          <SubmitForm verifiedChannels={verified.map((c) => ({ platform: c.platform, channel_id: c.channel_id }))} />
        </div>

        <aside className="split-aside" style={{ gap: 18 }}>
          <section aria-labelledby="your-channels" className="card stack" style={{ gap: 12 }}>
            <h2 id="your-channels" className="h-gold">
              Your channels
            </h2>
            {verified.length > 0 ? (
              <ul className="list-plain stack-sm">
                {verified.map((c) => (
                  <li key={c.id} className="row small" style={{ gap: 8 }}>
                    <CheckIcon size={15} style={{ color: "var(--green)" }} />
                    {c.channel_name} <span className="muted">on {platformLabel(c.platform)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="small muted" style={{ margin: 0 }}>
                None verified yet. Verify your YouTube or Twitch channel and everything you&apos;ve made gets your name
                and a verified check.
              </p>
            )}
            <Link href="/settings#channels" className="btn btn-ghost">
              {verified.length > 0 ? "Manage channels" : "Verify a channel"}
            </Link>
          </section>

          <section aria-labelledby="music-safe" className="wow-tip" style={{ gap: 12, padding: "18px 20px 20px" }}>
            <h2 id="music-safe" className="tip-title" style={{ color: "#fff" }}>
              Music that&apos;s safe to use
            </h2>
            <ul className="list-plain stack-sm" style={{ gap: 10, fontSize: 14 }}>
              <li className="row" style={{ gap: 10, flexWrap: "nowrap" }}>
                <CheckIcon size={16} style={{ color: "var(--green)" }} /> Music you made yourself
              </li>
              <li className="row" style={{ gap: 10, flexWrap: "nowrap" }}>
                <CheckIcon size={16} style={{ color: "var(--green)" }} /> The game&apos;s own soundtrack
              </li>
              <li className="row" style={{ gap: 10, flexWrap: "nowrap" }}>
                <CheckIcon size={16} style={{ color: "var(--green)" }} /> Royalty-free tracks, credited
              </li>
              <li className="row" style={{ gap: 10, flexWrap: "nowrap" }}>
                <XIcon size={16} style={{ color: "var(--red)" }} /> Chart songs you don&apos;t have rights to
              </li>
            </ul>
            <Link href="/music-guide" className="tip-flavor" style={{ fontWeight: 700, textDecoration: "none" }}>
              Read the full music guide
            </Link>
          </section>

          <section aria-labelledby="whats-next" className="card stack" style={{ gap: 14 }}>
            <h2 id="whats-next" className="h-gold">
              What happens next
            </h2>
            <ol className="list-plain stack-sm small" style={{ gap: 12, color: "var(--text-3)" }}>
              <li className="row" style={{ gap: 12, flexWrap: "nowrap", alignItems: "baseline" }}>
                <span className="numeral" style={{ fontSize: 16, width: 22 }}>
                  I
                </span>{" "}
                A curator checks it fits the site.
              </li>
              <li className="row" style={{ gap: 12, flexWrap: "nowrap", alignItems: "baseline" }}>
                <span className="numeral" style={{ fontSize: 16, width: 22 }}>
                  II
                </span>{" "}
                It goes live in Fresh from Azeroth.
              </li>
              <li className="row" style={{ gap: 12, flexWrap: "nowrap", alignItems: "baseline" }}>
                <span className="numeral" style={{ fontSize: 16, width: 22 }}>
                  III
                </span>{" "}
                As people watch, its title color climbs from white to green, blue, purple and orange.
              </li>
            </ol>
          </section>
        </aside>
      </div>
    </div>
  );
}
