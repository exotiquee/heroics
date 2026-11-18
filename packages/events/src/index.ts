import type { Label } from '@heroics/policy';

/**
 * The event catalog. Apps never read each other's tables; they emit these
 * through the Postgres outbox and subscribe to the ones they care about.
 * Each event declares the label of its payload, so subscribers inherit taint.
 */
export interface EventMap {
	// Fitness
	'workout.completed': { sessionId: string; durationMin: number; volumeKg: number };
	'pr.achieved': { exerciseId: string; exercise: string; e1rmKg: number };
	'deload.suggested': { reason: string; fromDate: string };
	'weight.trend_changed': { trendKg: number; weeklyChangeKg: number };
	'nutrition.target_missed': { nutrient: 'protein' | 'calories' | 'fiber'; days: number };
	'supplement.running_low': { itemId: string; daysLeft: number };
	// Finance
	'transaction.imported': { importId: string; count: number };
	'budget.threshold_crossed': { categoryId: string; percent: number };
	'bill.due_soon': { billId: string; dueDate: string; amountMinor: number; currency: string };
	'subscription.price_changed': { seriesId: string; oldMinor: number; newMinor: number };
	'document.expiring': { documentId: string; expiresOn: string };
	'tax_item.completed': { taxYear: number; itemId: string };
	// Projects
	'task.completed': { taskId: string; projectId: string };
	'task.overdue': { taskId: string; projectId: string; dueDate: string };
	'milestone.at_risk': { milestoneId: string; projectId: string; reason: string };
	'guest.joined': { projectId: string; memberId: string };
	'invoice.drafted': { projectId: string; invoiceId: string; amountMinor: number };
	'time.logged': { taskId: string; minutes: number };
}

export type EventName = keyof EventMap;

export const EVENT_LABELS: { [K in EventName]: Label } = {
	'workout.completed': 'personal',
	'pr.achieved': 'personal',
	'deload.suggested': 'personal',
	'weight.trend_changed': 'private',
	'nutrition.target_missed': 'personal',
	'supplement.running_low': 'private',
	'transaction.imported': 'personal',
	'budget.threshold_crossed': 'personal',
	'bill.due_soon': 'private',
	'subscription.price_changed': 'private',
	'document.expiring': 'private',
	'tax_item.completed': 'personal',
	'task.completed': 'personal',
	'task.overdue': 'personal',
	'milestone.at_risk': 'personal',
	'guest.joined': 'private',
	'invoice.drafted': 'private',
	'time.logged': 'personal'
};

export interface HeroicsEvent<K extends EventName = EventName> {
	id: string;
	name: K;
	householdId: string;
	occurredAt: string;
	label: Label;
	payload: EventMap[K];
}

export function createEvent<K extends EventName>(
	name: K,
	payload: EventMap[K],
	meta: { id: string; householdId: string; occurredAt: string }
): HeroicsEvent<K> {
	return { ...meta, name, label: EVENT_LABELS[name], payload };
}

/** Which app owns an event, from its prefix. */
export function eventApp(name: EventName): 'fitness' | 'finance' | 'projects' {
	const prefix = name.split('.')[0];
	if (['workout', 'pr', 'deload', 'weight', 'nutrition', 'supplement'].includes(prefix!)) return 'fitness';
	if (['transaction', 'budget', 'bill', 'subscription', 'document', 'tax_item'].includes(prefix!)) return 'finance';
	return 'projects';
}
