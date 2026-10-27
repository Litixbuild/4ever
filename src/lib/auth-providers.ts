import { supabasePublicKey, supabaseUrl } from "@/lib/env";

export type LoginProvider = "discord" | "twitch" | "google";

export const LOGIN_PROVIDERS: { id: LoginProvider; name: string }[] = [
  { id: "discord", name: "Discord" },
  { id: "twitch", name: "Twitch" },
  { id: "google", name: "Google" },
];

const ALL: LoginProvider[] = LOGIN_PROVIDERS.map((provider) => provider.id);

/**
 * The login options switched on in Supabase (Authentication → Sign In / Providers).
 * Read from Supabase's public auth settings and cached for five minutes, so turning a provider on or off
 * there shows up on the site without a redeploy. If Supabase can't be reached, every option is shown.
 */
export async function enabledProviders(): Promise<LoginProvider[]> {
  try {
    const response = await fetch(`${supabaseUrl()}/auth/v1/settings`, {
      headers: { apikey: supabasePublicKey() },
      next: { revalidate: 300 },
    });
    if (!response.ok) return ALL;
    return pickEnabled(await response.json());
  } catch {
    return ALL;
  }
}

/** Picks our providers out of Supabase's `/auth/v1/settings` response. */
export function pickEnabled(settings: unknown): LoginProvider[] {
  const external = (settings as { external?: unknown } | null)?.external;
  if (!external || typeof external !== "object") return ALL;
  return ALL.filter((id) => (external as Record<string, unknown>)[id] === true);
}

/** "Discord", "Discord or Twitch", "Discord, Twitch or Google" */
export function providerList(providers: LoginProvider[]): string {
  const names = LOGIN_PROVIDERS.filter((provider) => providers.includes(provider.id)).map((provider) => provider.name);
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} or ${names[names.length - 1]}`;
}
