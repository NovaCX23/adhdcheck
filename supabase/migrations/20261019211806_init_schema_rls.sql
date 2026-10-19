-- First schema: parents, children, sessions, trials, scores.
-- Columns follow docs/02 section 8 and the contracts in packages/contracts (SessionMetrics v1, ScoreResult v1).
-- NFR-01: children hold nickname and birth year only.
-- NFR-02: sessions, trials and scores know the child only by its UUID.
-- NFR-11: RLS on every table, one policy per operation, (select auth.uid()), to authenticated, policy columns indexed.
-- FR-41: deleting a child cascades to its sessions, trials and scores.
-- Writes of sessions, trials and scores go through the server (service role), so parents only read them.

-- parents: one row per auth user, created by trigger on sign-up.
create table public.parents (
  id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  stripe_customer_id text unique
);

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.parents (id) values (new.id);
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- children: the pseudonymous child_id is children.id.
create table public.children (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null default auth.uid() references public.parents (id) on delete cascade,
  nickname text not null check (char_length(btrim(nickname)) > 0),
  birth_year smallint not null,
  created_at timestamptz not null default now(),
  -- target of the composite keys below, so a session cannot claim another parent's child
  unique (id, parent_id)
);

create index children_parent_id_idx on public.children (parent_id);

-- sessions: one played session (SessionMetrics without trials). parent_id is copied from the child.
create table public.sessions (
  id uuid primary key,
  child_id uuid not null,
  parent_id uuid not null,
  started_at timestamptz not null,
  duration_ms double precision not null check (duration_ms >= 0),
  task jsonb not null,
  device jsonb not null,
  calibration jsonb not null,
  off_target_taps jsonb not null check (jsonb_typeof(off_target_taps) = 'array'),
  schema_version text not null,
  created_at timestamptz not null default now(),
  unique (id, parent_id),
  foreign key (child_id, parent_id) references public.children (id, parent_id) on delete cascade
);

create index sessions_parent_id_idx on public.sessions (parent_id);
create index sessions_child_id_idx on public.sessions (child_id);

-- trials: SessionMetrics.trials, one row per trial.
create table public.trials (
  session_id uuid not null,
  parent_id uuid not null,
  i integer not null check (i >= 0),
  block integer not null check (block >= 0),
  type text not null check (type in ('go', 'nogo', 'calibration')),
  stimulus_onset_ms double precision not null check (stimulus_onset_ms >= 0),
  responded boolean not null,
  rt_ms double precision check (rt_ms >= 0),
  outcome text not null check (outcome in ('hit', 'omission', 'correct_reject', 'commission', 'anticipation')),
  x double precision not null,
  y double precision not null,
  primary key (session_id, i),
  foreign key (session_id, parent_id) references public.sessions (id, parent_id) on delete cascade
);

create index trials_parent_id_idx on public.trials (parent_id);

-- scores: one ScoreResult per session.
create table public.scores (
  session_id uuid primary key,
  parent_id uuid not null,
  scoring_method text not null,
  validated boolean not null,
  indicators jsonb not null,
  flags text[] not null,
  band text not null check (band in ('no_flag', 'follow_up_suggested', 'insufficient_data')),
  data_quality jsonb not null,
  reasons text[] not null,
  recommendations text[] not null,
  disclaimer text not null,
  created_at timestamptz not null default now(),
  foreign key (session_id, parent_id) references public.sessions (id, parent_id) on delete cascade
);

create index scores_parent_id_idx on public.scores (parent_id);

-- Least privilege on top of RLS: anon gets nothing, authenticated gets only what its policies allow.
revoke all on public.parents, public.children, public.sessions, public.trials, public.scores from anon, authenticated;
grant select on public.parents, public.children, public.sessions, public.trials, public.scores to authenticated;
grant insert (nickname, birth_year), update (nickname, birth_year), delete on public.children to authenticated;

alter table public.parents enable row level security;
alter table public.children enable row level security;
alter table public.sessions enable row level security;
alter table public.trials enable row level security;
alter table public.scores enable row level security;

create policy "parents_select_own" on public.parents
  for select to authenticated using (id = (select auth.uid()));

create policy "children_select_own" on public.children
  for select to authenticated using (parent_id = (select auth.uid()));
create policy "children_insert_own" on public.children
  for insert to authenticated with check (parent_id = (select auth.uid()));
create policy "children_update_own" on public.children
  for update to authenticated using (parent_id = (select auth.uid())) with check (parent_id = (select auth.uid()));
create policy "children_delete_own" on public.children
  for delete to authenticated using (parent_id = (select auth.uid()));

create policy "sessions_select_own" on public.sessions
  for select to authenticated using (parent_id = (select auth.uid()));

create policy "trials_select_own" on public.trials
  for select to authenticated using (parent_id = (select auth.uid()));

create policy "scores_select_own" on public.scores
  for select to authenticated using (parent_id = (select auth.uid()));
