"use client";

import { useActionState, useState } from "react";
import {
  checkYouTubeVerification,
  deleteAccount,
  startYouTubeVerification,
  syncTwitch,
  updateProfile,
  type FormState,
} from "@/app/settings/actions";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";

const initial: FormState = { ok: false, message: null };

function Status({ state }: { state: FormState }) {
  if (!state.message) return null;
  return (
    <p className="small" role="status" style={{ margin: 0, color: state.ok ? "var(--green)" : "var(--red)", fontWeight: 700 }}>
      {state.message}
    </p>
  );
}

export function ProfileForm({ profile, titles }: { profile: Profile; titles: { key: string; label: string }[] }) {
  const [state, action, pending] = useActionState(updateProfile, initial);
  return (
    <form action={action} className="form-card" style={{ gap: 22 }}>
      <div className="field-grid">
        <div className="field">
          <label htmlFor="display_name" className="label">
            Display name
          </label>
          <input id="display_name" name="display_name" className="input" defaultValue={profile.display_name} maxLength={40} required />
        </div>
        <div className="field">
          <label htmlFor="username" className="label">
            Username
          </label>
          <input
            id="username"
            name="username"
            className="input"
            defaultValue={profile.username}
            maxLength={24}
            pattern="[A-Za-z0-9_]{3,24}"
            required
            aria-describedby="username-help"
          />
          <p id="username-help" className="help">
            Your profile lives at 4everclips.com/u/your-username.
          </p>
        </div>
      </div>

      <div className="field">
        <label htmlFor="bio" className="label">
          Bio <span className="optional">(optional)</span>
        </label>
        <textarea id="bio" name="bio" className="textarea" defaultValue={profile.bio ?? ""} maxLength={280} rows={3} placeholder="Rogue main since 2005..." />
      </div>

      <div className="field">
        <label htmlFor="active_title" className="label">
          Title
        </label>
        <select id="active_title" name="active_title" className="select" defaultValue={profile.active_title ?? ""}>
          <option value="">No title</option>
          {titles.map((t) => (
            <option key={t.key} value={t.key}>
              {t.label}
            </option>
          ))}
        </select>
        <p className="help">{titles.length === 0 ? "Earn achievements to unlock titles." : "Shown under your name on your profile."}</p>
      </div>

      <fieldset className="form-section">
        <legend>Main character (optional)</legend>
        <div className="field-grid">
          <div className="field">
            <label htmlFor="main_character" className="label" style={{ fontSize: 14 }}>
              Name
            </label>
            <input id="main_character" name="main_character" className="input" defaultValue={profile.main_character ?? ""} maxLength={24} />
          </div>
          <div className="field">
            <label htmlFor="main_level" className="label" style={{ fontSize: 14 }}>
              Level
            </label>
            <input id="main_level" name="main_level" type="number" min={1} max={60} className="input" defaultValue={profile.main_level ?? ""} />
          </div>
          <div className="field">
            <label htmlFor="main_race" className="label" style={{ fontSize: 14 }}>
              Race
            </label>
            <input id="main_race" name="main_race" className="input" defaultValue={profile.main_race ?? ""} maxLength={24} />
          </div>
          <div className="field">
            <label htmlFor="main_class" className="label" style={{ fontSize: 14 }}>
              Class
            </label>
            <input id="main_class" name="main_class" className="input" defaultValue={profile.main_class ?? ""} maxLength={24} />
          </div>
          <div className="field">
            <label htmlFor="realm" className="label" style={{ fontSize: 14 }}>
              Realm
            </label>
            <input id="realm" name="realm" className="input" defaultValue={profile.realm ?? ""} maxLength={40} />
          </div>
          <div className="field">
            <label htmlFor="guild" className="label" style={{ fontSize: 14 }}>
              Guild
            </label>
            <input id="guild" name="guild" className="input" defaultValue={profile.guild ?? ""} maxLength={40} />
          </div>
          <div className="field">
            <label htmlFor="faction" className="label" style={{ fontSize: 14 }}>
              Faction
            </label>
            <select id="faction" name="faction" className="select" defaultValue={profile.faction ?? ""}>
              <option value="">Not saying</option>
              <option value="horde">Horde</option>
              <option value="alliance">Alliance</option>
            </select>
          </div>
        </div>
      </fieldset>

      <div className="row" style={{ gap: 14 }}>
        <button type="submit" className="btn btn-gold btn-lg" disabled={pending}>
          {pending ? "Saving…" : "Save profile"}
        </button>
        <Status state={state} />
      </div>
    </form>
  );
}

