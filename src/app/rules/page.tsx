import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Submission rules",
  description: "What belongs on 4Everclips and how credit, music and contests work.",
};

export default function RulesPage() {
  return (
    <div className="container page page-narrow">
      <article className="stack" style={{ gap: 8 }}>
        <h1 className="h1">Submission rules</h1>
        <div className="prose">
          <p>
            4Ever is a home for World of Warcraft movies and clips, made by players for players. A few simple rules keep
            it worth visiting.
          </p>

          <h2 id="what-belongs">What belongs here</h2>
          <ul>
            <li>World of Warcraft videos, with World of Warcraft: Forever front and center.</li>
            <li>PvP movies, raid kills, duels, machinima, funny moments, lore pieces, leveling stories.</li>
            <li>
              Movies are edited pieces with cuts, music and a story. Clips are single moments straight from a stream or
              recording. Both are welcome.
            </li>
          </ul>

          <h2 id="credit">Credit</h2>
          <ul>
            <li>
              Credit always goes to the channel that uploaded the video. We read it from YouTube or Twitch directly.
            </li>
            <li>
              Sharing someone else&apos;s video is fine. Reuploading it to your own channel and submitting that is not.
            </li>
            <li>
              Creators can verify their channel in <Link href="/settings#channels">Settings</Link> to get the verified
              check, and can ask for any of their videos to come down at any time.
            </li>
          </ul>

          <h2 id="music">Music</h2>
          <p>
            Only use music you have the rights to. Tell us what&apos;s in the video when you submit, and credit licensed
            tracks. The <Link href="/music-guide">music guide</Link> covers what&apos;s safe.
          </p>

          <h2 id="not-allowed">Not allowed</h2>
          <ul>
            <li>Harassment, hate, or targeting real people.</li>
            <li>Sexual or graphic content.</li>
            <li>Promoting cheats, bots, exploits, account selling or gold selling.</li>
            <li>Spam, misleading titles, or videos that aren&apos;t World of Warcraft.</li>
          </ul>

          <h2 id="review">Review and limits</h2>
          <ul>
            <li>Every submission is checked by a curator before it goes live. Curators have the final say.</li>
            <li>
              You can have up to {site.maxPendingSubmissions} videos waiting for review at once, and submit up to{" "}
              {site.maxSubmissionsPerDay} a day.
            </li>
          </ul>

          <h2 id="contests">Contests</h2>
          <ul>
            <li>Entries must come from your own verified channel. One entry per person per contest.</li>
            <li>Votes cast while a contest is open count toward its standings. Curators pick the winners.</li>
            <li>Vote for what you like. Organizing vote trading or using extra accounts gets entries removed.</li>
          </ul>

          <p>
            Found something that breaks these rules? Use the <Link href="/report">report form</Link>.
          </p>
        </div>
      </article>
    </div>
  );
}
