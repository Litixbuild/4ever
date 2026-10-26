# 4Everclips

A fan-made home for **World of Warcraft: Forever** movies and clips, in the spirit of the old Warcraft Movies site.
People share YouTube and Twitch videos, vote, comment, and compete in contests. Credit always goes to the real
creator.

**Going live?** Start with [SETUP.md](SETUP.md).

## What's in it

- **Front page**: Movie of the Week with a classic item-tooltip, fresh videos, the current contest, top creators,
  and a "General" chat-style activity feed.
- **Browse and search** by movies or clips, category, tags, newest, trending, most watched, and most voted.
- **Video pages** with a click-to-play YouTube or Twitch player, votes, saves, comments, music credit, and "This is
  my video" / "Request removal" links.
- **Item-quality title colors**: titles turn green, blue, purple and orange as more people watch them on 4Ever.
  Tier names are never shown.
- **Submissions** from a link only. The site reads the real channel from YouTube or Twitch, so nobody can claim
  someone else's work. Everything goes through a review queue.
- **Logins** with Discord, Twitch or Google. No passwords.
- **Channel verification** (YouTube code in the channel description, or Twitch login), which gives creators a
  verified check and moves all their videos onto their profile.
- **Profiles** with a main character card, achievements, earnable titles, and made/shared/favorite tabs.
- **Contests** with entry windows, votes counted during the contest, and champion placements.
- **Hall of Fame** for past Movies of the Week, contest champions, and the most watched videos.
- **Admin tools**: review queue, reports, Movie of the Week, contests, videos, and people.
- **Legal basics**: terms, privacy, DMCA page, report form, music guide, and submission rules.

## Built with

- [Next.js 16](https://nextjs.org) (App Router) on [Vercel](https://vercel.com)
- [Supabase](https://supabase.com) for the database, logins, and security rules
- YouTube Data API and the Twitch API for video details
- Plain CSS design system in `src/app/globals.css` (Cinzel and Manrope fonts, self-hosted)

## Where things live

```
supabase/migrations/0001_init.sql   database tables, security rules, helper functions
supabase/seed.sql                   launch contests
src/app/                            pages (each folder is a URL)
src/app/admin/                      curator tools
src/app/actions/, */actions.ts      server actions (votes, comments, submissions, admin)
src/components/                     shared UI pieces
src/lib/                            data access, YouTube/Twitch lookups, formatting, settings
src/lib/site.ts                     launch date, limits, contact email
src/lib/rarity.ts                   view thresholds for title colors
src/proxy.ts                        keeps login sessions fresh
```

## How it stays safe

- Every table has Row Level Security. Visitors can only change their own votes, favorites, comments and profile.
- Clips, channels, badges, contests and reports can only be written by the server, after it checks who you are.
- Video details are always looked up on the server, never trusted from the browser.
- Views are counted with a daily one-way hash. IP addresses are never stored.
- Admin pages and actions check the visitor's role on every request.

## Scripts

```bash
npm run dev        # local development at http://localhost:3000
npm run build      # production build
npm test           # unit tests (link parsing, formatting, rarity, dates)
npm run typecheck
npm run lint
```
