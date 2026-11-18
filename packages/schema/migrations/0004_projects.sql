-- Projects (pmanager). Household members and invited guests.
create schema if not exists projects;

create table projects.workspaces (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references core.households(id) on delete cascade,
  name          text not null,
  cloud_policy  text not null default 'per_project' check (cloud_policy in ('per_project', 'never'))
);

create table projects.projects (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references core.households(id) on delete cascade,
  workspace_id  uuid not null references projects.workspaces(id) on delete cascade,
  parent_id     uuid references projects.projects(id) on delete cascade,
  owner_id      uuid not null references core.people(id),
  visibility    core.visibility not null default 'household',
  label         core.label not null default 'personal',
  ai_tier       text not null default 'local' check (ai_tier in ('off', 'local', 'cloud')),
  name          text not null,
  status        text not null default 'active' check (status in ('active', 'finished', 'archived')),
  deadline      date,
  hourly_rate_minor bigint check (hourly_rate_minor > 0),
  created_at    timestamptz not null default now(),
  check (parent_id is distinct from id)
);

-- Guests and collaborators per project. Guests need no household membership.
create table projects.project_members (
  project_id  uuid not null references projects.projects(id) on delete cascade,
  person_id   uuid not null references core.people(id) on delete cascade,
  role        text not null check (role in ('viewer', 'commenter', 'editor')),
  added_at    timestamptz not null default now(),
  primary key (project_id, person_id)
);

create table projects.invites (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references projects.projects(id) on delete cascade,
  email       text not null check (email = lower(email)),
  role        text not null check (role in ('viewer', 'commenter', 'editor')),
  token_hash  bytea not null unique,
  expires_at  timestamptz not null,
  accepted_at timestamptz
);

create table projects.milestones (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references projects.projects(id) on delete cascade,
  name        text not null,
  due_on      date,
  position    int not null
);

create table projects.tasks (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references projects.projects(id) on delete cascade,
  milestone_id  uuid references projects.milestones(id) on delete set null,
  parent_id     uuid references projects.tasks(id) on delete cascade,
  title         text not null check (length(title) between 1 and 500),
  status        text not null default 'todo' check (status in ('todo', 'doing', 'review', 'done')),
  assignee_id   uuid references core.people(id),
  due_on        date,
  scheduled_at  timestamptz,
  estimate_min  int check (estimate_min > 0),
  position      numeric not null,
  recurrence    text,
  completed_at  timestamptz,
  check ((status = 'done') = (completed_at is not null))
);

create table projects.dependencies (
  task_id        uuid not null references projects.tasks(id) on delete cascade,
  blocked_by_id  uuid not null references projects.tasks(id) on delete cascade,
  primary key (task_id, blocked_by_id),
  check (task_id <> blocked_by_id)
);

-- Notes are Yjs documents. Private notes are visible only to their author and never to any model.
create table projects.notes (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references projects.projects(id) on delete cascade,
  author_id   uuid not null references core.people(id),
  title       text not null,
  ydoc        bytea not null,
  is_private  boolean not null default false,
  updated_at  timestamptz not null default now()
);

create table projects.comments (
  id          uuid primary key default gen_random_uuid(),
  task_id     uuid not null references projects.tasks(id) on delete cascade,
  author_id   uuid not null references core.people(id),
  body        text not null,
  created_at  timestamptz not null default now()
);

create table projects.time_entries (
  id          uuid primary key default gen_random_uuid(),
  task_id     uuid not null references projects.tasks(id) on delete cascade,
  person_id   uuid not null references core.people(id),
  started_at  timestamptz not null,
  minutes     int not null check (minutes > 0),
  billable    boolean not null default true,
  invoiced    boolean not null default false
);

create table projects.blueprints (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references projects.projects(id) on delete cascade,
  title       text not null,
  diagram     jsonb not null
);

-- pmanager's undo model, kept as is.
create table projects.change_log (
  change_id   uuid primary key default gen_random_uuid(),
  project_id  uuid references projects.projects(id) on delete cascade,
  actor_id    uuid references core.people(id),
  summary     text not null,
  inverse     jsonb not null,
  created_at  timestamptz not null default now(),
  undone_at   timestamptz
);

-- Visibility: household rule OR an explicit project membership (guests).
create function projects.can_see_project(p uuid) returns boolean
  language sql stable security definer set search_path = projects, core, pg_temp as $$
  select exists (
    select 1 from projects.projects pr
    where pr.id = p
      and (
        core.can_see(pr.household_id, pr.owner_id, pr.visibility)
        or exists (select 1 from projects.project_members m where m.project_id = pr.id and m.person_id = core.current_person())
      )
  )
$$;

alter table projects.workspaces enable row level security;
alter table projects.projects enable row level security;
alter table projects.project_members enable row level security;
alter table projects.invites enable row level security;
alter table projects.milestones enable row level security;
alter table projects.tasks enable row level security;
alter table projects.dependencies enable row level security;
alter table projects.notes enable row level security;
alter table projects.comments enable row level security;
alter table projects.time_entries enable row level security;
alter table projects.blueprints enable row level security;
alter table projects.change_log enable row level security;

create policy workspaces_member on projects.workspaces using (core.is_member(household_id));
create policy projects_visible on projects.projects using (projects.can_see_project(id));
create policy members_visible on projects.project_members using (projects.can_see_project(project_id));
create policy invites_owner on projects.invites using (
  exists (select 1 from projects.projects p where p.id = project_id and p.owner_id = core.current_person())
);
create policy milestones_visible on projects.milestones using (projects.can_see_project(project_id));
create policy tasks_visible on projects.tasks using (projects.can_see_project(project_id));
create policy dependencies_visible on projects.dependencies using (
  exists (select 1 from projects.tasks t where t.id = task_id)
);
create policy notes_visible on projects.notes using (
  projects.can_see_project(project_id) and (not is_private or author_id = core.current_person())
);
create policy comments_visible on projects.comments using (exists (select 1 from projects.tasks t where t.id = task_id));
create policy time_visible on projects.time_entries using (exists (select 1 from projects.tasks t where t.id = task_id));
create policy blueprints_visible on projects.blueprints using (projects.can_see_project(project_id));
create policy change_log_visible on projects.change_log using (projects.can_see_project(project_id));
