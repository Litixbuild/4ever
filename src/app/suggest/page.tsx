import type { Metadata } from "next";
import Link from "next/link";
import { SuggestForm } from "@/components/suggest-form";
import { getViewer } from "@/lib/auth";
import { timeAgo } from "@/lib/format";
import { isSuggestionTopic, topicLabel, type Suggestion } from "@/lib/suggestions";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Suggest something", robots: { index: false } };

export default async function SuggestPage({ searchParams }: { searchParams: Promise<{ topic?: string }> }) {
  const { topic } = await searchParams;
  const viewer = await getViewer();

  let mine: Suggestion[] = [];
  if (viewer) {
    const admin = createAdminClient();
    const { data } = await admin
      .from("suggestions")
      .select("id, topic, body, status, reply, replied_at, reply_seen_at, created_at")
      .eq("author_id", viewer.userId)
      .order("created_at", { ascending: false })
      .limit(50);
    mine = (data ?? []) as Suggestion[];
    // Opening this page counts as reading the replies.
    if (mine.some((s) => s.replied_at && !s.reply_seen_at)) {
      await admin
        .from("suggestions")
        .update({ reply_seen_at: new Date().toISOString() })
        .eq("author_id", viewer.userId)
        .not("replied_at", "is", null)
        .is("reply_seen_at", null);
    }
  }

  return (
    <div className="container page page-narrow" style={{ gap: 24 }}>
      <div className="stack" style={{ gap: 8 }}>
        <h1 className="h1">Suggest something</h1>
        <p className="lead">
          An idea, a bug, a creator we&apos;re missing. It goes straight to the person who runs 4Ever, and the reply
          shows up right here.
        </p>
      </div>

      {viewer ? (
        <SuggestForm defaultTopic={isSuggestionTopic(topic) ? topic : "idea"} />
      ) : (
        <div className="form-card stack" style={{ gap: 12 }}>
          <p style={{ margin: 0 }}>Log in so we know who to reply to. It takes one click with Discord or Twitch.</p>
          <Link href="/login?next=%2Fsuggest" className="btn btn-gold" style={{ alignSelf: "flex-start" }}>
            Log in to send a suggestion
          </Link>
        </div>
      )}

      {mine.length > 0 ? (
        <section className="stack" style={{ gap: 14 }} aria-labelledby="mine-title">
          <h2 id="mine-title" className="h3">
            Your suggestions
          </h2>
          {mine.map((s) => (
            <article key={s.id} className={`card stack suggestion ${s.replied_at && !s.reply_seen_at ? "is-new" : ""}`}>
              <div className="row-between" style={{ alignItems: "center" }}>
                <span className="pill pill-muted">{topicLabel(s.topic)}</span>
                <span className="tiny faint">{timeAgo(s.created_at)}</span>
              </div>
              <p className="pre-line" style={{ margin: 0, color: "var(--text-2)" }}>
                {s.body}
              </p>
              {s.reply ? (
                <div className="suggestion-reply">
                  <span className="suggestion-reply-head">
                    Reply from 4Ever
                    {s.replied_at && !s.reply_seen_at ? <span className="pill pill-gold">New</span> : null}
                  </span>
                  <p className="pre-line" style={{ margin: 0 }}>
                    {s.reply}
                  </p>
                </div>
              ) : (
                <span className="small muted">
                  {s.status === "closed" ? "Read, no reply needed." : "Waiting for a reply."}
                </span>
              )}
            </article>
          ))}
        </section>
      ) : null}
    </div>
  );
}
