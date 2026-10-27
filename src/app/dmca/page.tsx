import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "DMCA and copyright" };

export default function DmcaPage() {
  const hasAgent = Boolean(site.dmcaAgentName && site.dmcaAgentAddress);
  return (
    <div className="container page page-narrow">
      <article className="stack" style={{ gap: 8 }}>
        <h1 className="h1">DMCA and copyright</h1>
        <div className="prose">
          <p>
            4Ever respects the rights of creators and copyright owners. We don&apos;t host video files: every video
            plays from YouTube or Twitch. We do list them here, and we&apos;ll take a listing down when it infringes
            your rights.
          </p>

          <h2>The quick way</h2>
          <p>
            If you made the video, or it uses your work, the fastest route is the{" "}
            <Link href="/report">report form</Link>. Creators can ask for their own videos to come down at any time.
          </p>

          <h2>Formal DMCA notices</h2>
          <p>Send a written notice to our designated agent that includes:</p>
          <ol>
            <li>Your physical or electronic signature.</li>
            <li>The copyrighted work you believe is being infringed.</li>
            <li>The 4Ever page link(s) where the material appears.</li>
            <li>Your name, address, phone number and email.</li>
            <li>
              A statement that you have a good-faith belief the use isn&apos;t authorized by the copyright owner, its
              agent, or the law.
            </li>
            <li>
              A statement, under penalty of perjury, that the information in your notice is accurate and that you are
              the copyright owner or authorized to act for them.
            </li>
          </ol>

          <h2>Designated agent</h2>
          {hasAgent ? (
            <p>
              {site.dmcaAgentName}
              <br />
              {site.dmcaAgentAddress}
              <br />
              <a href={`mailto:${site.dmcaEmail}`}>{site.dmcaEmail}</a>
            </p>
          ) : (
            <p>
              Email <a href={`mailto:${site.dmcaEmail}`}>{site.dmcaEmail}</a>.
            </p>
          )}

          <h2>Counter-notices</h2>
          <p>
            If your listing was removed and you believe that was a mistake, you can send a counter-notice to the same
            address with your signature, the removed page&apos;s link, a statement under penalty of perjury that you
            believe it was removed by mistake or misidentification, your name, address and phone number, and your
            consent to the jurisdiction of the federal court for your district (or, outside the U.S., any judicial
            district where 4Ever may be found).
          </p>

          <h2>Repeat infringers</h2>
          <p>Accounts that repeatedly submit infringing material will be closed.</p>

          <h2>The video itself</h2>
          <p>
            Removing a listing takes it off 4Ever. To remove the video from YouTube or Twitch, contact that platform
            directly through its own copyright process.
          </p>
        </div>
      </article>
    </div>
  );
}
