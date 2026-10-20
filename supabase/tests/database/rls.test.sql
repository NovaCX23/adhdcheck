-- NFR-11: RLS on every table, parent B reads zero rows of parent A.
-- FR-41: deleting a child deletes its sessions, trials and scores.
-- NFR-02: the child appears in sessions, trials and scores only as a UUID.
-- Run with: npx supabase@latest test db
begin;
create extension if not exists pgtap with schema extensions;

select plan(28);

-- Fixed synthetic ids so failures are easy to read.
-- Parent A: ...0a, parent B: ...0b, child of A: ...ca, session of A: ...5a.

-- Every table in public has RLS on, and every policy uses (select auth.uid()).
select is_empty(
  $$ select tablename from pg_tables where schemaname = 'public' and not rowsecurity $$,
  'RLS is enabled on every public table'
);
select is_empty(
  $$ select tablename || '.' || policyname from pg_policies
     where schemaname = 'public'
       and coalesce(qual, '') || coalesce(with_check, '') not like '%( SELECT auth.uid() AS uid)%' $$,
  'every policy compares with (select auth.uid())'
);
select is_empty(
  $$ select tablename || '.' || policyname from pg_policies
     where schemaname = 'public' and roles <> '{authenticated}' $$,
  'every policy applies to authenticated only'
);

-- NFR-02: no nickname outside children.
select hasnt_column('public', 'sessions', 'nickname', 'sessions has no nickname');
select hasnt_column('public', 'trials', 'nickname', 'trials has no nickname');
select hasnt_column('public', 'scores', 'nickname', 'scores has no nickname');

-- Two parents. The auth trigger creates their parents rows.
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'parent-a@example.test'),
  ('00000000-0000-0000-0000-00000000000b', 'parent-b@example.test');

select results_eq(
  $$ select count(*)::int from public.parents where id in ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000b') $$,
  array[2],
  'signing up creates a parents row'
);

-- Data of parent A, written as the server would (service role bypasses RLS).
insert into public.children (id, parent_id, nickname, birth_year) values
  ('00000000-0000-0000-0000-0000000000ca', '00000000-0000-0000-0000-00000000000a', 'Test Fox', 2018);

insert into public.sessions (id, child_id, parent_id, started_at, duration_ms, task, device, calibration, off_target_taps, schema_version)
values (
  '00000000-0000-0000-0000-00000000005a',
  '00000000-0000-0000-0000-0000000000ca',
  '00000000-0000-0000-0000-00000000000a',
  '2026-10-20T10:00:00Z', 1000, '{}', '{}', '{}', '[]', '1.0'
);

insert into public.trials (session_id, parent_id, i, block, type, stimulus_onset_ms, responded, rt_ms, outcome, x, y)
values (
  '00000000-0000-0000-0000-00000000005a',
  '00000000-0000-0000-0000-00000000000a',
  0, 0, 'go', 100, true, 300, 'hit', 10, 10
);

insert into public.scores (session_id, parent_id, scoring_method, validated, indicators, flags, band, data_quality, reasons, recommendations, disclaimer)
values (
  '00000000-0000-0000-0000-00000000005a',
  '00000000-0000-0000-0000-00000000000a',
  'rules_v0', false, '{}', '{}', 'insufficient_data', '{}', '{}', '{}', 'test disclaimer'
);

-- A session cannot claim a parent other than the child's parent.
select throws_ok(
  $$ insert into public.sessions (id, child_id, parent_id, started_at, duration_ms, task, device, calibration, off_target_taps, schema_version)
     values ('00000000-0000-0000-0000-0000000000ff', '00000000-0000-0000-0000-0000000000ca',
             '00000000-0000-0000-0000-00000000000b', now(), 1, '{}', '{}', '{}', '[]', '1.0') $$,
  '23503',
  null,
  'a session parent_id must match its child parent_id'
);

-- Anonymous visitor has no privilege on the tables at all.
set local role anon;
select throws_ok($$ select 1 from public.children $$, '42501', null, 'anon cannot read children');
select throws_ok($$ select 1 from public.sessions $$, '42501', null, 'anon cannot read sessions');
reset role;

-- Parent B sees none of parent A's rows.
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-00000000000b", "role": "authenticated"}';

select results_eq($$ select count(*)::int from public.parents $$, array[1], 'parent B reads only its own parents row');
select is_empty($$ select 1 from public.children $$, 'parent B reads zero children of parent A');
select is_empty($$ select 1 from public.sessions $$, 'parent B reads zero sessions of parent A');
select is_empty($$ select 1 from public.trials $$, 'parent B reads zero trials of parent A');
select is_empty($$ select 1 from public.scores $$, 'parent B reads zero scores of parent A');

select throws_ok(
  $$ insert into public.children (parent_id, nickname, birth_year)
     values ('00000000-0000-0000-0000-00000000000a', 'Intruder', 2018) $$,
  '42501',
  null,
  'parent B cannot create a child under parent A'
);
select is_empty(
  $$ update public.children set nickname = 'Changed' where id = '00000000-0000-0000-0000-0000000000ca' returning 1 $$,
  'parent B cannot update a child of parent A'
);
select is_empty(
  $$ delete from public.children where id = '00000000-0000-0000-0000-0000000000ca' returning 1 $$,
  'parent B cannot delete a child of parent A'
);

-- Parent B can create its own child; parent_id defaults to the caller.
select lives_ok(
  $$ insert into public.children (nickname, birth_year) values ('Test Owl', 2017) $$,
  'parent B creates its own child'
);
select results_eq($$ select count(*)::int from public.children $$, array[1], 'parent B reads its own child');

-- Parent A sees its own rows.
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}';

select results_eq($$ select count(*)::int from public.children $$, array[1], 'parent A reads its child');
select results_eq($$ select count(*)::int from public.sessions $$, array[1], 'parent A reads its session');
select results_eq($$ select count(*)::int from public.trials $$, array[1], 'parent A reads its trial');
select results_eq($$ select count(*)::int from public.scores $$, array[1], 'parent A reads its score');

-- FR-41: parent A deletes the child; everything below it goes.
select results_eq(
  $$ with d as (delete from public.children where id = '00000000-0000-0000-0000-0000000000ca' returning 1)
     select count(*)::int from d $$,
  array[1],
  'parent A deletes its child'
);
reset role;

-- Checked as the table owner, which bypasses RLS like the service role.
select is_empty(
  $$ select 1 from public.sessions where child_id = '00000000-0000-0000-0000-0000000000ca' $$,
  'FR-41: no session left for the deleted child'
);
select is_empty(
  $$ select 1 from public.trials where session_id = '00000000-0000-0000-0000-00000000005a' $$,
  'FR-41: no trial left for the deleted child'
);
select is_empty(
  $$ select 1 from public.scores where session_id = '00000000-0000-0000-0000-00000000005a' $$,
  'FR-41: no score left for the deleted child'
);

select * from finish();
rollback;
