import Link from "next/link";
import { resolveReport } from "@/app/admin/actions";
import { AdminNotice } from "@/components/admin-notice";
import { timeAgo } from "@/lib/format";
import { requireCurator } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const REASON_LABELS: Record<string, string> = {
  my_video_remove: "Creator wants it removed",
  copyright: "Copyright",
  wrong_credit: "Wrong credit",
  inappropriate: "Inappropriate",
  spam: "Spam / not WoW",
  other: "Other",
};

type ReportRow = {
  id: string;
  reason: string;
  details: string | null;
  contact_email: string | null;
  created_at: string;
  clip: { short_id: string; title: string; status: string; channel_name: string } | null;
  reporter: { username: string; display_name: string } | null;
};

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  await requireCurator();
  const { notice } = await searchParams;
  // The layout already checked this visitor is a curator. Reports are private, so read them with the admin client.
  const admin = createAdminClient();
  const { data } = await admin
    .from("reports")
    .select(
      "id, reason, details, contact_email, created_at, clip:clips ( short_id, title, status, channel_name ), reporter:profiles!reports_reporter_id_fkey ( username, display_name )",
    )
    .eq("status", "open")
    .order("created_at", { ascending: true })
    .limit(100);
  const reports = (data ?? []) as unknown as ReportRow[];

  return (
    <div className="stack-lg">
      <AdminNotice notice={notice} />
      {reports.length === 0 ? (
        <div className="empty">
          <h2 className="h3">No open reports</h2>
          <p className="muted" style={{ margin: 0 }}>
            Nice and quiet.
          </p>
        </div>
      ) : (
        <div className="stack">
          {reports.map((report) => (
            <article key={report.id} className="card stack" style={{ gap: 12 }}>
              <div className="row-between" style={{ alignItems: "center" }}>
                <span className={`pill ${report.reason === "my_video_remove" || report.reason === "copyright" ? "pill-red" : "pill-muted"}`}>
                  {REASON_LABELS[report.reason] ?? report.reason}
                </span>
                <span className="tiny faint">{timeAgo(report.created_at)}</span>
              </div>
              {report.clip ? (
                <p style={{ margin: 0 }}>
                  <Link href={`/c/${report.clip.short_id}`} style={{ fontWeight: 800 }}>
                    {report.clip.title}
                  </Link>{" "}
                  <span className="muted small">
                    · {report.clip.channel_name} · currently {report.clip.status}
                  </span>
                </p>
              ) : (
                <p className="muted small" style={{ margin: 0 }}>
                  Not tied to a specific video.
                </p>
              )}
              {report.details ? (
                <p className="pre-line" style={{ margin: 0, color: "var(--text-2)" }}>
                  {report.details}
                </p>
              ) : null}
              <p className="small muted" style={{ margin: 0 }}>
                From {report.reporter ? <Link href={`/u/${report.reporter.username}`}>{report.reporter.display_name}</Link> : "a visitor"}
                {report.contact_email ? (
                  <>
                    {" "}
                    · <a href={`mailto:${report.contact_email}`}>{report.contact_email}</a>
                  </>
                ) : null}
              </p>
              <div className="row">
                {report.clip && report.clip.status !== "removed" ? (
                  <form action={resolveReport}>
                    <input type="hidden" name="reportId" value={report.id} />
                    <input type="hidden" name="outcome" value="removed" />
                    <input type="hidden" name="returnTo" value="/admin/reports" />
                    <button type="submit" className="btn btn-danger">
                      Remove video and close
                    </button>
                  </form>
                ) : null}
                <form action={resolveReport}>
                  <input type="hidden" name="reportId" value={report.id} />
                  <input type="hidden" name="outcome" value="resolved" />
                  <input type="hidden" name="returnTo" value="/admin/reports" />
                  <button type="submit" className="btn btn-ghost">
                    Mark handled
                  </button>
                </form>
                <form action={resolveReport}>
                  <input type="hidden" name="reportId" value={report.id} />
                  <input type="hidden" name="outcome" value="dismissed" />
                  <input type="hidden" name="returnTo" value="/admin/reports" />
                  <button type="submit" className="btn btn-ghost">
                    Dismiss
                  </button>
                </form>
              </div>
            </article>
          ))}
        </div>
      )}
      <p className="small muted" style={{ margin: 0 }}>
        Creator removal requests and copyright reports should be handled quickly. Removing a video takes it off 4Ever; it
        stays on YouTube or Twitch, which is the creator&apos;s call.
      </p>
    </div>
  );
}
