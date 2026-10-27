import type { Metadata } from "next";
import Link from "next/link";
import { UserIcon } from "@/components/icons";
import { Avatar, VerifiedMark } from "@/components/people";
import { BADGES, titleFor } from "@/lib/badges";
import { formatCount, plural } from "@/lib/format";
import { getCreatorDirectory } from "@/lib/queries";
import { bannerFor, factionColor, factionName } from "@/lib/wow";

export const metadata: Metadata = { title: "Creators" };

export default async function CreatorsPage() {
  const creators = await getCreatorDirectory(90);

  return (
    <div className="container page" style={{ gap: 30 }}>
      <div className="page-head">
        <h1 className="h1">Creators</h1>
        <p className="lead">Everyone with a verified channel and at least one video on 4Ever, most watched first.</p>
      </div>

      <ol className="creator-grid list-plain">
        {creators.map((creator, i) => {
          const title = titleFor(creator.active_title, creator.display_name);
          const color = BADGES.find((b) => b.key === creator.active_title)?.color;
          const faction = factionName(creator.faction);
          return (
            <li key={creator.id}>
              <Link href={`/u/${creator.username}`} className="creator-card">
                <span className="creator-banner">
                  <img src={bannerFor(creator.faction)} alt="" loading="lazy" />
                  <span className="creator-rank">{i + 1}</span>
                </span>
                <span className="creator-body">
                  <Avatar name={creator.display_name} src={creator.avatar_url} size={60} className="creator-avatar" />
                  <span className="creator-name">
                    {creator.display_name} <VerifiedMark size={16} />
                  </span>
                  {title ? (
                    <span className="creator-title" style={{ color }}>
                      {title}
                    </span>
                  ) : null}
                  <span className="creator-stats">
                    <span>{plural(creator.clip_count, "video")}</span>
                    <span>{formatCount(creator.total_views)} views</span>
                    {faction ? <span style={{ color: factionColor(creator.faction) }}>{faction}</span> : null}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
        <li>
          <Link href="/settings#channels" className="creator-card creator-slot">
            <span className="slot-icon">
              <UserIcon size={26} />
            </span>
            <span className="creator-name">{creators.length > 0 ? "Your name here" : "The first creator"}</span>
            <span className="small muted">
              Verify your YouTube or Twitch channel and get a video approved to join this list.
            </span>
            <span className="small" style={{ color: "var(--gold-hi)", fontWeight: 700 }}>
              Verify your channel
            </span>
          </Link>
        </li>
      </ol>
    </div>
  );
}
