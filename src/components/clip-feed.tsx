"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useCallback, useEffect, useRef, useState, useSyncExternalStore, useTransition } from "react";
import { postComment, toggleVote, type CommentState } from "@/app/actions/clip";
import type { FeedComment } from "@/app/api/clips/[id]/comments/route";
import { ChevronRightIcon, CommentIcon, EyeIcon, PlayIcon, ThumbsUpIcon, XIcon } from "@/components/icons";
import { Avatar } from "@/components/people";
import { formatCount, timeAgo } from "@/lib/format";
import { rarityClass } from "@/lib/rarity";
import { embedUrl, isAppleTouch } from "@/lib/video";

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
  channelAvatar: string | null;
  views: number;
  votes: number;
  comments: number;
  voted: boolean;
  person: { name: string; username: string; avatar: string | null; isCreator: boolean } | null;
};

// How far a finger has to travel up or down before it counts as a swipe.
const SWIPE_PX = 50;

const noopSubscribe = () => () => {};

// Phones and tablets: the video fills the screen and a clear layer over it reads swipes and taps.
function subscribeCoarse(onChange: () => void) {
  const query = window.matchMedia("(pointer: coarse)");
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

// One clip at a time, full screen, like Shorts. Swipe up for the next clip, down for the one before;
// on a computer, the side arrows or arrow keys. Every clip starts playing by itself, with sound whenever the
// browser allows it.
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
  // Twitch needs this site's hostname; it only exists in the browser, so the player mounts after hydration.
  const host = useSyncExternalStore(
    noopSubscribe,
    () => window.location.hostname,
    () => null,
  );
  const touchScreen = useSyncExternalStore(
    subscribeCoarse,
    () => window.matchMedia("(pointer: coarse)").matches,
    () => false,
  );
  // Clips play with sound. Browsers only allow that once the visitor has clicked or tapped something on the site
  // (opening the feed from the menu counts), so a visitor who lands here straight from a link starts muted until
  // their first swipe or tap. iPhones never allow it, so there the first tap turns the sound on.
  const [muted, setMuted] = useState(
    () => typeof navigator === "undefined" || isAppleTouch() || !(navigator.userActivation?.hasBeenActive ?? false),
  );
  // Taps on a touch screen: the first one turns the sound on, then each tap pauses or plays.
  const [soundOn, setSoundOn] = useState(false);
  const [paused, setPaused] = useState(false);
  const frame = useRef<HTMLIFrameElement>(null);
  // iPhones only allow sound after a tap on the player itself, and a new player starts silent again. So there one
  // YouTube player stays open and each new clip is loaded into it: tap once and the sound stays on while you swipe.
  const apple = useSyncExternalStore(noopSubscribe, isAppleTouch, () => false);
  const [player, setPlayer] = useState<{ src: string; first: string } | null>(null);
  const playerReady = useRef(false);
  const playerVideo = useRef<string | null>(null);
  const wantedVideo = useRef<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [votes, setVotes] = useState(() =>
    Object.fromEntries(clips.map((c) => [c.id, { voted: c.voted, count: c.votes }])),
  );
  const [commentCounts, setCommentCounts] = useState(() => Object.fromEntries(clips.map((c) => [c.id, c.comments])));
  const [, startTransition] = useTransition();
  const counted = useRef(new Set<string>());
  const touch = useRef<{ x: number; y: number } | null>(null);
  const clip = clips[index];
  const keepPlayer = Boolean(host && apple && clip?.platform === "youtube");
  // Open the shared player for the first YouTube clip, and let it go when a Twitch clip comes up.
  if (keepPlayer && !player && clip && host) {
    setPlayer({ src: feedEmbed(clip, host, true, touchScreen, false), first: clip.sourceId });
  } else if (!keepPlayer && player) {
    setPlayer(null);
  }
  const feedPath = (shortId: string) => `/watch?start=${shortId}${kind === "clip" ? "" : `&kind=${kind}`}`;

  const go = useCallback(
    (delta: 1 | -1) => {
      const next = index + delta;
      if (next < 0 || next >= clips.length) return;
      setDirection(delta === 1 ? "next" : "prev");
      setIndex(next);
      // Moving on is a tap or swipe, which lets the next clip play with sound (except on Apple phones).
      if (!isAppleTouch()) setMuted(false);
      setSheetOpen(false);
      setPaused(false);
      window.history.replaceState(null, "", feedPath(clips[next].shortId));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [index, clips],
  );

  // The page behind the feed shouldn't scroll (or pull to refresh) while it's open.
  useEffect(() => {
    const body = document.body.style;
    const previous = [body.overflow, body.overscrollBehavior];
    body.overflow = "hidden";
    body.overscrollBehavior = "none";
    return () => {
      [body.overflow, body.overscrollBehavior] = previous;
    };
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (sheetOpen || (event.target as HTMLElement)?.closest?.("textarea, input")) return;
      if (event.key === "ArrowRight" || event.key === "ArrowDown") go(1);
      if (event.key === "ArrowLeft" || event.key === "ArrowUp") go(-1);
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
    if (Math.abs(dy) < SWIPE_PX || Math.abs(dy) < Math.abs(dx) * 1.2) return;
    // Finger moving up brings the next clip, like Shorts.
    go(dy < 0 ? 1 : -1);
  }

  // YouTube's player takes commands from this page (the link asks for that with enablejsapi=1).
  const command = useCallback((func: string, args: unknown[] = []) => {
    frame.current?.contentWindow?.postMessage(JSON.stringify({ event: "command", func, args }), "*");
  }, []);

  // The shared player: load the clip on screen into it once it's ready.
  const loadWanted = useCallback(() => {
    const wanted = wantedVideo.current;
    if (!playerReady.current || !wanted || wanted === playerVideo.current) return;
    playerVideo.current = wanted;
    command("loadVideoById", [wanted]);
  }, [command]);

  useEffect(() => {
    wantedVideo.current = keepPlayer && clip ? clip.sourceId : null;
    loadWanted();
  }, [keepPlayer, clip, loadWanted]);

  // Hear back from the shared player: when it's ready, and when a clip ends (it starts over, like Shorts).
  useEffect(() => {
    if (!keepPlayer) return;
    function onMessage(event: MessageEvent) {
      if (event.source !== frame.current?.contentWindow || typeof event.data !== "string") return;
      let data: { event?: string; info?: { playerState?: number } | number | null };
      try {
        data = JSON.parse(event.data);
      } catch {
        return;
      }
      if (data.event === "onReady" || data.event === "initialDelivery") {
        playerReady.current = true;
        loadWanted();
      }
      const state =
        data.event === "onStateChange" ? data.info : typeof data.info === "object" ? data.info?.playerState : undefined;
      if (state === 0) {
        command("seekTo", [0, true]);
        command("playVideo");
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [keepPlayer, command, loadWanted]);

  function onFrameLoad() {
    setSoundOn(false);
    if (!keepPlayer || !player) return;
    playerReady.current = false;
    playerVideo.current = player.first;
    // Ask the player to report back (ready, playing, ended).
    frame.current?.contentWindow?.postMessage(
      JSON.stringify({ event: "listening", id: "4ever", channel: "widget" }),
      "*",
    );
  }

  function onTap() {
    if (!clip) return;
    if (clip.platform !== "youtube") {
      // Twitch's player can't be told to unmute from here, so it reloads with sound instead.
      if (muted && !isAppleTouch()) setMuted(false);
      return;
    }
    const silent = muted && !soundOn;
    if (silent) {
      command("unMute");
      command("playVideo");
      setSoundOn(true);
      setPaused(false);
      return;
    }
    command(paused ? "playVideo" : "pauseVideo");
    setPaused(!paused);
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
        {person ? (
          <Link href={`/u/${person.username}`} className="feed-person" aria-label={`${person.name}'s profile`}>
            <Avatar name={person.name} src={person.avatar} size={42} />
          </Link>
        ) : (
          <span className="feed-person feed-person-empty" title={clip.channelName}>
            <Avatar name={clip.channelName} src={clip.channelAvatar} size={42} />
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

      <div
        className={`feed-stage ${direction && !keepPlayer ? `feed-in-${direction}` : ""}`}
        key={keepPlayer ? "player" : clip.id}
      >
        <div className="feed-media">
          {clip.thumbnailUrl ? (
            <img className="feed-poster" src={clip.thumbnailUrl} alt="" referrerPolicy="no-referrer" />
          ) : null}
          {host ? (
            <iframe
              ref={frame}
              src={keepPlayer && player ? player.src : feedEmbed(clip, host, muted, touchScreen, true)}
              onLoad={onFrameLoad}
              title={clip.title}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          ) : null}
          {host && touchScreen ? (
            <button
              type="button"
              className="feed-touch"
              onClick={onTap}
              aria-label={paused ? "Play" : muted && !soundOn ? "Turn sound on" : "Pause"}
            >
              {paused ? (
                <span className="feed-touch-icon">
                  <PlayIcon size={34} style={{ marginLeft: 4 }} />
                </span>
              ) : null}
            </button>
          ) : null}
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
            <ThumbsUpIcon size={30} filled={vote.voted} />
          </span>
          <span>{formatCount(vote.count)}</span>
        </button>

        <button type="button" className="feed-action" onClick={() => setSheetOpen(true)} aria-label="Comments">
          <span className="feed-action-icon">
            <CommentIcon size={29} />
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

// The player link: plays on its own, inline on phones, muted when the browser requires it.
// On touch screens YouTube's own controls sit under the tap layer, so they're hidden and the clip loops, like Shorts.
// The shared iPhone player can't use YouTube's loop setting (it would replay the first clip), so it restarts clips itself.
function feedEmbed(clip: FeedClip, host: string, muted: boolean, touchScreen: boolean, loop: boolean): string {
  const base = embedUrl(clip.sourceType, clip.sourceId, host);
  if (clip.platform === "youtube") {
    const repeat = loop ? `&loop=1&playlist=${encodeURIComponent(clip.sourceId)}` : "";
    const touch = touchScreen ? `&controls=0${repeat}` : "";
    return `${base}&playsinline=1&enablejsapi=1${touch}${muted ? "&mute=1" : ""}`;
  }
  return `${base}&muted=${muted ? "true" : "false"}`;
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
