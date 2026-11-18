-- Row-level security and constraint tests. Runs after all migrations.
-- People: Anna (owner), Ben (adult), Tim (teen) share a household; Gina is an outside guest;
-- Xavier lives in another household.

\set anna   '''a0000000-0000-4000-8000-000000000001'''
\set ben    '''a0000000-0000-4000-8000-000000000002'''
\set tim    '''a0000000-0000-4000-8000-000000000003'''
\set gina   '''a0000000-0000-4000-8000-000000000004'''
\set xavier '''a0000000-0000-4000-8000-000000000005'''

-- ---------- seed (as owner, RLS bypassed) ----------
insert into core.people (id, email, display_name) values
  (:anna, 'anna@example.ch', 'Anna'), (:ben, 'ben@example.ch', 'Ben'), (:tim, 'tim@example.ch', 'Tim'),
  (:gina, 'gina@client.ch', 'Gina'), (:xavier, 'xavier@example.ch', 'Xavier');

insert into core.households (id, name) values
  ('b0000000-0000-4000-8000-000000000001', 'Muster'),
  ('b0000000-0000-4000-8000-000000000002', 'Other');

insert into core.household_members (household_id, person_id, role) values
  ('b0000000-0000-4000-8000-000000000001', :anna, 'owner'),
  ('b0000000-0000-4000-8000-000000000001', :ben, 'adult'),
  ('b0000000-0000-4000-8000-000000000001', :tim, 'teen'),
  ('b0000000-0000-4000-8000-000000000002', :xavier, 'owner');

insert into finance.accounts (id, household_id, owner_id, visibility, name, kind, currency) values
  ('c0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', :anna, 'private', 'Anna private', 'bank', 'CHF'),
  ('c0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000001', :anna, 'household', 'Joint', 'bank', 'CHF');

insert into finance.transactions (household_id, owner_id, visibility, account_id, booked_on, amount_minor, currency, counterparty, reference) values
  ('b0000000-0000-4000-8000-000000000001', :anna, 'private', 'c0000000-0000-4000-8000-000000000001', '2026-11-03', -4590, 'CHF', 'Bookshop', 'r1'),
  ('b0000000-0000-4000-8000-000000000001', :anna, 'household', 'c0000000-0000-4000-8000-000000000002', '2026-11-04', -18240, 'CHF', 'Migros', 'r2');

insert into core.files (id, household_id, owner_id, label, kind, mime, byte_size, sha256, encrypted, storage_key) values
  ('d0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', :anna, 'sealed', 'photo', 'image/jpeg', 1024, decode(repeat('ab', 32), 'hex'), true, 'k1');

insert into fitness.photos (household_id, owner_id, file_id, pose, taken_on) values
  ('b0000000-0000-4000-8000-000000000001', :anna, 'd0000000-0000-4000-8000-000000000001', 'front', '2026-11-12');

