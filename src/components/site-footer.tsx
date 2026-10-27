import Link from "next/link";
import { Emblem } from "@/components/brand";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-row">
        <div className="stack-sm" style={{ flex: "1 1 340px", maxWidth: 520, gap: 12 }}>
          <span className="row" style={{ gap: 10 }}>
            <Emblem size={24} />
            <span className="logo-word" style={{ fontSize: 19 }}>
              4EVER
            </span>
          </span>
          <p className="small muted" style={{ margin: 0 }}>
            A fan-made home for World of Warcraft movies and clips. Not affiliated with or endorsed by Blizzard
            Entertainment. World of Warcraft is a trademark of Blizzard Entertainment, Inc. Videos are embedded from
            their original platforms and belong to their creators.
          </p>
          <p className="tiny faint" style={{ margin: 0 }}>
            Title colors show how many people have watched a video here, from white to green, blue, purple and orange.
          </p>
        </div>
        <nav aria-label="Footer" className="footer-cols">
          <div className="stack-sm" style={{ gap: 10 }}>
            <span className="footer-head">Community</span>
            <Link href="/browse">Browse</Link>
            <Link href="/contests">Contests</Link>
            <Link href="/creators">Creators</Link>
            <Link href="/hall-of-fame">Hall of Fame</Link>
          </div>
          <div className="stack-sm" style={{ gap: 10 }}>
            <span className="footer-head">Creators</span>
            <Link href="/submit">Submit a clip</Link>
            <Link href="/music-guide">Music guide</Link>
            <Link href="/rules">Submission rules</Link>
            <Link href="/settings">Verify your channel</Link>
          </div>
          <div className="stack-sm" style={{ gap: 10 }}>
            <span className="footer-head">Legal</span>
            <Link href="/terms">Terms</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/dmca">DMCA</Link>
            <Link href="/report">Report a video</Link>
          </div>
        </nav>
      </div>
    </footer>
  );
}
