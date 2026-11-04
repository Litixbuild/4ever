-- When the video was uploaded to YouTube or Twitch (not when it was shared on 4Ever). Read from the
-- platform at submit time and by the daily refresh, which also fills it in for older videos.
alter table public.clips add column if not exists uploaded_at timestamptz;

create index if not exists clips_newest_upload on public.clips (uploaded_at desc nulls last, published_at desc)
  where status = 'approved';
