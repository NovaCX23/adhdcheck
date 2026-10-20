-- D-05, FR-48, NFR-11: GET /api/reports/<sessionId> reads the session, its score, the child's nickname and
-- the parent's subscription with the logged-in parent's own client. Parent B must get nothing of parent A,
-- even with a paid plan, so B can never download A's child report.
-- Run with: npx supabase@latest test db
begin;
create extension if not exists pgtap with schema extensions;

select plan(8);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'parent-a@example.test'),
  ('00000000-0000-0000-0000-00000000000b', 'parent-b@example.test');

insert into public.children (id, parent_id, nickname, birth_year) values
  ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-00000000000a', 'Synthetic A', 2018);

insert into public.sessions (id, child_id, parent_id, started_at, duration_ms, task, device, calibration, off_target_taps, schema_version) values
  ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-00000000000a',
   '2026-10-12 16:30+00', 300000, '{}', '{}', '{}', '[]', '1.0');

insert into public.scores (session_id, parent_id, scoring_method, validated, indicators, flags, band, data_quality, reasons, recommendations, disclaimer) values
  ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-00000000000a', 'rules_v0', false, '{}', '{}',
   'no_flag', '{}', '{}', '{}', 'Attention profile from a game. Not a diagnosis. Talk to a healthcare professional.');

-- Both parents have a paid plan: payment must never widen what a parent can read.
update public.parents set stripe_customer_id = 'cus_a' where id = '00000000-0000-0000-0000-00000000000a';
update public.parents set stripe_customer_id = 'cus_b' where id = '00000000-0000-0000-0000-00000000000b';
insert into public.subscriptions (parent_id, stripe_subscription_id, status, event_created) values
  ('00000000-0000-0000-0000-00000000000a', 'sub_a', 'active', now()),
  ('00000000-0000-0000-0000-00000000000b', 'sub_b', 'active', now());

set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-00000000000b", "role": "authenticated"}';
select is_empty($$ select 1 from public.sessions where id = '00000000-0000-0000-0000-0000000000d1' $$, 'parent B cannot read parent A''s session');
select is_empty($$ select 1 from public.scores where session_id = '00000000-0000-0000-0000-0000000000d1' $$, 'parent B cannot read parent A''s score');
select is_empty($$ select nickname from public.children where id = '00000000-0000-0000-0000-0000000000c1' $$, 'parent B cannot read parent A''s child nickname');
select results_eq($$ select status from public.subscriptions $$, array['active'], 'parent B reads only its own plan');
reset role;

set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}';
select results_eq($$ select id from public.sessions where id = '00000000-0000-0000-0000-0000000000d1' $$,
  array['00000000-0000-0000-0000-0000000000d1'::uuid], 'parent A reads its own session');
select results_eq($$ select band from public.scores where session_id = '00000000-0000-0000-0000-0000000000d1' $$,
  array['no_flag'], 'parent A reads its own score');
select results_eq($$ select nickname from public.children where id = '00000000-0000-0000-0000-0000000000c1' $$,
  array['Synthetic A'], 'parent A reads its own child nickname');
select throws_ok($$ update public.subscriptions set status = 'active' $$, '42501', null, 'a parent cannot mark itself as paid');
reset role;

select * from finish();
rollback;
