// Site-wide settings. Change these in one place.

export const site = {
  name: "4Everclips",
  shortName: "4Ever",
  tagline: "Movies and clips from World of Warcraft: Forever",
  description:
    "A fan-made home for World of Warcraft: Forever movies, PvP edits and clips. Share your best work and vote on the community's.",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "hello@4everclips.com",
  // Your DMCA designated agent (see SETUP.md, "Before launch")
  dmcaAgentName: process.env.NEXT_PUBLIC_DMCA_AGENT_NAME ?? "",
  dmcaAgentAddress: process.env.NEXT_PUBLIC_DMCA_AGENT_ADDRESS ?? "",
  dmcaEmail: process.env.NEXT_PUBLIC_DMCA_EMAIL ?? process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "hello@4everclips.com",

  // World of Warcraft: Forever launch (6:00 PM Eastern, Nov 4 2026)
  launchAt: "2026-11-04T23:00:00Z",
  // Hide the launch banner after this moment
  launchBannerUntil: "2026-11-18T05:00:00Z",

  // Dates and times on the site are shown in this time zone
  timeZone: "America/New_York",
  timeZoneLabel: "ET",

  // Submission limits per person
  maxPendingSubmissions: 5,
  maxSubmissionsPerDay: 10,

  // Founding Creator title goes to this many creators
  foundingCreatorLimit: 50,
} as const;
