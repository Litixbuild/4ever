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
- Styling is plain CSS in `src/app/globals.css`. Reuse its classes (`btn`, `card`, `seg`, `chip`, `clip-grid`, ...) before adding new ones.
- Login buttons come from `enabledProviders()` in `src/lib/auth-providers.ts`, which reads which providers are switched on in Supabase. Don't hard-code the list of login options in pages.
- Run `npm test`, `npm run typecheck` and `npm run lint` before committing.
