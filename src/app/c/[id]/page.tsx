import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteComment } from "@/app/actions/clip";
import { MiniClip } from "@/components/clip-card";
import { ClipActions } from "@/components/clip-actions";
import { CommentForm } from "@/components/comment-form";
import { ChevronRightIcon, ExternalIcon, EyeIcon, InfoIcon, TrashIcon } from "@/components/icons";
import { Avatar, VerifiedMark } from "@/components/people";
import { VideoPlayer } from "@/components/video-player";
import { ContestCard } from "@/components/widgets";
import { getViewer } from "@/lib/auth";
import { categoryLabel, musicLabel } from "@/lib/categories";
import { contestPhase } from "@/lib/contests";
import { formatCount, formatDate, formatDuration, timeAgo } from "@/lib/format";
import {
  getClipByShortId,
  getComments,
  getMoreFromSameSource,
  getSpotlightContest,
  getViewerClipState,
} from "@/lib/queries";
import { rarityClass } from "@/lib/rarity";
import { site } from "@/lib/site";
import { platformLabel } from "@/lib/video";

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const clip = await getClipByShortId(id);
  if (!clip) return { title: "Not found" };
  const by = clip.creator?.display_name ?? clip.channel_name;
  const description = `${clip.kind === "movie" ? "A movie" : "A clip"} by ${by} · ${categoryLabel(clip.category)} · on ${site.name}`;
  return {
    title: clip.title,
    description,
    alternates: { canonical: `/c/${clip.short_id}` },
    robots: clip.status === "approved" ? undefined : { index: false, follow: false },
    openGraph: {
      type: "video.other",
      title: clip.title,
      description,
      url: `/c/${clip.short_id}`,
      images: clip.thumbnail_url ? [{ url: clip.thumbnail_url }] : undefined,
    },
    twitter: { card: "summary_large_image", title: clip.title, description },
  };
}