export function YouTubeStart() {
  const [state, action, pending] = useActionState(startYouTubeVerification, initial);
  return (
    <form action={action} className="stack-sm" style={{ gap: 10 }}>
      <label htmlFor="yt-channel" className="label" style={{ fontSize: 14 }}>
        Your YouTube channel
      </label>
      <div className="row" style={{ gap: 10 }}>
        <input
          id="yt-channel"
          name="channel"
          className="input"
          placeholder="youtube.com/@yourname or @yourname"
          required
          style={{ flex: "1 1 260px", width: "auto" }}
        />
        <button type="submit" className="btn btn-gold" disabled={pending}>
          {pending ? "Looking…" : "Get my code"}
        </button>
      </div>
      <Status state={state} />
    </form>
  );
}

export function YouTubeCheck({ channelRowId }: { channelRowId: string }) {
  const [state, action, pending] = useActionState(checkYouTubeVerification, initial);
  return (
    <form action={action} className="stack-sm" style={{ gap: 8 }}>
      <input type="hidden" name="channelRowId" value={channelRowId} />
      <button type="submit" className="btn btn-gold" disabled={pending} style={{ alignSelf: "flex-start" }}>
        {pending ? "Checking…" : "I added it, check now"}
      </button>
      <Status state={state} />
    </form>
  );
}

export function TwitchLink({ linked }: { linked: boolean }) {
  const [state, action, pending] = useActionState(syncTwitch, initial);
  const [error, setError] = useState<string | null>(null);
  const [opening, setOpening] = useState(false);

  async function link() {
    setOpening(true);
    setError(null);
    const supabase = createClient();
    const { error: linkError } = await supabase.auth.linkIdentity({
      provider: "twitch",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/settings%23channels` },
    });
    if (linkError) {
      setOpening(false);
      setError("Linking Twitch isn't available right now. You can also log out and log in with Twitch.");
    }
  }

  if (linked) {
    return (
      <form action={action} className="stack-sm" style={{ gap: 8 }}>
        <button type="submit" className="btn btn-ghost" disabled={pending} style={{ alignSelf: "flex-start" }}>
          {pending ? "Checking…" : "Verify my linked Twitch channel"}
        </button>
        <Status state={state} />
      </form>
    );
  }
  return (
    <div className="stack-sm" style={{ gap: 8 }}>
      <button type="button" className="btn btn-ghost" onClick={link} disabled={opening} style={{ alignSelf: "flex-start" }}>
        {opening ? "Opening Twitch…" : "Link my Twitch account"}
      </button>
      {error ? (
        <p className="small" role="alert" style={{ margin: 0, color: "var(--red)" }}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function DeleteAccount({ username }: { username: string }) {
  const [state, action, pending] = useActionState(deleteAccount, initial);
  return (
    <form action={action} className="stack-sm" style={{ gap: 10 }}>
      <label htmlFor="confirm-delete" className="label" style={{ fontSize: 14 }}>
        Type <code>{username}</code> to delete your account
      </label>
      <div className="row" style={{ gap: 10 }}>
        <input id="confirm-delete" name="confirm" className="input" autoComplete="off" style={{ flex: "1 1 220px", width: "auto" }} />
        <button type="submit" className="btn btn-danger" disabled={pending}>
          {pending ? "Deleting…" : "Delete my account"}
        </button>
      </div>
      <p className="help">
        This removes your profile, votes, favorites and comments. Videos you shared stay up, credited to the channel
        that made them.
      </p>
      <Status state={state} />
    </form>
  );
}
