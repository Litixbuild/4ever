import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { refreshStaleClips } from "@/lib/refresh";

// Called once a day by the scheduled Netlify function in netlify/functions/refresh-videos.mts.
// The caller proves itself with a token derived from the server's secret key, which never leaves the server.
function expectedToken(): string | null {
  const secret = process.env.SUPABASE_SECRET_KEY;
  return secret ? createHash("sha256").update(`${secret}:refresh-videos`).digest("hex") : null;
}

export async function POST(request: NextRequest) {
  const expected = expectedToken();
  const given = (request.headers.get("authorization") ?? "").replace(/^Bearer /, "");
  if (!expected || given.length !== expected.length || !timingSafeEqual(Buffer.from(given), Buffer.from(expected))) {
    return new NextResponse(null, { status: 401 });
  }
  const result = await refreshStaleClips();
  return NextResponse.json(result);
}
