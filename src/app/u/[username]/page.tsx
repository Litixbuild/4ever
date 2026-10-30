import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CharacterTip, hasCharacter } from "@/components/character-tip";
import { ClipGrid } from "@/components/clip-card";
import { OpenClassPicker } from "@/components/open-class-picker";
import { DotIcon, LockIcon, StarIcon, StreamIcon, VideoIcon } from "@/components/icons";
import { Avatar, VerifiedMark } from "@/components/people";
import { getViewer } from "@/lib/auth";
import { BADGES, titleFor } from "@/lib/badges";
import { formatCount, formatDate } from "@/lib/format";
import { bannerFor, factionColor, factionName } from "@/lib/wow";
import {
  getBadges,
  getChannels,
  getClipsByCreator,
  getClipsSharedBy,
  getCreatorStats,
  getFavoriteClips,
  getProfileByUsername,
} from "@/lib/queries";

type Params = { params: Promise<{ username: string }> };
type Tab = "made" | "shared" | "favorites";

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { username } = await params;
  const profile = await getProfileByUsername(username);
  if (!profile) return { title: "Not found" };
  return {
    title: profile.display_name,
    description: profile.bio ?? `${profile.display_name}'s movies and clips on 4Everclips.`,
    alternates: { canonical: `/u/${profile.username}` },
  };
}

