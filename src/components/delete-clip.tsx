"use client";

import { useActionState, useState } from "react";
import { deleteClip, type DeleteClipState } from "@/app/actions/clip";
import { TrashIcon } from "@/components/icons";

const initial: DeleteClipState = { error: null };

// Two steps so nobody deletes a video by accident.
export function DeleteClip({ clipId }: { clipId: string }) {
  const [state, action, pending] = useActionState(deleteClip, initial);
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        className="link-button quiet-link row"
        style={{ gap: 6 }}
        onClick={() => setConfirming(true)}
      >
        <TrashIcon size={14} /> Delete this video
      </button>
    );
  }

  return (
    <form action={action} className="delete-confirm" role="group" aria-label="Confirm delete">
      <input type="hidden" name="clipId" value={clipId} />
      <span className="small">Delete it from 4Ever? Its votes and comments go too. It stays on YouTube or Twitch.</span>
      <span className="row" style={{ gap: 8 }}>
        <button type="submit" className="btn btn-danger btn-sm" disabled={pending}>
          {pending ? "Deleting…" : "Yes, delete it"}
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirming(false)} disabled={pending}>
          Keep it
        </button>
      </span>
      {state.error ? (
        <span className="small" role="alert" style={{ color: "var(--red)" }}>
          {state.error}
        </span>
      ) : null}
    </form>
  );
}
