import { createAdminClient } from "@/lib/supabase/admin";

export const SUGGESTION_TOPICS = [
  { value: "idea", label: "An idea for the site" },
  { value: "bug", label: "Something's broken" },
  { value: "content", label: "A creator or clip we should add" },
  { value: "other", label: "Something else" },
] as const;

export type SuggestionTopic = (typeof SUGGESTION_TOPICS)[number]["value"];

export function isSuggestionTopic(value: unknown): value is SuggestionTopic {
  return SUGGESTION_TOPICS.some((t) => t.value === value);
}

export function topicLabel(value: string) {
  return SUGGESTION_TOPICS.find((t) => t.value === value)?.label ?? "Something else";
}

export type Suggestion = {
  id: string;
  topic: string;
  body: string;
  status: "open" | "answered" | "closed";
  reply: string | null;
  replied_at: string | null;
  reply_seen_at: string | null;
  created_at: string;
};

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
