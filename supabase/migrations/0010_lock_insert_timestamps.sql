-- Signed-in people could set created_at (and id) themselves when adding a comment, vote or favorite.
-- A comment back-dated by a minute slips past the "commenting a little fast" limit, which checks
-- created_at. Insert rights are now given column by column, leaving out the ones the database fills in.
revoke insert on public.comments, public.votes, public.favorites from authenticated;
grant insert (clip_id, user_id, body) on public.comments to authenticated;
grant insert (clip_id, user_id) on public.votes to authenticated;
grant insert (clip_id, user_id) on public.favorites to authenticated;
