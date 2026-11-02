import Link from "next/link";
import { closeSuggestion, replyToSuggestion } from "@/app/admin/actions";
import { AdminNotice } from "@/components/admin-notice";
import { Avatar } from "@/components/people";
import { requireCurator } from "@/lib/auth";
import { timeAgo } from "@/lib/format";
import { topicLabel } from "@/lib/suggestions";
import { createAdminClient } from "@/lib/supabase/admin";

type Row = {
  id: string;
  topic: string;
  body: string;
  status: "open" | "answered" | "closed";
  reply: string | null;
  replied_at: string | null;
  reply_seen_at: string | null;
  created_at: string;
  author: { username: string; display_name: string; avatar_url: string | null } | null;
};

const VIEWS = [
  { value: "open", label: "Open" },
  { value: "answered", label: "Answered" },
  { value: "closed", label: "Closed" },
] as const;

export default async function SuggestionsAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; view?: string }>;
}) {
  await requireCurator();
  const params = await searchParams;
  const view = VIEWS.some((v) => v.value === params.view) ? (params.view as Row["status"]) : "open";

  const { data } = await createAdminClient()
    .from("suggestions")
    .select(
      "id, topic, body, status, reply, replied_at, reply_seen_at, created_at, author:profiles!suggestions_author_id_fkey ( username, display_name, avatar_url )",
    )
    .eq("status", view)
    .order(view === "open" ? "created_at" : "replied_at", { ascending: view === "open", nullsFirst: false })
    .limit(200);
  const rows = (data ?? []) as unknown as Row[];
  const returnTo = `/admin/suggestions${view === "open" ? "" : `?view=${view}`}`;

  return (
    <div className="stack-lg">
      <AdminNotice notice={params.notice} />
      <nav aria-label="Suggestions" className="seg" style={{ alignSelf: "flex-start" }}>
        {VIEWS.map((v) => (
          <Link
            key={v.value}
            href={v.value === "open" ? "/admin/suggestions" : `/admin/suggestions?view=${v.value}`}
            aria-current={view === v.value ? "page" : undefined}
          >
            {v.label}
          </Link>
        ))}
      </nav>

      {rows.length === 0 ? (
        <div className="empty">
          <h2 className="h3">{view === "open" ? "No open suggestions" : `Nothing ${view} yet`}</h2>
          <p className="muted" style={{ margin: 0 }}>
            People send these from the Suggest link in the footer and their account menu.
          </p>
        </div>
      ) : (
        <div className="stack">
          {rows.map((s) => (
            <article key={s.id} className="card stack" style={{ gap: 12 }}>
              <div className="row-between" style={{ alignItems: "center" }}>
                <span className="row" style={{ gap: 10, alignItems: "center" }}>
                  {s.author ? (
                    <>
                      <Avatar name={s.author.display_name} src={s.author.avatar_url} size={28} />
                      <Link href={`/u/${s.author.username}`} style={{ fontWeight: 800 }}>
                        {s.author.display_name}
                      </Link>
                    </>
                  ) : (
                    <span className="muted">Deleted account</span>
                  )}
                  <span className="pill pill-muted">{topicLabel(s.topic)}</span>
                </span>
                <span className="tiny faint">{timeAgo(s.created_at)}</span>
              </div>
              <p className="pre-line" style={{ margin: 0, color: "var(--text-2)" }}>
                {s.body}
              </p>

              {s.reply ? (
                <div className="suggestion-reply">
                  <span className="suggestion-reply-head">
                    Your reply {s.replied_at ? <span className="tiny faint">{timeAgo(s.replied_at)}</span> : null}
                    <span className="tiny faint">{s.reply_seen_at ? "· Read" : "· Not read yet"}</span>
                  </span>
                  <p className="pre-line" style={{ margin: 0 }}>
                    {s.reply}
                  </p>
                </div>
              ) : null}

              {s.author ? (
                <form action={replyToSuggestion} className="stack" style={{ gap: 10 }}>
                  <input type="hidden" name="suggestionId" value={s.id} />
                  <input type="hidden" name="returnTo" value={returnTo} />
                  <label htmlFor={`reply-${s.id}`} className="sr-only">
                    Reply to {s.author.display_name}
                  </label>
                  <textarea
                    id={`reply-${s.id}`}
                    name="reply"
                    className="textarea"
                    rows={3}
                    maxLength={1500}
                    required
                    defaultValue={s.reply ?? ""}
                    placeholder={`Reply to ${s.author.display_name}`}
                  />
                  <div className="row">
                    <button type="submit" className="btn btn-gold">
                      {s.reply ? "Update reply" : "Send reply"}
                    </button>
                    {s.status !== "closed" ? (
                      <button type="submit" formAction={closeSuggestion} formNoValidate className="btn btn-ghost">
                        Close without replying
                      </button>
                    ) : (
                      <button
                        type="submit"
                        formAction={closeSuggestion}
                        formNoValidate
                        name="reopen"
                        value="1"
                        className="btn btn-ghost"
                      >
                        Reopen
                      </button>
                    )}
                  </div>
                </form>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
