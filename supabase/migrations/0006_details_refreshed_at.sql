-- YouTube's developer rules: stored video details must be refreshed (or deleted) within 30 days.
-- A daily job re-reads anything older than 25 days; this column tracks when that last happened.
alter table public.clips add column if not exists details_refreshed_at timestamptz not null default now();
update public.clips set details_refreshed_at = created_at;
create index if not exists clips_details_refreshed_at_idx on public.clips (details_refreshed_at);
