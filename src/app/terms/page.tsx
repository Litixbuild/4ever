import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Terms of use" };

export default function TermsPage() {
  return (
    <div className="container page page-narrow">
      <article className="stack" style={{ gap: 8 }}>
        <h1 className="h1">Terms of use</h1>
        <div className="prose">
          <p className="small muted">Last updated October 2026</p>
          <p>
            These terms cover your use of {site.name} (&ldquo;4Ever&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;). By
            using the site you agree to them. If you don&apos;t agree, please don&apos;t use the site.
          </p>

          <h2>A fan site</h2>
          <p>
            4Ever is a fan-made community. It is not affiliated with, endorsed by, or sponsored by Blizzard
            Entertainment. World of Warcraft and related names are trademarks of Blizzard Entertainment, Inc.
          </p>

          <h2>Accounts</h2>
          <ul>
            <li>
              You log in with an account you already have, like Discord, Twitch or Google. Keep that account secure;
              you&apos;re responsible for what happens under it.
            </li>
            <li>You must be at least 13 years old to make an account.</li>
            <li>One person, one account. Don&apos;t impersonate anyone.</li>
          </ul>

          <h2>Videos you submit</h2>
          <ul>
            <li>
              4Ever doesn&apos;t host videos. We show the player from YouTube or Twitch along with the title, thumbnail,
              channel name and a link back to the original.
            </li>
            <li>
              When you submit a video, you confirm that you have the right to share it, including its music, or that
              it&apos;s already publicly available on YouTube or Twitch and you&apos;re sharing it with its real credit.
            </li>
            <li>
              You let us display and link to the video, and use its title and thumbnail on 4Ever and when promoting
              4Ever (for example, a &ldquo;Movie of the Week&rdquo; post) with credit to the creator.
            </li>
            <li>Creators can ask for their videos to be removed from 4Ever at any time.</li>
          </ul>

          <h2>Comments, votes and profiles</h2>
          <p>
            You own what you write. You let us show it on the site. Be decent: the{" "}
            <Link href="/rules">community rules</Link> apply everywhere on 4Ever, and we may remove anything that breaks
            them.
          </p>

          <h2>Contests</h2>
          <p>
            Each contest has its own rules and dates on its page. Curators pick winners and their decision is final. We
            may disqualify entries that break the rules or involve vote manipulation. Contests are void where
            prohibited.
          </p>

          <h2>Copyright</h2>
          <p>
            We respect copyright and respond to valid notices. See the <Link href="/dmca">DMCA page</Link> for how to
            send one. Accounts that repeatedly share infringing material will be closed.
          </p>

          <h2>Taking things down</h2>
          <p>
            We can remove content or suspend accounts that break these terms or the rules, or that we believe put the
            community or the site at risk.
          </p>

          <h2>No guarantees</h2>
          <p>
            4Ever is provided as is. We do our best to keep it running and accurate, but we can&apos;t promise it will
            always be available or error-free. To the extent the law allows, we aren&apos;t liable for indirect or
            consequential losses from using the site.
          </p>

          <h2>Changes</h2>
          <p>
            We may update these terms as the site grows. If the changes are significant, we&apos;ll post a notice on the
            site. Continuing to use 4Ever after a change means you accept it.
          </p>

          <h2>Contact</h2>
          <p>
            Questions about these terms: <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>
          </p>
        </div>
      </article>
    </div>
  );
}
