"use client";

import { useRouter } from "next/navigation";
import { useOptimistic, useState, useTransition } from "react";
import { toggleFavorite, toggleVote } from "@/app/actions/clip";
import { BookmarkIcon, CheckIcon, ShareIcon, UpIcon } from "@/components/icons";
import { formatCount } from "@/lib/format";

type Props = {
  clipId: string;
  shortId: string;
  loggedIn: boolean;
  voted: boolean;
  votes: number;
  favorited: boolean;
};

export function ClipActions({ clipId, shortId, loggedIn, voted, votes, favorited }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [voteState, setVoteState] = useOptimistic(
    { voted, votes },
    (state, next: boolean) => ({ voted: next, votes: Math.max(0, state.votes + (next ? 1 : -1)) }),
  );
  const [favState, setFavState] = useOptimistic(favorited, (_state, next: boolean) => next);

  function needLogin() {
    router.push(`/login?next=${encodeURIComponent(`/c/${shortId}`)}`);
  }

  function onVote() {
    if (!loggedIn) return needLogin();
    setError(null);
    startTransition(async () => {
      setVoteState(!voteState.voted);
      const result = await toggleVote(clipId, shortId);
      if (!result.ok) {
        if (result.error === "login") return needLogin();
        setError(result.error);
      }
    });
  }

  function onFavorite() {
    if (!loggedIn) return needLogin();
    setError(null);
    startTransition(async () => {
      setFavState(!favState);
      const result = await toggleFavorite(clipId, shortId);
      if (!result.ok) {
        if (result.error === "login") return needLogin();
        setError(result.error);
      }
    });
  }

  async function onShare() {
    const url = `${window.location.origin}/c/${shortId}`;
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Sharing was cancelled; nothing to do.
    }
  }

  return (
    <div className="stack-sm">
      <div className="row">
        <button
          type="button"
          className={`btn btn-lg ${voteState.voted ? "btn-active" : "btn-outline-gold"}`}
          aria-pressed={voteState.voted}
          onClick={onVote}
          disabled={isPending}
          title={voteState.voted ? "Take back your vote" : "Vote for this video"}
        >
          <UpIcon size={18} />
          {formatCount(voteState.votes)}
          <span className="sr-only">{voteState.voted ? "votes, you voted" : "votes"}</span>
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-lg"
          aria-pressed={favState}
          onClick={onFavorite}
          disabled={isPending}
        >
          <BookmarkIcon size={17} filled={favState} />
          {favState ? "Saved" : "Save"}
        </button>
        <button type="button" className="btn btn-ghost btn-lg" onClick={onShare}>
          {copied ? <CheckIcon size={17} /> : <ShareIcon size={17} />}
          {copied ? "Link copied" : "Share"}
        </button>
      </div>
      {error ? (
        <p className="small" role="alert" style={{ margin: 0, color: "var(--red)" }}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
