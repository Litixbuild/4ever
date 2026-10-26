-- =============================================================================
-- Starter content: the two launch contests.
-- Run this after 0001_init.sql (SQL Editor -> New query -> paste -> Run).
-- You can change dates, text and prizes later from the Admin -> Contests page.
--
-- Times are stored in UTC. 23:00 UTC = 6:00 PM Eastern in November/December.
-- Heads up from Blizzard's video policy: if the total value of all prizes in a
-- contest goes over $500, you need a license from Blizzard first.
-- =============================================================================

insert into public.contests (slug, title, tagline, description, rules, prizes, opens_at, closes_at, ends_at)
values
(
  'launch-week',
  'Launch Week Moments',
  'Share your first days back in Azeroth.',
  'World of Warcraft: Forever is live. Show us the first kill, the first gank, the first time you got lost in a zone you thought you knew by heart. The best moments get featured on the front page.',
  E'Enter a movie or clip you made yourself during launch week.\nYour channel needs to be verified so the credit is yours.\nOne entry per person.\nVotes cast while the contest is open decide the standings, and curators pick the final winners.',
  array['A week on the 4Ever front page', 'A spot in the Hall of Fame', 'The Contest Winner title on your profile'],
  '2026-11-04 23:00:00+00',
  '2026-11-12 04:59:00+00',
  '2026-11-15 04:59:00+00'
),
(
  'first-kill',
  'First Kill',
  'Cut the best moment from raid unlock week.',
  'Raids open December 9. Record the wipes, the clutch saves and that first kill, then cut the best of it into something worth watching.',
  E'Enter a movie or clip you made yourself from raid unlock week.\nYour channel needs to be verified so the credit is yours.\nOne entry per person.\nVotes cast while the contest is open decide the standings, and curators pick the final winners.',
  array['A week on the 4Ever front page', 'A spot in the Hall of Fame', 'The Contest Winner title on your profile'],
  '2026-12-09 23:00:00+00',
  '2026-12-20 04:59:00+00',
  '2026-12-23 04:59:00+00'
)
on conflict (slug) do nothing;
