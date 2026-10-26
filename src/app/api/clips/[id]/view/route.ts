import { createHash } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { getViewer } from "@/lib/auth";
import { viewHashSalt } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const BOTS = /bot|crawl|spider|slurp|preview|facebookexternalhit|embedly|headless|lighthouse/i;

// Counts a view when someone presses play. Each person counts once per clip per day.
// We never store IP addresses: only a one-way hash that changes every day.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) return new NextResponse(null, { status: 404 });

  // Only count plays that come from this site.
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) return new NextResponse(null, { status: 403 });

  const userAgent = request.headers.get("user-agent") ?? "";
  if (!userAgent || BOTS.test(userAgent)) return new NextResponse(null, { status: 204 });

  const viewer = await getViewer();
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  const day = new Date().toISOString().slice(0, 10);
  const who = viewer ? `user:${viewer.userId}` : `anon:${ip}|${userAgent}`;
  const viewerHash = createHash("sha256").update(`${viewHashSalt()}|${who}|${day}`).digest("hex");

  const admin = createAdminClient();
  const { data: clip } = await admin
    .from("clips")
    .select("id")
    .eq("id", id)
    .eq("status", "approved")
    .maybeSingle();
  if (!clip) return new NextResponse(null, { status: 404 });

  await admin
    .from("clip_views")
    .upsert({ clip_id: id, viewer_hash: viewerHash, day }, { onConflict: "clip_id,viewer_hash,day", ignoreDuplicates: true });

  return new NextResponse(null, { status: 204 });
}
