"use client";

import Link from "next/link";
import { useActionState } from "react";
import { submitReport, type ReportState } from "@/app/report/actions";

const REASONS = [
  { value: "my_video_remove", label: "It's my video and I want it removed" },
  { value: "wrong_credit", label: "The credit is wrong" },
  { value: "copyright", label: "It uses my copyrighted work (music, footage)" },
  { value: "inappropriate", label: "It's inappropriate or breaks the rules" },
  { value: "spam", label: "It's spam or not World of Warcraft" },
  { value: "other", label: "Something else" },
];

const initial: ReportState = { ok: false, message: null };

export function ReportForm({ clip, defaultReason, loggedIn }: { clip: string; defaultReason: string; loggedIn: boolean }) {
  const [state, action, pending] = useActionState(submitReport, initial);

  if (state.ok) {
    return (
      <div className="notice notice-ok" role="status">
        {state.message ?? "Thanks, we got it."} <Link href="/">Back to the front page</Link>
      </div>
    );
  }

  return (
    <form action={action} className="form-card">
      <input type="hidden" name="clip" value={clip} />
      <div className="hp-field" aria-hidden="true">
        <label htmlFor="website">Leave this empty</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <fieldset className="form-section" style={{ gap: 10 }}>
        <legend>What&apos;s going on?</legend>
        {REASONS.map((r) => (
          <label key={r.value} className="choice choice-row">
            <input type="radio" name="reason" value={r.value} defaultChecked={r.value === defaultReason} required />
            <span>{r.label}</span>
          </label>
        ))}
      </fieldset>

      <div className="field">
        <label htmlFor="details" className="label">
          Details <span className="optional">(helps us act faster)</span>
        </label>
        <textarea id="details" name="details" className="textarea" maxLength={2000} rows={4} placeholder="Anything we should know" />
      </div>

      <div className="field">
        <label htmlFor="email" className="label">
          Your email {loggedIn ? <span className="optional">(optional)</span> : null}
        </label>
        <input id="email" name="email" type="email" className="input" required={!loggedIn} maxLength={200} />
        <p className="help">Only used to follow up on this report.</p>
      </div>

      {state.message ? (
        <p className="notice notice-error" role="alert" style={{ margin: 0 }}>
          {state.message}
        </p>
      ) : null}

      <div className="row">
        <button type="submit" className="btn btn-gold btn-lg" disabled={pending}>
          {pending ? "Sending…" : "Send report"}
        </button>
        <span className="small muted">
          Formal copyright notice? See the <Link href="/dmca">DMCA page</Link>.
        </span>
      </div>
    </form>
  );
}
