import { NextResponse, type NextRequest } from "next/server";
import { getViewer } from "@/lib/auth";
import { DAILY_XP_CAP, rankProgress } from "@/lib/ranks";
import { createAdminClient } from "@/lib/supabase/admin";

export type XpResponse = { xp: number; awarded: boolean; rankedUp: boolean };

// The browser calls this after each full minute of watching (src/lib/watch-xp.ts).
// The database decides whether the minute counts: one per 50 seconds, DAILY_XP_CAP a day.
export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) return new NextResponse(null, { status: 403 });

  const viewer = await getViewer();
  if (!viewer?.profile) return new NextResponse(null, { status: 401 });

  const { data, error } = await createAdminClient()
    .rpc("award_watch_minute", { p_user: viewer.userId, p_cap: DAILY_XP_CAP })
    .single<{ xp: number; awarded: boolean }>();
  if (error || !data) return new NextResponse(null, { status: 500 });

  const before = rankProgress(data.awarded ? data.xp - 1 : data.xp, null).rank;
  const after = rankProgress(data.xp, null).rank;
  return NextResponse.json<XpResponse>(
    { xp: data.xp, awarded: data.awarded, rankedUp: after > before },
    { headers: { "cache-control": "no-store" } },
  );
}
