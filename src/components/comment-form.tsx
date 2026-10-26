"use client";

import { useActionState, useEffect, useRef } from "react";
import { postComment, type CommentState } from "@/app/actions/clip";
import { UserIcon } from "@/components/icons";

const initial: CommentState = { ok: false, message: null, key: 0 };

export function CommentForm({ clipId, shortId }: { clipId: string; shortId: string }) {
  const [state, action, pending] = useActionState(postComment, initial);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="card row" style={{ alignItems: "flex-start", gap: 12, padding: 16 }}>
      <span
        className="avatar"
        style={{ width: 40, height: 40, background: "var(--surface-2)", color: "var(--muted)" }}
        aria-hidden="true"
      >
        <UserIcon size={18} />
      </span>
      <div className="stack-sm" style={{ flex: "1 1 240px", gap: 10 }}>
        <input type="hidden" name="clipId" value={clipId} />
        <input type="hidden" name="shortId" value={shortId} />
        <label htmlFor="comment-body" className="sr-only">
          Add a comment
        </label>
        <textarea
          id="comment-body"
          name="body"
          className="textarea"
          rows={2}
          maxLength={1000}
          required
          placeholder="Say something about it"
          style={{ minHeight: 72 }}
        />
        <div className="row" style={{ justifyContent: "space-between" }}>
          <span className="small" role="status" style={{ color: state.ok ? "var(--green)" : "var(--red)" }}>
            {state.message ?? (state.ok ? "Posted." : "")}
          </span>
          <button type="submit" className="btn btn-gold" disabled={pending}>
            {pending ? "Posting…" : "Post comment"}
          </button>
        </div>
      </div>
    </form>
  );
}
