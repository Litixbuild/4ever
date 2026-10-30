import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export type Viewer = {
  userId: string;
  email: string | null;
  profile: Profile | null;
  isCurator: boolean;
  isAdmin: boolean;
};

const PROFILE_COLUMNS =
  "id, username, display_name, avatar_url, bio, main_character, main_level, main_race, main_class, main_spec, class_prompted_at, realm, guild, faction, active_title, role, created_at";

// Who is looking at the page? Cached for the length of one request.
export const getViewer = cache(async (): Promise<Viewer | null> => {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", claims.sub)
    .maybeSingle<Profile>();

  const role = profile?.role ?? "member";
  return {
    userId: claims.sub,
    email: typeof claims.email === "string" ? claims.email : null,
    profile: profile ?? null,
    isCurator: role === "curator" || role === "admin",
    isAdmin: role === "admin",
  };
});

// Send visitors to the login page if they are not signed in.
export async function requireViewer(nextPath: string): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  return viewer;
}

export async function requireCurator(): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer?.isCurator) notFound();
  return viewer;
}

export async function requireAdmin(): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer?.isAdmin) notFound();
  return viewer;
}
