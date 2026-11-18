-- Heroics core: people, households, devices, grants, audit, outbox, files.
-- Every app table carries household_id + label; row-level security does the rest.

create schema if not exists core;

create type core.label as enum ('open', 'personal', 'private', 'sealed');
create type core.household_role as enum ('owner', 'adult', 'teen');
create type core.visibility as enum ('private', 'household');
create type core.tier as enum ('device', 'box', 'cloud');

create table core.people (
  id            uuid primary key default gen_random_uuid(),
  email         text not null unique check (email = lower(email) and position('@' in email) > 1),
  display_name  text not null check (length(display_name) between 1 and 80),
  created_at    timestamptz not null default now()
);

create table core.households (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (length(name) between 1 and 80),
  currency    char(3) not null default 'CHF' check (currency ~ '^[A-Z]{3}$'),
  created_at  timestamptz not null default now()
);

create table core.household_members (
  household_id  uuid not null references core.households(id) on delete cascade,
  person_id     uuid not null references core.people(id) on delete cascade,
  role          core.household_role not null,
  joined_at     timestamptz not null default now(),
  primary key (household_id, person_id)
);

create table core.devices (
  id          uuid primary key default gen_random_uuid(),
  person_id   uuid not null references core.people(id) on delete cascade,
  name        text not null,
  platform    text not null check (platform in ('ios', 'ipados', 'macos', 'windows', 'linux', 'web')),
  public_key  bytea not null,
  created_at  timestamptz not null default now(),
  revoked_at  timestamptz
);

-- Cloud grants. Mirrors @heroics/policy: cloud can be widened up to `personal`, never further.
create table core.grants (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references core.households(id) on delete cascade,
  person_id     uuid not null references core.people(id) on delete cascade,
  scope         text not null check (scope ~ '^[a-z][a-z0-9_]*(\.[a-z0-9_]+)*(\.\*)?$'),
  max_label     core.label not null check (max_label in ('open', 'personal')),
  purpose       text not null check (length(purpose) between 1 and 200),
  created_at    timestamptz not null default now(),
  expires_at    timestamptz,
  revoked_at    timestamptz,
  check (expires_at is null or expires_at > created_at)
);

create table core.files (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references core.households(id) on delete cascade,
  owner_id      uuid not null references core.people(id),
  label         core.label not null,
  kind          text not null,
  mime          text not null,
  byte_size     bigint not null check (byte_size >= 0),
  sha256        bytea not null check (length(sha256) = 32),
  encrypted     boolean not null,
  storage_key   text not null unique,
  created_at    timestamptz not null default now(),
  -- Sealed files are encrypted on the device; the server only ever holds ciphertext.
  check (label <> 'sealed' or encrypted)
);

-- Append-only record of every action by a person, agent, automation or guest.
create table core.audit_log (
  id               bigint generated always as identity primary key,
  household_id     uuid not null references core.households(id) on delete cascade,
  actor_kind       text not null check (actor_kind in ('person', 'agent', 'automation', 'guest')),
  actor_person_id  uuid references core.people(id),
  action           text not null,
  target           text not null,
  tier             core.tier,
  label            core.label not null,
  grant_id         uuid references core.grants(id),
  change_id        uuid not null default gen_random_uuid(),
  undo             jsonb,
  created_at       timestamptz not null default now(),
  check (tier is distinct from 'cloud' or label in ('open', 'personal')),
  check (tier is distinct from 'cloud' or label = 'open' or grant_id is not null)
);

create function core.forbid_change() returns trigger language plpgsql as $$
begin
  raise exception '% is append-only', tg_table_name;
end $$;

create trigger audit_log_append_only before update or delete on core.audit_log
  for each row execute function core.forbid_change();

-- Transactional outbox: written in the same transaction as the change, published by a worker.
create table core.outbox (
  id            bigint generated always as identity primary key,
  event_id      uuid not null unique default gen_random_uuid(),
  household_id  uuid not null references core.households(id) on delete cascade,
  name          text not null check (name ~ '^[a-z_]+\.[a-z_]+$'),
  label         core.label not null,
  payload       jsonb not null,
  occurred_at   timestamptz not null default now(),
  published_at  timestamptz
);
create index outbox_unpublished on core.outbox (id) where published_at is null;

-- Session identity: the API sets `heroics.person_id` per request (set local).
create function core.current_person() returns uuid
  language sql stable as $$
  select nullif(current_setting('heroics.person_id', true), '')::uuid
$$;

create function core.role_in(h uuid) returns core.household_role
  language sql stable security definer set search_path = core, pg_temp as $$
  select role from core.household_members where household_id = h and person_id = core.current_person()
$$;

create function core.is_member(h uuid) returns boolean
  language sql stable security definer set search_path = core, pg_temp as $$
  select exists (select 1 from core.household_members where household_id = h and person_id = core.current_person())
$$;

-- The shared visibility rule for app rows.
create function core.can_see(h uuid, owner uuid, vis core.visibility) returns boolean
  language sql stable as $$
  select core.is_member(h) and (vis = 'household' or owner = core.current_person())
$$;

alter table core.households enable row level security;
alter table core.household_members enable row level security;
alter table core.grants enable row level security;
alter table core.files enable row level security;
alter table core.audit_log enable row level security;
alter table core.outbox enable row level security;
alter table core.people enable row level security;
alter table core.devices enable row level security;

create policy households_member on core.households using (core.is_member(id));
create policy members_member on core.household_members using (core.is_member(household_id));
create policy people_self_or_housemate on core.people using (
  id = core.current_person()
  or exists (
    select 1 from core.household_members m
    where m.person_id = core.people.id and core.is_member(m.household_id)
  )
);
create policy devices_own on core.devices using (person_id = core.current_person());
create policy grants_own on core.grants using (person_id = core.current_person() and core.is_member(household_id));
create policy files_visible on core.files using (
  core.is_member(household_id) and (owner_id = core.current_person() or label in ('open', 'personal'))
);
create policy audit_member_read on core.audit_log for select using (core.is_member(household_id));
create policy audit_member_insert on core.audit_log for insert with check (core.is_member(household_id));
create policy outbox_member on core.outbox using (core.is_member(household_id));
