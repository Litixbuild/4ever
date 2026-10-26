import type { Metadata } from "next";
import Link from "next/link";
import { Avatar } from "@/components/people";
import { BADGES, titleFor } from "@/lib/badges";
import { formatCount, plural } from "@/lib/format";
import { getCreatorDirectory } from "@/lib/queries";

export const metadata: Metadata = { title: "Creators" };

export default async function CreatorsPage() {
  const creators = await getCreatorDirectory(90);

  return (
    <div className="container page" style={{ gap: 28 }}>
      <div className="stack" style={{ gap: 8 }}>
        <span className="eyebrow">The guild</span>
        <h1 className="h1">Creators</h1>
        <p className="lead">
          Everyone with a verified channel and at least one video on 4Ever, most watched first.
        </p>
      </div>

      {creators.length > 0 ? (
        <div className="achievement-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
          {creators.map((creator) => {
            const title = titleFor(creator.active_title, creator.display_name);
            const color = BADGES.find((b) => b.key === creator.active_title)?.color;
            return (
              <Link key={creator.id} href={`/u/${creator.username}`} className="achievement" style={{ textDecoration: "none", color: "inherit" }}>
                <Avatar name={creator.display_name} src={creator.avatar_url} size={52} />
                <span className="stack-sm" style={{ gap: 2, minWidth: 0 }}>
                  <strong style={{ color: "var(--text)", fontSize: 16 }}>{creator.display_name}</strong>
                  {title ? (
                    <span className="small" style={{ color, fontWeight: 700 }}>
                      {title}
                    </span>
                  ) : null}
                  <span className="small muted">
                    {plural(creator.clip_count, "video")} · {formatCount(creator.total_views)} views
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="empty">
          <h2 className="h3">No creators yet</h2>
          <p className="muted" style={{ margin: 0 }}>
            Verify your YouTube or Twitch channel and get a video approved to be the first one here.
          </p>
          <Link href="/settings#channels" className="btn btn-gold">
            Verify your channel
          </Link>
        </div>
      )}
    </div>
  );
}
