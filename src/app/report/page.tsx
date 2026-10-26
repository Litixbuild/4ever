import type { Metadata } from "next";
import { MiniClip } from "@/components/clip-card";
import { ReportForm } from "@/components/report-form";
import { getViewer } from "@/lib/auth";
import { getClipByShortId } from "@/lib/queries";

export const metadata: Metadata = { title: "Report a video", robots: { index: false } };

export default async function ReportPage({ searchParams }: { searchParams: Promise<{ clip?: string; reason?: string }> }) {
  const { clip: shortId, reason } = await searchParams;
  const [clip, viewer] = await Promise.all([shortId ? getClipByShortId(shortId) : null, getViewer()]);

  return (
    <div className="container page page-narrow" style={{ gap: 24 }}>
      <div className="stack" style={{ gap: 8 }}>
        <span className="eyebrow">Report</span>
        <h1 className="h1">Report or request removal</h1>
        <p className="lead">
          Creators can ask for their own videos to come down at any time, no questions asked. Everything else gets
          checked by a curator.
        </p>
      </div>
      {clip ? <MiniClip clip={clip} /> : null}
      <ReportForm clip={clip?.short_id ?? ""} defaultReason={reason ?? ""} loggedIn={Boolean(viewer)} />
    </div>
  );
}
