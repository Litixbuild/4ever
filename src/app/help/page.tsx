import type { Metadata } from "next";
import Link from "next/link";
import { RankInsignia } from "@/components/rank-list";
import { ALLIANCE_RANKS, DAILY_XP_CAP, HORDE_RANKS, MAX_RANK, RANK_START, rankRarity } from "@/lib/ranks";
import { RARITY_TIERS } from "@/lib/rarity";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "How 4Ever works",
  description: "How credit, sharing clips, watch-time ranks, title colors and everything else works on 4Ever.",
};

const SECTIONS = [
  { id: "credit", label: "Credit" },
  { id: "sharing", label: "Sharing a clip" },
  { id: "claiming", label: "Your channel" },
  { id: "watching", label: "Watching" },
  { id: "ranks", label: "Ranks" },
  { id: "colors", label: "Title colors" },
  { id: "community", label: "Votes and comments" },
  { id: "account", label: "Your account" },
  { id: "removal", label: "Removal" },
] as const;

function hours(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const h = minutes / 60;
  return `${h < 10 ? h.toFixed(1).replace(/\.0$/, "") : Math.round(h)} hr`;
}

function Q({ q, children, open = false }: { q: string; children: React.ReactNode; open?: boolean }) {
  return (
    <details className="faq" open={open}>
      <summary>{q}</summary>
      <div className="faq-body">{children}</div>
    </details>
  );
}

