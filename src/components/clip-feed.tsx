"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useCallback, useEffect, useRef, useState, useTransition } from "react";
import { postComment, toggleVote, type CommentState } from "@/app/actions/clip";
import type { FeedComment } from "@/app/api/clips/[id]/comments/route";
import { ChevronRightIcon, CommentIcon, EyeIcon, PlayIcon, UpIcon, XIcon } from "@/components/icons";
import { Avatar } from "@/components/people";
import { Vista } from "@/components/vista";
import { formatCount, timeAgo } from "@/lib/format";
import { rarityClass } from "@/lib/rarity";
import { embedUrl, platformLabel } from "@/lib/video";

export type FeedClip = {
  id: string;
  shortId: string;
  title: string;
  sourceType: string;
  sourceId: string;
  platform: string;
  thumbnailUrl: string | null;
  duration: string;
  category: string;
  channelName: string;
  views: number;
  votes: number;
  comments: number;
  voted: boolean;
  person: { name: string; username: string; avatar: string | null; isCreator: boolean } | null;
};

// How far a finger has to travel sideways before it counts as a swipe.
const SWIPE_PX = 50;

// One clip at a time, full screen. Swiping moves between clips; on a computer, the side arrows or arrow keys do.
// The first clip waits for a tap so phones allow sound; after that each clip starts on its own.
export function ClipFeed({
  clips,
  startIndex,
  kind,
  loggedIn,
}: {
  clips: FeedClip[];
  startIndex: number;
  kind: string;
  loggedIn: boolean;
}) {
  const router = useRouter();
  const [index, setIndex] = useState(startIndex);
  const [direction, setDirection] = useState<"next" | "prev" | null>(null);
  const [host, setHost] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [votes, setVotes] = useState(() =>
    Object.fromEntries(clips.map((c) => [c.id, { voted: c.voted, count: c.votes }])),
  );
  const [commentCounts, setCommentCounts] = useState(() => Object.fromEntries(clips.map((c) => [c.id, c.comments])));
  const [, startTransition] = useTransition();
  const counted = useRef(new Set<string>());
  const touch = useRef<{ x: number; y: number } | null>(null);
  const clip = clips[index];
  const feedPath = (shortId: string) => `/watch?start=${shortId}${kind === "clip" ? "" : `&kind=${kind}`}`;

  const go = useCallback(
    (delta: 1 | -1) => {
      const next = index + delta;
      if (next < 0 || next >= clips.length) return;
      setDirection(delta === 1 ? "next" : "prev");
      setIndex(next);
      setSheetOpen(false);
      window.history.replaceState(null, "", feedPath(clips[next].shortId));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [index, clips],
  );

  // The page behind the feed shouldn't scroll while it's open.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (sheetOpen || (event.target as HTMLElement)?.closest?.("textarea, input")) return;
      if (event.key === "ArrowRight") go(1);
      if (event.key === "ArrowLeft") go(-1);
      if (event.key === "Escape") router.push("/");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, sheetOpen, router]);

  // Count a view once per clip, as soon as it starts playing.
  useEffect(() => {
    if (!host || !clip || counted.current.has(clip.id)) return;
    counted.current.add(clip.id);
    fetch(`/api/clips/${clip.id}/view`, { method: "POST", keepalive: true }).catch(() => undefined);
  }, [host, clip]);

  function onTouchStart(event: React.TouchEvent) {
    const t = event.touches[0];
    touch.current = { x: t.clientX, y: t.clientY };
  }

  function onTouchEnd(event: React.TouchEvent) {
    const start = touch.current;
    touch.current = null;
    if (!start || sheetOpen) return;
    const t = event.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) < SWIPE_PX || Math.abs(dx) < Math.abs(dy) * 1.2) return;
    go(dx > 0 ? 1 : -1);
  }

  function onVote() {
    if (!clip) return;
    if (!loggedIn) return router.push(`/login?next=${encodeURIComponent(feedPath(clip.shortId))}`);
    const current = votes[clip.id];
    const optimistic = { voted: !current.voted, count: Math.max(0, current.count + (current.voted ? -1 : 1)) };
    setVotes((v) => ({ ...v, [clip.id]: optimistic }));
    startTransition(async () => {
      const result = await toggleVote(clip.id, clip.shortId);
      if (!result.ok) {
        setVotes((v) => ({ ...v, [clip.id]: current }));
        if (result.error === "login") router.push(`/login?next=${encodeURIComponent(feedPath(clip.shortId))}`);
      }
    });
  }

  if (!clip) {
    return (
      <div className="feed feed-empty">
        <div className="slot">
          <span className="slot-icon">
            <PlayIcon size={26} />
          </span>
          <span className="stack-sm" style={{ gap: 4 }}>
            <strong>No clips yet</strong>
            <span className="muted small">
              The first clips land here as soon as they&apos;re approved. <Link href="/submit">Share one</Link>
            </span>
          </span>
        </div>
        <Link href="/" className="btn btn-ghost">
          Back to the front page
        </Link>
      </div>
    );
  }

  const vote = votes[clip.id];
  const person = clip.person;

  return (
    <div className="feed" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div className="feed-top">
        <Link href="/" className="feed-icon-btn" aria-label="Close clips">
          <XIcon size={20} />
        </Link>
        <span className="feed-count" aria-live="polite">
          {index + 1} of {clips.length}
        </span>
        {person ? (
          <Link href={`/u/${person.username}`} className="feed-person" aria-label={`${person.name}'s profile`}>
            <Avatar name={person.name} src={person.avatar} size={42} />
          </Link>
        ) : (
          <span className="feed-person feed-person-empty" title={clip.channelName}>
            <Avatar name={clip.channelName} size={42} />
          </span>
        )}
      </div>

      {index > 0 ? (
        <button type="button" className="feed-arrow feed-arrow-prev" onClick={() => go(-1)} aria-label="Previous clip">
          <ChevronRightIcon size={44} style={{ transform: "rotate(180deg)" }} />
        </button>
      ) : null}
      {index < clips.length - 1 ? (
        <button type="button" className="feed-arrow feed-arrow-next" onClick={() => go(1)} aria-label="Next clip">
          <ChevronRightIcon size={44} />
        </button>
      ) : null}

      <div className={`feed-stage ${direction ? `feed-in-${direction}` : ""}`} key={clip.id}>
        <div className="feed-media">
          {host ? (
            <iframe
              src={`${embedUrl(clip.sourceType, clip.sourceId, host)}${clip.platform === "youtube" ? "&playsinline=1" : ""}`}
              title={clip.title}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          ) : (
            <button
              type="button"
              className="player-facade"
              onClick={() => setHost(window.location.hostname)}
              aria-label={`Play ${clip.title}`}
            >
              {clip.thumbnailUrl ? (
                <img src={clip.thumbnailUrl} alt="" referrerPolicy="no-referrer" />
              ) : (
                <Vista seed={clip.shortId} />
              )}
              <span className="player-play">
                <PlayIcon size={34} style={{ marginLeft: 4 }} />
              </span>
              <span className="player-bar">
                <span>{clip.duration || "Play"}</span>
                <span>Plays from {platformLabel(clip.platform)}</span>
              </span>
            </button>
          )}
        </div>

        <div className="feed-info">
          <Link href={`/c/${clip.shortId}`} className={`feed-title ${rarityClass(clip.views)}`}>
            {clip.title}
          </Link>
          <span className="feed-meta">
            <span>{person?.isCreator ? person.name : clip.channelName}</span>
            <span>{clip.category}</span>
            <span className="row" style={{ gap: 5 }}>
              <EyeIcon size={13} /> {formatCount(clip.views)}
            </span>
          </span>
        </div>
      </div>

      <div className="feed-bottom">
        <button
          type="button"
          className={`feed-action ${vote.voted ? "is-on" : ""}`}
          onClick={onVote}
          aria-pressed={vote.voted}
          aria-label={vote.voted ? "Remove your like" : "Like this clip"}
        >
          <span className="feed-action-icon">
            <UpIcon size={24} />
          </span>
          <span>{formatCount(vote.count)}</span>
        </button>

        <button type="button" className="feed-action" onClick={() => setSheetOpen(true)} aria-label="Comments">
          <span className="feed-action-icon">
            <CommentIcon size={23} />
          </span>
          <span>{formatCount(commentCounts[clip.id] ?? 0)}</span>
        </button>
      </div>

      {sheetOpen ? (
        <CommentSheet
          key={`sheet-${clip.id}`}
          clipId={clip.id}
          shortId={clip.shortId}
          loggedIn={loggedIn}
          loginHref={`/login?next=${encodeURIComponent(feedPath(clip.shortId))}`}
          onClose={() => setSheetOpen(false)}
          onCount={(n) => setCommentCounts((c) => ({ ...c, [clip.id]: n }))}
        />
      ) : null}
    </div>
  );
}

