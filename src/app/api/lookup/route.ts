import { NextResponse, type NextRequest } from "next/server";
import { getViewer } from "@/lib/auth";
import { formatDuration } from "@/lib/format";
import { lookupErrorMessage, lookupVideo } from "@/lib/lookup";
import { duplicateMessage, findExistingClip } from "@/lib/submissions";

export type LookupResponse =
  | {
      ok: true;
      preview: {
        platform: string;
        sourceType: string;
        title: string;
        channelName: string;
        channelId: string | null;
        thumbnailUrl: string | null;
        duration: string;
      };
    }
  | { ok: false; error: string; existingShortId?: string };

// Used by the submit form to preview a link before submitting.
export async function GET(request: NextRequest) {
  const viewer = await getViewer();
  if (!viewer) {
    return NextResponse.json<LookupResponse>({ ok: false, error: "Log in to submit clips." }, { status: 401 });
  }

  const url = request.nextUrl.searchParams.get("url") ?? "";
  try {
    const meta = await lookupVideo(url);
    const existing = await findExistingClip(meta.ref);
    if (existing) {
      return NextResponse.json<LookupResponse>({
        ok: false,
        error: duplicateMessage(existing),
        existingShortId: existing.status === "approved" ? existing.short_id : undefined,
      });
    }
    return NextResponse.json<LookupResponse>({
      ok: true,
      preview: {
        platform: meta.ref.platform,
        sourceType: meta.ref.sourceType,
        title: meta.title,
        channelName: meta.channelName,
        channelId: meta.channelId,
        thumbnailUrl: meta.thumbnailUrl,
        duration: formatDuration(meta.durationSeconds),
      },
    });
  } catch (error) {
    return NextResponse.json<LookupResponse>({ ok: false, error: lookupErrorMessage(error) });
  }
}
