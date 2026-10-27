// Shapes of the rows the site reads from the database.

export type Role = "member" | "curator" | "admin";

export type Profile = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  main_character: string | null;
  main_level: number | null;
  main_race: string | null;
  main_class: string | null;
  main_spec: string | null;
  realm: string | null;
  guild: string | null;
  faction: "horde" | "alliance" | null;
  active_title: string | null;
  role: Role;
  created_at: string;
};

export type PersonSummary = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
};

export type ClipStatus = "pending" | "approved" | "rejected" | "removed";

export type Clip = {
  id: string;
  short_id: string;
  platform: "youtube" | "twitch";
  source_type: "youtube_video" | "twitch_clip" | "twitch_video";
  source_id: string;
  source_url: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  channel_id: string | null;
  channel_name: string;
  channel_url: string | null;
  creator_id: string | null;
  submitted_by: string | null;
  kind: "movie" | "clip";
  category: string;
  tags: string[];
  music_source: string;
  music_credit: string | null;
  status: ClipStatus;
  review_note: string | null;
  published_at: string | null;
  view_count: number;
  vote_count: number;
  comment_count: number;
  created_at: string;
  creator: PersonSummary | null;
  submitter: PersonSummary | null;
};

export type Channel = {
  id: string;
  user_id: string;
  platform: "youtube" | "twitch";
  channel_id: string;
  channel_name: string;
  channel_url: string | null;
  verification_code: string | null;
  verified_at: string | null;
  created_at: string;
};

export type CommentRow = {
  id: string;
  clip_id: string;
  user_id: string;
  body: string;
  created_at: string;
  author: PersonSummary | null;
};

export type Contest = {
  id: string;
  slug: string;
  title: string;
  tagline: string | null;
  description: string | null;
  rules: string | null;
  prizes: string[];
  opens_at: string;
  closes_at: string;
  ends_at: string;
  created_at: string;
};

export type Feature = {
  id: string;
  clip_id: string;
  use_text: string | null;
  flavor_text: string | null;
  starts_at: string;
  ends_at: string | null;
  created_at: string;
  clip: Clip | null;
};

export type BadgeRow = {
  user_id: string;
  badge: string;
  awarded_at: string;
  note: string | null;
};

export type Report = {
  id: string;
  clip_id: string | null;
  reporter_id: string | null;
  reason: string;
  details: string | null;
  contact_email: string | null;
  status: "open" | "resolved" | "dismissed";
  created_at: string;
};

// Columns to select for a clip, with the people attached.
export const CLIP_COLUMNS = `
  id, short_id, platform, source_type, source_id, source_url, title, description,
  thumbnail_url, duration_seconds, channel_id, channel_name, channel_url,
  creator_id, submitted_by, kind, category, tags, music_source, music_credit,
  status, review_note, published_at, view_count, vote_count, comment_count, created_at,
  creator:profiles!clips_creator_id_fkey ( id, username, display_name, avatar_url ),
  submitter:profiles!clips_submitted_by_fkey ( id, username, display_name, avatar_url )
`;
