import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Music guide",
  description: "What music is safe to use in your World of Warcraft movies, and how to credit it on 4Everclips.",
};

export default function MusicGuidePage() {
  return (
    <div className="container page page-narrow">
      <article className="stack" style={{ gap: 8 }}>
        <h1 className="h1">The music guide</h1>
        <div className="prose">
          <p>
            Music is half of what made the old PvP movies great. It&apos;s also the number one reason videos get muted,
            blocked or taken down. Here&apos;s how to keep yours up.
          </p>

          <h2>Why it matters here</h2>
          <p>
            4Ever doesn&apos;t host your video. It plays straight from YouTube or Twitch. If YouTube mutes or removes
            your video over a song, it breaks here too. Picking safe music protects your channel and your spot on the
            front page.
          </p>

          <h2>Safe choices</h2>
          <ul className="ticks">
            <li>
              <strong>Music you made yourself.</strong> The safest option, and the one that makes a movie feel like
              yours.
            </li>
            <li>
              <strong>The game&apos;s own soundtrack and sounds.</strong> Blizzard&apos;s video policy lets fans use
              footage, music and sounds from their games in videos that are free to watch. Read the policy on
              Blizzard&apos;s site for the details and limits.
            </li>
            <li>
              <strong>Royalty-free or licensed tracks.</strong> Libraries like the free YouTube Audio Library, or a paid
              service whose license covers online video. Read the license, follow its credit rules, and add the credit
              when you submit.
            </li>
            <li>
              <strong>Tracks an artist gave you permission to use.</strong> Get it in writing (an email or DM is fine)
              and keep it somewhere safe.
            </li>
          </ul>

          <h2>Risky choices</h2>
          <ul className="crosses">
            <li>Popular songs from artists and labels, even short pieces of them.</li>
            <li>Covers and remixes of songs you don&apos;t have rights to. The original song is still protected.</li>
            <li>
              &ldquo;No copyright intended&rdquo; in the description. It doesn&apos;t change anything, legally or with
              YouTube&apos;s systems.
            </li>
          </ul>

          <h2>Crediting music on 4Ever</h2>
          <p>
            When you submit, pick what kind of music is in the video. If it&apos;s a licensed or royalty-free track, add
            the track name, the artist, and where it&apos;s licensed from. That credit shows on your video&apos;s page.
          </p>

          <h2>If something goes wrong</h2>
          <p>
            If a rights holder contacts us, we take the listing down from 4Ever and let you know. Your video on YouTube
            or Twitch is between you and that platform. Questions? Reach us at{" "}
            <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>.
          </p>
          <p className="small muted">
            This guide is general information to help you pick safer music, not legal advice.
          </p>
          <p>
            <Link href="/submit" className="btn btn-gold">
              Submit a Clip
            </Link>
          </p>
        </div>
      </article>
    </div>
  );
}
