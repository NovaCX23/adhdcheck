-- FR-45 to FR-47: Stripe customer per parent, subscription status written by the webhook (service role),
-- read by the parent (RLS). Older events never overwrite newer ones.
-- Run with: npx supabase@latest test db
begin;
create extension if not exists pgtap with schema extensions;

select plan(12);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'parent-a@example.test'),
  ('00000000-0000-0000-0000-00000000000b', 'parent-b@example.test');

-- Only the service role writes.
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}';
select throws_ok($$ select public.set_stripe_customer('00000000-0000-0000-0000-00000000000a', 'cus_x') $$, '42501', null, 'a parent cannot set a Stripe customer');
select throws_ok($$ select public.record_subscription('cus_x', 'sub_x', 'active', now()) $$, '42501', null, 'a parent cannot record a subscription');
select throws_ok($$ insert into public.subscriptions (parent_id, stripe_subscription_id, status) values ('00000000-0000-0000-0000-00000000000a', 'sub_x', 'active') $$, '42501', null, 'a parent cannot write subscriptions');
reset role;

set local role service_role; -- check-secrets: allow
select is(public.set_stripe_customer('00000000-0000-0000-0000-00000000000a', 'cus_a'), 'cus_a', 'the first customer id is stored');
select is(public.set_stripe_customer('00000000-0000-0000-0000-00000000000a', 'cus_a2'), 'cus_a', 'a second call keeps the first customer (no duplicate customer)');
select is(public.record_subscription('cus_unknown', 'sub_x', 'active', now()), 'unknown_customer', 'an unknown customer is reported, nothing stored');
select is(public.record_subscription('cus_a', 'sub_a', 'active', '2026-10-20 10:00+00'), 'updated', 'a subscription is recorded');
select is(public.record_subscription('cus_a', 'sub_a', 'past_due', '2026-10-20 09:00+00'), 'stale', 'an older event is ignored');
select is(public.record_subscription('cus_a', 'sub_a', 'canceled', '2026-10-20 11:00+00'), 'updated', 'a newer event updates the status');
reset role;

select is((select status from public.subscriptions where parent_id = '00000000-0000-0000-0000-00000000000a'), 'canceled', 'the newest status wins');

set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}';
select results_eq($$ select status from public.subscriptions $$, array['canceled'], 'parent A reads its own status');
reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-00000000000b", "role": "authenticated"}';
select is_empty($$ select 1 from public.subscriptions $$, 'parent B sees nothing of parent A');
reset role;

select * from finish();
rollback;