const initialComment: CommentState = { ok: false, message: null, key: 0 };

function CommentSheet({
  clipId,
  shortId,
  loggedIn,
  loginHref,
  onClose,
  onCount,
}: {
  clipId: string;
  shortId: string;
  loggedIn: boolean;
  loginHref: string;
  onClose: () => void;
  onCount: (count: number) => void;
}) {
  const [comments, setComments] = useState<FeedComment[] | null>(null);
  const [state, action, pending] = useActionState(postComment, initialComment);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    let alive = true;
    fetch(`/api/clips/${clipId}/comments`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: { comments: FeedComment[] }) => {
        if (!alive) return;
        setComments(data.comments);
        onCount(data.comments.length);
      })
      .catch(() => alive && setComments([]));
    if (state.ok) formRef.current?.reset();
    return () => {
      alive = false;
    };
    // Reload after each posted comment (state.key changes).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clipId, state.key]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="feed-sheet-backdrop" onClick={onClose}>
      <section
        className="feed-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="feed-sheet-title"
        onClick={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
      >
        <div className="feed-sheet-head">
          <h2 id="feed-sheet-title" className="h-gold" style={{ fontSize: 20 }}>
            Comments {comments ? <span className="muted small">{comments.length}</span> : null}
          </h2>
          <button type="button" className="feed-icon-btn" onClick={onClose} aria-label="Close comments">
            <XIcon size={18} />
          </button>
        </div>

        <div className="feed-sheet-list">
          {comments === null ? (
            <p className="muted small">Loading…</p>
          ) : comments.length === 0 ? (
            <p className="muted small">No comments yet. Be the first.</p>
          ) : (
            comments.map((c) => (
              <article key={c.id} className="comment">
                <Avatar name={c.author?.name ?? "?"} src={c.author?.avatar} size={34} />
                <div className="stack-sm" style={{ gap: 2, minWidth: 0, flex: 1 }}>
                  <span className="small">
                    {c.author ? (
                      <Link href={`/u/${c.author.username}`} className="comment-name">
                        {c.author.name}
                      </Link>
                    ) : (
                      <strong>Someone</strong>
                    )}
                    <span className="faint" style={{ marginLeft: 8 }}>
                      {timeAgo(c.createdAt)}
                    </span>
                  </span>
                  <p>{c.body}</p>
                </div>
              </article>
            ))
          )}
        </div>

        {loggedIn ? (
          <form ref={formRef} action={action} className="feed-sheet-form">
            <input type="hidden" name="clipId" value={clipId} />
            <input type="hidden" name="shortId" value={shortId} />
            <label htmlFor="feed-comment" className="sr-only">
              Add a comment
            </label>
            <input
              id="feed-comment"
              name="body"
              className="input"
              maxLength={1000}
              required
              placeholder="Say something about it"
              autoComplete="off"
            />
            <button type="submit" className="btn btn-gold" disabled={pending}>
              {pending ? "…" : "Post"}
            </button>
            {state.message ? (
              <p className="small" role="alert" style={{ margin: 0, color: "var(--red)", flexBasis: "100%" }}>
                {state.message}
              </p>
            ) : null}
          </form>
        ) : (
          <Link href={loginHref} className="btn btn-gold btn-block">
            Log in to comment
          </Link>
        )}
      </section>
    </div>
  );
}
