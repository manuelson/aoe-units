-- Reconciliation + the admin unit editor.
--
-- Everything down to the `stat_maxima` view already exists in production: it was applied
-- by hand between 0004 and today, so the repo could not rebuild the database. This file
-- declares it, guarded so a re-run is a no-op. Only the last two blocks are new work.

-- ---------------------------------------------------------------- counter FK names
-- lib/queries.ts embeds `counter!counter_target_fkey`, so the constraint name is part of
-- the API. 0001 creates them unnamed, which Postgres would call counter_line_id_fkey.
do $$ begin
  if exists (
    select 1 from pg_constraint
    where conname = 'counter_line_id_fkey' and conrelid = 'counter'::regclass
  ) then
    alter table counter rename constraint counter_line_id_fkey to counter_target_fkey;
  end if;

  if exists (
    select 1 from pg_constraint
    where conname = 'counter_counter_line_id_fkey' and conrelid = 'counter'::regclass
  ) then
    alter table counter rename constraint counter_counter_line_id_fkey to counter_source_fkey;
  end if;
end $$;

-- ------------------------------------------------------------------- feedback is not
-- anon-writable any more: every write goes through the service role in /api/feedback.
drop policy if exists feedback_insert on counter_vote;
drop policy if exists feedback_insert on counter_suggestion;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'counter_vote_today') then
    alter table counter_vote
      add constraint counter_vote_today check (voted_on <= current_date);
  end if;
end $$;

-- --------------------------------------------------------- the three feedback tables
create table if not exists stat_suggestion (
  id          bigint generated always as identity primary key,
  unit_id     text not null references unit(id) on delete cascade,
  stats       jsonb not null,
  comment     text,
  status      text not null default 'pending',
  ip_hash     text not null,
  created_at  timestamptz not null default now(),
  reviewed_at timestamptz,
  constraint stat_suggestion_not_empty check (jsonb_typeof(stats) = 'object' and stats <> '{}'::jsonb),
  constraint stat_suggestion_comment_len check (comment is null or length(comment) <= 500),
  constraint stat_suggestion_status_valid check (status in ('pending', 'approved', 'rejected'))
);

create table if not exists unit_suggestion (
  id              bigint generated always as identity primary key,
  name            text not null,
  civ_id          text references civilization(id),
  unit_class      text not null default 'Other',
  is_unique       boolean not null default false,
  stats           jsonb,
  counters        text[] not null default '{}',
  comment         text,
  status          text not null default 'pending',
  ip_hash         text not null,
  created_at      timestamptz not null default now(),
  reviewed_at     timestamptz,
  -- set null, not cascade: approving a suggestion should not make deleting the line it
  -- created impossible, but the audit trail of "someone suggested this" is worth keeping.
  created_line_id text references unit_line(id) on delete set null,
  constraint unit_suggestion_name_len check (length(name) >= 2 and length(name) <= 60),
  constraint unit_suggestion_counters_len check (array_length(counters, 1) is null or array_length(counters, 1) <= 30),
  constraint unit_suggestion_comment_len check (comment is null or length(comment) <= 500),
  constraint unit_suggestion_status_valid check (status in ('pending', 'approved', 'rejected'))
);

create table if not exists site_report (
  id          bigint generated always as identity primary key,
  message     text not null,
  page        text,
  locale      text,
  status      text not null default 'pending',
  ip_hash     text not null,
  created_at  timestamptz not null default now(),
  reviewed_at timestamptz,
  constraint site_report_message_len check (length(message) >= 3 and length(message) <= 2000),
  constraint site_report_page_len check (page is null or length(page) <= 200),
  constraint site_report_status_valid check (status in ('pending', 'approved', 'rejected'))
);

create index if not exists stat_suggestion_pending_idx on stat_suggestion (status, created_at desc);
create index if not exists unit_suggestion_pending_idx on unit_suggestion (status, created_at desc);
create index if not exists site_report_pending_idx     on site_report     (status, created_at desc);

alter table stat_suggestion enable row level security;
alter table unit_suggestion enable row level security;
alter table site_report     enable row level security;
-- No policies on purpose: RLS with zero policies denies anon entirely. Everything here is
-- read and written by the service role.

-- `create table if not exists` will not fix a table that already exists with the wrong
-- rule, and a cascading created_line_id would block deleting any line ever approved.
do $$ begin
  if exists (
    select 1 from pg_constraint
    where conname = 'unit_suggestion_created_line_id_fkey' and confdeltype <> 'n'
  ) then
    alter table unit_suggestion drop constraint unit_suggestion_created_line_id_fkey;
    alter table unit_suggestion add constraint unit_suggestion_created_line_id_fkey
      foreign key (created_line_id) references unit_line(id) on delete set null;
  end if;
end $$;

