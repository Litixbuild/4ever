import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabasePublicKey, supabaseUrl } from "@/lib/env";
import { site } from "@/lib/site";

// Rebuilt at most once an hour.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages: MetadataRoute.Sitemap = [
    "",
    "/browse",
    "/browse?kind=movie",
    "/browse?kind=clip",
    "/contests",
    "/creators",
    "/hall-of-fame",
    "/music-guide",
    "/rules",
  ].map((path) => ({ url: `${site.url}${path}`, changeFrequency: "daily", priority: path === "" ? 1 : 0.6 }));

  if (!isSupabaseConfigured()) return pages;

  try {
    // A plain public client: it only sees what any visitor could see.
    const supabase = createClient(supabaseUrl(), supabasePublicKey(), { auth: { persistSession: false } });
    const [clips, contests, creators] = await Promise.all([
      supabase
        .from("clips")
        .select("short_id, published_at")
        .eq("status", "approved")
        .order("published_at", { ascending: false })
        .limit(2000),
      supabase.from("contests").select("slug, opens_at"),
      supabase.rpc("creator_directory", { p_limit: 500 }),
    ]);

    for (const clip of (clips.data ?? []) as { short_id: string; published_at: string | null }[]) {
      pages.push({
        url: `${site.url}/c/${clip.short_id}`,
        lastModified: clip.published_at ?? undefined,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
    for (const contest of (contests.data ?? []) as { slug: string }[]) {
      pages.push({ url: `${site.url}/contests/${contest.slug}`, changeFrequency: "daily", priority: 0.7 });
    }
    for (const creator of (creators.data ?? []) as { username: string }[]) {
      pages.push({ url: `${site.url}/u/${creator.username}`, changeFrequency: "weekly", priority: 0.5 });
    }
  } catch {
    // If the database can't be reached, still return the main pages.
  }

  return pages;
}