function rgba(hex: string, alpha: number) {
  const n = Number.parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

export default async function ProfilePage({
  params,
  searchParams,
}: Params & { searchParams: Promise<{ tab?: string; deleted?: string }> }) {
  const { username } = await params;
  const { tab: tabParam, deleted } = await searchParams;
  const profile = await getProfileByUsername(username);
  if (!profile) notFound();

  const tab: Tab = tabParam === "shared" || tabParam === "favorites" ? tabParam : "made";
  const viewer = await getViewer();
  const isOwn = viewer?.userId === profile.id;

  const [stats, badges, channels, clips] = await Promise.all([
    getCreatorStats(profile.id),
    getBadges(profile.id),
    getChannels(profile.id),
    tab === "shared"
      ? getClipsSharedBy(profile.id)
      : tab === "favorites"
        ? getFavoriteClips(profile.id)
        : getClipsByCreator(profile.id),
  ]);

  const verifiedChannels = channels.filter((c) => c.verified_at);
  const earned = new Set(badges.map((b) => b.badge));
  const title = titleFor(profile.active_title, profile.display_name);
  const titleColor = BADGES.find((b) => b.key === profile.active_title)?.color ?? "var(--purple)";
  const character = {
    name: profile.main_character,
    spec: profile.main_spec,
    race: profile.main_race,
    className: profile.main_class,
    realm: profile.realm,
    guild: profile.guild,
    faction: profile.faction,
  };
  const factionLabel = factionName(profile.faction);
  // Curator is staff-only and contests are not running yet, so those only show once earned.
  const shownBadges = BADGES.filter((b) => (b.key !== "curator" && b.key !== "contest_winner") || earned.has(b.key));

  const stats_ = [
    {
      label: stats.clipCount === 1 ? "Movie or clip" : "Movies and clips",
      value: formatCount(stats.clipCount),
    },
    { label: "Views on 4Ever", value: formatCount(stats.totalViews) },
    { label: "Votes", value: formatCount(stats.totalVotes) },
    {
      label: stats.timesFeatured === 1 ? "Time featured" : "Times featured",
      value: formatCount(stats.timesFeatured),
    },
    { label: "Joined", value: formatDate(profile.created_at) },
  ];

  return (
    <div className="container page" style={{ gap: 44 }}>
      {deleted ? (
        <div className="notice notice-ok" role="status">
          Your video was deleted from 4Ever. It&apos;s still on YouTube or Twitch.
        </div>
      ) : null}
      <section aria-label="Profile" className="profile-card">
        <div className="profile-banner">
          <img src={bannerFor(profile.faction)} alt="" />
          {factionLabel ? (
            <span className="faction-chip" style={{ color: factionColor(profile.faction) }}>
              <DotIcon size={8} color="currentColor" />
              {factionLabel}
            </span>
          ) : null}
        </div>
        <div className="profile-head">
          <Avatar name={profile.display_name} src={profile.avatar_url} size={116} className="profile-avatar" />
          <div className="stack-sm" style={{ flex: "999 1 360px", minWidth: 0, gap: 6, paddingTop: 14 }}>
            <h1 className="h1 row" style={{ gap: 12, fontSize: "clamp(32px, 4vw, 44px)" }}>
              {profile.display_name}
              {verifiedChannels.length > 0 ? <VerifiedMark size={26} /> : null}
            </h1>
            <span className="small muted">@{profile.username}</span>
            {title ? (
              <span className="profile-title" style={{ color: titleColor }}>
                {title}
              </span>
            ) : null}
            {profile.bio ? <p className="profile-bio">{profile.bio}</p> : null}
            <div className="row" style={{ marginTop: 10 }}>
              {verifiedChannels.map((c) => (
                <a
                  key={c.id}
                  href={c.channel_url ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="btn btn-ghost"
                >
                  {c.platform === "youtube" ? <VideoIcon size={17} /> : <StreamIcon size={17} />}
                  {c.channel_name}
                </a>
              ))}
              {isOwn ? (
                <>
                  <Link href="/settings" className="btn btn-gold">
                    Edit profile
                  </Link>
                  <OpenClassPicker label={profile.main_class ? "Change class" : "Choose your class"} />
                </>
              ) : null}
            </div>
          </div>
          {hasCharacter(character) ? (
            <CharacterTip character={character} fallbackName={profile.display_name} className="profile-character" />
          ) : null}
        </div>
        <dl className="profile-stats">
          {stats_.map((stat) => (
            <div key={stat.label}>
              <dd>{stat.value}</dd>
              <dt>{stat.label}</dt>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="achievements" className="stack" style={{ gap: 16 }}>
        <h2 id="achievements" className="h2">
          Achievements
        </h2>
        <div className="achievement-grid">
          {shownBadges.map((badge) => {
            const has = earned.has(badge.key);
            const color = has ? badge.color : "#8c8273";
            return (
              <div
                key={badge.key}
                className={`achievement ${has ? "" : "achievement-locked"}`}
                style={{
                  borderColor: rgba(has ? badge.color : "#8c8273", has ? 0.32 : 0.45),
                }}
              >
                <span
                  className="achievement-icon"
                  style={{
                    background: rgba(has ? badge.color : "#8c8273", 0.12),
                    border: `1px solid ${rgba(has ? badge.color : "#8c8273", 0.35)}`,
                    color,
                  }}
                >
                  {has ? <StarIcon size={22} /> : <LockIcon size={20} />}
                </span>
                <span className="stack-sm" style={{ gap: 0, minWidth: 0 }}>
                  <span className="achievement-name" style={{ color: has ? badge.color : "var(--text-3)" }}>
                    {badge.name}
                  </span>
                  <span className="small muted">
                    {has ? badge.description : `Not earned yet. ${badge.description}.`}
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="work" className="stack" style={{ gap: 20 }}>
        <div className="row-between">
          <h2 id="work" className="h2">
            {profile.display_name}&apos;s work
          </h2>
          <nav aria-label="Show" className="seg">
            <Link href={`/u/${profile.username}`} aria-current={tab === "made" ? "true" : undefined}>
              Made
            </Link>
            <Link href={`/u/${profile.username}?tab=shared`} aria-current={tab === "shared" ? "true" : undefined}>
              Shared
            </Link>
            <Link href={`/u/${profile.username}?tab=favorites`} aria-current={tab === "favorites" ? "true" : undefined}>
              Favorites
            </Link>
          </nav>
        </div>
        {clips.length > 0 ? (
          <ClipGrid clips={clips} deletable={isOwn && tab !== "favorites"} tab={tab} />
        ) : (
          <div className="empty">
            <p className="muted" style={{ margin: 0 }}>
              {tab === "made"
                ? verifiedChannels.length > 0
                  ? "No approved videos yet."
                  : "Videos show up here once a YouTube or Twitch channel is verified."
                : tab === "shared"
                  ? "Nothing shared yet."
                  : "No favorites yet."}
            </p>
            {isOwn && tab === "made" ? (
              <div className="row" style={{ justifyContent: "center" }}>
                <Link href="/submit" className="btn btn-gold">
                  Submit a Clip
                </Link>
                {verifiedChannels.length === 0 ? (
                  <Link href="/settings#channels" className="btn btn-ghost">
                    Verify a channel
                  </Link>
                ) : null}
              </div>
            ) : null}
          </div>
        )}
      </section>
    </div>
  );
}
