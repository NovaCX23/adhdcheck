-- Subscriptions (FR-45 to FR-47), Stripe test mode. One row per parent, written only by the Stripe webhook
-- through the service role (NFR-12); the parent reads their own row (RLS). The result card, next step and
-- data deletion never depend on it (FR-48).

create table public.subscriptions (
  parent_id uuid primary key references public.parents (id) on delete cascade,
  stripe_subscription_id text not null unique,
  status text not null,
  -- created time of the Stripe event that wrote this row: an older event never overwrites a newer one
  event_created timestamptz not null,
  updated_at timestamptz not null default now()
);

revoke all on public.subscriptions from anon, authenticated;
grant select on public.subscriptions to authenticated;
grant select, insert, update, delete on public.subscriptions to service_role; -- check-secrets: allow

alter table public.subscriptions enable row level security;

create policy "subscriptions_select_own" on public.subscriptions
  for select to authenticated using (parent_id = (select auth.uid()));

-- Stores the parent's Stripe customer id once and returns the one stored, so two checkouts started at the
-- same time end up with a single customer.
create function public.set_stripe_customer(p_parent_id uuid, p_customer_id text)
returns text
language sql
security invoker
set search_path = ''
as $$
  update public.parents set stripe_customer_id = coalesce(stripe_customer_id, p_customer_id)
  where id = p_parent_id
  returning stripe_customer_id;
$$;

-- Webhook write. Returns 'updated', 'stale' (an older event than the stored one) or 'unknown_customer'.
create function public.record_subscription(p_customer_id text, p_subscription_id text, p_status text, p_event_created timestamptz)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_parent_id uuid;
begin
  select p.id into v_parent_id from public.parents p where p.stripe_customer_id = p_customer_id;
  if v_parent_id is null then
    return 'unknown_customer';
  end if;

  insert into public.subscriptions as s (parent_id, stripe_subscription_id, status, event_created)
  values (v_parent_id, p_subscription_id, p_status, p_event_created)
  on conflict (parent_id) do update set
    stripe_subscription_id = excluded.stripe_subscription_id,
    status = excluded.status,
    event_created = excluded.event_created,
    updated_at = now()
  where s.event_created <= excluded.event_created;

  return case when found then 'updated' else 'stale' end;
end;
$$;

revoke execute on function public.set_stripe_customer(uuid, text) from public, anon, authenticated;
revoke execute on function public.record_subscription(text, text, text, timestamptz) from public, anon, authenticated;
grant execute on function public.set_stripe_customer(uuid, text) to service_role; -- check-secrets: allow
grant execute on function public.record_subscription(text, text, text, timestamptz) to service_role; -- check-secrets: allow
