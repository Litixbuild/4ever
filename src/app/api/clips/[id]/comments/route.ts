import { NextResponse, type NextRequest } from "next/server";
import { getComments } from "@/lib/queries";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type FeedComment = {
  id: string;
  body: string;
  createdAt: string;
  author: { name: string; username: string; avatar: string | null } | null;
};

// Comments for the swipe feed's comment sheet. Reads with the visitor's session, so the database rules apply.
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) return NextResponse.json({ comments: [] }, { status: 404 });
  const rows = await getComments(id);
  const comments: FeedComment[] = rows.map((c) => ({
    id: c.id,
    body: c.body,
    createdAt: c.created_at,
    author: c.author ? { name: c.author.display_name, username: c.author.username, avatar: c.author.avatar_url } : null,
  }));
  return NextResponse.json({ comments }, { headers: { "cache-control": "no-store" } });
}
