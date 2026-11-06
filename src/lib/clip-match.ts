// Rules the clip finder uses to decide whether a YouTube video belongs on 4Ever. No server code here,
// so it can be tested on its own.
import type { Category } from "@/lib/categories";

// Forever went live Nov 4, 2026 at 6 PM Eastern. Anything older is beta, hype or a different game.
export const FOREVER_LAUNCH = "2026-11-04T23:00:00Z";
export const MAX_CLIP_SECONDS = 60;
export const MIN_CLIP_SECONDS = 5;

function normal(text: string) {
  return text.toLowerCase().replace(/[_\-]+/g, " ");
}

// The title, description or tags have to say this is WoW Forever, not just "forever".
export function isWowForever(title: string, description = "", tags: string[] = []): boolean {
  const text = normal([title, description, ...tags].join(" \n "));
  if (/wowforever|warcraftforever|wow4ever|wowclassicforever/.test(text.replace(/\s+/g, ""))) {
    // Hashtags like #WoWForever; squashing spaces also catches "WoW Forever".
    return true;
  }
  // "WoW Forever", "World of Warcraft: Forever", "Warcraft Forever" written out, not "#wow ... #forever".
  return /\b(wow|warcraft)\s*:?\s*forever\b/.test(text);
}

// Selling, boosting and giveaway videos never go up.
const SPAM_TITLE =
  /\b(boost(s|ing)?|carry|carries|gold (for sale|selling|farm(ing)? guide)|for sale|buy(ing)?|selling|giveaway|discount|coupon|promo code|accounts?)\b/i;

// News, guides and launch-time videos aren't clips of something happening in the game.
const NOT_GAMEPLAY =
  /\b(fix(es)?|skips|min ?max(ing)?|cut from|on the map|new players|good for|\d+ (quests|ways|tips|things|reasons)|removed|deleted|nerf(s|ed)?|buff(s|ed)?|changes?|changed|announce[sd]?|blizzard|rules|macros?|addons?|ui|settings|keybinds?|t(ier)? ?\d set|sets?|free|launch|patch|hotfix|update[sd]?|is (it|this) (worth|good)|worth it|explain(ed|s)?|reasons?|things|mistakes|you need|dont|don't|stop|never|always|every player|community|thoughts|opinion|rested ?xp|customization|preview|first look|leak(ed|s)?|coming|should|tier ?list|launch time|time ?zones?|how to|guide|explained|predictions?|news|patch notes|poll|should you|tips?|checklist|reviews?|release date|countdown|days? left|hours? (left|until)|pvp or pve|pve or pvp|beginners?|which (class|server|faction)|best class(es)?|everything you need|costs?|use the|layering|layers|watched|trailer|cinematic|available now|why do|care about|hate[sd]?|respec\w*|legacy points|earn|pets?|mounts?|profession|race to|took over|new best|raids open|attunement|secret|hidden|location|where to|farm(ing)?|money|talents?|build|rotation|bis|best in slot|recipe|problem|ruined|hype|hotfix(es)?|camera|graphics?|queue|servers?|rollback|bans?|banned|hypocrisy|youtubers|terrible idea)\b/i;

export function looksLikeSpam(title: string): boolean {
  return SPAM_TITLE.test(title) || NOT_GAMEPLAY.test(title);
}

// Channels that collect other people's clips. Only the streamers' own channels count.
const REPOSTER_CHANNEL =
  /(forever|clips?|clipz|feed|replays?|best of|moments|compilations?|highlights?|daily|news|boost(ing)?|carr(y|ies)|gold|shop|store|services?|vods?|archive|fan ?page)\b/i;

export function looksLikeReposter(channelName: string): boolean {
  return REPOSTER_CHANNEL.test(channelName);
}

// A best guess from the title; curators can change it on the Videos admin page.
export function guessCategory(title: string, tags: string[] = []): Category {
  const text = normal([title, ...tags].join(" "));
  if (/\b(bgs?|battlegrounds?|warsong|wsg|arathi|alterac|av|ab)\b/.test(text)) return "battlegrounds";
  if (
    /\b(raids?|raiding|dungeons?|molten core|mc|onyxia|ony|ragnaros|rag|deadmines|vc|wailing caverns|scarlet|sm|stratholme|strat|scholo(mance)?|ubrs|lbrs|brd|zul ?gurub|zg|bwl|naxx(ramas)?|aq\d*|boss|wipe)\b/.test(
      text,
    )
  )
    return "raids-dungeons";
  if (/\bduel(s|ing|led)?\b/.test(text)) return "duels";
  if (
    /\b(pvp|wpvp|gank(s|ed|ing)?|tarren mill|southshore|stv|stranglethorn|crossroads|\dv\d|1 ?v ?\d|outplay(ed)?|one ?shot|kill(s|ed)?)\b/.test(
      text,
    )
  )
    return "world-pvp";
  if (/\b(funny|lol|lmao|fail(s|ed)?|troll(ing|ed)|prank|rage|bruh|wtf)\b|😂|🤣|💀/u.test(text)) return "funny";
  if (/\b(level(ing|ling|ed)?|lvl|ding|quest(s|ing)?|hardcore|hc|leveled)\b/.test(text)) return "leveling";
  return "other";
}
