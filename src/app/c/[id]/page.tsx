import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteComment } from "@/app/actions/clip";
import { MiniClip } from "@/components/clip-card";
import { ClipActions } from "@/components/clip-actions";
import { CommentForm } from "@/components/comment-form";
import { ChevronRightIcon, ClockIcon, ExternalIcon, EyeIcon, TrashIcon } from "@/components/icons";
import { Avatar, VerifiedMark } from "@/components/people";
import { VideoPlayer } from "@/components/video-player";
import { getViewer } from "@/lib/auth";
import { categoryLabel, musicLabel } from "@/lib/categories";
import { formatCount, formatDate, formatDuration, timeAgo } from "@/lib/format";
import { getClipByShortId, getComments, getMoreFromSameSource, getViewerClipState } from "@/lib/queries";
import { rarityClass } from "@/lib/rarity";
import { site } from "@/lib/site";
import { platformLabel } from "@/lib/video";

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const clip = await getClipByShortId(id);
  if (!clip) return { title: "Not found" };
  const by = clip.creator?.display_name ?? clip.channel_name;
  const where = clip.category === "other" ? "" : ` in ${categoryLabel(clip.category)}`;
  const description = `A ${clip.kind === "movie" ? "movie" : "clip"} by ${by}${where}. Watch it on ${site.name}.`;
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

  const [state, comments, more] = await Promise.all([
    getViewerClipState(clip.id, viewer?.userId ?? null),
    approved ? getComments(clip.id) : Promise.resolve([]),
    getMoreFromSameSource(clip, 4),
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
          <strong style={{ color: "var(--text)" }}>
            {submitted ? "Submitted! " : ""}It&apos;s in the review queue.
          </strong>
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

          <div className="stack-sm" style={{ gap: 14 }}>
            <h1 className={`h1 clip-h1 ${rarityClass(clip.view_count)}`}>{clip.title}</h1>
            <div className="row-between" style={{ alignItems: "center", gap: "14px 24px" }}>
              <span className="meta-row">
                <Link href={`/browse?kind=${clip.kind}`} className="meta-pill">
                  {clip.kind === "movie" ? "Movie" : "Clip"}
                </Link>
                <Link href={`/browse?cat=${clip.category}`} className="meta-link">
                  {categoryLabel(clip.category)}
                </Link>
                {duration ? (
                  <span className="meta-item">
                    <ClockIcon size={14} /> {duration}
                  </span>
                ) : null}
                <span className="meta-item">Posted {formatDate(clip.published_at ?? clip.created_at)}</span>
                <span className="meta-item">
                  <EyeIcon size={14} /> {formatCount(clip.view_count)} {clip.view_count === 1 ? "view" : "views"}
                </span>
              </span>
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
          </div>

          <section aria-label="Credits" className="credits">
            <div className="credits-main">
              {clip.creator ? (
                <>
                  <Avatar name={clip.creator.display_name} src={clip.creator.avatar_url} size={56} />
                  <div className="stack-sm" style={{ gap: 3, minWidth: 0, flex: 1 }}>
                    <span className="credits-label">Made by</span>
                    <Link href={`/u/${clip.creator.username}`} className="credits-name">
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
                  <Avatar name={clip.channel_name} size={56} />
                  <div className="stack-sm" style={{ gap: 3, minWidth: 0, flex: 1 }}>
                    <span className="credits-label">Made by</span>
                    <span className="credits-name">{clip.channel_name}</span>
                    <span className="small muted">
                      {sourceName} channel, not claimed on 4Ever yet.{" "}
                      <Link href={`/claim?clip=${clip.short_id}`}>Is this you?</Link>
                    </span>
                  </div>
                  {clip.channel_url ? (
                    <a
                      href={clip.channel_url}
                      className="btn btn-ghost btn-sm"
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                    >
                      Channel <ExternalIcon size={14} />
                    </a>
                  ) : null}
                </>
              )}
            </div>
            <dl className="credits-facts">
              {sharedBy ? (
                <>
                  <dt>Shared by</dt>
                  <dd>
                    <Link href={`/u/${sharedBy.username}`} style={{ textDecoration: "none", fontWeight: 700 }}>
                      {sharedBy.display_name}
                    </Link>
                  </dd>
                </>
              ) : null}
              <dt>Music</dt>
              <dd>{musicLabel(clip.music_source, clip.music_credit)}</dd>
              <dt>Source</dt>
              <dd>
                <a
                  href={clip.source_url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="row"
                  style={{ gap: 6, display: "inline-flex", textDecoration: "none", fontWeight: 700 }}
                >
                  Watch on {sourceName} <ExternalIcon size={13} />
                </a>
              </dd>
            </dl>
            <div className="credits-foot">
              <span>Credit always goes to the channel that uploaded the video.</span>
              <span className="row" style={{ gap: "6px 18px" }}>
                {clip.creator ? null : <Link href={`/claim?clip=${clip.short_id}`}>This is my video</Link>}
                <Link href={`/report?clip=${clip.short_id}`} className="quiet-link">
                  Report or request removal
                </Link>
              </span>
            </div>
          </section>

          {clip.description ? (
            <p className="prose pre-line" style={{ margin: 0 }}>
              {clip.description}
            </p>
          ) : null}

          {clip.tags.length > 0 ? (
            <div className="chips">
              {clip.tags.map((tag) => (
                <Link key={tag} href={`/browse?tag=${tag}`} className="tag">
                  #{tag}
                </Link>
              ))}
            </div>
          ) : null}

          {approved ? (
            <section aria-labelledby="comments" className="stack" style={{ gap: 14 }}>
              <h2 id="comments" className="h2" style={{ fontSize: 26 }}>
                Comments{" "}
                <span className="muted" style={{ fontFamily: "var(--font-body)", fontSize: 16, textShadow: "none" }}>
                  {comments.length}
                </span>
              </h2>
              {viewer ? (
                <CommentForm clipId={clip.id} shortId={clip.short_id} />
              ) : (
                <div className="notice">
                  <span>
                    <Link href={`/login?next=${encodeURIComponent(`/c/${clip.short_id}`)}`}>Log in</Link> to join the
                    conversation.
                  </span>
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
                            <Link
                              href={`/u/${comment.author.username}`}
                              style={{ textDecoration: "none", fontWeight: 800, color: "var(--text)" }}
                            >
                              {comment.author.display_name}
                            </Link>
                          ) : (
                            <strong>Someone</strong>
                          )}
                          <span className="faint" style={{ marginLeft: 8 }}>
                            {timeAgo(comment.created_at)}
                          </span>
                        </span>
                        <p>{comment.body}</p>
                      </div>
                      {canDelete ? (
                        <form action={deleteComment}>
                          <input type="hidden" name="commentId" value={comment.id} />
                          <input type="hidden" name="shortId" value={clip.short_id} />
                          <button
                            type="submit"
                            className="btn btn-ghost btn-sm"
                            aria-label="Delete comment"
                            title="Delete comment"
                          >
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
              <h2 className="h-gold">More from {clip.creator?.display_name ?? clip.channel_name}</h2>
              {more.map((m) => (
                <MiniClip key={m.id} clip={m} />
              ))}
            </>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
