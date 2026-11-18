import { describe, expect, it } from 'vitest';
import { createEvent, EVENT_LABELS, eventApp, type EventName } from './index.ts';

describe('events', () => {
	it('stamps the catalog label onto every event', () => {
		const e = createEvent(
			'bill.due_soon',
			{ billId: 'b1', dueDate: '2026-11-30', amountMinor: 18_500, currency: 'CHF' },
			{ id: 'e1', householdId: 'h1', occurredAt: '2026-11-18T08:00:00Z' }
		);
		expect(e.label).toBe('private');
	});
	it('assigns every event to exactly one app', () => {
		const names = Object.keys(EVENT_LABELS) as EventName[];
		const counts = { fitness: 0, finance: 0, projects: 0 };
		for (const n of names) counts[eventApp(n)]++;
		expect(counts).toEqual({ fitness: 6, finance: 6, projects: 6 });
	});
});
