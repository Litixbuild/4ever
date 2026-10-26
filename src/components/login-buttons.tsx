"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Provider = "discord" | "twitch" | "google";

const PROVIDERS: { id: Provider; label: string; note: string }[] = [
  { id: "discord", label: "Continue with Discord", note: "" },
  { id: "twitch", label: "Continue with Twitch", note: "Verifies your Twitch channel automatically" },
  { id: "google", label: "Continue with Google", note: "" },
];

export function LoginButtons({ next }: { next: string }) {
  const [pending, setPending] = useState<Provider | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function login(provider: Provider) {
    setPending(provider);
    setError(null);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    if (authError) {
      setPending(null);
      setError("That login option isn't available right now. Try another one.");
    }
  }

  return (
    <div className="stack" style={{ gap: 12 }}>
      {PROVIDERS.map((provider) => (
        <div key={provider.id} className="stack-sm" style={{ gap: 4 }}>
          <button
            type="button"
            className="btn btn-ghost btn-lg btn-block"
            onClick={() => login(provider.id)}
            disabled={pending !== null}
          >
            {pending === provider.id ? "Opening…" : provider.label}
          </button>
          {provider.note ? <span className="tiny muted" style={{ textAlign: "center" }}>{provider.note}</span> : null}
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
