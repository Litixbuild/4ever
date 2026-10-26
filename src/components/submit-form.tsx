"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import type { LookupResponse } from "@/app/api/lookup/route";
import { submitClip, type SubmitState } from "@/app/submit/actions";
import { CheckIcon, InfoIcon, LinkIcon } from "@/components/icons";
import { Vista } from "@/components/vista";
import { CATEGORIES, KINDS, MUSIC_SOURCES } from "@/lib/categories";
import { platformLabel } from "@/lib/video";

type VerifiedChannel = { platform: string; channel_id: string };
type Preview = Extract<LookupResponse, { ok: true }>["preview"];

const initial: SubmitState = { error: null };

export function SubmitForm({ verifiedChannels }: { verifiedChannels: VerifiedChannel[] }) {
  const [state, action, submitting] = useActionState(submitClip, initial);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [lookupError, setLookupError] = useState<{ message: string; shortId?: string } | null>(null);
  const [owner, setOwner] = useState<"made" | "shared">("made");
  const [kind, setKind] = useState<"movie" | "clip">("movie");
  const [music, setMusic] = useState("original");
  const [agreed, setAgreed] = useState(false);
  const requestId = useRef(0);

  function onUrlChange(next: string) {
    setUrl(next);
    if (next.trim()) {
      setLoading(true);
    } else {
      requestId.current++;
      setPreview(null);
      setLookupError(null);
      setLoading(false);
    }
  }

  useEffect(() => {
    const value = url.trim();
    if (!value) return;
    const id = ++requestId.current;
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/lookup?url=${encodeURIComponent(value)}`, { cache: "no-store" });
        const data = (await res.json()) as LookupResponse;
        if (id !== requestId.current) return;
        if (data.ok) {
          setPreview(data.preview);
          setLookupError(null);
        } else {
          setPreview(null);
          setLookupError({ message: data.error, shortId: data.existingShortId });
        }
      } catch {
        if (id !== requestId.current) return;
        setPreview(null);
        setLookupError({ message: "We couldn't check that link. Try again in a moment." });
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    }, 500);
    return () => window.clearTimeout(timer);
  }, [url]);

  const ownsChannel =
    preview?.channelId != null &&
    verifiedChannels.some((c) => c.platform === preview.platform && c.channel_id === preview.channelId);

  const canSubmit = Boolean(preview) && agreed && !submitting && !loading;

  return (
    <form action={action} className="form-card">
      <div className="field">
        <label htmlFor="url" className="label">
          Video link
        </label>
        <div className="input-icon">
          <LinkIcon size={18} />
          <input
            id="url"
            name="url"
            type="url"
            className="input"
            inputMode="url"
            autoComplete="off"
            placeholder="https://www.youtube.com/watch?v=… or a Twitch clip link"
            value={url}
            onChange={(e) => onUrlChange(e.target.value)}
            required
          />
        </div>

        <div aria-live="polite">
          {loading ? <p className="help">Checking the link…</p> : null}

          {!loading && preview ? (
            <div className="row" style={{ gap: 16, padding: 14, background: "var(--bg)", border: "1px solid rgba(74,222,128,0.3)", borderRadius: 14 }}>
              <span className="mini-thumb" style={{ width: 160 }}>
                {preview.thumbnailUrl ? <img src={preview.thumbnailUrl} alt="" referrerPolicy="no-referrer" /> : <Vista seed={preview.title} />}
                {preview.duration ? (
                  <span className="overlay-chip" style={{ right: 6, bottom: 6, height: 20, fontSize: 11 }}>
                    {preview.duration}
                  </span>
                ) : null}
              </span>
              <div className="stack-sm" style={{ flex: "1 1 240px", minWidth: 0, gap: 3 }}>
                <span className="tiny faint" style={{ fontWeight: 800, letterSpacing: "0.1em" }}>
                  FOUND ON {platformLabel(preview.platform).toUpperCase()}
                </span>
                <span style={{ fontWeight: 800, fontSize: 16, lineHeight: 1.3 }}>{preview.title}</span>
                <span className="small" style={{ color: "var(--text-3)" }}>
                  Channel: <strong style={{ color: "var(--text)" }}>{preview.channelName}</strong>
                </span>
                <span className="row small" style={{ gap: 6, color: "var(--green)", fontWeight: 700 }}>
                  <CheckIcon size={15} /> We&apos;ll credit this channel automatically
                </span>
              </div>
            </div>
          ) : null}

          {!loading && lookupError ? (
            <p className="notice notice-warn" style={{ margin: 0 }}>
              <InfoIcon size={16} />
              <span>{lookupError.message}</span>
              {lookupError.shortId ? <Link href={`/c/${lookupError.shortId}`}>See it here</Link> : null}
            </p>
          ) : null}

          {!loading && !preview && !lookupError ? (
            <p className="help">Paste a YouTube video, a Twitch clip, or a Twitch video. Nothing gets uploaded.</p>
          ) : null}
        </div>
      </div>

      <fieldset className="form-section">
        <legend>Is this your video?</legend>
        <div className="choice-grid">
          <label className="choice">
            <input type="radio" name="owner" value="made" checked={owner === "made"} onChange={() => setOwner("made")} />
            <span className="stack-sm" style={{ gap: 2 }}>
              <strong>I made this</strong>
              <span className="small muted">It goes on your profile with a verified check.</span>
            </span>
          </label>
          <label className="choice">
            <input type="radio" name="owner" value="shared" checked={owner === "shared"} onChange={() => setOwner("shared")} />
            <span className="stack-sm" style={{ gap: 2 }}>
              <strong>I&apos;m sharing someone else&apos;s</strong>
              <span className="small muted">You show as &ldquo;Shared by&rdquo;. The creator gets the credit.</span>
            </span>
          </label>
        </div>
        <p className="help" style={{ color: "var(--text-3)" }}>
          {owner === "shared" ? (
            "Thanks for spreading good work. The creator can claim it or ask for it to be removed at any time."
          ) : preview && ownsChannel ? (
            <span style={{ color: "var(--green)" }}>That&apos;s your verified channel. It&apos;ll show up on your profile.</span>
          ) : (
            <>
              To get the verified check, <Link href="/settings#channels">verify your channel in Settings</Link>. You can
              submit now. Credit updates automatically once you verify.
            </>
          )}
        </p>
      </fieldset>

      <div className="field-grid">
        <div className="field">
          <span id="kind-label" className="label">
            Type
          </span>
          <input type="hidden" name="kind" value={kind} />
          <div role="group" aria-labelledby="kind-label" className="seg" style={{ background: "var(--bg)" }}>
            {KINDS.map((k) => (
              <button key={k.value} type="button" aria-pressed={kind === k.value} onClick={() => setKind(k.value)} style={{ flex: 1 }}>
                {k.label}
              </button>
            ))}
          </div>
          <p className="help">{KINDS.find((k) => k.value === kind)?.hint}</p>
        </div>
        <div className="field">
          <label htmlFor="category" className="label">
            Category
          </label>
          <select id="category" name="category" className="select" defaultValue="world-pvp" required>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <fieldset className="form-section" style={{ gap: 10 }}>
        <legend>Music in this video</legend>
        {MUSIC_SOURCES.map((m) => (
          <label key={m.value} className="choice choice-row">
            <input type="radio" name="music" value={m.value} checked={music === m.value} onChange={() => setMusic(m.value)} />
            <strong>{m.label}</strong>
            {m.note ? (
              <span className="small muted" style={{ marginLeft: "auto" }}>
                {m.note}
              </span>
            ) : null}
          </label>
        ))}
        {music === "licensed" ? (
          <div className="field" style={{ marginTop: 6 }}>
            <label htmlFor="musicCredit" className="label" style={{ fontSize: 14 }}>
              Music credit
            </label>
            <input
              id="musicCredit"
              name="musicCredit"
              className="input"
              maxLength={200}
              placeholder="Track name, artist, and where it's licensed from"
              required
            />
          </div>
        ) : null}
        <p className="help">
          Videos with unlicensed music can get pulled by YouTube or Twitch, which breaks the player here too.{" "}
          <Link href="/music-guide">Music guide</Link>
        </p>
      </fieldset>

      <div className="field">
        <label htmlFor="notes" className="label">
          Notes for viewers <span className="optional">(optional)</span>
        </label>
        <textarea id="notes" name="notes" className="textarea" maxLength={600} rows={3} placeholder="What's happening, what to watch for, the story behind it" />
      </div>

      <div className="field">
        <label htmlFor="tags" className="label">
          Tags <span className="optional">(optional, up to 5)</span>
        </label>
        <input id="tags" name="tags" className="input" placeholder="rogue, hillsbrad, outnumbered" maxLength={150} />
      </div>

      <div className="form-footer">
        <label className="check">
          <input type="checkbox" name="agree" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
          <span className="small" style={{ color: "var(--text-2)", fontSize: 14.5 }}>
            The video and its music are mine to share, or I have permission. I&apos;ve read the{" "}
            <Link href="/rules">submission rules</Link>.
          </span>
        </label>
        {state.error ? (
          <p className="notice notice-error" role="alert" style={{ margin: 0 }}>
            {state.error}
          </p>
        ) : null}
        <div className="row" style={{ gap: "12px 20px" }}>
          <button type="submit" className="btn btn-gold btn-lg" disabled={!canSubmit}>
            {submitting ? "Sending…" : "Send for review"}
          </button>
          <span className="small muted">Every submission is reviewed before it goes live.</span>
        </div>
      </div>
    </form>
  );
}
