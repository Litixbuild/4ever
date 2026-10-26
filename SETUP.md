# Going live with 4Everclips

This walks through everything from zero to a live site at 4everclips.com. Plan on about an hour the first time.
Everything here is free to start.

**You'll need accounts on:** GitHub (you have this), [Supabase](https://supabase.com), [Vercel](https://vercel.com),
the [Discord Developer Portal](https://discord.com/developers/applications), the
[Twitch Developer Console](https://dev.twitch.tv/console), and [Google Cloud](https://console.cloud.google.com).

Keep a notes file open as you go. You'll collect about ten values (keys, IDs, secrets) and paste them into Vercel at
the end. Never paste the secret ones anywhere public.

---

## 1. Create the database (Supabase)

1. In Supabase, click **New project**. Name it `4everclips`, pick a region close to most players (US East is a good
   default), and save the database password somewhere safe.
2. When it's ready, open **SQL Editor → New query**. Paste the whole file `supabase/migrations/0001_init.sql` and
   press **Run**. You should see "Success. No rows returned".
3. Open another new query, paste `supabase/seed.sql`, and run it. That adds the Launch Week and First Kill contests.
4. Click **Connect** at the top of the dashboard (or go to **Project Settings → API Keys**) and copy:
   - the **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - the **publishable** key (older projects call it "anon") → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - a **secret** key (older projects call it "service_role") → `SUPABASE_SECRET_KEY`. Treat this one like a
     password.

## 2. Set up logins

Every login provider needs the same **callback URL**. You'll find it in Supabase under
**Authentication → Sign In / Providers** when you open any provider. It looks like:

```
https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback
```

### Discord

1. In the Discord Developer Portal, click **New Application** and name it `4Everclips`.
2. Go to **OAuth2**, add the callback URL under **Redirects**, and save.
3. Copy the **Client ID**, then click **Reset Secret** and copy the **Client Secret**.
4. In Supabase, open the **Discord** provider, turn it on, paste both values, and save.

### Twitch

1. In the Twitch Developer Console, go to **Applications → Register Your Application**.
2. Name: `4Everclips`. OAuth Redirect URL: the callback URL. Category: **Website Integration**. Client type:
   **Confidential**.
3. Open the app with **Manage**, copy the **Client ID**, and click **New Secret** to get the secret.
4. In Supabase, open the **Twitch** provider, turn it on, paste both values, and save.
5. Also save the same two values for Vercel as `TWITCH_CLIENT_ID` and `TWITCH_CLIENT_SECRET`. The site uses them to
   read clip details.

### Google (plus the YouTube key)

1. In Google Cloud, create a project called `4Everclips`.
2. Set up the **OAuth consent screen** (Google Auth Platform): app name `4Everclips`, your support email, audience
   **External**. Then **Publish** the app so anyone can log in. The basic profile and email scopes don't need
   Google's review.
3. Under **Clients**, create an **OAuth client** of type **Web application**. Add the callback URL as an
   **Authorized redirect URI**. Copy the Client ID and secret into the **Google** provider in Supabase.
4. Still in Google Cloud: **APIs & Services → Library**, search **YouTube Data API v3**, and click **Enable**.
5. **APIs & Services → Credentials → Create credentials → API key**. Restrict it to the YouTube Data API v3. Save
   it as `YOUTUBE_API_KEY`. The site uses it to read video details and to verify channel ownership.

### Supabase login settings

1. **Authentication → URL Configuration**:
   - Site URL: `https://4everclips.com`
   - Redirect URLs, add all three:
     - `https://4everclips.com/**`
     - `https://*.vercel.app/**` (so preview deployments work)
     - `http://localhost:3000/**` (for running it on your computer)
2. In the authentication settings, turn on **Allow manual linking**. That lets someone who signed up with Discord
   link Twitch later to verify their channel.
3. Turn **off** the **Email** provider. 4Ever only uses Discord, Twitch and Google, and leaving email on lets
   people create password accounts through the API.

## 3. Deploy (Vercel)

1. In Vercel, click **Add New → Project** and import the `4everclips` repository from GitHub.
2. Before deploying, open **Environment Variables** and add every value from `.env.example`:

| Name | Value |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `https://4everclips.com` |
| `NEXT_PUBLIC_SUPABASE_URL` | from step 1 |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | from step 1 |
| `SUPABASE_SECRET_KEY` | from step 1 |
| `YOUTUBE_API_KEY` | from the Google steps |
| `TWITCH_CLIENT_ID` / `TWITCH_CLIENT_SECRET` | from the Twitch steps |
| `ADMIN_EMAILS` | the email on the Discord/Twitch/Google account you'll log in with |
| `VIEW_HASH_SALT` | any long random string (mash the keyboard for 40 characters) |
| `NEXT_PUBLIC_CONTACT_EMAIL` | where people can reach you |
| `NEXT_PUBLIC_DMCA_AGENT_NAME` / `_ADDRESS` / `NEXT_PUBLIC_DMCA_EMAIL` | see step 5 |

3. Click **Deploy**.
4. Add your domain: **Project → Settings → Domains**, add `4everclips.com` and `www.4everclips.com`. Vercel shows
   the exact DNS records to add at your domain registrar. It usually goes live within an hour.

Whenever you change an environment variable, redeploy (Deployments → the latest one → **Redeploy**).

## 4. Make yourself the admin

Log in once with the account whose email is in `ADMIN_EMAILS`. You'll see **Admin** in the menu under your avatar.

If it doesn't show up (some Discord accounts don't share an email), run this in the Supabase SQL Editor with your
4Ever username:

```sql
update public.profiles set role = 'admin' where username = 'your_username';
```

## 5. Before you announce it

- [ ] **Register a DMCA agent** with the U.S. Copyright Office at
      [copyright.gov/dmca-directory](https://www.copyright.gov/dmca-directory/). It costs $6 and must be renewed every
      three years. Put the same name, address and email into the `NEXT_PUBLIC_DMCA_*` variables and redeploy. This
      is what gives the site "safe harbor" protection if someone submits something they shouldn't.
- [ ] **Have a lawyer skim the Terms and Privacy pages.** They're written in plain English as a solid starting
      point, not legal advice. A one-hour IP consult is worth it before contests with real prizes.
- [ ] **Keep contest prizes under $500 in total value** per contest, or get a license from Blizzard first (their
      video policy requires it above that).
- [ ] **Seed 20 to 30 great videos.** As an admin, your own submissions go live right away without the queue.
- [ ] **Pick the first Movie of the Week** in Admin → Movie of the Week. Add a "Use:" line and some flavor text for
      the classic tooltip look.
- [ ] **Check the contest dates** in Admin → Contests.
- [ ] **Test it end to end:** log in with each provider, submit a YouTube video and a Twitch clip, verify your own
      channel in Settings, vote, comment, and report a video.
- [ ] Consider running the site through an LLC so a dispute can't reach your personal assets.

## Running the site day to day

Everything lives under **Admin** (only curators and admins see it):

- **Review queue**: approve or reject new submissions. Approving can also fix the type and category.
- **Reports**: removal requests, credit problems and copyright reports. Handle creator removal requests quickly.
- **Movie of the Week**: pick what's on the front page and write its tooltip lines.
- **Contests**: create contests, edit dates, and set the champion, second and third place. The champion's creator
  automatically earns the Contest Winner title.
- **Videos**: search everything, edit titles and categories, remove or restore videos.
- **People**: award or remove achievements, and (admins only) make someone a curator.

## How credit and titles work

- The channel name on every video comes straight from YouTube or Twitch, never from what someone typed.
- Creators verify ownership in **Settings**. YouTube: paste a short code into the channel description, then press
  check. Twitch: link the Twitch account. After that, every video from that channel gets their name and a verified
  check, including videos other people shared.
- **Title colors** come from views on 4Ever (each person counts once per video per day): white for new videos, then
  green at 50, blue at 200, purple at 750, and orange at 2,500. Change the thresholds in `src/lib/rarity.ts`.
- Achievements are awarded automatically: Verified Creator (on verification), Founding Creator (first 50 creators
  with an approved video), Movie of the Week (when featured), Contest Winner (champion placement).

## Costs to keep an eye on

- **Supabase free plan**: plenty for launch. Free projects pause after a week with no activity, which won't happen
  on a live site.
- **Vercel Hobby plan**: free, but meant for non-commercial projects. If you add sponsors or ads, move to Pro.
- **YouTube Data API**: 10,000 free units a day. Each link lookup uses about one, so this goes a long way.

## Working on it locally

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev                  # http://localhost:3000
npm test                     # unit tests
npm run typecheck
npm run lint
```

## If something's off

- **Logging in sends you to the wrong site**: check the Site URL and Redirect URLs in Supabase step 2.
- **Twitch clips say they can't connect**: Twitch needs the site's real domain. Make sure you're visiting through
  4everclips.com (or the Vercel URL), not an IP address.
- **A YouTube video won't play**: the creator may have turned off embedding. The submit form catches this when the
  YouTube key is set.
- **"4Everclips needs its database keys" page**: the Supabase variables are missing in Vercel. Add them and
  redeploy.
