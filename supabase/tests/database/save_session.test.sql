-- FR-11: save_session writes session, trials and score in one transaction.
-- FR-12: the same session_id is stored once.
-- NFR-12: only the service role may call it.
-- Run with: npx supabase@latest test db
begin;
create extension if not exists pgtap with schema extensions;

select plan(14);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'parent-a@example.test');
insert into public.children (id, parent_id, nickname, birth_year) values
  ('00000000-0000-0000-0000-0000000000ca', '00000000-0000-0000-0000-00000000000a', 'Test Fox', 2018);

-- Synthetic payloads shaped like SessionMetrics v1 and ScoreResult v1.
create temp table payload as select
  jsonb_build_object(
    'schema_version', '1.0',
    'session_id', '00000000-0000-0000-0000-00000000005a',
    'child_id', '00000000-0000-0000-0000-0000000000ca',
    'started_at', '2026-10-20T10:00:00Z',
    'duration_ms', 1000,
    'task', jsonb_build_object('type', 'go_nogo'),
    'device', jsonb_build_object('pointer_type', 'touch'),
    'trials', jsonb_build_array(
      jsonb_build_object('i', 0, 'block', 0, 'type', 'go', 'stimulus_onset_ms', 100, 'responded', true,
                         'rt_ms', 350, 'outcome', 'hit', 'x', 10, 'y', 20),
      jsonb_build_object('i', 1, 'block', 0, 'type', 'nogo', 'stimulus_onset_ms', 1600, 'responded', false,
                         'rt_ms', null, 'outcome', 'correct_reject', 'x', 0, 'y', 0)),
    'off_target_taps', jsonb_build_array(jsonb_build_object('t_ms', 800, 'during', 'isi')),
    'calibration', jsonb_build_object('median_rt_ms', 340, 'n', 10)
  ) as session,
  jsonb_build_object(
    'schema_version', '1.0',
    'session_id', '00000000-0000-0000-0000-00000000005a',
    'scoring_method', 'rules_v0',
    'validated', false,
    'indicators', jsonb_build_object('omission_rate', 0),
    'flags', jsonb_build_array(),
    'band', 'insufficient_data',
    'data_quality', jsonb_build_object('n_trials', 2),
    'reasons', jsonb_build_array(),
    'recommendations', jsonb_build_array(),
    'disclaimer', 'test disclaimer'
  ) as score;
grant select on payload to anon, authenticated, service_role; -- check-secrets: allow

-- Only the service role can call it.
set local role anon;
select throws_ok($$ select public.save_session(session, score) from payload $$, '42501', null, 'anon cannot call save_session');
reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}';
select throws_ok($$ select public.save_session(session, score) from payload $$, '42501', null, 'a parent cannot call save_session');
reset role;

set local role service_role; -- check-secrets: allow
select is((select public.save_session(session, score) from payload), 'created', 'a new session is created');
select is((select public.save_session(session, score) from payload), 'duplicate', 'the same session_id again is a duplicate');
select is(
  (select public.save_session(jsonb_set(session, '{child_id}', '"00000000-0000-0000-0000-0000000000ff"'), score) from payload),
  'unknown_child',
  'an unknown child_id is refused'
);
reset role;

select results_eq($$ select count(*)::int from public.sessions $$, array[1], 'one session row after a duplicate post');
select results_eq($$ select count(*)::int from public.trials $$, array[2], 'two trial rows, not four');
select results_eq($$ select count(*)::int from public.scores $$, array[1], 'one score row');
select is(
  (select parent_id from public.sessions),
  '00000000-0000-0000-0000-00000000000a'::uuid,
  'parent_id is copied from the child, not taken from the payload'
);
select is((select rt_ms from public.trials where i = 1), null, 'a missing response keeps rt_ms null');
select is((select off_target_taps from public.sessions), (select session->'off_target_taps' from payload), 'off-target taps kept as jsonb');
select is((select band from public.scores), 'insufficient_data', 'score band saved');
select is((select flags from public.scores), '{}'::text[], 'empty flags saved as an empty array');

-- One transaction: a bad trial leaves no session behind.
set local role service_role; -- check-secrets: allow
select throws_ok(
  $$ select public.save_session(
       jsonb_set(jsonb_set(session, '{session_id}', '"00000000-0000-0000-0000-00000000005b"'),
                 '{trials,0,outcome}', '"not-an-outcome"'),
       score) from payload $$,
  '23514',
  null,
  'a trial that breaks a check constraint makes the whole save fail'
);
reset role;

select * from finish();
rollback;
