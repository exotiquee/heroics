import type { Label } from '@heroics/policy';

/** Migrations, applied in order. The SQL files are the source of truth. */
export const MIGRATIONS = ['0001_core.sql', '0002_fitness.sql', '0003_finance.sql', '0004_projects.sql'] as const;

export type Visibility = 'private' | 'household';
export type HouseholdRole = 'owner' | 'adult' | 'teen';
export type AiTier = 'off' | 'local' | 'cloud';

interface Owned {
	id: string;
	householdId: string;
	ownerId: string;
	visibility: Visibility;
	label: Label;
}

// ---------- fitness ----------
export interface Exercise {
	id: string;
	name: string;
	muscle: string;
	equipment: string | null;
}

export interface WorkoutSet {
	id: string;
	exerciseId: string;
	position: number;
	weightKg: number;
	reps: number;
	rir: number | null;
	isWarmup: boolean;
}

export interface Session extends Owned {
	routineId: string | null;
	startedAt: string;
	endedAt: string | null;
	readiness: number | null;
}

export interface BodyMetric extends Owned {
	measuredOn: string;
	weightKg: number | null;
}

// ---------- finance ----------
export type AccountKind = 'bank' | 'card' | 'cash' | 'pillar3a' | 'investment' | 'loan';

export interface Account extends Owned {
	name: string;
	kind: AccountKind;
	currency: string;
}

export interface Transaction extends Owned {
	accountId: string;
	bookedOn: string;
	/** Integer minor units (Rappen). Negative = money out. */
	amountMinor: number;
	currency: string;
	counterparty: string | null;
	categoryId: string | null;
	categoryConfidence: number | null;
	needsReview: boolean;
}

export type TaxItemStatus = 'missing' | 'partial' | 'complete' | 'not_applicable';

export interface TaxItem extends Omit<Owned, 'label'> {
	taxYear: number;
	section: string;
	title: string;
	status: TaxItemStatus;
}

// ---------- projects ----------
export type TaskStatus = 'todo' | 'doing' | 'review' | 'done';

export interface Project extends Owned {
	workspaceId: string;
	parentId: string | null;
	aiTier: AiTier;
	name: string;
	status: 'active' | 'finished' | 'archived';
	deadline: string | null;
}

export interface Task {
	id: string;
	projectId: string;
	milestoneId: string | null;
	title: string;
	status: TaskStatus;
	assigneeId: string | null;
	dueOn: string | null;
	estimateMin: number | null;
	position: number;
}
