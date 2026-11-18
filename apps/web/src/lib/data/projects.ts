import type { AiTier, TaskStatus } from '@heroics/schema';

export interface Person {
	id: string;
	name: string;
	initials: string;
	hue: string;
	guest?: boolean;
}

export const people: Person[] = [
	{ id: 'me', name: 'You', initials: 'YO', hue: 'var(--iris)' },
	{ id: 'lea', name: 'Lea', initials: 'LE', hue: 'var(--jade)' },
	{ id: 'marco', name: 'Marco (Alpine Dental)', initials: 'MA', hue: 'var(--ember)', guest: true }
];

export interface ProjectRow {
	id: string;
	name: string;
	workspace: 'Home' | 'Work' | 'Heroics';
	aiTier: AiTier;
	due: string | null;
	open: number;
	done: number;
	guests: number;
	risk?: string;
}

export const projects: ProjectRow[] = [
	{ id: 'heroics', name: 'Heroics suite', workspace: 'Heroics', aiTier: 'cloud', due: '2027-03-31', open: 9, done: 4, guests: 0 },
	{ id: 'alpine', name: 'Alpine Dental rollout', workspace: 'Work', aiTier: 'local', due: '2026-12-12', open: 6, done: 11, guests: 1, risk: 'Data migration is 4 days behind the milestone' },
	{ id: 'move', name: 'Move to Winterthur', workspace: 'Home', aiTier: 'local', due: '2027-02-28', open: 12, done: 3, guests: 0 },
	{ id: 'lisbon', name: 'Lisbon in March', workspace: 'Home', aiTier: 'off', due: '2027-03-14', open: 5, done: 1, guests: 0 }
];

export interface Card {
	id: string;
	title: string;
	status: TaskStatus;
	assignee: string;
	due?: string;
	tag: string;
	estimate?: number;
	blocked?: boolean;
	comments?: number;
}

export const board: Card[] = [
	{ id: 'h1', title: 'Monorepo with pnpm workspaces', status: 'done', assignee: 'me', tag: 'Foundation' },
	{ id: 'h2', title: 'Policy package: labels, grants, taint', status: 'done', assignee: 'me', tag: 'Foundation' },
	{ id: 'h3', title: 'Postgres schema and RLS tests', status: 'done', assignee: 'me', tag: 'Foundation' },
	{ id: 'h4', title: 'Web shell with app switcher', status: 'review', assignee: 'me', tag: 'UI', comments: 2 },
	{ id: 'h5', title: 'Design tokens and motion primitives', status: 'doing', assignee: 'me', tag: 'UI', estimate: 240 },
	{ id: 'h6', title: 'PowerSync service on the new server', status: 'doing', assignee: 'me', tag: 'Foundation', due: '2026-11-22', estimate: 180 },
	{ id: 'h7', title: 'Migrate thraccer collections to tables', status: 'todo', assignee: 'me', tag: 'Fitness', due: '2026-11-29', estimate: 360 },
	{ id: 'h8', title: 'Split cashdoit into Svelte routes', status: 'todo', assignee: 'me', tag: 'Projects', estimate: 600 },
	{ id: 'h9', title: 'camt.053 parser with dedupe', status: 'todo', assignee: 'me', tag: 'Finance', estimate: 300 },
	{ id: 'h10', title: 'QR-bill scanner on iPhone', status: 'todo', assignee: 'me', tag: 'Finance', blocked: true },
	{ id: 'h11', title: 'Red-team test suite for the router', status: 'todo', assignee: 'me', tag: 'Agent', estimate: 240 },
	{ id: 'h12', title: 'Rent the Heroics server', status: 'done', assignee: 'me', tag: 'Infra' },
	{ id: 'h13', title: 'Pick hosting region (Zurich)', status: 'review', assignee: 'lea', tag: 'Infra', comments: 1 }
];

export const columns: { status: TaskStatus; name: string }[] = [
	{ status: 'todo', name: 'To do' },
	{ status: 'doing', name: 'Doing' },
	{ status: 'review', name: 'Review' },
	{ status: 'done', name: 'Done' }
];

export interface Block {
	day: number; // 0 = Monday
	start: number; // hours, 24h
	end: number;
	title: string;
	kind: 'deep' | 'meeting' | 'training' | 'admin' | 'personal';
	project?: string;
	note?: string;
}

export const week: Block[] = [
	{ day: 0, start: 8, end: 11, title: 'Policy router', kind: 'deep', project: 'Heroics suite' },
	{ day: 0, start: 14, end: 15, title: 'Alpine Dental standup', kind: 'meeting', project: 'Alpine Dental rollout' },
	{ day: 0, start: 18, end: 19.25, title: 'Upper A', kind: 'training' },
	{ day: 1, start: 9, end: 12, title: 'Data migration scripts', kind: 'deep', project: 'Alpine Dental rollout' },
	{ day: 1, start: 16, end: 17, title: 'Call movers', kind: 'personal', project: 'Move to Winterthur' },
	{ day: 2, start: 9, end: 10, title: 'Bills and inbox', kind: 'admin', note: 'Swisscom bill due next week' },
	{ day: 2, start: 10.5, end: 12.5, title: 'Design tokens', kind: 'deep', project: 'Heroics suite', note: 'Moved from 8:00 after short sleep' },
	{ day: 2, start: 14, end: 15.5, title: 'Client review', kind: 'meeting', project: 'Alpine Dental rollout' },
	{ day: 2, start: 18, end: 19.1, title: 'Lower A', kind: 'training' },
	{ day: 3, start: 8, end: 11.5, title: 'PowerSync setup', kind: 'deep', project: 'Heroics suite' },
	{ day: 3, start: 13, end: 14, title: 'Flat viewing', kind: 'personal', project: 'Move to Winterthur' },
	{ day: 4, start: 8, end: 10, title: 'camt parser', kind: 'deep', project: 'Heroics suite' },
	{ day: 4, start: 11, end: 12, title: 'Invoice Alpine Dental', kind: 'admin', project: 'Alpine Dental rollout' },
	{ day: 4, start: 18, end: 19.25, title: 'Upper B', kind: 'training' },
	{ day: 5, start: 10, end: 11.25, title: 'Lower B', kind: 'training' }
];

export const timeEntries = [
	{ date: '2026-11-17', task: 'Data migration scripts', minutes: 210, billable: true },
	{ date: '2026-11-14', task: 'Client review prep', minutes: 90, billable: true },
	{ date: '2026-11-13', task: 'Import validation', minutes: 240, billable: true },
	{ date: '2026-11-12', task: 'Standup', minutes: 30, billable: false },
	{ date: '2026-11-11', task: 'Archive mapping', minutes: 300, billable: true },
	{ date: '2026-11-07', task: 'Workflow design', minutes: 180, billable: true },
	{ date: '2026-11-06', task: 'Kickoff phase 2', minutes: 120, billable: true }
];

export const hourlyRateMinor = 14_000;
