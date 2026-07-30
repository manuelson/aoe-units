-- Catalog: read-only for the public, seeded from lib/db/*.ts via scripts/gen-seed.ts

create table civilization (
  id   text primary key,
  name text not null
);

create table unit_line (
  id         text primary key,
  civ_id     text references civilization(id),
  is_unique  boolean not null default false,
  unit_class text not null default 'Other',
  sort_order integer not null default 0
);

create table unit (
  id      text primary key,
  line_id text not null references unit_line(id) on delete cascade,
  tier    integer not null,
  data_id integer,
  stats   jsonb
);

create table unit_name (
  unit_id text not null references unit(id) on delete cascade,
  locale  text not null,
  name    text not null,
  primary key (unit_id, locale)
);

-- (line_id, counter_line_id) reads as "counter_line_id counters line_id".
-- The inverse view ("what does X counter") is a lookup on counter_line_id.
create table counter (
  line_id         text not null references unit_line(id) on delete cascade,
  counter_line_id text not null references unit_line(id) on delete cascade,
  source          text not null default 'seed',
  created_at      timestamptz not null default now(),
  primary key (line_id, counter_line_id),
  constraint counter_not_self check (line_id <> counter_line_id),
  constraint counter_source_valid check (source in ('seed', 'community'))
);

create index unit_line_id_idx on unit (line_id);
create index unit_name_locale_idx on unit_name (locale);
create index counter_reverse_idx on counter (counter_line_id);
create index unit_line_class_idx on unit_line (unit_class);

-- Community feedback -----------------------------------------------------

create table counter_vote (
  id          bigint generated always as identity primary key,
  line_id     text not null references unit_line(id) on delete cascade,
  is_accurate boolean not null,
  locale      text,
  ip_hash     text not null,
  voted_on    date not null default current_date,
  created_at  timestamptz not null default now(),
  -- The rate limit IS this constraint: one vote per unit, per client, per day.
  unique (line_id, ip_hash, voted_on)
);

create table counter_suggestion (
  id                bigint generated always as identity primary key,
  line_id           text not null references unit_line(id) on delete cascade,
  suggested_line_id text references unit_line(id) on delete cascade,
  free_text         text,
  action            text not null default 'add',
  comment           text,
  status            text not null default 'pending',
  ip_hash           text not null,
  created_at        timestamptz not null default now(),
  reviewed_at       timestamptz,
  constraint suggestion_action_valid check (action in ('add', 'remove')),
  constraint suggestion_status_valid check (status in ('pending', 'approved', 'rejected')),
  -- Must name a target somehow, and free text is bounded so the column can't be abused as storage.
  constraint suggestion_has_target check (suggested_line_id is not null or free_text is not null),
  constraint suggestion_free_text_len check (free_text is null or length(free_text) <= 80),
  constraint suggestion_comment_len check (comment is null or length(comment) <= 500)
);

create index counter_suggestion_pending_idx on counter_suggestion (status, created_at desc);
create index counter_vote_line_idx on counter_vote (line_id);

-- RLS --------------------------------------------------------------------

alter table civilization       enable row level security;
alter table unit_line          enable row level security;
alter table unit               enable row level security;
alter table unit_name          enable row level security;
alter table counter            enable row level security;
alter table counter_vote       enable row level security;
alter table counter_suggestion enable row level security;

-- Catalog is world-readable. No write policy exists, so anon cannot write it.
create policy catalog_read on civilization for select to anon, authenticated using (true);
create policy catalog_read on unit_line    for select to anon, authenticated using (true);
create policy catalog_read on unit         for select to anon, authenticated using (true);
create policy catalog_read on unit_name    for select to anon, authenticated using (true);
create policy catalog_read on counter      for select to anon, authenticated using (true);

-- Feedback is write-only for the public: anyone can submit, nobody can read back.
-- Reading ip_hash / pending suggestions requires the service role, which bypasses RLS.
create policy feedback_insert on counter_vote       for insert to anon, authenticated with check (true);
create policy feedback_insert on counter_suggestion for insert to anon, authenticated with check (true);
