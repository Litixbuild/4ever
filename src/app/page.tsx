import { EmptyHero } from "@/components/hero";
import { CategoryTiles, FactionWarBar, HOME_CATEGORIES, PlayerMadeShelf } from "@/components/home-boards";
import { HomeStage } from "@/components/home-stage";
import { uploadedAgo } from "@/lib/format";
import type { Clip } from "@/lib/types";
import {
  getCategoryCovers,
  getCurrentFeature,
  getFactionWar,
  getHeroFallback,
  getMostWatchedToday,
  getPlayerMade,
  listClips,
} from "@/lib/queries";

// The front page: the big player with today's top three, then the faction war, categories and Player-made
// videos. The full lists live behind the Movies and Clips tabs.
export default async function HomePage() {
  const [feature, latest, war, covers, made] = await Promise.all([
    getCurrentFeature(),
    listClips({ perPage: 24, sort: "new" }),
    getFactionWar(),
    getCategoryCovers(HOME_CATEGORIES),
    getPlayerMade(8),
  ]);
  // The top three are the most watched videos today. On a quiet day the admin's pick, the top movie and
  // the newest videos fill the gaps.
  const top = await getMostWatchedToday(3, [feature?.clip ?? null, await getHeroFallback(), ...latest.clips]);
  // The big player's queue: the top three, then the newest videos for the rail to slide through.
  const queue: Clip[] = [];
  for (const c of [...top, ...latest.clips]) {
    if (c && !queue.some((q) => q.id === c.id)) queue.push(c);
  }
  const ages = Object.fromEntries(queue.map((c) => [c.id, uploadedAgo(c)]));
  const featureNotes = feature && feature.clip?.id === queue[0]?.id ? feature : null;

  return (
    <div className="container page">
      <div className="stack" style={{ gap: 20 }}>
        {queue.length > 0 ? (
          <HomeStage queue={queue.slice(0, 24)} ages={ages} feature={featureNotes} ranked={top.length} />
        ) : (
          <EmptyHero />
        )}
      </div>

      <div className="home-boards">
        <FactionWarBar war={war} />
        <CategoryTiles covers={covers} />
        <PlayerMadeShelf clips={made} />
      </div>
    </div>
  );
}
