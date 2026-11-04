<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project notes for AI assistants

4Everclips is a community site for World of Warcraft: Forever videos. Read README.md for the feature list and SETUP.md for how it is deployed.

- Next.js 16 App Router, **without** Cache Components (`cacheComponents` is off). Pages read cookies for the login, so they render per request. `params` and `searchParams` are Promises.
- Middleware is called **proxy** in this version: `src/proxy.ts`.
- Supabase: `src/lib/supabase/server.ts` acts as the visitor (security rules apply). `src/lib/supabase/admin.ts` uses the secret key and skips the rules; only use it on the server after checking the visitor with `getViewer()` / `requireCurator()`.
- Never let the browser decide a video's title, channel or creator. `lookupVideo()` reads them from YouTube or Twitch on the server.
- Title colors come from `src/lib/rarity.ts`. Never print tier names (Legendary, Epic, etc.) in the UI.
- Database changes go in a new file under `supabase/migrations/` with Row Level Security for any new table.
- The page backdrop (Alliance and Horde art) is `body::before` in `globals.css`, with images in `public/backdrop/`. The shade gradients there control how dim it is.
- Styling is plain CSS in `src/app/globals.css`. Reuse its classes (`btn`, `card`, `seg`, `chip`, `clip-grid`, ...) before adding new ones.
- The look borrows from the game's UI: `.wow-tip` is the item tooltip (title in a quality color, green "Use:" and "<Made by>" lines, gold flavor text), `.slot` is the empty equipment slot used for empty states, `CharacterTip` shows a player's main the way the unit tooltip does, and `.btn-wow` is the red dialog button.
- The logo is `Logo` in `src/components/brand.tsx`: the map-filled 4 (`public/brand/four-*.webp`, made from Cameron's artwork) plus EVER in Metamorphous, with EV glowing red and ER glowing blue (`.glow-*` in `globals.css`, animations off for reduced motion).
- Display text is Marcellus with Cinzel's digits swapped in (the `4Ever Figures` face in `globals.css`, file in `src/fonts/`), because Marcellus draws 0 and 1 like O and l. Keep `--font-display` pointing at that stack.
- Login buttons come from `enabledProviders()` in `src/lib/auth-providers.ts`, which reads which providers are switched on in Supabase. Don't hard-code the list of login options in pages.
- `/watch` is the full-screen swipe feed (`src/components/clip-feed.tsx`); on phones the Clips menu link opens it. Clips come in a fresh random order made in the browser (up to 300 clips; a `?start=` clip plays first). Clips already watched are remembered in localStorage (`4ever:seen-clips`, helpers in `src/lib/seen.ts`; cards and the video page mark clips too, and cards show a "Watched" chip via `SeenMark`) and left out; after the last one the feed says "You've seen every clip". Swipe up (or scroll the wheel down) for the next clip, down (wheel up) for the previous; a click or tap on the video pauses it; clips autoplay with sound (muted only when the browser requires it: a visitor who hasn't clicked anything yet, or an iPhone). On phones the clip fills the screen; a clear layer over it reads swipes and taps (tap to pause). Twitch clips (widescreen, no player API) start cropped to fill the screen (`is-cover`) under a layer that takes swipes and shows "Tap for sound"; a tap switches that clip to the whole Twitch player with its own controls (`is-fit`). Front-page activity says "X shared" only when X really posted it.
- Contests are on hold: `/contests` is a coming-soon page and `/contests/[slug]` redirects there. The contest code (actions, widgets, admin) is kept for later.
- Profiles follow WoW: Forever: characters have a first and last name (saved together in `main_character`), the `realm` column holds the ruleset (PvP, PvE, RP-PvP, Hardcore) since there are no realms, and `main_spec` holds the spec. Level is no longer asked for.
- Clips store the channel's own picture (`channel_avatar_url`, read from YouTube or Twitch at submit time). Credit lines use the creator's 4Ever avatar first, then that picture. Older clips get it filled in the first time their page is opened.
- Run `npm test`, `npm run typecheck` and `npm run lint` before committing.
- Deleting a video happens on your own profile: under each card in the Made and Shared tabs (`ClipGrid deletable`). The server action `deleteClip` checks the viewer is the creator or the person who shared it.
- First login shows "Choose your class" (`src/components/class-picker.tsx`, mounted for logged-in visitors by `RollPrompt` in the root layout): class, then spec, saved by `saveRoll` in `src/app/actions/roll.ts`. It opens by itself only when `main_class` and `class_prompted_at` are both empty; "Not now" sets `class_prompted_at`. Your own profile has a button that reopens it. Class emblems are in `public/classes/` (supplied by Cameron), spec blurbs in `SPEC_INFO` in `src/lib/wow.ts`.
- The front page shows 9 videos at first; "Load more" adds 9 more (`?show=`). /browse shows 9 a page as a 3×3 grid (`ClipGrid threeUp`) with just Previous / Next page (`?page=`): it never shows a total count or page numbers, so the site never looks small.
- Site shares: a curator posting someone else's clip can tick "Post as 4Ever" (on by default); `clips.shared_as_site` hides the curator's name so the clip shows "Shared by 4Ever", and it stays off the curator's public profile (their own profile still lists it so they can delete it).
- Titles: curators get "Edit title" on a clip page (`renameClip`); it sets `title_locked` so the daily refresh never overwrites the fix. New titles go through `titleNeedsReview` (src/lib/moderation.ts); a flagged title is held for review even when a curator submits it.
- Top nav is just Movies, Clips and a greyed-out, unclickable Contests. The Creators and Hall of Fame pages still exist but aren't linked from the nav or footer.
- Suggestions: logged-in visitors send ideas, bugs or creator requests at /suggest (linked from the footer, the account menu, and the feed's end card). They live in `public.suggestions` (server-only, admin client). Curators answer them at /admin/suggestions (Open / Answered / Closed); the reply shows under the suggestion on /suggest. A red dot on the header avatar means an unread reply (or, for curators, open suggestions); opening /suggest marks replies read.
- Security: `src/lib/supabase/admin.ts` and `src/lib/suggestions-server.ts` import `server-only`, so the build fails if a client component pulls them in; keep browser-safe helpers in separate files. The login page only shows messages from `LOGIN_ERRORS` (`?error=<code>`), never text from the link. Signed-in users can insert only `clip_id, user_id` (+ `body` for comments) into votes/favorites/comments, so `created_at` can't be back-dated past the comment rate limit. Logged-out views count once per connection (`x-nf-client-connection-ip`) per day.
