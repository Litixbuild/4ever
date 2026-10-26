"use client";

import { useActionState } from "react";
import { enterContest, type EntryState } from "@/app/contests/actions";

const initial: EntryState = { ok: false, message: null };

export function EnterContestForm({ contestId, clips }: { contestId: string; clips: { id: string; title: string }[] }) {
  const [state, action, pending] = useActionState(enterContest, initial);
  return (
    <form action={action} className="stack-sm" style={{ gap: 10 }}>
      <input type="hidden" name="contestId" value={contestId} />
      <label htmlFor="entry-clip" className="label" style={{ fontSize: 14 }}>
        Choose your entry
      </label>
      <select id="entry-clip" name="clipId" className="select" required defaultValue="">
        <option value="" disabled>
          Pick one of your videos
        </option>
        {clips.map((clip) => (
          <option key={clip.id} value={clip.id}>
            {clip.title}
          </option>
        ))}
      </select>
      <button type="submit" className="btn btn-gold" disabled={pending}>
        {pending ? "Entering…" : "Enter the contest"}
      </button>
      {state.message ? (
        <p className="small" role="status" style={{ margin: 0, fontWeight: 700, color: state.ok ? "var(--green)" : "var(--red)" }}>
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