export default function HelpPage() {
  const colorTiers = [...RARITY_TIERS].reverse();

  return (
    <div className="container page page-narrow" style={{ gap: 28 }}>
      <header className="stack" style={{ gap: 10 }}>
        <h1 className="h1">How 4Ever works</h1>
        <p className="lead" style={{ margin: 0 }}>
          A home for World of Warcraft: Forever movies and clips. Here&apos;s how credit, sharing, ranks and everything
          else fits together.
        </p>
        <nav aria-label="On this page" className="chips" style={{ marginTop: 6 }}>
          {SECTIONS.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="chip">
              {s.label}
            </a>
          ))}
        </nav>
      </header>

      <section id="credit" className="help-section" aria-labelledby="credit-title">
        <h2 id="credit-title" className="h2">
          Every clip is credited to the person who made it
        </h2>
        <p className="muted" style={{ margin: 0 }}>
          Videos on 4Ever play straight from the creator&apos;s own YouTube or Twitch channel. Their name is on it and
          the views count for them, no matter who shared it here.
        </p>
        <ol className="steps help-steps">
          <li>
            <span className="numeral">I</span>
            <strong>It stays on their channel</strong>
            <span className="small muted">
              Nothing is reuploaded. Every clip plays from YouTube or Twitch, so every view goes to the creator.
            </span>
          </li>
          <li>
            <span className="numeral">II</span>
            <strong>Their name goes on it</strong>
            <span className="small muted">
              We read the channel from YouTube or Twitch ourselves. Whoever shares a clip, the person who made it gets
              the credit.
            </span>
          </li>
          <li>
            <span className="numeral">III</span>
            <strong>Creators claim their clips</strong>
            <span className="small muted">
              Verify your channel once and every clip of yours gets a verified check and a place on your profile.
            </span>
          </li>
        </ol>
        <Q q="What does “Shared by” mean?">
          <p>
            It&apos;s the person who brought the clip to 4Ever. The creator&apos;s name always comes first, under
            &ldquo;Made by&rdquo;. Clips the 4Ever team added show &ldquo;Shared by 4Ever&rdquo;.
          </p>
        </Q>
        <Q q="Does sharing someone else's clip take views away from them?">
          <p>
            No. The video plays from their channel, so the view lands on their YouTube or Twitch. 4Ever only shows it.
          </p>
        </Q>
      </section>

      <section id="sharing" className="help-section" aria-labelledby="sharing-title">
        <h2 id="sharing-title" className="h2">
          Sharing a clip
        </h2>
        <ol className="help-list">
          <li>
            <strong>Paste a link.</strong> A YouTube video or Short, a Twitch clip or a Twitch video. We look up the
            title, channel and length ourselves, so they&apos;re always right.
          </li>
          <li>
            <strong>Say whose it is.</strong> &ldquo;I made this&rdquo; puts it on your profile. &ldquo;I&apos;m sharing
            someone else&apos;s&rdquo; credits the creator and shows you as the one who shared it.
          </li>
          <li>
            <strong>Pick movie or clip and a category.</strong> Movies are edited pieces with cuts, music and a story.
            Clips are single moments straight from a stream or recording.
          </li>
          <li>
            <strong>Tell us about the music.</strong> Your own music, the game&apos;s soundtrack, a licensed track (with
            a credit), or game audio only.
          </li>
          <li>
            <strong>Send it.</strong> A curator takes a quick look, then it goes live on the front page and in the Clips
            feed.
          </li>
        </ol>
        <Link href="/submit" className="btn btn-gold" style={{ alignSelf: "flex-start" }}>
          Submit a clip
        </Link>
        <Q q="What's the gold Player-made mark?">
          <p>
            It marks videos a player actually made and edited themselves, not raw clips cut from a stream. Share a movie
            and pick &ldquo;I made this&rdquo; and it gets the mark; curators can add it to other handmade work too.
            Player-made movies are lifted ahead of the rest in Trending movies on the front page.
          </p>
        </Q>
        <Q q="How long does review take?">
          <p>
            Usually not long. You can have up to {site.maxPendingSubmissions} videos waiting at once and share up to{" "}
            {site.maxSubmissionsPerDay} a day.
          </p>
        </Q>
        <Q q="Why was my clip turned down?">
          <p>
            Most often it wasn&apos;t World of Warcraft, it was a reupload of someone else&apos;s video, or the title
            needed cleaning up. Open the video from your profile to see the reason. The full list is in the{" "}
            <Link href="/rules">submission rules</Link>.
          </p>
        </Q>
        <Q q="Can I share a clip that's already on 4Ever?">
          <p>No. If it&apos;s already here, the submit page links you to it instead.</p>
        </Q>
      </section>

      <section id="claiming" className="help-section" aria-labelledby="claiming-title">
        <h2 id="claiming-title" className="h2">
          Is it your channel?
        </h2>
        <p className="muted" style={{ margin: 0 }}>
          Verify your channel once and every clip from it, whoever shared it, moves to your profile with a verified
          check.
        </p>
        <Q q="How do I verify my Twitch channel?">
          <p>Log in with Twitch, or link Twitch in Settings. It&apos;s verified instantly.</p>
        </Q>
        <Q q="How do I verify my YouTube channel?">
          <p>
            In <Link href="/settings#channels">Settings</Link>, paste your channel and press &ldquo;Get my code&rdquo;.
            Add the code to your channel description, then press check. It takes about a minute, and you can remove the
            code afterwards.
          </p>
        </Q>
        <Q q="Someone shared my video and I want it gone.">
          <p>
            Open the video and choose &ldquo;Report or request removal&rdquo;, or{" "}
            <Link href="/report">send a removal request</Link>. A curator takes it off 4Ever. It stays on your own
            channel, which is always your call.
          </p>
        </Q>
      </section>

      <section id="watching" className="help-section" aria-labelledby="watching-title">
        <h2 id="watching-title" className="h2">
          Watching
        </h2>
        <Q q="What's the Clips feed?" open>
          <p>
            A full-screen player, one clip at a time. Swipe up (or scroll down) for the next clip, swipe down for the
            last one, and tap to pause. Clips come in a fresh random order each visit, and ones you&apos;ve already
            watched are left out until you&apos;ve seen them all.
          </p>
        </Q>
        <Q q="What does the “Watched” mark on a thumbnail mean?">
          <p>You&apos;ve already played that video on this device.</p>
        </Q>
        <Q q="Twitch clips look zoomed in on my phone.">
          <p>
            They&apos;re cropped to fill the screen, the way Shorts are. Tap &ldquo;Tap for sound&rdquo; to switch to
            Twitch&apos;s full player with its sound and controls.
          </p>
        </Q>
      </section>

      <section id="ranks" className="help-section" aria-labelledby="ranks-title">
        <h2 id="ranks-title" className="h2">
          Ranks and the experience bar
        </h2>
        <p className="muted" style={{ margin: 0 }}>
          Every minute you spend watching fills your experience bar. Fill it to climb the old PvP ranks: Horde players
          climb from Scout to High Warlord, Alliance players from Private to Grand Marshal. Each rank takes longer than
          the last.
        </p>
        <div className="help-table-wrap">
          <table className="help-table">
            <thead>
              <tr>
                <th scope="col">Rank</th>
                <th scope="col">Horde</th>
                <th scope="col">Alliance</th>
                <th scope="col">Total watching</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: MAX_RANK }, (_, i) => i + 1).map((rank) => (
                <tr key={rank}>
                  <td>
                    <RankInsignia rank={rank} earned size={26} />
                  </td>
                  <td className={`rarity-${rankRarity(rank)}`}>{HORDE_RANKS[rank - 1]}</td>
                  <td className={`rarity-${rankRarity(rank)}`}>{ALLIANCE_RANKS[rank - 1]}</td>
                  <td className="muted">{rank === 1 ? "Start" : hours(RANK_START[rank - 1])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Q q="What counts as watching?">
          <p>
            One minute of a video actually playing, with 4Ever open on your screen, is 1 XP. Short clips add up, so
            three 20-second clips make a minute. A video earns for about its own length, so leaving one open in a tab
            doesn&apos;t keep counting.
          </p>
        </Q>
        <Q q="Is there a limit?">
          <p>
            You can earn up to {DAILY_XP_CAP / 60} hours of XP a day. That keeps the top ranks something you earn over
            weeks, not overnight.
          </p>
        </Q>
        <Q q="Why does my rank say “Rank 3” instead of a title?">
          <p>
            Pick Horde or Alliance in <Link href="/settings">Settings</Link> (choosing your character&apos;s race does
            it too) and your rank takes that faction&apos;s title.
          </p>
        </Q>
        <Q q="Do I need an account?">
          <p>Yes. XP is saved to your profile, so log in with Discord or Twitch and it starts counting right away.</p>
        </Q>
      </section>

      <section id="colors" className="help-section" aria-labelledby="colors-title">
        <h2 id="colors-title" className="h2">
          Title colors
        </h2>
        <p className="muted" style={{ margin: 0 }}>
          Video titles change color like item quality as more people watch them on 4Ever. Rank names use the same colors
          as you climb.
        </p>
        <ul className="help-colors">
          {colorTiers.map((tier) => (
            <li key={tier.key}>
              <span className={`rarity-${tier.key}`} style={{ fontWeight: 800 }}>
                Onyxia wipe recovery
              </span>
              <span className="small muted">
                {tier.minViews === 0 ? "Every new video" : `${tier.minViews.toLocaleString("en-US")}+ views`}
              </span>
            </li>
          ))}
        </ul>
        <Q q="What counts as a view?">
          <p>Pressing play on 4Ever. Each person counts once per video per day.</p>
        </Q>
      </section>

      <section id="community" className="help-section" aria-labelledby="community-title">
        <h2 id="community-title" className="h2">
          Votes, favorites and comments
        </h2>
        <Q q="What do votes do?">
          <p>
            They show the community&apos;s favorites. You can sort any list by most voted, and votes will help pick
            contest winners when contests start.
          </p>
        </Q>
        <Q q="Where do my favorites go?">
          <p>To the Favorites tab on your profile.</p>
        </Q>
        <Q q="Can I delete a comment?">
          <p>Yes, your own, any time. Curators can remove comments that break the rules.</p>
        </Q>
        <Q q="Are there contests?">
          <p>Not yet. When one starts, a banner at the top of the site will say so.</p>
        </Q>
      </section>

      <section id="account" className="help-section" aria-labelledby="account-title">
        <h2 id="account-title" className="h2">
          Your account and profile
        </h2>
        <Q q="How do I log in?">
          <p>With Discord or Twitch. There are no passwords on 4Ever.</p>
        </Q>
        <Q q="What's the class picker?">
          <p>
            The first time you log in you choose your class and spec. It goes on your profile next to your name, and you
            can change it any time from your profile.
          </p>
        </Q>
        <Q q="Can I show my main character?">
          <p>
            Yes. In <Link href="/settings">Settings</Link> add your character&apos;s name, race, class and ruleset, and
            it shows on your profile like an in-game tooltip.
          </p>
        </Q>
        <Q q="How do I suggest an idea or report a bug?">
          <p>
            Use <Link href="/suggest">Suggestions</Link> (also in your account menu). The person who runs 4Ever reads
            every one, and replies show up on that page.
          </p>
        </Q>
        <Q q="How do I delete my videos or my account?">
          <p>
            Videos: open your profile and use Delete under the video. Your account: the bottom of{" "}
            <Link href="/settings">Settings</Link>.
          </p>
        </Q>
      </section>

      <section id="removal" className="help-section" aria-labelledby="removal-title">
        <h2 id="removal-title" className="h2">
          Removal, reports and privacy
        </h2>
        <Q q="How do I report a video?">
          <p>
            Use &ldquo;Report or request removal&rdquo; on the video&apos;s page, or the{" "}
            <Link href="/report">report form</Link>. Creator removal requests are handled first.
          </p>
        </Q>
        <Q q="What do you keep about me?">
          <p>
            Your name, avatar and email from the login, plus what you add yourself. The full details are in the{" "}
            <Link href="/privacy">privacy notes</Link>.
          </p>
        </Q>
      </section>

      <p className="small muted" style={{ margin: 0 }}>
        Something not covered here? <Link href="/suggest">Ask through Suggestions</Link>.
      </p>
    </div>
  );
}