insert into projects.workspaces (id, household_id, name) values
  ('e0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'Home'),
  ('e0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000001', 'Work');

insert into projects.projects (id, household_id, workspace_id, owner_id, visibility, name) values
  ('f0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000001', :anna, 'household', 'Move house'),
  ('f0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000002', :anna, 'private', 'Client rollout'),
  ('f0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000001', :anna, 'private', 'Birthday surprise');

insert into projects.project_members (project_id, person_id, role) values
  ('f0000000-0000-4000-8000-000000000002', :gina, 'commenter');

insert into projects.tasks (project_id, title, position) values
  ('f0000000-0000-4000-8000-000000000001', 'Book movers', 1),
  ('f0000000-0000-4000-8000-000000000002', 'Kickoff call', 1),
  ('f0000000-0000-4000-8000-000000000003', 'Order cake', 1);

insert into projects.notes (project_id, author_id, title, ydoc, is_private) values
  ('f0000000-0000-4000-8000-000000000001', :anna, 'Shared checklist', '\x00', false),
  ('f0000000-0000-4000-8000-000000000001', :anna, 'Budget worries', '\x00', true);

-- ---------- app role: RLS applies ----------
create role heroics_app nologin;
grant usage on schema core, fitness, finance, projects to heroics_app;
grant select, insert, update, delete on all tables in schema core, fitness, finance, projects to heroics_app;
set role heroics_app;

-- Anna
select set_config('heroics.person_id', :anna, false) \g /dev/null
do $$ begin
  assert (select count(*) from finance.transactions) = 2, 'Anna sees both her transactions';
  assert (select count(*) from fitness.photos) = 1, 'Anna sees her own photo';
  assert (select count(*) from projects.projects) = 3, 'Anna sees all her projects';
  assert (select count(*) from projects.notes) = 2, 'Anna sees her private note';
end $$;

-- Ben (adult housemate)
select set_config('heroics.person_id', :ben, false) \g /dev/null
do $$ begin
  assert (select count(*) from finance.transactions) = 1, 'Ben sees only the household transaction';
  assert (select counterparty from finance.transactions) = 'Migros', 'Ben sees the joint booking';
  assert (select count(*) from fitness.photos) = 0, 'Ben never sees Anna''s photos';
  assert (select count(*) from projects.projects) = 1, 'Ben sees only the household project';
  assert (select count(*) from projects.tasks) = 1, 'Ben sees only household tasks';
  assert (select count(*) from projects.notes) = 1, 'Ben does not see Anna''s private note';
  assert (select count(*) from core.people) = 3, 'Ben sees his housemates only';
end $$;

-- Tim (teen)
select set_config('heroics.person_id', :tim, false) \g /dev/null
do $$ begin
  assert (select count(*) from finance.transactions) = 0, 'Teens see no finance data';
  assert (select count(*) from finance.accounts) = 0, 'Teens see no accounts';
  assert (select count(*) from projects.projects) = 1, 'Teens see household projects';
end $$;

-- Gina (outside guest on one project)
select set_config('heroics.person_id', :gina, false) \g /dev/null
do $$ begin
  assert (select count(*) from projects.projects) = 1, 'Guest sees exactly the invited project';
  assert (select name from projects.projects) = 'Client rollout', 'Guest sees the client project';
  assert (select count(*) from projects.tasks) = 1, 'Guest sees only that project''s tasks';
  assert (select count(*) from finance.transactions) = 0, 'Guest sees no finance data';
  assert (select count(*) from core.households) = 0, 'Guest is not a household member';
end $$;

-- Xavier (other household)
select set_config('heroics.person_id', :xavier, false) \g /dev/null
do $$ begin
  assert (select count(*) from finance.transactions) = 0, 'Other households see nothing';
  assert (select count(*) from projects.projects) = 0, 'Other households see no projects';
end $$;

-- Nobody signed in
select set_config('heroics.person_id', '', false) \g /dev/null
do $$ begin
  assert (select count(*) from finance.transactions) = 0, 'Anonymous sees nothing';
end $$;

reset role;

-- ---------- constraints ----------
do $$ begin
  insert into core.files (household_id, owner_id, label, kind, mime, byte_size, sha256, encrypted, storage_key)
  values ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'sealed', 'photo', 'image/jpeg', 1, decode(repeat('cd', 32), 'hex'), false, 'k2');
  raise exception 'unencrypted sealed file was accepted';
exception when check_violation then null; end $$;

do $$ begin
  insert into core.grants (household_id, person_id, scope, max_label, purpose)
  values ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'finance.*', 'private', 'x');
  raise exception 'grant above personal was accepted';
exception when check_violation then null; end $$;

do $$ begin
  insert into core.grants (household_id, person_id, scope, max_label, purpose)
  values ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', '*', 'personal', 'x');
  raise exception 'global grant was accepted';
exception when check_violation then null; end $$;

do $$ begin
  insert into core.audit_log (household_id, actor_kind, action, target, tier, label)
  values ('b0000000-0000-4000-8000-000000000001', 'agent', 'read', 'finance.transactions', 'cloud', 'private');
  raise exception 'cloud call on private data was logged as allowed';
exception when check_violation then null; end $$;

do $$ begin
  insert into core.audit_log (household_id, actor_kind, action, target, tier, label)
  values ('b0000000-0000-4000-8000-000000000001', 'agent', 'read', 'finance.monthly_totals', 'cloud', 'personal');
  raise exception 'cloud call on personal data without a grant was accepted';
exception when check_violation then null; end $$;

insert into core.audit_log (household_id, actor_kind, action, target, tier, label)
values ('b0000000-0000-4000-8000-000000000001', 'agent', 'read', 'fitness.exercises', 'cloud', 'open');

do $$ begin
  update core.audit_log set action = 'tampered';
  raise exception 'audit log was editable';
exception when raise_exception then
  if sqlerrm not like '%append-only%' then raise; end if;
end $$;

do $$ begin
  insert into fitness.photos (household_id, owner_id, label, file_id, pose, taken_on)
  values ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'personal', 'd0000000-0000-4000-8000-000000000001', 'side', '2026-11-12');
  raise exception 'photo with a non-sealed label was accepted';
exception when check_violation then null; end $$;

do $$ begin
  insert into projects.tasks (project_id, title, position, status)
  values ('f0000000-0000-4000-8000-000000000001', 'Done without a date', 2, 'done');
  raise exception 'done task without completed_at was accepted';
exception when check_violation then null; end $$;

do $$ begin
  insert into finance.transactions (household_id, owner_id, account_id, booked_on, amount_minor, currency, reference)
  values ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000002', '2026-11-04', -18240, 'CHF', 'r2');
  raise exception 'duplicate bank booking was accepted';
exception when unique_violation then null; end $$;
