import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ClipGrid } from "@/components/clip-card";
import { DotIcon, LockIcon, StarIcon, StreamIcon, VideoIcon } from "@/components/icons";
import { Avatar, VerifiedMark } from "@/components/people";
import { Vista } from "@/components/vista";
import { getViewer } from "@/lib/auth";
import { BADGES, titleFor } from "@/lib/badges";
import { formatCount, formatDate } from "@/lib/format";
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

export default async function ProfilePage({ params, searchParams }: Params & { searchParams: Promise<{ tab?: string }> }) {
  const { username } = await params;
  const { tab: tabParam } = await searchParams;
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
  const hasCharacter = Boolean(profile.main_character || profile.main_class || profile.realm);
  const factionLabel = profile.faction === "horde" ? "Horde" : profile.faction === "alliance" ? "Alliance" : null;
  const factionColor = profile.faction === "horde" ? "#ff8a80" : "#8fb8ff";
  const shownBadges = BADGES.filter((b) => b.key !== "curator" || earned.has(b.key));

  return (
    <div className="container page" style={{ gap: 44 }}>
      <section aria-label="Profile" className="profile-card">
        <div className="profile-banner">
          <Vista seed={profile.username} wide />
          {factionLabel ? (
            <span
              className="overlay-chip"
              style={{ right: 18, top: 18, height: 30, padding: "0 12px", border: `1px solid ${rgba(profile.faction === "horde" ? "#d4433a" : "#4b8ef0", 0.5)}`, color: factionColor, letterSpacing: "0.1em", fontWeight: 800 }}
            >
              <DotIcon size={8} color={factionColor} />
              {factionLabel.toUpperCase()}
            </span>
          ) : null}
        </div>
        <div className="profile-head">
          <Avatar name={profile.display_name} src={profile.avatar_url} size={116} className="profile-avatar" />
          <div className="stack-sm" style={{ flex: "999 1 360px", minWidth: 0, gap: 6, paddingTop: 16 }}>
            <h1 className="h1 row" style={{ gap: 10, fontSize: "clamp(28px, 4vw, 38px)" }}>
              {profile.display_name}
              {verifiedChannels.length > 0 ? <VerifiedMark size={26} /> : null}
            </h1>
            <span className="small muted">@{profile.username}</span>
            {title ? (
              <span style={{ fontWeight: 700, color: titleColor }}>{title}</span>
            ) : null}
            {profile.bio ? (
              <p style={{ margin: "4px 0 0", fontSize: 16, color: "var(--text-3)", maxWidth: 600 }}>{profile.bio}</p>
            ) : null}
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
                <Link href="/settings" className="btn btn-gold">
                  Edit profile
                </Link>
              ) : null}
            </div>
          </div>
          {hasCharacter ? (
            <div className="card-tooltip stack-sm" style={{ flex: "1 1 260px", gap: 3, fontSize: 14 }}>
              <span className="tiny" style={{ fontWeight: 800, letterSpacing: "0.12em", color: "var(--tooltip-muted)" }}>
                MAIN CHARACTER
              </span>
              {profile.main_character ? (
                <span className="display" style={{ fontSize: 20, color: "#fff" }}>
                  {profile.main_character}
                </span>
              ) : null}
              {profile.main_level || profile.main_race || profile.main_class ? (
                <span>
                  {[profile.main_level ? `Level ${profile.main_level}` : null, profile.main_race, profile.main_class]
                    .filter(Boolean)
                    .join(" ")}
                </span>
              ) : null}
              {profile.realm || factionLabel ? (
                <span style={{ color: "var(--tooltip-muted)" }}>
                  {profile.realm}
                  {profile.realm && factionLabel ? " · " : ""}
                  {factionLabel ? <span style={{ color: factionColor }}>{factionLabel}</span> : null}
                </span>
              ) : null}
              {profile.guild ? <span style={{ color: "var(--green)" }}>&lt;{profile.guild}&gt;</span> : null}
            </div>
          ) : null}
        </div>
      </section>

      <section aria-label="Stats" className="stat-grid">
        <div className="stat">
          <span className="stat-value">{formatCount(stats.clipCount)}</span>
          <span className="small muted">Movies and clips</span>
        </div>
        <div className="stat">
          <span className="stat-value">{formatCount(stats.totalViews)}</span>
          <span className="small muted">Views on 4Ever</span>
        </div>
        <div className="stat">
          <span className="stat-value">{formatCount(stats.totalVotes)}</span>
          <span className="small muted">Votes</span>
        </div>
        <div className="stat">
          <span className="stat-value">{formatCount(stats.timesFeatured)}</span>
          <span className="small muted">Times featured</span>
        </div>
        <div className="stat">
          <span className="stat-value" style={{ fontSize: 24, lineHeight: "36px" }}>
            {formatDate(profile.created_at)}
          </span>
          <span className="small muted">Joined</span>
        </div>
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
                style={{ borderColor: rgba(has ? badge.color : "#8c8273", has ? 0.32 : 0.45) }}
              >
                <span className="achievement-icon" style={{ background: rgba(has ? badge.color : "#8c8273", 0.12), border: `1px solid ${rgba(has ? badge.color : "#8c8273", 0.35)}`, color }}>
                  {has ? <StarIcon size={22} /> : <LockIcon size={20} />}
                </span>
                <span className="stack-sm" style={{ gap: 0, minWidth: 0 }}>
                  <span style={{ fontWeight: 800, fontSize: 15, color: has ? badge.color : "var(--text-3)" }}>{badge.name}</span>
                  <span className="small muted">{has ? badge.description : `Not earned yet. ${badge.description}.`}</span>
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
          <ClipGrid clips={clips} />
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