-- ------------------------------------------------------------------------ stat_maxima
-- Feeds the meters on every unit page. Owned by postgres and without security_invoker on
-- purpose: that is what lets the anon client read it while `unit` has RLS on.
-- The pierceArmor filter drops rams, whose armour is a damage-immunity hack in the game
-- data and would flatten every other bar on the page.
create or replace view stat_maxima as
  select
    max((stats ->> 'hp')::numeric)          as hp,
    max((stats ->> 'attack')::numeric)      as attack,
    max((stats ->> 'meleeArmor')::numeric)  as "meleeArmor",
    max((stats ->> 'pierceArmor')::numeric) as "pierceArmor",
    max((stats ->> 'range')::numeric)       as range,
    max((stats ->> 'speed')::numeric)       as speed
  from unit
  where stats is not null
    and coalesce((stats ->> 'pierceArmor')::numeric, 0) < 100;

-- =========================================================== new: the editor's backing
-- Two tiers sharing a number made toSummary() pick the line's name at random. Verified
-- zero duplicates before adding this.
create unique index if not exists unit_line_tier_uniq on unit (line_id, tier);

-- Saving a line touches unit_line, unit, unit_name and counter. Over PostgREST that is a
-- dozen separate commits with no way back: the insert-then-delete rollback in
-- /api/admin works only because undoing an insert is a delete. There is no compensating
-- action for a half-applied edit, so the whole thing runs as one statement here.
--
-- Validation stays in TypeScript (app/api/admin/unit/route.ts). This function assumes an
-- already-checked document and leans on the constraints as a last line of defence.
create or replace function admin_save_line(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  l_id     text := payload ->> 'id';
  tier_ids text[];
  before   text[];
  after    text[];
  t        jsonb;
begin
  perform 1 from unit_line where id = l_id for update;
  if not found then
    raise exception 'unknown line %', l_id using errcode = 'P0002';
  end if;

  -- The id is never updated: seven foreign keys point at it and none cascades on update.
  update unit_line
     set civ_id     = nullif(payload ->> 'civ', ''),
         unit_class = payload ->> 'unitClass',
         is_unique  = (payload ->> 'isUnique')::boolean
   where id = l_id;

  select array_agg(value ->> 'id') into tier_ids
    from jsonb_array_elements(payload -> 'tiers');

  -- Without this an upsert would quietly steal a tier that belongs to another line.
  if exists (
    select 1 from unit where id = any(tier_ids) and line_id <> l_id
  ) then
    raise exception 'tier id already belongs to another line' using errcode = '23505';
  end if;

  delete from unit where line_id = l_id and not (id = any(tier_ids));

  for t in select * from jsonb_array_elements(payload -> 'tiers') loop
    insert into unit (id, line_id, tier, data_id, stats)
    values (
      t ->> 'id',
      l_id,
      (t ->> 'tier')::int,
      nullif(t ->> 'dataId', '')::int,
      case when t -> 'stats' = 'null'::jsonb then null else t -> 'stats' end
    )
    on conflict (id) do update
      set line_id = excluded.line_id,
          tier    = excluded.tier,
          data_id = excluded.data_id,
          stats   = excluded.stats;

    insert into unit_name (unit_id, locale, name)
    values (t ->> 'id', 'en', t ->> 'nameEn'),
           (t ->> 'id', 'es', t ->> 'nameEs')
    on conflict (unit_id, locale) do update set name = excluded.name;
  end loop;

  -- Which neighbours the page cache has to drop: the ones losing an edge count too.
  select coalesce(array_agg(counter_line_id), '{}') into before
    from counter where line_id = l_id;
  select coalesce(array_agg(line_id), '{}') || before into before
    from counter where counter_line_id = l_id;

  -- Diffed, not wiped and re-inserted: a delete-all would reset created_at and relabel
  -- 900-odd 'seed' edges as 'community' the first time anyone touched a line.
  delete from counter
   where line_id = l_id
     and counter_line_id not in (
       select value ->> 'lineId' from jsonb_array_elements(payload -> 'counteredBy')
     );

  delete from counter
   where counter_line_id = l_id
     and line_id not in (
       select value ->> 'lineId' from jsonb_array_elements(payload -> 'strongAgainst')
     );

  insert into counter (line_id, counter_line_id, source, reason_en, reason_es)
  select l_id, value ->> 'lineId', 'community', value ->> 'reasonEn', value ->> 'reasonEs'
    from jsonb_array_elements(payload -> 'counteredBy')
  on conflict (line_id, counter_line_id) do update
    set reason_en = excluded.reason_en,
        reason_es = excluded.reason_es;

  insert into counter (line_id, counter_line_id, source, reason_en, reason_es)
  select value ->> 'lineId', l_id, 'community', value ->> 'reasonEn', value ->> 'reasonEs'
    from jsonb_array_elements(payload -> 'strongAgainst')
  on conflict (line_id, counter_line_id) do update
    set reason_en = excluded.reason_en,
        reason_es = excluded.reason_es;

  select coalesce(array_agg(counter_line_id), '{}') into after
    from counter where line_id = l_id;
  select coalesce(array_agg(line_id), '{}') || after into after
    from counter where counter_line_id = l_id;

  return jsonb_build_object(
    'id', l_id,
    'touched', to_jsonb(array(select distinct unnest(before || after)))
  );
end $$;

-- The anon key is public. Without this, anyone could call the function and rewrite the
-- catalog; it is the single most important line in this file.
revoke all on function admin_save_line(jsonb) from public, anon, authenticated;
grant execute on function admin_save_line(jsonb) to service_role;
