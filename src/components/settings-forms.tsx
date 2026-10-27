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
import { CharacterTip, hasCharacter } from "@/components/character-tip";
import { site } from "@/lib/site";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";
import { CLASSES, RACES, RULESETS, raceFaction, specsFor } from "@/lib/wow";

const initial: FormState = { ok: false, message: null };

function Status({ state }: { state: FormState }) {
  if (!state.message) return null;
  return (
    <p
      className="small"
      role="status"
      style={{
        margin: 0,
        color: state.ok ? "var(--green)" : "var(--red)",
        fontWeight: 700,
      }}
    >
      {state.message}
    </p>
  );
}

// Keeps a saved value that isn't in the list (typed before the pickers existed) selectable.
function withCurrent(options: readonly string[], current: string): string[] {
  return current && !options.some((o) => o.toLowerCase() === current.toLowerCase())
    ? [...options, current]
    : [...options];
}

export function ProfileForm({ profile, titles }: { profile: Profile; titles: { key: string; label: string }[] }) {
  const [state, action, pending] = useActionState(updateProfile, initial);
  const [username, setUsername] = useState(profile.username);
  // Forever characters have a first and a last name; they're saved together as one name.
  const [first, ...rest] = (profile.main_character ?? "").trim().split(/\s+/);
  const [names, setNames] = useState({ first: first ?? "", last: rest.join(" ") });
  const [character, setCharacter] = useState({
    spec: profile.main_spec ?? "",
    race: profile.main_race ?? "",
    className: profile.main_class ?? "",
    realm: profile.realm ?? "",
    guild: profile.guild ?? "",
    faction: profile.faction ?? "",
  });
  const fullName = `${names.first.trim()} ${names.last.trim()}`.trim();
  const set = (key: keyof typeof character) => (e: { target: { value: string } }) =>
    setCharacter((c) => ({ ...c, [key]: e.target.value }));
  const host = new URL(site.url).host;
  const races = withCurrent(
    RACES.map((r) => r.name),
    character.race,
  );
  const classes = withCurrent(CLASSES, character.className);

  return (
    <form action={action} className="form-card" style={{ gap: 22 }}>
      <div className="field-grid">
        <div className="field">
          <label htmlFor="display_name" className="label">
            Display name
          </label>
          <input
            id="display_name"
            name="display_name"
            className="input"
            defaultValue={profile.display_name}
            maxLength={40}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="username" className="label">
            Username
          </label>
          <input
            id="username"
            name="username"
            className="input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            maxLength={24}
            pattern="[A-Za-z0-9_]{3,24}"
            required
            aria-describedby="username-help"
          />
          <p id="username-help" className="help" style={{ overflowWrap: "anywhere" }}>
            Your profile lives at {host}/u/{username || "your-name"}. Letters, numbers and underscores.
          </p>
        </div>
      </div>

      <div className="field">
        <label htmlFor="bio" className="label">
          Bio <span className="optional">(optional)</span>
        </label>
        <textarea
          id="bio"
          name="bio"
          className="textarea"
          defaultValue={profile.bio ?? ""}
          maxLength={280}
          rows={3}
          placeholder="Rogue main since 2005..."
        />
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
        <p className="help">
          {titles.length === 0 ? "Earn achievements to unlock titles." : "Shown under your name on your profile."}
        </p>
      </div>

      <fieldset className="form-section">
        <legend>Main character (optional)</legend>
        <div className="character-editor">
          <div className="field-grid">
            <input type="hidden" name="main_character" value={fullName} />
            <div className="field">
              <label htmlFor="char-first" className="label" style={{ fontSize: 14 }}>
                First name
              </label>
              <input
                id="char-first"
                className="input"
                value={names.first}
                onChange={(e) => setNames((n) => ({ ...n, first: e.target.value.replace(/\s/g, "") }))}
                maxLength={12}
                autoComplete="off"
              />
            </div>
            <div className="field">
              <label htmlFor="char-last" className="label" style={{ fontSize: 14 }}>
                Last name
              </label>
              <input
                id="char-last"
                className="input"
                value={names.last}
                onChange={(e) => setNames((n) => ({ ...n, last: e.target.value.replace(/\s/g, "") }))}
                maxLength={11}
                autoComplete="off"
              />
            </div>
            <div className="field">
              <label htmlFor="main_race" className="label" style={{ fontSize: 14 }}>
                Race
              </label>
              <select
                id="main_race"
                name="main_race"
                className="select"
                value={character.race}
                onChange={(e) => {
                  const race = e.target.value;
                  setCharacter((c) => ({
                    ...c,
                    race,
                    faction: raceFaction(race) ?? c.faction,
                  }));
                }}
              >
                <option value="">Choose</option>
                {races.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="main_class" className="label" style={{ fontSize: 14 }}>
                Class
              </label>
              <select
                id="main_class"
                name="main_class"
                className="select"
                value={character.className}
                onChange={(e) => {
                  const className = e.target.value;
                  // A new class keeps the spec only if that class has a spec by the same name.
                  setCharacter((c) => ({ ...c, className, spec: specsFor(className).includes(c.spec) ? c.spec : "" }));
                }}
              >
                <option value="">Choose</option>
                {classes.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="main_spec" className="label" style={{ fontSize: 14 }}>
                Spec
              </label>
              <select
                id="main_spec"
                name="main_spec"
                className="select"
                value={character.spec}
                onChange={set("spec")}
                disabled={specsFor(character.className).length === 0}
              >
                <option value="">{character.className ? "Choose" : "Pick a class first"}</option>
                {withCurrent(specsFor(character.className), character.spec).map((sp) => (
                  <option key={sp} value={sp}>
                    {sp}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="realm" className="label" style={{ fontSize: 14 }}>
                Ruleset
              </label>
              <select id="realm" name="realm" className="select" value={character.realm} onChange={set("realm")}>
                <option value="">Choose</option>
                {withCurrent(RULESETS, character.realm).map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="guild" className="label" style={{ fontSize: 14 }}>
                Guild
              </label>
              <input
                id="guild"
                name="guild"
                className="input"
                value={character.guild}
                onChange={set("guild")}
                maxLength={40}
              />
            </div>
            <div className="field">
              <label htmlFor="faction" className="label" style={{ fontSize: 14 }}>
                Faction
              </label>
              <select
                id="faction"
                name="faction"
                className="select"
                value={character.faction}
                onChange={set("faction")}
              >
                <option value="">Not saying</option>
                <option value="horde">Horde</option>
                <option value="alliance">Alliance</option>
              </select>
            </div>
          </div>
          <div className="character-preview" aria-live="polite">
            <span className="help">How it shows on your profile</span>
            {hasCharacter({ ...character, name: fullName }) ? (
              <CharacterTip character={{ ...character, name: fullName }} fallbackName={profile.display_name} />
            ) : (
              <div className="wow-tip">
                <span className="tip-muted">Add a name, class or ruleset and your character shows up here.</span>
              </div>
            )}
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
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/settings%23channels`,
      },
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
      <button
        type="button"
        className="btn btn-ghost"
        onClick={link}
        disabled={opening}
        style={{ alignSelf: "flex-start" }}
      >
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
        <input
          id="confirm-delete"
          name="confirm"
          className="input"
          autoComplete="off"
          style={{ flex: "1 1 220px", width: "auto" }}
        />
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