export default async function ClipPage({
  params,
  searchParams,
}: Params & { searchParams: Promise<{ submitted?: string }> }) {
  const { id } = await params;
  const { submitted } = await searchParams;
  const clip = await getClipByShortId(id);
  if (!clip) notFound();

  const viewer = await getViewer();
  const approved = clip.status === "approved";
  const isSubmitter = viewer?.userId === clip.submitted_by;

  const [state, comments, more, contest] = await Promise.all([
    getViewerClipState(clip.id, viewer?.userId ?? null),
    approved ? getComments(clip.id) : Promise.resolve([]),
    getMoreFromSameSource(clip, 4),
    getSpotlightContest(),
  ]);

  const duration = formatDuration(clip.duration_seconds);
  const sharedBy = clip.submitter && clip.submitter.id !== clip.creator?.id ? clip.submitter : null;
  const sourceName = platformLabel(clip.platform);

  return (
    <div className="container page" style={{ gap: 22, paddingTop: 22 }}>
      <nav aria-label="Breadcrumb" className="row small muted" style={{ gap: 8 }}>
        <Link href={`/browse?kind=${clip.kind}`} style={{ textDecoration: "none" }}>
          {clip.kind === "movie" ? "Movies" : "Clips"}
        </Link>
        <ChevronRightIcon size={12} />
        <Link href={`/browse?cat=${clip.category}`} style={{ textDecoration: "none" }}>
          {categoryLabel(clip.category)}
        </Link>
      </nav>

      {clip.status === "pending" && isSubmitter ? (
        <div className="notice notice-ok" role="status">
          <strong style={{ color: "var(--text)" }}>{submitted ? "Submitted! " : ""}It&apos;s in the review queue.</strong>
          <span>Only you and the curators can see this page until it&apos;s approved.</span>
        </div>
      ) : null}
      {clip.status === "rejected" && (isSubmitter || viewer?.isCurator) ? (
        <div className="notice notice-warn" role="status">
          <strong style={{ color: "var(--text)" }}>This one wasn&apos;t approved.</strong>
          <span>{clip.review_note ?? "It didn't fit the site's rules."}</span>
          <Link href="/rules">Read the rules</Link>
        </div>
      ) : null}
      {clip.status === "removed" ? (
        <div className="notice notice-error" role="status">
          <strong style={{ color: "var(--text)" }}>This video was removed.</strong>
          <span>{clip.review_note ?? "It's no longer listed on 4Ever."}</span>
        </div>
      ) : null}
      {viewer?.isCurator && clip.status === "pending" ? (
        <div className="notice" role="status">
          Waiting for review. <Link href="/admin">Open the review queue</Link>
        </div>
      ) : null}

      <div className="split">
        <div className="split-main stack-lg" style={{ gap: 24 }}>
          <VideoPlayer
            clipId={clip.id}
            shortId={clip.short_id}
            sourceType={clip.source_type}
            sourceId={clip.source_id}
            platform={clip.platform}
            title={clip.title}
            thumbnailUrl={clip.thumbnail_url}
            duration={duration}
            countView={approved}
          />

          <div className="row-between" style={{ alignItems: "flex-end" }}>
            <div className="stack-sm" style={{ flex: "1 1 420px", minWidth: 0, gap: 10 }}>
              <span className="eyebrow">
                {clip.kind === "movie" ? "Movie" : "Clip"} · {categoryLabel(clip.category)}
              </span>
              <h1 className={`h1 ${rarityClass(clip.view_count)}`} style={{ fontSize: "clamp(26px, 3.4vw, 36px)", overflowWrap: "anywhere" }}>
                {clip.title}
              </h1>
              <span className="row small muted" style={{ gap: "4px 14px" }}>
                {duration ? <span>{duration}</span> : null}
                <span>Posted {formatDate(clip.published_at ?? clip.created_at)}</span>
                <span className="icon-stat">
                  <EyeIcon size={14} /> {formatCount(clip.view_count)} {clip.view_count === 1 ? "view" : "views"}
                </span>
              </span>
            </div>
            {approved ? (
              <ClipActions
                clipId={clip.id}
                shortId={clip.short_id}
                loggedIn={Boolean(viewer)}
                voted={state.voted}
                votes={clip.vote_count}
                favorited={state.favorited}
              />
            ) : null}
          </div>

          <section aria-label="Credits" className="card" style={{ padding: 0, display: "flex", flexWrap: "wrap", overflow: "hidden" }}>
            <div className="row" style={{ flex: "1 1 340px", padding: "20px 22px", gap: 14, flexWrap: "nowrap", borderRight: "1px solid var(--line)" }}>
              {clip.creator ? (
                <>
                  <Avatar name={clip.creator.display_name} src={clip.creator.avatar_url} size={54} />
                  <div className="stack-sm" style={{ gap: 2, minWidth: 0, flex: 1 }}>
                    <span className="tiny faint" style={{ fontWeight: 800, letterSpacing: "0.12em" }}>
                      CREATOR
                    </span>
                    <Link href={`/u/${clip.creator.username}`} className="row" style={{ gap: 6, color: "var(--text)", textDecoration: "none", fontWeight: 800, fontSize: 17 }}>
                      {clip.creator.display_name} <VerifiedMark size={17} />
                    </Link>
                    <span className="small muted">
                      Verified {sourceName} channel: {clip.channel_name}
                    </span>
                  </div>
                  <Link href={`/u/${clip.creator.username}`} className="btn btn-ghost btn-sm">
                    Profile
                  </Link>
                </>
              ) : (
                <>
                  <Avatar name={clip.channel_name} size={54} />
                  <div className="stack-sm" style={{ gap: 2, minWidth: 0, flex: 1 }}>
                    <span className="tiny faint" style={{ fontWeight: 800, letterSpacing: "0.12em" }}>
                      CREATOR
                    </span>
                    <span style={{ color: "var(--text)", fontWeight: 800, fontSize: 17 }}>{clip.channel_name}</span>
                    <span className="small muted">
                      {sourceName} channel · not claimed on 4Ever yet ·{" "}
                      <Link href={`/claim?clip=${clip.short_id}`}>Is this you?</Link>
                    </span>
                  </div>
                  {clip.channel_url ? (
                    <a href={clip.channel_url} className="btn btn-ghost btn-sm" target="_blank" rel="noopener noreferrer nofollow">
                      Channel <ExternalIcon size={14} />
                    </a>
                  ) : null}
                </>
              )}
            </div>
            <dl style={{ flex: "1 1 280px", margin: 0, padding: "18px 22px", display: "grid", gridTemplateColumns: "auto 1fr", gap: "8px 18px", fontSize: 14 }}>
              {sharedBy ? (
                <>
                  <dt className="muted">Shared by</dt>
                  <dd style={{ margin: 0 }}>
                    <Link href={`/u/${sharedBy.username}`} style={{ textDecoration: "none", fontWeight: 700 }}>
                      {sharedBy.display_name}
                    </Link>
                  </dd>
                </>
              ) : null}
              <dt className="muted">Music</dt>
              <dd style={{ margin: 0, color: "var(--text-2)" }}>{musicLabel(clip.music_source, clip.music_credit)}</dd>
              <dt className="muted">Source</dt>
              <dd style={{ margin: 0 }}>
                <a href={clip.source_url} target="_blank" rel="noopener noreferrer nofollow" className="row" style={{ gap: 6, display: "inline-flex", textDecoration: "none", fontWeight: 700 }}>
                  Watch on {sourceName} <ExternalIcon size={13} />
                </a>
              </dd>
            </dl>
          </section>

          {clip.description ? <p className="prose pre-line" style={{ margin: 0 }}>{clip.description}</p> : null}

          {clip.tags.length > 0 ? (
            <div className="chips">
              {clip.tags.map((tag) => (
                <Link key={tag} href={`/browse?tag=${tag}`} className="tag">
                  #{tag}
                </Link>
              ))}
            </div>
          ) : null}

          <div className="notice">
            <InfoIcon size={17} />
            <span style={{ flex: "1 1 260px" }}>Credit always goes to the channel that uploaded the video.</span>
            <Link href={`/claim?clip=${clip.short_id}`} style={{ fontWeight: 700, textDecoration: "none" }}>
              This is my video
            </Link>
            <Link href={`/report?clip=${clip.short_id}`} style={{ fontWeight: 700, color: "var(--text-3)", textDecoration: "none" }}>
              Report or request removal
            </Link>
          </div>

          {approved ? (
            <section aria-labelledby="comments" className="stack" style={{ gap: 14 }}>
              <h2 id="comments" className="h2" style={{ fontSize: 24 }}>
                Comments <span className="muted" style={{ fontFamily: "var(--font-body)", fontSize: 16 }}>{comments.length}</span>
              </h2>
              {viewer ? (
                <CommentForm clipId={clip.id} shortId={clip.short_id} />
              ) : (
                <div className="notice">
                  <Link href={`/login?next=${encodeURIComponent(`/c/${clip.short_id}`)}`}>Log in</Link> to join the
                  conversation.
                </div>
              )}
              <div>
                {comments.map((comment) => {
                  const canDelete = viewer && (viewer.userId === comment.user_id || viewer.isCurator);
                  return (
                    <article key={comment.id} className="comment">
                      <Avatar name={comment.author?.display_name ?? "?"} src={comment.author?.avatar_url} size={40} />
                      <div className="stack-sm" style={{ gap: 3, minWidth: 0, flex: 1 }}>
                        <span className="small">
                          {comment.author ? (
                            <Link href={`/u/${comment.author.username}`} style={{ textDecoration: "none", fontWeight: 800, color: "var(--text)" }}>
                              {comment.author.display_name}
                            </Link>
                          ) : (
                            <strong>Someone</strong>
                          )}
                          <span className="faint"> · {timeAgo(comment.created_at)}</span>
                        </span>
                        <p>{comment.body}</p>
                      </div>
                      {canDelete ? (
                        <form action={deleteComment}>
                          <input type="hidden" name="commentId" value={comment.id} />
                          <input type="hidden" name="shortId" value={clip.short_id} />
                          <button type="submit" className="btn btn-ghost btn-sm" aria-label="Delete comment" title="Delete comment">
                            <TrashIcon size={15} />
                          </button>
                        </form>
                      ) : null}
                    </article>
                  );
                })}
                {comments.length === 0 ? <p className="muted small">No comments yet. Be the first.</p> : null}
              </div>
            </section>
          ) : null}
        </div>

        <aside className="split-aside" style={{ gap: 14 }}>
          {more.length > 0 ? (
            <>
              <h2 className="h3">More from {clip.creator?.display_name ?? clip.channel_name}</h2>
              {more.map((m) => (
                <MiniClip key={m.id} clip={m} />
              ))}
            </>
          ) : null}
          {contest && contestPhase(contest) !== "ended" ? (
            <div style={{ marginTop: more.length > 0 ? 8 : 0 }}>
              <ContestCard contest={contest} compact />
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
