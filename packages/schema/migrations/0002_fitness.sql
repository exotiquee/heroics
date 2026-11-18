-- Fitness (thraccer). Owned by the fitness app; other apps use its MCP tools or events.
create schema if not exists fitness;

-- Exercises: household_id null = the shared open catalog.
create table fitness.exercises (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid references core.households(id) on delete cascade,
  name          text not null,
  muscle        text not null,
  equipment     text,
  label         core.label not null default 'open'
);

create table fitness.routines (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references core.households(id) on delete cascade,
  owner_id      uuid not null references core.people(id),
  visibility    core.visibility not null default 'private',
  label         core.label not null default 'private',
  name          text not null,
  created_at    timestamptz not null default now()
);

create table fitness.routine_items (
  id           uuid primary key default gen_random_uuid(),
  routine_id   uuid not null references fitness.routines(id) on delete cascade,
  exercise_id  uuid not null references fitness.exercises(id),
  position     int not null,
  target_sets  int not null check (target_sets between 1 and 20),
  rep_min      int not null check (rep_min > 0),
  rep_max      int not null check (rep_max >= rep_min),
  target_rir   numeric(3,1) check (target_rir between 0 and 10),
  unique (routine_id, position)
);

create table fitness.progression_rules (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references core.households(id) on delete cascade,
  owner_id      uuid not null references core.people(id),
  exercise_id   uuid not null references fitness.exercises(id),
  kind          text not null check (kind in ('double_progression', 'rpe_target', 'percent_e1rm')),
  params        jsonb not null,
  unique (owner_id, exercise_id)
);

create table fitness.sessions (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references core.households(id) on delete cascade,
  owner_id      uuid not null references core.people(id),
  visibility    core.visibility not null default 'private',
  label         core.label not null default 'private',
  routine_id    uuid references fitness.routines(id) on delete set null,
  started_at    timestamptz not null,
  ended_at      timestamptz,
  readiness     int check (readiness between 0 and 100),
  check (ended_at is null or ended_at >= started_at)
);

-- Append-only in practice: sets are inserts, so concurrent devices never conflict.
create table fitness.sets (
  id           uuid primary key default gen_random_uuid(),
  session_id   uuid not null references fitness.sessions(id) on delete cascade,
  exercise_id  uuid not null references fitness.exercises(id),
  position     int not null,
  weight_kg    numeric(6,2) not null check (weight_kg >= 0),
  reps         int not null check (reps between 0 and 200),
  rpe          numeric(3,1) check (rpe between 1 and 10),
  rir          numeric(3,1) check (rir between 0 and 10),
  is_warmup    boolean not null default false,
  logged_at    timestamptz not null default now()
);

create table fitness.foods (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid references core.households(id) on delete cascade,
  name          text not null,
  barcode       text,
  kcal_100g     numeric(6,1) not null check (kcal_100g >= 0),
  protein_100g  numeric(5,1) not null check (protein_100g >= 0),
  carbs_100g    numeric(5,1) not null check (carbs_100g >= 0),
  fat_100g      numeric(5,1) not null check (fat_100g >= 0),
  label         core.label not null default 'open'
);

create table fitness.food_entries (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references core.households(id) on delete cascade,
  owner_id      uuid not null references core.people(id),
  visibility    core.visibility not null default 'private',
  label         core.label not null default 'private',
  food_id       uuid not null references fitness.foods(id),
  grams         numeric(7,1) not null check (grams > 0),
  meal          text not null check (meal in ('breakfast', 'lunch', 'dinner', 'snack')),
  eaten_at      timestamptz not null
);

create table fitness.body_metrics (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references core.households(id) on delete cascade,
  owner_id      uuid not null references core.people(id),
  visibility    core.visibility not null default 'private',
  label         core.label not null default 'private',
  measured_on   date not null,
  weight_kg     numeric(5,2) check (weight_kg > 0),
  waist_cm      numeric(5,1) check (waist_cm > 0),
  body_fat_pct  numeric(4,1) check (body_fat_pct between 2 and 70)
);

