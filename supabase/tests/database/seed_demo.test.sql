-- FR-55: seed_demo gives a parent one synthetic child with 4 weeks of scored sessions.
-- FR-56: running it twice leaves the same data; other parents are untouched.
-- NFR-12: only the service role may call it.
-- Run with: npx supabase@latest test db
begin;
create extension if not exists pgtap with schema extensions;

select plan(13);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'demo-parent@example.test'),
  ('00000000-0000-0000-0000-00000000000b', 'parent-b@example.test');
insert into public.children (id, parent_id, nickname, birth_year) values
  ('00000000-0000-0000-0000-0000000000ca', '00000000-0000-0000-0000-00000000000a', 'Old Child', 2016),
  ('00000000-0000-0000-0000-0000000000cb', '00000000-0000-0000-0000-00000000000b', 'Test Owl', 2017);

set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}';
select throws_ok($$ select public.seed_demo('00000000-0000-0000-0000-00000000000a') $$, '42501', null, 'a parent cannot call seed_demo');
reset role;

set local role service_role; -- check-secrets: allow
select is(public.seed_demo('00000000-0000-0000-0000-00000000000a'), 12, 'seed_demo answers the number of sessions');
reset role;

select results_eq(
  $$ select nickname from public.children where parent_id = '00000000-0000-0000-0000-00000000000a' $$,
  array['Demo Fox'],
  'the demo parent has exactly one synthetic child (the old one is gone)'
);
select results_eq($$ select count(*)::int from public.sessions where parent_id = '00000000-0000-0000-0000-00000000000a' $$, array[12], '12 sessions');
select results_eq($$ select count(*)::int from public.scores where parent_id = '00000000-0000-0000-0000-00000000000a' $$, array[12], 'one score per session');
select ok(
  (select min(started_at) >= now() - interval '29 days' and max(started_at) <= now()
   from public.sessions where parent_id = '00000000-0000-0000-0000-00000000000a'),
  'sessions spread over the last 4 weeks, none in the future'
);
select ok(
  (select count(distinct started_at::date) = 12 from public.sessions where parent_id = '00000000-0000-0000-0000-00000000000a'),
  'one session per day shown, so the chart has 12 points'
);
select results_eq(
  $$ select band, count(*)::int from public.scores where parent_id = '00000000-0000-0000-0000-00000000000a' group by band order by band $$,
  $$ values ('follow_up_suggested'::text, 11), ('insufficient_data'::text, 1) $$,
  'eleven full sessions and one short one'
);
select ok(
  (select bool_and(cardinality(reasons) = cardinality(flags) and validated = false and scoring_method = 'rules_v0')
   from public.scores where parent_id = '00000000-0000-0000-0000-00000000000a'),
  'one reason per flag (FR-24), validated false'
);
select ok(
  (select bool_and((indicators ->> 'rt_cv')::numeric between 0 and 1 and (indicators ->> 'commission_rate')::numeric between 0 and 1)
   from public.scores where parent_id = '00000000-0000-0000-0000-00000000000a'),
  'rates are fractions between 0 and 1'
);

-- FR-56: a second run gives the same content.
create temp table first_run as
  select s.started_at, sc.band, sc.flags, sc.indicators, sc.data_quality
  from public.sessions s join public.scores sc on sc.session_id = s.id
  where s.parent_id = '00000000-0000-0000-0000-00000000000a';
set local role service_role; -- check-secrets: allow
select public.seed_demo('00000000-0000-0000-0000-00000000000a');
reset role;
select set_eq(
  $$ select s.started_at, sc.band, sc.flags, sc.indicators, sc.data_quality
     from public.sessions s join public.scores sc on sc.session_id = s.id
     where s.parent_id = '00000000-0000-0000-0000-00000000000a' $$,
  $$ select * from first_run $$,
  'running it twice leaves the same data'
);
select results_eq($$ select count(*)::int from public.children where parent_id = '00000000-0000-0000-0000-00000000000a' $$, array[1], 'still one child after a second run');
select results_eq($$ select nickname from public.children where parent_id = '00000000-0000-0000-0000-00000000000b' $$, array['Test Owl'], 'another parent is untouched');

select * from finish();
rollback;
