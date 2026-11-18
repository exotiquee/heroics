-- Finance. Amounts are integers in minor units (Rappen) plus an ISO currency code.
create schema if not exists finance;

-- Teens never see finance data, even shared household data.
create function finance.can_see(h uuid, owner uuid, vis core.visibility) returns boolean
  language sql stable as $$
  select core.can_see(h, owner, vis) and core.role_in(h) <> 'teen'
$$;

create table finance.accounts (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references core.households(id) on delete cascade,
  owner_id      uuid not null references core.people(id),
  visibility    core.visibility not null default 'private',
  label         core.label not null default 'private',
  name          text not null,
  kind          text not null check (kind in ('bank', 'card', 'cash', 'pillar3a', 'investment', 'loan')),
  currency      char(3) not null check (currency ~ '^[A-Z]{3}$'),
  iban          text,
  opened_on     date,
  closed_on     date
);

create table finance.categories (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references core.households(id) on delete cascade,
  parent_id     uuid references finance.categories(id) on delete set null,
  name          text not null,
  kind          text not null check (kind in ('income', 'expense', 'transfer')),
  tax_relevant  boolean not null default false,
  unique (household_id, name)
);

create table finance.imports (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references core.households(id) on delete cascade,
  account_id    uuid not null references finance.accounts(id) on delete cascade,
  parser        text not null check (parser in ('camt053', 'camt054', 'csv', 'manual')),
  file_sha256   bytea not null check (length(file_sha256) = 32),
  row_count     int not null check (row_count >= 0),
  imported_at   timestamptz not null default now(),
  unique (household_id, file_sha256)
);

create table finance.transactions (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references core.households(id) on delete cascade,
  owner_id      uuid not null references core.people(id),
  visibility    core.visibility not null default 'private',
  label         core.label not null default 'private',
  account_id    uuid not null references finance.accounts(id) on delete cascade,
  import_id     uuid references finance.imports(id) on delete set null,
  booked_on     date not null,
  amount_minor  bigint not null check (amount_minor <> 0),
  currency      char(3) not null check (currency ~ '^[A-Z]{3}$'),
  counterparty  text,
  reference     text,
  memo          text,
  category_id   uuid references finance.categories(id) on delete set null,
  category_confidence numeric(3,2) check (category_confidence between 0 and 1),
  needs_review  boolean not null default false,
  transfer_pair uuid references finance.transactions(id),
  created_at    timestamptz not null default now()
);
create index transactions_booked on finance.transactions (household_id, booked_on desc);
-- Bank imports never create the same booking twice.
create unique index transactions_dedupe on finance.transactions (account_id, booked_on, amount_minor, reference)
  where reference is not null;

create table finance.splits (
  id              uuid primary key default gen_random_uuid(),
  transaction_id  uuid not null references finance.transactions(id) on delete cascade,
  category_id     uuid not null references finance.categories(id),
  amount_minor    bigint not null check (amount_minor <> 0),
  project_ref     text
);

create table finance.rules (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references core.households(id) on delete cascade,
  match_field   text not null check (match_field in ('counterparty', 'reference', 'memo')),
  pattern       text not null,
  category_id   uuid not null references finance.categories(id) on delete cascade,
  priority      int not null default 100,
  created_from  text not null default 'manual' check (created_from in ('manual', 'correction'))
);

create table finance.budgets (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references core.households(id) on delete cascade,
  owner_id      uuid not null references core.people(id),
  visibility    core.visibility not null default 'household',
  category_id   uuid not null references finance.categories(id) on delete cascade,
  month         date not null check (extract(day from month) = 1),
  limit_minor   bigint not null check (limit_minor > 0),
  unique (household_id, category_id, month)
);

create table finance.goals (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references core.households(id) on delete cascade,
  owner_id      uuid not null references core.people(id),
  visibility    core.visibility not null default 'household',
  name          text not null,
  target_minor  bigint not null check (target_minor > 0),
  saved_minor   bigint not null default 0 check (saved_minor >= 0),
  due_on        date
);

create table finance.recurring_series (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references core.households(id) on delete cascade,
  owner_id      uuid not null references core.people(id),
  visibility    core.visibility not null default 'private',
  name          text not null,
  cadence       text not null check (cadence in ('weekly', 'monthly', 'quarterly', 'yearly')),
  amount_minor  bigint not null,
  next_due_on   date not null,
  last_used_on  date,
  category_id   uuid references finance.categories(id) on delete set null
);

create table finance.documents (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references core.households(id) on delete cascade,
  owner_id      uuid not null references core.people(id),
  visibility    core.visibility not null default 'private',
  label         core.label not null default 'sealed' check (label = 'sealed'),
  file_id       uuid not null references core.files(id),
  kind          text not null check (kind in ('receipt', 'qr_bill', 'salary_certificate', 'pillar3a_statement', 'bank_statement', 'insurance', 'contract', 'warranty', 'invoice', 'other')),
  tax_year      int check (tax_year between 2000 and 2100),
  expires_on    date
);

create table finance.doc_links (
  document_id     uuid not null references finance.documents(id) on delete cascade,
  transaction_id  uuid not null references finance.transactions(id) on delete cascade,
  primary key (document_id, transaction_id)
);

create table finance.tax_items (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references core.households(id) on delete cascade,
  owner_id      uuid not null references core.people(id),
  visibility    core.visibility not null default 'private',
  tax_year      int not null check (tax_year between 2000 and 2100),
  section       text not null,
  title         text not null,
  status        text not null default 'missing' check (status in ('missing', 'partial', 'complete', 'not_applicable')),
  evidence      jsonb not null default '[]'
);

do $$
declare t text;
begin
  foreach t in array array['accounts','transactions','budgets','goals','recurring_series','documents','tax_items'] loop
    execute format('alter table finance.%I enable row level security', t);
    execute format('create policy %I on finance.%I using (finance.can_see(household_id, owner_id, visibility))', t || '_visible', t);
  end loop;
  foreach t in array array['categories','imports','rules'] loop
    execute format('alter table finance.%I enable row level security', t);
    execute format('create policy %I on finance.%I using (core.is_member(household_id) and core.role_in(household_id) <> ''teen'')', t || '_member', t);
  end loop;
end $$;

alter table finance.splits enable row level security;
alter table finance.doc_links enable row level security;
create policy splits_parent on finance.splits using (exists (select 1 from finance.transactions t where t.id = transaction_id));
create policy doc_links_parent on finance.doc_links using (
  exists (select 1 from finance.transactions t where t.id = transaction_id)
  and exists (select 1 from finance.documents d where d.id = document_id)
);
