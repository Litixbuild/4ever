-- The channel's own picture from YouTube or Twitch, shown next to its videos before the channel is claimed on 4Ever.
alter table public.clips add column if not exists channel_avatar_url text;
alter table public.clips drop constraint if exists clips_channel_avatar_url_len;
alter table public.clips add constraint clips_channel_avatar_url_len check (channel_avatar_url is null or char_length(channel_avatar_url) <= 500);
