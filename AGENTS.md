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
- `/watch` is the full-screen swipe feed (`src/components/clip-feed.tsx`); on phones the Clips menu link opens it. Clips come in a fresh random order each visit (from the 180 most watched; a `?start=` clip plays first). Swipe up (or scroll the wheel down) for the next clip, down (wheel up) for the previous; a click or tap on the video pauses it; clips autoplay with sound (muted only when the browser requires it: a visitor who hasn't clicked anything yet, or an iPhone). On phones the clip fills the screen; a clear layer over it reads swipes and taps (tap to pause). Front-page activity says "X shared" only when X really posted it.
- Contests are on hold: `/contests` is a coming-soon page and `/contests/[slug]` redirects there. The contest code (actions, widgets, admin) is kept for later.
- Profiles follow WoW: Forever: characters have a first and last name (saved together in `main_character`), the `realm` column holds the ruleset (PvP, PvE, RP-PvP, Hardcore) since there are no realms, and `main_spec` holds the spec. Level is no longer asked for.
- Clips store the channel's own picture (`channel_avatar_url`, read from YouTube or Twitch at submit time). Credit lines use the creator's 4Ever avatar first, then that picture. Older clips get it filled in the first time their page is opened.
- Run `npm test`, `npm run typecheck` and `npm run lint` before committing.
- Deleting a video happens on your own profile: under each card in the Made and Shared tabs (`ClipGrid deletable`). The server action `deleteClip` checks the viewer is the creator or the person who shared it.
- First login shows "Choose your class" (`src/components/class-picker.tsx`, mounted for logged-in visitors by `RollPrompt` in the root layout): class, then spec, saved by `saveRoll` in `src/app/actions/roll.ts`. It opens by itself only when `main_class` and `class_prompted_at` are both empty; "Not now" sets `class_prompted_at`. Your own profile has a button that reopens it. Class emblems are in `public/classes/` (supplied by Cameron), spec blurbs in `SPEC_INFO` in `src/lib/wow.ts`.
