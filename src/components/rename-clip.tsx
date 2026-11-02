"use client";

import { useActionState, useState } from "react";
import { renameClip, type RenameState } from "@/app/actions/clip";

const initial: RenameState = { ok: false, message: null };

// For curators: fix a clip's title in place.
export function RenameClip({ clipId, shortId, title }: { clipId: string; shortId: string; title: string }) {
  // The box stays open until a save goes through, so an error shows next to it.
  const [openedAt, setOpenedAt] = useState<number | null>(null);
  const [state, action, pending] = useActionState(renameClip, initial);
  const open = openedAt !== null && !(state.ok && (state.savedAt ?? 0) > openedAt);

  if (!open) {
    return (
      <button type="button" className="link-button quiet-link" onClick={() => setOpenedAt(Date.now())}>
        {state.ok ? "Title saved. Edit again" : "Edit title"}
      </button>
    );
  }
  return (
    <form action={action} className="rename-clip">
      <input type="hidden" name="clipId" value={clipId} />
      <input type="hidden" name="shortId" value={shortId} />
      <label htmlFor="rename-title" className="sr-only">
        Title
      </label>
      <input id="rename-title" name="title" className="input" defaultValue={title} maxLength={140} required autoFocus />
      <button type="submit" className="btn btn-gold btn-sm" disabled={pending}>
        {pending ? "Saving…" : "Save title"}
      </button>
      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpenedAt(null)}>
        Cancel
      </button>
      {state.message && !state.ok ? (
        <span className="small" role="alert" style={{ color: "var(--red)", flexBasis: "100%" }}>
          {state.message}
        </span>
      ) : null}
    </form>
  );
}