-- Progress photos are always sealed, always private.
create table fitness.photos (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references core.households(id) on delete cascade,
  owner_id      uuid not null references core.people(id),
  visibility    core.visibility not null default 'private' check (visibility = 'private'),
  label         core.label not null default 'sealed' check (label = 'sealed'),
  file_id       uuid not null references core.files(id),
  pose          text not null check (pose in ('front', 'side', 'back')),
  taken_on      date not null
);

create table fitness.readiness_daily (
  household_id  uuid not null references core.households(id) on delete cascade,
  owner_id      uuid not null references core.people(id),
  visibility    core.visibility not null default 'private',
  label         core.label not null default 'private',
  day           date not null,
  score         int not null check (score between 0 and 100),
  sleep_min     int,
  hrv_ms        int,
  resting_hr    int,
  primary key (owner_id, day)
);

-- Protocol and labs: sealed by default, excluded from every model unless granted per panel.
create table fitness.protocol_items (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references core.households(id) on delete cascade,
  owner_id      uuid not null references core.people(id),
  visibility    core.visibility not null default 'private',
  label         core.label not null default 'sealed',
  name          text not null,
  kind          text not null check (kind in ('supplement', 'medication', 'compound')),
  schedule      jsonb not null
);

create table fitness.doses (
  id                uuid primary key default gen_random_uuid(),
  protocol_item_id  uuid not null references fitness.protocol_items(id) on delete cascade,
  taken_at          timestamptz not null,
  amount            numeric(10,3) not null,
  unit              text not null,
  site              text
);

create table fitness.lab_panels (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references core.households(id) on delete cascade,
  owner_id      uuid not null references core.people(id),
  visibility    core.visibility not null default 'private',
  label         core.label not null default 'sealed',
  drawn_on      date not null,
  lab_name      text
);

create table fitness.lab_results (
  id          uuid primary key default gen_random_uuid(),
  panel_id    uuid not null references fitness.lab_panels(id) on delete cascade,
  marker      text not null,
  value       numeric not null,
  unit        text not null,
  ref_low     numeric,
  ref_high    numeric
);

-- RLS: owned rows follow core.can_see; child rows follow their parent.
do $$
declare t text;
begin
  foreach t in array array['routines','progression_rules','sessions','food_entries','body_metrics','photos','readiness_daily','protocol_items','lab_panels'] loop
    execute format('alter table fitness.%I enable row level security', t);
  end loop;
end $$;

create policy routines_visible on fitness.routines using (core.can_see(household_id, owner_id, visibility));
create policy rules_own on fitness.progression_rules using (core.is_member(household_id) and owner_id = core.current_person());
create policy sessions_visible on fitness.sessions using (core.can_see(household_id, owner_id, visibility));
create policy food_entries_visible on fitness.food_entries using (core.can_see(household_id, owner_id, visibility));
create policy body_metrics_visible on fitness.body_metrics using (core.can_see(household_id, owner_id, visibility));
create policy photos_own on fitness.photos using (core.is_member(household_id) and owner_id = core.current_person());
create policy readiness_visible on fitness.readiness_daily using (core.can_see(household_id, owner_id, visibility));
create policy protocol_own on fitness.protocol_items using (core.is_member(household_id) and owner_id = core.current_person());
create policy labs_own on fitness.lab_panels using (core.is_member(household_id) and owner_id = core.current_person());

alter table fitness.exercises enable row level security;
alter table fitness.foods enable row level security;
create policy exercises_catalog on fitness.exercises using (household_id is null or core.is_member(household_id));
create policy foods_catalog on fitness.foods using (household_id is null or core.is_member(household_id));

alter table fitness.routine_items enable row level security;
alter table fitness.sets enable row level security;
alter table fitness.doses enable row level security;
alter table fitness.lab_results enable row level security;
create policy routine_items_parent on fitness.routine_items using (exists (select 1 from fitness.routines r where r.id = routine_id));
create policy sets_parent on fitness.sets using (exists (select 1 from fitness.sessions s where s.id = session_id));
create policy doses_parent on fitness.doses using (exists (select 1 from fitness.protocol_items p where p.id = protocol_item_id));
create policy lab_results_parent on fitness.lab_results using (exists (select 1 from fitness.lab_panels p where p.id = panel_id));
