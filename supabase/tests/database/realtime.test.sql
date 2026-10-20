-- FR-39: new scores reach the parent screen through Supabase Realtime (postgres_changes), which applies
-- RLS, so a parent receives only their own scores. Only scores is published: nothing else leaves this way.
-- Run with: npx supabase@latest test db
begin;
create extension if not exists pgtap with schema extensions;

select plan(2);

select is(
  (select array_agg(tablename::text collate "C" order by tablename) from pg_publication_tables
   where pubname = 'supabase_realtime' and schemaname = 'public'),
  array['scores'],
  'only public.scores is published to Realtime'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.scores'::regclass),
  'scores keeps RLS, so Realtime sends each parent only their own rows'
);

select * from finish();
rollback;
