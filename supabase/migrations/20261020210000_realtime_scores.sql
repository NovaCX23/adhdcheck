-- FR-39: publish new scores to Supabase Realtime so the result card appears on the parent screen without
-- a refresh. Realtime postgres_changes applies the RLS policy scores_select_own: each logged-in parent
-- receives only their own rows (checked locally: parent A got its 12 new scores live, parent B none).
-- For the page: subscribe to INSERT on public.scores (filter child_id is not available: scores has no
-- child_id, match session_id) as soon as the QR is shown, since changes in the first seconds after
-- SUBSCRIBED can be missed. Fallback if Realtime is unavailable: poll scores every 2 s (docs/02 FR-39).
alter publication supabase_realtime add table public.scores;
