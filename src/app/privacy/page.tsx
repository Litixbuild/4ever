import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <div className="container page page-narrow">
      <article className="stack" style={{ gap: 8 }}>
        <h1 className="h1">Privacy</h1>
        <div className="prose">
          <p className="small muted">Last updated October 2026</p>
          <p>We collect as little as we can to run the site. Here&apos;s exactly what, and why.</p>

          <h2>When you log in</h2>
          <p>
            You log in with an account you already have, like Discord, Twitch or Google. That service sends us your
            account name, profile picture and email address. We use the name and picture for your profile. Your email is
            kept by our login provider and is never shown on the site.
          </p>

          <h2>What you add</h2>
          <p>
            Your profile details (bio, character, realm, guild), the videos you submit, your votes, favorites and
            comments. Profiles, comments and favorites are public. Votes are counted publicly but not listed by name.
          </p>

          <h2>Channel verification</h2>
          <p>
            If you verify a YouTube channel, we read that channel&apos;s public name and description from YouTube to
            check your code. If you link Twitch, we save your Twitch channel id and name.
          </p>

          <h2>View counts</h2>
          <p>
            When you press play, we count a view. To count each person only once a day without tracking anyone, we store
            a one-way scrambled code built from your connection details and the date. We never store your IP address,
            and the code changes every day so it can&apos;t follow you around.
          </p>

          <h2>Reports</h2>
          <p>If you send a report and include an email, we only use it to follow up on that report.</p>

          <h2>Cookies</h2>
          <p>
            We use cookies only to keep you logged in. No advertising or analytics trackers. Video players from YouTube
            (in its privacy-enhanced mode) and Twitch only load after you press play, and they may set their own cookies
            under their own privacy policies.
          </p>

          <h2>Who helps us run the site</h2>
          <ul>
            <li>Supabase stores the database and handles logins.</li>
            <li>Netlify hosts the website.</li>
            <li>YouTube and Twitch provide video details and the players.</li>
          </ul>
          <p>We don&apos;t sell your information, and we don&apos;t share it for advertising.</p>

          <h2>Your choices</h2>
          <ul>
            <li>
              Edit your profile any time in <Link href="/settings">Settings</Link>.
            </li>
            <li>
              Delete your account in Settings. That removes your profile, votes, favorites and comments. Videos you
              shared stay up, credited to the channel that made them.
            </li>
            <li>
              Questions or requests: <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>
            </li>
          </ul>

          <h2>Kids</h2>
          <p>4Ever isn&apos;t for children under 13, and we don&apos;t knowingly collect their information.</p>
        </div>
      </article>
    </div>
  );
}
