// Rules the clip finder uses to decide whether a YouTube video belongs on 4Ever. No server code here,
// so it can be tested on its own.
import type { Category } from "@/lib/categories";

// Forever launched on Nov 4, 2026. Anything older is beta or a different game.
export const FOREVER_LAUNCH = "2026-11-04T00:00:00Z";
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
  return /\bforever\b/.test(text) && /\b(wow|warcraft)\b/.test(text);
}

// Selling, boosting and giveaway videos never go up.
const SPAM_TITLE =
  /\b(boost(s|ing)?|carry|carries|gold (for sale|selling|farm(ing)? guide)|for sale|buy(ing)?|selling|giveaway|discount|coupon|promo code|accounts?)\b/i;

export function looksLikeSpam(title: string): boolean {
  return SPAM_TITLE.test(title);
}

// Channels that collect other people's clips. Only the streamers' own channels count.
const REPOSTER_CHANNEL =
  /(clips?|clipz|feed|replays?|best of|moments|compilations?|highlights?|daily|news|boost(ing)?|carr(y|ies)|gold|shop|store|services?|vods?|archive|fan ?page)\b/i;

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
