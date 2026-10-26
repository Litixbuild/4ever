import Link from "next/link";
import { approveClip, rejectClip } from "@/app/admin/actions";
import { AdminNotice } from "@/components/admin-notice";
import { ExternalIcon } from "@/components/icons";
import { VerifiedMark } from "@/components/people";
import { VideoPlayer } from "@/components/video-player";
import { CATEGORIES, musicLabel } from "@/lib/categories";
import { formatDuration, timeAgo } from "@/lib/format";
import { requireCurator } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CLIP_COLUMNS, type Clip } from "@/lib/types";
import { platformLabel } from "@/lib/video";

const REJECT_REASONS = [
  "Not World of Warcraft.",
  "Low effort or very short.",
  "Uses music the creator may not have the rights to.",
  "Breaks the community rules.",
  "Duplicate or reupload of someone else's video.",
];

export default async function ReviewQueuePage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  await requireCurator();
  const { notice } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase
    .from("clips")
    .select(CLIP_COLUMNS)
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(30);
  const clips = (data ?? []) as unknown as Clip[];

  return (
    <div className="stack-lg">
      <AdminNotice notice={notice} />
      {clips.length === 0 ? (
        <div className="empty">
          <h2 className="h3">All caught up</h2>
          <p className="muted" style={{ margin: 0 }}>
            No submissions waiting for review.
          </p>
        </div>
      ) : null}

      {clips.map((clip) => (
        <article key={clip.id} className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="split" style={{ gap: 0 }}>
            <div style={{ flex: "1 1 420px", minWidth: 0, padding: 16 }}>
              <VideoPlayer
                clipId={clip.id}
                shortId={clip.short_id}
                sourceType={clip.source_type}
                sourceId={clip.source_id}
                platform={clip.platform}
                title={clip.title}
                thumbnailUrl={clip.thumbnail_url}
                duration={formatDuration(clip.duration_seconds)}
                countView={false}
              />
            </div>
            <div className="stack" style={{ flex: "1 1 360px", minWidth: 0, padding: "20px 22px", gap: 14 }}>
              <div className="stack-sm" style={{ gap: 4 }}>
                <span className="tiny faint">
                  Submitted {timeAgo(clip.created_at)} by{" "}
                  {clip.submitter ? <Link href={`/u/${clip.submitter.username}`}>{clip.submitter.display_name}</Link> : "someone"}
                </span>
                <h2 className="h3" style={{ fontSize: 18 }}>
                  <Link href={`/c/${clip.short_id}`} style={{ color: "var(--text)" }}>
                    {clip.title}
                  </Link>
                </h2>
                <span className="small row" style={{ gap: 6 }}>
                  {clip.channel_name} on {platformLabel(clip.platform)}
                  {clip.creator ? <VerifiedMark size={14} label="Verified creator on 4Ever" /> : null}
                  <a href={clip.source_url} target="_blank" rel="noopener noreferrer nofollow" className="row" style={{ gap: 4, display: "inline-flex" }}>
                    source <ExternalIcon size={12} />
                  </a>
                </span>
              </div>
              <dl style={{ margin: 0, display: "grid", gridTemplateColumns: "auto 1fr", gap: "6px 14px", fontSize: 14 }}>
                <dt className="muted">Music</dt>
                <dd style={{ margin: 0 }}>{musicLabel(clip.music_source, clip.music_credit)}</dd>
                {clip.tags.length > 0 ? (
                  <>
                    <dt className="muted">Tags</dt>
                    <dd style={{ margin: 0 }}>{clip.tags.map((t) => `#${t}`).join(" ")}</dd>
                  </>
                ) : null}
                {clip.description ? (
                  <>
                    <dt className="muted">Notes</dt>
                    <dd className="pre-line" style={{ margin: 0 }}>{clip.description}</dd>
                  </>
                ) : null}
              </dl>

              <form action={approveClip} className="stack-sm" style={{ gap: 10 }}>
                <input type="hidden" name="clipId" value={clip.id} />
                <input type="hidden" name="returnTo" value="/admin" />
                <div className="row" style={{ gap: 10 }}>
                  <label className="sr-only" htmlFor={`kind-${clip.id}`}>
                    Type
                  </label>
                  <select id={`kind-${clip.id}`} name="kind" className="select" defaultValue={clip.kind} style={{ flex: "1 1 120px", width: "auto" }}>
                    <option value="movie">Movie</option>
                    <option value="clip">Clip</option>
                  </select>
                  <label className="sr-only" htmlFor={`cat-${clip.id}`}>
                    Category
                  </label>
                  <select id={`cat-${clip.id}`} name="category" className="select" defaultValue={clip.category} style={{ flex: "1 1 160px", width: "auto" }}>
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="btn btn-gold">
                  Approve
                </button>
              </form>

              <details>
                <summary className="small" style={{ cursor: "pointer", color: "var(--text-3)", fontWeight: 700 }}>
                  Reject with a note
                </summary>
                <form action={rejectClip} className="stack-sm" style={{ gap: 10, marginTop: 10 }}>
                  <input type="hidden" name="clipId" value={clip.id} />
                  <input type="hidden" name="returnTo" value="/admin" />
                  <label className="sr-only" htmlFor={`reason-${clip.id}`}>
                    Reason
                  </label>
                  <select id={`reason-${clip.id}`} name="reason" className="select" defaultValue={REJECT_REASONS[0]}>
                    {REJECT_REASONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                  <label className="sr-only" htmlFor={`note-${clip.id}`}>
                    Note for the submitter
                  </label>
                  <input id={`note-${clip.id}`} name="note" className="input" placeholder="Optional note for the submitter" maxLength={400} />
                  <button type="submit" className="btn btn-danger">
                    Reject
                  </button>
                </form>
              </details>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
