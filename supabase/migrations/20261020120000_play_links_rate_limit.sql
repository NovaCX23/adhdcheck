-- Play links (FR-01, FR-32): the short-lived, single-use session link in the parent's QR code.
-- Only the SHA-256 hash of the code is stored. A link is for one child, expires, and is used up by
-- the one session saved with it. save_session now requires a link (replaces save_session(jsonb, jsonb)).
-- Rate limit (NFR-13): a fixed-window counter per key, for POST /api/sessions.
-- Both tables are server only (service role, NFR-12): RLS on, no policy, no grant to anon or authenticated.

create table public.play_links (
  code_hash text primary key check (code_hash ~ '^[0-9a-f]{64}$'),
  child_id uuid not null,
  parent_id uuid not null,
  expires_at timestamptz not null,
  -- the session saved with this link; null while unused
  session_id uuid,
  created_at timestamptz not null default now(),
  -- FR-41: deleting a child deletes its links
  foreign key (child_id, parent_id) references public.children (id, parent_id) on delete cascade
);

create index play_links_child_id_idx on public.play_links (child_id);
create index play_links_parent_id_idx on public.play_links (parent_id);

create table public.rate_limits (
  bucket text primary key,
  window_start timestamptz not null,
  hits integer not null check (hits > 0)
);

revoke all on public.play_links, public.rate_limits from anon, authenticated;
alter table public.play_links enable row level security;
alter table public.rate_limits enable row level security;

-- Stores a link for the parent's own child. Returns false (and stores nothing) for any other child.
create function public.issue_play_link(p_parent_id uuid, p_child_id uuid, p_code_hash text, p_expires_at timestamptz)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
begin
  insert into public.play_links (code_hash, child_id, parent_id, expires_at)
  select p_code_hash, c.id, c.parent_id, p_expires_at
  from public.children c
  where c.id = p_child_id and c.parent_id = p_parent_id;
  return found;
end;
$$;

-- The child of a link that exists, has not expired and is not used up; otherwise null.
create function public.resolve_play_link(p_code_hash text)
returns uuid
language sql
stable
security invoker
set search_path = ''
as $$
  select l.child_id
  from public.play_links l
  where l.code_hash = p_code_hash and l.expires_at > now() and l.session_id is null;
$$;

-- save_session: store one SessionMetrics v1 (with its trials) and its ScoreResult v1 in one transaction,
-- with a play link that is valid for this child, and mark the link used.
-- Called by POST /api/sessions through the service role only (NFR-12); the payloads were validated
-- against the contracts before the call. parent_id comes from the link, never from the payload.
-- Returns 'created', 'duplicate' (this link already saved this session_id, FR-12) or 'invalid_play_link'.
drop function public.save_session(jsonb, jsonb);

create function public.save_session(p_code_hash text, p_session jsonb, p_score jsonb)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_session_id uuid := (p_session ->> 'session_id')::uuid;
  v_link public.play_links;
  v_inserted integer;
begin
  -- Lock the link so two posts with the same link cannot both use it.
  select * into v_link from public.play_links l where l.code_hash = p_code_hash for update;

  if not found or v_link.child_id <> (p_session ->> 'child_id')::uuid then
    return 'invalid_play_link';
  end if;
  if v_link.session_id is not null then
    return case when v_link.session_id = v_session_id then 'duplicate' else 'invalid_play_link' end;
  end if;
  if v_link.expires_at <= now() then
    return 'invalid_play_link';
  end if;

  insert into public.sessions (id, child_id, parent_id, started_at, duration_ms, task, device, calibration, off_target_taps, schema_version)
  values (
    v_session_id,
    v_link.child_id,
    v_link.parent_id,
    (p_session ->> 'started_at')::timestamptz,
    (p_session ->> 'duration_ms')::double precision,
    p_session -> 'task',
    p_session -> 'device',
    p_session -> 'calibration',
    p_session -> 'off_target_taps',
    p_session ->> 'schema_version'
  )
  on conflict (id) do nothing;

  -- The session_id is already stored, saved with another link: this link cannot claim it.
  get diagnostics v_inserted = row_count;
  if v_inserted = 0 then
    return 'invalid_play_link';
  end if;

  update public.play_links set session_id = v_session_id where code_hash = p_code_hash;

  insert into public.trials (session_id, parent_id, i, block, type, stimulus_onset_ms, responded, rt_ms, outcome, x, y)
  select v_session_id, v_link.parent_id, t.i, t.block, t.type, t.stimulus_onset_ms, t.responded, t.rt_ms, t.outcome, t.x, t.y
  from jsonb_to_recordset(p_session -> 'trials') as t (
    i integer, block integer, type text, stimulus_onset_ms double precision, responded boolean,
    rt_ms double precision, outcome text, x double precision, y double precision
  );

  insert into public.scores (session_id, parent_id, scoring_method, validated, indicators, flags, band, data_quality, reasons, recommendations, disclaimer)
  values (
    v_session_id,
    v_link.parent_id,
    p_score ->> 'scoring_method',
    (p_score ->> 'validated')::boolean,
    p_score -> 'indicators',
    array(select jsonb_array_elements_text(p_score -> 'flags')),
    p_score ->> 'band',
    p_score -> 'data_quality',
    array(select jsonb_array_elements_text(p_score -> 'reasons')),
    array(select jsonb_array_elements_text(p_score -> 'recommendations')),
    p_score ->> 'disclaimer'
  );

  return 'created';
end;
$$;

-- Counts one hit for p_bucket in a fixed window of p_window_seconds. Returns true while the count
-- is within p_limit. Also deletes expired windows of other buckets, skipping rows another call holds
-- (so two calls never wait on each other's rows).
create function public.take_rate_limit(p_bucket text, p_limit integer, p_window_seconds integer)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_window interval := make_interval(secs => p_window_seconds);
  v_hits integer;
begin
  insert into public.rate_limits as r (bucket, window_start, hits)
  values (p_bucket, now(), 1)
  on conflict (bucket) do update set
    window_start = case when r.window_start <= now() - v_window then now() else r.window_start end,
    hits = case when r.window_start <= now() - v_window then 1 else r.hits + 1 end
  returning r.hits into v_hits;

  delete from public.rate_limits
  where bucket in (
    select o.bucket from public.rate_limits o
    where o.window_start <= now() - v_window and o.bucket <> p_bucket
    for update skip locked
  );

  return v_hits <= p_limit;
end;
$$;

revoke execute on function public.issue_play_link(uuid, uuid, text, timestamptz) from public, anon, authenticated;
revoke execute on function public.resolve_play_link(text) from public, anon, authenticated;
revoke execute on function public.save_session(text, jsonb, jsonb) from public, anon, authenticated;
revoke execute on function public.take_rate_limit(text, integer, integer) from public, anon, authenticated;
grant select, insert, update, delete on public.play_links, public.rate_limits to service_role; -- check-secrets: allow
grant execute on function public.issue_play_link(uuid, uuid, text, timestamptz) to service_role; -- check-secrets: allow
grant execute on function public.resolve_play_link(text) to service_role; -- check-secrets: allow
grant execute on function public.save_session(text, jsonb, jsonb) to service_role; -- check-secrets: allow
grant execute on function public.take_rate_limit(text, integer, integer) to service_role; -- check-secrets: allow
