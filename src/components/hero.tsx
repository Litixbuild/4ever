import Link from "next/link";
import { ClipThumbImage } from "@/components/clip-card";
import { PlayIcon } from "@/components/icons";
import { InlinePlayer } from "@/components/inline-player";
import { VerifiedMark } from "@/components/people";
import { categoryLabel, musicLabel } from "@/lib/categories";
import { formatCount, formatDuration } from "@/lib/format";
import { rarityClass } from "@/lib/rarity";
import type { Clip, Feature } from "@/lib/types";
import { platformLabel } from "@/lib/video";

// Before anything is shared, the front page invites the first legend.
export function EmptyHero() {
  return (
    <section aria-labelledby="hero-title" className="showcase">
      <div className="showcase-media">
        <img src="/backdrop/scene.webp" alt="" />
      </div>
      <div className="showcase-side">
        <div className="wow-tip">
          <h1 id="hero-title" className="tip-title rarity-legendary">
            The First Legend
          </h1>
          <span>Unique</span>
          <span className="tip-split">
            <span>Movie of the Week</span>
            <span>Empty slot</span>
          </span>
          <span className="tip-use tip-gap">
            Use: Share the best thing you&apos;ve recorded in Forever. It could be the first movie everyone sees here.
          </span>
          <span className="tip-flavor">&ldquo;Every legend starts with a single upload.&rdquo;</span>
          <span className="tip-made tip-gap">&lt;Made by you&gt;</span>
        </div>
        <div className="showcase-actions">
          <Link href="/submit" className="btn btn-gold btn-lg">
            Submit a Clip
          </Link>
          <Link href="/settings#channels" className="btn btn-ghost btn-lg">
            Verify your channel
          </Link>
        </div>
      </div>
    </section>
  );
}
