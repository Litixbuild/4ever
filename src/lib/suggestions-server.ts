import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

// How many admin replies this person hasn't read yet (drives the dot in the user menu).
export async function unreadReplies(userId: string): Promise<number> {
  try {
    const { count } = await createAdminClient()
      .from("suggestions")
      .select("id", { count: "exact", head: true })
      .eq("author_id", userId)
      .not("replied_at", "is", null)
      .is("reply_seen_at", null);
    return count ?? 0;
  } catch {
    return 0;
  }
}
