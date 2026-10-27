import type { Metadata } from "next";
import Link from "next/link";
import { TrophyIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Contests" };

// Contests are on hold until launch settles. The old contest pages live in git history.
export default function ContestsPage() {
  return (
    <div className="container page page-narrow" style={{ gap: 28 }}>
      <div className="page-head">
        <h1 className="h1">Contests</h1>
        <p className="lead">Contests are coming soon. We&apos;ll announce the first one here.</p>
      </div>
      <div className="slot">
        <span className="slot-icon">
          <TrophyIcon size={26} />
        </span>
        <span className="stack-sm" style={{ gap: 4 }}>
          <strong>Coming soon</strong>
          <span className="muted small">
            In the meantime, keep recording. Anything you <Link href="/submit">share now</Link> builds your profile for
            when they start.
          </span>
        </span>
      </div>
    </div>
  );
}
