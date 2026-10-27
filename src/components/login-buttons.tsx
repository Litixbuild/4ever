"use client";

import { useState } from "react";
import type { LoginProvider } from "@/lib/auth-providers";
import { createClient } from "@/lib/supabase/client";

const BUTTONS: Record<LoginProvider, { label: string; note: string }> = {
  discord: { label: "Continue with Discord", note: "" },
  twitch: { label: "Continue with Twitch", note: "Verifies your Twitch channel automatically" },
  google: { label: "Continue with Google", note: "" },
};

export function LoginButtons({ next, providers }: { next: string; providers: LoginProvider[] }) {
  const [pending, setPending] = useState<LoginProvider | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function login(provider: LoginProvider) {
    setPending(provider);
    setError(null);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    if (authError) {
      setPending(null);
      setError(
        providers.length > 1
          ? "That login option isn't available right now. Try another one."
          : "Logging in isn't working right now. Try again in a minute.",
      );
    }
  }

  return (
    <div className="stack" style={{ gap: 12 }}>
      {providers.map((id) => (
        <div key={id} className="stack-sm" style={{ gap: 4 }}>
          <button
            type="button"
            className={`btn btn-lg btn-block btn-${id}`}
            onClick={() => login(id)}
            disabled={pending !== null}
          >
            {pending === id ? "Opening…" : BUTTONS[id].label}
          </button>
          {BUTTONS[id].note ? (
            <span className="tiny muted" style={{ textAlign: "center" }}>
              {BUTTONS[id].note}
            </span>
          ) : null}
        </div>
      ))}
      {error ? (
        <p className="notice notice-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
