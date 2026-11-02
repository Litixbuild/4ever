"use client";

import { useActionState } from "react";
import { sendSuggestion, type SuggestState } from "@/app/suggest/actions";
import { SUGGESTION_TOPICS } from "@/lib/suggestions";

const initial: SuggestState = { ok: false, message: null };

export function SuggestForm({ defaultTopic }: { defaultTopic: string }) {
  const [state, action, pending] = useActionState(sendSuggestion, initial);

  return (
    // A new key after each send clears the form for the next one.
    <form action={action} className="form-card" key={state.sentAt ?? 0}>
      <div className="hp-field" aria-hidden="true">
        <label htmlFor="website">Leave this empty</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <fieldset className="form-section" style={{ gap: 10 }}>
        <legend>What&apos;s it about?</legend>
        {SUGGESTION_TOPICS.map((t) => (
          <label key={t.value} className="choice choice-row">
            <input type="radio" name="topic" value={t.value} defaultChecked={t.value === defaultTopic} required />
            <span>{t.label}</span>
          </label>
        ))}
      </fieldset>

      <div className="field">
        <label htmlFor="suggest-body" className="label">
          Your message
        </label>
        <textarea
          id="suggest-body"
          name="body"
          className="textarea"
          minLength={5}
          maxLength={1500}
          rows={5}
          required
          placeholder="What would make 4Ever better for you?"
        />
      </div>

      {state.message ? (
        <p
          className={`notice ${state.ok ? "notice-ok" : "notice-error"}`}
          role={state.ok ? "status" : "alert"}
          style={{ margin: 0 }}
        >
          {state.message}
        </p>
      ) : null}

      <div className="row">
        <button type="submit" className="btn btn-gold btn-lg" disabled={pending}>
          {pending ? "Sending…" : "Send suggestion"}
        </button>
      </div>
    </form>
  );
}
